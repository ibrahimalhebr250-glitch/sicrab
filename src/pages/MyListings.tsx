import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CreditCard as Edit2, Trash2, Package, TrendingUp } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  location: string;
  images: string[];
  created_at: string;
}

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    fetchMyListings();
  }, [user, authLoading]);

  const fetchMyListings = async () => {
    try {
      console.log('🔍 [MyListings] Fetching listings for user:', user?.id);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('📦 [MyListings] Fetched listings:', data?.length, 'Error:', error);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('❌ [MyListings] Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    console.log('🗑️ [MyListings] Attempting to delete listing:', id);
    console.log('👤 [MyListings] Current user:', user?.id);

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [MyListings] Delete error:', error);
        throw error;
      }

      console.log('✅ [MyListings] Successfully deleted listing:', id);
      setListings(listings.filter(listing => listing.id !== id));
    } catch (error) {
      console.error('❌ [MyListings] Error deleting listing:', error);
      alert('حدث خطأ أثناء حذف الإعلان: ' + (error as any)?.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">إعلاناتي</h1>
            <p className="text-gray-600 mt-1">إدارة جميع إعلاناتك</p>
          </div>
          <a
            href="/add-listing"
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            إضافة إعلان جديد
          </a>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">ليس لديك أي إعلانات حتى الآن</h3>
            <p className="text-gray-600 mb-6">ابدأ بإضافة إعلانك الأول</p>
            <a
              href="/add-listing"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              إضافة إعلان
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="relative h-48">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Package className="w-16 h-16 text-amber-500" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {listing.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-amber-600">{listing.price} ريال</span>
                    <span className="text-sm text-gray-500">{listing.location}</span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => window.location.href = `/promote/${listing.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-semibold"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>ترقية</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/listing/${listing.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deletingId === listing.id ? 'جاري الحذف...' : 'حذف'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
