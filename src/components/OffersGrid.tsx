import { MapPin, Eye, Heart, Star, Pin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, Listing } from '../lib/supabase';
import { FilterState } from './Filters';

interface ListingWithPromotion extends Listing {
  is_featured?: boolean;
  is_pinned?: boolean;
}

interface OffersGridProps {
  categoryId: string | null;
  subcategoryId: string | null;
  filters: FilterState;
  onViewListing?: (listingId: string) => void;
  searchQuery?: string;
}

function OffersGridNew({ categoryId, subcategoryId, filters, onViewListing, searchQuery = '' }: OffersGridProps) {
  const [listings, setListings] = useState<ListingWithPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    loadListings();
  }, [categoryId, subcategoryId, filters, sortBy, searchQuery]);

  async function loadListings() {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, cities(*), categories(*), subcategories(*)')
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    if (filters.cityId) {
      query = query.eq('city_id', filters.cityId);
    }

    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(v => v.replace('+', ''));
      if (max) {
        query = query.gte('price', parseInt(min)).lte('price', parseInt(max));
      } else {
        query = query.gte('price', parseInt(min));
      }
    }

    if (filters.quantityRange) {
      const [min, max] = filters.quantityRange.split('-').map(v => v.replace('+', ''));
      if (max) {
        query = query.gte('quantity', parseInt(min)).lte('quantity', parseInt(max));
      } else {
        query = query.gte('quantity', parseInt(min));
      }
    }

    if (searchQuery && searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading listings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const listingsWithPromotions = await Promise.all(
        data.map(async (listing) => {
          const { data: promotions } = await supabase
            .from('promotions')
            .select('type')
            .eq('listing_id', listing.id)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString());

          const is_featured = promotions?.some(p => p.type === 'featured' || p.type === 'featured_pinned') || false;
          const is_pinned = promotions?.some(p => p.type === 'pinned' || p.type === 'featured_pinned') || false;

          return { ...listing, is_featured, is_pinned };
        })
      );

      const sortedListings = listingsWithPromotions.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;

        if (sortBy === 'views') {
          return (b.views_count || 0) - (a.views_count || 0);
        }

        if (sortBy === 'price_asc') {
          return a.price - b.price;
        }

        if (sortBy === 'price_desc') {
          return b.price - a.price;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setListings(sortedListings);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-amber-500"></div>
            <p className="mt-4 text-gray-600 font-medium">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-3 shadow-lg border-2 border-teal-200">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-green-600 rounded-xl flex items-center justify-center shadow-xl">
              <span className="text-white font-black text-base">{listings.length}</span>
            </div>
            <div>
              <span className="text-sm font-black text-gray-900 block">إعلان متاح</span>
              <span className="text-xs text-gray-600 font-semibold">جاهز للمعاينة</span>
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border-2 border-teal-200 rounded-xl px-3 py-2 focus:outline-none bg-white font-bold shadow-md"
          >
            <option value="created_at">الأحدث</option>
            <option value="views">الأكثر مشاهدة</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="price_desc">الأعلى سعراً</option>
          </select>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <p className="text-gray-500 text-lg font-medium">لا توجد إعلانات متاحة</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((listing) => (
              <FreshListingCard key={listing.id} listing={listing} onClick={() => onViewListing?.(listing.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FreshListingCard({ listing, onClick }: { listing: ListingWithPromotion; onClick: () => void }) {
  const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0] : 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  function getTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'قبل ساعة';
    if (diffInHours < 24) return `قبل ${diffInHours}س`;
    if (diffInDays === 1) return 'قبل يوم';
    if (diffInDays < 7) return `قبل ${diffInDays} أيام`;
    return `قبل ${Math.floor(diffInDays / 7)} أسابيع`;
  }

  const cardClasses = listing.is_featured
    ? 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 border-4 border-amber-400 shadow-2xl'
    : 'bg-white border-3 border-gray-200 shadow-xl';

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] rounded-3xl ${cardClasses} h-[190px]`}
    >
      <div className="flex flex-row h-full">
        <div className="flex-1 flex flex-col justify-between p-4 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="flex-1 font-black text-gray-900 text-[22px] leading-tight line-clamp-2">
                {listing.title}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); }}
                className="flex-shrink-0 bg-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform w-12 h-12 border-3 border-red-200 shadow-xl"
              >
                <Heart className="text-red-500 w-6 h-6 stroke-[3]" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-gradient-to-r from-blue-200 to-cyan-200 text-blue-900 font-black rounded-xl shadow-sm px-3 py-1 text-[13px] border-2 border-blue-300">
                {listing.condition}
              </span>
              <span className="bg-gradient-to-r from-gray-200 to-slate-300 text-gray-900 font-black rounded-xl shadow-sm px-3 py-1 flex items-center gap-1 text-[13px] border-2 border-gray-300">
                <span>{listing.quantity}</span>
                <span>{listing.unit}</span>
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <div className="font-black bg-gradient-to-r from-teal-600 via-green-600 to-emerald-600 bg-clip-text text-transparent text-[36px] leading-none">
                {listing.price.toLocaleString()}
              </div>
              <span className="font-black text-gray-800 text-base">ريال</span>
              {listing.price_type === 'per_unit' && (
                <span className="text-gray-600 font-bold text-[13px]">/ {listing.unit}</span>
              )}
              {listing.price_type === 'negotiable' && (
                <span className="text-amber-900 font-black px-2 py-0.5 bg-amber-100 rounded-lg text-xs border-2 border-amber-400">
                  قابل للتفاوض
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl px-2.5 py-1.5 shadow-sm border-2 border-amber-400">
                <MapPin className="text-amber-900 w-4 h-4 stroke-[3]" />
                <span className="font-black text-gray-900 text-[13px]">
                  {listing.cities?.name_ar}
                </span>
              </div>
              <span className="text-gray-600 font-bold text-xs">
                {getTimeAgo(listing.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0 w-[175px]">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>

          {listing.is_featured && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-xl shadow-2xl px-2.5 py-1.5 text-[13px] border-2 border-white">
              <Star className="w-4 h-4 stroke-[3] fill-white" />
              <span>مميز</span>
            </div>
          )}

          {listing.is_pinned && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black rounded-xl shadow-2xl px-2.5 py-1.5 text-[13px] border-2 border-white">
              <Pin className="w-4 h-4 stroke-[3] fill-white" />
              <span>مثبت</span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/90 backdrop-blur-xl text-white font-black rounded-xl px-2.5 py-1.5 shadow-2xl text-[13px] border-2 border-white/30">
            <Eye className="w-4 h-4 stroke-[3]" />
            <span>{listing.views_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OffersGridNew;
