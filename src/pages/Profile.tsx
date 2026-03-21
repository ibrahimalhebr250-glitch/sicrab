import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Phone, Calendar, CreditCard as Edit3, ArrowRight, TrendingUp, Package, Eye, MessageSquare, CheckCircle, LogOut, ChevronRight, BarChart2, Plus, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ListingStats {
  total: number;
  active: number;
  totalViews: number;
  totalWhatsapp: number;
}

export default function Profile() {
  const { user, profile, updateProfile, signOut, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [listingStats, setListingStats] = useState<ListingStats>({ total: 0, active: 0, totalViews: 0, totalWhatsapp: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile) {
      window.location.href = '/login';
      return;
    }
    fetchStats();
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('listings')
        .select('is_active, views_count, whatsapp_clicks')
        .eq('user_id', user.id);

      if (data) {
        setListingStats({
          total: data.length,
          active: data.filter(l => l.is_active).length,
          totalViews: data.reduce((s, l) => s + (l.views_count || 0), 0),
          totalWhatsapp: data.reduce((s, l) => s + (l.whatsapp_clicks || 0), 0),
        });
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await updateProfile({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
    });

    if (error) {
      setMessage('error');
    } else {
      setMessage('success');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {message === 'success' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">تم حفظ التغييرات بنجاح</span>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-black text-gray-900">حسابي</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium px-3 py-2 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400"></div>
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-10 h-10 text-amber-500" />
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  تعديل
                </button>
              )}
            </div>

            {!isEditing ? (
              <div>
                <h2 className="text-xl font-black text-gray-900">{profile.full_name}</h2>
                {profile.bio && <p className="text-gray-500 text-sm mt-1">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4 mt-3">
                  {profile.phone && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone className="w-4 h-4 text-amber-500" />
                      {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    عضو منذ {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {message === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    حدث خطأ أثناء حفظ التغييرات
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">الاسم الكامل</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">رقم الجوال</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">نبذة عني</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-right resize-none"
                    placeholder="اكتب نبذة مختصرة عنك..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(profile.full_name || '');
                      setPhone(profile.phone || '');
                      setBio(profile.bio || '');
                      setMessage('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'إعلاناتي', value: listingStats.total, sub: `${listingStats.active} نشط`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'المشاهدات', value: listingStats.totalViews.toLocaleString('ar-SA'), sub: 'إجمالي', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'تواصل واتساب', value: listingStats.totalWhatsapp.toLocaleString('ar-SA'), sub: 'إجمالي', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'إعلانات موقوفة', value: listingStats.total - listingStats.active, sub: 'بحاجة مراجعة', icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black ${statsLoading ? 'text-gray-200' : s.color}`}>
                {statsLoading ? '—' : s.value}
              </p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {[
            {
              to: '/my-listings',
              icon: Package,
              iconBg: 'bg-amber-50',
              iconColor: 'text-amber-600',
              label: 'إدارة إعلاناتي',
              desc: 'عرض، تعديل، وإيقاف إعلاناتك',
            },
            {
              to: '/add',
              icon: Plus,
              iconBg: 'bg-green-50',
              iconColor: 'text-green-600',
              label: 'إضافة إعلان جديد',
              desc: 'انشر إعلانك الآن',
            },
            {
              to: '/my-promotions',
              icon: TrendingUp,
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              label: 'ترقياتي',
              desc: 'إدارة الإعلانات المدفوعة',
            },
            {
              to: '/messages',
              icon: MessageSquare,
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              label: 'الرسائل',
              desc: 'تواصل مع المشترين والبائعين',
            },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 rotate-180" />
            </Link>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-100 rounded-2xl text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
