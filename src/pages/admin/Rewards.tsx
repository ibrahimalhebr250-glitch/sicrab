import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Wallet, Users, ShieldCheck, TrendingUp, Star, Gift, Medal, Award, RefreshCw, Search, ChevronDown, ChevronUp, Plus, Minus, BarChart2, CreditCard as Edit2, Check, X, AlertCircle, Zap, Eye, Settings, Download, Filter, RotateCcw, UserCheck, UserX, Hash, ArrowUpRight, ArrowDownRight, Clock, FileText } from 'lucide-react';

type AdminTab = 'overview' | 'reputation' | 'cashback' | 'referral' | 'safedeal';

interface UserRewardSummary {
  user_id: string;
  full_name: string;
  phone: string | null;
  level: string;
  total_points: number;
  wallet_balance: number;
  total_earned: number;
  total_redeemed: number;
  referral_code: string | null;
  referral_uses: number;
  referral_rewards: number;
  has_safedeal: boolean;
  safedeal_deals: number;
}

interface RecentEvent {
  id: string;
  user_id: string;
  user_name: string;
  event_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

interface CashbackTx {
  id: string;
  user_id: string;
  user_name: string;
  type: string;
  amount: number;
  source: string | null;
  description_ar: string | null;
  created_at: string;
}

const levelConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  bronze:   { label: 'برونزي',  color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Medal },
  silver:   { label: 'فضي',     color: 'text-slate-600',  bg: 'bg-slate-100',  icon: Star },
  gold:     { label: 'ذهبي',    color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Trophy },
  platinum: { label: 'بلاتيني', color: 'text-cyan-700',   bg: 'bg-cyan-100',   icon: Award },
};

