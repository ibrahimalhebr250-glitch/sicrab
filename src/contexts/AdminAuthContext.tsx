import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminStaff {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'category_manager' | 'listings_moderator' | 'reports_moderator' | 'support_staff';
  department: string | null;
  is_active: boolean;
  last_login: string | null;
}

interface Permission {
  section: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface AdminAuthContextType {
  staff: AdminStaff | null;
  permissions: Permission[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (section: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
  logActivity: (action: string, resourceType: string, resourceId?: string, details?: any) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function getInitialStaff(): AdminStaff | null {
  try {
    const sessionData = localStorage.getItem('admin_session');
    if (!sessionData) return null;
    const { expiry, cachedStaff } = JSON.parse(sessionData);
    if (Date.now() >= expiry || !cachedStaff) return null;
    return cachedStaff as AdminStaff;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<AdminStaff | null>(getInitialStaff);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem('admin_session');
      if (!sessionData) {
        setLoading(false);
        return;
      }

      const { staffId, expiry, cachedStaff } = JSON.parse(sessionData);

      if (Date.now() >= expiry) {
        localStorage.removeItem('admin_session');
        setLoading(false);
        return;
      }

      if (cachedStaff) {
        setStaff(cachedStaff);
        await loadPermissions(cachedStaff.id, cachedStaff.role);
        setLoading(false);
      }

      const { data: staffData, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('id', staffId)
        .eq('is_active', true)
        .maybeSingle();

      if (staffData && !error) {
        setStaff(staffData);
        await loadPermissions(staffData.id, staffData.role);
        const updated = JSON.parse(localStorage.getItem('admin_session') || '{}');
        localStorage.setItem('admin_session', JSON.stringify({ ...updated, cachedStaff: staffData }));
      } else if (!error && staffData === null) {
        localStorage.removeItem('admin_session');
        setStaff(null);
        setPermissions([]);
      }

      if (!cachedStaff) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setLoading(false);
    }
  };

  const loadPermissions = async (staffId: string, role: string) => {
    // المدير العام لديه جميع الصلاحيات تلقائياً
    if (role === 'super_admin') {
      setPermissions([]);
      return;
    }

    // تحميل الصلاحيات المخصصة للموظف
    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('staff_id', staffId);

    if (data && !error) {
      setPermissions(data);
    } else {
      setPermissions([]);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: staffData, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !staffData) {
        return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      if (password !== staffData.password_hash) {
        return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      await supabase
        .from('admin_staff')
        .update({ last_login: new Date().toISOString() })
        .eq('id', staffData.id);

      const sessionData = {
        staffId: staffData.id,
        expiry: Date.now() + (24 * 60 * 60 * 1000),
        cachedStaff: staffData,
      };
      localStorage.setItem('admin_session', JSON.stringify(sessionData));

      setStaff(staffData);
      await loadPermissions(staffData.id, staffData.role);

      await logActivity('login', 'admin_session', staffData.id, { email });

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const signOut = async () => {
    if (staff) {
      await logActivity('logout', 'admin_session', staff.id);
    }
    localStorage.removeItem('admin_session');
    setStaff(null);
    setPermissions([]);
  };

  const hasPermission = (section: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    // المدير العام لديه جميع الصلاحيات
    if (staff?.role === 'super_admin') return true;

    // البحث عن صلاحية القسم
    const permission = permissions.find(p => p.section === section);
    if (!permission) return false;

    // التحقق من الصلاحية المطلوبة
    switch (action) {
      case 'view':
        return permission.can_view;
      case 'create':
        return permission.can_create && permission.can_view;
      case 'edit':
        return permission.can_edit && permission.can_view;
      case 'delete':
        return permission.can_delete && permission.can_view;
      default:
        return false;
    }
  };

  const logActivity = async (action: string, resourceType: string, resourceId?: string, details?: any) => {
    if (!staff) return;

    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          staff_id: staff.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details || {},
          ip_address: null
        });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ staff, permissions, loading, signIn, signOut, hasPermission, logActivity }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
