import { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, Activity, Star, AlertTriangle, CheckCircle, User, Calendar, BarChart3, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login: string | null;
}

interface PerformanceSummary {
  total_actions: number;
  listings_reviewed: number;
  reports_handled: number;
  users_managed: number;
  categories_modified: number;
  avg_response_time: number;
  active_days: number;
  rating: number;
  performance_category: string;
}

interface PerformanceAlert {
  id: string;
  staff_id: string;
  alert_type: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

const PERFORMANCE_LABELS: Record<string, { text: string; color: string }> = {
  excellent: { text: 'ممتاز', color: 'bg-green-100 text-green-800' },
  good: { text: 'جيد', color: 'bg-blue-100 text-blue-800' },
  average: { text: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  poor: { text: 'ضعيف', color: 'bg-red-100 text-red-800' },
};

const ALERT_ICONS: Record<string, any> = {
  warning: AlertTriangle,
  info: Activity,
  success: CheckCircle,
};

export default function AdminPerformance() {
  const { staff: currentStaff, hasPermission } = useAdminAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [performances, setPerformances] = useState<Record<string, PerformanceSummary>>({});
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, [periodDays]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadStaff(), loadAlerts()]);
    setLoading(false);
  };

  const loadStaff = async () => {
    const { data: staffData } = await supabase
      .from('admin_staff')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (staffData) {
      setStaff(staffData);

      const performancePromises = staffData.map(async (member) => {
        const { data } = await supabase.rpc('get_staff_performance_summary', {
          p_staff_id: member.id,
          p_days: periodDays
        });
        return { id: member.id, data: data?.[0] };
      });

      const results = await Promise.all(performancePromises);
      const performanceMap: Record<string, PerformanceSummary> = {};
      results.forEach(({ id, data }) => {
        if (data) performanceMap[id] = data;
      });
      setPerformances(performanceMap);
    }
  };

  const loadAlerts = async () => {
    const { data } = await supabase
      .from('staff_performance_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setAlerts(data);
  };

  const generateAlerts = async () => {
    await supabase.rpc('generate_performance_alerts');
    await loadAlerts();
  };

  const markAlertAsRead = async (alertId: string) => {
    await supabase
      .from('staff_performance_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    await loadAlerts();
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return 'لا يوجد';
    if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
  };

  const filteredStaff = staff.filter(member => {
    if (filterCategory === 'all') return true;
    const perf = performances[member.id];
    return perf?.performance_category === filterCategory;
  });

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    const perfA = performances[a.id];
    const perfB = performances[b.id];
    return (perfB?.rating || 0) - (perfA?.rating || 0);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تقييم أداء الموظفين</h1>
          <p className="text-gray-600 mt-1">قياس وتحليل أداء فريق العمل</p>
        </div>
        <button
          onClick={generateAlerts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Activity size={20} />
          توليد التنبيهات
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-500" />
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={30}>آخر 30 يوم</option>
            <option value={90}>آخر 90 يوم</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="excellent">ممتاز</option>
            <option value="good">جيد</option>
            <option value="average">متوسط</option>
            <option value="poor">ضعيف</option>
          </select>
        </div>
      </div>

      {alerts.filter(a => !a.is_read).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            تنبيهات الأداء ({alerts.filter(a => !a.is_read).length})
          </h2>
          <div className="space-y-3">
            {alerts.filter(a => !a.is_read).slice(0, 5).map((alert) => {
              const Icon = ALERT_ICONS[alert.severity];
              const staffMember = staff.find(s => s.id === alert.staff_id);

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-r-4 ${
                    alert.severity === 'warning' ? 'bg-orange-50 border-orange-500' :
                    alert.severity === 'success' ? 'bg-green-50 border-green-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon size={20} className={
                        alert.severity === 'warning' ? 'text-orange-500' :
                        alert.severity === 'success' ? 'text-green-500' :
                        'text-blue-500'
                      } />
                      <div>
                        <p className="text-gray-900 font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {staffMember?.email} - {new Date(alert.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => markAlertAsRead(alert.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الترتيب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التقييم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي العمليات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإعلانات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البلاغات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيام النشطة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">متوسط الاستجابة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التصنيف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStaff.map((member, index) => {
                const perf = performances[member.id];
                if (!perf) return null;

                const performanceLabel = PERFORMANCE_LABELS[perf.performance_category];

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getRatingStars(perf.rating)}
                        <span className="mr-2 text-sm font-medium text-gray-700">
                          {perf.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{perf.total_actions}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {perf.listings_reviewed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {perf.reports_handled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {perf.active_days} / {periodDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatTime(perf.avg_response_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${performanceLabel.color}`}>
                        {performanceLabel.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedStaff(member.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        التفاصيل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedStaff.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">لا توجد بيانات أداء متاحة للفترة المحددة</p>
        </div>
      )}

      {selectedStaff && (() => {
        const member = staff.find(s => s.id === selectedStaff);
        const perf = performances[selectedStaff];
        if (!member || !perf) return null;

        const performanceLabel = PERFORMANCE_LABELS[perf.performance_category];

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{member.full_name}</h2>
                    <p className="text-gray-600">{member.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="text-blue-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">التقييم العام</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRatingStars(perf.rating)}
                      <span className="text-2xl font-bold text-gray-900">{perf.rating.toFixed(1)}</span>
                    </div>
                    <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${performanceLabel.color}`}>
                      {performanceLabel.text}
                    </span>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-green-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">إجمالي العمليات</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{perf.total_actions}</p>
                    <p className="text-xs text-gray-600 mt-1">خلال {periodDays} يوم</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-yellow-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">متوسط الاستجابة</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatTime(perf.avg_response_time)}</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-orange-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">الأيام النشطة</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{perf.active_days}</p>
                    <p className="text-xs text-gray-600 mt-1">من أصل {periodDays} يوم</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الأداء</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">الإعلانات المراجعة</span>
                      <span className="text-lg font-bold text-gray-900">{perf.listings_reviewed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">البلاغات المعالجة</span>
                      <span className="text-lg font-bold text-gray-900">{perf.reports_handled}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">المستخدمين المُدارين</span>
                      <span className="text-lg font-bold text-gray-900">{perf.users_managed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">الفئات المُعدلة</span>
                      <span className="text-lg font-bold text-gray-900">{perf.categories_modified}</span>
                    </div>
                  </div>
                </div>

                {member.last_login && (
                  <div className="text-sm text-gray-600">
                    آخر تسجيل دخول: {new Date(member.last_login).toLocaleString('ar-SA')}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
