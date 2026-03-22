import { ArrowRight, TrendingUp, Share2, Eye, Users, Target, Zap, Rocket, CheckCircle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Growth() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 rounded-xl hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-md active:scale-95 transition-all duration-200 font-semibold text-sm"
            >
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span>رجوع</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">النمو وانتشار الإعلانات</h1>
              <p className="text-sm text-gray-500">زد انتشار إعلاناتك واجذب المزيد من المشترين</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-8 md:p-12 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Rocket className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black">انشر إعلاناتك بذكاء</h2>
                <p className="text-white/90 text-lg">وصل لآلاف المشترين في جميع أنحاء المملكة</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <Eye className="w-8 h-8 mb-2" />
                <div className="text-2xl font-black mb-1">+50,000</div>
                <div className="text-sm text-white/80">مشاهدة شهرياً</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <Users className="w-8 h-8 mb-2" />
                <div className="text-2xl font-black mb-1">+10,000</div>
                <div className="text-sm text-white/80">مستخدم نشط</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <Share2 className="w-8 h-8 mb-2" />
                <div className="text-2xl font-black mb-1">+5,000</div>
                <div className="text-sm text-white/80">مشاركة يومياً</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">شارك إعلاناتك</h3>
                <p className="text-gray-600 text-sm">انشر إعلاناتك على وسائل التواصل الاجتماعي</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">مشاركة سريعة عبر واتساب مباشرة</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">نشر على تويتر / X بضغطة واحدة</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">نسخ رابط مباشر سهل المشاركة</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">تتبع عدد المشاركات والمشاهدات</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">زد من ظهورك</h3>
                <p className="text-gray-600 text-sm">استخدم أدوات الترويج للوصول لمشترين أكثر</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">إعلانات مميزة في أعلى النتائج</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">ظهور في الإعلانات المشابهة</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">تحسين SEO لمحركات البحث</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">صفحات مخصصة للفئات والمدن</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">انضم كبائع</h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              هل تبيع مواد صناعية أو معدات؟ انضم لأكبر منصة في المملكة للمواد الصناعية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">سريع وسهل</h3>
              <p className="text-white/70 text-sm">سجل وانشر إعلانك في أقل من 5 دقائق</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">وصول واسع</h3>
              <p className="text-white/70 text-sm">اوصل لآلاف المشترين المهتمين</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">نتائج مضمونة</h3>
              <p className="text-white/70 text-sm">زد مبيعاتك وحقق أهدافك التجارية</p>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/signup"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100"
            >
              <UserPlus className="w-6 h-6" />
              سجل الآن مجاناً
            </a>
            <p className="text-white/60 text-sm mt-4">انضم لأكثر من 10,000 بائع ناجح</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">كيف تنشر إعلاناتك بفعالية؟</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">استخدم زر المشاركة</h4>
                <p className="text-gray-600 text-sm">في صفحة كل إعلان، اضغط على زر المشاركة وانشر الإعلان على واتساب أو تويتر</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">استخدم الروابط المباشرة</h4>
                <p className="text-gray-600 text-sm">كل إعلان له رابط مختصر وسهل يمكنك نسخه ومشاركته في أي مكان</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">ترقية للإعلان المميز</h4>
                <p className="text-gray-600 text-sm">احصل على ظهور أكبر بجعل إعلانك مميزاً في أعلى النتائج لمدة 7 أيام</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">تابع الإحصائيات</h4>
                <p className="text-gray-600 text-sm">راقب عدد المشاهدات والتواصل مع إعلاناتك لتحسين أدائها</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
