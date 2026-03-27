import { useState, useEffect } from 'react';
import { ArrowRight, Save, X, Image as ImageIcon, Trash2, TrendingUp, CheckCircle, AlertCircle, Loader, MapPin, Tag, FileText, DollarSign, Phone, Sparkles, ChevronLeft, Eye } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

interface Category { id: string; name_ar: string; icon: string; }
interface City { id: string; name_ar: string; }
interface Subcategory { id: string; category_id: string; name_ar: string; }
interface CategoryField {
  id: string; field_name: string; field_key: string;
  field_type: 'text' | 'number' | 'select' | 'textarea';
  field_options: string[]; is_required: boolean; placeholder: string; order_index: number;
}

interface ListingData {
  id: string; title: string; description: string; price: number;
  price_type: string; images: string[]; is_active: boolean;
  category_id: string; subcategory_id: string | null; city_id: string | null;
  contact_name: string; phone: string; whatsapp_number: string;
  custom_fields: Record<string, string> | null; slug: string; user_id: string;
}

const PRICE_TYPES = [
  { value: 'fixed', label: 'سعر ثابت' },
  { value: 'negotiable', label: 'قابل للتفاوض' },
  { value: 'free', label: 'مجاناً' },
];

const PHONE_REGEX = /(\+?966|00966|0)?[\s\-]?5[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d|(\+?[0-9]{7,})/g;
function stripPhones(v: string) {
  const found = PHONE_REGEX.test(v); PHONE_REGEX.lastIndex = 0;
  return { cleaned: v.replace(PHONE_REGEX, ''), found };
}

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryFields, setCategoryFields] = useState<CategoryField[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState('fixed');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [phoneWarn, setPhoneWarn] = useState('');
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([loadListing(), loadCategories(), loadCities()]);
  }, [id]);

  useEffect(() => {
    if (categoryId) {
      loadSubcategories(categoryId);
      loadCategoryFields(categoryId);
    }
  }, [categoryId]);

  async function loadListing() {
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
    if (error || !data) { navigate('/my-listings'); return; }
    if (data.user_id !== user?.id) { navigate('/my-listings'); return; }
    setListing(data);
    setTitle(data.title || '');
    setDescription(data.description || '');
    setPrice(data.price?.toString() || '');
    setPriceType(data.price_type || 'fixed');
    setCategoryId(data.category_id || '');
    setSubcategoryId(data.subcategory_id || '');
    setCityId(data.city_id || '');
    setContactName(data.contact_name || '');
    setPhone(data.phone || '');
    setWhatsapp(data.whatsapp_number || '');
    setImages(data.images || []);
    setCustomFields(data.custom_fields || {});
    setLoading(false);
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('id, name_ar, icon').eq('is_active', true).order('order_index');
    if (data) setCategories(data);
  }

  async function loadCities() {
    const { data } = await supabase.from('cities').select('id, name_ar').order('name_ar');
    if (data) setCities(data);
  }

  async function loadSubcategories(catId: string) {
    const { data } = await supabase.from('subcategories').select('id, category_id, name_ar').eq('category_id', catId).order('order_index');
    if (data) setSubcategories(data);
  }

  async function loadCategoryFields(catId: string) {
    const { data } = await supabase.from('category_fields').select('*').eq('category_id', catId).order('order_index');
    if (data) setCategoryFields(data);
  }

  function handleTextChange(val: string, setter: (v: string) => void) {
    const { cleaned, found } = stripPhones(val);
    if (found) { setPhoneWarn('لا يمكن إدخال أرقام الجوال في هذا الحقل'); setTimeout(() => setPhoneWarn(''), 4000); }
    setter(cleaned);
  }

  function removeImage(idx: number) { setImages(prev => prev.filter((_, i) => i !== idx)); }
  function moveImage(from: number, to: number) {
    setImages(prev => {
      const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr;
    });
  }

  async function handleSave() {
    if (!title.trim()) { setError('العنوان مطلوب'); return; }
    if (!categoryId) { setError('اختر فئة'); return; }
    if (!cityId) { setError('اختر المدينة'); return; }
    if (priceType === 'fixed' && !price) { setError('أدخل السعر'); return; }
    setError('');
    setSaving(true);
    const { error: err } = await supabase.from('listings').update({
      title: title.trim(),
      description: description.trim(),
      price: priceType !== 'free' ? (parseFloat(price) || 0) : 0,
      price_type: priceType,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      city_id: cityId || null,
      contact_name: contactName || phone,
      phone,
      whatsapp_number: whatsapp || phone,
      images,
      custom_fields: customFields,
    }).eq('id', id!);
    setSaving(false);
    if (err) { setError('حدث خطأ أثناء الحفظ: ' + err.message); return; }
    setSuccessMsg('تم تحديث الإعلان بنجاح!');
    setTimeout(() => { setSuccessMsg(''); setShowPromoteModal(true); }, 1200);
  }

  const sections = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: FileText },
    { id: 'media', label: 'الصور', icon: ImageIcon },
    { id: 'details', label: 'تفاصيل إضافية', icon: Tag },
    { id: 'location', label: 'الموقع', icon: MapPin },
    { id: 'contact', label: 'معلومات التواصل', icon: Phone },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">جاري تحميل الإعلان...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {successMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">هل تريد ترقية إعلانك؟</h3>
            <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
              ارفع إعلانك للصدارة وزد مشاهداتك بشكل كبير مع باقات الترقية
            </p>
            <div className="flex gap-3">
              <Link
                to={`/promote/${listing?.id}`}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-2xl font-bold text-center shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                ترقية الآن
              </Link>
              <button
                onClick={() => { setShowPromoteModal(false); navigate('/my-listings'); }}
                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/my-listings" className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-gray-900">تعديل الإعلان</h1>
              <p className="text-xs text-gray-400 truncate max-w-48">{listing?.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/listing/${listing?.slug || listing?.id}`}
              target="_blank"
              className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-60 active:scale-95"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError('')} className="mr-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {phoneWarn && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{phoneWarn}</span>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeSection === s.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-200'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === 'basic' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                المعلومات الأساسية
              </h2>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">عنوان الإعلان <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={e => handleTextChange(e.target.value, setTitle)}
                  placeholder="اكتب عنواناً واضحاً ومميزاً..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">{title.length}/100 حرف</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
                <textarea
                  value={description}
                  onChange={e => handleTextChange(e.target.value, setDescription)}
                  placeholder="أضف وصفاً تفصيلياً للمنتج..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الفئة <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-semibold text-right transition-all border ${
                        categoryId === cat.id
                          ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {cat.name_ar}
                    </button>
                  ))}
                </div>
              </div>

              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الفئة الفرعية</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSubcategoryId('')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        !subcategoryId ? 'bg-gray-700 text-white border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      الكل
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSubcategoryId(sub.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          subcategoryId === sub.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {sub.name_ar}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                السعر
              </h2>

              <div className="grid grid-cols-3 gap-2">
                {PRICE_TYPES.map(pt => (
                  <button
                    key={pt.value}
                    onClick={() => setPriceType(pt.value)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      priceType === pt.value
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>

              {priceType === 'fixed' && (
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 pl-16 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">ريال</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'media' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              صور الإعلان
            </h2>

            <ImageUpload
              onUpload={url => setImages(prev => [...prev, url])}
              folder="listings"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-100">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        رئيسية
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx > 0 && (
                        <button onClick={() => moveImage(idx, idx - 1)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                          <ChevronLeft className="w-4 h-4 text-gray-700 rotate-90" />
                        </button>
                      )}
                      <button onClick={() => removeImage(idx)} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                لا توجد صور بعد، أضف صوراً لجذب المشترين
              </div>
            )}
          </div>
        )}

        {activeSection === 'details' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              تفاصيل إضافية
            </h2>

            {categoryFields.length > 0 ? categoryFields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {field.field_name}
                  {field.is_required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {field.field_type === 'select' ? (
                  <select
                    value={customFields[field.field_key] || ''}
                    onChange={e => setCustomFields(p => ({ ...p, [field.field_key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">اختر...</option>
                    {field.field_options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.field_type === 'textarea' ? (
                  <textarea
                    value={customFields[field.field_key] || ''}
                    onChange={e => setCustomFields(p => ({ ...p, [field.field_key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                ) : (
                  <input
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    value={customFields[field.field_key] || ''}
                    onChange={e => setCustomFields(p => ({ ...p, [field.field_key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                لا توجد حقول إضافية لهذه الفئة
              </div>
            )}
          </div>
        )}

        {activeSection === 'location' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              الموقع
            </h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المدينة <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cities.map(city => (
                  <button
                    key={city.id}
                    onClick={() => setCityId(city.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold text-right transition-all border ${
                      cityId === city.id
                        ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {city.name_ar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500" />
              معلومات التواصل
            </h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="اسم التواصل"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الجوال <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم واتساب</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="05xxxxxxxx (اختياري)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1">اتركه فارغاً لاستخدام رقم الجوال</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all disabled:opacity-60 active:scale-98"
          >
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
          <Link
            to={`/promote/${listing?.id}`}
            className="flex items-center gap-2 bg-white border-2 border-amber-400 text-amber-600 px-5 py-4 rounded-2xl font-bold hover:bg-amber-50 transition-all"
          >
            <TrendingUp className="w-5 h-5" />
            ترقية
          </Link>
        </div>
      </div>
    </div>
  );
}
