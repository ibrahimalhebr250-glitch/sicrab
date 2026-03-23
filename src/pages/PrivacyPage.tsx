import { ArrowRight, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export default function PrivacyPage() {
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
                <p className="text-gray-600">آخر تحديث: مارس 2024</p>
              </div>
            </div>

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

                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-100">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">معلومات الاستخدام</h3>
                  <ul className="space-y-2 text-gray-700 mr-4">
                    <li>• عنوان IP</li>
                    <li>• نوع المتصفح والجهاز</li>
                    <li>• الصفحات المزارة</li>
                    <li>• وقت وتاريخ الزيارة</li>
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                <Eye className="w-7 h-7 text-green-600" />
                كيف نستخدم معلوماتك
              </h2>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>توفير وتحسين خدماتنا</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>التواصل معك بخصوص حسابك وإعلاناتك</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>معالجة المعاملات والمدفوعات</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>حماية المنصة من الاحتيال والإساءة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>إرسال إشعارات مهمة وتحديثات</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>تحليل الاستخدام لتحسين التجربة</span>
                  </li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                <Lock className="w-7 h-7 text-amber-600" />
                حماية معلوماتك
              </h2>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-100">
                <p className="text-gray-700 mb-4">
                  نتخذ إجراءات أمنية صارمة لحماية بياناتك:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>تشفير البيانات باستخدام SSL/TLS</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>تخزين آمن للبيانات في خوادم محمية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>مراقبة مستمرة لأي أنشطة مشبوهة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>وصول محدود للبيانات الشخصية</span>
                  </li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3">
                <UserCheck className="w-7 h-7 text-purple-600" />
                حقوقك
              </h2>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                <p className="text-gray-700 mb-4">
                  لديك الحق في:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>الوصول إلى معلوماتك الشخصية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>تصحيح أو تحديث معلوماتك</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>حذف حسابك ومعلوماتك</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>الاعتراض على معالجة بياناتك</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>تصدير بياناتك</span>
                  </li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">مشاركة المعلومات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:
              </p>
              <ul className="space-y-2 text-gray-700 mr-4">
                <li>• مع مقدمي الخدمات الموثوقين الذين يساعدوننا في تشغيل المنصة</li>
                <li>• عند الطلب القانوني من الجهات المختصة</li>
                <li>• لحماية حقوقنا وأمان المستخدمين</li>
                <li>• بموافقتك الصريحة</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">ملفات تعريف الارتباط (Cookies)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة. يمكنك التحكم في هذه الملفات من
                إعدادات متصفحك.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">التغييرات على سياسة الخصوصية</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                قد نقوم بتحديث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات مهمة عبر البريد الإلكتروني
                أو إشعار على المنصة.
              </p>

              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white mt-8">
                <h3 className="font-bold text-xl mb-2">تواصل معنا</h3>
                <p className="mb-4">
                  إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا:
                </p>
                <p>البريد الإلكتروني: privacy@scrapmarket.sa</p>
                <p dir="ltr">الهاتف: +966 50 000 0000</p>
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
