import { useEffect, useState } from 'react';
import { TrendingUp, Users, Package, Eye, MessageCircle, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GrowthData {
  period: string;
  users: number;
  listings: number;
  views: number;
  whatsapp_clicks: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    daily_users: 0,
    weekly_users: 0,
    monthly_users: 0,
    daily_listings: 0,
    weekly_listings: 0,
    monthly_listings: 0,
    total_views: 0,
    total_whatsapp: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [dailyUsers, weeklyUsers, monthlyUsers, dailyListings, weeklyListings, monthlyListings, viewsData, whatsappData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('listings').select('views_count'),
        supabase.from('listings').select('whatsapp_clicks')
      ]);

      const totalViews = viewsData.data?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0;
      const totalWhatsapp = whatsappData.data?.reduce((sum, item) => sum + (item.whatsapp_clicks || 0), 0) || 0;

      setStats({
        daily_users: dailyUsers.count || 0,
        weekly_users: weeklyUsers.count || 0,
        monthly_users: monthlyUsers.count || 0,
        daily_listings: dailyListings.count || 0,
        weekly_listings: weeklyListings.count || 0,
        monthly_listings: monthlyListings.count || 0,
        total_views: totalViews,
        total_whatsapp: totalWhatsapp
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-white/10 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white/10 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">التحليلات والإحصائيات</h1>
          <p className="text-slate-300">مراقبة نمو وأداء المنصة</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">نمو المستخدمين</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="اليوم"
              value={stats.daily_users}
              icon={<Users className="w-5 h-5" />}
              color="from-blue-500 to-blue-600"
            />
            <MetricCard
              title="هذا الأسبوع"
              value={stats.weekly_users}
              icon={<Users className="w-5 h-5" />}
              color="from-green-500 to-emerald-600"
            />
            <MetricCard
              title="هذا الشهر"
              value={stats.monthly_users}
              icon={<Users className="w-5 h-5" />}
              color="from-purple-500 to-pink-600"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">نمو الإعلانات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="اليوم"
              value={stats.daily_listings}
              icon={<Package className="w-5 h-5" />}
              color="from-amber-500 to-orange-600"
            />
            <MetricCard
              title="هذا الأسبوع"
              value={stats.weekly_listings}
              icon={<Package className="w-5 h-5" />}
              color="from-teal-500 to-cyan-600"
            />
            <MetricCard
              title="هذا الشهر"
              value={stats.monthly_listings}
              icon={<Package className="w-5 h-5" />}
              color="from-rose-500 to-red-600"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">إحصائيات التفاعل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="إجمالي المشاهدات"
              value={stats.total_views}
              icon={<Eye className="w-5 h-5" />}
              color="from-indigo-500 to-blue-600"
              large
            />
            <MetricCard
              title="إجمالي طلبات التواصل"
              value={stats.total_whatsapp}
              icon={<MessageCircle className="w-5 h-5" />}
              color="from-green-500 to-emerald-600"
              large
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, large }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  large?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className={`font-black text-gray-900 ${large ? 'text-4xl' : 'text-3xl'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
