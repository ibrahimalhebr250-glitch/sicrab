import { useEffect, useState } from 'react';
import { Star, Pin, Calendar, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Promotion {
  id: string;
  listing_id: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  listings: {
    title: string;
    price: number;
  };
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*, listings(title, price)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/10 rounded-2xl"></div>
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
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة الإعلانات المميزة</h1>
          <p className="text-slate-300">عرض وإدارة جميع الترويجات النشطة</p>
        </div>

        <div className="grid gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  promo.type.includes('featured')
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                } text-white`}>
                  {promo.type.includes('featured') ? (
                    <Star className="w-6 h-6" />
                  ) : (
                    <Pin className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{promo.listings.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className={`px-3 py-1 rounded-full font-bold ${
                      promo.type === 'featured'
                        ? 'bg-amber-100 text-amber-700'
                        : promo.type === 'pinned'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gradient-to-r from-amber-100 to-blue-100 text-gray-700'
                    }`}>
                      {promo.type === 'featured' ? 'مميز' : promo.type === 'pinned' ? 'مثبت' : 'مميز ومثبت'}
                    </span>
                    <span className="text-gray-600">
                      {new Date(promo.start_date).toLocaleDateString('ar-SA')} - {new Date(promo.end_date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {promotions.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">لا توجد ترويجات نشطة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
