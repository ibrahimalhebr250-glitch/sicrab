import { useState, useEffect } from 'react';
import { ArrowRight, MapPin, FileText, Image as ImageIcon, Check, ChevronLeft, User, Recycle, Box, Factory, Building, Container, Warehouse, Layers, Sparkles, TrendingUp, Shield, Tag, Ruler, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneVerification from '../components/PhoneVerification';
import ImageUpload from '../components/ImageUpload';

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
}

interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

interface CategoryField {
  id: string;
  category_id: string;
  field_name: string;
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'textarea';
  field_options: string[];
  use_subcategories: boolean;
  is_required: boolean;
  placeholder: string;
  order_index: number;
}

interface SubcategoryItem {
  subcategoryId: string;
  name: string;
  price: string;
  size: string;
  quantity: string;
}

const SEED_CATEGORIES_KEYWORDS = ['بذور', 'بذر', 'seed'];
const isSeedCategory = (name: string) => SEED_CATEGORIES_KEYWORDS.some(k => name.includes(k));

interface AddListingProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

const PHONE_REGEX = /(\+?966|00966|0)?[\s\-]?5[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d|(\+?[0-9]{7,})/g;

function stripPhoneNumbers(value: string): { cleaned: string; found: boolean } {
  const found = PHONE_REGEX.test(value);
  PHONE_REGEX.lastIndex = 0;
  const cleaned = value.replace(PHONE_REGEX, '');
  return { cleaned, found };
}

const DRAFT_KEY = 'addListingDraft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(data: object) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {}
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export default function AddListing({ onBack, onSuccess }: AddListingProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryFields, setCategoryFields] = useState<CategoryField[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const draft = !editId ? loadDraft() : null;

  const [step, setStep] = useState<number>(draft?.step ?? 1);
  const [imageUrls, setImageUrls] = useState<string[]>(draft?.imageUrls ?? []);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [formData, setFormData] = useState({
    category_id: draft?.formData?.category_id ?? '',
    subcategory_id: draft?.formData?.subcategory_id ?? '',
    city_id: draft?.formData?.city_id ?? '',
    title: draft?.formData?.title ?? '',
    description: draft?.formData?.description ?? '',
    price: draft?.formData?.price ?? '',
    price_type: draft?.formData?.price_type ?? 'fixed',
    contact_name: draft?.formData?.contact_name ?? '',
    phone: draft?.formData?.phone ?? '',
    whatsapp_number: draft?.formData?.whatsapp_number ?? '',
  });

  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>(draft?.customFieldsData ?? {});
  const [showDraftBanner, setShowDraftBanner] = useState<boolean>(!editId && !!draft);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [commissionAccepted, setCommissionAccepted] = useState(true);
  const [pricingMode, setPricingMode] = useState<'group' | 'individual'>('group');
  const [selectedSubcategoryItems, setSelectedSubcategoryItems] = useState<SubcategoryItem[]>([]);

  useEffect(() => {
    if (!editId) {
      saveDraft({ step, formData, imageUrls, customFieldsData });
    }
  }, [step, formData, imageUrls, customFieldsData, editId]);

  useEffect(() => {
    if (showDraftBanner) {
      const timer = setTimeout(() => setShowDraftBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showDraftBanner]);

  useEffect(() => {
    loadCategories();
    loadCities();

    if (editId) {
      setIsEditMode(true);
      loadListingData(editId);
    }
  }, [editId]);

  async function loadListingData(listingId: string) {
    try {
      console.log('🔍 [AddListing] Fetching listing data for:', listingId);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();

      if (error) {
        console.error('❌ [AddListing] Error loading listing:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ [AddListing] Listing not found');
        alert('الإعلان غير موجود');
        navigate('/my-listings');
        return;
      }

      console.log('✅ [AddListing] Listing loaded:', data);
      console.log('👤 [AddListing] Listing owner:', data.user_id);
      console.log('👤 [AddListing] Current user:', user?.id);

      if (data.user_id !== user?.id) {
        console.error('❌ [AddListing] Not the owner of this listing');
        alert('ليس لديك صلاحية لتعديل هذا الإعلان');
        navigate('/my-listings');
        return;
      }

      setFormData({
        category_id: data.category_id || '',
        subcategory_id: data.subcategory_id || '',
        city_id: data.city_id || '',
        title: data.title || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        price_type: data.price_type || 'fixed',
        contact_name: data.contact_name || '',
        phone: data.phone || '',
        whatsapp_number: data.whatsapp_number || '',
      });

      if (data.images && Array.isArray(data.images)) {
        setImageUrls(data.images);
      }

      if (data.custom_fields) {
        setCustomFieldsData(data.custom_fields);
      }

      console.log('✅ [AddListing] Form data loaded successfully');
    } catch (error) {
      console.error('❌ [AddListing] Error in loadListingData:', error);
    }
  }

  useEffect(() => {
    if (formData.category_id) {
      loadSubcategories(formData.category_id);
      loadCategoryFields(formData.category_id);
      setCustomFieldsData({});
    }
  }, [formData.category_id]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order_index');
    if (data) setCategories(data);
  }

  async function loadSubcategories(categoryId: string) {
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index');
    if (data) setSubcategories(data);
  }

  async function loadCategoryFields(categoryId: string) {
    const { data } = await supabase
      .from('category_fields')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index');
    if (data) setCategoryFields(data);
  }

  async function loadCities() {
    const { data } = await supabase
      .from('cities')
      .select('*')
      .order('name_ar');
    if (data) setCities(data);
  }

  function handleInputChange(field: string, value: string) {
    if (field === 'title' || field === 'description') {
      const { cleaned, found } = stripPhoneNumbers(value);
      if (found) {
        setPhoneWarning('لا يمكن إدخال أرقام الجوال في هذا الحقل. أدخل رقم جوالك في خانة "رقم الجوال" بالخطوة الأخيرة.');
        setTimeout(() => setPhoneWarning(null), 5000);
      }
      setFormData({ ...formData, [field]: cleaned });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  }

  function handleCustomFieldChange(fieldKey: string, value: string) {
    setCustomFieldsData({ ...customFieldsData, [fieldKey]: value });
  }

  function addImageUrl(url: string) {
    if (url && !imageUrls.includes(url)) {
      setImageUrls([...imageUrls, url]);
      setNewImageUrl('');
    }
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  function canProceedFromStep(stepNum: number): boolean {
    switch (stepNum) {
      case 1:
        return !!formData.category_id;
      case 2: {
        if (!formData.title) return false;
        if (subcategories.length > 0 && selectedSubcategoryItems.length === 0) return false;
        if (subcategories.length > 0) {
          if (pricingMode === 'group' && !formData.price) return false;
          if (pricingMode === 'individual' && selectedSubcategoryItems.some(i => !i.price)) return false;
        } else {
          if (!formData.price) return false;
        }
        return true;
      }
      case 3:
        return true;
      case 4:
        return !!formData.city_id;
      case 5:
        return !!formData.phone;
      default:
        return false;
    }
  }

  function toggleSubcategoryItem(sub: Subcategory) {
    setSelectedSubcategoryItems(prev => {
      const exists = prev.find(i => i.subcategoryId === sub.id);
      if (exists) return prev.filter(i => i.subcategoryId !== sub.id);
      return [...prev, { subcategoryId: sub.id, name: sub.name_ar, price: '', size: '', quantity: '' }];
    });
  }

  function updateSubcategoryItem(id: string, field: keyof SubcategoryItem, value: string) {
    setSelectedSubcategoryItems(prev =>
      prev.map(i => i.subcategoryId === id ? { ...i, [field]: value } : i)
    );
  }

  function buildCustomFieldsWithSubcategories(): Record<string, string> {
    if (selectedSubcategoryItems.length === 0) return customFieldsData;
    const combined: Record<string, string> = { ...customFieldsData };
    combined['selected_types'] = JSON.stringify(selectedSubcategoryItems);
    combined['pricing_mode'] = pricingMode;
    return combined;
  }

  async function handleSubmit() {
    if (!formData.category_id || !formData.title || !formData.price || !formData.phone || !formData.city_id) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }


    setLoading(true);

    console.log(isEditMode ? '✏️ [AddListing] Updating listing:' : '➕ [AddListing] Creating listing:', editId);

    const listingData = {
      user_id: user.id,
      category_id: formData.category_id,
      subcategory_id: formData.subcategory_id || null,
      city_id: formData.city_id || null,
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      price_type: formData.price_type,
      quantity: 1,
      unit: 'قطعة',
      condition: 'مستعمل',
      images: imageUrls,
      contact_name: formData.contact_name || formData.phone,
      contact_phone: formData.phone,
      whatsapp_number: formData.whatsapp_number || formData.phone,
      custom_fields: buildCustomFieldsWithSubcategories(),
      is_active: true,
    };

    let error;

    if (isEditMode && editId) {
      console.log('🔄 [AddListing] Performing UPDATE operation for listing:', editId);
      const result = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', editId);
      error = result.error;
      console.log('📊 [AddListing] Update result:', result);
    } else {
      console.log('🆕 [AddListing] Performing INSERT operation');
      const result = await supabase.from('listings').insert(listingData);
      error = result.error;
      console.log('📊 [AddListing] Insert result:', result);
    }

    setLoading(false);

    if (error) {
      console.error('❌ [AddListing] Error saving listing:', error);
      alert('حدث خطأ أثناء حفظ الإعلان: ' + error.message);
      return;
    }

    console.log('✅ [AddListing] Listing saved successfully');
    clearDraft();
    alert(isEditMode ? 'تم تحديث الإعلان بنجاح!' : 'تم إضافة الإعلان بنجاح!');

    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/my-listings');
    }
  }

  const totalSteps = 5;
  const progressPercentage = (step / totalSteps) * 100;

  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      Recycle: <Recycle className="w-7 h-7" />,
      Box: <Box className="w-7 h-7" />,
      Factory: <Factory className="w-7 h-7" />,
      Building: <Building className="w-7 h-7" />,
      Container: <Container className="w-7 h-7" />,
      Warehouse: <Warehouse className="w-7 h-7" />,
      Layers: <Layers className="w-7 h-7" />,
    };
    return iconMap[iconName] || <Box className="w-7 h-7" />;
  };

  const categoryColors = [
    { bg: 'from-orange-500 to-amber-500', light: 'from-orange-50 to-amber-50', border: 'border-orange-200', text: 'text-orange-600', ring: 'ring-orange-300' },
    { bg: 'from-blue-500 to-cyan-500', light: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'ring-blue-300' },
    { bg: 'from-emerald-500 to-teal-500', light: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-600', ring: 'ring-emerald-300' },
    { bg: 'from-rose-500 to-pink-500', light: 'from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-600', ring: 'ring-rose-300' },
    { bg: 'from-violet-500 to-blue-500', light: 'from-violet-50 to-blue-50', border: 'border-violet-200', text: 'text-violet-600', ring: 'ring-violet-300' },
    { bg: 'from-yellow-500 to-orange-500', light: 'from-yellow-50 to-orange-50', border: 'border-yellow-200', text: 'text-yellow-600', ring: 'ring-yellow-300' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showDraftBanner && !editId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            تم استعادة مسودتك المحفوظة
          </div>
          <button
            onClick={() => {
              clearDraft();
              setStep(1);
              setFormData({ category_id: '', subcategory_id: '', city_id: '', title: '', description: '', price: '', price_type: 'fixed', contact_name: '', phone: '', whatsapp_number: '' });
              setImageUrls([]);
              setCustomFieldsData({});
              setShowDraftBanner(false);
            }}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all"
          >
            بدء جديد
          </button>
        </div>
      )}
      {step === 1 ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 pt-12 pb-8 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
              <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
            </div>

            <div className="relative">
              <button
                onClick={onBack || (() => navigate('/'))}
                className="absolute -top-2 right-0 w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === 1 ? 'w-8 bg-amber-400' : 'w-4 bg-white/20'}`} />
                  ))}
                </div>
                <span className="text-white/50 text-xs mr-1">١ من ٥</span>
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white leading-tight">انشر إعلانك الآن</h1>
                  <p className="text-white/60 text-sm mt-0.5">ابدأ باختيار نوع المنتج</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-white/70 text-xs">وصول أسرع للمشترين</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-white/70 text-xs">نشر آمن وموثوق</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-28">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">اختر الفئة الأنسب لمنتجك</p>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat, index) => {
                const color = categoryColors[index % categoryColors.length];
                const isSelected = formData.category_id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleInputChange('category_id', cat.id)}
                    className={`relative group text-right overflow-hidden rounded-2xl border-2 transition-all duration-300 active:scale-95 ${
                      isSelected
                        ? `bg-gradient-to-br ${color.light} ${color.border} shadow-lg ring-2 ${color.ring}`
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px'}} />
                      </div>
                    )}

                    {isSelected && (
                      <div className={`absolute top-3 left-3 w-6 h-6 bg-gradient-to-br ${color.bg} rounded-full flex items-center justify-center shadow-md`}>
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    <div className="p-5">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-br ${color.bg} text-white shadow-lg`
                          : `bg-gray-50 ${color.text} group-hover:bg-gray-100`
                      }`}>
                        {getCategoryIcon(cat.icon)}
                      </div>

                      <h3 className={`font-bold text-base leading-tight transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {cat.name_ar}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{cat.name_en}</p>

                      <div className={`flex items-center gap-1 mt-3 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}>
                        <span className={`text-xs font-semibold ${color.text}`}>اختر هذه الفئة</span>
                        <ChevronLeft className={`w-3 h-3 ${color.text}`} />
                      </div>
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color.bg} transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40 shadow-lg">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.category_id}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                formData.category_id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-98'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {formData.category_id ? (
                <>
                  <span>التالي</span>
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </>
              ) : (
                'اختر فئة للمتابعة'
              )}
            </button>
            {formData.category_id && (
              <p className="text-center text-xs text-gray-400 mt-2">
                تم اختيار: <span className="font-semibold text-gray-700">{categories.find(c => c.id === formData.category_id)?.name_ar}</span>
              </p>
            )}
          </div>
        </div>
      ) : (
      <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setStep(step - 1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 text-center mx-4">
            <h1 className="text-lg font-bold text-gray-900">{isEditMode ? 'تعديل إعلان' : 'إضافة إعلان'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">خطوة {step} من {totalSteps}</p>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {phoneWarning && (
        <div className="fixed top-16 left-0 right-0 z-50 mx-4 mt-2 flex items-start gap-3 bg-red-600 text-white px-4 py-3.5 rounded-2xl shadow-xl animate-fade-in">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-black">!</span>
          </div>
          <p className="text-sm font-medium leading-snug">{phoneWarning}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">ما نوع المنتج؟</h2>
                <p className="text-gray-500">اختر الفئة المناسبة لمنتجك</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleInputChange('category_id', cat.id)}
                    className={`relative group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                      formData.category_id === cat.id
                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                    }`}
                  >
                    {formData.category_id === cat.id && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 leading-tight">{cat.name_ar}</h3>
                    <p className="text-xs text-gray-500 mt-1">{cat.name_en}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">تفاصيل العرض</h2>
                <p className="text-gray-500">أضف معلومات واضحة لجذب المشترين</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">*</span>
                    عنوان الإعلان
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="مثال: أشجار زيتون كبيرة للبيع"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right">ممنوع ذكر أرقام الجوال هنا</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700">الوصف التفصيلي</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أضف تفاصيل عن الحجم، العمر، الصنف، أي معلومات مهمة..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right">ممنوع ذكر أرقام الجوال هنا</p>
              </div>

              {subcategories.length > 0 && (() => {
                const catName = categories.find(c => c.id === formData.category_id)?.name_ar || '';
                const isSeed = isSeedCategory(catName);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                      <h3 className="text-base font-black text-gray-900 px-1">اختر الأنواع المتاحة</h3>
                      <div className="h-px flex-1 bg-gradient-to-l from-cyan-400 to-blue-500"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {subcategories.map((sub) => {
                        const isSelected = selectedSubcategoryItems.some(i => i.subcategoryId === sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubcategoryItem(sub)}
                            className={`relative flex items-center gap-2 p-3 rounded-xl border-2 text-right transition-all duration-200 active:scale-95 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-sm font-semibold flex-1 leading-tight ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                              {sub.name_ar}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedSubcategoryItems.length === 0 && (
                      <p className="text-xs text-amber-600 font-medium text-center bg-amber-50 rounded-lg py-2 px-3">
                        يجب اختيار نوع واحد على الأقل للمتابعة
                      </p>
                    )}

                    {selectedSubcategoryItems.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-gray-200"></div>
                          <h3 className="text-sm font-black text-gray-700 px-1">طريقة التسعير</h3>
                          <div className="h-px flex-1 bg-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPricingMode('group')}
                            className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                              pricingMode === 'group'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-green-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              pricingMode === 'group' ? 'border-green-500' : 'border-gray-300'
                            }`}>
                              {pricingMode === 'group' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                            </div>
                            <div className="text-right flex-1">
                              <p className={`text-sm font-bold ${pricingMode === 'group' ? 'text-green-800' : 'text-gray-700'}`}>سعر موحد</p>
                              <p className="text-xs text-gray-400">نفس السعر لجميع الأنواع</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPricingMode('individual')}
                            className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                              pricingMode === 'individual'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              pricingMode === 'individual' ? 'border-blue-500' : 'border-gray-300'
                            }`}>
                              {pricingMode === 'individual' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            </div>
                            <div className="text-right flex-1">
                              <p className={`text-sm font-bold ${pricingMode === 'individual' ? 'text-blue-800' : 'text-gray-700'}`}>سعر لكل نوع</p>
                              <p className="text-xs text-gray-400">سعر مختلف لكل نوع</p>
                            </div>
                          </button>
                        </div>

                        {pricingMode === 'group' && (
                          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <label className="block mb-2">
                              <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-green-600" />
                                <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">*</span>
                                السعر الموحد
                              </span>
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  value={formData.price}
                                  onChange={(e) => handleInputChange('price', e.target.value)}
                                  placeholder="0"
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">ر.س</span>
                              </div>
                              <select
                                value={formData.price_type}
                                onChange={(e) => handleInputChange('price_type', e.target.value)}
                                className="px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none bg-white text-sm font-medium text-gray-700"
                              >
                                <option value="fixed">ثابت</option>
                                <option value="negotiable">قابل للتفاوض</option>
                                <option value="per_unit">للوحدة</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {selectedSubcategoryItems.map((item) => (
                            <div key={item.subcategoryId} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                              </div>

                              <div className="space-y-3">
                                {pricingMode === 'individual' && (
                                  <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                      <Tag className="w-3 h-3" />
                                      <span className="text-red-500">*</span> السعر
                                    </label>
                                    <div className="flex gap-2">
                                      <div className="relative flex-1">
                                        <input
                                          type="number"
                                          value={item.price}
                                          onChange={(e) => updateSubcategoryItem(item.subcategoryId, 'price', e.target.value)}
                                          placeholder="0"
                                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ر.س</span>
                                      </div>
                                      {isSeed && (
                                        <select
                                          value={item.quantity}
                                          onChange={(e) => updateSubcategoryItem(item.subcategoryId, 'quantity', e.target.value)}
                                          className="px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white text-sm font-medium text-gray-700 min-w-[90px]"
                                        >
                                          <option value="">الوحدة</option>
                                          <option value="للجرام">للجرام</option>
                                          <option value="للكيلو">للكيلو</option>
                                          <option value="للطن">للطن</option>
                                          <option value="للكيس">للكيس</option>
                                          <option value="للحبة">للحبة</option>
                                          <option value="للعلبة">للعلبة</option>
                                        </select>
                                      )}
                                    </div>
                                    {isSeed && !item.quantity && (
                                      <p className="text-xs text-amber-600 mt-1">حدد الوحدة (جرام / كيلو / طن...)</p>
                                    )}
                                  </div>
                                )}

                                {isSeed ? (
                                  <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                      <Package className="w-3 h-3" />
                                      الكمية المتاحة (اختياري)
                                    </label>
                                    <input
                                      type="text"
                                      value={item.size}
                                      onChange={(e) => updateSubcategoryItem(item.subcategoryId, 'size', e.target.value)}
                                      placeholder="مثال: 50 كيلو، 100 كيس..."
                                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                      <Ruler className="w-3 h-3" />
                                      الحجم / المواصفات (مثال: 2 متر، ارتفاع 150 سم)
                                    </label>
                                    <input
                                      type="text"
                                      value={item.size}
                                      onChange={(e) => updateSubcategoryItem(item.subcategoryId, 'size', e.target.value)}
                                      placeholder="مثال: ارتفاع 2 متر، عمر 3 سنوات..."
                                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {subcategories.length === 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <label className="block mb-2">
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">*</span>
                        السعر
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">ر.س</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <label className="block mb-2">
                      <span className="text-sm font-bold text-gray-700">نوع السعر</span>
                    </label>
                    <select
                      value={formData.price_type}
                      onChange={(e) => handleInputChange('price_type', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none bg-white"
                    >
                      <option value="fixed">ثابت</option>
                      <option value="negotiable">قابل للتفاوض</option>
                      <option value="per_unit">للوحدة</option>
                    </select>
                  </div>
                </div>
              )}

              {categoryFields.filter(f => !f.use_subcategories).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                    <h3 className="text-base font-black text-gray-900 px-1">مواصفات إضافية</h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-cyan-400 to-blue-500"></div>
                  </div>

                  {categoryFields.filter(f => !f.use_subcategories).map((field) => (
                    <div key={field.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <label className="block mb-2">
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          {field.is_required && (
                            <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">*</span>
                          )}
                          {field.field_name}
                        </span>
                      </label>

                      {field.field_type === 'select' && (
                        <select
                          value={customFieldsData[field.field_key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none bg-white"
                          required={field.is_required}
                        >
                          <option value="">{field.placeholder}</option>
                          {field.field_options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}

                      {field.field_type === 'text' && (
                        <input
                          type="text"
                          value={customFieldsData[field.field_key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none"
                          required={field.is_required}
                        />
                      )}

                      {field.field_type === 'number' && (
                        <input
                          type="number"
                          value={customFieldsData[field.field_key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none"
                          required={field.is_required}
                        />
                      )}

                      {field.field_type === 'textarea' && (
                        <textarea
                          value={customFieldsData[field.field_key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none resize-none"
                          required={field.is_required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">وصف دقيق = مبيعات أسرع</h4>
                    <p className="text-xs text-gray-600">التفاصيل تساعد المشترين على اتخاذ قرار الشراء بسرعة</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
                  <ImageIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">صور المنتج</h2>
                <p className="text-gray-500">أضف صور واضحة لزيادة المصداقية</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
                <ImageUpload images={imageUrls} onChange={setImageUrls} maxImages={6} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl mb-4">
                  <MapPin className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">الموقع</h2>
                <p className="text-gray-500">حدد مدينتك لتسهيل وصول المشترين</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-3">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">*</span>
                    اختر المدينة
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={formData.city_id}
                    onChange={(e) => handleInputChange('city_id', e.target.value)}
                    className="w-full px-4 py-3.5 pr-4 pl-10 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none bg-white appearance-none text-gray-700 font-medium"
                  >
                    <option value="">-- اختر المدينة --</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name_ar}
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {formData.city_id && (
                  <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-semibold text-red-700">
                      {cities.find(c => c.id === formData.city_id)?.name_ar}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('city_id', '')}
                      className="mr-auto text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      تغيير
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-0.5">لماذا تحديد المدينة مهم؟</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">المشترون يبحثون عن منتجات قريبة منهم. تحديد مدينتك يزيد ظهور إعلانك في نتائج البحث المحلية ويسرع عملية البيع.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl mb-4">
                  <User className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">معلومات التواصل</h2>
                <p className="text-gray-500">الخطوة الأخيرة قبل النشر</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700">اسم جهة الاتصال</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="الاسم أو اسم الشركة"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all outline-none"
                />
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs">*</span>
                    رقم الجوال
                  </span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all outline-none"
                  dir="ltr"
                />
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700">رقم الواتساب</span>
                  <span className="text-xs text-gray-500 mr-2">(اختياري - سيتم استخدام رقم الجوال إذا لم يتم تحديده)</span>
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="05xxxxxxxx أو اتركه فارغاً لاستخدام رقم الجوال"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all outline-none"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 سيتم التواصل معك عبر واتساب فقط لحماية خصوصيتك
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">جاهز للنشر!</h3>
                    <p className="text-sm text-gray-600 mb-3">تأكد من صحة المعلومات قبل النشر. يمكنك التعديل لاحقاً من "إعلاناتي"</p>
                    <div className="bg-white/80 rounded-lg p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">الفئة:</span>
                        <span className="font-bold text-gray-900">
                          {categories.find((c) => c.id === formData.category_id)?.name_ar}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">العنوان:</span>
                        <span className="font-bold text-gray-900">{formData.title || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">السعر:</span>
                        <span className="font-bold text-green-600">{formData.price ? `${formData.price} ر.س` : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">الصور:</span>
                        <span className="font-bold text-gray-900">{imageUrls.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCommissionAccepted(!commissionAccepted)}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 ${
                  commissionAccepted
                    ? 'bg-amber-50 border-amber-400 shadow-md'
                    : 'bg-white border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 mt-0.5 ${
                    commissionAccepted
                      ? 'bg-amber-500 border-amber-500 shadow-sm'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {commissionAccepted && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
                      أتعهد بتسديد العمولة المستحقة
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      أقر بأن عمولة المنصة واجبة السداد عند إتمام أي صفقة عبر هذا الإعلان، وأن ذلك دين في ذمتي.
                    </p>
                    {!commissionAccepted && (
                      <p className="text-xs text-amber-600 font-semibold mt-2">
                        يجب الموافقة على هذا التعهد قبل النشر
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceedFromStep(step)}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 active:scale-98 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            التالي
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!formData.phone || loading || !commissionAccepted}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 active:scale-98 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري النشر...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                نشر الإعلان
              </>
            )}
          </button>
        )}
      </div>

      {showPhoneVerification && (
        <PhoneVerification
          onClose={() => setShowPhoneVerification(false)}
          onSuccess={() => {
            setShowPhoneVerification(false);
            window.location.reload();
          }}
        />
      )}

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden">
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 shadow-lg">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">إعلانك جاهز!</h2>
                <p className="text-white/90 text-sm">بقي خطوة واحدة فقط للنشر</p>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  سجل الآن واحصل على مميزات رائعة
                </h3>
                <div className="space-y-3 text-right">
                  <div className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">نشر إعلانات غير محدودة</p>
                      <p className="text-xs text-gray-600">انشر ما تريد بدون قيود</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">إدارة إعلاناتك بسهولة</p>
                      <p className="text-xs text-gray-600">تعديل وحذف وترويج إعلاناتك</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">نظام رسائل مباشر</p>
                      <p className="text-xs text-gray-600">تواصل مع المشترين بسرعة</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">بناء سمعة موثوقة</p>
                      <p className="text-xs text-gray-600">احصل على تقييمات وزد مبيعاتك</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login', { state: { from: '/add-listing', formData, imageUrls } })}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  تسجيل الدخول والنشر
                </button>

                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                  إلغاء
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                التسجيل سريع ومجاني تماماً
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
