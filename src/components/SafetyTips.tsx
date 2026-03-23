import { Shield, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

export default function SafetyTips() {
  const tips = [
    {
      icon: Eye,
      text: 'تأكد من المنتج ومعاينته قبل الدفع',
      color: 'text-blue-600'
    },
    {
      icon: AlertTriangle,
      text: 'لا تحول الأموال قبل المعاينة',
      color: 'text-amber-600'
    },
    {
      icon: CheckCircle,
      text: 'اطلب فاتورة أو مستند عند الاستلام',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      text: 'ابلغ عن أي سلوك مشبوه فوراً',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">نصائح الأمان</h3>
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${tip.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{tip.text}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-600 text-center">
          منصة سوق المشاتل توفر بيئة آمنة ولكن يبقى الحذر مسؤوليتك الشخصية
        </p>
      </div>
    </div>
  );
}