export default function AdminRewards() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserRewardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [safedealFilter, setSafedealFilter] = useState('all');
  const [stats, setStats] = useState({
    total_users: 0, bronze: 0, silver: 0, gold: 0, platinum: 0,
    total_cashback: 0, total_earned: 0, total_redeemed: 0,
    total_referrals: 0, referral_users: 0,
    safedeal_count: 0, total_points: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [recentTx, setRecentTx] = useState<CashbackTx[]>([]);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchRecentEvents(), fetchRecentTx()]);
    setLoading(false);
  }, []);

  const fetchUsers = async () => {
    const [profilesRes, repRes, walletRes, referralRes, safedealRes, safedealDealsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone').order('created_at', { ascending: false }).limit(200),
      supabase.from('reputation_scores').select('user_id, level, total_points'),
      supabase.from('cashback_wallet').select('user_id, balance, total_earned, total_redeemed'),
      supabase.from('referral_codes').select('user_id, code, uses_count, total_rewards_earned'),
      supabase.from('safedeal_certifications').select('user_id, clean_deals_count').eq('is_active', true),
      supabase.from('safedeal_deals').select('seller_id').eq('status', 'completed').eq('buyer_confirmed', true),
    ]);

    const profiles = profilesRes.data || [];
    const repMap = new Map((repRes.data || []).map(r => [r.user_id, r]));
    const walletMap = new Map((walletRes.data || []).map(w => [w.user_id, w]));
    const referralMap = new Map((referralRes.data || []).map(r => [r.user_id, r]));
    const safedealSet = new Map((safedealRes.data || []).map(s => [s.user_id, s.clean_deals_count]));
    const dealCountMap = new Map<string, number>();
    (safedealDealsRes.data || []).forEach(d => {
      dealCountMap.set(d.seller_id, (dealCountMap.get(d.seller_id) || 0) + 1);
    });

    const combined: UserRewardSummary[] = profiles.map(p => ({
      user_id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      level: repMap.get(p.id)?.level || 'bronze',
      total_points: repMap.get(p.id)?.total_points || 0,
      wallet_balance: Number(walletMap.get(p.id)?.balance || 0),
      total_earned: Number(walletMap.get(p.id)?.total_earned || 0),
      total_redeemed: Number(walletMap.get(p.id)?.total_redeemed || 0),
      referral_code: referralMap.get(p.id)?.code || null,
      referral_uses: referralMap.get(p.id)?.uses_count || 0,
      referral_rewards: Number(referralMap.get(p.id)?.total_rewards_earned || 0),
      has_safedeal: safedealSet.has(p.id),
      safedeal_deals: dealCountMap.get(p.id) || 0,
    }));

    setUsers(combined);
    setStats({
      total_users: combined.length,
      bronze: combined.filter(u => u.level === 'bronze').length,
      silver: combined.filter(u => u.level === 'silver').length,
      gold: combined.filter(u => u.level === 'gold').length,
      platinum: combined.filter(u => u.level === 'platinum').length,
      total_cashback: combined.reduce((s, u) => s + u.wallet_balance, 0),
      total_earned: combined.reduce((s, u) => s + u.total_earned, 0),
      total_redeemed: combined.reduce((s, u) => s + u.total_redeemed, 0),
      total_referrals: combined.reduce((s, u) => s + u.referral_uses, 0),
      referral_users: combined.filter(u => u.referral_code).length,
      safedeal_count: combined.filter(u => u.has_safedeal).length,
      total_points: combined.reduce((s, u) => s + u.total_points, 0),
    });
  };

  const fetchRecentEvents = async () => {
    const { data: events } = await supabase
      .from('reputation_events')
      .select('id, user_id, event_type, points, description, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!events || events.length === 0) return setRecentEvents([]);

    const userIds = [...new Set(events.map(e => e.user_id))];
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name').in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    setRecentEvents(events.map(e => ({
      ...e,
      user_name: profileMap.get(e.user_id) || 'مجهول',
    })));
  };

  const fetchRecentTx = async () => {
    const { data: txs } = await supabase
      .from('cashback_transactions')
      .select('id, user_id, type, amount, source, description_ar, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!txs || txs.length === 0) return setRecentTx([]);

    const userIds = [...new Set(txs.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name').in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    setRecentTx(txs.map(t => ({
      ...t,
      user_name: profileMap.get(t.user_id) || 'مجهول',
      amount: Number(t.amount),
    })));
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search.trim() ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search) ||
      (u.referral_code || '').toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'all' || u.level === levelFilter;
    const matchSafedeal = safedealFilter === 'all' ||
      (safedealFilter === 'yes' && u.has_safedeal) ||
      (safedealFilter === 'no' && !u.has_safedeal);
    return matchSearch && matchLevel && matchSafedeal;
  });

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview',   label: 'نظرة عامة',   icon: BarChart2 },
    { id: 'reputation', label: 'السمعة',       icon: Trophy },
    { id: 'cashback',   label: 'الكاش باك',   icon: Wallet },
    { id: 'referral',   label: 'الإحالات',    icon: Users },
    { id: 'safedeal',   label: 'الصفقة المضمونة', icon: ShieldCheck },
  ];

  return (
    <div dir="rtl" className="space-y-6 relative">
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all ${
          toastMsg.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toastMsg.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إدارة المكافآت</h1>
          <p className="text-gray-500 text-sm mt-0.5">إدارة شاملة لنظام السمعة، الكاش باك، الإحالات، والصفقة المضمونة</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading && activeTab === 'overview' ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} recentEvents={recentEvents} recentTx={recentTx} />
          )}
          {activeTab === 'reputation' && (
            <ReputationTab
              users={filteredUsers}
              allUsers={users}
              search={search}
              setSearch={setSearch}
              levelFilter={levelFilter}
              setLevelFilter={setLevelFilter}
              recentEvents={recentEvents}
              onRefresh={fetchAll}
              showToast={showToast}
            />
          )}
          {activeTab === 'cashback' && (
            <CashbackTab
              users={filteredUsers}
              allUsers={users}
              search={search}
              setSearch={setSearch}
              recentTx={recentTx}
              onRefresh={fetchAll}
              showToast={showToast}
            />
          )}
          {activeTab === 'referral' && (
            <ReferralTab
              users={filteredUsers}
              search={search}
              setSearch={setSearch}
              onRefresh={fetchAll}
              showToast={showToast}
            />
          )}
          {activeTab === 'safedeal' && (
            <SafeDealTab
              users={filteredUsers}
              search={search}
              setSearch={setSearch}
              safedealFilter={safedealFilter}
              setSafedealFilter={setSafedealFilter}
              onRefresh={fetchAll}
              showToast={showToast}
            />
          )}
        </>
      )}
    </div>
  );
}

