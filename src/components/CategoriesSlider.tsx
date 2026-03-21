import { Home, Recycle, Package, Factory, Hammer, Container, Warehouse } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, Category } from '../lib/supabase';

const iconMap: Record<string, typeof Home> = {
  Home,
  Recycle,
  Box: Package,
  Factory,
  Building: Hammer,
  Container,
  Warehouse,
};

const gradients = [
  { gradient: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50/80', border: 'border-teal-100', iconColor: 'text-teal-600' },
  { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50/80', border: 'border-amber-100', iconColor: 'text-amber-600' },
  { gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50/80', border: 'border-blue-100', iconColor: 'text-blue-600' },
  { gradient: 'from-slate-600 to-gray-700', bg: 'bg-slate-50/80', border: 'border-slate-100', iconColor: 'text-slate-600' },
  { gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50/80', border: 'border-emerald-100', iconColor: 'text-emerald-600' },
  { gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50/80', border: 'border-cyan-100', iconColor: 'text-cyan-600' },
  { gradient: 'from-green-600 to-teal-600', bg: 'bg-green-50/80', border: 'border-green-100', iconColor: 'text-green-600' },
];

interface CategoriesSliderProps {
  onSelectCategory: (categoryId: string | null) => void;
  selectedCategory: string | null;
}

export default function CategoriesSlider({ onSelectCategory, selectedCategory }: CategoriesSliderProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    if (data) {
      setCategories(data);
    }
  }
  return (
    <div className="bg-gradient-to-b from-white via-gray-50/50 to-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-800">تصفح حسب الفئة</h2>
          <div className="h-1 flex-1 mr-3 bg-gradient-to-l from-transparent via-gray-200 to-gray-300 rounded-full"></div>
        </div>
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6" dir="rtl">
          <div className="flex gap-3 sm:gap-4 min-w-max pb-2">
            <button
              onClick={() => onSelectCategory(null)}
              className={`group flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap relative ${
                selectedCategory === null
                  ? 'bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 text-white shadow-xl shadow-teal-200 scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:shadow-lg hover:scale-105 hover:border-teal-300'
              }`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all ${
                selectedCategory === null
                  ? 'bg-white/25 backdrop-blur-sm shadow-inner'
                  : 'bg-gradient-to-br from-teal-50 to-emerald-50 group-hover:from-teal-100 group-hover:to-emerald-100'
              }`}>
                <Home className={`w-6 h-6 sm:w-7 sm:h-7 ${selectedCategory === null ? 'text-white' : 'text-teal-600'}`} strokeWidth={2.5} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-center leading-tight">جميع الفئات</span>
              {selectedCategory === null && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
              )}
            </button>
            {categories.map((category, index) => {
              const Icon = iconMap[category.icon] || Recycle;
              const isSelected = selectedCategory === category.id;
              const style = gradients[index % gradients.length];
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className={`group flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap relative ${
                    isSelected
                      ? `bg-gradient-to-br ${style.gradient} text-white shadow-xl shadow-${style.iconColor.replace('text-', '')}/20 scale-105`
                      : `bg-white border-2 ${style.border} text-gray-700 hover:shadow-lg hover:scale-105 hover:${style.bg.replace('/80', '')}`
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-white/25 backdrop-blur-sm shadow-inner'
                      : `bg-gradient-to-br ${style.bg} ${style.bg.replace('50', '100')} group-hover:shadow-md`
                  }`}>
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isSelected ? 'text-white' : style.iconColor}`} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-center leading-tight min-w-[70px] px-1">{category.name_ar}</span>
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
