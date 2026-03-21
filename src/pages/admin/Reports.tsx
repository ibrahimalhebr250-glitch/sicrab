import { useEffect, useState } from 'react';
import { AlertCircle, Check, X, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  listings: {
    title: string;
    user_id: string;
  };
  profiles: {
    full_name: string;
    phone: string;
  };
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'rejected'>('pending');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  async function loadReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, listings(title, user_id)')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportsWithProfiles = await Promise.all(
        (data || []).map(async (report: any) => {
          if (!report.reporter_id) {
            return {
              ...report,
              profiles: null
            };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', report.reporter_id)
            .maybeSingle();

          return {
            ...report,
            profiles: profile
          };
        })
      );

      setReports(reportsWithProfiles as any);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReport(reportId: string, action: 'resolve' | 'reject' | 'delete_listing') {
    try {
      if (action === 'delete_listing') {
        const report = reports.find(r => r.id === reportId);
        if (!report) return;

        if (!confirm('هل أنت متأكد من حذف الإعلان المبلغ عنه؟')) {
          return;
        }

        await supabase
          .from('listings')
          .delete()
          .eq('id', report.listing_id);

        await supabase.rpc('log_admin_action', {
          p_action: 'delete_listing_from_report',
          p_target_type: 'listing',
          p_target_id: report.listing_id
        });
      }

      const newStatus = action === 'resolve' ? 'resolved' : 'rejected';
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: `report_${action}`,
        p_target_type: 'report',
        p_target_id: reportId
      });

      loadReports();
    } catch (error) {
      console.error('Error handling report:', error);
      alert('حدث خطأ أثناء معالجة البلاغ');
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
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة البلاغات</h1>
          <p className="text-slate-300">مراجعة ومعالجة البلاغات المقدمة من المستخدمين</p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 shadow-xl">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              معلقة
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'resolved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              تم الحل
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مرفوضة
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onHandle={(action) => handleReport(report.id, action)}
            />
          ))}

          {reports.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">لا توجد بلاغات {statusFilter === 'pending' ? 'معلقة' : statusFilter === 'resolved' ? 'محلولة' : 'مرفوضة'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, onHandle }: {
  report: Report;
  onHandle: (action: 'resolve' | 'reject' | 'delete_listing') => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{report.listings.title}</h3>
          <p className="text-sm text-gray-600">
            بلاغ من: {report.profiles?.full_name || 'غير معروف'} ({report.profiles?.phone || 'غير متوفر'})
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(report.created_at)}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="text-sm font-bold text-gray-900 mb-2">السبب: {report.reason}</p>
        {report.details && (
          <p className="text-sm text-gray-700 leading-relaxed">{report.details}</p>
        )}
      </div>

      {report.status === 'pending' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onHandle('delete_listing')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            حذف الإعلان
          </button>

          <button
            onClick={() => onHandle('reject')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
          >
            <X className="w-4 h-4" />
            تجاهل البلاغ
          </button>

          <button
            onClick={() => onHandle('resolve')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
          >
            <Check className="w-4 h-4" />
            تم الحل
          </button>
        </div>
      )}
    </div>
  );
}