function OverviewTab({ stats, recentEvents, recentTx }: {
  stats: any;
  recentEvents: RecentEvent[];
  recentTx: CashbackTx[];
}) {
  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.total_users, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
    { label: 'إجمالي النقاط', value: stats.total_points.toLocaleString('ar-SA'), icon: Trophy, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100' },
    { label: 'رصيد الكاش باك', value: `${stats.total_cashback.toFixed(0)} ر.س`, icon: Wallet, bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' },
    { label: 'إجمالي مكتسب', value: `${stats.total_earned.toFixed(0)} ر.س`, icon: ArrowUpRight, bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'إجمالي مُستخدم', value: `${stats.total_redeemed.toFixed(0)} ر.س`, icon: ArrowDownRight, bg: 'bg-red-50', color: 'text-red-500', border: 'border-red-100' },
    { label: 'إجمالي الإحالات', value: stats.total_referrals, icon: Gift, bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-100' },
    { label: 'مستخدمو الإحالة', value: stats.referral_users, icon: Hash, bg: 'bg-pink-50', color: 'text-pink-600', border: 'border-pink-100' },
    { label: 'صفقة مضمونة', value: stats.safedeal_count, icon: ShieldCheck, bg: 'bg-teal-50', color: 'text-teal-600', border: 'border-teal-100' },
  ];

  const levelCards = [
    { label: 'برونزي', value: stats.bronze, color: 'text-amber-700', bg: 'bg-amber-100', icon: Medal },
    { label: 'فضي', value: stats.silver, color: 'text-slate-600', bg: 'bg-slate-100', icon: Star },
    { label: 'ذهبي', value: stats.gold, color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Trophy },
    { label: 'بلاتيني', value: stats.platinum, color: 'text-cyan-700', bg: 'bg-cyan-100', icon: Award },
  ];

  const eventTypeLabels: Record<string, string> = {
    fast_reply: 'رد سريع',
    five_star_review: 'تقييم 5 نجوم',
    deal_completed: 'صفقة مكتملة',
    commission_paid_fast: 'عمولة سريعة',
    complaint_proven: 'شكوى مثبتة',
    admin_adjustment: 'تعديل إداري',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`bg-white rounded-2xl border ${s.border} p-4`}>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="font-black text-gray-900 text-sm mb-4">توزيع المستويات</h3>
        <div className="grid grid-cols-4 gap-3">
          {levelCards.map((lc, i) => {
            const Icon = lc.icon;
            const pct = stats.total_users > 0 ? Math.round((lc.value / stats.total_users) * 100) : 0;
            return (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 rounded-2xl ${lc.bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-6 h-6 ${lc.color}`} />
                </div>
                <p className={`text-2xl font-black ${lc.color}`}>{lc.value}</p>
                <p className="text-xs text-gray-500">{lc.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-black text-gray-900 text-sm">آخر أحداث السمعة</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">لا توجد أحداث</div>
            ) : recentEvents.slice(0, 15).map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${e.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {e.points > 0
                    ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                    : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{e.user_name}</p>
                  <p className="text-xs text-gray-400">{eventTypeLabels[e.event_type] || e.event_type}</p>
                </div>
                <span className={`font-black text-xs ${e.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {e.points > 0 ? '+' : ''}{e.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            <h3 className="font-black text-gray-900 text-sm">آخر معاملات الكاش باك</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {recentTx.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">لا توجد معاملات</div>
            ) : recentTx.slice(0, 15).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'earned' || tx.type === 'referral_bonus' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {tx.type === 'earned' || tx.type === 'referral_bonus'
                    ? <Plus className="w-3.5 h-3.5 text-green-600" />
                    : <Minus className="w-3.5 h-3.5 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{tx.user_name}</p>
                  <p className="text-xs text-gray-400 truncate">{tx.description_ar || tx.type}</p>
                </div>
                <span className={`font-black text-xs ${
                  tx.type === 'earned' || tx.type === 'referral_bonus' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {tx.type === 'earned' || tx.type === 'referral_bonus' ? '+' : '-'}{tx.amount.toFixed(2)} ر.س
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchFilterBar({ search, setSearch, children }: {
  search: string;
  setSearch: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف..."
          className="w-full pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>
      {children}
    </div>
  );
}

function AdjustModal({ user, type, onClose, onConfirm }: {
  user: UserRewardSummary;
  type: 'points' | 'cashback';
  onClose: () => void;
  onConfirm: (value: number, reason: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [op, setOp] = useState<'add' | 'subtract'>('add');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value || !reason.trim()) return;
    setLoading(true);
    const numeric = parseFloat(value) * (op === 'subtract' ? -1 : 1);
    await onConfirm(numeric, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">
            تعديل {type === 'points' ? 'نقاط السمعة' : 'رصيد الكاش باك'} — {user.full_name}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">الحالي:</p>
            <p className="font-black text-gray-900 text-lg">
              {type === 'points'
                ? `${user.total_points.toLocaleString('ar-SA')} نقطة`
                : `${user.wallet_balance.toFixed(2)} ر.س`
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOp('add')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                op === 'add' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4" /> إضافة
            </button>
            <button
              onClick={() => setOp('subtract')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                op === 'subtract' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Minus className="w-4 h-4" /> خصم
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">
              المبلغ / النقاط
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={type === 'points' ? 'عدد النقاط' : 'المبلغ بالريال'}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">سبب التعديل</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: مكافأة خاصة، تصحيح خطأ..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          {value && reason && (
            <div className={`p-3 rounded-xl text-sm font-bold ${op === 'add' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              سيتم {op === 'add' ? 'إضافة' : 'خصم'} {value} {type === 'points' ? 'نقطة' : 'ر.س'}
              {type === 'points'
                ? ` — الجديد: ${Math.max(0, user.total_points + parseFloat(value) * (op === 'subtract' ? -1 : 1)).toLocaleString('ar-SA')} نقطة`
                : ` — الجديد: ${Math.max(0, user.wallet_balance + parseFloat(value) * (op === 'subtract' ? -1 : 1)).toFixed(2)} ر.س`
              }
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !value || !reason.trim()}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري...' : 'تأكيد التعديل'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReputationTab({ users, allUsers, search, setSearch, levelFilter, setLevelFilter, recentEvents, onRefresh, showToast }: {
  users: UserRewardSummary[];
  allUsers: UserRewardSummary[];
  search: string;
  setSearch: (v: string) => void;
  levelFilter: string;
  setLevelFilter: (v: string) => void;
  recentEvents: RecentEvent[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [adjustUser, setAdjustUser] = useState<UserRewardSummary | null>(null);
  const [sortBy, setSortBy] = useState<'points_desc' | 'points_asc' | 'name'>('points_desc');

  const sorted = [...users].sort((a, b) => {
    if (sortBy === 'points_desc') return b.total_points - a.total_points;
    if (sortBy === 'points_asc') return a.total_points - b.total_points;
    return a.full_name.localeCompare(b.full_name, 'ar');
  });

  const handleAdjust = async (value: number, reason: string) => {
    if (!adjustUser) return;
    const { error } = await supabase.rpc('admin_adjust_reputation_points', {
      p_user_id: adjustUser.user_id,
      p_points: value,
      p_reason: reason,
    });
    if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
    showToast('تم تعديل النقاط بنجاح');
    await onRefresh();
  };

  const eventTypeLabels: Record<string, string> = {
    fast_reply: 'رد سريع', five_star_review: 'تقييم 5 نجوم',
    deal_completed: 'صفقة مكتملة', commission_paid_fast: 'عمولة سريعة',
    complaint_proven: 'شكوى مثبتة', admin_adjustment: 'تعديل إداري',
  };

  const levelDist = ['bronze', 'silver', 'gold', 'platinum'].map(l => ({
    level: l,
    count: allUsers.filter(u => u.level === l).length,
    pct: allUsers.length > 0 ? (allUsers.filter(u => u.level === l).length / allUsers.length) * 100 : 0,
  }));

  return (
    <div className="space-y-5">
      {adjustUser && (
        <AdjustModal
          user={adjustUser}
          type="points"
          onClose={() => setAdjustUser(null)}
          onConfirm={handleAdjust}
        />
      )}

      <div className="grid grid-cols-4 gap-3">
        {levelDist.map(ld => {
          const cfg = levelConfig[ld.level];
          const Icon = cfg.icon;
          return (
            <div key={ld.level} className={`bg-white rounded-2xl border border-gray-100 p-4`}>
              <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <p className={`text-2xl font-black ${cfg.color}`}>{ld.count}</p>
              <p className="text-xs text-gray-400">{cfg.label} • {ld.pct.toFixed(0)}%</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div className={`h-full rounded-full ${cfg.bg.replace('bg-', 'bg-')}`} style={{ width: `${ld.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm">جدول نقاط السمعة</h3>
            <span className="text-xs text-gray-400">{users.length} مستخدم</span>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch}>
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="all">كل المستويات</option>
              <option value="bronze">برونزي</option>
              <option value="silver">فضي</option>
              <option value="gold">ذهبي</option>
              <option value="platinum">بلاتيني</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="points_desc">الأعلى نقاطاً</option>
              <option value="points_asc">الأقل نقاطاً</option>
              <option value="name">الاسم</option>
            </select>
          </SearchFilterBar>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">#</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">المستوى</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">النقاط</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">ردود سريعة</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">5 نجوم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((u, idx) => {
                const lvl = levelConfig[u.level] || levelConfig.bronze;
                const LvlIcon = lvl.icon;
                return (
                  <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                      <p className="text-gray-400 text-xs">{u.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${lvl.bg} ${lvl.color}`}>
                        <LvlIcon className="w-3 h-3" />
                        {lvl.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-black text-gray-900 text-sm">{u.total_points.toLocaleString('ar-SA')}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">—</td>
                    <td className="px-4 py-3 text-xs text-gray-600">—</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAdjustUser(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        تعديل النقاط
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد نتائج</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">سجل أحداث السمعة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">نوع الحدث</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">النقاط</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الوصف</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentEvents.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-gray-900 text-xs">{e.user_name}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      e.event_type === 'admin_adjustment' ? 'bg-blue-100 text-blue-700' :
                      e.event_type === 'complaint_proven' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                    }`}>
                      {eventTypeLabels[e.event_type] || e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-black text-sm ${e.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {e.points > 0 ? '+' : ''}{e.points}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{e.description || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {new Date(e.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentEvents.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد أحداث</div>
          )}
        </div>
      </div>
    </div>
  );
}

const eventTypeLabels: Record<string, string> = {
  fast_reply: 'رد سريع', five_star_review: 'تقييم 5 نجوم',
  deal_completed: 'صفقة مكتملة', commission_paid_fast: 'عمولة سريعة',
  complaint_proven: 'شكوى مثبتة', admin_adjustment: 'تعديل إداري',
};

function CashbackTab({ users, allUsers, search, setSearch, recentTx, onRefresh, showToast }: {
  users: UserRewardSummary[];
  allUsers: UserRewardSummary[];
  search: string;
  setSearch: (v: string) => void;
  recentTx: CashbackTx[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [adjustUser, setAdjustUser] = useState<UserRewardSummary | null>(null);
  const [sortBy, setSortBy] = useState<'balance_desc' | 'earned_desc' | 'name'>('balance_desc');
  const [filterActive, setFilterActive] = useState('all');

  const sorted = [...users]
    .filter(u => filterActive === 'all' || (filterActive === 'active' && u.wallet_balance > 0) || (filterActive === 'zero' && u.wallet_balance === 0))
    .sort((a, b) => {
      if (sortBy === 'balance_desc') return b.wallet_balance - a.wallet_balance;
      if (sortBy === 'earned_desc') return b.total_earned - a.total_earned;
      return a.full_name.localeCompare(b.full_name, 'ar');
    });

  const handleAdjust = async (value: number, reason: string) => {
    if (!adjustUser) return;
    const txType = value > 0 ? 'earned' : 'redeemed';
    const { error } = await supabase.rpc('admin_adjust_cashback', {
      p_user_id: adjustUser.user_id,
      p_amount: value,
      p_reason: reason,
      p_type: txType,
    });
    if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
    showToast('تم تعديل الرصيد بنجاح');
    await onRefresh();
  };

  const totalBalance = allUsers.reduce((s, u) => s + u.wallet_balance, 0);
  const totalEarned = allUsers.reduce((s, u) => s + u.total_earned, 0);
  const totalRedeemed = allUsers.reduce((s, u) => s + u.total_redeemed, 0);
  const activeWallets = allUsers.filter(u => u.wallet_balance > 0).length;

  return (
    <div className="space-y-5">
      {adjustUser && (
        <AdjustModal
          user={adjustUser}
          type="cashback"
          onClose={() => setAdjustUser(null)}
          onConfirm={handleAdjust}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الأرصدة', value: `${totalBalance.toFixed(0)} ر.س`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'إجمالي مكتسب', value: `${totalEarned.toFixed(0)} ر.س`, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'إجمالي مُستخدم', value: `${totalRedeemed.toFixed(0)} ر.س`, icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'محافظ نشطة', value: activeWallets, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm">محافظ الكاش باك</h3>
            <span className="text-xs text-gray-400">{sorted.length} مستخدم</span>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch}>
            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="active">رصيد إيجابي</option>
              <option value="zero">رصيد صفر</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="balance_desc">الأعلى رصيداً</option>
              <option value="earned_desc">الأعلى مكتسباً</option>
              <option value="name">الاسم</option>
            </select>
          </SearchFilterBar>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الرصيد الحالي</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">إجمالي مكتسب</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">إجمالي مُستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                    <p className="text-gray-400 text-xs">{u.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-black text-sm ${u.wallet_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {u.wallet_balance.toFixed(2)} ر.س
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-emerald-600 font-bold">{u.total_earned.toFixed(2)} ر.س</td>
                  <td className="px-4 py-3 text-xs text-red-500 font-bold">{u.total_redeemed.toFixed(2)} ر.س</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setAdjustUser(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      تعديل الرصيد
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد نتائج</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">آخر معاملات الكاش باك</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">النوع</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">المبلغ</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">المصدر</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الوصف</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTx.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 text-xs font-semibold text-gray-800">{tx.user_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      tx.type === 'earned' || tx.type === 'referral_bonus' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'earned' ? 'مكتسب' : tx.type === 'referral_bonus' ? 'إحالة' : tx.type === 'redeemed' ? 'مُستخدم' : tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-black text-sm ${tx.type === 'earned' || tx.type === 'referral_bonus' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'earned' || tx.type === 'referral_bonus' ? '+' : '-'}{tx.amount.toFixed(2)} ر.س
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{tx.source || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 max-w-32 truncate">{tx.description_ar || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentTx.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد معاملات</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReferralTab({ users, search, setSearch, onRefresh, showToast }: {
  users: UserRewardSummary[];
  search: string;
  setSearch: (v: string) => void;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [sortBy, setSortBy] = useState<'uses_desc' | 'rewards_desc' | 'name'>('uses_desc');
  const [filterHasCode, setFilterHasCode] = useState('all');

  const sorted = [...users]
    .filter(u => filterHasCode === 'all' || (filterHasCode === 'yes' && u.referral_code) || (filterHasCode === 'no' && !u.referral_code))
    .sort((a, b) => {
      if (sortBy === 'uses_desc') return b.referral_uses - a.referral_uses;
      if (sortBy === 'rewards_desc') return b.referral_rewards - a.referral_rewards;
      return a.full_name.localeCompare(b.full_name, 'ar');
    });

  const handleGenerate = async (userId: string, name: string) => {
    const { error } = await supabase.rpc('admin_reset_referral_code', { p_user_id: userId });
    if (error) { showToast('حدث خطأ', 'error'); return; }
    showToast(`تم إنشاء كود جديد لـ ${name}`);
    await onRefresh();
  };

  const handleReset = async (userId: string, name: string) => {
    if (!confirm(`هل تريد إعادة ضبط كود الإحالة لـ ${name}؟ سيُنشأ كود جديد.`)) return;
    await handleGenerate(userId, name);
  };

  const totalUses = users.reduce((s, u) => s + u.referral_uses, 0);
  const totalRewards = users.reduce((s, u) => s + u.referral_rewards, 0);
  const usersWithCode = users.filter(u => u.referral_code).length;
  const usersWithUses = users.filter(u => u.referral_uses > 0).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'لديهم كود', value: usersWithCode, icon: Hash, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'إجمالي الإحالات', value: totalUses, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'إجمالي المكافآت', value: `${totalRewards.toFixed(0)} ر.س`, icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'بائعون فعّالون', value: usersWithUses, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm">أكواد الإحالة</h3>
            <span className="text-xs text-gray-400">{sorted.length} مستخدم</span>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch}>
            <select
              value={filterHasCode}
              onChange={e => setFilterHasCode(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="yes">لديه كود</option>
              <option value="no">بدون كود</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="uses_desc">الأكثر إحالات</option>
              <option value="rewards_desc">الأعلى مكافآت</option>
              <option value="name">الاسم</option>
            </select>
          </SearchFilterBar>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">كود الإحالة</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الاستخدامات</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">المكافآت</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                    <p className="text-gray-400 text-xs">{u.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.referral_code ? (
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                        {u.referral_code}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">لا يوجد كود</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-black text-sm ${u.referral_uses > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {u.referral_uses}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-sm ${u.referral_rewards > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {u.referral_rewards.toFixed(2)} ر.س
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!u.referral_code ? (
                        <button
                          onClick={() => handleGenerate(u.user_id, u.full_name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          إنشاء كود
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReset(u.user_id, u.full_name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          إعادة ضبط
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد نتائج</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SafeDealTab({ users, search, setSearch, safedealFilter, setSafedealFilter, onRefresh, showToast }: {
  users: UserRewardSummary[];
  search: string;
  setSearch: (v: string) => void;
  safedealFilter: string;
  setSafedealFilter: (v: string) => void;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [sortBy, setSortBy] = useState<'deals_desc' | 'name'>('deals_desc');
  const [grantModal, setGrantModal] = useState<{ user: UserRewardSummary; action: 'grant' | 'revoke' } | null>(null);
  const [dealsCount, setDealsCount] = useState('3');
  const [grantLoading, setGrantLoading] = useState(false);

  const sorted = [...users]
    .filter(u => safedealFilter === 'all' || (safedealFilter === 'yes' && u.has_safedeal) || (safedealFilter === 'no' && !u.has_safedeal))
    .sort((a, b) => {
      if (sortBy === 'deals_desc') return b.safedeal_deals - a.safedeal_deals;
      return a.full_name.localeCompare(b.full_name, 'ar');
    });

  const handleGrant = async () => {
    if (!grantModal) return;
    setGrantLoading(true);
    const { error } = await supabase.rpc('admin_grant_safedeal', {
      p_user_id: grantModal.user.user_id,
      p_grant: grantModal.action === 'grant',
      p_deals_count: parseInt(dealsCount) || 3,
    });
    if (error) { showToast('حدث خطأ', 'error'); setGrantLoading(false); return; }
    showToast(grantModal.action === 'grant'
      ? `تم منح شارة الصفقة المضمونة لـ ${grantModal.user.full_name}`
      : `تم سحب شارة الصفقة المضمونة من ${grantModal.user.full_name}`
    );
    setGrantModal(null);
    setGrantLoading(false);
    await onRefresh();
  };

  const certified = users.filter(u => u.has_safedeal).length;
  const eligible = users.filter(u => !u.has_safedeal && u.safedeal_deals >= 3).length;
  const inProgress = users.filter(u => !u.has_safedeal && u.safedeal_deals > 0 && u.safedeal_deals < 3).length;

  return (
    <div className="space-y-5">
      {grantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-black text-gray-900">
                {grantModal.action === 'grant' ? 'منح' : 'سحب'} شارة الصفقة المضمونة
              </h3>
              <button onClick={() => setGrantModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className={`p-4 rounded-xl ${grantModal.action === 'grant' ? 'bg-teal-50' : 'bg-red-50'}`}>
                <p className={`font-bold text-sm ${grantModal.action === 'grant' ? 'text-teal-700' : 'text-red-700'}`}>
                  {grantModal.action === 'grant' ? 'سيتم منح' : 'سيتم سحب'} الشارة {grantModal.action === 'grant' ? 'من' : 'من'} {grantModal.user.full_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">صفقاته الحالية: {grantModal.user.safedeal_deals}</p>
              </div>
              {grantModal.action === 'grant' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">عدد الصفقات المسجّلة</label>
                  <input
                    type="number"
                    value={dealsCount}
                    onChange={e => setDealsCount(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    dir="ltr"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setGrantModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleGrant}
                disabled={grantLoading}
                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                  grantModal.action === 'grant' ? 'bg-teal-500 hover:bg-teal-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {grantLoading ? 'جاري...' : grantModal.action === 'grant' ? 'منح الشارة' : 'سحب الشارة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'موثّقون', value: certified, icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
          { label: 'مؤهلون (3+ صفقات)', value: eligible, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'قيد التقدم', value: inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`bg-white rounded-2xl border ${s.border} p-4`}>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm">إدارة الصفقة المضمونة</h3>
            <span className="text-xs text-gray-400">{sorted.length} مستخدم</span>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch}>
            <select
              value={safedealFilter}
              onChange={e => setSafedealFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="yes">موثّق</option>
              <option value="no">غير موثّق</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="deals_desc">الأكثر صفقات</option>
              <option value="name">الاسم</option>
            </select>
          </SearchFilterBar>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الصفقات المكتملة</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">التقدم نحو 3</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(u => {
                const progress = Math.min(100, (u.safedeal_deals / 3) * 100);
                return (
                  <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                      <p className="text-gray-400 text-xs">{u.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {u.has_safedeal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          موثّق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">
                          <X className="w-3 h-3" />
                          غير موثّق
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-black text-sm ${u.safedeal_deals >= 3 ? 'text-teal-600' : u.safedeal_deals > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {u.safedeal_deals}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{u.safedeal_deals}/3</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!u.has_safedeal ? (
                          <button
                            onClick={() => setGrantModal({ user: u, action: 'grant' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            <UserCheck className="w-3 h-3" />
                            منح الشارة
                          </button>
                        ) : (
                          <button
                            onClick={() => setGrantModal({ user: u, action: 'revoke' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            <UserX className="w-3 h-3" />
                            سحب الشارة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد نتائج</div>
          )}
        </div>
      </div>
    </div>
  );
}
