import { useEffect, useState } from 'react';
import { Package, Eye, MessageCircle, Plus, CreditCard as Edit2, Trash2, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name_ar: string;
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
  slug: string;
  order_index: number;
  is_active: boolean;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState<string | null>(null);

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

      const listingsCounts = listingsResult.data?.reduce((acc: any, listing: any) => {
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
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الفئات الفرعية المرتبطة به.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

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
    if (!confirm('هل أنت متأكد من حذف هذه الفئة الفرعية؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

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

        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                      <Package className="w-6 h-6" />
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCategoryActive(category.id, category.is_active)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                      title={category.is_active ? 'إخفاء' : 'إظهار'}
                    >
                      {category.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setShowAddSubcategory(category.id)}
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
                    {category.subcategories && category.subcategories.length > 0 && (
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
                    )}
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

              {expandedCategories.has(category.id) && category.subcategories && category.subcategories.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">الفئات الفرعية:</h4>
                  <div className="space-y-2">
                    {category.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">{sub.name_ar}</span>
                          <span className="text-xs text-gray-400">({sub.slug})</span>
                        </div>
                        <button
                          onClick={() => deleteSubcategory(sub.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddCategoryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
        .from('categories')
        .insert([{
          name_ar: nameAr,
          name_en: nameEn || nameAr,
          slug,
          icon: 'package',
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
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 shadow-xl">
      <h3 className="text-lg font-black text-gray-900 mb-4">إضافة قسم جديد</h3>
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
        <div className="flex gap-2">
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
