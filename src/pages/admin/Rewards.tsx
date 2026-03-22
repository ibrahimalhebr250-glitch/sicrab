import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Trophy, Wallet, Users, ShieldCheck, TrendingUp, Star,
  Gift, Medal, Award, RefreshCw, Search, ChevronDown
} from 'lucide-react';

interface UserRewardSummary {
  user_id: string;
  full_name: string;
  phone: string | null;
  level: string;
  total_points: number;
  wallet_balance: number;
  referral_code: string | null;
  referral_uses: number;
  has_safedeal: boolean;
}

export default function AdminRewards() {
  const [users, setUsers] = useState<UserRewardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total_users: 0,
    platinum_users: 0,
    gold_users: 0,
    total_cashback: 0,
    total_referrals: 0,
    safedeal_count: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, repRes, walletRes, referralRes, safedealRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone').order('created_at', { ascending: false }).limit(100),
      supabase.from('reputation_scores').select('user_id, level, total_points'),
      supabase.from('cashback_wallet').select('user_id, balance'),
      supabase.from('referral_codes').select('user_id, code, uses_count'),
      supabase.from('safedeal_certifications').select('user_id').eq('is_active', true),
    ]);

    const profiles = profilesRes.data || [];
    const repMap = new Map((repRes.data || []).map(r => [r.user_id, r]));
    const walletMap = new Map((walletRes.data || []).map(w => [w.user_id, w]));
    const referralMap = new Map((referralRes.data || []).map(r => [r.user_id, r]));
    const safedealSet = new Set((safedealRes.data || []).map(s => s.user_id));

    const combined: UserRewardSummary[] = profiles.map(p => ({
      user_id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      level: repMap.get(p.id)?.level || 'bronze',
      total_points: repMap.get(p.id)?.total_points || 0,
      wallet_balance: Number(walletMap.get(p.id)?.balance || 0),
      referral_code: referralMap.get(p.id)?.code || null,
      referral_uses: referralMap.get(p.id)?.uses_count || 0,
      has_safedeal: safedealSet.has(p.id),
    }));

    setUsers(combined);

    setStats({
      total_users: combined.length,
      platinum_users: combined.filter(u => u.level === 'platinum').length,
      gold_users: combined.filter(u => u.level === 'gold').length,
      total_cashback: combined.reduce((s, u) => s + u.wallet_balance, 0),
      total_referrals: combined.reduce((s, u) => s + u.referral_uses, 0),
      safedeal_count: combined.filter(u => u.has_safedeal).length,
    });

    setLoading(false);
  };

  const filtered = users.filter(u =>
    !search.trim() ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search) ||
    (u.referral_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const levelConfig: Record<string, { label: string; color: string; icon: any }> = {
    bronze: { label: 'برونزي', color: 'bg-amber-100 text-amber-700', icon: Medal },
    silver: { label: 'فضي', color: 'bg-slate-100 text-slate-600', icon: Star },
    gold: { label: 'ذهبي', color: 'bg-yellow-100 text-yellow-700', icon: Trophy },
    platinum: { label: 'بلاتيني', color: 'bg-cyan-100 text-cyan-700', icon: Award },
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إدارة المكافآت</h1>
          <p className="text-gray-500 text-sm mt-0.5">مراقبة نظام السمعة، الكاش باك، والإحالات</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'إجمالي المستخدمين', value: stats.total_users, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
          { label: 'مستوى بلاتيني', value: stats.platinum_users, icon: Award, bg: 'bg-cyan-50', color: 'text-cyan-600', border: 'border-cyan-100' },
          { label: 'مستوى ذهبي', value: stats.gold_users, icon: Trophy, bg: 'bg-yellow-50', color: 'text-yellow-600', border: 'border-yellow-100' },
          { label: 'إجمالي الكاش باك', value: `${stats.total_cashback.toFixed(0)} ر.س`, icon: Wallet, bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' },
          { label: 'الإحالات الناجحة', value: stats.total_referrals, icon: Gift, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100' },
          { label: 'صفقة مضمونة', value: stats.safedeal_count, icon: ShieldCheck, bg: 'bg-teal-50', color: 'text-teal-600', border: 'border-teal-100' },
        ].map((s, i) => {
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="font-black text-gray-900 text-sm">بيانات المستخدمين</h3>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">المستوى</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">النقاط</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الكاش باك</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">كود الإحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الإحالات</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">صفقة مضمونة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  const lvl = levelConfig[u.level] || levelConfig.bronze;
                  const LvlIcon = lvl.icon;
                  return (
                    <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                        <p className="text-gray-400 text-xs">{u.phone || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${lvl.color}`}>
                          <LvlIcon className="w-3 h-3" />
                          {lvl.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-700 text-sm">{u.total_points.toLocaleString('ar-SA')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${u.wallet_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {u.wallet_balance.toFixed(2)} ر.س
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {u.referral_code || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${u.referral_uses > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {u.referral_uses}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.has_safedeal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            موثّق
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">لا توجد نتائج</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
