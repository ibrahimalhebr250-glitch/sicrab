import { useEffect, useState, useRef } from 'react';
import { Package, Eye, Plus, Trash2, ChevronDown, ChevronUp, EyeOff, Image, X, Check, Search, Upload, Loader, Pencil, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadImage, validateImageFile } from '../../lib/imageUpload';

interface Category {
  id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  subcategories?: Subcategory[];
  listingsCount?: number;
}

interface Subcategory {
  id: string;
  category_id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  order_index: number;
  is_active: boolean;
}

interface ImageItem {
  url: string;
  label: string;
  group: string;
}

const IMAGE_LIBRARY: ImageItem[] = [
  { url: 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نخلة تمر', group: 'نخيل' },
  { url: 'https://images.pexels.com/photos/3609409/pexels-photo-3609409.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نخيل صحراوي', group: 'نخيل' },
  { url: 'https://images.pexels.com/photos/2469122/pexels-photo-2469122.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نخلة جوز الهند', group: 'نخيل' },
  { url: 'https://images.pexels.com/photos/6024561/pexels-photo-6024561.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نخلة زينة', group: 'نخيل' },
  { url: 'https://images.pexels.com/photos/1537445/pexels-photo-1537445.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نخيل متعدد', group: 'نخيل' },
  { url: 'https://images.pexels.com/photos/3044473/pexels-photo-3044473.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نخيل الواحة', group: 'نخيل' },

  { url: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة خضراء', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/601798/pexels-photo-601798.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة ضخمة', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة الزيتون', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/1459496/pexels-photo-1459496.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'أشجار الغابة', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'غابة كثيفة', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/1048036/pexels-photo-1048036.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة الخريف', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة الجوافة', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة الليمون', group: 'أشجار' },
  { url: 'https://images.pexels.com/photos/2300742/pexels-photo-2300742.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شجرة فواكه', group: 'أشجار' },

  { url: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نباتات خضراء', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نبات داخلي', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/1084188/pexels-photo-1084188.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نبات الصبار', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'ورود وزهور', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/1034733/pexels-photo-1034733.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نبات العشب', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/807598/pexels-photo-807598.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نبات الزرع', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/1213294/pexels-photo-1213294.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نبات الريحان', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/1006085/pexels-photo-1006085.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'زراعة الخضروات', group: 'نباتات' },
  { url: 'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'نبات الزينة', group: 'نباتات' },

  { url: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'سيارة رياضية', group: 'سيارات' },
  { url: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'سيارة فاخرة', group: 'سيارات' },
  { url: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'سيارة عائلية', group: 'سيارات' },
  { url: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'سيارة دفع رباعي', group: 'سيارات' },
  { url: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'شاحنة نقل', group: 'سيارات' },
  { url: 'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'سيارات متعددة', group: 'سيارات' },
  { url: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'سيارة قديمة', group: 'سيارات' },

  { url: 'https://images.pexels.com/photos/1280564/pexels-photo-1280564.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'جرار زراعي', group: 'آلات زراعية' },
  { url: 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'حصادة آلية', group: 'آلات زراعية' },
  { url: 'https://images.pexels.com/photos/1482860/pexels-photo-1482860.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'جرار مزرعة', group: 'آلات زراعية' },
  { url: 'https://images.pexels.com/photos/1239162/pexels-photo-1239162.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'آلة حصاد', group: 'آلات زراعية' },
  { url: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'معدات زراعية', group: 'آلات زراعية' },
  { url: 'https://images.pexels.com/photos/2132254/pexels-photo-2132254.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'آلة ري', group: 'آلات زراعية' },
  { url: 'https://images.pexels.com/photos/1239168/pexels-photo-1239168.jpeg?auto=compress&cs=tinysrgb&w=400', label: 'حراثة الأرض', group: 'آلات زراعية' },
];

const GROUPS = ['الكل', 'نخيل', 'أشجار', 'نباتات', 'سيارات', 'آلات زراعية'];

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const [categoriesResult, subcategoriesResult, listingsResult] = await Promise.all([
        supabase.from('categories').select('*').order('order_index'),
        supabase.from('subcategories').select('*').order('order_index'),
        supabase.from('listings').select('category_id')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (subcategoriesResult.error) throw subcategoriesResult.error;

      const listingsCounts = listingsResult.data?.reduce((acc: Record<string, number>, listing: any) => {
        acc[listing.category_id] = (acc[listing.category_id] || 0) + 1;
        return acc;
      }, {});

      const categoriesWithSub = categoriesResult.data?.map((cat: any) => ({
        ...cat,
        subcategories: subcategoriesResult.data?.filter((sub: any) => sub.category_id === cat.id) || [],
        listingsCount: listingsCounts?.[cat.id] || 0
      }));

      setCategories(categoriesWithSub || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCategoryActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: currentStatus ? 'deactivate_category' : 'activate_category',
        p_target_type: 'category',
        p_target_id: id
      });

      loadCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الفئات الفرعية المرتبطة به.')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'delete_category',
        p_target_type: 'category',
        p_target_id: id
      });

      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  }

  async function deleteSubcategory(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة الفرعية؟')) return;

    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'delete_subcategory',
        p_target_type: 'subcategory',
        p_target_id: id
      });

      loadCategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  }

  function toggleExpanded(categoryId: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة الأقسام والفئات</h1>
            <p className="text-slate-300">إضافة وتعديل الأقسام والفئات الفرعية</p>
          </div>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            قسم جديد
          </button>
        </div>

        {showAddCategory && (
          <AddCategoryForm
            onClose={() => setShowAddCategory(false)}
            onSuccess={loadCategories}
          />
        )}

        {editingCategory && (
          <EditCategoryModal
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onSuccess={() => { setEditingCategory(null); loadCategories(); }}
          />
        )}

        {editingSubcategory && (
          <EditSubcategoryModal
            subcategory={editingSubcategory}
            onClose={() => setEditingSubcategory(null)}
            onSuccess={() => { setEditingSubcategory(null); loadCategories(); }}
          />
        )}

        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                      {category.icon && category.icon.startsWith('http') ? (
                        <img src={category.icon} alt={category.name_ar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-gray-900">{category.name_ar}</h3>
                        {!category.is_active && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">
                            مخفي
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{category.slug} • {category.listingsCount} إعلان</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="تعديل القسم"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleCategoryActive(category.id, category.is_active)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                      title={category.is_active ? 'إخفاء' : 'إظهار'}
                    >
                      {category.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSubcategory(showAddSubcategory === category.id ? null : category.id);
                        if (!expandedCategories.has(category.id) && showAddSubcategory !== category.id) {
                          const next = new Set(expandedCategories);
                          next.add(category.id);
                          setExpandedCategories(next);
                        }
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="إضافة فئة فرعية"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleExpanded(category.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {showAddSubcategory === category.id && (
                  <div className="mt-4 pt-4 border-t">
                    <AddSubcategoryForm
                      categoryId={category.id}
                      onClose={() => setShowAddSubcategory(null)}
                      onSuccess={loadCategories}
                    />
                  </div>
                )}
              </div>

              {expandedCategories.has(category.id) && (
                <div className="bg-gray-50 px-6 py-4 border-t">
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">الفئات الفرعية ({category.subcategories.length}):</h4>
                      <div className="space-y-2">
                        {category.subcategories.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span className="font-medium text-gray-700">{sub.name_ar}</span>
                              <span className="text-xs text-gray-400">({sub.slug})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingSubcategory(sub)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="تعديل الفئة الفرعية"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSubcategory(sub.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">لا توجد فئات فرعية بعد. انقر + لإضافة فئة فرعية.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageLibraryModal({ selected, onSelect, onClose }: {
  selected: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [activeGroup, setActiveGroup] = useState('الكل');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = IMAGE_LIBRARY.filter(img => {
    const matchGroup = activeGroup === 'الكل' || img.group === activeGroup;
    const matchSearch = !search || img.label.includes(search) || img.group.includes(search);
    return matchGroup && matchSearch;
  });

  async function handleFileUpload(file: File) {
    setUploadError('');
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      onSelect(uploaded.url);
    } catch {
      setUploadError('فشل في رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">اختيار صورة الأيقونة</h2>
              <p className="text-sm text-gray-500">من المكتبة أو ارفع من جهازك</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'library'
                ? 'border-green-500 text-green-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Image className="w-4 h-4" />
            مكتبة الصور
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-green-500 text-green-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            رفع من الجهاز
          </button>
        </div>

        {activeTab === 'library' ? (
          <>
            <div className="p-4 border-b bg-gray-50 space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن صورة..."
                  className="w-full pr-10 pl-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {GROUPS.map(group => (
                  <button
                    key={group}
                    onClick={() => setActiveGroup(group)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      activeGroup === group
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>لا توجد صور مطابقة</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {filtered.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelect(img.url)}
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-lg ${
                        selected === img.url
                          ? 'ring-[3px] ring-green-500 ring-offset-1 shadow-lg scale-105'
                          : 'ring-[2px] ring-gray-200 hover:ring-green-400'
                      }`}
                      title={img.label}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      {selected === img.url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/30">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-1 opacity-0 group-hover:opacity-100 transition-all">
                        <p className="text-white text-xs text-center truncate">{img.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {selected && selected.startsWith('http') ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-green-400 shadow-xl">
                  <img src={selected} alt="uploaded" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <Check className="w-5 h-5" />
                  تم رفع الصورة بنجاح
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-green-500 hover:text-green-700 transition-all text-sm"
                >
                  رفع صورة مختلفة
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`w-full max-w-md border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 transition-all cursor-pointer ${
                  dragOver
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50'
                }`}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Loader className="w-8 h-8 text-green-600 animate-spin" />
                    </div>
                    <p className="text-green-700 font-bold">جاري رفع الصورة...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center transition-all">
                      <Upload className="w-8 h-8 text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-800 text-lg">اسحب الصورة هنا</p>
                      <p className="text-gray-500 text-sm mt-1">أو انقر لاختيار صورة من جهازك</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                      <span className="px-2 py-1 bg-white rounded-lg border border-gray-200">JPG</span>
                      <span className="px-2 py-1 bg-white rounded-lg border border-gray-200">PNG</span>
                      <span className="px-2 py-1 bg-white rounded-lg border border-gray-200">WEBP</span>
                      <span className="px-2 py-1 bg-white rounded-lg border border-gray-200">حتى 5 ميجابايت</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <div className="w-full max-w-md px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-center">
                {uploadError}
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selected && (
              <>
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-green-400 shadow">
                  <img src={selected} alt="selected" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm text-gray-600 font-medium">تم اختيار الصورة</span>
              </>
            )}
            {!selected && <span className="text-sm text-gray-400">لم يتم اختيار صورة بعد</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all">
              إلغاء
            </button>
            <button
              onClick={onClose}
              disabled={!selected}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              تأكيد الاختيار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditCategoryModal({ category, onClose, onSuccess }: {
  category: Category;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nameAr, setNameAr] = useState(category.name_ar);
  const [nameEn, setNameEn] = useState(category.name_en || '');
  const [selectedImage, setSelectedImage] = useState(category.icon || '');
  const [showLibrary, setShowLibrary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setError('');
    setSaving(true);
    try {
      const slug = nameAr.toLowerCase().replace(/\s+/g, '-');

      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name_ar: nameAr,
          name_en: nameEn || nameAr,
          slug,
          icon: selectedImage || 'package',
        })
        .eq('id', category.id);

      if (updateError) throw updateError;

      supabase.rpc('log_admin_action', {
        p_action: 'update_category',
        p_target_type: 'category',
        p_target_id: category.id
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التعديل');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {showLibrary && (
        <ImageLibraryModal
          selected={selectedImage}
          onSelect={(url) => { setSelectedImage(url); setShowLibrary(false); }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">تعديل القسم</h2>
                <p className="text-sm text-gray-500">{category.name_ar}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم القسم بالعربية</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم القسم بالعربية"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم القسم بالإنجليزية (اختياري)</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="اسم القسم بالإنجليزية"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">أيقونة القسم</label>
              <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                {selectedImage && selectedImage.startsWith('http') ? (
                  <>
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-400 shadow-md flex-shrink-0">
                      <img src={selectedImage} alt="selected" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-bold text-blue-700">تم اختيار الصورة</p>
                      <p className="text-sm text-gray-500">انقر لتغيير الصورة</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-all">
                      <Image className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-all" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-bold text-gray-700 group-hover:text-blue-700 transition-all">اختر صورة من المكتبة</p>
                      <p className="text-sm text-gray-400">أو ارفع من جهازك</p>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-all" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-sky-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-sky-700 transition-all disabled:opacity-50"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function EditSubcategoryModal({ subcategory, onClose, onSuccess }: {
  subcategory: Subcategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nameAr, setNameAr] = useState(subcategory.name_ar);
  const [nameEn, setNameEn] = useState(subcategory.name_en || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setError('');
    setSaving(true);
    try {
      const slug = nameAr.toLowerCase().replace(/\s+/g, '-');

      const { error: updateError } = await supabase
        .from('subcategories')
        .update({
          name_ar: nameAr,
          name_en: nameEn || nameAr,
          slug,
        })
        .eq('id', subcategory.id);

      if (updateError) throw updateError;

      supabase.rpc('log_admin_action', {
        p_action: 'update_subcategory',
        p_target_type: 'subcategory',
        p_target_id: subcategory.id
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التعديل');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">تعديل الفئة الفرعية</h2>
              <p className="text-sm text-gray-500">{subcategory.name_ar}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الفئة الفرعية بالعربية</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="اسم الفئة الفرعية بالعربية"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الفئة الفرعية بالإنجليزية (اختياري)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="اسم الفئة الفرعية بالإنجليزية"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCategoryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim()) return;

    setSaving(true);
    try {
      const slug = nameAr.toLowerCase().replace(/\s+/g, '-');

      const { error } = await supabase
        .from('categories')
        .insert([{
          name_ar: nameAr,
          name_en: nameEn || nameAr,
          slug,
          icon: selectedImage || 'package',
          is_active: true
        }]);

      if (error) {
        console.error('Error creating category:', error);
        alert('حدث خطأ أثناء الإضافة: ' + (error.message || 'خطأ غير معروف'));
        throw error;
      }

      supabase.rpc('log_admin_action', {
        p_action: 'create_category',
        p_target_type: 'category',
        p_target_id: 'new'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {showLibrary && (
        <ImageLibraryModal
          selected={selectedImage}
          onSelect={(url) => {
            setSelectedImage(url);
            setShowLibrary(false);
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 shadow-xl border border-green-100">
        <h3 className="text-lg font-black text-gray-900 mb-5">إضافة قسم جديد</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="اسم القسم بالعربية"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            required
          />
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="اسم القسم بالإنجليزية (اختياري)"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
          />

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">أيقونة القسم</label>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              {selectedImage ? (
                <>
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-green-400 shadow-md flex-shrink-0">
                    <img src={selectedImage} alt="selected" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-green-700">تم اختيار الصورة</p>
                    <p className="text-sm text-gray-500">انقر لتغيير الصورة</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-all">
                    <Image className="w-8 h-8 text-gray-400 group-hover:text-green-500 transition-all" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-gray-700 group-hover:text-green-700 transition-all">اختر صورة من المكتبة</p>
                    <p className="text-sm text-gray-400">أشجار • نخيل • نباتات • سيارات • آلات زراعية</p>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-green-500 flex-shrink-0 transition-all" />
                </>
              )}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {saving ? 'جاري الإضافة...' : 'إضافة القسم'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function AddSubcategoryForm({ categoryId, onClose, onSuccess }: {
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim()) return;

    setSaving(true);
    try {
      const slug = nameAr.toLowerCase().replace(/\s+/g, '-');

      const { error } = await supabase
        .from('subcategories')
        .insert([{
          category_id: categoryId,
          name_ar: nameAr,
          name_en: nameEn || nameAr,
          slug,
          is_active: true
        }]);

      if (error) {
        console.error('Error creating subcategory:', error);
        alert('حدث خطأ أثناء الإضافة: ' + (error.message || 'خطأ غير معروف'));
        throw error;
      }

      supabase.rpc('log_admin_action', {
        p_action: 'create_subcategory',
        p_target_type: 'subcategory',
        p_target_id: categoryId
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating subcategory:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={nameAr}
        onChange={(e) => setNameAr(e.target.value)}
        placeholder="اسم الفئة الفرعية بالعربية"
        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
        required
      />
      <input
        type="text"
        value={nameEn}
        onChange={(e) => setNameEn(e.target.value)}
        placeholder="اسم الفئة الفرعية بالإنجليزية (اختياري)"
        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {saving ? 'جاري الإضافة...' : 'إضافة'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
