import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ReviewModalProps {
  sellerId: string;
  sellerName: string;
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ sellerId, sellerName, listingId, onClose, onSuccess }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitReview() {
    if (!user) return;

    if (rating === 0) {
      setError('الرجاء اختيار التقييم');
      return;
    }

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase
      .from('seller_reviews')
      .insert({
        seller_id: sellerId,
        buyer_id: user.id,
        listing_id: listingId,
        rating: rating,
        comment: comment
      });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('لقد قمت بتقييم هذا البائع مسبقاً');
      } else {
        setError('حدث خطأ، الرجاء المحاولة مرة أخرى');
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
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
          <h3 className="text-xl font-bold text-gray-900">تقييم البائع</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <p className="text-gray-700 mb-4">
            كيف كانت تجربتك مع <span className="font-bold">{sellerName}</span>؟
          </p>

          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            {rating === 0 && 'اضغط على النجوم للتقييم'}
            {rating === 1 && 'سيء جداً'}
            {rating === 2 && 'سيء'}
            {rating === 3 && 'مقبول'}
            {rating === 4 && 'جيد'}
            {rating === 5 && 'ممتاز'}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            تعليق (اختياري)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شارك تجربتك مع البائع..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={submitReview}
          disabled={loading || rating === 0}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </button>
      </div>
    </div>
  );
}
