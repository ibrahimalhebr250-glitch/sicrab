import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Users, UserMinus, Package, MapPin, Eye, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FollowedSeller {
  follow_id: string;
  followed_since: string;
  seller: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
  latest_listings: LatestListing[];
  total_listings: number;
}

interface LatestListing {
  id: string;
  slug: string | null;
  title: string;
  price: number;
  images: string[];
  views_count: number;
  created_at: string;
  city_name: string;
  is_new: boolean;
}

export default function Following() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<FollowedSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'sellers'>('feed');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: follows } = await supabase
      .from('user_follows')
      .select('id, created_at, following_id')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false });

    if (!follows || follows.length === 0) {
      setSellers([]);
      setLoading(false);
      return;
    }

    const sellerIds = follows.map(f => f.following_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio')
      .in('id', sellerIds);

    const { data: listings } = await supabase
      .from('listings')
      .select('id, slug, title, price, images, views_count, created_at, user_id, cities(name_ar)')
      .in('user_id', sellerIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    const result: FollowedSeller[] = follows.map(follow => {
      const seller = profiles?.find(p => p.id === follow.following_id);
      if (!seller) return null;

      const sellerListings = (listings || [])
        .filter(l => l.user_id === seller.id)
        .slice(0, 3)
        .map(l => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          price: l.price,
          images: l.images || [],
          views_count: l.views_count || 0,
          created_at: l.created_at,
          city_name: (l.cities as any)?.name_ar || '',
          is_new: new Date(l.created_at) > new Date(follow.created_at),
        }));

      const totalListings = (listings || []).filter(l => l.user_id === seller.id).length;

      return {
        follow_id: follow.id,
        followed_since: follow.created_at,
        seller,
        latest_listings: sellerListings,
        total_listings: totalListings,
      };
    }).filter(Boolean) as FollowedSeller[];

    setSellers(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    load();
  }, [user, authLoading, load]);

  async function handleUnfollow(followId: string, sellerName: string) {
    if (!confirm(`هل تريد إلغاء متابعة ${sellerName}؟`)) return;
    setUnfollowing(followId);
    await supabase.from('user_follows').delete().eq('id', followId);
    setSellers(prev => prev.filter(s => s.follow_id !== followId));
    setUnfollowing(null);
  }

  const allFeedListings = sellers
    .flatMap(s =>
      s.latest_listings.map(l => ({ ...l, seller: s.seller, follow_id: s.follow_id }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const newListingsCount = allFeedListings.filter(l => l.is_new).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900">متابعاتي</h1>
              <p className="text-xs text-gray-400">{sellers.length} بائع متابَع</p>
            </div>
          </div>
          {newListingsCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              {newListingsCount} جديد
            </span>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            آخر الإعلانات
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'sellers'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            البائعون ({sellers.length})
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {sellers.length === 0 ? (
          <EmptyState />
        ) : activeTab === 'feed' ? (
          <FeedTab listings={allFeedListings} />
        ) : (
          <SellersTab
            sellers={sellers}
            unfollowing={unfollowing}
            onUnfollow={handleUnfollow}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
        <Users className="w-10 h-10 text-amber-400" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">لا تتابع أحداً بعد</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
        تابع البائعين المفضلين لديك وستظهر إعلاناتهم الجديدة هنا فوراً
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
      >
        استعرض البائعين
      </Link>
    </div>
  );
}

function FeedTab({ listings }: { listings: (LatestListing & { seller: { id: string; full_name: string; avatar_url: string | null } })[] }) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">لا توجد إعلانات من البائعين المتابَعين حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <FeedCard key={`${listing.id}-${listing.seller.id}`} listing={listing} />
      ))}
    </div>
  );
}

function FeedCard({ listing }: {
  listing: LatestListing & { seller: { id: string; full_name: string; avatar_url: string | null } };
}) {
  const navigate = useNavigate();
  const imageUrl = listing.images?.[0] || 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';
  const timeAgo = getTimeAgo(listing.created_at);

  return (
    <div
      onClick={() => navigate(`/listing/${listing.slug || listing.id}`)}
      className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.99] group ${
        listing.is_new ? 'border-amber-200' : 'border-gray-100'
      }`}
    >
      {listing.is_new && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-bold">إعلان جديد بعد متابعتك</span>
        </div>
      )}
      <div className="flex gap-3 p-3">
        <div className="relative w-24 h-24 flex-shrink-0">
          <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover rounded-xl" />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded-md flex items-center gap-1">
            <Eye className="w-2.5 h-2.5" />
            {listing.views_count}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="flex items-center gap-2 mb-1.5"
            onClick={e => { e.stopPropagation(); navigate(`/user/${listing.seller.id}`); }}
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {listing.seller.avatar_url
                ? <img src={listing.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-amber-700 font-black text-xs">{listing.seller.full_name[0]}</span>
              }
            </div>
            <span className="text-xs font-semibold text-amber-600 hover:underline truncate">{listing.seller.full_name}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug mb-1.5">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-green-600">{listing.price.toLocaleString()} ر.س</span>
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{timeAgo}</span>
            </div>
          </div>
          {listing.city_name && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-gray-500">{listing.city_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SellersTab({ sellers, unfollowing, onUnfollow }: {
  sellers: FollowedSeller[];
  unfollowing: string | null;
  onUnfollow: (followId: string, sellerName: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {sellers.map(s => (
        <div key={s.follow_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div
              onClick={() => navigate(`/user/${s.seller.id}`)}
              className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
              {s.seller.avatar_url
                ? <img src={s.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-amber-700 font-black text-xl">{s.seller.full_name[0]}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/user/${s.seller.id}`)}
                className="font-black text-gray-900 text-base hover:text-amber-600 transition-colors text-right block truncate w-full"
              >
                {s.seller.full_name}
              </button>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {s.total_listings} إعلان
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  منذ {getTimeAgo(s.followed_since)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(`/user/${s.seller.id}`)}
                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() => onUnfollow(s.follow_id, s.seller.full_name)}
                disabled={unfollowing === s.follow_id}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                title="إلغاء المتابعة"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {s.latest_listings.length > 0 && (
            <div className="border-t border-gray-50 px-4 py-3">
              <p className="text-xs font-bold text-gray-400 mb-2">آخر الإعلانات</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {s.latest_listings.map(listing => (
                  <button
                    key={listing.id}
                    onClick={() => navigate(`/listing/${listing.slug || listing.id}`)}
                    className={`flex-shrink-0 relative w-20 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                      listing.is_new ? 'border-amber-300' : 'border-gray-100'
                    }`}
                  >
                    <img
                      src={listing.images?.[0] || 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg'}
                      alt={listing.title}
                      className="w-full h-16 object-cover"
                    />
                    {listing.is_new && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full shadow-sm"></div>
                    )}
                    <div className="p-1">
                      <p className="text-xs text-gray-700 font-semibold line-clamp-1 text-right">{listing.title}</p>
                      <p className="text-xs text-green-600 font-black text-right">{listing.price.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `${diffMins} دقيقة`;
  if (diffHours < 24) return `${diffHours} ساعة`;
  if (diffDays < 7) return `${diffDays} يوم`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} أسبوع`;
  return `${Math.floor(diffDays / 30)} شهر`;
}
