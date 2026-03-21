import { useState } from 'react';
import { Phone, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PhoneVerificationProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhoneVerification({ onClose, onSuccess }: PhoneVerificationProps) {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendVerificationCode() {
    if (!user) return;

    if (!/^(05|5)\d{8}$/.test(phone.replace(/\s/g, ''))) {
      setError('رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: user.id,
        phone: phone,
        code: verificationCode,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      setError('حدث خطأ، الرجاء المحاولة مرة أخرى');
      setLoading(false);
      return;
    }

    console.log('Verification code (for demo):', verificationCode);
    alert(`كود التحقق (للتجربة فقط): ${verificationCode}`);

    setStep('code');
    setLoading(false);
  }

  async function verifyCode() {
    if (!user) return;

    if (code.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    const { data: codes, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !codes || codes.length === 0) {
      setError('رمز التحقق غير صحيح أو منتهي الصلاحية');
      setLoading(false);
      return;
    }

    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', codes[0].id);

    await supabase
      .from('profiles')
      .update({
        phone: phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      })
      .eq('id', user.id);

    setLoading(false);
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-6 h-6 text-amber-500" />
            توثيق رقم الجوال
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <>
            <p className="text-gray-600 mb-4 text-sm">
              يجب توثيق رقم الجوال قبل نشر الإعلانات. سنرسل لك رمز التحقق عبر SMS.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                رقم الجوال
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none text-lg"
                dir="ltr"
              />
            </div>

            <button
              onClick={sendVerificationCode}
              disabled={loading || !phone}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4 text-sm">
              تم إرسال رمز التحقق إلى <span className="font-bold">{phone}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                رمز التحقق
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none text-2xl text-center tracking-widest font-bold"
                dir="ltr"
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                'جاري التحقق...'
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  تأكيد
                </>
              )}
            </button>

            <button
              onClick={() => setStep('phone')}
              className="w-full mt-2 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              تغيير رقم الجوال
            </button>
          </>
        )}
      </div>
    </div>
  );
}
