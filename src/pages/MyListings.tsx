import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, TrendingUp, Eye, Trash2, CreditCard as Edit3, Package, CheckCircle, XCircle, Clock, BarChart2, ArrowRight, ToggleLeft, ToggleRight, AlertCircle, MessageSquare, Zap, Star, Filter, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  is_promoted?: boolean;
  promotion_ends_at?: string;
}

type SortField = 'created_at' | 'views_count' | 'price';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive' | 'promoted';

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'الآن';
  if (s < 3600) return `${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعة`;
  if (s < 604800) return `${Math.floor(s / 86400)} يوم`;
  return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

function formatPrice(price: number, type: string) {
  if (type === 'free') return 'مجاناً';
  if (type === 'negotiable') return 'قابل للتفاوض';
  return `${price?.toLocaleString('ar-SA')} ريال`;
}

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    fetchMyListings();
  }, [user, authLoading]);

  async function fetchMyListings() {
    try {
      const { data } = await supabase
        .from('listings')
        .select('id, title, description, price, price_type, condition, images, is_active, views_count, shares_count, whatsapp_clicks, created_at, slug, category_id, city_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      setListings(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(listing: Listing) {
    setTogglingId(listing.id);
    const { error } = await supabase.from('listings').update({ is_active: !listing.is_active }).eq('id', listing.id);
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l));
      showSuccess(listing.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان');
    }
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id));
      setDeleteConfirmId(null);
      showSuccess('تم حذف الإعلان بنجاح');
    }
    setDeletingId(null);
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  const filtered = useMemo(() => {
    let result = [...listings];
    if (statusFilter === 'active') result = result.filter(l => l.is_active);
    else if (statusFilter === 'inactive') result = result.filter(l => !l.is_active);
    else if (statusFilter === 'promoted') result = result.filter(l => l.is_promoted);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const av = (a[sortField] as number | string) ?? 0;
      const bv = (b[sortField] as number | string) ?? 0;
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
    totalShares: listings.reduce((s, l) => s + (l.shares_count || 0), 0),
  }), [listings]);

  const topListing = useMemo(() =>
    listings.length > 0 ? [...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0] : null,
    [listings]
  );

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">جاري تحميل إعلاناتك...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-black text-gray-900 text-center text-lg mb-1">تأكيد الحذف</h3>
            <p className="text-gray-500 text-sm text-center mb-6">سيتم حذف الإعلان وجميع بياناته نهائياً ولا يمكن التراجع</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={!!deletingId}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900">إعلاناتي</h1>
              <p className="text-xs text-gray-400">{stats.total} إعلان · {stats.active} نشط</p>
            </div>
          </div>
          <Link to="/add" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إعلان جديد</span>
            <span className="sm:hidden">جديد</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {[
            { label: 'إجمالي', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'نشطة', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { label: 'موقوفة', value: stats.inactive, icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
            { label: 'مشاهدات', value: stats.totalViews.toLocaleString('ar-SA'), icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'واتساب', value: stats.totalWhatsapp.toLocaleString('ar-SA'), icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'مشاركات', value: stats.totalShares.toLocaleString('ar-SA'), icon: BarChart2, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl border ${s.border} p-3.5 flex flex-col items-start`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} mb-2.5`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-black ${s.color} leading-none`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {topListing && topListing.views_count > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center gap-4 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px'}} />
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-xs text-white/80 mb-0.5">الإعلان الأكثر مشاهدة</p>
              <p className="font-bold truncate">{topListing.title}</p>
            </div>
            <div className="relative flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-xl flex-shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{(topListing.views_count || 0).toLocaleString('ar-SA')}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 space-y-3">
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-1 flex-wrap">
              {([
                { id: 'all', label: 'الكل', count: stats.total },
                { id: 'active', label: 'نشطة', count: stats.active },
                { id: 'inactive', label: 'موقوفة', count: stats.inactive },
              ] as { id: StatusFilter; label: string; count: number }[]).map(s => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === s.id ? 'bg-amber-500 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-amber-200'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`text-xs ${statusFilter === s.id ? 'text-white/70' : 'text-gray-400'}`}>({s.count})</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-gray-300 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>ترتيب</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              {showSort && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 min-w-40 overflow-hidden">
                  {[
                    { field: 'created_at' as SortField, dir: 'desc' as SortDir, label: 'الأحدث أولاً' },
                    { field: 'created_at' as SortField, dir: 'asc' as SortDir, label: 'الأقدم أولاً' },
                    { field: 'views_count' as SortField, dir: 'desc' as SortDir, label: 'الأكثر مشاهدة' },
                    { field: 'price' as SortField, dir: 'desc' as SortDir, label: 'الأعلى سعراً' },
                    { field: 'price' as SortField, dir: 'asc' as SortDir, label: 'الأقل سعراً' },
                  ].map(opt => (
                    <button
                      key={`${opt.field}-${opt.dir}`}
                      onClick={() => { setSortField(opt.field); setSortDir(opt.dir); setShowSort(false); }}
                      className={`w-full px-4 py-2.5 text-xs font-semibold text-right transition-colors ${
                        sortField === opt.field && sortDir === opt.dir ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {listings.length === 0 ? 'لا توجد إعلانات بعد' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              {listings.length === 0 ? 'ابدأ بنشر إعلانك الأول الآن' : 'جرب تغيير كلمة البحث أو الفلتر'}
            </p>
            {listings.length === 0 && (
              <Link to="/add" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                <Plus className="w-4 h-4" />
                أضف إعلانك الأول
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                togglingId={togglingId}
                onToggle={handleToggleActive}
                onDelete={() => setDeleteConfirmId(listing.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ListingCardProps {
  listing: Listing;
  togglingId: string | null;
  onToggle: (l: Listing) => void;
  onDelete: () => void;
}

function ListingCard({ listing, togglingId, onToggle, onDelete }: ListingCardProps) {
  const viewRate = listing.views_count > 0 && listing.whatsapp_clicks > 0
    ? Math.round((listing.whatsapp_clicks / listing.views_count) * 100)
    : 0;

  return (
    <div className={`bg-white rounded-2xl border transition-all hover:shadow-md group ${
      listing.is_active ? 'border-gray-100 hover:border-amber-100' : 'border-gray-100 opacity-75'
    }`}>
      <div className="flex gap-0 sm:gap-4 p-0 sm:p-4">
        <div className="w-28 sm:w-32 flex-shrink-0 rounded-r-2xl sm:rounded-xl overflow-hidden bg-gray-100 self-stretch min-h-28">
          {listing.images?.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${!listing.is_active ? 'grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-200" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 p-3 sm:p-0">
          <div className="flex items-start gap-2 mb-1.5">
            <h3 className={`font-bold text-sm sm:text-base flex-1 line-clamp-2 leading-snug ${listing.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
              {listing.title}
            </h3>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-bold mt-0.5 ${
              listing.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {listing.is_active ? 'نشط' : 'موقوف'}
            </span>
          </div>

          <p className="text-amber-600 font-black text-base mb-2">
            {formatPrice(listing.price, listing.price_type)}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {(listing.views_count || 0).toLocaleString('ar-SA')} مشاهدة
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {listing.whatsapp_clicks || 0} واتساب
            </span>
            {viewRate > 0 && (
              <span className={`flex items-center gap-1 font-semibold ${viewRate > 10 ? 'text-green-600' : 'text-gray-400'}`}>
                <Zap className="w-3 h-3" />
                {viewRate}% تحويل
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(listing.created_at)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onToggle(listing)}
              disabled={togglingId === listing.id}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                listing.is_active
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {listing.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              {togglingId === listing.id ? '...' : listing.is_active ? 'إيقاف' : 'تفعيل'}
            </button>

            <Link
              to={`/edit/${listing.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              تعديل
            </Link>

            <Link
              to={`/promote/${listing.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              ترقية
            </Link>

            <Link
              to={`/listing/${listing.slug || listing.id}`}
              target="_blank"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <Eye className="w-3.5 h-3.5" />
              عرض
            </Link>

            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors mr-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
