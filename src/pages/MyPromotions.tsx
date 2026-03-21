import { useState, useEffect } from 'react';
import { ArrowRight, Star, Pin, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Promotion {
  id: string;
  listing_id: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  price: number;
  payment_status: string;
  listings: {
    title: string;
    images: string[];
  };
}

interface MyPromotionsProps {
  onBack: () => void;
}

export default function MyPromotions({ onBack }: MyPromotionsProps) {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadPromotions();
  }, [user]);

  async function loadPromotions() {
    if (!user) return;

    const { data, error } = await supabase
      .from('promotions')
      .select('*, listings(title, images)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading promotions:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setPromotions(data);
    }
    setLoading(false);
  }

  const filteredPromotions = promotions.filter(promo => {
    if (filter === 'all') return true;
    if (filter === 'active') return promo.status === 'active';
    if (filter === 'expired') return promo.status === 'expired';
    return true;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'featured':
        return 'إعلان مميز';
      case 'pinned':
        return 'إعلان مثبت';
      case 'featured_pinned':
        return 'باقة البائع السريع';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'featured':
        return <Star className="w-5 h-5" />;
      case 'pinned':
        return <Pin className="w-5 h-5" />;
      case 'featured_pinned':
        return <Zap className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'featured':
        return 'from-amber-500 to-yellow-500';
      case 'pinned':
        return 'from-blue-500 to-indigo-500';
      case 'featured_pinned':
        return 'from-emerald-500 to-green-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            نشط
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            <XCircle className="w-3 h-3" />
            منتهي
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
            <Clock className="w-3 h-3" />
            قيد المراجعة
          </span>
        );
      default:
        return null;
    }
  };

  const getRemainingDays = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'منتهي';
    if (diffDays === 0) return 'ينتهي اليوم';
    if (diffDays === 1) return 'ينتهي غداً';
    return `${diffDays} يوم متبقي`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-amber-500"></div>
          <p className="mt-4 text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">الترقيات الخاصة بك</h1>
            <p className="text-sm text-gray-600">{promotions.length} ترقية</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل ({promotions.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'active'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              نشط ({promotions.filter(p => p.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'expired'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              منتهي ({promotions.filter(p => p.status === 'expired').length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg font-medium">لا توجد ترقيات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPromotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${getTypeColor(promo.type)} flex items-center justify-center text-white shadow-lg`}>
                      {getTypeIcon(promo.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {promo.listings.title}
                          </h3>
                          <p className="text-sm font-semibold text-amber-600 mb-2">
                            {getTypeLabel(promo.type)}
                          </p>
                        </div>
                        {getStatusBadge(promo.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getRemainingDays(promo.end_date)}</span>
                        </div>
                        <div className="font-bold text-gray-900">
                          {promo.price}$
                        </div>
                      </div>
                    </div>
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
