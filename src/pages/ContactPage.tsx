import { useEffect, useState } from 'react';
import { ArrowRight, Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

interface ContactInfo {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  contact_hours: string;
}

const defaultContact: ContactInfo = {
  contact_email: 'info@scrapmarket.sa',
  contact_phone: '+966 50 000 0000',
  contact_address: 'المملكة العربية السعودية',
  contact_hours: 'متاح من 9 صباحاً - 9 مساءً',
};

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContact);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('contact_email,contact_phone,contact_address,contact_hours')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContactInfo({ ...defaultContact, ...data });
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const contactCards = [
    {
      icon: <Phone className="w-6 h-6 text-white" />,
      bg: 'bg-green-500',
      containerBg: 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100',
      title: 'الهاتف',
      value: contactInfo.contact_phone || defaultContact.contact_phone,
      sub: contactInfo.contact_hours || defaultContact.contact_hours,
      dir: 'ltr' as const,
    },
    {
      icon: <Mail className="w-6 h-6 text-white" />,
      bg: 'bg-blue-500',
      containerBg: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100',
      title: 'البريد الإلكتروني',
      value: contactInfo.contact_email || defaultContact.contact_email,
      sub: 'سنرد خلال 24 ساعة',
      dir: 'ltr' as const,
    },
    {
      icon: <MapPin className="w-6 h-6 text-white" />,
      bg: 'bg-amber-500',
      containerBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100',
      title: 'الموقع',
      value: contactInfo.contact_address || defaultContact.contact_address,
      sub: 'نخدم جميع المناطق',
      dir: 'rtl' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowRight className="w-5 h-5" />
            <span>العودة للرئيسية</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">اتصل بنا</h1>
                <p className="text-gray-600">نحن هنا لمساعدتك</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات التواصل</h2>

                {contactCards.map((card, i) => (
                  <div key={i} className={`flex items-start gap-4 p-4 ${card.containerBg} rounded-xl`}>
                    <div className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                      <p className="text-gray-600" dir={card.dir}>{card.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{card.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">أرسل لنا رسالة</h2>

                {submitted ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">تم إرسال رسالتك بنجاح!</h3>
                    <p className="text-gray-600">سنتواصل معك في أقرب وقت ممكن</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                      { label: 'الاسم', field: 'name', type: 'text', placeholder: 'أدخل اسمك', required: true, dir: 'rtl' },
                      { label: 'البريد الإلكتروني', field: 'email', type: 'email', placeholder: 'example@email.com', required: true, dir: 'ltr' },
                      { label: 'رقم الجوال', field: 'phone', type: 'tel', placeholder: '05xxxxxxxx', required: false, dir: 'ltr' },
                      { label: 'الموضوع', field: 'subject', type: 'text', placeholder: 'ما هو موضوع رسالتك؟', required: true, dir: 'rtl' },
                    ].map(f => (
                      <div key={f.field}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{f.label}</label>
                        <input
                          type={f.type}
                          value={(formData as any)[f.field]}
                          onChange={e => setFormData({ ...formData, [f.field]: e.target.value })}
                          required={f.required}
                          dir={f.dir as any}
                          placeholder={f.placeholder}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الرسالة</label>
                      <textarea
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                        placeholder="اكتب رسالتك هنا..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      إرسال الرسالة
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav currentPage="home" />
    </div>
  );
}
