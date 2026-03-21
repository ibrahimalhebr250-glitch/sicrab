import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, TrendingUp, Eye, Trash2, CreditCard as Edit3, Package, CheckCircle, XCircle, Clock, BarChart2, ArrowRight, ToggleLeft, ToggleRight, Import as SortAsc, Dessert as SortDesc, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  price_type: string;
  condition: string;
  images: string[];
  is_active: boolean;
  views_count: number;
  shares_count: number;
  whatsapp_clicks: number;
  created_at: string;
  slug: string;
  category_id: string;
  city_id: string;
}

type SortField = 'created_at' | 'views_count' | 'price';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    fetchMyListings();
  }, [user, authLoading]);

  const fetchMyListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, description, price, price_type, condition, images, is_active, views_count, shares_count, whatsapp_clicks, created_at, slug, category_id, city_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (listing: Listing) => {
    setTogglingId(listing.id);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_active: !listing.is_active })
        .eq('id', listing.id);

      if (error) throw error;
      setListings(prev =>
        prev.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l)
      );
      showSuccess(listing.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان');
    } catch (error) {
      console.error('Error toggling listing:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setListings(prev => prev.filter(l => l.id !== id));
      setDeleteConfirmId(null);
      showSuccess('تم حذف الإعلان بنجاح');
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filtered = useMemo(() => {
    let result = [...listings];

    if (statusFilter === 'active') result = result.filter(l => l.is_active);
    else if (statusFilter === 'inactive') result = result.filter(l => !l.is_active);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const av = (a[sortField] as any) ?? 0;
      const bv = (b[sortField] as any) ?? 0;
      if (sortDir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    return result;
  }, [listings, search, statusFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: listings.length,
    active: listings.filter(l => l.is_active).length,
    inactive: listings.filter(l => !l.is_active).length,
    totalViews: listings.reduce((s, l) => s + (l.views_count || 0), 0),
    totalWhatsapp: listings.reduce((s, l) => s + (l.whatsapp_clicks || 0), 0),
  }), [listings]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatPrice = (price: number, type: string) => {
    if (type === 'free') return 'مجاناً';
    if (type === 'negotiable') return 'قابل للتفاوض';
    return `${price?.toLocaleString('ar-SA')} ريال`;
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">جاري تحميل إعلاناتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">تأكيد الحذف</h3>
                <p className="text-gray-500 text-sm">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6 text-sm">
              هل أنت متأكد من حذف هذا الإعلان؟ سيتم حذف جميع البيانات والصور المرتبطة به نهائياً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={!!deletingId}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId === deleteConfirmId ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900">إعلاناتي</h1>
              <p className="text-xs text-gray-500">{stats.total} إعلان</p>
            </div>
          </div>
          <Link
            to="/add"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إعلان جديد</span>
            <span className="sm:hidden">جديد</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'إجمالي', value: stats.total, icon: Package, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
            { label: 'نشط', value: stats.active, icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
            { label: 'موقوف', value: stats.inactive, icon: XCircle, bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100' },
            { label: 'مشاهدات', value: stats.totalViews.toLocaleString('ar-SA'), icon: Eye, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
            { label: 'واتساب', value: stats.totalWhatsapp.toLocaleString('ar-SA'), icon: BarChart2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl border ${s.border} p-4`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} mb-3`}>
                <s.icon className={`w-4 h-4 ${s.text}`} />
              </div>
              <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في إعلاناتك..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1.5">
              {(['all', 'active', 'inactive'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {s === 'all' ? 'الكل' : s === 'active' ? 'النشطة' : 'الموقوفة'}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 mr-auto">
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as SortField)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="created_at">الأحدث</option>
                <option value="views_count">الأكثر مشاهدة</option>
                <option value="price">السعر</option>
              </select>
              <button
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sortDir === 'asc'
                  ? <SortAsc className="w-4 h-4 text-gray-600" />
                  : <SortDesc className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {listings.length === 0 ? 'لا توجد إعلانات بعد' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              {listings.length === 0 ? 'ابدأ بنشر إعلانك الأول الآن' : 'جرب تغيير كلمة البحث أو الفلتر'}
            </p>
            {listings.length === 0 && (
              <Link
                to="/add"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                أضف إعلانك الأول
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl border transition-all ${
                  listing.is_active
                    ? 'border-gray-100 hover:border-amber-200 hover:shadow-sm'
                    : 'border-gray-100 bg-gray-50/50'
                }`}
              >
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className={`w-full h-full object-cover transition-opacity ${listing.is_active ? 'opacity-100' : 'opacity-60'}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className={`font-bold text-base truncate ${listing.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                        {listing.title}
                      </h3>
                      <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${
                        listing.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {listing.is_active ? 'نشط' : 'موقوف'}
                      </span>
                    </div>

                    <p className="text-amber-600 font-bold text-lg mb-2">
                      {formatPrice(listing.price, listing.price_type)}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {(listing.views_count || 0).toLocaleString('ar-SA')}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5" />
                        {(listing.whatsapp_clicks || 0)} واتساب
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(listing.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleActive(listing)}
                        disabled={togglingId === listing.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          listing.is_active
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {listing.is_active
                          ? <ToggleRight className="w-4 h-4" />
                          : <ToggleLeft className="w-4 h-4" />
                        }
                        {togglingId === listing.id ? '...' : listing.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>

                      <Link
                        to={`/listing/${listing.slug || listing.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        تعديل
                      </Link>

                      <Link
                        to={`/promote/${listing.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        ترقية
                      </Link>

                      <Link
                        to={`/listing/${listing.slug || listing.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </Link>

                      <button
                        onClick={() => setDeleteConfirmId(listing.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
