import { ArrowRight, Shield, TrendingUp, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export default function AboutPage() {
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
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">من نحن</h1>
                <p className="text-gray-600">منصة سوق المواد الصناعية</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-right">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                نحن منصة رائدة في مجال بيع وشراء المواد الصناعية والسكراب في السعودية.
                نهدف إلى ربط البائعين والمشترين في سوق واحد موثوق وآمن.
              </p>

              <div className="grid md:grid-cols-3 gap-6 my-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100">
                  <Shield className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="font-bold text-gray-900 text-xl mb-2">الأمان والثقة</h3>
                  <p className="text-gray-600">
                    نوفر بيئة آمنة للتجارة مع نظام تحقق وتقييمات موثوقة
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                  <Users className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="font-bold text-gray-900 text-xl mb-2">مجتمع نشط</h3>
                  <p className="text-gray-600">
                    آلاف المستخدمين النشطين من تجار ومصانع في جميع أنحاء المملكة
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-100">
                  <Award className="w-12 h-12 text-amber-600 mb-4" />
                  <h3 className="font-bold text-gray-900 text-xl mb-2">سهولة الاستخدام</h3>
                  <p className="text-gray-600">
                    واجهة بسيطة وسهلة تمكنك من إضافة إعلانك في دقائق
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">رؤيتنا</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نسعى لأن نكون المنصة الأولى والأكثر موثوقية في المملكة العربية السعودية
                لتجارة المواد الصناعية والسكراب، مع توفير أفضل تجربة للمستخدمين.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">قيمنا</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                  <span><strong>الشفافية:</strong> نؤمن بالوضوح في جميع المعاملات</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                  <span><strong>الجودة:</strong> نحرص على توفير خدمة عالية الجودة</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                  <span><strong>الابتكار:</strong> نسعى دائماً لتطوير خدماتنا</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                  <span><strong>الأمان:</strong> حماية بيانات ومعاملات مستخدمينا أولوية قصوى</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav currentPage="home" />
    </div>
  );
}
