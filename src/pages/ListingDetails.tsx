import { useEffect, useState } from 'react';
import { MapPin, Eye, ChevronLeft, ChevronRight, MessageCircle, Calendar, Tag, Box, X, Share2, ArrowRight, Flag, Star, Ruler, Package, Layers, Heart } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFavorite } from '../hooks/useFavorite';
import ShareSheet from '../components/ShareSheet';
import SellerCard from '../components/SellerCard';
import SimilarListings from '../components/SimilarListings';
import SellerListings from '../components/SellerListings';
import ListingActivity from '../components/ListingActivity';
import SafetyTips from '../components/SafetyTips';
import ReportModal from '../components/ReportModal';
import ReviewModal from '../components/ReviewModal';

interface PriceTierDetail {
  id: string;
  name: string;
  trunkSize: string;
  height: string;
  price: string;
  unit: string;
  count: string;
}

interface SubcategoryItemDetail {
  subcategoryId: string;
  name: string;
  price: string;
  size: string;
  quantity: string;
  priceTiers: PriceTierDetail[];
  useTiers: boolean;
}

function getSelectedTypes(listing: Listing): SubcategoryItemDetail[] {
  try {
    const cf = listing.custom_fields as Record<string, string> | null;
    if (!cf || !cf['selected_types']) return [];
    return JSON.parse(cf['selected_types']);
  } catch {
    return [];
  }
}

function getPricingMode(listing: Listing): 'group' | 'individual' {
  try {
    const cf = listing.custom_fields as Record<string, string> | null;
    return (cf?.['pricing_mode'] as 'group' | 'individual') || 'group';
  } catch {
    return 'group';
  }
}

const SEED_KEYWORDS = ['بذور', 'بذر', 'seed'];
function isSeedListing(listing: Listing): boolean {
  const catName = (listing.categories as { name_ar?: string } | null)?.name_ar || '';
  return SEED_KEYWORDS.some(k => catName.includes(k));
}

