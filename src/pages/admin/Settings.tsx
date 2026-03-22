import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Building2, CreditCard, Eye, EyeOff, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type SettingsTab = 'general' | 'bank' | 'transfers';

interface PlatformSetting {
  setting_key: string;
  setting_value: any;
  description: string;
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

export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadSettings();
    loadBankAccount();
  }, []);

  useEffect(() => {
    if (tab === 'transfers') loadTransfers();
  }, [tab]);

  async function loadSettings() {
    try {
      const { data } = await supabase.from('platform_settings').select('*');
      const settingsMap: Record<string, string> = {};
      data?.forEach((s: PlatformSetting) => {
        settingsMap[s.setting_key] = typeof s.setting_value === 'string'
          ? s.setting_value.replace(/^"|"$/g, '')
          : s.setting_value.toString();
      });
      setSettings(settingsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
      .select(`
        *,
        profiles(full_name),
        commissions(commission_amount, listings(title))
      `)
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
      for (const [key, value] of Object.entries(settings)) {
        const jsonValue = key === 'commission_rate' ? parseInt(value) : `"${value}"`;
        await supabase
          .from('platform_settings')
          .update({ setting_value: jsonValue, updated_at: new Date().toISOString() })
          .eq('setting_key', key);
      }
      alert('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
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
      alert('تم حفظ بيانات الحساب البنكي بنجاح');
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
        </div>

        <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
          {([
            { id: 'general' as SettingsTab, label: 'الإعدادات العامة', icon: <SettingsIcon className="w-4 h-4" /> },
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
