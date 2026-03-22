import { useEffect, useState } from 'react';
import { MapPin, Eye, Package } from 'lucide-react';
import { supabase, Listing } from '../lib/supabase';

interface SellerListingsProps {
  sellerId: string;
  currentListingId: string;
  onViewListing: (listingId: string) => void;
}

export default function SellerListings({ sellerId, currentListingId, onViewListing }: SellerListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerListings();
  }, [sellerId, currentListingId]);

  async function loadSellerListings() {
    if (!sellerId || sellerId === 'null') {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('listings')
      .select('*, cities(*), categories(*)')
      .eq('is_active', true)
      .eq('user_id', sellerId);

    if (currentListingId && currentListingId !== 'null') {
      query = query.neq('id', currentListingId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error loading seller listings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setListings(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-white px-4 py-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
          إعلانات أخرى من نفس البائع
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl h-32 mb-2"></div>
              <div className="bg-gray-200 rounded h-4 mb-2"></div>
              <div className="bg-gray-200 rounded h-4 w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
        إعلانات أخرى من نفس البائع
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {listings.map((listing) => (
          <SellerListingCard
            key={listing.id}
            listing={listing}
            onClick={() => onViewListing(listing.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SellerListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="relative h-32">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        {listing.is_featured && (
          <div className="absolute top-1 right-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg">
            مميز
          </div>
        )}
        <div className="absolute bottom-1 left-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{listing.views_count}</span>
        </div>
      </div>

      <div className="p-2">
        <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
          {listing.title}
        </h4>

        <div className="text-lg font-black text-blue-600 mb-1">
          {listing.price.toLocaleString()} ريال
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <Package className="w-3 h-3" />
            <span className="truncate">{listing.categories?.name_ar}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <MapPin className="w-3 h-3" />
            <span>{listing.cities?.name_ar}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
