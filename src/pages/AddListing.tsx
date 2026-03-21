import { useState, useEffect } from 'react';
import { ArrowRight, Upload, X, MapPin, Package, DollarSign, FileText, Image as ImageIcon, Check, ChevronLeft, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  is_required: boolean;
  placeholder: string;
  order_index: number;
}

interface AddListingProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function AddListing({ onBack, onSuccess }: AddListingProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryFields, setCategoryFields] = useState<CategoryField[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    city_id: '',
    title: '',
    description: '',
    price: '',
    price_type: 'fixed',
    quantity: '',
    unit: 'طن',
    condition: 'مستعمل',
    contact_name: '',
    phone: '',
    whatsapp_number: '',
  });

  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
    loadCities();
  }, []);

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
    setFormData({ ...formData, [field]: value });
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
      case 2:
        return !!formData.title && !!formData.price;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return !!formData.phone;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!formData.category_id || !formData.title || !formData.price || !formData.phone) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!profile?.phone_verified) {
      setShowPhoneVerification(true);
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      category_id: formData.category_id,
      subcategory_id: formData.subcategory_id || null,
      city_id: formData.city_id || null,
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      price_type: formData.price_type,
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit,
      condition: formData.condition,
      images: imageUrls,
      contact_name: formData.contact_name,
      phone: formData.phone,
      whatsapp_number: formData.whatsapp_number || formData.phone,
      custom_fields: customFieldsData,
      is_active: true,
    });

    setLoading(false);

    if (error) {
      console.error('Error creating listing:', error);
      alert('حدث خطأ أثناء إضافة الإعلان');
      return;
    }

    alert('تم إضافة الإعلان بنجاح!');
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/');
    }
  }

  const totalSteps = 5;
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={step === 1 ? (onBack || (() => navigate('/'))) : () => setStep(step - 1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 text-center mx-4">
            <h1 className="text-lg font-bold text-gray-900">إضافة إعلان</h1>
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

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
                  <Package className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">ما نوع المواد؟</h2>
                <p className="text-gray-500">اختر الفئة المناسبة لمادتك الخردة</p>
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

              {formData.category_id && subcategories.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-bold text-gray-900">تحديد أكثر دقة</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">اختر نوع المادة بالتحديد (اختياري)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleInputChange('subcategory_id', sub.id)}
                        className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                          formData.subcategory_id === sub.id
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md scale-105'
                            : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {sub.name_ar}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">تفاصيل العرض</h2>
                <p className="text-gray-500">أضف معلومات واضحة لجذب المشترين</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs">*</span>
                    عنوان الإعلان
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="مثال: حديد سكراب نظيف جداً"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-2">
                  <span className="text-sm font-bold text-gray-700">الوصف التفصيلي</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أضف تفاصيل عن الحالة، المنشأ، أي معلومات مهمة..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <label className="block mb-2">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs">*</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <label className="block mb-2">
                    <span className="text-sm font-bold text-gray-700">الكمية</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <label className="block mb-2">
                    <span className="text-sm font-bold text-gray-700">الوحدة</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
                  >
                    <option value="طن">طن</option>
                    <option value="كيلو">كيلو</option>
                    <option value="قطعة">قطعة</option>
                    <option value="متر">متر</option>
                    <option value="متر مربع">متر مربع</option>
                    <option value="لتر">لتر</option>
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100">
                <label className="block mb-3">
                  <span className="text-sm font-bold text-gray-700">حالة المادة</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['جديد', 'مستعمل', 'متوسط'].map((condition) => (
                    <button
                      key={condition}
                      onClick={() => handleInputChange('condition', condition)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.condition === condition
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                          : 'bg-white text-gray-700 hover:bg-purple-100 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              {categoryFields.length > 0 && (
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">تفاصيل إضافية</h3>
                    <div className="h-1 flex-1 bg-gradient-to-l from-blue-500 to-cyan-500 rounded-full"></div>
                  </div>

                  {categoryFields.map((field) => (
                    <div key={field.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fade-in">
                      <label className="block mb-2">
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          {field.is_required && (
                            <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs">*</span>
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
                            <option key={option} value={option}>
                              {option}
                            </option>
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

                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border-2 border-cyan-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">معلومات دقيقة = مبيعات أسرع</h4>
                        <p className="text-xs text-gray-600">هذه التفاصيل تساعد المشترين على اتخاذ قرار الشراء بسرعة</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl mb-4">
                  <MapPin className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">الموقع</h2>
                <p className="text-gray-500">حدد موقع المادة لتسهيل التواصل</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block mb-3">
                  <span className="text-sm font-bold text-gray-700">المدينة</span>
                </label>
                <select
                  value={formData.city_id}
                  onChange={(e) => handleInputChange('city_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none bg-white"
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">نصيحة</h3>
                    <p className="text-sm text-gray-600">تحديد الموقع بدقة يساعد المشترين على التواصل معك بشكل أسرع</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {cities.slice(0, 6).map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleInputChange('city_id', city.id)}
                    className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.city_id === city.id
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {city.name_ar}
                  </button>
                ))}
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
                  <div>
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
            disabled={!formData.phone || loading}
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
  );
}
