import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowRight, Send, Package, User, CheckCheck } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ConversationDetails {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
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
}

export default function Conversation() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherPartyTyping, setOtherPartyTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== user.id) {
            markSingleMessageRead(newMsg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && conversationId && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markSingleMessageRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
  };

  const fetchConversation = async () => {
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
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.buyer_id !== user?.id && data.seller_id !== user?.id) {
          navigate('/messages');
          return;
        }
        setConversation(data);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id || '')
        .eq('read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: messageText,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const getOtherParty = () => {
    if (!conversation) return null;
    if (user?.id === conversation.buyer_id) {
      return conversation.seller_profile;
    }
    return conversation.buyer_profile;
  };

  const getMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yesterday.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].created_at).toDateString();
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    return currentDate !== prevDate;
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

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">المحادثة غير موجودة</h2>
          <button
            onClick={() => navigate('/messages')}
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            العودة للرسائل
          </button>
        </div>
      </div>
    );
  }

  const otherParty = getOtherParty();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 rounded-xl hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-md active:scale-95 transition-all duration-200 font-semibold text-sm shrink-0"
            >
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span className="hidden sm:inline">رجوع</span>
            </button>

            <a
              href={`/listing/${conversation.listings.id}`}
              className="flex-1 flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 -m-2 transition-all min-w-0"
            >
              {conversation.listings.images && conversation.listings.images.length > 0 ? (
                <img
                  src={conversation.listings.images[0]}
                  alt={conversation.listings.title}
                  className="w-11 h-11 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 truncate text-sm">{conversation.listings.title}</h2>
                <p className="text-xs text-amber-600 font-bold">{conversation.listings.price} ريال</p>
              </div>
            </a>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                {otherParty?.avatar_url ? (
                  <img
                    src={otherParty.avatar_url}
                    alt={otherParty.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{otherParty?.full_name}</p>
                <p className="text-xs text-green-500 font-medium">متصل الآن</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-gray-500 font-medium">لا توجد رسائل بعد</p>
            <p className="text-gray-400 text-sm mt-1">ابدأ المحادثة بإرسال رسالة</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const isMe = message.sender_id === user.id;
              const showDate = shouldShowDateSeparator(index);
              const showAvatar =
                !isMe &&
                (index === messages.length - 1 ||
                  messages[index + 1].sender_id !== message.sender_id);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        {getMessageDate(message.created_at)}
                      </div>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    {!isMe && (
                      <div className="w-7 h-7 shrink-0 mb-1">
                        {showAvatar && (
                          otherParty?.avatar_url ? (
                            <img
                              src={otherParty.avatar_url}
                              alt={otherParty.full_name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-md'
                      }`}
                    >
                      <p className="text-sm break-words leading-relaxed">{message.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {getMessageTime(message.created_at)}
                        </p>
                        {isMe && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${message.read ? 'text-blue-200' : 'text-white/50'}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {otherPartyTyping && (
              <div className="flex items-end gap-2 justify-start mb-1">
                <div className="w-7 h-7 shrink-0">
                  {otherParty?.avatar_url ? (
                    <img src={otherParty.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm shadow-md px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 shadow-lg shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 px-4 py-3 bg-gray-100 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white focus:border-amber-300 text-right transition-all text-sm"
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-md hover:shadow-amber-500/30"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
