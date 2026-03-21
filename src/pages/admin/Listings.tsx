import { useEffect, useState } from 'react';
import { Package, Eye, MessageCircle, CreditCard as Edit, Trash2, PauseCircle, PlayCircle, Pin, Search } from 'lucide-react';
import { supabase, Listing } from '../../lib/supabase';

export default function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadListings();
  }, [statusFilter]);

  async function loadListings() {
    try {
      let query = supabase
        .from('listings')
        .select('*, cities(name_ar), categories(name_ar)')
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      const listingsWithProfiles = await Promise.all(
        (data || []).map(async (listing: any) => {
          if (!listing.user_id) {
            return {
              ...listing,
              profiles: null
            };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', listing.user_id)
            .maybeSingle();

          return {
            ...listing,
            profiles: profile
          };
        })
      );

      setListings(listingsWithProfiles as any);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleListingStatus(listingId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_active: !currentStatus })
        .eq('id', listingId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: currentStatus ? 'deactivate_listing' : 'activate_listing',
        p_target_type: 'listing',
        p_target_id: listingId
      });

      loadListings();
    } catch (error) {
      console.error('Error toggling listing status:', error);
      alert('حدث خطأ أثناء تحديث حالة الإعلان');
    }
  }

  async function deleteListing(listingId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'delete_listing',
        p_target_type: 'listing',
        p_target_id: listingId
      });

      loadListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('حدث خطأ أثناء حذف الإعلان');
    }
  }

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة الإعلانات</h1>
          <p className="text-slate-300">عرض وإدارة جميع الإعلانات على المنصة</p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الإعلانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل ({listings.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                نشط
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                موقف
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onToggleStatus={() => toggleListingStatus(listing.id, listing.is_active)}
              onDelete={() => deleteListing(listing.id)}
            />
          ))}

          {filteredListings.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">لا توجد إعلانات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, onToggleStatus, onDelete }: {
  listing: any;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const imageUrl = listing.images?.[0] || 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full md:w-48 h-48 object-cover rounded-xl"
        />

        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.title}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{listing.profiles?.full_name || 'غير معروف'}</span>
                <span>•</span>
                <span>{listing.categories?.name_ar}</span>
                <span>•</span>
                <span>{listing.cities?.name_ar}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              listing.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {listing.is_active ? 'نشط' : 'موقف'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">السعر</p>
              <p className="text-lg font-black text-blue-700">{listing.price.toLocaleString()} ريال</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Eye className="w-3 h-3 text-purple-600" />
                <p className="text-xs text-purple-600">المشاهدات</p>
              </div>
              <p className="text-lg font-black text-purple-700">{listing.views_count || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <MessageCircle className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-600">التواصل</p>
              </div>
              <p className="text-lg font-black text-green-700">{listing.whatsapp_clicks || 0}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                listing.is_active
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {listing.is_active ? (
                <>
                  <PauseCircle className="w-4 h-4" />
                  إيقاف
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  تفعيل
                </>
              )}
            </button>

            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
