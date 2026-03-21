import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Mail, Calendar, CreditCard as Edit2, ArrowRight, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user || !profile) {
      window.location.href = '/login';
    }
  }, [user, profile]);

  if (!user || !profile) {
    return null;
  }

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await updateProfile({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
    });

    if (error) {
      setMessage('حدث خطأ أثناء حفظ التغييرات');
    } else {
      setMessage('تم حفظ التغييرات بنجاح');
      setIsEditing(false);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-amber-600 font-bold transition-all"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للرئيسية</span>
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-32"></div>

          <div className="px-6 pb-6">
            <div className="flex items-start gap-4 -mt-16 mb-6">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <User className="w-16 h-16 text-amber-500" />
                )}
              </div>

              <div className="flex-1 mt-16">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900">{profile.full_name}</h1>
                    <p className="text-gray-600 mt-1">عضو منذ {formatDate(profile.created_at)}</p>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>تعديل الملف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {message && (
              <div className={`mb-6 px-4 py-3 rounded-lg ${message.includes('خطأ') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {message}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                    نبذة عني
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-right resize-none"
                    placeholder="اكتب نبذة مختصرة عنك..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(profile.full_name);
                      setPhone(profile.phone || '');
                      setBio(profile.bio || '');
                      setMessage('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                      <p className="font-bold text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-600">رقم الجوال</p>
                      <p className="font-bold text-gray-900">{profile.phone || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-600">تاريخ التسجيل</p>
                      <p className="font-bold text-gray-900">{formatDate(profile.created_at)}</p>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">نبذة عني</p>
                    <p className="text-gray-900">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/my-listings"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all text-center shadow-lg hover:shadow-xl"
          >
            عرض إعلاناتي
          </a>
          <a
            href="/my-promotions"
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all text-center shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            <span>ترقياتي</span>
          </a>
        </div>
      </div>
    </div>
  );
}
