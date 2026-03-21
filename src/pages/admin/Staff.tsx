import { useState, useEffect } from 'react';
import { Users, Plus, CreditCard as Edit2, Trash2, Shield, CheckCircle, XCircle, Search, Filter, Lock, Eye, PenLine, Trash, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface Permission {
  id?: string;
  section: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير عام',
  category_manager: 'مدير أقسام',
  listings_moderator: 'مشرف إعلانات',
  reports_moderator: 'مشرف بلاغات',
  support_staff: 'موظف دعم',
  custom: 'صلاحيات مخصصة',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  category_manager: 'bg-blue-100 text-blue-800',
  listings_moderator: 'bg-green-100 text-green-800',
  reports_moderator: 'bg-orange-100 text-orange-800',
  support_staff: 'bg-gray-100 text-gray-800',
  custom: 'bg-indigo-100 text-indigo-800',
};

const SECTIONS = [
  { id: 'dashboard', name: 'لوحة التحكم الرئيسية', icon: '📊' },
  { id: 'categories', name: 'إدارة الفئات', icon: '📂' },
  { id: 'listings', name: 'إدارة الإعلانات', icon: '📝' },
  { id: 'users', name: 'إدارة المستخدمين', icon: '👥' },
  { id: 'reports', name: 'إدارة البلاغات', icon: '🚨' },
  { id: 'promotions', name: 'إدارة الترويج', icon: '🎯' },
  { id: 'analytics', name: 'التحليلات والإحصائيات', icon: '📈' },
  { id: 'staff', name: 'إدارة الموظفين', icon: '👔' },
  { id: 'settings', name: 'الإعدادات العامة', icon: '⚙️' },
  { id: 'commission', name: 'إدارة العمولات', icon: '💰' },
  { id: 'cities', name: 'إدارة المدن', icon: '🏙️' },
  { id: 'activity', name: 'سجل النشاطات', icon: '📋' },
  { id: 'live_activity', name: 'النشاط المباشر', icon: '⚡' },
];

export default function AdminStaff() {
  const { staff: currentStaff, hasPermission, logActivity } = useAdminAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<Permission[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'custom',
    department: '',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setStaff(data);
    }
    setLoading(false);
  };

  const initializePermissions = (role: string) => {
    if (role === 'super_admin') {
      return SECTIONS.map(section => ({
        section: section.id,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
      }));
    }

    return SECTIONS.map(section => ({
      section: section.id,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    }));
  };

  const handleRoleChange = (newRole: string) => {
    setFormData({ ...formData, role: newRole });
    if (!editingStaff) {
      setCurrentPermissions(initializePermissions(newRole));
    }
  };

  const handleAddStaff = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.role !== 'super_admin') {
      const hasAnyPermission = currentPermissions.some(p => p.can_view);
      if (!hasAnyPermission) {
        alert('يجب تحديد صلاحية واحدة على الأقل للموظف');
        return;
      }
    }

    const { data, error } = await supabase
      .from('admin_staff')
      .insert({
        email: formData.email.toLowerCase(),
        password_hash: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        department: formData.department || null,
        created_by: currentStaff?.id,
      })
      .select()
      .single();

    if (error) {
      alert('فشل إضافة الموظف: ' + error.message);
      return;
    }

    if (formData.role !== 'super_admin') {
      const permissionsToInsert = currentPermissions
        .filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete)
        .map(p => ({
          staff_id: data.id,
          section: p.section,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        }));

      if (permissionsToInsert.length > 0) {
        const { error: permError } = await supabase
          .from('staff_permissions')
          .insert(permissionsToInsert);

        if (permError) {
          console.error('Failed to add permissions:', permError);
        }
      }
    }

    await logActivity('create_staff', 'admin_staff', data.id, { email: formData.email, role: formData.role });

    setShowAddModal(false);
    setShowPermissionsModal(false);
    setFormData({ email: '', password: '', full_name: '', role: 'custom', department: '' });
    setCurrentPermissions([]);
    loadStaff();
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    const updateData: any = {
      full_name: formData.full_name,
      role: formData.role,
      department: formData.department || null,
    };

    if (formData.password) {
      updateData.password_hash = formData.password;
    }

    const { error } = await supabase
      .from('admin_staff')
      .update(updateData)
      .eq('id', editingStaff.id);

    if (error) {
      alert('فشل تحديث الموظف: ' + error.message);
      return;
    }

    await logActivity('update_staff', 'admin_staff', editingStaff.id, { changes: updateData });

    setEditingStaff(null);
    setFormData({ email: '', password: '', full_name: '', role: 'custom', department: '' });
    loadStaff();
  };

  const handleToggleActive = async (staffMember: StaffMember) => {
    const { error } = await supabase
      .from('admin_staff')
      .update({ is_active: !staffMember.is_active })
      .eq('id', staffMember.id);

    if (error) {
      alert('فشل تحديث الحالة');
      return;
    }

    await logActivity(
      staffMember.is_active ? 'deactivate_staff' : 'activate_staff',
      'admin_staff',
      staffMember.id
    );

    loadStaff();
  };

  const handleDeleteStaff = async (staffMember: StaffMember) => {
    if (!confirm(`هل أنت متأكد من حذف ${staffMember.full_name}؟`)) return;

    const { error } = await supabase
      .from('admin_staff')
      .delete()
      .eq('id', staffMember.id);

    if (error) {
      alert('فشل حذف الموظف');
      return;
    }

    await logActivity('delete_staff', 'admin_staff', staffMember.id, { email: staffMember.email });

    loadStaff();
  };

  const openEditModal = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      email: staffMember.email,
      password: '',
      full_name: staffMember.full_name,
      role: staffMember.role,
      department: staffMember.department || '',
    });
  };

  const openPermissionsModal = async (staffMember: StaffMember) => {
    setEditingStaff(staffMember);

    if (staffMember.role === 'super_admin') {
      alert('المدير العام لديه جميع الصلاحيات تلقائياً');
      return;
    }

    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('staff_id', staffMember.id);

    if (error) {
      console.error('Failed to load permissions:', error);
      return;
    }

    const permissions = SECTIONS.map(section => {
      const existing = data?.find(p => p.section === section.id);
      return existing || {
        section: section.id,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      };
    });

    setCurrentPermissions(permissions);
    setShowPermissionsModal(true);
  };

  const savePermissions = async () => {
    if (!editingStaff) return;

    await supabase
      .from('staff_permissions')
      .delete()
      .eq('staff_id', editingStaff.id);

    const permissionsToInsert = currentPermissions
      .filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete)
      .map(p => ({
        staff_id: editingStaff.id,
        section: p.section,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }));

    if (permissionsToInsert.length > 0) {
      const { error } = await supabase
        .from('staff_permissions')
        .insert(permissionsToInsert);

      if (error) {
        alert('فشل حفظ الصلاحيات: ' + error.message);
        return;
      }
    }

    await logActivity('update_permissions', 'admin_staff', editingStaff.id, { permissions: permissionsToInsert });

    setShowPermissionsModal(false);
    setEditingStaff(null);
    setCurrentPermissions([]);
  };

  const updatePermission = (sectionId: string, field: keyof Permission, value: boolean) => {
    setCurrentPermissions(prev =>
      prev.map(p => {
        if (p.section === sectionId) {
          const updated = { ...p, [field]: value };
          if (field !== 'can_view' && value && !updated.can_view) {
            updated.can_view = true;
          }
          if (field === 'can_view' && !value) {
            updated.can_create = false;
            updated.can_edit = false;
            updated.can_delete = false;
          }
          return updated;
        }
        return p;
      })
    );
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const canManage = hasPermission('staff', 'create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">إدارة الموظفين</h1>
              <p className="text-slate-400 mt-1">إدارة موظفي لوحة التحكم وصلاحياتهم</p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => {
                const initialRole = 'custom';
                setFormData({ email: '', password: '', full_name: '', role: initialRole, department: '' });
                setCurrentPermissions(initializePermissions(initialRole));
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة موظف</span>
            </button>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="البحث عن موظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="relative">
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="all">جميع الأدوار</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center text-slate-400">لا يوجد موظفين</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">الاسم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">القسم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">آخر دخول</th>
                    {canManage && <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">الإجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{member.full_name[0]}</span>
                          </div>
                          <span className="text-white font-medium">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ROLE_COLORS[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{member.department || '-'}</td>
                      <td className="px-6 py-4">
                        {member.is_active ? (
                          <span className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">نشط</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">معطل</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {member.last_login ? new Date(member.last_login).toLocaleDateString('ar-EG') : 'لم يدخل بعد'}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openPermissionsModal(member)}
                              className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                              title="الصلاحيات"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(member)}
                              className={`p-2 rounded-lg transition-colors ${
                                member.is_active
                                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              }`}
                              title={member.is_active ? 'تعطيل' : 'تفعيل'}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl border border-white/20 p-8 w-full max-w-6xl my-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white">إضافة موظف جديد</h3>
                <p className="text-slate-400 mt-2">أدخل بيانات الموظف وحدد الصلاحيات المتاحة له</p>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-400" />
                    معلومات الموظف
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="admin@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">كلمة المرور *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">الاسم الكامل *</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="محمد أحمد"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">الدور الوظيفي *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-2">
                        {formData.role === 'super_admin'
                          ? '⚡ المدير العام يمتلك جميع الصلاحيات تلقائياً'
                          : '👉 حدد الصلاحيات من القائمة المجاورة'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">القسم (اختياري)</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="مثال: قسم المبيعات"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      <Lock className="w-6 h-6 text-blue-400" />
                      الصلاحيات والأقسام المتاحة
                    </h4>
                    {formData.role !== 'super_admin' && (
                      <div className="text-sm text-slate-400">
                        {currentPermissions.filter(p => p.can_view).length} / {SECTIONS.length} قسم مفعّل
                      </div>
                    )}
                  </div>

                  {formData.role === 'super_admin' ? (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-8 text-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h5 className="text-2xl font-bold text-white mb-2">صلاحيات كاملة</h5>
                      <p className="text-green-300">المدير العام لديه صلاحيات كاملة على جميع الأقسام تلقائياً</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                        <p className="text-blue-300 text-sm flex items-start gap-2">
                          <span className="text-lg">💡</span>
                          <span><strong>تلميح:</strong> عند تفعيل أي صلاحية (إنشاء، تعديل، حذف) سيتم تفعيل صلاحية المشاهدة تلقائياً. الموظف سيرى فقط الأقسام التي مُنح صلاحية لها.</span>
                        </p>
                      </div>

                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {SECTIONS.map((section) => {
                          const permission = currentPermissions.find(p => p.section === section.id);
                          if (!permission) return null;

                          return (
                            <div
                              key={section.id}
                              className={`bg-white/5 border rounded-xl p-4 transition-all hover:bg-white/10 ${
                                permission.can_view ? 'border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/10' : 'border-white/10'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="text-3xl">{section.icon}</div>
                                <div className="flex-1">
                                  <h4 className="text-white font-bold text-base mb-3">{section.name}</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer group bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-all">
                                      <input
                                        type="checkbox"
                                        checked={permission.can_view}
                                        onChange={(e) => updatePermission(section.id, 'can_view', e.target.checked)}
                                        className="w-4 h-4 rounded border-2 border-white/20 bg-white/10 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                      />
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">مشاهدة</span>
                                      </div>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-all">
                                      <input
                                        type="checkbox"
                                        checked={permission.can_create}
                                        onChange={(e) => updatePermission(section.id, 'can_create', e.target.checked)}
                                        className="w-4 h-4 rounded border-2 border-white/20 bg-white/10 checked:bg-green-500 checked:border-green-500 focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                                      />
                                      <div className="flex items-center gap-1">
                                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-green-400 transition-colors" />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">إنشاء</span>
                                      </div>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-all">
                                      <input
                                        type="checkbox"
                                        checked={permission.can_edit}
                                        onChange={(e) => updatePermission(section.id, 'can_edit', e.target.checked)}
                                        className="w-4 h-4 rounded border-2 border-white/20 bg-white/10 checked:bg-orange-500 checked:border-orange-500 focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                                      />
                                      <div className="flex items-center gap-1">
                                        <PenLine className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">تعديل</span>
                                      </div>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-all">
                                      <input
                                        type="checkbox"
                                        checked={permission.can_delete}
                                        onChange={(e) => updatePermission(section.id, 'can_delete', e.target.checked)}
                                        className="w-4 h-4 rounded border-2 border-white/20 bg-white/10 checked:bg-red-500 checked:border-red-500 focus:ring-2 focus:ring-red-500/50 cursor-pointer"
                                      />
                                      <div className="flex items-center gap-1">
                                        <Trash className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">حذف</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleAddStaff}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-500/50"
              >
                <Check className="w-5 h-5" />
                <span>إضافة الموظف</span>
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ email: '', password: '', full_name: '', role: 'custom', department: '' });
                  setCurrentPermissions([]);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStaff && !showPermissionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-6">تعديل موظف</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  كلمة المرور (اتركها فارغة للإبقاء على القديمة)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">الدور الوظيفي</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">القسم (اختياري)</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateStaff}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                حفظ التعديلات
              </button>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setFormData({ email: '', password: '', full_name: '', role: 'custom', department: '' });
                }}
                className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-4xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">تحديد الصلاحيات</h3>
                <p className="text-slate-400 mt-1">اختر الأقسام والصلاحيات المتاحة للموظف</p>
              </div>
              <Lock className="w-8 h-8 text-blue-400" />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm">
                💡 <strong>ملاحظة:</strong> عند تفعيل أي صلاحية (إنشاء، تعديل، حذف) سيتم تفعيل صلاحية المشاهدة تلقائياً
              </p>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {SECTIONS.map((section) => {
                const permission = currentPermissions.find(p => p.section === section.id);
                if (!permission) return null;

                return (
                  <div
                    key={section.id}
                    className={`bg-white/5 border rounded-xl p-4 transition-all ${
                      permission.can_view ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{section.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-3">{section.name}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={permission.can_view}
                              onChange={(e) => updatePermission(section.id, 'can_view', e.target.checked)}
                              className="w-5 h-5 rounded border-2 border-white/20 bg-white/10 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                              <span className="text-slate-300 group-hover:text-white transition-colors">مشاهدة</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={permission.can_create}
                              onChange={(e) => updatePermission(section.id, 'can_create', e.target.checked)}
                              className="w-5 h-5 rounded border-2 border-white/20 bg-white/10 checked:bg-green-500 checked:border-green-500 focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <Plus className="w-4 h-4 text-slate-400 group-hover:text-green-400 transition-colors" />
                              <span className="text-slate-300 group-hover:text-white transition-colors">إنشاء</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={permission.can_edit}
                              onChange={(e) => updatePermission(section.id, 'can_edit', e.target.checked)}
                              className="w-5 h-5 rounded border-2 border-white/20 bg-white/10 checked:bg-orange-500 checked:border-orange-500 focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <PenLine className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
                              <span className="text-slate-300 group-hover:text-white transition-colors">تعديل</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={permission.can_delete}
                              onChange={(e) => updatePermission(section.id, 'can_delete', e.target.checked)}
                              className="w-5 h-5 rounded border-2 border-white/20 bg-white/10 checked:bg-red-500 checked:border-red-500 focus:ring-2 focus:ring-red-500/50 cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <Trash className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                              <span className="text-slate-300 group-hover:text-white transition-colors">حذف</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={editingStaff && !formData.email ? savePermissions : handleAddStaff}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>{editingStaff && !formData.email ? 'حفظ الصلاحيات' : 'إضافة الموظف'}</span>
              </button>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setEditingStaff(null);
                  setCurrentPermissions([]);
                  setShowAddModal(false);
                  setFormData({ email: '', password: '', full_name: '', role: 'custom', department: '' });
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
