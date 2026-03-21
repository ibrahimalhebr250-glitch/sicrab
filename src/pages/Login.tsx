import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Phone, Lock, ArrowRight, Eye, EyeOff, User, ChevronLeft } from 'lucide-react';

type Mode = 'login' | 'register';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('966') ? digits : digits.startsWith('0') ? digits : digits;
}

function validateSaudiPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^(05\d{8}|009665\d{8}|9665\d{8})$/.test(digits);
}

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateSaudiPhone(phone)) {
      setError('أدخل رقم جوال سعودي صحيح (مثال: 0501234567)');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('الاسم الكامل مطلوب');
        return;
      }
      if (password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمة المرور وتأكيدها غير متطابقتين');
        return;
      }
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(phone, password);
      if (error) {
        setError('رقم الجوال أو كلمة المرور غير صحيحة');
        setLoading(false);
      } else {
        navigate('/');
      }
    } else {
      const { error } = await signUp(phone, password, fullName.trim());
      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          setError('رقم الجوال مسجل مسبقاً، يرجى تسجيل الدخول');
        } else {
          setError('حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى');
        }
        setLoading(false);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="text-sm">العودة للرئيسية</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-white">
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
              </h1>
            </div>
            <p className="text-white/80 text-sm mt-2 mr-14">
              {mode === 'login' ? 'أدخل رقم جوالك وكلمة المرور' : 'سجل برقم جوالك في ثوانٍ'}
            </p>
          </div>

          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-bold transition-all ${mode === 'login' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-bold transition-all ${mode === 'register' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 text-right">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-right"
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 text-right">
                رقم الجوال
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="w-full pr-11 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  maxLength={13}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-right"
                  placeholder={mode === 'register' ? 'أدخل كلمة مرور قوية' : 'أدخل كلمة المرور'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-gray-400 mt-1 text-right">6 أحرف على الأقل</p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 text-right">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pr-11 pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-right"
                    placeholder="أعد إدخال كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm text-right font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-base hover:from-amber-600 hover:to-orange-600 active:scale-98 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'جاري الدخول...' : 'جاري التسجيل...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
                  <ChevronLeft className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-400 pt-1">
              بالمتابعة أنت توافق على{' '}
              <a href="/terms" target="_blank" className="text-amber-600 hover:underline font-medium">
                سياسة الاستخدام
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
