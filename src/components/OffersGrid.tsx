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

export default function OffersGrid({ categoryId, subcategoryId, filters, onViewListing, searchQuery = '' }: OffersGridProps) {
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
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
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
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 flex items-center justify-between bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-bold text-gray-700">{listings.length} إعلان</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs sm:text-sm border-2 border-gray-200 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 focus:outline-none focus:border-amber-500 bg-white font-medium shadow-sm"
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
          <div className="space-y-3">
            {listings.map((listing) => (
              <OfferCard key={listing.id} listing={listing} onClick={() => onViewListing(listing.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCard({ listing, onClick }: { listing: ListingWithPromotion; onClick: () => void }) {
  const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0] : 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  function getTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'قبل أقل من ساعة';
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    if (diffInDays === 1) return 'قبل يوم';
    if (diffInDays < 7) return `قبل ${diffInDays} أيام`;
    if (diffInDays < 14) return 'قبل أسبوع';
    if (diffInDays < 30) return `قبل ${Math.floor(diffInDays / 7)} أسابيع`;
    return `قبل ${Math.floor(diffInDays / 30)} شهر`;
  }

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border w-full ${
        listing.is_featured
          ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400 shadow-sm'
          : 'bg-white border-gray-100 hover:border-amber-200'
      }`}
    >
      <div className="flex flex-row h-28 md:h-24">
        <div className="flex-1 min-w-0 flex flex-col justify-between p-3 md:p-3.5">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex-1 text-sm md:text-base font-bold text-gray-900 text-right line-clamp-1 group-hover:text-amber-600 transition-colors leading-snug">
                {listing.title}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); }}
                className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:scale-110 border border-gray-200 flex-shrink-0"
              >
                <Heart className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">
                {listing.condition}
              </span>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded">
                {listing.quantity} {listing.unit}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-none">
                {listing.price.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-gray-600">ريال</span>
              {listing.price_type === 'per_unit' && <span className="text-[10px] text-gray-500 font-medium">/ {listing.unit}</span>}
              {listing.price_type === 'negotiable' && <span className="text-[10px] text-amber-600 font-semibold">(قابل للتفاوض)</span>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span className="font-semibold text-[11px] text-gray-700">{listing.cities?.name_ar}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="relative w-32 md:w-40 flex-shrink-0">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          {listing.is_featured && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold rounded shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              <span>مميز</span>
            </div>
          )}
          {listing.is_pinned && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold rounded shadow-lg flex items-center gap-1">
              <Pin className="w-3 h-3 fill-white" />
              <span>مثبت</span>
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold rounded flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{listing.views_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
