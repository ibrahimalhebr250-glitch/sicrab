import { MapPin, DollarSign, CheckCircle2, Package2, ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, City } from '../lib/supabase';

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export interface FilterState {
  cityId: string;
  priceRange: string;
  condition: string;
  quantityRange: string;
}

type FilterType = 'city' | 'price' | 'condition' | 'quantity';

interface FilterOption {
  value: string;
  label: string;
}

export default function Filters({ filters: externalFilters, onFiltersChange, onClearFilters }: FiltersProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  useEffect(() => {
    loadCities();
  }, []);

  async function loadCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name_ar');

    if (error) {
      console.error('Error loading cities:', error);
      return;
    }

    if (data) {
      setCities(data);
    }
  }

  function handleFilterChange(key: keyof FilterState, value: string) {
    onFiltersChange({ ...externalFilters, [key]: value });
    setActiveFilter(null);
  }

  function clearFilter(key: keyof FilterState) {
    onFiltersChange({ ...externalFilters, [key]: '' });
  }

  const priceOptions: FilterOption[] = [
    { value: '0-1000', label: 'أقل من 1,000' },
    { value: '1000-5000', label: '1,000 - 5,000' },
    { value: '5000-10000', label: '5,000 - 10,000' },
    { value: '10000-50000', label: '10,000 - 50,000' },
    { value: '50000+', label: 'أكثر من 50,000' },
  ];

  const conditionOptions: FilterOption[] = [
    { value: 'جديد', label: 'جديد' },
    { value: 'مستعمل', label: 'مستعمل' },
    { value: 'يحتاج صيانة', label: 'يحتاج صيانة' },
  ];

  const quantityOptions: FilterOption[] = [
    { value: '1-10', label: '1 - 10' },
    { value: '10-50', label: '10 - 50' },
    { value: '50-100', label: '50 - 100' },
    { value: '100+', label: 'أكثر من 100' },
  ];

  const getFilterLabel = (key: keyof FilterState): string => {
    if (!externalFilters[key]) return '';

    switch (key) {
      case 'cityId':
        const city = cities.find(c => c.id === externalFilters.cityId);
        return city ? city.name_ar : '';
      case 'priceRange':
        const price = priceOptions.find(p => p.value === externalFilters.priceRange);
        return price ? price.label : '';
      case 'condition':
        return externalFilters.condition;
      case 'quantityRange':
        const quantity = quantityOptions.find(q => q.value === externalFilters.quantityRange);
        return quantity ? quantity.label : '';
      default:
        return '';
    }
  };

  const hasActiveFilters = externalFilters.cityId || externalFilters.priceRange || externalFilters.condition || externalFilters.quantityRange;

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveFilter(activeFilter === 'city' ? null : 'city')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                externalFilters.cityId
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : activeFilter === 'city'
                  ? 'bg-amber-50 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{externalFilters.cityId ? getFilterLabel('cityId') : 'المدينة'}</span>
              {externalFilters.cityId && (
                <X
                  className="w-3.5 h-3.5 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilter('cityId');
                  }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'price' ? null : 'price')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                externalFilters.priceRange
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : activeFilter === 'price'
                  ? 'bg-green-50 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{externalFilters.priceRange ? getFilterLabel('priceRange') : 'السعر'}</span>
              {externalFilters.priceRange && (
                <X
                  className="w-3.5 h-3.5 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilter('priceRange');
                  }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'condition' ? null : 'condition')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                externalFilters.condition
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : activeFilter === 'condition'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{externalFilters.condition ? getFilterLabel('condition') : 'الحالة'}</span>
              {externalFilters.condition && (
                <X
                  className="w-3.5 h-3.5 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilter('condition');
                  }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'quantity' ? null : 'quantity')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                externalFilters.quantityRange
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : activeFilter === 'quantity'
                  ? 'bg-purple-50 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package2 className="w-4 h-4" />
              <span>{externalFilters.quantityRange ? getFilterLabel('quantityRange') : 'الكمية'}</span>
              {externalFilters.quantityRange && (
                <X
                  className="w-3.5 h-3.5 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilter('quantityRange');
                  }}
                />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200"
              >
                <X className="w-4 h-4" />
                <span>مسح الكل</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeFilter && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setActiveFilter(null)}
          />

          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[75vh] overflow-hidden animate-slide-up">
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {activeFilter === 'city' && 'اختر المدينة'}
                  {activeFilter === 'price' && 'نطاق السعر'}
                  {activeFilter === 'condition' && 'حالة المنتج'}
                  {activeFilter === 'quantity' && 'نطاق الكمية'}
                </h3>
                <button
                  onClick={() => setActiveFilter(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-80px)] p-4">
              {activeFilter === 'city' && (
                <div className="space-y-2">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleFilterChange('cityId', city.id)}
                      className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all ${
                        externalFilters.cityId === city.id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{city.name_ar}</span>
                        {externalFilters.cityId === city.id && (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeFilter === 'price' && (
                <div className="space-y-2">
                  {priceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('priceRange', option.value)}
                      className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all ${
                        externalFilters.priceRange === option.value
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {externalFilters.priceRange === option.value && (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeFilter === 'condition' && (
                <div className="space-y-2">
                  {conditionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('condition', option.value)}
                      className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all ${
                        externalFilters.condition === option.value
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {externalFilters.condition === option.value && (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeFilter === 'quantity' && (
                <div className="space-y-2">
                  {quantityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('quantityRange', option.value)}
                      className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all ${
                        externalFilters.quantityRange === option.value
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {externalFilters.quantityRange === option.value && (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
        `}
      </style>
    </>
  );
}
