import { Grid2x2 as Grid } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, Subcategory } from '../lib/supabase';

interface SubcategoriesSliderProps {
  category: string | null;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  selectedSubcategory: string | null;
}

export default function SubcategoriesSlider({ category, onSelectSubcategory, selectedSubcategory }: SubcategoriesSliderProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    if (category) {
      loadSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [category]);

  async function loadSubcategories() {
    if (!category) return;

    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', category)
      .order('order_index');

    if (error) {
      console.error('Error loading subcategories:', error);
      return;
    }

    if (data) {
      setSubcategories(data);
    }
  }

  if (!category || subcategories.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4" dir="rtl">
          <div className="flex gap-1.5 sm:gap-2 min-w-max pb-2">
            <button
              onClick={() => onSelectSubcategory(null)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md flex items-center gap-1.5 sm:gap-2 ${
                selectedSubcategory === null
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-emerald-600 scale-105'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-700 hover:from-amber-50 hover:to-orange-50 hover:border-orange-300 hover:text-orange-700 hover:scale-105'
              }`}
            >
              <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
              <span>الكل</span>
            </button>
            {subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => onSelectSubcategory(subcategory.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md ${
                  selectedSubcategory === subcategory.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-emerald-600 scale-105'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-700 hover:from-amber-50 hover:to-orange-50 hover:border-orange-300 hover:text-orange-700 hover:scale-105'
                }`}
              >
                {subcategory.name_ar}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
