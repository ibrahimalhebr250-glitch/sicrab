import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ArrowRight, UserMinus, UserPlus, User, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FollowProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  follow_id: string;
  listing_count: number;
}

type TabType = 'following' | 'followers';

export default function Following() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('following');
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Map<string, string>>(new Map());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [followingRes, followersRes] = await Promise.all([
      supabase
        .from('user_follows')
        .select(`
          id,
          following_id,
          profiles!user_follows_following_id_fkey(
            id, full_name, avatar_url, bio
          )
        `)
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_follows')
        .select(`
          id,
          follower_id,
          profiles!user_follows_follower_id_fkey(
            id, full_name, avatar_url, bio
          )
        `)
        .eq('following_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const followingData: FollowProfile[] = (followingRes.data || [])
      .filter((f: any) => f.profiles)
      .map((f: any) => ({
        ...f.profiles,
        follow_id: f.id,
        listing_count: 0,
      }));

    const followersData: FollowProfile[] = (followersRes.data || [])
      .filter((f: any) => f.profiles)
      .map((f: any) => ({
        ...f.profiles,
        follow_id: f.id,
        listing_count: 0,
      }));

    const allIds = Array.from(new Set([
      ...followingData.map(f => f.id),
      ...followersData.map(f => f.id),
    ]));

    if (allIds.length > 0) {
      const { data: listingCounts } = await supabase
        .from('listings')
        .select('user_id')
        .in('user_id', allIds)
        .eq('is_active', true);

      const countMap = new Map<string, number>();
      (listingCounts || []).forEach((l: any) => {
        countMap.set(l.user_id, (countMap.get(l.user_id) || 0) + 1);
      });

      followingData.forEach(f => { f.listing_count = countMap.get(f.id) || 0; });
      followersData.forEach(f => { f.listing_count = countMap.get(f.id) || 0; });
    }

    const newFollowingMap = new Map<string, string>();
    followingData.forEach(f => newFollowingMap.set(f.id, f.follow_id));

    setFollowing(followingData);
    setFollowers(followersData);
    setFollowingMap(newFollowingMap);
    setLoading(false);
  }, [user]);

  async function unfollow(profileId: string) {
    const followId = followingMap.get(profileId);
    if (!followId) return;
    setActionLoading(profileId);
    const { error } = await supabase.from('user_follows').delete().eq('id', followId);
    if (!error) {
      setFollowing(prev => prev.filter(f => f.id !== profileId));
      setFollowingMap(prev => { const m = new Map(prev); m.delete(profileId); return m; });
    }
    setActionLoading(null);
  }

  async function followBack(profileId: string) {
    if (!user) return;
    setActionLoading(profileId);
    const { data, error } = await supabase
      .from('user_follows')
      .insert({ follower_id: user.id, following_id: profileId })
      .select('id')
      .maybeSingle();

    if (!error) {
      const followId = data?.id || '';
      const profileData = followers.find(f => f.id === profileId);
      if (profileData) {
        setFollowing(prev => [{ ...profileData, follow_id: followId }, ...prev]);
        setFollowingMap(prev => new Map([...prev, [profileId, followId]]));
      }
    }
    setActionLoading(null);
  }

  const displayList = tab === 'following' ? following : followers;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">المتابعات</h1>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                تتابع {following.length} · يتابعك {followers.length}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
              tab === 'following'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            أتابعهم
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              tab === 'following' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {following.length}
            </span>
          </button>
          <button
            onClick={() => setTab('followers')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
              tab === 'followers'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            يتابعونني
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              tab === 'followers' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {followers.length}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-gray-600 font-bold text-base">
              {tab === 'following' ? 'لا تتابع أحداً بعد' : 'لا يتابعك أحد بعد'}
            </p>
            <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">
              {tab === 'following'
                ? 'يمكنك متابعة البائعين من صفحاتهم الشخصية لتبقى على اطلاع بإعلاناتهم'
                : 'شارك ملفك الشخصي ليتابعك الآخرون ويطلعوا على إعلاناتك'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayList.map(profile => {
              const isFollowing = followingMap.has(profile.id);
              const isLoading = actionLoading === profile.id;

              return (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-13 h-13 flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/user/${profile.id}`)}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                    )}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/user/${profile.id}`)}
                  >
                    <p className="font-bold text-gray-900 text-sm truncate">{profile.full_name}</p>
                    {profile.bio ? (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{profile.bio}</p>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Package className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-400">
                          {profile.listing_count > 0
                            ? `${profile.listing_count} إعلان نشط`
                            : 'لا توجد إعلانات'}
                        </span>
                      </div>
                    )}
                    {profile.bio && profile.listing_count > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Package className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-400">{profile.listing_count} إعلان نشط</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {tab === 'following' ? (
                      <button
                        disabled={isLoading}
                        onClick={() => unfollow(profile.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                        إلغاء المتابعة
                      </button>
                    ) : isFollowing ? (
                      <button
                        disabled={isLoading}
                        onClick={() => unfollow(profile.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-red-50 text-blue-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                        تتابعه
                      </button>
                    ) : (
                      <button
                        disabled={isLoading}
                        onClick={() => followBack(profile.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        متابعة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
