import { useEffect, useState } from 'react';
import { Activity, Package, UserPlus, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActivityItem {
  id: string;
  type: 'listing' | 'user' | 'whatsapp' | 'report';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminLiveActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadActivities();

    const interval = setInterval(() => {
      if (autoRefresh) {
        loadActivities();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function loadActivities() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      const [
        newListings,
        newUsers,
        recentReports
      ] = await Promise.all([
        supabase
          .from('listings')
          .select('id, title, created_at, user_id')
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('reports')
          .select('id, reason, created_at, listing_id')
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      const allActivities: ActivityItem[] = [];

      newListings.data?.forEach((listing: any) => {
        allActivities.push({
          id: `listing-${listing.id}`,
          type: 'listing',
          title: 'إعلان جديد',
          description: `إعلان جديد: ${listing.title}`,
          timestamp: listing.created_at,
          icon: <Package className="w-5 h-5" />,
          color: 'bg-green-500'
        });
      });

      newUsers.data?.forEach((user: any) => {
        allActivities.push({
          id: `user-${user.id}`,
          type: 'user',
          title: 'مستخدم جديد',
          description: `انضم ${user.full_name} إلى المنصة`,
          timestamp: user.created_at,
          icon: <UserPlus className="w-5 h-5" />,
          color: 'bg-blue-500'
        });
      });

      recentReports.data?.forEach((report: any) => {
        allActivities.push({
          id: `report-${report.id}`,
          type: 'report',
          title: 'بلاغ جديد',
          description: `بلاغ جديد - ${report.reason}`,
          timestamp: report.created_at,
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'bg-red-500'
        });
      });

      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-white/10 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">النشاط المباشر</h1>
            <p className="text-slate-300">مراقبة نشاط المنصة في الوقت الفعلي (آخر ساعة)</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadActivities}
              className="px-4 py-2 bg-white rounded-xl text-gray-900 font-medium hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <label className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">تحديث تلقائي</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="إعلانات جديدة"
            count={activities.filter(a => a.type === 'listing').length}
            icon={<Package className="w-5 h-5" />}
            color="bg-green-500"
          />
          <StatCard
            title="مستخدمون جدد"
            count={activities.filter(a => a.type === 'user').length}
            icon={<UserPlus className="w-5 h-5" />}
            color="bg-blue-500"
          />
          <StatCard
            title="بلاغات"
            count={activities.filter(a => a.type === 'report').length}
            icon={<AlertCircle className="w-5 h-5" />}
            color="bg-red-500"
          />
          <StatCard
            title="إجمالي النشاط"
            count={activities.length}
            icon={<Activity className="w-5 h-5" />}
            color="bg-gray-700"
          />
        </div>

        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {activities.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">لا توجد أنشطة حديثة</p>
              <p className="text-sm text-gray-400 mt-2">سيتم عرض النشاط الجديد هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, icon, color }: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-600">{title}</p>
          <p className="text-2xl font-black text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

    const diffHours = Math.floor(diffMins / 60);
    return `منذ ${diffHours} ساعة`;
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${activity.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
          {activity.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{activity.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-2">{getTimeAgo(activity.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}
