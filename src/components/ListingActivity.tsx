import { Eye, MessageCircle, TrendingUp } from 'lucide-react';

interface ListingActivityProps {
  viewsCount: number;
  whatsappClicks: number;
  isOwner: boolean;
}

export default function ListingActivity({ viewsCount, whatsappClicks, isOwner }: ListingActivityProps) {
  const isHighEngagement = viewsCount > 50 || whatsappClicks > 10;

  if (!isOwner) {
    return (
      <div className="bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">المشاهدات</p>
              <p className="text-lg font-black text-blue-700">{viewsCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">طلبات التواصل</p>
              <p className="text-lg font-black text-green-700">{whatsappClicks}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-bold">إحصائيات إعلانك</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-white/80">المشاهدات</p>
            </div>
            <p className="text-2xl font-black">{viewsCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-green-400" />
              <p className="text-xs text-white/80">طلبات التواصل</p>
            </div>
            <p className="text-2xl font-black">{whatsappClicks}</p>
          </div>
        </div>

        {isHighEngagement && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-amber-400 mb-1">إعلانك يحصل على اهتمام كبير!</h4>
                <p className="text-sm text-white/90 leading-relaxed">
                  إعلانك يحظى بتفاعل ممتاز. حافظ على تواصلك السريع مع المهتمين لزيادة فرص البيع.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
