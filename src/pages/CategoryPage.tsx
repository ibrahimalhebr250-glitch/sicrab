import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, MapPin, Eye, Package } from 'lucide-react';
import { supabase, Listing } from '../lib/supabase';

interface CategoryPageProps {
  categorySlug: string;
  onBack: () => void;
  onViewListing: (listingId: string) => void;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
}

export default function CategoryPage({ categorySlug, onBack, onViewListing }: CategoryPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, [categorySlug]);

  async function loadCategoryData() {
    setLoading(true);

    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', categorySlug)
      .maybeSingle();

    if (categoryData) {
      setCategory(categoryData);

      const { data: featured } = await supabase
        .from('listings')
        .select('*, cities(*), categories(*)')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (featured) setFeaturedListings(featured);

      const { data: recent } = await supabase
        .from('listings')
        .select('*, cities(*), categories(*)')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (recent) setRecentListings(recent);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-48 mb-2"></div>
                <div className="bg-gray-200 rounded h-4 mb-2"></div>
                <div className="bg-gray-200 rounded h-4 w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">القسم غير موجود</h2>
          <button
            onClick={onBack}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{category.name_ar}</h1>
              <p className="text-sm text-gray-500">{category.name_en}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 md:p-8 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-black mb-2">{category.name_ar}</h2>
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                {category.description_ar || `تصفح جميع إعلانات ${category.name_ar} في المملكة العربية السعودية`}
              </p>
            </div>
          </div>
        </div>

        {featuredListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">الإعلانات المميزة</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => onViewListing(listing.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">أحدث الإعلانات</h2>
          {recentListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => onViewListing(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">لا توجد إعلانات في هذا القسم حالياً</p>
            </div>
          )}
        </div>
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
      className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
    >
      <div className="relative h-48">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        {listing.is_featured && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg">
            مميز
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{listing.views_count}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {listing.title}
        </h3>

        <div className="text-lg font-black text-amber-600 mb-2">
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
