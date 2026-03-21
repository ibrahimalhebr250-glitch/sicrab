import { useEffect, useState } from 'react';
import { MapPin, Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { supabase, City } from '../../lib/supabase';

export default function AdminCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({ name_ar: '', slug: '' });

  useEffect(() => {
    loadCities();
  }, []);

  async function loadCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name_ar');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingCity) {
        const { error } = await supabase
          .from('cities')
          .update(formData)
          .eq('id', editingCity.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cities')
          .insert([formData]);

        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingCity(null);
      setFormData({ name_ar: '', slug: '' });
      loadCities();
    } catch (error) {
      console.error('Error saving city:', error);
      alert('حدث خطأ أثناء حفظ المدينة');
    }
  }

  async function handleDelete(cityId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المدينة؟')) return;

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId);

      if (error) throw error;
      loadCities();
    } catch (error) {
      console.error('Error deleting city:', error);
      alert('حدث خطأ أثناء حذف المدينة');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة المدن</h1>
            <p className="text-slate-300">إضافة وتعديل وحذف المدن</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name_ar: '', slug: '' });
              setEditingCity(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            إضافة مدينة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <div key={city.id} className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{city.name_ar}</h3>
                  <p className="text-sm text-gray-500">{city.slug}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFormData({ name_ar: city.name_ar, slug: city.slug });
                    setEditingCity(city);
                    setShowAddModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(city.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-black text-gray-900 mb-6">
                {editingCity ? 'تعديل المدينة' : 'إضافة مدينة جديدة'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم المدينة
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Slug (الرابط)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all"
                  >
                    {editingCity ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCity(null);
                      setFormData({ name_ar: '', slug: '' });
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
