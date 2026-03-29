import { useState, useEffect } from 'react';
import { FileText, Save, Image as ImageIcon, Info, Shield, Phone, BookOpen } from 'lucide-react';
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
  about_title: string;
  about_subtitle: string;
  about_intro: string;
  about_vision: string;
  about_feature_1_title: string;
  about_feature_1_desc: string;
  about_feature_2_title: string;
  about_feature_2_desc: string;
  about_feature_3_title: string;
  about_feature_3_desc: string;
  footer_about_text: string;
  privacy_content: string;
  terms_content: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  contact_hours: string;
}

type ContentTab = 'basic' | 'about' | 'pages' | 'contact';

const defaultContent: SiteContent = {
  site_name: 'سوق المشاتل',
  site_logo_url: '',
  home_hero_title: 'اشتري وبع الأشجار والنباتات والمشاتل',
  home_hero_subtitle: 'منصة موثوقة لبيع وشراء الأشجار والنباتات',
  commission_percentage: 1,
  meta_title: 'سوق المشاتل - منصة الأشجار والنباتات',
  meta_description: 'منصة موثوقة لبيع وشراء الأشجار والنباتات والمشاتل في السعودية',
  meta_keywords: 'مشاتل, أشجار, نباتات, زراعة, بيع أشجار',
  about_title: 'من نحن',
  about_subtitle: 'منصة سوق المشاتل والأشجار',
  about_intro: 'نحن منصة رائدة في مجال بيع وشراء الأشجار والنباتات والمشاتل في السعودية. نهدف إلى ربط أصحاب المشاتل والمشترين في سوق واحد موثوق وآمن.',
  about_vision: 'نسعى لأن نكون المنصة الأولى والأكثر موثوقية في المملكة العربية السعودية لتجارة الأشجار والنباتات والمشاتل، مع توفير أفضل تجربة للمستخدمين.',
  about_feature_1_title: 'الأمان والثقة',
  about_feature_1_desc: 'نوفر بيئة آمنة للتجارة مع نظام تحقق وتقييمات موثوقة',
  about_feature_2_title: 'مجتمع نشط',
  about_feature_2_desc: 'آلاف المستخدمين النشطين من أصحاب مشاتل ومحبي الزراعة في جميع أنحاء المملكة',
  about_feature_3_title: 'سهولة الاستخدام',
  about_feature_3_desc: 'واجهة بسيطة وسهلة تمكنك من إضافة إعلانك في دقائق',
  footer_about_text: 'منصة موثوقة لبيع وشراء الأشجار والنباتات والمشاتل في المملكة العربية السعودية.',
  privacy_content: '',
  terms_content: '',
  contact_email: '',
  contact_phone: '',
  contact_address: 'المملكة العربية السعودية',
  contact_hours: 'متاح من 9 صباحاً - 9 مساءً',
};

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tab, setTab] = useState<ContentTab>('basic');

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setContent({ ...defaultContent, ...data });
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveContent() {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').maybeSingle();

      if (existing) {
        const { error } = await supabase.from('site_settings').update(content).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([content]);
        if (error) throw error;
      }

      await supabase.rpc('log_admin_action', {
        p_action: 'update_site_settings',
        p_target_type: 'settings',
        p_target_id: existing?.id || 'new',
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  const set = (field: keyof SiteContent, value: any) => setContent(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-20 bg-white/10 rounded-2xl" />
          <div className="h-96 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">إدارة المحتوى</h1>
            <p className="text-slate-400 text-sm">تعديل محتوى صفحات المنصة</p>
          </div>
          {saveSuccess && (
            <div className="mr-auto flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
              تم الحفظ بنجاح
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
          {([
            { id: 'basic' as ContentTab, label: 'الأساسيات', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'about' as ContentTab, label: 'من نحن', icon: <Info className="w-4 h-4" /> },
            { id: 'pages' as ContentTab, label: 'الصفحات', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'contact' as ContentTab, label: 'اتصل بنا', icon: <Phone className="w-4 h-4" /> },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === t.id ? 'bg-white text-gray-900 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-5">

          {tab === 'basic' && (
            <>
              <SectionHeader icon={<FileText className="w-5 h-5 text-blue-600" />} title="معلومات المنصة الأساسية" />
              <Field label="اسم المنصة">
                <input type="text" value={content.site_name} onChange={e => set('site_name', e.target.value)} className={inputCls} />
              </Field>
              <Field label="رابط الشعار">
                <input type="text" value={content.site_logo_url} onChange={e => set('site_logo_url', e.target.value)} placeholder="https://example.com/logo.png" className={inputCls} />
              </Field>
              <Field label="نسبة العمولة (%)">
                <input type="number" value={content.commission_percentage} onChange={e => set('commission_percentage', parseFloat(e.target.value))} min="0" max="100" step="0.1" className={inputCls} />
              </Field>

              <div className="border-t pt-5">
                <SectionHeader icon={<ImageIcon className="w-5 h-5 text-green-600" />} title="محتوى الصفحة الرئيسية" />
                <div className="space-y-4 mt-4">
                  <Field label="العنوان الرئيسي">
                    <input type="text" value={content.home_hero_title} onChange={e => set('home_hero_title', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="العنوان الفرعي">
                    <input type="text" value={content.home_hero_subtitle} onChange={e => set('home_hero_subtitle', e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>

              <div className="border-t pt-5">
                <SectionHeader icon={<Shield className="w-5 h-5 text-amber-600" />} title="إعدادات SEO" />
                <div className="space-y-4 mt-4">
                  <Field label="عنوان الصفحة (Meta Title)">
                    <input type="text" value={content.meta_title} onChange={e => set('meta_title', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="وصف الصفحة (Meta Description)">
                    <textarea value={content.meta_description} onChange={e => set('meta_description', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                  </Field>
                  <Field label="الكلمات المفتاحية (مفصولة بفاصلة)">
                    <input type="text" value={content.meta_keywords} onChange={e => set('meta_keywords', e.target.value)} placeholder="مشاتل, أشجار, نباتات" className={inputCls} />
                  </Field>
                </div>
              </div>
            </>
          )}

          {tab === 'about' && (
            <>
              <SectionHeader icon={<Info className="w-5 h-5 text-blue-600" />} title="صفحة من نحن" />
              <Field label="عنوان الصفحة">
                <input type="text" value={content.about_title} onChange={e => set('about_title', e.target.value)} className={inputCls} />
              </Field>
              <Field label="العنوان الفرعي">
                <input type="text" value={content.about_subtitle} onChange={e => set('about_subtitle', e.target.value)} className={inputCls} />
              </Field>
              <Field label="النص التعريفي الرئيسي">
                <textarea value={content.about_intro} onChange={e => set('about_intro', e.target.value)} rows={4} className={`${inputCls} resize-none`} />
              </Field>
              <Field label="نص الرؤية">
                <textarea value={content.about_vision} onChange={e => set('about_vision', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </Field>

              <div className="border-t pt-5">
                <p className="text-sm font-bold text-gray-600 mb-4">بطاقات المميزات</p>
                <div className="space-y-4">
                  {([
                    { titleKey: 'about_feature_1_title', descKey: 'about_feature_1_desc', label: 'الميزة الأولى' },
                    { titleKey: 'about_feature_2_title', descKey: 'about_feature_2_desc', label: 'الميزة الثانية' },
                    { titleKey: 'about_feature_3_title', descKey: 'about_feature_3_desc', label: 'الميزة الثالثة' },
                  ] as { titleKey: keyof SiteContent; descKey: keyof SiteContent; label: string }[]).map(f => (
                    <div key={f.titleKey} className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase">{f.label}</p>
                      <Field label="العنوان">
                        <input type="text" value={content[f.titleKey] as string} onChange={e => set(f.titleKey, e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="الوصف">
                        <textarea value={content[f.descKey] as string} onChange={e => set(f.descKey, e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                      </Field>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-5">
                <Field label="نص 'من نحن' في الفوتر (ملخص قصير)">
                  <textarea value={content.footer_about_text} onChange={e => set('footer_about_text', e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="ملخص قصير يظهر في أسفل الموقع..." />
                </Field>
              </div>
            </>
          )}

          {tab === 'pages' && (
            <>
              <SectionHeader icon={<BookOpen className="w-5 h-5 text-emerald-600" />} title="محتوى الصفحات الثابتة" />

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">سياسة الخصوصية</label>
                <p className="text-xs text-gray-400 mb-1.5">اكتب النص كاملاً. يمكن استخدام أسطر جديدة للفصل بين الفقرات.</p>
                <textarea
                  value={content.privacy_content}
                  onChange={e => set('privacy_content', e.target.value)}
                  rows={10}
                  className={`${inputCls} resize-y`}
                  placeholder="اكتب نص سياسة الخصوصية هنا..."
                />
              </div>

              <div className="border-t pt-5 space-y-2">
                <label className="block text-sm font-bold text-gray-700">شروط الاستخدام</label>
                <p className="text-xs text-gray-400 mb-1.5">اكتب النص كاملاً. يمكن استخدام أسطر جديدة للفصل بين الفقرات.</p>
                <textarea
                  value={content.terms_content}
                  onChange={e => set('terms_content', e.target.value)}
                  rows={10}
                  className={`${inputCls} resize-y`}
                  placeholder="اكتب نص شروط الاستخدام هنا..."
                />
              </div>
            </>
          )}

          {tab === 'contact' && (
            <>
              <SectionHeader icon={<Phone className="w-5 h-5 text-rose-600" />} title="صفحة اتصل بنا" />
              <Field label="البريد الإلكتروني">
                <input type="email" value={content.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="info@example.com" className={inputCls} dir="ltr" />
              </Field>
              <Field label="رقم الهاتف">
                <input type="text" value={content.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+966 50 000 0000" className={inputCls} dir="ltr" />
              </Field>
              <Field label="العنوان / الموقع">
                <input type="text" value={content.contact_address} onChange={e => set('contact_address', e.target.value)} placeholder="المملكة العربية السعودية" className={inputCls} />
              </Field>
              <Field label="ساعات العمل">
                <input type="text" value={content.contact_hours} onChange={e => set('contact_hours', e.target.value)} placeholder="متاح من 9 صباحاً - 9 مساءً" className={inputCls} />
              </Field>
            </>
          )}

          <div className="border-t pt-5">
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

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
      {icon}
      {title}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-right';
