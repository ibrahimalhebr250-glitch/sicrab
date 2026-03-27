import { useEffect, useState } from 'react';
import { ArrowRight, User, Calendar, Package, MapPin, Eye } from 'lucide-react';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ReviewsList from '../components/ReviewsList';
import SellerBadge from '../components/SellerBadge';
import { useParams, useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  listings_count: number;
}

export default function PublicProfile() {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadProfile();
    loadListings();
  }, [userId]);

  async function loadProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  }

  async function loadListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*, cities(*), categories(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading listings:', error);
      return;
    }

    if (data) {
      setListings(data);
    }
  }

  function getJoinDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-amber-500"></div>
          <p className="mt-4 text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-600 text-lg mb-4">الملف الشخصي غير موجود</p>
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 rounded-xl hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-md active:scale-95 transition-all duration-200 font-semibold text-sm"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            <span>رجوع</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-8">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 rounded-xl hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-md active:scale-95 transition-all duration-200 font-semibold text-sm"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            <span>رجوع</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">الملف الشخصي</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-32"></div>

          <div className="px-6 pb-6">
            <div className="flex items-start gap-4 -mt-16 mb-6">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-amber-500" />
                )}
              </div>

              <div className="flex-1 mt-16">
                <h2 className="text-3xl font-black text-gray-900 mb-2">
                  {profile.full_name}
                </h2>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>انضم {getJoinDate(profile.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{profile.listings_count || listings.length} إعلان</span>
                  </div>
                </div>

              </div>
            </div>

            {profile.bio && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        <ReviewsList sellerId={userId} />

        <div className="mb-4 mt-6">
          <h3 className="text-xl font-bold text-gray-900">
            إعلانات {profile.full_name} ({listings.length})
          </h3>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">لا توجد إعلانات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/listing/${listing.slug || listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-amber-200"
    >
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-4">
        <div className="relative w-full md:w-36 h-48 md:h-36 flex-shrink-0">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{listing.views_count}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 text-right line-clamp-2 group-hover:text-amber-600 transition-colors leading-tight">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
            <span className="px-2 py-0.5 md:py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md">
              {listing.condition}
            </span>
            <span className="px-2 py-0.5 md:py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
              {listing.quantity} {listing.unit}
            </span>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {listing.price.toLocaleString()}
            </div>
            <span className="text-sm font-bold text-gray-600">ريال</span>
          </div>

          <div className="mt-auto flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
            <span className="font-semibold text-xs md:text-sm text-gray-700">
              {listing.cities?.name_ar}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
