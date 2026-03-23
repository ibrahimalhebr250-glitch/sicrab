import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, AlertCircle, Star, MapPin, BarChart3, Settings, Menu, X, DollarSign, FileText, Activity, Shield, LogOut, TrendingUp, Wallet, Gift } from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminDashboard from './admin/Dashboard';
import AdminCategories from './admin/Categories';
import AdminListings from './admin/Listings';
import AdminUsers from './admin/Users';
import AdminReports from './admin/Reports';
import AdminPromotions from './admin/Promotions';
import AdminCities from './admin/Cities';
import AdminAnalytics from './admin/Analytics';
import AdminSettings from './admin/Settings';
import PlatformWallet from './admin/PlatformWallet';
import AdminContent from './admin/Content';
import AdminLiveActivity from './admin/LiveActivity';
import AdminStaff from './admin/Staff';
import ActivityLogs from './admin/ActivityLogs';
import AdminPerformance from './admin/Performance';
import AdminRewards from './admin/Rewards';

type AdminPage = 'dashboard' | 'categories' | 'listings' | 'users' | 'reports' | 'promotions' | 'cities' | 'analytics' | 'settings' | 'commission' | 'content' | 'activity' | 'staff' | 'logs' | 'performance' | 'rewards';

export default function Admin() {
  const { staff, loading, signOut, hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !staff) {
      navigate('/admin/login', { replace: true });
    }
  }, [staff, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!staff) {
    return null;
  }

  const allMenuItems = [
    { id: 'dashboard' as AdminPage, label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" />, section: 'dashboard' },
    { id: 'activity' as AdminPage, label: 'النشاط المباشر', icon: <Activity className="w-5 h-5" />, section: 'live_activity' },
    { id: 'logs' as AdminPage, label: 'سجل النشاطات', icon: <FileText className="w-5 h-5" />, section: 'activity' },
    { id: 'listings' as AdminPage, label: 'الإعلانات', icon: <Package className="w-5 h-5" />, section: 'listings' },
    { id: 'users' as AdminPage, label: 'المستخدمين', icon: <Users className="w-5 h-5" />, section: 'users' },
    { id: 'categories' as AdminPage, label: 'الأقسام والفئات', icon: <Package className="w-5 h-5" />, section: 'categories' },
    { id: 'cities' as AdminPage, label: 'المدن', icon: <MapPin className="w-5 h-5" />, section: 'cities' },
    { id: 'reports' as AdminPage, label: 'البلاغات', icon: <AlertCircle className="w-5 h-5" />, section: 'reports' },
    { id: 'promotions' as AdminPage, label: 'الترويج', icon: <Star className="w-5 h-5" />, section: 'promotions' },
    { id: 'commission' as AdminPage, label: 'محفظة المنصة', icon: <Wallet className="w-5 h-5" />, section: 'commission' },
    { id: 'content' as AdminPage, label: 'المحتوى', icon: <FileText className="w-5 h-5" />, section: 'content' },
    { id: 'analytics' as AdminPage, label: 'التحليلات', icon: <BarChart3 className="w-5 h-5" />, section: 'analytics' },
    { id: 'staff' as AdminPage, label: 'إدارة الموظفين', icon: <Shield className="w-5 h-5" />, section: 'staff' },
    { id: 'performance' as AdminPage, label: 'تقييم الأداء', icon: <TrendingUp className="w-5 h-5" />, section: 'staff' },
    { id: 'rewards' as AdminPage, label: 'المكافآت', icon: <Gift className="w-5 h-5" />, section: 'analytics' },
    { id: 'settings' as AdminPage, label: 'الإعدادات', icon: <Settings className="w-5 h-5" />, section: 'settings' },
  ];

  const menuItems = allMenuItems.filter(item => hasPermission(item.section));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-gray-900"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className={`fixed inset-y-0 right-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-l border-white/10 transform transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6">
          <h1 className="text-2xl font-black text-white mb-2">لوحة الإدارة</h1>
          <p className="text-sm text-slate-400">سوق المشاتل</p>
          <div className="mt-4 p-3 bg-white/10 rounded-xl">
            <p className="text-white font-medium text-sm">{staff.full_name}</p>
            <p className="text-slate-400 text-xs mt-1">{staff.email}</p>
          </div>
        </div>

        <nav className="px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 rounded-xl font-medium hover:text-white transition-all text-sm"
          >
            <span>العودة للموقع</span>
          </a>
        </div>
      </div>

      <div className="lg:mr-64">
        {currentPage === 'dashboard' && <AdminDashboard />}
        {currentPage === 'activity' && <AdminLiveActivity />}
        {currentPage === 'logs' && <ActivityLogs />}
        {currentPage === 'categories' && <AdminCategories />}
        {currentPage === 'listings' && <AdminListings />}
        {currentPage === 'users' && <AdminUsers />}
        {currentPage === 'reports' && <AdminReports />}
        {currentPage === 'promotions' && <AdminPromotions />}
        {currentPage === 'cities' && <AdminCities />}
        {currentPage === 'commission' && <PlatformWallet />}
        {currentPage === 'content' && <AdminContent />}
        {currentPage === 'analytics' && <AdminAnalytics />}
        {currentPage === 'staff' && <AdminStaff />}
        {currentPage === 'performance' && <AdminPerformance />}
        {currentPage === 'rewards' && <AdminRewards />}
        {currentPage === 'settings' && <AdminSettings />}
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
