import { useEffect, useState } from 'react';
import { ArrowRight, Shield, TrendingUp, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

interface AboutContent {
  about_title: string;
  about_subtitle: string;
  about_intro: string;
  about_vision: string;
  about_feature_1_title: string;
  about_feature_1_desc: string;
  about_feature_2_title: string;
  about_feature_2_desc: string;
  about_feature_3_title: string;
  about_feature_3_desc: string;
}

const defaults: AboutContent = {
  about_title: 'من نحن',
  about_subtitle: 'منصة سوق المشاتل والأشجار',
  about_intro: 'نحن منصة رائدة في مجال بيع وشراء الأشجار والنباتات والمشاتل في السعودية. نهدف إلى ربط أصحاب المشاتل والمشترين في سوق واحد موثوق وآمن.',
  about_vision: 'نسعى لأن نكون المنصة الأولى والأكثر موثوقية في المملكة العربية السعودية لتجارة الأشجار والنباتات والمشاتل، مع توفير أفضل تجربة للمستخدمين.',
  about_feature_1_title: 'الأمان والثقة',
  about_feature_1_desc: 'نوفر بيئة آمنة للتجارة مع نظام تحقق وتقييمات موثوقة',
  about_feature_2_title: 'مجتمع نشط',
  about_feature_2_desc: 'آلاف المستخدمين النشطين من أصحاب مشاتل ومحبي الزراعة في جميع أنحاء المملكة',
  about_feature_3_title: 'سهولة الاستخدام',
  about_feature_3_desc: 'واجهة بسيطة وسهلة تمكنك من إضافة إعلانك في دقائق',
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(defaults);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('about_title,about_subtitle,about_intro,about_vision,about_feature_1_title,about_feature_1_desc,about_feature_2_title,about_feature_2_desc,about_feature_3_title,about_feature_3_desc')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent({ ...defaults, ...data });
      });
  }, []);

  const features = [
    { icon: <Shield className="w-12 h-12 text-blue-600 mb-4" />, title: content.about_feature_1_title, desc: content.about_feature_1_desc, bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100' },
    { icon: <Users className="w-12 h-12 text-green-600 mb-4" />, title: content.about_feature_2_title, desc: content.about_feature_2_desc, bg: 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100' },
    { icon: <Award className="w-12 h-12 text-amber-600 mb-4" />, title: content.about_feature_3_title, desc: content.about_feature_3_desc, bg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100' },
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
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{content.about_title}</h1>
                <p className="text-gray-600">{content.about_subtitle}</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-right">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {content.about_intro}
              </p>

              <div className="grid md:grid-cols-3 gap-6 my-8">
                {features.map((f, i) => (
                  <div key={i} className={`${f.bg} rounded-xl p-6`}>
                    {f.icon}
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{f.title}</h3>
                    <p className="text-gray-600">{f.desc}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">رؤيتنا</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {content.about_vision}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">قيمنا</h2>
              <ul className="space-y-3 text-gray-700">
                {[
                  { title: 'الشفافية', desc: 'نؤمن بالوضوح في جميع المعاملات' },
                  { title: 'الجودة', desc: 'نحرص على توفير خدمة عالية الجودة' },
                  { title: 'الابتكار', desc: 'نسعى دائماً لتطوير خدماتنا' },
                  { title: 'الأمان', desc: 'حماية بيانات ومعاملات مستخدمينا أولوية قصوى' },
                ].map((v, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                    <span><strong>{v.title}:</strong> {v.desc}</span>
                  </li>
                ))}
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
