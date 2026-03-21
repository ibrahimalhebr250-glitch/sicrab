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
      <div style={{ background: 'linear-gradient(to bottom, rgb(249, 250, 251), white)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ textAlign: 'center', paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div style={{
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
              borderRadius: '9999px',
              width: '3rem',
              height: '3rem',
              border: '4px solid rgb(209, 213, 219)',
              borderTopColor: 'rgb(245, 158, 11)'
            }}></div>
            <p style={{ marginTop: '1rem', color: 'rgb(75, 85, 99)', fontWeight: '500' }}>جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 0.75rem' }}>
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, rgb(240, 253, 250), rgb(236, 253, 245))',
          borderRadius: '1rem',
          padding: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid rgb(153, 246, 228)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2.75rem',
              height: '2.75rem',
              background: 'linear-gradient(to bottom right, rgb(13, 148, 136), rgb(5, 150, 105))',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{ color: 'white', fontWeight: '900', fontSize: '1rem' }}>{listings.length}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: '900', color: 'rgb(17, 24, 39)', display: 'block' }}>إعلان متاح</span>
              <span style={{ fontSize: '0.75rem', color: 'rgb(75, 85, 99)', fontWeight: '600' }}>جاهز للمعاينة</span>
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              fontSize: '0.875rem',
              border: '2px solid rgb(153, 246, 228)',
              borderRadius: '0.75rem',
              padding: '0.5rem 0.75rem',
              outline: 'none',
              backgroundColor: 'white',
              fontWeight: '700',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <option value="created_at">الأحدث</option>
            <option value="views">الأكثر مشاهدة</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="price_desc">الأعلى سعراً</option>
          </select>
        </div>

        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'white', borderRadius: '0.75rem' }}>
            <p style={{ color: 'rgb(107, 114, 128)', fontSize: '1.125rem', fontWeight: '500' }}>لا توجد إعلانات متاحة</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {listings.map((listing) => (
              <NewListingCard key={listing.id} listing={listing} onClick={() => onViewListing?.(listing.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewListingCard({ listing, onClick }: { listing: ListingWithPromotion; onClick: () => void }) {
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

  const cardBackground = listing.is_featured
    ? 'linear-gradient(to bottom right, rgb(254, 243, 199), rgb(253, 230, 138), rgb(254, 215, 170))'
    : 'white';

  const cardBorder = listing.is_featured
    ? '4px solid rgb(251, 191, 36)'
    : '3px solid rgb(229, 231, 235)';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s',
        background: cardBackground,
        borderRadius: '1.5rem',
        border: cardBorder,
        minHeight: '180px',
        boxShadow: listing.is_featured ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', height: '180px' }}>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem', minWidth: '0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <h3 style={{
                flex: '1',
                fontWeight: '900',
                color: 'rgb(17, 24, 39)',
                fontSize: '1.1875rem',
                lineHeight: '1.3',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {listing.title}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); }}
                style={{
                  flexShrink: 0,
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  width: '44px',
                  height: '44px',
                  border: '3px solid rgb(254, 202, 202)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Heart style={{ color: 'rgb(239, 68, 68)', width: '22px', height: '22px', strokeWidth: 3 }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(to right, rgb(191, 219, 254), rgb(165, 243, 252))',
                color: 'rgb(30, 58, 138)',
                fontWeight: '900',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8125rem',
                border: '2px solid rgb(147, 197, 253)'
              }}>
                {listing.condition}
              </span>
              <span style={{
                background: 'linear-gradient(to right, rgb(229, 231, 235), rgb(203, 213, 225))',
                color: 'rgb(17, 24, 39)',
                fontWeight: '900',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                padding: '0.25rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8125rem',
                border: '2px solid rgb(209, 213, 219)'
              }}>
                <span>{listing.quantity}</span>
                <span>{listing.unit}</span>
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{
                fontWeight: '900',
                background: 'linear-gradient(to right, rgb(13, 148, 136), rgb(5, 150, 105), rgb(22, 163, 74))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '2.125rem',
                lineHeight: '1'
              }}>
                {listing.price.toLocaleString()}
              </div>
              <span style={{ fontWeight: '900', color: 'rgb(31, 41, 55)', fontSize: '1rem' }}>ريال</span>
              {listing.price_type === 'per_unit' && (
                <span style={{ color: 'rgb(75, 85, 99)', fontWeight: '700', fontSize: '0.8125rem' }}>/ {listing.unit}</span>
              )}
              {listing.price_type === 'negotiable' && (
                <span style={{
                  color: 'rgb(120, 53, 15)',
                  fontWeight: '900',
                  padding: '0.125rem 0.5rem',
                  background: 'rgb(254, 243, 199)',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  border: '2px solid rgb(251, 191, 36)'
                }}>
                  قابل للتفاوض
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'linear-gradient(to right, rgb(254, 243, 199), rgb(253, 230, 138))',
                borderRadius: '0.75rem',
                padding: '0.375rem 0.625rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '2px solid rgb(251, 191, 36)'
              }}>
                <MapPin style={{ color: 'rgb(146, 64, 14)', width: '16px', height: '16px', strokeWidth: 3 }} />
                <span style={{ fontWeight: '900', color: 'rgb(17, 24, 39)', fontSize: '0.8125rem' }}>
                  {listing.cities?.name_ar}
                </span>
              </div>
              <span style={{ color: 'rgb(75, 85, 99)', fontWeight: '700', fontSize: '0.75rem' }}>
                {getTimeAgo(listing.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', flexShrink: 0, width: '165px' }}>
          <img
            src={imageUrl}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent, rgba(0, 0, 0, 0.2))'
          }}></div>

          {listing.is_featured && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'linear-gradient(to right, rgb(217, 119, 6), rgb(234, 88, 12))',
              color: 'white',
              fontWeight: '900',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '0.375rem 0.625rem',
              fontSize: '0.8125rem',
              border: '2px solid white'
            }}>
              <Star style={{ width: '16px', height: '16px', strokeWidth: 3, fill: 'white' }} />
              <span>مميز</span>
            </div>
          )}

          {listing.is_pinned && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235))',
              color: 'white',
              fontWeight: '900',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '0.375rem 0.625rem',
              fontSize: '0.8125rem',
              border: '2px solid white'
            }}>
              <Pin style={{ width: '16px', height: '16px', strokeWidth: 3, fill: 'white' }} />
              <span>مثبت</span>
            </div>
          )}

          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            fontWeight: '900',
            borderRadius: '0.75rem',
            padding: '0.375rem 0.625rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            fontSize: '0.8125rem',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Eye style={{ width: '16px', height: '16px', strokeWidth: 3 }} />
            <span>{listing.views_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
