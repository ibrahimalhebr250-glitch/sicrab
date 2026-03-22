import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Phone, Calendar, CreditCard as Edit3, ArrowRight, TrendingUp, Package, Eye, MessageSquare, CheckCircle, LogOut, ChevronRight, BarChart2, Plus, Settings, Building2, CreditCard, Clock, XCircle, Upload, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ListingStats {
  total: number;
  active: number;
  totalViews: number;
  totalWhatsapp: number;
}

interface PlatformBankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  notes: string;
}

interface MyCommission {
  id: string;
  deal_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  listing_title: string;
  transfer?: {
    id: string;
    status: 'pending' | 'confirmed' | 'rejected';
    transfer_amount: number;
    transfer_reference: string;
    transfer_date: string;
  } | null;
}

export default function Profile() {
  const { user, profile, updateProfile, signOut, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [listingStats, setListingStats] = useState<ListingStats>({ total: 0, active: 0, totalViews: 0, totalWhatsapp: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [bankAccount, setBankAccount] = useState<PlatformBankAccount | null>(null);
  const [myCommissions, setMyCommissions] = useState<MyCommission[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile) {
      window.location.href = '/login';
      return;
    }
    fetchStats();
    fetchBankAccount();
    fetchMyCommissions();
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('listings')
        .select('is_active, views_count, whatsapp_clicks')
        .eq('user_id', user.id);

      if (data) {
        setListingStats({
          total: data.length,
          active: data.filter(l => l.is_active).length,
          totalViews: data.reduce((s, l) => s + (l.views_count || 0), 0),
          totalWhatsapp: data.reduce((s, l) => s + (l.whatsapp_clicks || 0), 0),
        });
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBankAccount = async () => {
    const { data } = await supabase
      .from('platform_bank_account')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();
    setBankAccount(data);
  };

  const fetchMyCommissions = async () => {
    if (!user) return;
    setCommissionsLoading(true);
    const { data } = await supabase
      .from('commissions')
      .select(`*, listings(title), commission_transfers(id, status, transfer_amount, transfer_reference, transfer_date)`)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      deal_amount: c.deal_amount,
      commission_amount: c.commission_amount,
      commission_percentage: c.commission_percentage,
      status: c.status,
      created_at: c.created_at,
      listing_title: c.listings?.title || 'إعلان محذوف',
      transfer: c.commission_transfers?.[0] || null,
    }));
    setMyCommissions(formatted);
    setCommissionsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await updateProfile({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
    });

    if (error) {
      setMessage('error');
    } else {
      setMessage('success');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {message === 'success' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">تم حفظ التغييرات بنجاح</span>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-black text-gray-900">حسابي</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium px-3 py-2 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400"></div>
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-10 h-10 text-amber-500" />
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  تعديل
                </button>
              )}
            </div>

            {!isEditing ? (
              <div>
                <h2 className="text-xl font-black text-gray-900">{profile.full_name}</h2>
                {profile.bio && <p className="text-gray-500 text-sm mt-1">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4 mt-3">
                  {profile.phone && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone className="w-4 h-4 text-amber-500" />
                      {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    عضو منذ {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {message === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    حدث خطأ أثناء حفظ التغييرات
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">الاسم الكامل</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">رقم الجوال</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">نبذة عني</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-right resize-none"
                    placeholder="اكتب نبذة مختصرة عنك..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(profile.full_name || '');
                      setPhone(profile.phone || '');
                      setBio(profile.bio || '');
                      setMessage('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'إعلاناتي', value: listingStats.total, sub: `${listingStats.active} نشط`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'المشاهدات', value: listingStats.totalViews.toLocaleString('ar-SA'), sub: 'إجمالي', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'تواصل واتساب', value: listingStats.totalWhatsapp.toLocaleString('ar-SA'), sub: 'إجمالي', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'إعلانات موقوفة', value: listingStats.total - listingStats.active, sub: 'بحاجة مراجعة', icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black ${statsLoading ? 'text-gray-200' : s.color}`}>
                {statsLoading ? '—' : s.value}
              </p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {[
            {
              to: '/my-listings',
              icon: Package,
              iconBg: 'bg-amber-50',
              iconColor: 'text-amber-600',
              label: 'إدارة إعلاناتي',
              desc: 'عرض، تعديل، وإيقاف إعلاناتك',
            },
            {
              to: '/add',
              icon: Plus,
              iconBg: 'bg-green-50',
              iconColor: 'text-green-600',
              label: 'إضافة إعلان جديد',
              desc: 'انشر إعلانك الآن',
            },
            {
              to: '/my-promotions',
              icon: TrendingUp,
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              label: 'ترقياتي',
              desc: 'إدارة الإعلانات المدفوعة',
            },
            {
              to: '/messages',
              icon: MessageSquare,
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              label: 'الرسائل',
              desc: 'تواصل مع المشترين والبائعين',
            },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 rotate-180" />
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          {bankAccount ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">الحساب البنكي للمنصة</p>
                  <p className="text-gray-500 text-xs">حوّل العمولة المستحقة إلى هذا الحساب</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-emerald-100">
                  <span className="text-xs text-gray-500 flex-shrink-0">البنك</span>
                  <span className="font-bold text-gray-900 text-sm">{bankAccount.bank_name}</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-emerald-100">
                  <span className="text-xs text-gray-500 flex-shrink-0">اسم الحساب</span>
                  <span className="font-bold text-gray-900 text-sm">{bankAccount.account_name}</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-emerald-100">
                  <span className="text-xs text-gray-500 flex-shrink-0">آيبان</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-900 text-left">{bankAccount.iban}</span>
                    <button
                      onClick={() => copyToClipboard(bankAccount.iban)}
                      className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      {copiedIban ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                {bankAccount.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-amber-700 text-xs">{bankAccount.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 text-sm">الحساب البنكي للمنصة</p>
                <p className="text-gray-400 text-xs mt-0.5">لم يتم تحديد حساب بنكي من قِبل المنصة بعد</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-black text-gray-900 text-sm">سجل العمولات والتحويلات</h4>
              {myCommissions.filter(c => c.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">
                  {myCommissions.filter(c => c.status === 'pending').length} بانتظار التحويل
                </span>
              )}
            </div>
            {commissionsLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : myCommissions.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">لا توجد عمولات مسجّلة حتى الآن</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {myCommissions.map(c => (
                  <CommissionRow
                    key={c.id}
                    commission={c}
                    bankAccount={bankAccount}
                    onTransferSubmitted={fetchMyCommissions}
                    userId={user!.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-100 rounded-2xl text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function CommissionRow({ commission, bankAccount, onTransferSubmitted, userId }: {
  commission: MyCommission;
  bankAccount: PlatformBankAccount | null;
  onTransferSubmitted: () => void;
  userId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [transferRef, setTransferRef] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const statusConfig = {
    pending: { label: 'بانتظار التحويل', className: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
    paid: { label: 'مدفوعة', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { label: 'ملغاة', className: 'bg-gray-100 text-gray-500', icon: <XCircle className="w-3 h-3" /> },
  };
  const sc = statusConfig[commission.status];

  const transferStatusConfig = {
    pending: { label: 'قيد المراجعة', className: 'text-amber-600' },
    confirmed: { label: 'تم التأكيد', className: 'text-green-600' },
    rejected: { label: 'مرفوض', className: 'text-red-600' },
  };

  async function handleSubmitTransfer() {
    if (!transferRef.trim()) return;
    setSubmitting(true);
    await supabase.from('commission_transfers').insert({
      commission_id: commission.id,
      seller_id: userId,
      bank_account_id: bankAccount?.id || null,
      transfer_amount: commission.commission_amount,
      transfer_reference: transferRef,
      transfer_date: transferDate,
    });
    setShowForm(false);
    setTransferRef('');
    await onTransferSubmitted();
    setSubmitting(false);
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold text-sm line-clamp-1">{commission.listing_title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${sc.className}`}>
              {sc.icon}
              {sc.label}
            </span>
            <span className="text-gray-400 text-xs">
              {new Date(commission.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {commission.transfer && (
            <p className={`text-xs mt-1 font-medium ${transferStatusConfig[commission.transfer.status].className}`}>
              التحويل: {transferStatusConfig[commission.transfer.status].label}
              {commission.transfer.transfer_reference && ` — ${commission.transfer.transfer_reference}`}
            </p>
          )}
        </div>
        <div className="text-left flex-shrink-0">
          <p className="text-gray-900 font-black text-sm">{Number(commission.commission_amount).toFixed(2)} ر.س</p>
          <p className="text-gray-400 text-xs">{commission.commission_percentage}% من {Number(commission.deal_amount).toFixed(0)} ر.س</p>
        </div>
      </div>

      {commission.status === 'pending' && !commission.transfer && bankAccount && (
        <div className="mt-3">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all w-full justify-center"
            >
              <Upload className="w-3.5 h-3.5" />
              تسجيل التحويل
            </button>
          ) : (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">رقم المرجع / رقم العملية</label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={e => setTransferRef(e.target.value)}
                  placeholder="أدخل رقم مرجع التحويل..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">تاريخ التحويل</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitTransfer}
                  disabled={submitting || !transferRef.trim()}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
