import { useState, useEffect } from 'react';
import { Eye, TrendingUp, TrendingDown, Users, Zap, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface PulseData {
  views_last_hour: number;
  views_last_24h: number;
  competitor_avg_price: number;
  competitor_count: number;
  price_suggestion: number;
  price_suggestion_reason: string;
}

interface MarketPulseProps {
  listingId: string;
  currentPrice: number;
  listingTitle: string;
}

export default function MarketPulse({ listingId, currentPrice, listingTitle }: MarketPulseProps) {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 60000);
    return () => clearInterval(interval);
  }, [listingId]);

  const fetchPulse = async () => {
    const { data } = await supabase.rpc('get_market_pulse', { p_listing_id: listingId });
    if (data) setPulse(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!pulse) return null;

  const priceDiff = pulse.competitor_avg_price > 0
    ? ((currentPrice - pulse.competitor_avg_price) / pulse.competitor_avg_price) * 100
    : 0;

  const isHighPrice = priceDiff > 15;
  const isLowPrice = priceDiff < -15;
  const isCompetitive = !isHighPrice && !isLowPrice;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm">نبض السوق</p>
          <p className="text-xs text-gray-500 truncate">{listingTitle}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          مباشر
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">آخر ساعة</span>
            </div>
            <p className="text-2xl font-black text-blue-700">{pulse.views_last_hour}</p>
            <p className="text-xs text-blue-500">مشاهدة</p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">آخر 24 ساعة</span>
            </div>
            <p className="text-2xl font-black text-amber-700">{pulse.views_last_24h}</p>
            <p className="text-xs text-amber-500">مشاهدة</p>
          </div>
        </div>

        {pulse.competitor_count > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                {pulse.competitor_count} إعلان منافس في نفس الفئة والمدينة
              </span>
            </div>

            <div className={`rounded-xl p-3 border ${
              isCompetitive
                ? 'bg-green-50 border-green-100'
                : isHighPrice
                ? 'bg-red-50 border-red-100'
                : 'bg-amber-50 border-amber-100'
            }`}>
              <div className="flex items-start gap-2">
                {isCompetitive ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : isHighPrice ? (
                  <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold mb-1 ${
                    isCompetitive ? 'text-green-700' : isHighPrice ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {pulse.price_suggestion_reason}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">متوسط السوق</span>
                    <span className="font-black text-gray-900 text-sm">
                      {pulse.competitor_avg_price.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                  {!isCompetitive && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">السعر المقترح</span>
                      <span className={`font-black text-sm ${isHighPrice ? 'text-red-600' : 'text-amber-600'}`}>
                        {pulse.price_suggestion.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {pulse.views_last_hour === 0 && pulse.views_last_24h < 3 && (
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">مشاهدات منخفضة</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    جرّب تحسين الوصف أو تعديل السعر أو ترقية الإعلان للحصول على مزيد من الظهور
                  </p>
                  <Link
                    to={`/promote/${listingId}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 font-bold hover:underline"
                  >
                    ترقية الإعلان
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
