import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Commission {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  deal_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  listing_title: string;
  seller_name: string;
  buyer_name: string;
}

export default function AdminCommission() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadCommissions();
  }, [filter]);

  async function loadCommissions() {
    try {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          listings(title),
          seller:profiles!commissions_seller_id_fkey(full_name),
          buyer:profiles!commissions_buyer_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        listing_id: item.listing_id,
        seller_id: item.seller_id,
        buyer_id: item.buyer_id,
        deal_amount: item.deal_amount,
        commission_amount: item.commission_amount,
        commission_percentage: item.commission_percentage,
        status: item.status,
        created_at: item.created_at,
        listing_title: item.listings?.title || 'غير محدد',
        seller_name: item.seller?.full_name || 'غير محدد',
        buyer_name: item.buyer?.full_name || 'غير محدد'
      }));

      setCommissions(formatted);

      const totalCommissions = formatted.reduce((sum, c) => sum + c.commission_amount, 0);
      const pendingCommissions = formatted.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
      const paidCommissions = formatted.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);

      setStats({
        total: formatted.length,
        pending: formatted.filter(c => c.status === 'pending').length,
        paid: formatted.filter(c => c.status === 'paid').length,
        totalAmount: totalCommissions
      });
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCommissionStatus(id: string, status: 'paid' | 'cancelled') {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: `commission_${status}`,
        p_target_type: 'commission',
        p_target_id: id
      });

      loadCommissions();
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('حدث خطأ أثناء تحديث حالة العمولة');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة العمولات</h1>
          <p className="text-slate-300">متابعة الصفقات والعمولات (1٪)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90">إجمالي العمولات</p>
            <p className="text-3xl font-black">{stats.totalAmount.toLocaleString()} ر.س</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">إجمالي الصفقات</p>
            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-sm text-gray-600">قيد الانتظار</p>
            <p className="text-3xl font-black text-gray-900">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">مدفوعة</p>
            <p className="text-3xl font-black text-gray-900">{stats.paid}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 shadow-xl">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              قيد الانتظار
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === 'paid'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مدفوعة
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {commissions.map((commission) => (
            <CommissionCard
              key={commission.id}
              commission={commission}
              onUpdate={updateCommissionStatus}
            />
          ))}

          {commissions.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">لا توجد عمولات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommissionCard({ commission, onUpdate }: {
  commission: Commission;
  onUpdate: (id: string, status: 'paid' | 'cancelled') => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const statusText = {
    pending: 'قيد الانتظار',
    paid: 'مدفوعة',
    cancelled: 'ملغاة'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{commission.listing_title}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>البائع: <span className="font-medium">{commission.seller_name}</span></p>
            <p>المشتري: <span className="font-medium">{commission.buyer_name}</span></p>
            <p className="text-xs text-gray-500">{formatDate(commission.created_at)}</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-sm text-gray-600">قيمة الصفقة</p>
          <p className="text-2xl font-black text-gray-900">{commission.deal_amount.toLocaleString()} ر.س</p>
          <p className="text-sm text-green-600 font-bold mt-1">
            عمولة {commission.commission_percentage}%: {commission.commission_amount.toLocaleString()} ر.س
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[commission.status]}`}>
          {statusText[commission.status]}
        </span>

        {commission.status === 'pending' && (
          <div className="flex gap-2 mr-auto">
            <button
              onClick={() => onUpdate(commission.id, 'paid')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all"
            >
              تحديد كمدفوعة
            </button>
            <button
              onClick={() => onUpdate(commission.id, 'cancelled')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
