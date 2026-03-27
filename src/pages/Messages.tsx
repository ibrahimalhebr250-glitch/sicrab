import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, Package, Clock } from 'lucide-react';

interface ConversationWithDetails {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  updated_at: string;
  listings: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  buyer_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  seller_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  unread_count?: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listings (
            id,
            title,
            images,
            price
          ),
          buyer_profile:profiles!conversations_buyer_id_fkey (
            full_name,
            avatar_url
          ),
          seller_profile:profiles!conversations_seller_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-list:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const getOtherParty = (conversation: ConversationWithDetails) => {
    if (user?.id === conversation.buyer_id) {
      return conversation.seller_profile;
    }
    return conversation.buyer_profile;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'الآن';
    if (diffInMins < 60) return `قبل ${diffInMins} دقيقة`;
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    if (diffInDays === 1) return 'أمس';
    if (diffInDays < 7) return `قبل ${diffInDays} أيام`;
    return `قبل ${Math.floor(diffInDays / 7)} أسابيع`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول أولاً</h2>
          <a
            href="/login"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">الرسائل</h1>
            <p className="text-gray-600 mt-1">جميع محادثاتك مع البائعين والمشترين</p>
          </div>
          {conversations.some((c) => (c.unread_count || 0) > 0) && (
            <div className="bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              {conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)} غير مقروءة
            </div>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">ليس لديك أي محادثات حتى الآن</h3>
            <p className="text-gray-600 mb-6">ابدأ بالتواصل مع البائعين من خلال الإعلانات</p>
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              تصفح الإعلانات
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const otherParty = getOtherParty(conversation);
              const hasUnread = (conversation.unread_count || 0) > 0;

              return (
                <a
                  key={conversation.id}
                  href={`/conversation/${conversation.id}`}
                  className={`block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 ${
                    hasUnread ? 'border-2 border-amber-500 bg-amber-50/30' : 'border-2 border-transparent'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      {conversation.listings.images && conversation.listings.images.length > 0 ? (
                        <img
                          src={conversation.listings.images[0]}
                          alt={conversation.listings.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                          <Package className="w-10 h-10 text-amber-500" />
                        </div>
                      )}
                      {otherParty.avatar_url ? (
                        <img
                          src={otherParty.avatar_url}
                          alt={otherParty.full_name}
                          className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full border-2 border-white object-cover shadow"
                        />
                      ) : (
                        <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
                          <span className="text-white text-xs font-bold">
                            {otherParty.full_name?.charAt(0) || '؟'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`text-base font-bold text-gray-900 truncate ${hasUnread ? 'text-amber-700' : ''}`}>
                          {conversation.listings.title}
                        </h3>
                        {hasUnread && (
                          <span className="flex-shrink-0 mr-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{otherParty.full_name}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-bold text-amber-600">{conversation.listings.price} ريال</span>
                      </div>

                      {conversation.last_message && (
                        <p className={`text-sm truncate mb-2 ${hasUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                          {conversation.last_message}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(conversation.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
