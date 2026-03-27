import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ArrowRight, MapPin, Eye, Trash2 } from 'lucide-react';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FavoriteListing extends Listing {
  favorite_id: string;
}

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user]);

  async function fetchFavorites() {
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('id, listing_id, listings(*, cities(*), categories(*))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      const items: FavoriteListing[] = data
        .filter((f: any) => f.listings)
        .map((f: any) => ({ ...f.listings, favorite_id: f.id }));
      setFavorites(items);
    }
    setLoading(false);
  }

  async function removeFavorite(favoriteId: string) {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    setFavorites(prev => prev.filter(f => f.favorite_id !== favoriteId));
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-black text-gray-900">المفضلة</h1>
          {!loading && (
            <span className="mr-auto bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
              {favorites.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-300" />
            </div>
            <p className="text-gray-500 font-semibold">لا توجد إعلانات في المفضلة</p>
            <p className="text-gray-400 text-sm mt-1">أضف إعلانات تعجبك بالضغط على أيقونة القلب</p>
            <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">
              تصفح الإعلانات
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map(listing => (
              <div
                key={listing.favorite_id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  <div
                    className="flex-1 p-3 cursor-pointer"
                    onClick={() => navigate(`/listing/${listing.slug || listing.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {listing.categories && (
                          <span className="text-[10px] text-gray-400 font-medium">{(listing.categories as any).name_ar}</span>
                        )}
                        <h3 className="font-black text-gray-900 text-sm leading-tight line-clamp-2 mt-0.5">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-emerald-600 font-black text-base">
                            {listing.price.toLocaleString()} <span className="text-xs font-bold">ريال</span>
                          </span>
                          {listing.cities && (
                            <span className="flex items-center gap-0.5 text-gray-400 text-xs">
                              <MapPin className="w-3 h-3" />
                              {(listing.cities as any).name_ar}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-gray-400 text-xs">
                            <Eye className="w-3 h-3" />
                            {listing.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {listing.images && listing.images.length > 0 && (
                    <div
                      className="w-24 flex-shrink-0 self-stretch cursor-pointer overflow-hidden relative"
                      onClick={() => navigate(`/listing/${listing.slug || listing.id}`)}
                    >
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-50 px-3 py-2 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/listing/${listing.slug || listing.id}`)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    عرض التفاصيل
                  </button>
                  <button
                    onClick={() => removeFavorite(listing.favorite_id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف من المفضلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
