import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ReportModalProps {
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportModal({ listingId, onClose, onSuccess }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 'fake_listing', label: 'إعلان مزيف' },
    { value: 'incorrect_price', label: 'سعر غير صحيح' },
    { value: 'inappropriate_content', label: 'محتوى مخالف' },
    { value: 'fraud', label: 'احتيال' },
    { value: 'other', label: 'أخرى' }
  ];

  async function submitReport() {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!reason) {
      setError('الرجاء اختيار سبب البلاغ');
      return;
    }

    if (!description.trim()) {
      setError('الرجاء كتابة تفاصيل البلاغ');
      return;
    }

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason: reason,
        description: description
      });

    if (insertError) {
      setError('حدث خطأ، الرجاء المحاولة مرة أخرى');
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
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-500" />
            الإبلاغ عن إعلان
          </h3>
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

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            سبب البلاغ
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none"
          >
            <option value="">اختر السبب</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            تفاصيل البلاغ
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اشرح سبب البلاغ بالتفصيل..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none resize-none"
          />
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800">
            سيتم مراجعة البلاغ من قبل فريق الإدارة. شكراً لمساهمتك في تحسين المنصة.
          </p>
        </div>

        <button
          onClick={submitReport}
          disabled={loading || !reason || !description.trim()}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'جاري الإرسال...' : 'إرسال البلاغ'}
        </button>
      </div>
    </div>
  );
}
