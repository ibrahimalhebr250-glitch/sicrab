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

const styles = [
  { active: 'from-teal-500 to-emerald-600', iconBg: 'bg-teal-50', iconColor: 'text-teal-600', ring: 'ring-teal-200', dot: 'bg-teal-500' },
  { active: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  { active: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  { active: 'from-slate-600 to-gray-700', iconBg: 'bg-slate-50', iconColor: 'text-slate-600', ring: 'ring-slate-200', dot: 'bg-slate-500' },
  { active: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  { active: 'from-cyan-500 to-teal-600', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600', ring: 'ring-cyan-200', dot: 'bg-cyan-500' },
  { active: 'from-green-600 to-teal-600', iconBg: 'bg-green-50', iconColor: 'text-green-600', ring: 'ring-green-200', dot: 'bg-green-500' },
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

    if (!error && data) {
      setCategories(data);
    }
  }

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-700 tracking-wide">تصفح الفئات</h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-6 sm:px-6" dir="rtl">
          <div className="flex gap-2 sm:gap-3 pb-1" style={{ minWidth: 'max-content' }}>

            {/* All categories button */}
            <button
              onClick={() => onSelectCategory(null)}
              className={`group flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-200 relative focus:outline-none ${
                selectedCategory === null ? 'scale-100' : 'hover:scale-105'
              }`}
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                selectedCategory === null
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200'
                  : 'bg-gray-50 border-2 border-gray-100 group-hover:border-teal-200 group-hover:bg-teal-50/50'
              }`}>
                <Home
                  className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                    selectedCategory === null ? 'text-white' : 'text-gray-500 group-hover:text-teal-600'
                  }`}
                  strokeWidth={2}
                />
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold text-center leading-tight w-14 sm:w-16 truncate ${
                selectedCategory === null ? 'text-teal-700' : 'text-gray-500 group-hover:text-teal-600'
              }`}>
                الكل
              </span>
              {selectedCategory === null && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-teal-500 rounded-full"></div>
              )}
            </button>

            {categories.map((category, index) => {
              const isImageUrl = category.icon && (category.icon.startsWith('http') || category.icon.startsWith('/'));
              const Icon = !isImageUrl ? (iconMap[category.icon] || Recycle) : Recycle;
              const isSelected = selectedCategory === category.id;
              const s = styles[index % styles.length];

              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className={`group flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-200 relative focus:outline-none ${
                    isSelected ? 'scale-100' : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? `bg-gradient-to-br ${s.active} shadow-lg`
                      : `${s.iconBg} border-2 border-transparent group-hover:border-opacity-40 group-hover:ring-2 ${s.ring}`
                  }`}>
                    {isImageUrl ? (
                      <img
                        src={category.icon}
                        alt={category.name_ar}
                        className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-90' : 'opacity-80 group-hover:opacity-100'}`}
                      />
                    ) : (
                      <Icon
                        className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                          isSelected ? 'text-white' : s.iconColor
                        }`}
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-semibold text-center leading-tight w-14 sm:w-16 truncate ${
                    isSelected ? s.iconColor : 'text-gray-500 group-hover:' + s.iconColor
                  }`}>
                    {category.name_ar}
                  </span>
                  {isSelected && (
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 ${s.dot} rounded-full`}></div>
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
