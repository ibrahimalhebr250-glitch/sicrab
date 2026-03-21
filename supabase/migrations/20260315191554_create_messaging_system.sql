/*
  # إنشاء نظام الرسائل

  ## التغييرات الجديدة

  1. جداول جديدة
    - `conversations` - المحادثات بين المشترين والبائعين:
      - `id` (uuid, primary key)
      - `listing_id` (uuid, مرتبط بجدول listings)
      - `buyer_id` (uuid, المشتري)
      - `seller_id` (uuid, البائع)
      - `created_at` (timestamp)
      - `updated_at` (timestamp, آخر تحديث للمحادثة)
      - `last_message` (text, آخر رسالة للعرض السريع)
      
    - `messages` - الرسائل داخل كل محادثة:
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, مرتبط بجدول conversations)
      - `sender_id` (uuid, المرسل)
      - `message` (text, محتوى الرسالة)
      - `read` (boolean, هل تم قراءة الرسالة)
      - `created_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات للمستخدمين لقراءة المحادثات التي هم طرف فيها فقط
    - سياسات لإنشاء المحادثات والرسائل
    - سياسات لتحديث حالة القراءة

  3. الفهارس
    - إضافة فهارس لتحسين الأداء على الاستعلامات الشائعة

  ## ملاحظات مهمة
  - كل محادثة مرتبطة بإعلان واحد ومشتري واحد وبائع واحد
  - يمكن للمشتري الواحد أن يكون له محادثة واحدة فقط لكل إعلان
  - الرسائل نصية فقط في هذه المرحلة
  - يتم تحديث last_message تلقائياً عند إرسال رسالة جديدة
*/

-- إنشاء جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, buyer_id)
);

-- إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- تفعيل RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمحادثات

-- السماح للمشتري والبائع بقراءة المحادثة
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- السماح للمشتري بإنشاء محادثة جديدة
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id AND buyer_id != seller_id);

-- السماح بتحديث المحادثة (لآخر رسالة)
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- سياسات RLS للرسائل

-- السماح بقراءة الرسائل لأطراف المحادثة
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
CREATE POLICY "Users can view conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- السماح بإرسال رسائل لأطراف المحادثة
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- السماح بتحديث حالة القراءة
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON messages;
CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
      AND auth.uid() != messages.sender_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
      AND auth.uid() != messages.sender_id
    )
  );

-- دالة لتحديث آخر رسالة في المحادثة
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.message,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لتحديث آخر رسالة تلقائياً
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();