import { useState, useEffect } from 'react';
import { FileText, Search, Filter, User, Calendar, Activity as ActivityIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActivityLog {
  id: string;
  staff_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
  staff?: {
    full_name: string;
    email: string;
    role: string;
  };
}

const ACTION_LABELS: Record<string, string> = {
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
  create_staff: 'إضافة موظف',
  update_staff: 'تعديل موظف',
  delete_staff: 'حذف موظف',
  activate_staff: 'تفعيل موظف',
  deactivate_staff: 'تعطيل موظف',
  create_category: 'إضافة قسم',
  update_category: 'تعديل قسم',
  delete_category: 'حذف قسم',
  create_listing: 'إضافة إعلان',
  update_listing: 'تعديل إعلان',
  delete_listing: 'حذف إعلان',
  approve_listing: 'الموافقة على إعلان',
  reject_listing: 'رفض إعلان',
  suspend_user: 'تعليق مستخدم',
  unsuspend_user: 'إلغاء تعليق مستخدم',
  resolve_report: 'حل بلاغ',
  create_promotion: 'إنشاء ترويج',
  update_settings: 'تحديث الإعدادات',
};

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  create: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-red-100 text-red-800',
  suspend: 'bg-orange-100 text-orange-800',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [page, setPage] = useState(1);
  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    const from = (page - 1) * LOGS_PER_PAGE;
    const to = from + LOGS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select(`
        *,
        staff:admin_staff(full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data && !error) {
      setLogs(data);
    }
    setLoading(false);
  };

  const getActionColor = (action: string): string => {
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
      if (action.includes(key)) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.staff?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">سجل النشاطات</h1>
              <p className="text-slate-400 mt-1">متابعة جميع العمليات التي يقوم بها الموظفون</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="البحث في السجل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="relative">
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="all">جميع العمليات</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">لا يوجد نشاطات</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ActivityIcon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getActionColor(log.action)}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          <span className="text-slate-400 text-sm">{log.resource_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(log.created_at).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-white font-medium">{log.staff?.full_name}</span>
                        <span className="text-slate-400 text-sm">({log.staff?.email})</span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="bg-white/5 rounded-lg p-3 mt-3">
                          <p className="text-slate-400 text-xs font-bold mb-2">التفاصيل:</p>
                          <div className="text-slate-300 text-sm space-y-1">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-slate-400">{key}:</span>
                                <span className="font-mono text-xs">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredLogs.length > 0 && (
            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-slate-300">صفحة {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={filteredLogs.length < LOGS_PER_PAGE}
                className="px-6 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
