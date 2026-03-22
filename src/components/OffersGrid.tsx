import { MapPin, Eye, Heart, Star, Pin, Clock, Package, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

    if (categoryId) query = query.eq('category_id', categoryId);
    if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);
    if (filters.cityId) query = query.eq('city_id', filters.cityId);
    if (filters.condition) query = query.eq('condition', filters.condition);

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(v => v.replace('+', ''));
      if (max) query = query.gte('price', parseInt(min)).lte('price', parseInt(max));
      else query = query.gte('price', parseInt(min));
    }

    if (filters.quantityRange) {
      const [min, max] = filters.quantityRange.split('-').map(v => v.replace('+', ''));
      if (max) query = query.gte('quantity', parseInt(min)).lte('quantity', parseInt(max));
      else query = query.gte('quantity', parseInt(min));
    }

    if (searchQuery && searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const [
      { data, error },
      { data: settingsData },
      { data: activePromotions }
    ] = await Promise.all([
      query,
      supabase.from('site_settings').select('platform_mode').maybeSingle(),
      supabase
        .from('promotions')
        .select('listing_id, type')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString()),
    ]);

    const platformMode = settingsData?.platform_mode ?? 'free';

    if (error) {
      console.error('Error loading listings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const promotionMap = new Map<string, { is_featured: boolean; is_pinned: boolean }>();
      for (const promo of activePromotions || []) {
        const existing = promotionMap.get(promo.listing_id) ?? { is_featured: false, is_pinned: false };
        if (promo.type === 'featured' || promo.type === 'featured_pinned') existing.is_featured = true;
        if (promo.type === 'pinned' || promo.type === 'featured_pinned') existing.is_pinned = true;
        promotionMap.set(promo.listing_id, existing);
      }

      const listingsWithPromotions = data.map(listing => ({
        ...listing,
        is_featured: promotionMap.get(listing.id)?.is_featured ?? false,
        is_pinned: promotionMap.get(listing.id)?.is_pinned ?? false,
      }));

      const sortedListings = listingsWithPromotions.sort((a, b) => {
        if (platformMode === 'packages') {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
        }

        if (sortBy === 'views') return (b.views_count || 0) - (a.views_count || 0);
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setListings(sortedListings);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 py-6">
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[148px] bg-white rounded-2xl animate-pulse border border-gray-100 shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-3 py-3">
        <div className="mb-3 flex items-center justify-between bg-white rounded-2xl px-3 py-2.5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">{listings.length}</span>
            </div>
            <div>
              <span className="text-xs font-black text-gray-900 block leading-none">إعلان متاح</span>
              <span className="text-[10px] text-gray-400 font-medium">جاهز للمعاينة</span>
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none bg-white font-bold text-gray-700"
          >
            <option value="created_at">الأحدث</option>
            <option value="views">الأكثر مشاهدة</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="price_desc">الأعلى سعراً</option>
          </select>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="text-gray-400 text-base font-medium">لا توجد إعلانات متاحة</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {listings.map((listing) => (
              <FreshListingCard
                key={listing.id}
                listing={listing}
                onClick={() => {
                  if (onViewListing) {
                    onViewListing(listing.id);
                  } else {
                    navigate(`/listing/${listing.slug || listing.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FreshListingCard({ listing, onClick }: { listing: ListingWithPromotion; onClick: () => void }) {
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  function getTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'الآن';
    if (diffInHours < 24) return `${diffInHours}س`;
    if (diffInDays === 1) return 'أمس';
    if (diffInDays < 7) return `${diffInDays}ي`;
    return `${Math.floor(diffInDays / 7)}أ`;
  }

  const isFeatured = listing.is_featured;
  const isPinned = listing.is_pinned;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer rounded-2xl transition-all duration-200 active:scale-[0.98]
        ${isFeatured
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md shadow-amber-100'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
        }`}
      style={{ height: '148px' }}
    >
      {isPinned && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 z-10" />
      )}

      <div className="flex flex-row h-full">
        <div className="flex-1 flex flex-col justify-between px-3 py-2.5 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {isFeatured && (
                  <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                    <Star className="w-2.5 h-2.5 fill-white stroke-none" />
                    مميز
                  </span>
                )}
                {isPinned && (
                  <span className="inline-flex items-center gap-0.5 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                    <Pin className="w-2.5 h-2.5 stroke-[2.5]" />
                    مثبت
                  </span>
                )}
                {listing.categories && (
                  <span className="text-[9px] text-gray-400 font-medium truncate">
                    {listing.categories.name_ar}
                  </span>
                )}
              </div>
              <h3 className="font-black text-gray-900 text-[15px] leading-tight line-clamp-2">
                {listing.title}
              </h3>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="flex-shrink-0 w-7 h-7 bg-white rounded-xl flex items-center justify-center shadow-sm border border-red-100 hover:scale-110 transition-transform mt-0.5"
            >
              <Heart className="text-red-400 w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 my-1.5 flex-wrap">
            <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-100">
              {listing.condition}
            </span>
            <span className="inline-flex items-center gap-0.5 bg-gray-50 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-gray-100">
              <Package className="w-2.5 h-2.5" />
              {listing.quantity} {listing.unit}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`font-black text-[22px] leading-none ${isFeatured ? 'text-amber-700' : 'text-teal-600'}`}>
                  {listing.price.toLocaleString()}
                </span>
                <span className="text-gray-500 font-bold text-[11px]">ريال</span>
                {listing.price_type === 'per_unit' && (
                  <span className="text-gray-400 text-[10px]">/{listing.unit}</span>
                )}
              </div>
              {listing.price_type === 'negotiable' && (
                <span className="inline-block text-amber-700 font-black text-[9px] px-1.5 py-0.5 bg-amber-100 rounded-md border border-amber-200 leading-none mt-0.5">
                  قابل للتفاوض
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-0.5 text-gray-400">
                <MapPin className="w-2.5 h-2.5 stroke-[2]" />
                <span className="text-[10px] font-semibold text-gray-500">{listing.cities?.name_ar}</span>
              </div>
              <div className="flex items-center gap-0.5 text-gray-400">
                <Clock className="w-2.5 h-2.5 stroke-[2]" />
                <span className="text-[10px] font-medium">{getTimeAgo(listing.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0 w-[130px]">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent" />

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5 bg-black/70 backdrop-blur-sm text-white rounded-lg px-1.5 py-0.5">
              <Eye className="w-2.5 h-2.5 stroke-[2.5]" />
              <span className="text-[10px] font-black">{listing.views_count || 0}</span>
            </div>
            {(listing.views_count || 0) > 50 && (
              <div className="flex items-center gap-0.5 bg-emerald-500/90 backdrop-blur-sm text-white rounded-lg px-1.5 py-0.5">
                <Zap className="w-2.5 h-2.5 fill-white stroke-none" />
                <span className="text-[9px] font-black">رائج</span>
              </div>
            )}
          </div>

          {listing.images && listing.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-md px-1.5 py-0.5 text-[9px] font-bold">
              +{listing.images.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OffersGridNew;
