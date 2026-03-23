import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Trophy, Wallet, Users, ShieldCheck, Copy, Check,
  Zap, TrendingUp, Star, Medal, Award, Gift, ChevronRight,
  Clock, AlertCircle, CheckCircle, Plus, Minus, BarChart2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRewards, ReputationScore } from '../contexts/RewardsContext';
import ReputationBadge, { ReputationProgress } from '../components/ReputationBadge';
import SafeDealBadge from '../components/SafeDealBadge';
import { supabase } from '../lib/supabase';

type Tab = 'overview' | 'reputation' | 'cashback' | 'referral' | 'safedeal';

export default function Rewards() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { reputation, wallet, cashbackTransactions, referralCode, safeDeal, loading, generateReferralCode, refreshAll } = useRewards();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [safeDealCount, setSafeDealCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchSafeDealCount();
    }
  }, [user]);

  const fetchSafeDealCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('safedeal_deals')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'completed')
      .eq('buyer_confirmed', true);
    setSafeDealCount(count || 0);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    await generateReferralCode();
    setGenerating(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const tabs = [
    { id: 'overview' as Tab, label: 'نظرة عامة', icon: BarChart2 },
    { id: 'reputation' as Tab, label: 'السمعة', icon: Trophy },
    { id: 'cashback' as Tab, label: 'المحفظة', icon: Wallet },
    { id: 'referral' as Tab, label: 'الإحالة', icon: Users },
    { id: 'safedeal' as Tab, label: 'مضمونة', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-black text-gray-900">مركز المكافآت</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">مرحباً، {profile.full_name}</p>
              <h2 className="text-2xl font-black mt-0.5">لوحة المكافآت</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{reputation?.total_points?.toLocaleString('ar-SA') || '0'}</p>
              <p className="text-white/80 text-xs font-medium mt-0.5">نقطة سمعة</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{wallet?.balance?.toFixed(0) || '0'}</p>
              <p className="text-white/80 text-xs font-medium mt-0.5">ر.س كاش باك</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{referralCode?.uses_count || '0'}</p>
              <p className="text-white/80 text-xs font-medium mt-0.5">إحالة ناجحة</p>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                    : 'bg-white text-gray-600 border border-gray-100 hover:border-amber-200 hover:text-amber-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && <OverviewTab reputation={reputation} wallet={wallet} safeDeal={safeDeal} referralCode={referralCode} safeDealCount={safeDealCount} onTabChange={setActiveTab} />}
        {activeTab === 'reputation' && <ReputationTab reputation={reputation} userId={user.id} />}
        {activeTab === 'cashback' && <CashbackTab wallet={wallet} transactions={cashbackTransactions} />}
        {activeTab === 'referral' && <ReferralTab referralCode={referralCode} copied={copied} generating={generating} onCopy={handleCopyCode} onGenerate={handleGenerateCode} profile={profile} />}
        {activeTab === 'safedeal' && <SafeDealTab safeDeal={safeDeal} safeDealCount={safeDealCount} user={user} onRefresh={refreshAll} />}
      </div>
    </div>
  );
}

function OverviewTab({ reputation, wallet, safeDeal, referralCode, safeDealCount, onTabChange }: {
  reputation: ReputationScore | null;
  wallet: any;
  safeDeal: any;
  referralCode: any;
  safeDealCount: number;
  onTabChange: (tab: Tab) => void;
}) {
  const items = [
    {
      tab: 'reputation' as Tab,
      icon: Trophy,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'نظام السمعة الذكي',
      desc: 'اكسب نقاطاً بكل تصرف إيجابي في المنصة',
      value: reputation?.total_points ? `${reputation.total_points} نقطة` : '0 نقطة',
      badge: reputation?.level ? getLevelLabel(reputation.level) : 'برونزي',
      badgeColor: getLevelBadgeColor(reputation?.level || 'bronze'),
    },
    {
      tab: 'cashback' as Tab,
      icon: Wallet,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'الكاش باك الذكي',
      desc: 'رصيد قابل للصرف على ترقية إعلاناتك',
      value: `${wallet?.balance?.toFixed(2) || '0.00'} ر.س`,
      badge: `${wallet?.total_earned?.toFixed(0) || '0'} مكتسب`,
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      tab: 'safedeal' as Tab,
      icon: ShieldCheck,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      title: 'الصفقة المضمونة',
      desc: 'شارة ثقة تزيد معدل التواصل مع المشترين',
      value: `${safeDealCount} / 3 صفقات`,
      badge: safeDeal?.is_active ? 'موثّق' : `${Math.max(0, 3 - safeDealCount)} متبقية`,
      badgeColor: safeDeal?.is_active ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600',
    },
    {
      tab: 'referral' as Tab,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'نظام الإحالة المزدوجة',
      desc: 'ادعُ بائعين وكلاكما يكافأ',
      value: `${referralCode?.uses_count || 0} إحالة`,
      badge: `${referralCode?.total_rewards_earned?.toFixed(0) || '0'} ر.س مكافآت`,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={() => onTabChange(item.tab)}
            className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-200 hover:shadow-sm transition-all text-right"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${item.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-gray-900 text-sm">{item.title}</p>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${item.badgeColor}`}>{item.badge}</span>
              </div>
              <p className="text-xs text-gray-500">{item.desc}</p>
              <p className="text-sm font-bold text-gray-700 mt-1">{item.value}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 rotate-180" />
          </button>
        );
      })}
    </div>
  );
}

function getLevelLabel(level: string) {
  const map: Record<string, string> = { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', platinum: 'بلاتيني' };
  return map[level] || 'برونزي';
}

function getLevelBadgeColor(level: string) {
  const map: Record<string, string> = {
    bronze: 'bg-amber-100 text-amber-700',
    silver: 'bg-slate-100 text-slate-600',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-cyan-100 text-cyan-700',
  };
  return map[level] || 'bg-amber-100 text-amber-700';
}

function ReputationTab({ reputation, userId }: { reputation: ReputationScore | null; userId: string }) {
  const [pointActions, setPointActions] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('reputation_point_actions').select('*').order('sort_order'),
      supabase.rpc('get_user_reputation_events', { p_user_id: userId, p_limit: 20 }),
    ]).then(([actionsRes, eventsRes]) => {
      setPointActions(actionsRes.data || []);
      setUserEvents(eventsRes.data || []);
      setLoadingEvents(false);
    });
  }, [userId]);

  const getActionInfo = (key: string) => {
    const found = pointActions.find(a => a.action_key === key);
    if (found) return { label: found.label_ar, category: found.category };
    const fallback: Record<string, { label: string; category: string }> = {
      admin_adjustment: { label: 'تعديل إداري', category: 'admin' },
      complaint_proven: { label: 'شكوى مثبتة', category: 'negative' },
      fast_reply:       { label: 'رد سريع', category: 'positive' },
      five_star_review: { label: 'تقييم 5 نجوم', category: 'positive' },
      deal_completed:   { label: 'صفقة مكتملة', category: 'positive' },
      commission_paid_fast: { label: 'عمولة سريعة', category: 'positive' },
    };
    return fallback[key] || { label: key, category: 'positive' };
  };

  const levels = [
    { id: 'bronze',   label: 'برونزي',  range: '0 - 99',   icon: Medal,  gradient: 'from-amber-600 to-orange-700' },
    { id: 'silver',   label: 'فضي',     range: '100 - 299', icon: Star,   gradient: 'from-slate-400 to-gray-500'  },
    { id: 'gold',     label: 'ذهبي',    range: '300 - 599', icon: Trophy, gradient: 'from-yellow-400 to-amber-500' },
    { id: 'platinum', label: 'بلاتيني', range: '600+',      icon: Award,  gradient: 'from-cyan-400 to-teal-500'   },
  ];

  return (
    <div className="space-y-4">
      {reputation && (
        <ReputationProgress level={reputation.level} points={reputation.total_points} />
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">إحصائياتك</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
          {[
            { label: 'ردود سريعة', value: reputation?.fast_replies || 0, icon: Zap, color: 'text-blue-500' },
            { label: 'تقييمات 5 نجوم', value: reputation?.five_star_reviews || 0, icon: Star, color: 'text-yellow-500' },
            { label: 'صفقات مكتملة', value: reputation?.deals_completed || 0, icon: CheckCircle, color: 'text-green-500' },
            { label: 'شكاوى مثبتة', value: reputation?.complaints_received || 0, icon: AlertCircle, color: 'text-red-500' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="p-4 text-center">
                <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-sm">سجل نقاطك</h3>
          <span className="text-xs text-gray-400">آخر 20 حدث</span>
        </div>
        {loadingEvents ? (
          <div className="p-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : userEvents.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">لا توجد أحداث بعد</p>
            <p className="text-gray-300 text-xs mt-1">أتمّ إجراءات إيجابية لكسب النقاط</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {userEvents.map((e: any) => {
              const info = getActionInfo(e.event_type);
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    e.points > 0 ? 'bg-green-100' : 'bg-red-50'
                  }`}>
                    {e.points > 0
                      ? <Plus className="w-4 h-4 text-green-600" />
                      : <Minus className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium">{e.description || info.label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(e.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`font-black text-sm ${e.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {e.points > 0 ? '+' : ''}{e.points}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pointActions.filter(a => a.category !== 'admin' && a.is_active).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm">كيف تكسب النقاط</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pointActions.filter(a => a.is_active && a.category !== 'admin').map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.category === 'negative' ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  {a.category === 'negative'
                    ? <AlertCircle className="w-4 h-4 text-red-500" />
                    : <CheckCircle className="w-4 h-4 text-green-500" />
                  }
                </div>
                <p className="flex-1 text-sm text-gray-700">{a.label_ar}</p>
                <span className={`font-black text-sm ${a.category === 'negative' ? 'text-red-500' : 'text-green-600'}`}>
                  {a.category === 'negative' ? '-' : '+'}{Math.abs(a.points)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">مستويات السمعة</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {levels.map((lvl) => {
            const Icon = lvl.icon;
            const isCurrent = reputation?.level === lvl.id;
            return (
              <div key={lvl.id} className={`flex items-center gap-3 px-4 py-3 ${isCurrent ? 'bg-amber-50' : ''}`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${lvl.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{lvl.label}</p>
                  <p className="text-xs text-gray-500">{lvl.range} نقطة</p>
                </div>
                {isCurrent && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">مستواك الحالي</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CashbackTab({ wallet, transactions }: { wallet: any; transactions: any[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-sm">رصيد الكاش باك</p>
            <p className="text-3xl font-black">{wallet?.balance?.toFixed(2) || '0.00'} ر.س</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-lg font-black">{wallet?.total_earned?.toFixed(2) || '0.00'}</p>
            <p className="text-white/70 text-xs">إجمالي مكتسب (ر.س)</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-lg font-black">{wallet?.total_redeemed?.toFixed(2) || '0.00'}</p>
            <p className="text-white/70 text-xs">إجمالي مُستخدم (ر.س)</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-800 text-sm mb-1">كيف تستخدم رصيدك؟</p>
            <ul className="space-y-1.5">
              {['ترقية إعلان (مميز أو مثبّت)', 'تمديد إعلان منتهي الصلاحية', 'الظهور في الصفحة الأولى'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-amber-700">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">سجل المعاملات</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">لا توجد معاملات بعد</p>
            <p className="text-gray-300 text-xs mt-1">ابدأ بدفع العمولات أو إتمام الصفقات لكسب الكاش باك</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'earned' || tx.type === 'referral_bonus' ? 'bg-green-100' : 'bg-red-50'
                }`}>
                  {tx.type === 'earned' || tx.type === 'referral_bonus'
                    ? <Plus className="w-4 h-4 text-green-600" />
                    : <Minus className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{tx.description_ar || tx.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`font-black text-sm ${
                  tx.type === 'earned' || tx.type === 'referral_bonus' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {tx.type === 'earned' || tx.type === 'referral_bonus' ? '+' : '-'}{Number(tx.amount).toFixed(2)} ر.س
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferralTab({ referralCode, copied, generating, onCopy, onGenerate, profile }: {
  referralCode: any;
  copied: boolean;
  generating: boolean;
  onCopy: () => void;
  onGenerate: () => void;
  profile: any;
}) {
  const shareText = `انضم معي إلى سوق المشاتل! استخدم كودي ${referralCode?.code || ''} واحصل على خصم 50% على أول عمولة`;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-sm">نظام الإحالة المزدوجة</p>
            <p className="text-2xl font-black">{referralCode?.uses_count || 0} إحالة ناجحة</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-lg font-black">{referralCode?.total_rewards_earned?.toFixed(0) || '0'}</p>
            <p className="text-white/70 text-xs">ر.س مكافآت مكتسبة</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-lg font-black">20%</p>
            <p className="text-white/70 text-xs">خصمك على العمولة</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <h3 className="font-black text-gray-900 text-sm">كود الإحالة الخاص بك</h3>
        {referralCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4">
              <span className="flex-1 text-center text-2xl font-black tracking-widest text-gray-900">
                {referralCode.code}
              </span>
              <button
                onClick={onCopy}
                className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600 hover:bg-amber-100 hover:text-amber-700'}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-center text-green-600 text-xs font-bold">تم النسخ!</p>
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors"
            >
              <Users className="w-4 h-4" />
              مشاركة عبر واتساب
            </a>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-4">لم تحصل على كود إحالة بعد</p>
            <button
              onClick={onGenerate}
              disabled={generating}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {generating ? 'جاري الإنشاء...' : 'إنشاء كود الإحالة'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">كيف تعمل الإحالة؟</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { step: '1', title: 'شارك كودك', desc: 'أرسل كودك لبائع تعرفه يريد الانضمام', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { step: '2', title: 'يسجّل ويستخدم الكود', desc: 'البائع الجديد يسجّل في المنصة ويدخل كودك', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
            { step: '3', title: 'كلاكما يكافأ', desc: 'أنت: خصم 20% على عمولتك القادمة | هو: أول عمولة بخصم 50%', icon: Gift, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-4">
                <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${step.color}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SafeDealTab({ safeDeal, safeDealCount, user, onRefresh }: { safeDeal: any; safeDealCount: number; user: any; onRefresh: () => void }) {
  const [listingId, setListingId] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myListings, setMyListings] = useState<any[]>([]);

  useEffect(() => {
    fetchMyListings();
  }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('listings')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(20);
    setMyListings(data || []);
  };

  const handleSubmit = async () => {
    if (!listingId || !dealAmount || !user) return;
    setSubmitting(true);
    await supabase.from('safedeal_deals').insert({
      seller_id: user.id,
      buyer_id: user.id,
      listing_id: listingId,
      deal_amount: parseFloat(dealAmount),
      status: 'completed',
      seller_confirmed: true,
    });
    await supabase.rpc('check_safedeal_certification', { p_seller_id: user.id });
    setSubmitted(true);
    setListingId('');
    setBuyerPhone('');
    setDealAmount('');
    await onRefresh();
    setSubmitting(false);
  };

  const progress = Math.min(100, (safeDealCount / 3) * 100);

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-5 ${safeDeal?.is_active ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white' : 'bg-white border border-gray-100'}`}>
        {safeDeal?.is_active ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <p className="text-2xl font-black mb-1">بائع موثّق!</p>
            <p className="text-white/80 text-sm">لديك شارة الصفقة المضمونة</p>
            <p className="text-white/70 text-xs mt-2">{safeDeal.clean_deals_count} صفقة مضمونة مكتملة</p>
            <div className="mt-4 bg-white/15 rounded-xl p-3">
              <SafeDealBadge size="lg" />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm">شارة الصفقة المضمونة</p>
                <p className="text-gray-500 text-xs">أتمّ 3 صفقات مضمونة للحصول عليها</p>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{safeDealCount} / 3 صفقات</span>
              <span className="text-xs text-gray-400">{3 - safeDealCount} متبقية</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <h3 className="font-black text-gray-900 text-sm">تسجيل صفقة مكتملة</h3>
        {submitted && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            تم تسجيل الصفقة بنجاح!
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">الإعلان المتعلق بالصفقة</label>
          <select
            value={listingId}
            onChange={e => setListingId(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-right"
          >
            <option value="">اختر إعلاناً...</option>
            {myListings.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">قيمة الصفقة (ر.س)</label>
          <input
            type="number"
            value={dealAmount}
            onChange={e => setDealAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            dir="ltr"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !listingId || !dealAmount}
          className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'جاري التسجيل...' : 'تسجيل الصفقة'}
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-sm">فوائد شارة الصفقة المضمونة</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { icon: ShieldCheck, text: 'شارة مرئية على جميع إعلاناتك', color: 'text-teal-500', bg: 'bg-teal-50' },
            { icon: TrendingUp, text: 'زيادة معدل التواصل من المشترين', color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Star, text: 'ظهور أعلى في نتائج البحث', color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { icon: Users, text: 'ثقة أكبر مع المشترين الجدد', color: 'text-green-500', bg: 'bg-green-50' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className="text-sm text-gray-700">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
