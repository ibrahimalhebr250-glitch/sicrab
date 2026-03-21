import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlatformSetting {
  setting_key: string;
  setting_value: any;
  description: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach((setting: PlatformSetting) => {
        settingsMap[setting.setting_key] = typeof setting.setting_value === 'string'
          ? setting.setting_value.replace(/^"|"$/g, '')
          : setting.setting_value.toString();
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        const jsonValue = key === 'commission_rate' ? parseInt(value) : `"${value}"`;

        await supabase
          .from('platform_settings')
          .update({
            setting_value: jsonValue,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key);
      }

      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white/10 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إعدادات المنصة</h1>
          <p className="text-slate-300">إدارة الإعدادات العامة للمنصة</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              اسم المنصة
            </label>
            <input
              type="text"
              value={settings.platform_name || ''}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              نسبة العمولة (%)
            </label>
            <input
              type="number"
              value={settings.commission_rate || ''}
              onChange={(e) => setSettings({ ...settings, commission_rate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              عنوان SEO
            </label>
            <input
              type="text"
              value={settings.seo_title || ''}
              onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              وصف SEO
            </label>
            <textarea
              value={settings.seo_description || ''}
              onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 min-h-[100px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              كلمات مفتاحية SEO
            </label>
            <input
              type="text"
              value={settings.seo_keywords || ''}
              onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              placeholder="افصل الكلمات بفاصلة"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
}
