import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon, Save, Building2, CreditCard, Eye, EyeOff,
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Check, X,
  LayoutGrid as Layout, Mail, Phone, MessageCircle, FileText, HelpCircle,
  Plus, Trash2, GripVertical, Link as LinkIcon, ChevronUp, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type SettingsTab = 'general' | 'footer' | 'bank' | 'transfers';
type FooterSection = 'platform' | 'support' | 'policies';

interface PlatformSetting {
  setting_key: string;
  setting_value: any;
  description: string;
}

interface FooterLink {
  id: string;
  section: FooterSection;
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  is_active: boolean;
  notes: string;
}

interface CommissionTransfer {
  id: string;
  commission_id: string | null;
  seller_id: string;
  transfer_amount: number;
  transfer_reference: string;
  transfer_date: string;
  receipt_url: string;
  status: 'pending' | 'confirmed' | 'rejected';
  admin_notes: string;
  created_at: string;
  seller_name?: string;
  commission_amount?: number;
  listing_title?: string;
}

const SECTION_CONFIG: Record<FooterSection, { label: string; color: string; icon: React.ReactNode }> = {
  platform: {
    label: 'قسم المنصة',
    color: 'amber',
    icon: <Layout className="w-4 h-4" />,
  },
  support: {
    label: 'قسم الدعم',
    color: 'blue',
    icon: <HelpCircle className="w-4 h-4" />,
  },
  policies: {
    label: 'قسم السياسات',
    color: 'emerald',
    icon: <FileText className="w-4 h-4" />,
  },
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; focus: string; badge: string }> = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    focus: 'focus:border-amber-400',
    badge: 'bg-gradient-to-br from-amber-400 to-orange-500',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    focus: 'focus:border-blue-400',
    badge: 'bg-gradient-to-br from-blue-400 to-cyan-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    focus: 'focus:border-emerald-400',
    badge: 'bg-gradient-to-br from-emerald-400 to-teal-500',
  },
};

