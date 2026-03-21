import { useEffect, useState } from 'react';
import { MapPin, Eye } from 'lucide-react';
import { supabase, Listing } from '../lib/supabase';

interface SimilarListingsProps {
  currentListingId: string;
  categoryId: string;
  cityId: string;
  onViewListing: (listingId: string) => void;
}

export default function SimilarListings({ currentListingId, categoryId, cityId, onViewListing }: SimilarListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilarListings();
  }, [currentListingId, categoryId, cityId]);

  async function loadSimilarListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*, cities(*), categories(*)')
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .neq('id', currentListingId)
      .limit(6);

    if (error) {
      console.error('Error loading similar listings:', error);
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
          <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
          إعلانات مشابهة
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
        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
        إعلانات مشابهة
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {listings.map((listing) => (
          <SimilarListingCard
            key={listing.id}
            listing={listing}
            onClick={() => onViewListing(listing.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SimilarListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="relative h-32">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{listing.views_count}</span>
        </div>
      </div>

      <div className="p-2">
        <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
          {listing.title}
        </h4>

        <div className="text-lg font-black text-amber-600 mb-1">
          {listing.price.toLocaleString()} ريال
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{listing.cities?.name_ar}</span>
        </div>
      </div>
    </div>
  );
}
