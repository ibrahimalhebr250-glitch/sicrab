import { useEffect, useState } from 'react';
import { Users, Package, Eye, MessageCircle, TrendingUp, AlertCircle, Star, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  todayListings: number;
  totalWhatsappClicks: number;
  pendingReports: number;
  activePromotions: number;
  topCategories: { name: string; count: number }[];
  topCities: { name: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [
        usersResult,
        listingsResult,
        todayListingsResult,
        whatsappResult,
        reportsResult,
        promotionsResult,
        categoriesResult,
        citiesResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('listings').select('whatsapp_clicks'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('listings').select('category_id, categories!listings_category_id_fkey(name_ar)'),
        supabase.from('listings').select('city_id, cities!listings_city_id_fkey(name_ar)')
      ]);

      const totalWhatsapp = whatsappResult.data?.reduce((sum, record) => sum + (record.whatsapp_clicks || 0), 0) || 0;

      const categoryCounts = categoriesResult.data?.reduce((acc: any, item: any) => {
        const name = item.categories?.name_ar || 'غير محدد';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const cityCounts = citiesResult.data?.reduce((acc: any, item: any) => {
        const name = item.cities?.name_ar || 'غير محدد';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryCounts || {})
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topCities = Object.entries(cityCounts || {})
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalUsers: usersResult.count || 0,
        totalListings: listingsResult.count || 0,
        todayListings: todayListingsResult.count || 0,
        totalWhatsappClicks: totalWhatsapp,
        pendingReports: reportsResult.count || 0,
        activePromotions: promotionsResult.count || 0,
        topCategories,
        topCities
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
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
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">لوحة التحكم الرئيسية</h1>
          <p className="text-slate-300">نظرة عامة على المنصة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard
            title="عدد المستخدمين"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="from-blue-500 to-blue-600"
          />

          <StatCard
            title="عدد الإعلانات"
            value={stats.totalListings}
            icon={<Package className="w-6 h-6" />}
            color="from-green-500 to-emerald-600"
          />

          <StatCard
            title="إعلانات اليوم"
            value={stats.todayListings}
            icon={<Calendar className="w-6 h-6" />}
            color="from-orange-500 to-red-600"
          />

          <StatCard
            title="طلبات واتساب"
            value={stats.totalWhatsappClicks}
            icon={<MessageCircle className="w-6 h-6" />}
            color="from-teal-500 to-cyan-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              أكثر الأقسام نشاطاً
            </h2>
            <div className="space-y-3">
              {stats.topCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <span className="text-sm font-bold text-green-600">{cat.count} إعلان</span>
                </div>
              ))}
              {stats.topCategories.length === 0 && (
                <p className="text-center text-gray-400 py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              أكثر المدن نشاطاً
            </h2>
            <div className="space-y-3">
              {stats.topCities.map((city, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">{city.name}</span>
                  <span className="text-sm font-bold text-blue-600">{city.count} إعلان</span>
                </div>
              ))}
              {stats.topCities.length === 0 && (
                <p className="text-center text-gray-400 py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <AlertCard
            title="البلاغات المعلقة"
            value={stats.pendingReports}
            icon={<AlertCircle className="w-5 h-5" />}
            color="bg-red-500"
          />

          <AlertCard
            title="الإعلانات المميزة النشطة"
            value={stats.activePromotions}
            icon={<Star className="w-5 h-5" />}
            color="bg-amber-500"
          />

          <AlertCard
            title="نمو اليوم"
            value={`+${stats.todayListings}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="bg-green-500"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-black text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

function AlertCard({ title, value, icon, color }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
