import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ArrowRight, UserMinus, UserPlus, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FollowProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  follow_id: string;
  listing_count?: number;
}

type TabType = 'following' | 'followers';

export default function Following() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('following');
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [followingRes, followersRes] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id, following_id, profiles!user_follows_following_id_fkey(id, full_name, avatar_url, bio)')
        .eq('follower_id', user!.id),
      supabase
        .from('user_follows')
        .select('id, follower_id, profiles!user_follows_follower_id_fkey(id, full_name, avatar_url, bio)')
        .eq('following_id', user!.id),
    ]);

    const followingData: FollowProfile[] = (followingRes.data || [])
      .filter((f: any) => f.profiles)
      .map((f: any) => ({ ...f.profiles, follow_id: f.id }));

    const followersData: FollowProfile[] = (followersRes.data || [])
      .filter((f: any) => f.profiles)
      .map((f: any) => ({ ...f.profiles, follow_id: f.id }));

    setFollowing(followingData);
    setFollowers(followersData);
    setFollowingIds(new Set(followingData.map(f => f.id)));
    setLoading(false);
  }

  async function unfollow(followId: string, profileId: string) {
    await supabase.from('user_follows').delete().eq('id', followId);
    setFollowing(prev => prev.filter(f => f.follow_id !== followId));
    setFollowingIds(prev => { const s = new Set(prev); s.delete(profileId); return s; });
  }

  async function followBack(profileId: string) {
    const { data } = await supabase
      .from('user_follows')
      .insert({ follower_id: user!.id, following_id: profileId })
      .select('id')
      .maybeSingle();

    if (data) {
      const profileData = followers.find(f => f.id === profileId);
      if (profileData) {
        setFollowing(prev => [...prev, { ...profileData, follow_id: data.id }]);
        setFollowingIds(prev => new Set([...prev, profileId]));
      }
    }
  }

  const displayList = tab === 'following' ? following : followers;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-black text-gray-900">المتابعات</h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-0 flex gap-0">
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'following' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            أتابعهم
            <span className="mr-1.5 bg-blue-50 text-blue-600 text-xs font-black px-1.5 py-0.5 rounded-full">
              {following.length}
            </span>
          </button>
          <button
            onClick={() => setTab('followers')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'followers' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            يتابعونني
            <span className="mr-1.5 bg-blue-50 text-blue-600 text-xs font-black px-1.5 py-0.5 rounded-full">
              {followers.length}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-gray-500 font-semibold">
              {tab === 'following' ? 'لا تتابع أحداً بعد' : 'لا يتابعك أحد بعد'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {tab === 'following' ? 'يمكنك متابعة البائعين من صفحاتهم' : 'شارك ملفك الشخصي ليتابعك الآخرون'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map(profile => (
              <div key={profile.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/user/${profile.id}`)}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-blue-400" />
                  )}
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/user/${profile.id}`)}
                >
                  <p className="font-bold text-gray-900 text-sm">{profile.full_name}</p>
                  {profile.bio && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{profile.bio}</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {tab === 'following' ? (
                    <button
                      onClick={() => unfollow(profile.follow_id, profile.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      إلغاء المتابعة
                    </button>
                  ) : (
                    followingIds.has(profile.id) ? (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">
                        تتابعه
                      </span>
                    ) : (
                      <button
                        onClick={() => followBack(profile.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        متابعة
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
