import { useEffect, useState, useCallback } from 'react';
import {
  Wallet, DollarSign, TrendingUp, Heart, CheckCircle, Clock, XCircle,
  RefreshCw, Package, Star, ChevronDown, AlertCircle, Plus, Search, Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type WalletTab = 'overview' | 'commissions' | 'charity';

interface WalletEntry {
  id: string;
  source_type: 'promotion' | 'commission';
  source_id: string | null;
  amount: number;
  charity_deduction: number;
  net_amount: number;
  description: string;
  created_at: string;
}

interface Commission {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  deal_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  listing_title: string;
  seller_name: string;
  buyer_name: string;
}

interface Promotion {
  id: string;
  listing_title: string;
  user_name: string;
  type: string;
  price: number;
  status: string;
  payment_status: string;
  created_at: string;
  start_date: string;
  end_date: string;
}

const TYPE_LABELS: Record<string, string> = {
  featured: 'مميز',
  pinned: 'مثبت',
  featured_pinned: 'مميز ومثبت',
};

export default function PlatformWallet() {
  const [tab, setTab] = useState<WalletTab>('overview');
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadWalletEntries(), loadCommissions(), loadPromotions()]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadWalletEntries() {
    const { data } = await supabase
      .from('platform_wallet_entries')
      .select('*')
      .order('created_at', { ascending: false });
    setWalletEntries(data || []);
  }

  async function loadCommissions() {
    const { data } = await supabase
      .from('commissions')
      .select(`
        *,
        listings(title),
        seller:profiles!commissions_seller_id_fkey(full_name),
        buyer:profiles!commissions_buyer_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    const formatted = (data || []).map((item: any) => ({
      id: item.id,
      listing_id: item.listing_id,
      seller_id: item.seller_id,
      buyer_id: item.buyer_id,
      deal_amount: item.deal_amount,
      commission_amount: item.commission_amount,
      commission_percentage: item.commission_percentage,
      status: item.status,
      created_at: item.created_at,
      listing_title: item.listings?.title || 'غير محدد',
      seller_name: item.seller?.full_name || 'غير محدد',
      buyer_name: item.buyer?.full_name || 'غير محدد',
    }));
    setCommissions(formatted);
  }

  async function loadPromotions() {
    const { data } = await supabase
      .from('promotions')
      .select('*, listings(title), profiles(full_name)')
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false });

    const formatted = (data || []).map((item: any) => ({
      id: item.id,
      listing_title: item.listings?.title || 'إعلان محذوف',
      user_name: item.profiles?.full_name || 'مستخدم غير معروف',
      type: item.type,
      price: item.price,
      status: item.status,
      payment_status: item.payment_status,
      created_at: item.created_at,
      start_date: item.start_date,
      end_date: item.end_date,
    }));
    setPromotions(formatted);
  }

  async function updateCommissionStatus(id: string, status: 'paid' | 'cancelled') {
    await supabase.from('commissions').update({ status }).eq('id', id);

    if (status === 'paid') {
      const comm = commissions.find(c => c.id === id);
      if (comm) {
        await supabase.from('platform_wallet_entries').insert({
          source_type: 'commission',
          source_id: id,
          amount: comm.commission_amount,
          description: `عمولة صفقة: ${comm.listing_title} — ${comm.commission_percentage}% من ${comm.deal_amount.toLocaleString()} ر.س`,
        });
      }
    }

    await supabase.rpc('log_admin_action', {
      p_action: `commission_${status}`,
      p_target_type: 'commission',
      p_target_id: id,
    });

    await loadAll();
  }

  async function addPromotionToWallet(promo: Promotion) {
    const existing = walletEntries.find(e => e.source_type === 'promotion' && e.source_id === promo.id);
    if (existing) return;

    await supabase.from('platform_wallet_entries').insert({
      source_type: 'promotion',
      source_id: promo.id,
      amount: promo.price,
      description: `ترويج ${TYPE_LABELS[promo.type] ?? promo.type}: ${promo.listing_title} — ${promo.user_name}`,
    });
    await loadWalletEntries();
  }

  const totalRevenue = walletEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalCharity = walletEntries.reduce((s, e) => s + Number(e.charity_deduction), 0);
  const totalNet = walletEntries.reduce((s, e) => s + Number(e.net_amount), 0);
  const promotionRevenue = walletEntries.filter(e => e.source_type === 'promotion').reduce((s, e) => s + Number(e.amount), 0);
  const commissionRevenue = walletEntries.filter(e => e.source_type === 'commission').reduce((s, e) => s + Number(e.amount), 0);

  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const pendingCommissions = commissions.filter(c => c.status === 'pending');

  const filteredCommissions = commissions.filter(c => {
    const matchFilter = commissionFilter === 'all' || c.status === commissionFilter;
    const matchSearch = !search ||
      c.listing_title.toLowerCase().includes(search.toLowerCase()) ||
      c.seller_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const charityByMonth = walletEntries.reduce((acc, e) => {
    const month = new Date(e.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
    acc[month] = (acc[month] || 0) + Number(e.charity_deduction);
    return acc;
  }, {} as Record<string, number>);

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
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-black text-white">محفظة المنصة</h1>
            </div>
            <p className="text-slate-400 mr-13">إجمالي إيرادات المنصة من الترويج والعمولات — مع خصم الصدقات 25% تلقائياً</p>
          </div>
          <button onClick={loadAll} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all text-sm font-medium">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
            <DollarSign className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xs opacity-80 mb-1">إجمالي الإيرادات</p>
            <p className="text-2xl font-black">{totalRevenue.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
            <Star className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xs opacity-80 mb-1">من الترويج</p>
            <p className="text-2xl font-black">{promotionRevenue.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-xl">
            <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xs opacity-80 mb-1">من العمولات</p>
            <p className="text-2xl font-black">{commissionRevenue.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-xl">
            <Heart className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xs opacity-80 mb-1">خصم الصدقات 25%</p>
            <p className="text-2xl font-black">{totalCharity.toLocaleString('ar-SA')} ر.س</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-2 border-emerald-500/30 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-300 text-sm font-bold">الصافي بعد خصم الصدقات</p>
              <p className="text-white text-3xl font-black">{totalNet.toLocaleString('ar-SA')} ر.س</p>
            </div>
          </div>
          <div className="text-left text-sm text-slate-400">
            <p>{walletEntries.length} سجل</p>
            <p className="text-emerald-400 font-bold mt-0.5">{totalRevenue > 0 ? Math.round((totalNet / totalRevenue) * 100) : 75}% صافي</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
          {([
            { id: 'overview' as WalletTab, label: 'الإيراد العام', icon: <TrendingUp className="w-4 h-4" />, count: walletEntries.length },
            { id: 'commissions' as WalletTab, label: 'إدارة العمولات', icon: <DollarSign className="w-4 h-4" />, count: commissions.length },
            { id: 'charity' as WalletTab, label: 'خصم الصدقات', icon: <Heart className="w-4 h-4" />, count: null },
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

        {tab === 'overview' && (
          <OverviewTab
            entries={walletEntries}
            promotions={promotions}
            onAddPromotion={addPromotionToWallet}
            walletEntries={walletEntries}
          />
        )}

        {tab === 'commissions' && (
          <CommissionsTab
            commissions={filteredCommissions}
            allCommissions={commissions}
            filter={commissionFilter}
            search={search}
            onFilterChange={setCommissionFilter}
            onSearchChange={setSearch}
            onUpdateStatus={updateCommissionStatus}
            paidCount={paidCommissions.length}
            pendingCount={pendingCommissions.length}
          />
        )}

        {tab === 'charity' && (
          <CharityTab
            entries={walletEntries}
            totalCharity={totalCharity}
            charityByMonth={charityByMonth}
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  entries, promotions, onAddPromotion, walletEntries
}: {
  entries: WalletEntry[];
  promotions: Promotion[];
  onAddPromotion: (p: Promotion) => void;
  walletEntries: WalletEntry[];
}) {
  const registeredIds = new Set(walletEntries.filter(e => e.source_type === 'promotion').map(e => e.source_id));
  const unregistered = promotions.filter(p => !registeredIds.has(p.id));

  return (
    <div className="space-y-6">
      {unregistered.length > 0 && (
        <div className="bg-amber-900/30 border-2 border-amber-500/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-amber-300 font-bold">إيرادات ترويج لم تُسجَّل بعد ({unregistered.length})</h3>
          </div>
          <div className="space-y-2">
            {unregistered.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl p-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold line-clamp-1">{p.listing_title}</p>
                  <p className="text-slate-400 text-xs">{p.user_name} · {TYPE_LABELS[p.type] ?? p.type}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-emerald-400 font-black text-sm">{Number(p.price).toFixed(2)} ر.س</span>
                  <button
                    onClick={() => onAddPromotion(p)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تسجيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/10">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">سجل الإيرادات الكامل</h3>
          <p className="text-slate-400 text-sm mt-0.5">جميع المدخولات المسجّلة في المحفظة</p>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">لا توجد إيرادات مسجّلة بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map(entry => (
              <div key={entry.id} className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  entry.source_type === 'promotion'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-amber-500 to-orange-500'
                }`}>
                  {entry.source_type === 'promotion' ? <Star className="w-5 h-5 text-white" /> : <TrendingUp className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold line-clamp-1">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      entry.source_type === 'promotion' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {entry.source_type === 'promotion' ? 'ترويج' : 'عمولة'}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(entry.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="text-white font-black text-sm">{Number(entry.amount).toFixed(2)} ر.س</p>
                  <p className="text-rose-400 text-xs">- {Number(entry.charity_deduction).toFixed(2)} ر.س صدقة</p>
                  <p className="text-emerald-400 text-xs font-bold">= {Number(entry.net_amount).toFixed(2)} ر.س</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommissionsTab({
  commissions, allCommissions, filter, search, onFilterChange, onSearchChange, onUpdateStatus, paidCount, pendingCount
}: {
  commissions: Commission[];
  allCommissions: Commission[];
  filter: string;
  search: string;
  onFilterChange: (f: any) => void;
  onSearchChange: (s: string) => void;
  onUpdateStatus: (id: string, status: 'paid' | 'cancelled') => void;
  paidCount: number;
  pendingCount: number;
}) {
  const totalCommission = allCommissions.reduce((s, c) => s + c.commission_amount, 0);
  const paidTotal = allCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي العمولات', value: `${totalCommission.toLocaleString('ar-SA')} ر.س`, color: 'from-amber-500 to-orange-500' },
          { label: 'مدفوعة', value: `${paidTotal.toLocaleString('ar-SA')} ر.س`, color: 'from-green-500 to-emerald-600' },
          { label: 'قيد الانتظار', value: pendingCount, color: 'from-yellow-500 to-amber-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الإعلان أو البائع..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-slate-400 rounded-xl pr-10 pl-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-white/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'paid', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f ? 'bg-white text-gray-900' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {f === 'all' ? 'الكل' : f === 'pending' ? 'انتظار' : f === 'paid' ? 'مدفوعة' : 'ملغاة'}
              {' '}({allCommissions.filter(c => f === 'all' ? true : c.status === f).length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {commissions.length === 0 ? (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">لا توجد عمولات مطابقة</p>
          </div>
        ) : commissions.map(c => (
          <CommissionCard key={c.id} commission={c} onUpdate={onUpdateStatus} />
        ))}
      </div>
    </div>
  );
}

function CommissionCard({ commission, onUpdate }: {
  commission: Commission;
  onUpdate: (id: string, status: 'paid' | 'cancelled') => void;
}) {
  const statusConfig = {
    pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200', icon: <Clock className="w-3.5 h-3.5" /> },
    paid: { label: 'مدفوعة', className: 'bg-green-100 text-green-700 border border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    cancelled: { label: 'ملغاة', className: 'bg-red-100 text-red-700 border border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const sc = statusConfig[commission.status];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1">{commission.listing_title}</h3>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span>البائع: <span className="font-medium text-gray-800">{commission.seller_name}</span></span>
            <span>·</span>
            <span>المشتري: <span className="font-medium text-gray-800">{commission.buyer_name}</span></span>
            <span>·</span>
            <span className="text-gray-400 text-xs">
              {new Date(commission.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="text-left flex-shrink-0">
          <p className="text-xs text-gray-500 mb-0.5">قيمة الصفقة</p>
          <p className="text-xl font-black text-gray-900">{commission.deal_amount.toLocaleString('ar-SA')} ر.س</p>
          <p className="text-sm text-emerald-600 font-bold mt-0.5">
            عمولة {commission.commission_percentage}%: {commission.commission_amount.toLocaleString('ar-SA')} ر.س
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${sc.className}`}>
          {sc.icon}
          {sc.label}
        </span>
        {commission.status === 'pending' && (
          <div className="flex gap-2 mr-auto">
            <button
              onClick={() => onUpdate(commission.id, 'paid')}
              className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              تحديد كمدفوعة
            </button>
            <button
              onClick={() => onUpdate(commission.id, 'cancelled')}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              إلغاء
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CharityTab({
  entries, totalCharity, charityByMonth
}: {
  entries: WalletEntry[];
  totalCharity: number;
  charityByMonth: Record<string, number>;
}) {
  const totalRevenue = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalNet = entries.reduce((s, e) => s + Number(e.net_amount), 0);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-rose-900/40 to-pink-900/40 border-2 border-rose-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-white font-black text-xl">خصم الصدقات التلقائي</h3>
            <p className="text-slate-300 text-sm mt-0.5">25% من كل إيراد يُخصم تلقائياً كصدقة جارية عن المنصة</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-slate-300 text-xs mb-1">إجمالي الإيراد</p>
            <p className="text-white font-black text-lg">{totalRevenue.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="bg-rose-500/20 rounded-xl p-4 text-center border border-rose-500/30">
            <p className="text-rose-300 text-xs mb-1">خصم الصدقات (25%)</p>
            <p className="text-rose-200 font-black text-lg">{totalCharity.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="bg-emerald-500/20 rounded-xl p-4 text-center border border-emerald-500/30">
            <p className="text-emerald-300 text-xs mb-1">الصافي للمنصة (75%)</p>
            <p className="text-emerald-200 font-black text-lg">{totalNet.toLocaleString('ar-SA')} ر.س</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">الصدقات حسب الشهر</h3>
        </div>
        {Object.keys(charityByMonth).length === 0 ? (
          <div className="p-12 text-center">
            <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">لا توجد صدقات محسوبة بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {Object.entries(charityByMonth).map(([month, amount]) => (
              <div key={month} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{month}</p>
                    <p className="text-slate-400 text-xs">خصم الصدقات الشهري</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-rose-300 font-black">{amount.toLocaleString('ar-SA')} ر.س</p>
                  <p className="text-slate-500 text-xs">25% من الإيراد</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
        <h4 className="text-white font-bold mb-3">تفاصيل الخصم لكل سجل</h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">لا توجد سجلات</p>
          ) : entries.map(e => (
            <div key={e.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                e.source_type === 'promotion' ? 'bg-blue-500/20' : 'bg-amber-500/20'
              }`}>
                {e.source_type === 'promotion' ? <Star className="w-4 h-4 text-blue-400" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-xs line-clamp-1">{e.description}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="text-white text-xs font-bold">{Number(e.amount).toFixed(2)} ر.س</p>
                <p className="text-rose-400 text-xs">- {Number(e.charity_deduction).toFixed(2)} ر.س</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
