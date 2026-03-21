import { User, Calendar, Package, UserPlus, UserCheck, Star, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SellerBadge from './SellerBadge';

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

export default function SellerCard({ sellerId, sellerName }: SellerCardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerProfile();
    checkIfFollowing();
  }, [sellerId]);

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

  async function checkIfFollowing() {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_type', 'user')
      .eq('following_id', sellerId)
      .maybeSingle();

    setIsFollowing(!!data);
  }

  async function toggleFollow() {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_type', 'user')
        .eq('following_id', sellerId);

      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_type: 'user',
        following_id: sellerId
      });

      await supabase.from('notifications').insert({
        user_id: sellerId,
        type: 'follow',
        title: 'متابع جديد',
        content: `بدأ ${user.email} بمتابعتك`,
        link: `/user/${sellerId}`
      });

      setIsFollowing(true);
    }
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

          <div className="mb-2">
            <SellerBadge badge={getBadgeType()} size="sm" />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{profile ? getTimeAgo(profile.created_at) : 'عضو جديد'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{profile?.listings_count || 0} إعلان</span>
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
        {user && user.id !== sellerId && (
          <button
            onClick={toggleFollow}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-5 h-5" />
                تتابع
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                متابعة
              </>
            )}
          </button>
        )}
        <a
          href={`/user/${sellerId}`}
          className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all text-center"
        >
          عرض الملف
        </a>
      </div>
    </div>
  );
}
