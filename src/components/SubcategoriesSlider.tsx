import { Grid2x2 as Grid, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, Subcategory } from '../lib/supabase';

interface SubcategoriesSliderProps {
  categoryId: string | null;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  selectedSubcategory: string | null;
}

export default function SubcategoriesSlider({ categoryId, onSelectSubcategory, selectedSubcategory }: SubcategoriesSliderProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    if (categoryId) {
      loadSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [categoryId]);

  async function loadSubcategories() {
    if (!categoryId) return;

    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index');

    if (error) {
      console.error('Error loading subcategories:', error);
      return;
    }

    if (data) {
      setSubcategories(data);
    }
  }

  if (!categoryId || subcategories.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
          <h3 className="text-xs sm:text-sm font-bold text-gray-700">الأنواع الفرعية</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6" dir="rtl">
          <div className="flex gap-2 sm:gap-2.5 min-w-max pb-2">
            <button
              onClick={() => onSelectSubcategory(null)}
              className={`group px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md flex items-center gap-2 ${
                selectedSubcategory === null
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border border-cyan-600 scale-105 shadow-cyan-200'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-cyan-300 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:scale-105'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                selectedSubcategory === null ? 'bg-white/25' : 'bg-gray-100 group-hover:bg-cyan-100'
              }`}>
                <Grid className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span>جميع الأنواع</span>
            </button>
            {subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => onSelectSubcategory(subcategory.id)}
                className={`group px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md flex items-center gap-2 ${
                  selectedSubcategory === subcategory.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border border-cyan-600 scale-105 shadow-cyan-200'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-cyan-300 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:scale-105'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                  selectedSubcategory === subcategory.id ? 'bg-white/25' : 'bg-gray-100 group-hover:bg-cyan-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedSubcategory === subcategory.id ? 'bg-white' : 'bg-gray-400 group-hover:bg-cyan-500'
                  }`}></div>
                </div>
                <span>{subcategory.name_ar}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
