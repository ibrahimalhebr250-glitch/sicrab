import { useState, useEffect } from 'react';
import { ArrowRight, Star, Pin, Zap, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PromotionPackage {
  id: string;
  type: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  duration_days: number;
  features_ar: string[];
  features_en: string[];
  display_order: number;
}

interface PromoteListingProps {
  listingId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PromoteListing({ listingId, onBack, onSuccess }: PromoteListingProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    const { data, error } = await supabase
      .from('promotion_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading packages:', error);
      return;
    }

    if (data) {
      setPackages(data);
    }
  }

  async function handlePromote() {
    if (!selectedPackage || !user) return;

    setLoading(true);
    setError('');

    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pkg.duration_days);

    const { error: insertError } = await supabase
      .from('promotions')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        type: pkg.type,
        end_date: endDate.toISOString(),
        price: pkg.price,
        status: 'active',
        payment_status: 'completed',
        payment_method: 'demo'
      });

    if (insertError) {
      console.error('Error creating promotion:', insertError);
      setError('حدث خطأ أثناء ترقية الإعلان');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'featured':
        return <Star className="w-8 h-8" />;
      case 'pinned':
        return <Pin className="w-8 h-8" />;
      case 'featured_pinned':
        return <Zap className="w-8 h-8" />;
      default:
        return <Star className="w-8 h-8" />;
    }
  };

  const getPackageColor = (type: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ترقية الإعلان</h1>
            <p className="text-sm text-gray-600">اختر الباقة المناسبة لإبراز إعلانك</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 ${
                selectedPackage === pkg.id
                  ? 'border-amber-500 shadow-xl scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${getPackageColor(pkg.type)} flex items-center justify-center text-white shadow-lg`}>
                    {getPackageIcon(pkg.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{pkg.name_ar}</h3>
                      <div className="text-right">
                        <div className="text-3xl font-black text-gray-900">{pkg.price}$</div>
                        <div className="text-sm text-gray-600">{pkg.duration_days} أيام</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{pkg.description_ar}</p>

                    <div className="space-y-2">
                      {pkg.features_ar.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 left-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-bold text-blue-900 mb-2">ملاحظة هامة</h4>
          <p className="text-sm text-blue-800">
            في هذا الإصدار التجريبي، سيتم تفعيل الترقية مباشرة بدون دفع. في النسخة النهائية، سيتم التكامل مع بوابات الدفع الإلكتروني (Stripe، PayPal، STC Pay، Mada).
          </p>
        </div>

        <button
          onClick={handlePromote}
          disabled={!selectedPackage || loading}
          className="mt-8 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
        >
          {loading ? 'جاري الترقية...' : 'تفعيل الترقية الآن'}
        </button>
      </div>
    </div>
  );
}
