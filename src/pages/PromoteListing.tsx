import { useState, useEffect } from 'react';
import { ArrowRight, Star, Pin, Zap, Check, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

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

export default function PromoteListing() {
  const { id: listingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [platformMode, setPlatformMode] = useState('free');

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setPageLoading(true);
    const [settingsRes, packagesRes] = await Promise.all([
      supabase.from('site_settings').select('promotions_enabled, platform_mode').maybeSingle(),
      supabase.from('promotion_packages').select('*').eq('is_active', true).order('display_order', { ascending: true }),
    ]);

    if (settingsRes.data) {
      setPromotionsEnabled(settingsRes.data.promotions_enabled ?? true);
      setPlatformMode(settingsRes.data.platform_mode ?? 'free');
    }

    if (!packagesRes.error && packagesRes.data) {
      setPackages(packagesRes.data);
    }
    setPageLoading(false);
  }

  async function handlePromote() {
    if (!selectedPackage || !user || !listingId) return;

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
    navigate('/my-promotions');
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

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-amber-500 mb-4"></div>
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 rounded-xl hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-md active:scale-95 transition-all duration-200 font-semibold text-sm"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            <span>رجوع</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ترقية الإعلان</h1>
            <p className="text-sm text-gray-600">اختر الباقة المناسبة لإبراز إعلانك</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!promotionsEnabled && (
          <div className="mb-6 p-6 bg-gradient-to-br from-slate-100 to-gray-100 border-2 border-gray-300 rounded-2xl text-center">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Star className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-black text-gray-700 text-lg mb-1">الباقات غير متاحة حالياً</h3>
            <p className="text-gray-500 text-sm">
              المنصة في وضع الإطلاق المجاني — جميع الإعلانات تظهر بنفس الأولوية للجميع بدون قيود.
            </p>
            <p className="text-gray-400 text-xs mt-2">ستُتاح خيارات الترقية لاحقاً</p>
          </div>
        )}

        {promotionsEnabled && platformMode === 'free' && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-800 font-bold text-sm">المنصة في الوضع المجاني</p>
              <p className="text-emerald-700 text-xs mt-0.5">
                ترقيتك ستحمل شارة التمييز لكن جميع الإعلانات تظهر بنفس الأولوية حالياً. عند تفعيل وضع الباقات ستحصل على أولوية الظهور.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {promotionsEnabled && <>
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
        </>}
      </div>
    </div>
  );
}
