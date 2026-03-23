/*
  # Update Site Settings to Nursery & Trees Marketplace

  Changes all platform branding from scrap market to trees/nursery marketplace:
  - site_name: سوق المشاتل
  - Titles and descriptions updated
  - SEO keywords updated for trees and nursery context
*/

UPDATE site_settings SET
  site_name = 'سوق المشاتل',
  home_hero_title = 'اشتري وبع الأشجار والنباتات والمشاتل',
  home_hero_subtitle = 'منصة موثوقة لبيع وشراء الأشجار والنباتات',
  meta_title = 'سوق المشاتل',
  meta_description = 'منصة موثوقة لبيع وشراء الأشجار والنباتات والمشاتل في المملكة العربية السعودية',
  meta_keywords = 'مشاتل, أشجار, نباتات, زراعة, بيع أشجار, شراء نباتات, تشجير',
  updated_at = now();
