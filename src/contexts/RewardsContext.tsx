import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface ReputationScore {
  total_points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  fast_replies: number;
  five_star_reviews: number;
  deals_completed: number;
  complaints_received: number;
}

export interface CashbackWallet {
  balance: number;
  total_earned: number;
  total_redeemed: number;
}

export interface CashbackTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'referral_bonus';
  amount: number;
  source: string | null;
  description_ar: string | null;
  created_at: string;
}

export interface ReferralCode {
  code: string;
  uses_count: number;
  total_rewards_earned: number;
}

export interface SafeDealCert {
  certified_at: string;
  clean_deals_count: number;
  is_active: boolean;
}

interface RewardsContextType {
  reputation: ReputationScore | null;
  wallet: CashbackWallet | null;
  cashbackTransactions: CashbackTransaction[];
  referralCode: ReferralCode | null;
  safeDeal: SafeDealCert | null;
  loading: boolean;
  generateReferralCode: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export function RewardsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [wallet, setWallet] = useState<CashbackWallet | null>(null);
  const [cashbackTransactions, setCashbackTransactions] = useState<CashbackTransaction[]>([]);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [safeDeal, setSafeDeal] = useState<SafeDealCert | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      setReputation(null);
      setWallet(null);
      setCashbackTransactions([]);
      setReferralCode(null);
      setSafeDeal(null);
    }
  }, [user]);

  const refreshAll = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([
      fetchReputation(),
      fetchWallet(),
      fetchCashbackTransactions(),
      fetchReferralCode(),
      fetchSafeDeal(),
    ]);
    setLoading(false);
  };

  const fetchReputation = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setReputation({
        total_points: data.total_points,
        level: data.level,
        fast_replies: data.fast_replies,
        five_star_reviews: data.five_star_reviews,
        deals_completed: data.deals_completed,
        complaints_received: data.complaints_received,
      });
    }
  };

  const fetchWallet = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cashback_wallet')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setWallet({
        balance: Number(data.balance),
        total_earned: Number(data.total_earned),
        total_redeemed: Number(data.total_redeemed),
      });
    }
  };

  const fetchCashbackTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cashback_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setCashbackTransactions(data || []);
  };

  const fetchReferralCode = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('referral_codes')
      .select('code, uses_count, total_rewards_earned')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setReferralCode(data);
  };

  const fetchSafeDeal = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('safedeal_certifications')
      .select('certified_at, clean_deals_count, is_active')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setSafeDeal(data);
  };

  const generateReferralCode = async () => {
    if (!user) return;
    const { data } = await supabase.rpc('generate_referral_code', { p_user_id: user.id });
    if (data) await fetchReferralCode();
  };

  return (
    <RewardsContext.Provider value={{
      reputation,
      wallet,
      cashbackTransactions,
      referralCode,
      safeDeal,
      loading,
      generateReferralCode,
      refreshAll,
    }}>
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  const context = useContext(RewardsContext);
  if (context === undefined) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
}