export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [footerLinksLoading, setFooterLinksLoading] = useState(false);
  const [footerLinksSaving, setFooterLinksSaving] = useState<Record<string, boolean>>({});

  const [bankAccount, setBankAccount] = useState<BankAccount>({
    id: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    iban: '',
    is_active: true,
    notes: '',
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const [transfers, setTransfers] = useState<CommissionTransfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transferFilter, setTransferFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
    loadBankAccount();
    loadFooterLinks();
  }, []);

  useEffect(() => {
    if (tab === 'transfers') loadTransfers();
  }, [tab]);

  async function loadSettings() {
    try {
      const { data } = await supabase.from('platform_settings').select('setting_key, setting_value');
      const settingsMap: Record<string, string> = {};
      data?.forEach((s: PlatformSetting) => {
        let val: string;
        if (typeof s.setting_value === 'string') {
          val = s.setting_value;
        } else if (typeof s.setting_value === 'number' || typeof s.setting_value === 'boolean') {
          val = s.setting_value.toString();
        } else {
          val = String(s.setting_value ?? '');
        }
        settingsMap[s.setting_key] = val;
      });
      setSettings(settingsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadFooterLinks() {
    setFooterLinksLoading(true);
    const { data } = await supabase
      .from('footer_links')
      .select('*')
      .order('section')
      .order('sort_order');
    setFooterLinks(data || []);
    setFooterLinksLoading(false);
  }

  async function loadBankAccount() {
    setBankLoading(true);
    const { data } = await supabase.from('platform_bank_account').select('*').limit(1).maybeSingle();
    if (data) setBankAccount(data);
    setBankLoading(false);
  }

  async function loadTransfers() {
    setTransfersLoading(true);
    const { data } = await supabase
      .from('commission_transfers')
      .select(`*, profiles(full_name), commissions(commission_amount, listings(title))`)
      .order('created_at', { ascending: false });

    const formatted = (data || []).map((t: any) => ({
      id: t.id,
      commission_id: t.commission_id,
      seller_id: t.seller_id,
      transfer_amount: t.transfer_amount,
      transfer_reference: t.transfer_reference,
      transfer_date: t.transfer_date,
      receipt_url: t.receipt_url,
      status: t.status,
      admin_notes: t.admin_notes,
      created_at: t.created_at,
      seller_name: t.profiles?.full_name || 'غير محدد',
      commission_amount: t.commissions?.commission_amount || null,
      listing_title: t.commissions?.listings?.title || null,
    }));
    setTransfers(formatted);
    setTransfersLoading(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const upsertRows = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: key === 'commission_rate' ? Number(value) : value,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('platform_settings')
        .upsert(upsertRows, { onConflict: 'setting_key' });
      if (error) throw error;
      showSuccess();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  function showSuccess() {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  async function handleSaveContactSettings() {
    setSaving(true);
    try {
      const contactKeys = ['footer_email', 'footer_phone', 'footer_whatsapp', 'footer_copyright'];
      const upsertRows = contactKeys.map(key => ({
        setting_key: key,
        setting_value: settings[key] || '',
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('platform_settings')
        .upsert(upsertRows, { onConflict: 'setting_key' });
      if (error) throw error;
      showSuccess();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ بيانات التواصل');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLink(section: FooterSection) {
    const maxOrder = footerLinks
      .filter(l => l.section === section)
      .reduce((m, l) => Math.max(m, l.sort_order), 0);

    const { data, error } = await supabase
      .from('footer_links')
      .insert({ section, label: 'رابط جديد', url: '#', sort_order: maxOrder + 1, is_active: true })
      .select()
      .single();

    if (!error && data) {
      setFooterLinks(prev => [...prev, data]);
    }
  }

  async function handleDeleteLink(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;
    const { error } = await supabase.from('footer_links').delete().eq('id', id);
    if (!error) {
      setFooterLinks(prev => prev.filter(l => l.id !== id));
    }
  }

  async function handleUpdateLink(link: FooterLink) {
    setFooterLinksSaving(prev => ({ ...prev, [link.id]: true }));
    const { error } = await supabase
      .from('footer_links')
      .update({ label: link.label, url: link.url, is_active: link.is_active, updated_at: new Date().toISOString() })
      .eq('id', link.id);

    if (!error) {
      setFooterLinks(prev => prev.map(l => l.id === link.id ? link : l));
    }
    setFooterLinksSaving(prev => ({ ...prev, [link.id]: false }));
  }

  async function handleMoveLink(id: string, direction: 'up' | 'down', section: FooterSection) {
    const sectionLinks = footerLinks
      .filter(l => l.section === section)
      .sort((a, b) => a.sort_order - b.sort_order);

    const idx = sectionLinks.findIndex(l => l.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sectionLinks.length) return;

    const current = sectionLinks[idx];
    const swap = sectionLinks[swapIdx];
    const newOrder1 = swap.sort_order;
    const newOrder2 = current.sort_order;

    await Promise.all([
      supabase.from('footer_links').update({ sort_order: newOrder1 }).eq('id', current.id),
      supabase.from('footer_links').update({ sort_order: newOrder2 }).eq('id', swap.id),
    ]);

    setFooterLinks(prev => prev.map(l => {
      if (l.id === current.id) return { ...l, sort_order: newOrder1 };
      if (l.id === swap.id) return { ...l, sort_order: newOrder2 };
      return l;
    }));
  }

  function updateLinkField(id: string, field: keyof FooterLink, value: any) {
    setFooterLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }

  async function handleSaveBankAccount() {
    setBankSaving(true);
    try {
      if (bankAccount.id) {
        await supabase.from('platform_bank_account').update({
          bank_name: bankAccount.bank_name,
          account_name: bankAccount.account_name,
          account_number: bankAccount.account_number,
          iban: bankAccount.iban,
          is_active: bankAccount.is_active,
          notes: bankAccount.notes,
          updated_at: new Date().toISOString(),
        }).eq('id', bankAccount.id);
      } else {
        const { data } = await supabase.from('platform_bank_account').insert({
          bank_name: bankAccount.bank_name,
          account_name: bankAccount.account_name,
          account_number: bankAccount.account_number,
          iban: bankAccount.iban,
          is_active: bankAccount.is_active,
          notes: bankAccount.notes,
        }).select().single();
        if (data) setBankAccount(data);
      }
      showSuccess();
    } catch (e) {
      alert('حدث خطأ أثناء حفظ الحساب البنكي');
    } finally {
      setBankSaving(false);
    }
  }

  async function handleUpdateTransfer(id: string, status: 'confirmed' | 'rejected', adminNotes: string) {
    await supabase.from('commission_transfers').update({
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (status === 'confirmed') {
      const transfer = transfers.find(t => t.id === id);
      if (transfer?.commission_id) {
        await supabase.from('commissions').update({ status: 'paid' }).eq('id', transfer.commission_id);
      }
    }
    await loadTransfers();
  }

  const filteredTransfers = transfers.filter(t => transferFilter === 'all' || t.status === transferFilter);
  const pendingCount = transfers.filter(t => t.status === 'pending').length;

  const getSectionLinks = (section: FooterSection) =>
    footerLinks.filter(l => l.section === section).sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/10 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">إعدادات المنصة</h1>
            <p className="text-slate-400 text-sm">إدارة الإعدادات العامة والبنكية</p>
          </div>
          {saveSuccess && (
            <div className="mr-auto flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
              <CheckCircle className="w-4 h-4" />
              تم الحفظ بنجاح
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
          {([
            { id: 'general' as SettingsTab, label: 'الإعدادات العامة', icon: <SettingsIcon className="w-4 h-4" /> },
            { id: 'footer' as SettingsTab, label: 'الفوتر', icon: <Layout className="w-4 h-4" /> },
            { id: 'bank' as SettingsTab, label: 'الحساب البنكي', icon: <Building2 className="w-4 h-4" /> },
            { id: 'transfers' as SettingsTab, label: 'التحويلات البنكية', icon: <CreditCard className="w-4 h-4" />, badge: pendingCount > 0 ? pendingCount : null },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all relative ${
                tab === t.id ? 'bg-white text-gray-900 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم المنصة</label>
              <input
                type="text"
                value={settings.platform_name || ''}
                onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نسبة العمولة (%)</label>
              <input
                type="number"
                value={settings.commission_rate || ''}
                onChange={e => setSettings({ ...settings, commission_rate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">عنوان SEO</label>
              <input
                type="text"
                value={settings.seo_title || ''}
                onChange={e => setSettings({ ...settings, seo_title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">وصف SEO</label>
              <textarea
                value={settings.seo_description || ''}
                onChange={e => setSettings({ ...settings, seo_description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 min-h-[100px]"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">كلمات مفتاحية SEO</label>
              <input
                type="text"
                value={settings.seo_keywords || ''}
                onChange={e => setSettings({ ...settings, seo_keywords: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                placeholder="افصل الكلمات بفاصلة"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم واتساب الدعم والتواصل</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono select-none">+</span>
                <input
                  type="text"
                  value={settings.support_whatsapp || ''}
                  onChange={e => setSettings({ ...settings, support_whatsapp: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-left direction-ltr"
                  placeholder="966501234567"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">أدخل الرقم بالصيغة الدولية بدون علامة + (مثال: 966501234567)</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        )}

        {tab === 'footer' && (
          <div className="space-y-5">

            {(['platform', 'support', 'policies'] as FooterSection[]).map(section => {
              const config = SECTION_CONFIG[section];
              const colors = COLOR_CLASSES[config.color];
              const links = getSectionLinks(section);

              return (
                <div key={section} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${colors.bg}`}>
                    <button
                      onClick={() => handleAddLink(section)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2 ${colors.border} text-gray-700 hover:bg-white`}
                    >
                      <Plus className="w-4 h-4" />
                      إضافة رابط
                    </button>
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-black text-gray-900 text-right">{config.label}</h3>
                        <p className="text-gray-400 text-xs text-right">{links.length} رابط</p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl ${colors.badge} flex items-center justify-center text-white`}>
                        {config.icon}
                      </div>
                    </div>
                  </div>

                  {footerLinksLoading ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : links.length === 0 ? (
                    <div className="p-8 text-center">
                      <LinkIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">لا توجد روابط. اضغط "إضافة رابط" لإضافة أول رابط.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {links.map((link, idx) => (
                        <FooterLinkRow
                          key={link.id}
                          link={link}
                          idx={idx}
                          total={links.length}
                          colors={colors}
                          saving={!!footerLinksSaving[link.id]}
                          onUpdate={handleUpdateLink}
                          onDelete={handleDeleteLink}
                          onMove={(id, dir) => handleMoveLink(id, dir, section)}
                          onChange={updateLinkField}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">بيانات التواصل</h3>
                  <p className="text-gray-400 text-xs">تظهر في عمود التواصل بالفوتر</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={settings.footer_email || ''}
                      onChange={e => setSettings({ ...settings, footer_email: e.target.value })}
                      placeholder="info@example.com"
                      className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">رقم الجوال</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={settings.footer_phone || ''}
                      onChange={e => setSettings({ ...settings, footer_phone: e.target.value })}
                      placeholder="966501234567"
                      className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">الرقم الدولي بدون + (مثال: 966501234567)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">رقم واتساب</label>
                  <div className="relative">
                    <MessageCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={settings.footer_whatsapp || ''}
                      onChange={e => setSettings({ ...settings, footer_whatsapp: e.target.value })}
                      placeholder="966501234567"
                      className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">الرقم الدولي بدون + (مثال: 966501234567)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">نص حقوق الملكية</label>
                  <input
                    type="text"
                    value={settings.footer_copyright || ''}
                    onChange={e => setSettings({ ...settings, footer_copyright: e.target.value })}
                    placeholder="© 2024 اسم المنصة - جميع الحقوق محفوظة"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveContactSettings}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'جاري الحفظ...' : 'حفظ بيانات التواصل'}
              </button>
            </div>
          </div>
        )}

        {tab === 'bank' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-bold text-sm">ملاحظة مهمة</p>
                <p className="text-amber-700 text-sm mt-0.5">
                  بيانات هذا الحساب البنكي ستظهر للمستخدمين المسجلين في صفحة "حسابي" ليقوموا بتحويل عمولات الصفقات إليه.
                </p>
              </div>
            </div>

            {bankLoading ? (
              <div className="bg-white rounded-2xl p-6 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">بيانات الحساب البنكي للمنصة</h3>
                    <p className="text-gray-500 text-xs">يُعرض هذا الحساب للمستخدمين لتحويل العمولات</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">اسم البنك</label>
                    <input
                      type="text"
                      value={bankAccount.bank_name}
                      onChange={e => setBankAccount({ ...bankAccount, bank_name: e.target.value })}
                      placeholder="مثال: بنك الراجحي"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">اسم صاحب الحساب</label>
                    <input
                      type="text"
                      value={bankAccount.account_name}
                      onChange={e => setBankAccount({ ...bankAccount, account_name: e.target.value })}
                      placeholder="الاسم كما يظهر في البنك"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">رقم الحساب</label>
                  <div className="relative">
                    <input
                      type={showAccountNumber ? 'text' : 'password'}
                      value={bankAccount.account_number}
                      onChange={e => setBankAccount({ ...bankAccount, account_number: e.target.value })}
                      placeholder="رقم الحساب البنكي"
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAccountNumber ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">رقم الآيبان (IBAN)</label>
                  <input
                    type="text"
                    value={bankAccount.iban}
                    onChange={e => setBankAccount({ ...bankAccount, iban: e.target.value })}
                    placeholder="SA00 0000 0000 0000 0000 0000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">ملاحظات للمستخدمين (اختياري)</label>
                  <textarea
                    value={bankAccount.notes}
                    onChange={e => setBankAccount({ ...bankAccount, notes: e.target.value })}
                    rows={2}
                    placeholder="مثال: يرجى ذكر رقم الإعلان في ملاحظات التحويل"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 resize-none text-right"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-700 text-sm">تفعيل الحساب</p>
                    <p className="text-gray-500 text-xs mt-0.5">إظهار هذا الحساب للمستخدمين</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBankAccount({ ...bankAccount, is_active: !bankAccount.is_active })}
                    className={`w-12 h-6 rounded-full transition-all relative ${bankAccount.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${bankAccount.is_active ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                <button
                  onClick={handleSaveBankAccount}
                  disabled={bankSaving}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {bankSaving ? 'جاري الحفظ...' : 'حفظ بيانات الحساب'}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'transfers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'قيد المراجعة', count: transfers.filter(t => t.status === 'pending').length, color: 'from-amber-500 to-orange-500' },
                { label: 'مؤكدة', count: transfers.filter(t => t.status === 'confirmed').length, color: 'from-emerald-500 to-teal-500' },
                { label: 'مرفوضة', count: transfers.filter(t => t.status === 'rejected').length, color: 'from-red-500 to-rose-500' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-xl`}>
                  <p className="text-3xl font-black">{s.count}</p>
                  <p className="text-sm opacity-90 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'confirmed', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTransferFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    transferFilter === f ? 'bg-white text-gray-900 shadow' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {f === 'all' ? 'الكل' : f === 'pending' ? 'قيد المراجعة' : f === 'confirmed' ? 'مؤكدة' : 'مرفوضة'}
                  {' '}({transfers.filter(t => f === 'all' ? true : t.status === f).length})
                </button>
              ))}
              <button
                onClick={loadTransfers}
                className="mr-auto flex items-center gap-1.5 px-3 py-2 bg-white/10 text-slate-300 rounded-xl text-sm hover:bg-white/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </button>
            </div>

            {transfersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/10 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="bg-white/10 rounded-2xl p-12 text-center">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">لا توجد تحويلات مطابقة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransfers.map(t => (
                  <TransferCard key={t.id} transfer={t} onUpdate={handleUpdateTransfer} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FooterLinkRow({
  link, idx, total, colors, saving,
  onUpdate, onDelete, onMove, onChange,
}: {
  link: FooterLink;
  idx: number;
  total: number;
  colors: { bg: string; border: string; focus: string; badge: string };
  saving: boolean;
  onUpdate: (link: FooterLink) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onChange: (id: string, field: keyof FooterLink, value: any) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-all group">
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMove(link.id, 'up')}
          disabled={idx === 0}
          className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-all"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMove(link.id, 'down')}
          disabled={idx === total - 1}
          className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">النص</label>
          <input
            type="text"
            value={link.label}
            onChange={e => onChange(link.id, 'label', e.target.value)}
            className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none ${colors.focus} transition-all`}
            placeholder="نص الرابط"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">الرابط</label>
          <input
            type="text"
            value={link.url}
            onChange={e => onChange(link.id, 'url', e.target.value)}
            className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none ${colors.focus} transition-all`}
            placeholder="/about"
            dir="ltr"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(link.id, 'is_active', !link.is_active)}
          title={link.is_active ? 'مفعّل' : 'مخفي'}
          className={`w-9 h-5 rounded-full transition-all relative ${link.is_active ? 'bg-emerald-400' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${link.is_active ? 'left-4' : 'left-0.5'}`} />
        </button>

        <button
          onClick={() => onUpdate(link)}
          disabled={saving}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
          title="حفظ"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onDelete(link.id)}
          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TransferCard({ transfer, onUpdate }: {
  transfer: CommissionTransfer;
  onUpdate: (id: string, status: 'confirmed' | 'rejected', notes: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState(transfer.admin_notes || '');
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    pending: { label: 'قيد المراجعة', className: 'bg-amber-100 text-amber-700 border border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
    confirmed: { label: 'مؤكد', className: 'bg-green-100 text-green-700 border border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    rejected: { label: 'مرفوض', className: 'bg-red-100 text-red-700 border border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const sc = statusConfig[transfer.status];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${sc.className}`}>
                {sc.icon}
                {sc.label}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(transfer.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-gray-900 font-bold">{transfer.seller_name}</p>
            {transfer.listing_title && (
              <p className="text-gray-500 text-sm mt-0.5">الإعلان: {transfer.listing_title}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">المرجع: <span className="font-mono text-gray-700">{transfer.transfer_reference || '—'}</span></p>
          </div>
          <div className="text-left flex-shrink-0">
            <p className="text-2xl font-black text-gray-900">{Number(transfer.transfer_amount).toFixed(2)} ر.س</p>
            {transfer.commission_amount && (
              <p className="text-xs text-gray-500 mt-0.5">العمولة المطلوبة: {Number(transfer.commission_amount).toFixed(2)} ر.س</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">تاريخ التحويل: {transfer.transfer_date}</p>
          </div>
        </div>

        {transfer.receipt_url && (
          <div className="mt-3">
            <a
              href={transfer.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
            >
              <Eye className="w-4 h-4" />
              عرض الإيصال
            </a>
          </div>
        )}

        {transfer.status === 'pending' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                مراجعة التحويل...
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">ملاحظات الإدارة (اختياري)</label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظة..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 text-right"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdate(transfer.id, 'confirmed', adminNotes)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    <Check className="w-4 h-4" />
                    تأكيد التحويل
                  </button>
                  <button
                    onClick={() => onUpdate(transfer.id, 'rejected', adminNotes)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all"
                  >
                    <X className="w-4 h-4" />
                    رفض
                  </button>
                  <button
                    onClick={() => setExpanded(false)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {transfer.admin_notes && transfer.status !== 'pending' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">ملاحظة الإدارة: {transfer.admin_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
