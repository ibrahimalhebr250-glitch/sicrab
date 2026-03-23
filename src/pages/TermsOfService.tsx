import { ArrowRight, Shield, AlertCircle, CheckCircle, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowRight className="w-5 h-5" />
            <span>رجوع</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">سياسة الاستخدام والعمولة</h1>
              <p className="text-blue-100 text-sm mt-1">
                يُرجى قراءة السياسة بعناية قبل استخدام المنصة
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold mb-2">1. طبيعة المنصة</h2>
                <p className="text-blue-50 leading-relaxed">
                  المنصة هي سوق رقمي لعرض وبيع وشراء الأشجار والنباتات والمشاتل بين المستخدمين.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">
              المنصة تعمل كوسيط بين البائع والمشتري، ولا تتحمل مسؤولية جودة المنتجات أو الاتفاقات بين الأطراف.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">2. تصفح المنصة</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  يمكن لأي زائر:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>تصفح الإعلانات</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>مشاهدة تفاصيل الإعلان</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>التواصل مع المعلن عبر واتساب</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <p className="text-teal-800 font-medium">
                    لا يلزم التسجيل من أجل التواصل مع البائع.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 font-bold text-lg">💬</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. التواصل بين الأطراف</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  يتم التواصل بين البائع والمشتري عبر واتساب مباشرة.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  عند الضغط على زر "تواصل عبر واتساب" يتم إرسال رسالة تلقائية تحتوي على:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>اسم المنصة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>عنوان الإعلان</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>رابط الإعلان</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-blue-800">
                    وذلك ليعرف البائع أن التواصل جاء من خلال المنصة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-amber-600 font-bold text-lg">+</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. إضافة الإعلانات</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  يمكن لأي مستخدم البدء في إضافة إعلان بدون تسجيل.
                </p>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-amber-800 font-medium">
                    ولكن قبل نشر الإعلان يجب إنشاء حساب في المنصة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold text-lg">👤</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. التسجيل في المنصة</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  عند التسجيل يجب على المستخدم:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>إدخال اسمه</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>إدخال رقم الجوال</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>الموافقة على سياسة الاستخدام</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg overflow-hidden border-2 border-orange-300">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">6. تعهد العمولة</h2>
                <p className="text-sm text-orange-700">مهم جداً - يُرجى القراءة بعناية</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 mb-4 border-2 border-orange-200">
              <p className="text-gray-800 leading-relaxed font-medium text-center">
                "أتعهد بدفع عمولة قدرها 1٪ من قيمة الصفقة في حال تم بيع المنتج عن طريق المنصة."
              </p>
            </div>

            <div className="p-4 bg-orange-100 rounded-xl border border-orange-300">
              <p className="text-orange-900 font-medium">
                يجب دفع العمولة خلال مدة لا تتجاوز 48 ساعة من إتمام البيع.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. مسؤولية المستخدم</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  يتحمل المستخدم المسؤولية الكاملة عن:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>صحة المعلومات في الإعلان</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>الالتزام بالقوانين</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>عدم نشر إعلانات مضللة أو غير صحيحة</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-red-200">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. الإعلانات المخالفة</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  يحق لإدارة المنصة حذف أي إعلان في الحالات التالية:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>إعلان مخالف للأنظمة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>إعلان احتيالي</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>معلومات غير صحيحة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>إساءة استخدام المنصة</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3">9. قبول الشروط</h2>
                <p className="leading-relaxed text-blue-50">
                  استخدام المنصة أو نشر إعلان يعني الموافقة على هذه السياسة والالتزام بها.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            آخر تحديث: مارس 2026
          </p>
        </div>
      </div>
    </div>
  );
}
