import { X, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ShareSheetProps {
  listingId: string;
  title: string;
  onClose: () => void;
}

export default function ShareSheet({ listingId, title, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const listingUrl = `${window.location.origin}/listing/${listingId}`;

  async function handleShare(platform: 'whatsapp' | 'twitter' | 'copy_link') {
    await supabase.from('listing_shares').insert({
      listing_id: listingId,
      platform: platform
    });

    await supabase.rpc('increment_listing_shares', {
      p_listing_id: listingId
    });

    if (platform === 'copy_link') {
      navigator.clipboard.writeText(listingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === 'whatsapp') {
      const text = encodeURIComponent(`${title}\n${listingUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      onClose();
    } else if (platform === 'twitter') {
      const text = encodeURIComponent(title);
      const url = encodeURIComponent(listingUrl);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      onClose();
    }
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
            <Share2 className="w-6 h-6 text-amber-500" />
            مشاركة الإعلان
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex items-center gap-4 w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg active:scale-98"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-lg">واتساب</p>
              <p className="text-sm opacity-90">مشاركة عبر واتساب</p>
            </div>
          </button>

          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center gap-4 w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg active:scale-98"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-lg">تويتر / X</p>
              <p className="text-sm opacity-90">مشاركة على تويتر</p>
            </div>
          </button>

          <button
            onClick={() => handleShare('copy_link')}
            className="flex items-center gap-4 w-full p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-2xl hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg active:scale-98"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {copied ? (
                <Check className="w-6 h-6" />
              ) : (
                <Copy className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-lg">{copied ? 'تم النسخ!' : 'نسخ الرابط'}</p>
              <p className="text-sm opacity-90 truncate" dir="ltr">{listingUrl}</p>
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            المشاركة تساعد في نشر الإعلان والوصول لمشترين أكثر
          </p>
        </div>
      </div>
    </div>
  );
}
