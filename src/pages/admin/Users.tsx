import { useEffect, useState } from 'react';
import { Users, Package, Calendar, Ban, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
  is_suspended: boolean;
  suspended_reason: string | null;
  role: string;
  listings_count: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  useEffect(() => {
    loadUsers();
  }, [filterStatus]);

  async function loadUsers() {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus === 'active') {
        query = query.eq('is_suspended', false);
      } else if (filterStatus === 'suspended') {
        query = query.eq('is_suspended', true);
      }

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          return {
            ...profile,
            listings_count: count || 0
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspension(userId: string, currentStatus: boolean) {
    const reason = currentStatus
      ? null
      : prompt('الرجاء إدخال سبب التعليق:');

    if (!currentStatus && !reason) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: !currentStatus,
          suspended_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: currentStatus ? 'unsuspend_user' : 'suspend_user',
        p_target_type: 'user',
        p_target_id: userId,
        p_details: reason ? { reason } : null
      });

      loadUsers();
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      alert('حدث خطأ أثناء تحديث حالة المستخدم');
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة المستخدمين</h1>
          <p className="text-slate-300">عرض وإدارة جميع المستخدمين على المنصة</p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل ({users.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                نشط
              </button>
              <button
                onClick={() => setFilterStatus('suspended')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === 'suspended'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                معلق
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onToggleSuspension={() => toggleSuspension(user.id, user.is_suspended)}
            />
          ))}

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">لا يوجد مستخدمين</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onToggleSuspension }: {
  user: UserProfile;
  onToggleSuspension: () => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
          <Users className="w-8 h-8" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{user.full_name || 'بدون اسم'}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>{user.phone}</span>
                {user.email && (
                  <>
                    <span>•</span>
                    <span>{user.email}</span>
                  </>
                )}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              user.is_suspended
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {user.is_suspended ? 'معلق' : 'نشط'}
            </div>
          </div>

          {user.is_suspended && user.suspended_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">سبب التعليق:</p>
                <p className="text-sm text-red-700">{user.suspended_reason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-600">الإعلانات</p>
              </div>
              <p className="text-lg font-black text-blue-700">{user.listings_count}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-purple-600">تاريخ التسجيل</p>
              </div>
              <p className="text-sm font-bold text-purple-700">{formatDate(user.created_at)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onToggleSuspension}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                user.is_suspended
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {user.is_suspended ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  إعادة التفعيل
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  تعليق الحساب
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