export default function ListingDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const listingId = listing?.id || '';
  const { isFavorited, toggle: toggleFavorite } = useFavorite(listingId, user?.id);

  useEffect(() => {
    if (slug) {
      loadListing();
    }
  }, [slug]);

  async function loadListing() {
    if (!slug) return;
    setLoading(true);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabase
      .from('listings')
      .select('*, cities(*), categories(*), subcategories(*)')
      .maybeSingle();

    if (isUuid) {
      query = supabase
        .from('listings')
        .select('*, cities(*), categories(*), subcategories(*)')
        .eq('id', slug)
        .maybeSingle();
    } else {
      query = supabase
        .from('listings')
        .select('*, cities(*), categories(*), subcategories(*)')
        .eq('slug', slug)
        .maybeSingle();
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading listing:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setListing(data);
      incrementViewCount(data.id);
    }
    setLoading(false);
  }

  async function incrementViewCount(id: string) {
    let visitorKey = user?.id;

    if (!visitorKey) {
      const storageKey = 'anon_visitor_key';
      let anonKey = localStorage.getItem(storageKey);
      if (!anonKey) {
        anonKey = `anon_${crypto.randomUUID()}`;
        localStorage.setItem(storageKey, anonKey);
      }
      visitorKey = anonKey;
    }

    await supabase.rpc('increment_listing_views_unique', {
      p_listing_id: id,
      p_visitor_key: visitorKey,
    });
  }

  function nextImage() {
    if (listing && listing.images) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  }

  function prevImage() {
    if (listing && listing.images) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  }

  function getTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'قبل أقل من ساعة';
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    if (diffInDays === 1) return 'قبل يوم';
    if (diffInDays < 7) return `قبل ${diffInDays} أيام`;
    if (diffInDays < 14) return 'قبل أسبوع';
    if (diffInDays < 30) return `قبل ${Math.floor(diffInDays / 7)} أسابيع`;
    return `قبل ${Math.floor(diffInDays / 30)} شهر`;
  }

  async function handleWhatsAppContact() {
    if (!listing) return;

    await supabase.rpc('increment_whatsapp_clicks', { listing_id: listingId });

    const whatsappNumber = (listing.whatsapp_number || listing.contact_phone).replace(/\D/g, '');
    const platformName = 'سوق المشاتل والأشجار';
    const listingUrl = window.location.href;

    const message = `السلام عليكم

وجدت إعلانك في منصة ${platformName}

عنوان الإعلان:
${listing.title}

رابط الإعلان:
${listingUrl}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-600 text-lg mb-4">الإعلان غير موجود</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center mx-4 truncate">
            {listing.title}
          </h1>
          <button
            onClick={toggleFavorite}
            className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all ${isFavorited ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          </button>
          <button
            onClick={() => setShowShareSheet(true)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="relative bg-black">
        <div className="aspect-square md:aspect-video relative">
          <img
            src={images[currentImageIndex]}
            alt={listing.title}
            className="w-full h-full object-contain"
            onClick={() => setShowImageGallery(true)}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-lg active:scale-95 transition-all"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-lg active:scale-95 transition-all"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
              </button>
              <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{listing.views_count}</span>
            </div>
            <div className="px-3 py-1.5 bg-green-500/80 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>طلبات: {listing.whatsapp_clicks || 0}</span>
            </div>
          </div>
        </div>

        {images.length > 1 && (
          <div className="px-3 py-3 flex gap-2 overflow-x-auto bg-black">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex ? 'border-amber-500 scale-105' : 'border-gray-600 opacity-70'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex-1 leading-tight">
            {listing.title}
          </h2>
          <span className="flex-shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
            {listing.condition}
          </span>
        </div>

        {(() => {
          const selectedTypes = getSelectedTypes(listing);
          const pricingMode = getPricingMode(listing);
          const isSeed = isSeedListing(listing);

          if (selectedTypes.length > 0) {
            return (
              <div className="mb-4">
                {pricingMode === 'group' ? (
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                    {listing.price.toLocaleString()} ريال
                    {listing.price_type === 'negotiable' && <span className="text-base md:text-lg text-gray-500 mr-2">(قابل للتفاوض)</span>}
                  </div>
                ) : (
                  <div className="mb-3 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100 inline-flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">سعر مختلف لكل نوع - راجع التفاصيل أدناه</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-base font-bold text-gray-900">الأنواع المتاحة</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{selectedTypes.length} نوع</span>
                </div>

                <div className="space-y-3">
                  {selectedTypes.map((item) => (
                    <div key={item.subcategoryId} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                          <span className="font-black text-white text-sm">{item.name}</span>
                          {!isSeed && item.size && (
                            <span className="flex items-center gap-1 text-xs text-emerald-100 bg-emerald-700/50 px-2 py-0.5 rounded-lg">
                              <Ruler className="w-3 h-3" />
                              {item.size}
                            </span>
                          )}
                          {isSeed && item.quantity && (
                            <span className="flex items-center gap-1 text-xs text-emerald-100 bg-emerald-700/50 px-2 py-0.5 rounded-lg">
                              <Package className="w-3 h-3" />
                              {item.quantity}
                            </span>
                          )}
                        </div>
                        {pricingMode === 'individual' && item.price && !item.useTiers && (
                          <span className="font-black text-white text-sm flex items-baseline gap-1">
                            {Number(item.price).toLocaleString()}
                            <span className="text-xs font-bold text-emerald-200">ريال</span>
                          </span>
                        )}
                      </div>

                      {item.useTiers && item.priceTiers && item.priceTiers.length > 0 ? (
                        <div className="bg-gray-50">
                          <div className="grid grid-cols-5 gap-0 border-b border-gray-200 bg-gray-100 px-3 py-1.5">
                            <span className="text-[10px] font-bold text-gray-500 text-center">الاسم</span>
                            <span className="text-[10px] font-bold text-gray-500 text-center">الارتفاع</span>
                            <span className="text-[10px] font-bold text-gray-500 text-center">قطر الساق</span>
                            <span className="text-[10px] font-bold text-gray-500 text-center">العدد</span>
                            <span className="text-[10px] font-bold text-gray-500 text-center">السعر</span>
                          </div>
                          {item.priceTiers.map((tier, idx) => (
                            <div
                              key={tier.id}
                              className={`grid grid-cols-5 gap-0 px-3 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100 last:border-0`}
                            >
                              <span className="text-xs font-bold text-gray-900 text-center">
                                {tier.name || '-'}
                              </span>
                              <span className="text-xs font-semibold text-gray-700 text-center">
                                {tier.height ? `${tier.height} م` : '-'}
                              </span>
                              <span className="text-xs font-semibold text-gray-700 text-center">
                                {tier.trunkSize ? `${tier.trunkSize} سم` : '-'}
                              </span>
                              <span className="text-xs font-bold text-blue-700 text-center">
                                {tier.count ? `${tier.count} ${tier.unit || ''}` : '-'}
                              </span>
                              <span className="text-xs font-black text-emerald-700 text-center">
                                {tier.price ? `${Number(tier.price).toLocaleString()} ر` : '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !item.useTiers && (
                          <div className="px-3 py-2 bg-gray-50 flex items-center gap-3">
                            {item.quantity && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Package className="w-3 h-3 text-gray-400" />
                                {item.quantity}
                              </span>
                            )}
                            {item.size && !isSeed && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Ruler className="w-3 h-3 text-gray-400" />
                                {item.size}
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="mb-4">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {listing.price.toLocaleString()} ريال
                {listing.price_type === 'per_unit' && <span className="text-lg md:text-xl mr-2">/ {listing.unit}</span>}
                {listing.price_type === 'negotiable' && <span className="text-base md:text-lg text-gray-500 mr-2">(قابل للتفاوض)</span>}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
            <Box className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">الكمية</p>
              <p className="font-bold text-gray-900 truncate">{listing.quantity} {listing.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">الموقع</p>
              <p className="font-bold text-gray-900 truncate">{listing.cities?.name_ar}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl">
            <Layers className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">القسم</p>
              <p className="font-bold text-gray-900 truncate">{listing.categories?.name_ar}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">منذ</p>
              <p className="font-bold text-gray-900 truncate">{getTimeAgo(listing.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-2 bg-gray-100"></div>

      <div className="bg-white px-4 py-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
          الوصف
        </h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
          {listing.description}
        </p>
      </div>

      <div className="h-2 bg-gray-100"></div>

      <div className="bg-white px-4 py-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
          معلومات البائع
        </h3>

        {listing.user_id && (
          <SellerCard sellerId={listing.user_id} sellerName={listing.contact_name || 'مستخدم'} />
        )}

        {listing.latitude && listing.longitude && (
          <a
            href={`https://maps.google.com/?q=${listing.latitude},${listing.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-3 border-2 border-amber-500 text-amber-600 rounded-xl font-bold hover:bg-amber-50 active:scale-98 transition-all"
          >
            <MapPin className="w-5 h-5" />
            عرض الموقع على الخريطة
          </a>
        )}
      </div>

      <div className="h-2 bg-gray-100"></div>

      <ListingActivity
        viewsCount={listing.views_count || 0}
        whatsappClicks={listing.whatsapp_clicks || 0}
        isOwner={user?.id === listing.user_id}
      />

      <div className="h-2 bg-gray-100"></div>

      <div className="bg-white px-4 py-5">
        <SafetyTips />
      </div>

      <div className="h-2 bg-gray-100"></div>

      <SellerListings
        sellerId={listing.user_id}
        currentListingId={listingId}
        onViewListing={(id) => navigate(`/listing/${id}`)}
      />

      <div className="h-2 bg-gray-100"></div>

      <SimilarListings
        currentListingId={listingId}
        categoryId={listing.category_id}
        cityId={listing.city_id}
        onViewListing={(id) => navigate(`/listing/${id}`)}
      />

      <div className="h-20"></div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
          >
            <Flag className="w-4 h-4" />
            <span>إبلاغ</span>
          </button>

          {user && user.id !== listing.user_id && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-all"
            >
              <Star className="w-4 h-4" />
              <span>تقييم</span>
            </button>
          )}
        </div>

        <button
          onClick={handleWhatsAppContact}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-6 h-6" />
          تواصل عبر واتساب
        </button>
      </div>

      {showImageGallery && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowImageGallery(false)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <span className="text-white font-medium">
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={images[currentImageIndex]}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showShareSheet && (
        <ShareSheet
          listingId={listingId}
          title={listing.title}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {showReportModal && (
        <ReportModal
          listingId={listingId}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
            alert('تم إرسال البلاغ بنجاح. شكراً لمساهمتك في تحسين المنصة.');
          }}
        />
      )}

      {showReviewModal && listing.user_id && (
        <ReviewModal
          sellerId={listing.user_id}
          sellerName={listing.contact_name || 'البائع'}
          listingId={listingId}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            alert('شكراً لتقييمك!');
          }}
        />
      )}
    </div>
  );
}
