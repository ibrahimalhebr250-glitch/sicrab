import { User, Calendar, Package, Star, Shield, UserPlus, UserMinus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SellerBadge from './SellerBadge';
import SafeDealBadge from './SafeDealBadge';
import ReputationBadge from './ReputationBadge';

interface SellerCardProps {
  sellerId: string;
  sellerName: string;
}

interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  listings_count: number;
  average_rating: number;
  total_reviews: number;
  phone_verified: boolean;
  reports_count: number;
  last_active_at: string;
}

interface SellerRewards {
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_points: number;
  hasSafeDeal: boolean;
}

export default function SellerCard({ sellerId, sellerName }: SellerCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<SellerRewards | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [followAnimated, setFollowAnimated] = useState(false);

  useEffect(() => {
    loadSellerProfile();
    loadSellerRewards();
    loadFollowState();
  }, [sellerId]);

  async function loadFollowState() {
    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', sellerId);
    setFollowersCount(count || 0);

    if (!user || user.id === sellerId) return;
    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', sellerId)
      .maybeSingle();
    if (data) {
      setIsFollowing(true);
      setFollowId(data.id);
    }
  }

  async function handleFollow() {
    if (!user) { navigate('/login'); return; }
    if (user.id === sellerId) return;
    setFollowLoading(true);
    if (isFollowing && followId) {
      await supabase.from('user_follows').delete().eq('id', followId);
      setIsFollowing(false);
      setFollowId(null);
      setFollowersCount(c => Math.max(0, c - 1));
    } else {
      const { data } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: sellerId })
        .select('id')
        .maybeSingle();
      if (data) {
        setIsFollowing(true);
        setFollowId(data.id);
        setFollowersCount(c => c + 1);
        setFollowAnimated(true);
        setTimeout(() => setFollowAnimated(false), 600);
      }
    }
    setFollowLoading(false);
  }

  async function loadSellerRewards() {
    const [{ data: repData }, { data: sdData }] = await Promise.all([
      supabase.from('reputation_scores').select('level, total_points').eq('user_id', sellerId).maybeSingle(),
      supabase.from('safedeal_certifications').select('is_active').eq('user_id', sellerId).eq('is_active', true).maybeSingle(),
    ]);
    if (repData) {
      setRewards({
        level: repData.level,
        total_points: repData.total_points,
        hasSafeDeal: !!sdData,
      });
    }
  }

  async function loadSellerProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sellerId)
      .maybeSingle();

    if (error) {
      console.error('Error loading seller profile:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  }

  function getTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInDays < 30) return `منذ ${diffInDays} يوم`;
    if (diffInMonths < 12) return `منذ ${diffInMonths} شهر`;
    return `منذ ${diffInYears} سنة`;
  }

  function getActivityStatus() {
    if (!profile?.last_active_at) return 'غير نشط';

    const now = new Date();
    const lastActive = new Date(profile.last_active_at);
    const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) return 'نشط اليوم';
    if (diffInHours < 168) return 'نشط هذا الأسبوع';
    return 'غير نشط';
  }

  function getBadgeType(): 'new' | 'active' | 'trusted' {
    if (!profile) return 'new';

    const accountAgeDays = Math.floor(
      (new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (
      accountAgeDays > 30 &&
      profile.listings_count >= 5 &&
      profile.reports_count === 0 &&
      profile.average_rating >= 4.0
    ) {
      return 'trusted';
    } else if (profile.listings_count >= 3 || accountAgeDays > 7) {
      return 'active';
    }
    return 'new';
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse">
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-gray-900 text-lg">{profile?.full_name || sellerName}</h4>
            {profile?.phone_verified && (
              <Shield className="w-4 h-4 text-green-500" title="جوال موثق" />
            )}
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <SellerBadge badge={getBadgeType()} size="sm" />
            {rewards && <ReputationBadge level={rewards.level} points={rewards.total_points} size="sm" />}
            {rewards?.hasSafeDeal && <SafeDealBadge size="sm" />}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{profile ? getTimeAgo(profile.created_at) : 'عضو جديد'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              <span>{profile?.listings_count || 0} إعلان</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className={`transition-all duration-300 ${followAnimated ? 'text-amber-600 font-bold scale-110' : ''}`}>
                {followersCount} متابع
              </span>
            </div>
          </div>

          {profile && profile.total_reviews > 0 && (
            <div className="flex items-center gap-1 mb-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(profile.average_rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {profile.average_rating.toFixed(1)} ({profile.total_reviews})
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500">{getActivityStatus()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/user/${sellerId}`}
          className="flex-1 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all text-center"
        >
          عرض الملف
        </a>
        {user && user.id !== sellerId && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 active:scale-95 ${
              isFollowing
                ? 'bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 border-2 border-gray-200 hover:border-red-200'
                : 'bg-amber-500 hover:bg-amber-600 text-white border-2 border-amber-500 hover:border-amber-600 shadow-sm shadow-amber-200'
            } ${followAnimated ? 'scale-110' : ''}`}
          >
            {followLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isFollowing ? (
              <><UserMinus className="w-4 h-4" /><span>متابَع</span></>
            ) : (
              <><UserPlus className="w-4 h-4" /><span>تابع</span></>
            )}
          </button>
        )}
      </div>

      {followAnimated && (
        <div className="mt-2 text-center">
          <span className="text-xs text-amber-600 font-bold animate-pulse">
            تمت المتابعة! ستظهر إعلاناته في متابعاتك
          </span>
        </div>
      )}
    </div>
  );
}
