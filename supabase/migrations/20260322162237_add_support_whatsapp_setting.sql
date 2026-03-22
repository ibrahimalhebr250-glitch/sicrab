/*
  # Add support_whatsapp to platform_settings

  ## Changes
  - Inserts a new setting_key 'support_whatsapp' so admins can set the platform's WhatsApp support number
  - Users will see a WhatsApp button in their profile to contact admin and submit payment receipts
*/

INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES ('support_whatsapp', '""', 'رقم واتساب الدعم للتواصل مع الإدارة')
ON CONFLICT (setting_key) DO NOTHING;
