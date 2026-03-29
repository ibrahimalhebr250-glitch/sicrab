import { useEffect, useState } from 'react';
import { ArrowRight, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

const DEFAULT_CONTENT = `نحن في سوق المشاتل نلتزم بحماية خصوصيتك وأمان بياناتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية.

المعلومات التي نجمعها:
• الاسم الكامل
• رقم الجوال
• عنوان البريد الإلكتروني
• الصورة الشخصية (اختياري)
• تفاصيل المنتجات والنباتات المعروضة
• الأسعار والكميات
• الصور والوصف
• الموقع الجغرافي

كيف نستخدم معلوماتك:
• توفير وتحسين خدماتنا
• التواصل معك بخصوص حسابك وإعلاناتك
• معالجة المعاملات والمدفوعات
• حماية المنصة من الاحتيال والإساءة
• إرسال إشعارات مهمة وتحديثات
• تحليل الاستخدام لتحسين التجربة

حماية معلوماتك:
• تشفير البيانات باستخدام SSL/TLS
• تخزين آمن للبيانات في خوادم محمية
• مراقبة مستمرة لأي أنشطة مشبوهة
• وصول محدود للبيانات الشخصية

حقوقك:
• الوصول إلى معلوماتك الشخصية
• تصحيح أو تحديث معلوماتك
• حذف حسابك ومعلوماتك
• الاعتراض على معالجة بياناتك
• تصدير بياناتك

لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.`;

export default function PrivacyPage() {
  const [privacyContent, setPrivacyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('privacy_content')
      .maybeSingle()
      .then(({ data }) => {
        setPrivacyContent(data?.privacy_content || DEFAULT_CONTENT);
        setLoading(false);
      });
  }, []);

  const hasCustomContent = privacyContent && privacyContent.trim().length > 0;

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
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">سياسة الخصوصية</h1>
                <p className="text-gray-600">آخر تحديث: مارس 2026</p>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-100 rounded-lg" />)}
              </div>
            ) : hasCustomContent ? (
              <div className="prose prose-lg max-w-none text-right">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {privacyContent}
                </div>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none text-right">
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-6 mb-8">
                  <p className="text-gray-700 mb-0">
                    نحن في سوق المشاتل نلتزم بحماية خصوصيتك وأمان بياناتك. توضح هذه السياسة كيفية
                    جمع واستخدام وحماية معلوماتك الشخصية.
                  </p>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                  <Database className="w-7 h-7 text-blue-600" />
                  المعلومات التي نجمعها
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">معلومات الحساب</h3>
                    <ul className="space-y-2 text-gray-700 mr-4">
                      <li>• الاسم الكامل</li>
                      <li>• رقم الجوال</li>
                      <li>• عنوان البريد الإلكتروني</li>
                      <li>• الصورة الشخصية (اختياري)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">معلومات الإعلانات</h3>
                    <ul className="space-y-2 text-gray-700 mr-4">
                      <li>• تفاصيل المنتجات والنباتات المعروضة</li>
                      <li>• الأسعار والكميات</li>
                      <li>• الصور والوصف</li>
                      <li>• الموقع الجغرافي</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                  <Eye className="w-7 h-7 text-green-600" />
                  كيف نستخدم معلوماتك
                </h2>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                  <ul className="space-y-3 text-gray-700">
                    {['توفير وتحسين خدماتنا','التواصل معك بخصوص حسابك وإعلاناتك','معالجة المعاملات والمدفوعات','حماية المنصة من الاحتيال والإساءة','إرسال إشعارات مهمة وتحديثات'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                  <Lock className="w-7 h-7 text-amber-600" />
                  حماية معلوماتك
                </h2>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-100">
                  <ul className="space-y-3 text-gray-700">
                    {['تشفير البيانات باستخدام SSL/TLS','تخزين آمن للبيانات في خوادم محمية','مراقبة مستمرة لأي أنشطة مشبوهة','وصول محدود للبيانات الشخصية'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                  <UserCheck className="w-7 h-7 text-blue-600" />
                  حقوقك
                </h2>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100">
                  <ul className="space-y-3 text-gray-700">
                    {['الوصول إلى معلوماتك الشخصية','تصحيح أو تحديث معلوماتك','حذف حسابك ومعلوماتك','الاعتراض على معالجة بياناتك','تصدير بياناتك'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">مشاركة المعلومات</h2>
                <p className="text-gray-700 leading-relaxed">
                  لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav currentPage="home" />
    </div>
  );
}
