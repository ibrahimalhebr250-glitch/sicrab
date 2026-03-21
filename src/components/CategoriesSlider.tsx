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
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
  { gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
  { gradient: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50' },
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { gradient: 'from-slate-600 to-slate-700', bg: 'bg-slate-50' },
  { gradient: 'from-teal-500 to-emerald-500', bg: 'bg-teal-50' },
  { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
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
    <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <h2 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 text-right">استكشف الأقسام</h2>
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4" dir="rtl">
          <div className="flex gap-2 sm:gap-2.5 min-w-max pb-2">
            <button
              onClick={() => onSelectCategory(null)}
              className={`flex flex-col items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-300 whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                  : 'bg-emerald-50 text-gray-700 hover:shadow-md hover:scale-105'
              }`}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                selectedCategory === null ? 'bg-white/20 shadow-inner' : 'bg-white shadow-sm'
              }`}>
                <Home className={`w-5 h-5 sm:w-5 sm:h-5 ${selectedCategory === null ? 'text-white' : 'text-emerald-600'}`} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-center leading-tight">الكل</span>
            </button>
            {categories.map((category, index) => {
              const Icon = iconMap[category.icon] || Recycle;
              const isSelected = selectedCategory === category.id;
              const style = gradients[index % gradients.length];
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className={`flex flex-col items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-300 whitespace-nowrap ${
                    isSelected
                      ? `bg-gradient-to-br ${style.gradient} text-white shadow-lg scale-105`
                      : `${style.bg} text-gray-700 hover:shadow-md hover:scale-105`
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                    isSelected ? 'bg-white/20 shadow-inner' : 'bg-white shadow-sm'
                  }`}>
                    <Icon className={`w-5 h-5 sm:w-5 sm:h-5 ${isSelected ? 'text-white' : 'text-gray-700'}`} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-center leading-tight max-w-[60px] sm:max-w-none">{category.name_ar}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
