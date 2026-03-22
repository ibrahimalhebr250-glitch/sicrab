import { useEffect, useState, useCallback } from 'react';
import { Star, Pin, Zap, Calendar, Package, Search, CheckCircle, XCircle, Clock, ToggleLeft, ToggleRight, Eye, TrendingUp, DollarSign, AlertCircle, RefreshCw, Settings2, Save, Plus, Trash2, User, ChevronDown, CreditCard as Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Promotion {
  id: string;
  listing_id: string;
  user_id: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  price: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  listings: { title: string; price: number } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

interface PromotionPackage {
  id: string;
  type: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  price: number;
  duration_days: number;
  features_ar: string[];
  is_active: boolean;
  display_order: number;
  sort_priority: number;
  badge_color: string;
  updated_at: string;
}

interface SiteSettings {
  id: string;
  platform_mode: string;
  promotions_enabled: boolean;
}

type Tab = 'user_packages' | 'packages' | 'settings';
type PromotionFilter = 'all' | 'active' | 'pending' | 'expired' | 'cancelled';

const TYPE_LABELS: Record<string, string> = {
  featured: 'مميز',
  pinned: 'مثبت',
  featured_pinned: 'مميز ومثبت',
};

const TYPE_ICONS: Record<string, JSX.Element> = {
  featured: <Star className="w-4 h-4" />,
  pinned: <Pin className="w-4 h-4" />,
  featured_pinned: <Zap className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  featured: 'from-amber-500 to-yellow-500',
  pinned: 'from-blue-500 to-cyan-500',
  featured_pinned: 'from-emerald-500 to-teal-500',
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: JSX.Element }> = {
  active: { label: 'نشط', className: 'bg-green-100 text-green-700 border border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200', icon: <Clock className="w-3.5 h-3.5" /> },
  expired: { label: 'منتهي', className: 'bg-gray-100 text-gray-600 border border-gray-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-700 border border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AdminPromotions() {
  const [tab, setTab] = useState<Tab>('user_packages');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PromotionFilter>('all');
  const [search, setSearch] = useState('');
  const [editingPackage, setEditingPackage] = useState<PromotionPackage | null>(null);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [processingPromo, setProcessingPromo] = useState<string | null>(null);
  const [showNewPackage, setShowNewPackage] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPromotions(), loadPackages(), loadSettings()]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadPromotions() {
    const { data } = await supabase
      .from('promotions')
      .select('*, listings(title, price), profiles(full_name, phone)')
      .order('created_at', { ascending: false });
    setPromotions(data || []);
  }

  async function loadPackages() {
    const { data } = await supabase
      .from('promotion_packages')
      .select('*')
      .order('display_order', { ascending: true });
    setPackages(data || []);
  }

  async function loadSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('id, platform_mode, promotions_enabled')
      .maybeSingle();
    setSettings(data);
  }

  async function updatePromotionStatus(id: string, status: string) {
    setProcessingPromo(id);
    await supabase.from('promotions').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    setProcessingPromo(null);
  }

  async function extendPromotion(id: string, days: number) {
    const promo = promotions.find(p => p.id === id);
    if (!promo) return;
    setProcessingPromo(id);
    const base = promo.status === 'active' ? new Date(promo.end_date) : new Date();
    base.setDate(base.getDate() + days);
    await supabase.from('promotions').update({
      end_date: base.toISOString(),
      status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, end_date: base.toISOString(), status: 'active' } : p));
    setProcessingPromo(null);
  }

  async function deletePromotion(id: string) {
    setProcessingPromo(id);
    await supabase.from('promotions').delete().eq('id', id);
    setPromotions(prev => prev.filter(p => p.id !== id));
    setConfirmDelete(null);
    setProcessingPromo(null);
  }

  async function saveEditedPromotion(promo: Promotion, newEndDate: string, newStatus: string) {
    setProcessingPromo(promo.id);
    await supabase.from('promotions').update({
      end_date: new Date(newEndDate).toISOString(),
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', promo.id);
    setPromotions(prev => prev.map(p => p.id === promo.id
      ? { ...p, end_date: new Date(newEndDate).toISOString(), status: newStatus }
      : p
    ));
    setEditingPromo(null);
    setProcessingPromo(null);
  }

  async function savePackage(pkg: Partial<PromotionPackage> & { id?: string }) {
    setSavingPackage(true);
    if (pkg.id) {
      await supabase.from('promotion_packages').update({ ...pkg, updated_at: new Date().toISOString() }).eq('id', pkg.id);
    } else {
      await supabase.from('promotion_packages').insert({ ...pkg });
    }
    await loadPackages();
    setEditingPackage(null);
    setShowNewPackage(false);
    setSavingPackage(false);
  }

  async function deletePackage(id: string) {
    await supabase.from('promotion_packages').delete().eq('id', id);
    setPackages(prev => prev.filter(p => p.id !== id));
  }

  async function togglePackage(id: string, is_active: boolean) {
    await supabase.from('promotion_packages').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id);
    setPackages(prev => prev.map(p => p.id === id ? { ...p, is_active } : p));
  }

  async function savePlatformSettings(mode: string, enabled: boolean) {
    if (!settings) return;
    setSavingSettings(true);
    await supabase.from('site_settings').update({ platform_mode: mode, promotions_enabled: enabled }).eq('id', settings.id);
    setSettings(prev => prev ? { ...prev, platform_mode: mode, promotions_enabled: enabled } : prev);
    setSavingSettings(false);
  }

  const filteredPromotions = promotions.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const title = p.listings?.title ?? '';
    const name = p.profiles?.full_name ?? '';
    const matchSearch = !search ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    revenue: promotions.filter(p => p.payment_status === 'completed').reduce((s, p) => s + Number(p.price), 0),
    pending: promotions.filter(p => p.status === 'pending').length,
  };

  function getRemainingDays(endDate: string) {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'منتهي';
    if (diff === 0) return 'ينتهي اليوم';
    return `${diff} يوم`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white mb-4"></div>
          <p className="text-white font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">إدارة الترويج والباقات</h1>
            <p className="text-slate-400">التحكم الكامل بباقات المستخدمين وتعريف الباقات وإعدادات المنصة</p>
          </div>
          <button onClick={loadAll} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all text-sm font-medium">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'إجمالي الباقات', value: stats.total, icon: <Package className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
            { label: 'نشطة الآن', value: stats.active, icon: <CheckCircle className="w-5 h-5" />, color: 'from-green-500 to-emerald-600' },
            { label: 'قيد الانتظار', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
            { label: 'الإيرادات (ر.س)', value: stats.revenue.toFixed(0), icon: <DollarSign className="w-5 h-5" />, color: 'from-teal-500 to-cyan-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {settings && (
          <div className={`mb-6 rounded-2xl p-4 border-2 flex items-center justify-between gap-4 ${
            settings.platform_mode === 'free'
              ? 'bg-emerald-900/30 border-emerald-500/40'
              : 'bg-amber-900/30 border-amber-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                settings.platform_mode === 'free' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">
                  {settings.platform_mode === 'free' ? 'وضع المنصة: مجاني — جميع الإعلانات متساوية' : 'وضع المنصة: الباقات مفعّلة — المدفوع له أولوية'}
                </div>
                <div className="text-slate-300 text-xs mt-0.5">
                  {settings.platform_mode === 'free'
                    ? 'جميع الإعلانات تظهر بنفس الأولوية بغض النظر عن الترقية'
                    : 'الإعلانات المدفوعة تظهر في المقدمة وتحظى بأولوية الظهور'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setTab('settings')}
              className="flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all"
            >
              تغيير
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
          {([
            { id: 'user_packages' as Tab, label: 'باقات المستخدمين', icon: <User className="w-4 h-4" />, count: stats.total },
            { id: 'packages' as Tab, label: 'تعريف الباقات', icon: <Package className="w-4 h-4" />, count: packages.length },
            { id: 'settings' as Tab, label: 'الإعدادات', icon: <Settings2 className="w-4 h-4" />, count: null },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === t.id ? 'bg-white text-gray-900 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-black ${
                  tab === t.id ? 'bg-gray-900 text-white' : 'bg-white/20 text-white'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'user_packages' && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الإعلان أو المستخدم..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-slate-400 rounded-xl pr-10 pl-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'active', 'pending', 'expired', 'cancelled'] as PromotionFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filter === f ? 'bg-white text-gray-900' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {f === 'all' ? `الكل (${promotions.length})` :
                     f === 'active' ? `نشط (${stats.active})` :
                     f === 'pending' ? `انتظار (${stats.pending})` :
                     f === 'expired' ? `منتهي (${promotions.filter(p => p.status === 'expired').length})` :
                     `ملغي (${promotions.filter(p => p.status === 'cancelled').length})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredPromotions.length === 0 ? (
                <div className="bg-white/10 rounded-2xl p-12 text-center">
                  <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">لا توجد باقات مطابقة</p>
                </div>
              ) : filteredPromotions.map(promo => (
                editingPromo?.id === promo.id ? (
                  <EditPromoForm
                    key={promo.id}
                    promo={promo}
                    onSave={saveEditedPromotion}
                    onCancel={() => setEditingPromo(null)}
                    processing={processingPromo === promo.id}
                  />
                ) : (
                  <UserPromotionRow
                    key={promo.id}
                    promo={promo}
                    processing={processingPromo === promo.id}
                    confirmingDelete={confirmDelete === promo.id}
                    getRemainingDays={getRemainingDays}
                    onUpdateStatus={updatePromotionStatus}
                    onExtend={extendPromotion}
                    onEdit={() => setEditingPromo(promo)}
                    onDeleteRequest={() => setConfirmDelete(promo.id)}
                    onDeleteConfirm={() => deletePromotion(promo.id)}
                    onDeleteCancel={() => setConfirmDelete(null)}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {tab === 'packages' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-300 text-sm">تفعيل أو تعطيل الباقات وتعديل أسعارها ومزاياها وحذفها</p>
              <button
                onClick={() => { setShowNewPackage(true); setEditingPackage(null); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                باقة جديدة
              </button>
            </div>

            {showNewPackage && (
              <PackageForm
                pkg={null}
                onSave={savePackage}
                onCancel={() => setShowNewPackage(false)}
                saving={savingPackage}
              />
            )}

            <div className="space-y-3">
              {packages.map(pkg => (
                editingPackage?.id === pkg.id ? (
                  <PackageForm
                    key={pkg.id}
                    pkg={editingPackage}
                    onSave={savePackage}
                    onCancel={() => setEditingPackage(null)}
                    saving={savingPackage}
                  />
                ) : (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={() => setEditingPackage(pkg)}
                    onToggle={togglePackage}
                    onDelete={deletePackage}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {tab === 'settings' && settings && (
          <PlatformSettings
            settings={settings}
            saving={savingSettings}
            onSave={savePlatformSettings}
          />
        )}
      </div>
    </div>
  );
}

function UserPromotionRow({
  promo, processing, confirmingDelete, getRemainingDays,
  onUpdateStatus, onExtend, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel
}: {
  promo: Promotion;
  processing: boolean;
  confirmingDelete: boolean;
  getRemainingDays: (d: string) => string;
  onUpdateStatus: (id: string, status: string) => void;
  onExtend: (id: string, days: number) => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}) {
  const status = STATUS_CONFIG[promo.status] ?? STATUS_CONFIG.expired;
  const remaining = getRemainingDays(promo.end_date);

  return (
    <div className={`bg-white rounded-2xl shadow-sm transition-all ${processing ? 'opacity-60' : ''}`}>
      {confirmingDelete && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-bold text-sm">هل تريد حذف هذه الباقة نهائياً؟ لا يمكن التراجع.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onDeleteCancel} className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all">
              إلغاء
            </button>
            <button onClick={onDeleteConfirm} disabled={processing} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all">
              حذف نهائي
            </button>
          </div>
        </div>
      )}

      {!confirmingDelete && (
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${TYPE_COLORS[promo.type] ?? 'from-gray-400 to-gray-500'} flex items-center justify-center text-white flex-shrink-0`}>
              {TYPE_ICONS[promo.type] ?? <Star className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                    {promo.listings?.title ?? 'إعلان محذوف'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500 text-xs font-medium">
                      {promo.profiles?.full_name ?? 'مستخدم غير معروف'}
                      {promo.profiles?.phone && <span className="text-gray-400 mr-1">· {promo.profiles.phone}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                      promo.type === 'featured' ? 'bg-amber-100 text-amber-700' :
                      promo.type === 'pinned' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {TYPE_ICONS[promo.type]}
                      {TYPE_LABELS[promo.type] ?? promo.type}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${status.className}`}>
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="text-gray-500 text-xs font-bold">{Number(promo.price).toFixed(2)} ر.س</span>
                  </div>
                </div>

                <div className="text-left flex-shrink-0">
                  <div className={`text-xs font-bold ${promo.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                    {remaining}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    ينتهي: {new Date(promo.end_date).toLocaleDateString('ar-SA')}
                  </div>
                  <div className="text-gray-300 text-xs">
                    بدأ: {new Date(promo.start_date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={onEdit}
                  disabled={processing}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all border border-blue-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  تعديل
                </button>

                {promo.status === 'active' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(promo.id, 'cancelled')}
                      disabled={processing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold transition-all border border-orange-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      إيقاف
                    </button>
                    <button
                      onClick={() => onExtend(promo.id, 7)}
                      disabled={processing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg text-xs font-bold transition-all border border-teal-200"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      تمديد 7 أيام
                    </button>
                  </>
                )}
                {promo.status === 'pending' && (
                  <button
                    onClick={() => onUpdateStatus(promo.id, 'active')}
                    disabled={processing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-all border border-green-200"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    تفعيل
                  </button>
                )}
                {(promo.status === 'cancelled' || promo.status === 'expired') && (
                  <button
                    onClick={() => onUpdateStatus(promo.id, 'active')}
                    disabled={processing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all border border-emerald-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    إعادة تفعيل
                  </button>
                )}

                <button
                  onClick={onDeleteRequest}
                  disabled={processing}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-all border border-red-200 mr-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditPromoForm({ promo, onSave, onCancel, processing }: {
  promo: Promotion;
  onSave: (promo: Promotion, endDate: string, status: string) => void;
  onCancel: () => void;
  processing: boolean;
}) {
  const toDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [endDate, setEndDate] = useState(toDatetimeLocal(promo.end_date));
  const [status, setStatus] = useState(promo.status);

  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TYPE_COLORS[promo.type] ?? 'from-gray-400 to-gray-500'} flex items-center justify-center text-white flex-shrink-0`}>
          {TYPE_ICONS[promo.type] ?? <Star className="w-4 h-4" />}
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base">تعديل الباقة</h3>
          <p className="text-gray-500 text-sm">{promo.listings?.title ?? 'إعلان محذوف'} · {promo.profiles?.full_name ?? 'مستخدم غير معروف'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">تاريخ انتهاء الباقة</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">حالة الباقة</label>
          <div className="relative">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 appearance-none"
            >
              <option value="active">نشط</option>
              <option value="pending">قيد الانتظار</option>
              <option value="cancelled">ملغي</option>
              <option value="expired">منتهي</option>
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold text-sm transition-all"
        >
          إلغاء
        </button>
        <button
          onClick={() => onSave(promo, endDate, status)}
          disabled={processing}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
}

function PackageCard({ pkg, onEdit, onToggle, onDelete }: {
  pkg: PromotionPackage;
  onEdit: () => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className={`rounded-2xl p-5 border-2 transition-all ${
      pkg.is_active ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'
    }`}>
      {confirmDel ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-bold text-sm">حذف الباقة "{pkg.name_ar}" نهائياً؟</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all">
              إلغاء
            </button>
            <button onClick={() => onDelete(pkg.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all">
              حذف
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TYPE_COLORS[pkg.type] ?? 'from-gray-400 to-gray-500'} flex items-center justify-center text-white flex-shrink-0`}>
              {TYPE_ICONS[pkg.type] ?? <Package className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-gray-900 text-base">{pkg.name_ar}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">{pkg.description_ar}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-2xl font-black text-gray-900">{pkg.price} ر.س</div>
                  <div className="text-gray-500 text-xs">{pkg.duration_days} يوم</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    pkg.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {pkg.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {pkg.is_active ? 'مفعّلة' : 'معطّلة'}
                  </span>
                  <span className="text-gray-400 text-xs">الترتيب: {pkg.display_order}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggle(pkg.id, !pkg.is_active)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      pkg.is_active
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
                    }`}
                  >
                    {pkg.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {pkg.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all border border-blue-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-all border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          </div>

          {pkg.features_ar && pkg.features_ar.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-1.5">
              {pkg.features_ar.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PackageForm({ pkg, onSave, onCancel, saving }: {
  pkg: PromotionPackage | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    id: pkg?.id,
    type: pkg?.type ?? 'featured',
    name_ar: pkg?.name_ar ?? '',
    name_en: pkg?.name_en ?? '',
    description_ar: pkg?.description_ar ?? '',
    price: pkg?.price ?? 10,
    duration_days: pkg?.duration_days ?? 7,
    display_order: pkg?.display_order ?? 1,
    sort_priority: pkg?.sort_priority ?? 1,
    is_active: pkg?.is_active ?? true,
    features_ar: pkg?.features_ar?.join('\n') ?? '',
  });

  function handleSubmit() {
    onSave({
      ...form,
      features_ar: form.features_ar.split('\n').map((s: string) => s.trim()).filter(Boolean),
      features_en: [],
    });
  }

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
      <h3 className="font-black text-gray-900 mb-4 text-lg">{pkg ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">نوع الباقة</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            disabled={!!pkg}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
          >
            <option value="featured">مميز (Featured)</option>
            <option value="pinned">مثبت (Pinned)</option>
            <option value="featured_pinned">مميز ومثبت (Featured + Pinned)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">الاسم بالعربي</label>
          <input
            type="text"
            value={form.name_ar}
            onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="مثال: إعلان مميز"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">الاسم بالإنجليزي</label>
          <input
            type="text"
            value={form.name_en}
            onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="e.g. Featured Listing"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">الوصف بالعربي</label>
          <input
            type="text"
            value={form.description_ar}
            onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="وصف مختصر للباقة"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">السعر (ر.س)</label>
          <input
            type="number"
            value={form.price}
            min={0}
            onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">المدة (أيام)</label>
          <input
            type="number"
            value={form.duration_days}
            min={1}
            onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) }))}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">ترتيب العرض</label>
          <input
            type="number"
            value={form.display_order}
            min={1}
            onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) }))}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <button
            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
              form.is_active
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {form.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {form.is_active ? 'الباقة مفعّلة' : 'الباقة معطّلة'}
          </button>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1">المزايا (كل ميزة في سطر منفصل)</label>
          <textarea
            value={form.features_ar}
            onChange={e => setForm(f => ({ ...f, features_ar: e.target.value }))}
            rows={4}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
            placeholder="يظهر في أعلى البحث&#10;علامة مميز ذهبية&#10;زيادة المشاهدات"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold text-sm transition-all"
        >
          إلغاء
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.name_ar}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الباقة'}
        </button>
      </div>
    </div>
  );
}

function PlatformSettings({ settings, saving, onSave }: {
  settings: SiteSettings;
  saving: boolean;
  onSave: (mode: string, enabled: boolean) => void;
}) {
  const [mode, setMode] = useState(settings.platform_mode);
  const [enabled, setEnabled] = useState(settings.promotions_enabled);
  const hasChanges = mode !== settings.platform_mode || enabled !== settings.promotions_enabled;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h3 className="font-black text-gray-900 text-lg mb-1">وضع تشغيل المنصة</h3>
        <p className="text-gray-500 text-sm mb-6">
          تحكم في كيفية ظهور الإعلانات — الوضع المجاني مناسب للإطلاق، ووضع الباقات للمرحلة التجارية
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setMode('free')}
            className={`relative p-5 rounded-2xl border-2 text-right transition-all ${
              mode === 'free' ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {mode === 'free' && (
              <div className="absolute top-3 left-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-black text-gray-900 mb-1">الوضع المجاني</h4>
            <p className="text-gray-500 text-sm">
              جميع الإعلانات تظهر بنفس الأولوية. مثالي للإطلاق وجذب أول المستخدمين.
            </p>
            <div className="mt-3 p-3 bg-emerald-100 rounded-xl">
              <p className="text-emerald-700 text-xs font-bold">الإعلانات المرقّاة تحمل شارات التمييز لكن بدون أولوية ظهور</p>
            </div>
          </button>

          <button
            onClick={() => setMode('packages')}
            className={`relative p-5 rounded-2xl border-2 text-right transition-all ${
              mode === 'packages' ? 'border-amber-500 bg-amber-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {mode === 'packages' && (
              <div className="absolute top-3 left-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-black text-gray-900 mb-1">وضع الباقات</h4>
            <p className="text-gray-500 text-sm">
              الإعلانات المدفوعة تظهر أولاً. الإعلانات العادية تظهر بعدها بدون أولوية.
            </p>
            <div className="mt-3 p-3 bg-amber-100 rounded-xl">
              <p className="text-amber-700 text-xs font-bold">مثبت &gt; مميز &gt; عادي — ترتيب يحفّز المستخدمين على الاشتراك</p>
            </div>
          </button>
        </div>

        <div className={`p-5 rounded-2xl border-2 transition-all ${
          enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-black text-gray-900 mb-1">ميزة الترقية والباقات للمستخدمين</h4>
              <p className="text-gray-500 text-sm">
                {enabled
                  ? 'المستخدمون يمكنهم رؤية الباقات وترقية إعلاناتهم'
                  : 'الباقات مخفية تماماً — لن يرى المستخدمون أي خيارات ترقية'}
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                enabled
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              {enabled ? 'مفعّلة' : 'معطّلة'}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-bold text-sm">لديك تغييرات غير محفوظة</p>
              <p className="text-yellow-700 text-xs mt-0.5">اضغط "حفظ الإعدادات" لتطبيق التغييرات فوراً على المنصة</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => onSave(mode, enabled)}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
        <h4 className="text-white font-bold mb-3">خطة إطلاق مقترحة</h4>
        <div className="space-y-3">
          {[
            { step: '1', title: 'مرحلة الإطلاق', desc: 'ابدأ بالوضع المجاني لجذب المستخدمين وبناء قاعدة إعلانات قوية' },
            { step: '2', title: 'تفعيل الباقات', desc: 'عندما تنمو المنصة، فعّل الباقات وأعلن عنها للمستخدمين' },
            { step: '3', title: 'وضع الباقات', desc: 'الإعلانات المدفوعة تحصل على أولوية الظهور وزيادة التفاعل' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{item.title}</p>
                <p className="text-slate-300 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
