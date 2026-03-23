import { useState, useEffect } from 'react';
import { FileText, Save, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SiteContent {
  id?: string;
  site_name: string;
  site_logo_url: string;
  home_hero_title: string;
  home_hero_subtitle: string;
  commission_percentage: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent>({
    site_name: 'سوق المشاتل',
    site_logo_url: '',
    home_hero_title: 'اشتري وبع الأشجار والنباتات والمشاتل',
    home_hero_subtitle: 'منصة موثوقة لبيع وشراء الأشجار والنباتات',
    commission_percentage: 1,
    meta_title: 'سوق المشاتل - منصة الأشجار والنباتات',
    meta_description: 'منصة موثوقة لبيع وشراء الأشجار والنباتات والمشاتل في السعودية',
    meta_keywords: 'مشاتل, أشجار, نباتات, زراعة, بيع أشجار'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setContent(data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveContent() {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update(content)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([content]);

        if (error) throw error;
      }

      await supabase.rpc('log_admin_action', {
        p_action: 'update_site_settings',
        p_target_type: 'settings',
        p_target_id: existing?.id || 'new'
      });

      alert('تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-white/10 rounded-2xl"></div>
            <div className="h-96 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة المحتوى</h1>
          <p className="text-slate-300">تعديل محتوى المنصة والإعدادات العامة</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              معلومات المنصة الأساسية
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المنصة</label>
                <input
                  type="text"
                  value={content.site_name}
                  onChange={(e) => setContent({ ...content, site_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رابط الشعار</label>
                <input
                  type="text"
                  value={content.site_logo_url}
                  onChange={(e) => setContent({ ...content, site_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نسبة العمولة (%)</label>
                <input
                  type="number"
                  value={content.commission_percentage}
                  onChange={(e) => setContent({ ...content, commission_percentage: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-600" />
              محتوى الصفحة الرئيسية
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الرئيسي</label>
                <input
                  type="text"
                  value={content.home_hero_title}
                  onChange={(e) => setContent({ ...content, home_hero_title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الفرعي</label>
                <input
                  type="text"
                  value={content.home_hero_subtitle}
                  onChange={(e) => setContent({ ...content, home_hero_subtitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-black text-gray-900 mb-4">إعدادات SEO</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الصفحة (Meta Title)</label>
                <input
                  type="text"
                  value={content.meta_title}
                  onChange={(e) => setContent({ ...content, meta_title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">وصف الصفحة (Meta Description)</label>
                <textarea
                  value={content.meta_description}
                  onChange={(e) => setContent({ ...content, meta_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الكلمات المفتاحية (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  value={content.meta_keywords}
                  onChange={(e) => setContent({ ...content, meta_keywords: e.target.value })}
                  placeholder="مشاتل, أشجار, نباتات"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <button
              onClick={saveContent}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
