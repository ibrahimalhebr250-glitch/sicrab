import { Mail, Phone, MessageCircle, MapPin, Info, HelpCircle, Shield, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface FooterLink {
  id: string;
  section: 'platform' | 'support' | 'policies';
  label: string;
  url: string;
  sort_order: number;
}

interface ContactSettings {
  footer_email: string;
  footer_phone: string;
  footer_whatsapp: string;
  footer_copyright: string;
}

const CONTACT_DEFAULTS: ContactSettings = {
  footer_email: 'info@souqalmawad.com',
  footer_phone: '966501234567',
  footer_whatsapp: '966501234567',
  footer_copyright: '© 2024 سوق المشاتل - جميع الحقوق محفوظة',
};

function FooterNavLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (!href || href === '#') {
    return <span className={className}>{children}</span>;
  }
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  }
  const path = href.startsWith('/') ? href : `/${href}`;
  return <Link to={path} className={className}>{children}</Link>;
}

export default function Footer() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactSettings>(CONTACT_DEFAULTS);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [aboutText, setAboutText] = useState('');

  useEffect(() => {
    async function loadData() {
      const [settingsRes, linksRes, siteRes] = await Promise.all([
        supabase
          .from('platform_settings')
          .select('setting_key, setting_value')
          .in('setting_key', Object.keys(CONTACT_DEFAULTS)),
        supabase
          .from('footer_links')
          .select('id, section, label, url, sort_order')
          .eq('is_active', true)
          .order('section')
          .order('sort_order'),
        supabase
          .from('site_settings')
          .select('footer_about_text')
          .maybeSingle(),
      ]);

      if (settingsRes.data) {
        const map: Partial<ContactSettings> = {};
        settingsRes.data.forEach((row: { setting_key: string; setting_value: any }) => {
          const val = typeof row.setting_value === 'string'
            ? row.setting_value
            : row.setting_value !== null && row.setting_value !== undefined
              ? String(row.setting_value)
              : null;
          if (val !== null) (map as any)[row.setting_key] = val;
        });
        setContact({ ...CONTACT_DEFAULTS, ...map });
      }

      if (linksRes.data) {
        setFooterLinks(linksRes.data);
      }

      if (siteRes.data?.footer_about_text) {
        setAboutText(siteRes.data.footer_about_text);
      }
    }
    loadData();
  }, []);

  const getSectionLinks = (section: 'platform' | 'support' | 'policies') =>
    footerLinks.filter(l => l.section === section).sort((a, b) => a.sort_order - b.sort_order);

  const sections = [
    { id: 'platform', icon: Info, title: 'المنصة', color: 'amber' },
    { id: 'support', icon: HelpCircle, title: 'الدعم', color: 'blue' },
    { id: 'policies', icon: Shield, title: 'السياسات', color: 'green' },
  ] as const;

  const getColorClasses = (color: string) => ({
    bg: color === 'amber' ? 'bg-amber-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-green-500/10',
    text: color === 'amber' ? 'text-amber-400' : color === 'blue' ? 'text-blue-400' : 'text-green-400',
    hover: color === 'amber' ? 'hover:bg-amber-500/20' : color === 'blue' ? 'hover:bg-blue-500/20' : 'hover:bg-green-500/20',
    border: color === 'amber' ? 'border-amber-500/30' : color === 'blue' ? 'border-blue-500/30' : 'border-green-500/30',
  });

  const phoneDisplay = contact.footer_phone ? `+${contact.footer_phone}` : '';
  const emailHref = contact.footer_email ? `mailto:${contact.footer_email}` : '#';
  const phoneHref = contact.footer_phone ? `tel:+${contact.footer_phone}` : '#';
  const whatsappHref = contact.footer_whatsapp ? `https://wa.me/${contact.footer_whatsapp}` : '#';

  return (
    <footer className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-gray-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Mobile Accordion View */}
        <div className="lg:hidden space-y-3 mb-8">
          {sections.map((section) => {
            const Icon = section.icon;
            const colors = getColorClasses(section.color);
            const isExpanded = expandedSection === section.id;
            const links = getSectionLinks(section.id);

            return (
              <div key={section.id} className={`rounded-xl border ${colors.border} overflow-hidden transition-all ${colors.bg}`}>
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className={`w-full px-4 py-3.5 flex items-center justify-between ${colors.hover} transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className="font-bold text-white text-sm">{section.title}</span>
                  </div>
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className={`w-5 h-5 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-2 animate-in slide-in-from-top-2">
                    {links.map((link) => (
                      <FooterNavLink
                        key={link.id}
                        href={link.url}
                        className={`block py-2 px-3 text-sm rounded-lg ${colors.hover} transition-all text-gray-300 hover:${colors.text}`}
                      >
                        {link.label}
                      </FooterNavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Contact Cards - Mobile */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4 text-rose-400" />
              </div>
              <span className="font-bold text-white text-sm">تواصل معنا</span>
            </div>
            <div className="space-y-2">
              {contact.footer_email && (
                <a href={emailHref} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-rose-500/20 transition-all group text-sm">
                  <Mail className="w-4 h-4 text-rose-400" />
                  <span className="text-gray-300 group-hover:text-rose-400">{contact.footer_email}</span>
                </a>
              )}
              {contact.footer_phone && (
                <a href={phoneHref} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-rose-500/20 transition-all group text-sm">
                  <Phone className="w-4 h-4 text-rose-400" />
                  <span className="text-gray-300 group-hover:text-rose-400">{phoneDisplay}</span>
                </a>
              )}
              {contact.footer_whatsapp && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-rose-500/20 transition-all group text-sm">
                  <MessageCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-gray-300 group-hover:text-rose-400">واتساب</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* About Text - Desktop */}
        {aboutText && (
          <div className="hidden lg:block mb-8 pb-8 border-b border-slate-800">
            <p className="text-gray-400 text-sm leading-relaxed text-right max-w-2xl mr-auto">
              {aboutText}
            </p>
          </div>
        )}

        {/* About Text - Mobile */}
        {aboutText && (
          <div className="lg:hidden mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-gray-400 text-sm leading-relaxed text-right">{aboutText}</p>
          </div>
        )}

        {/* Desktop Grid View */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8 mb-12 text-right">
          {sections.map((section) => {
            const Icon = section.icon;
            const colors = getColorClasses(section.color);
            const links = getSectionLinks(section.id);

            return (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-2.5 justify-end mb-5">
                  <span className="text-white font-bold text-base">{section.title}</span>
                  <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                </div>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.id}>
                      <FooterNavLink href={link.url} className={`text-sm hover:${colors.text} transition-all hover:translate-x-1 inline-block font-medium`}>
                        {link.label}
                      </FooterNavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="space-y-4">
            <div className="flex items-center gap-2.5 justify-end mb-5">
              <span className="text-white font-bold text-base">تواصل معنا</span>
              <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="space-y-3">
              {contact.footer_email && (
                <a href={emailHref} className="flex items-center gap-3 justify-end text-sm hover:text-rose-400 transition-all group">
                  <span className="font-medium">{contact.footer_email}</span>
                  <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-rose-500 transition-all group-hover:scale-110">
                    <Mail className="w-4 h-4" />
                  </div>
                </a>
              )}
              {contact.footer_phone && (
                <a href={phoneHref} className="flex items-center gap-3 justify-end text-sm hover:text-green-400 transition-all group">
                  <span className="font-medium">{phoneDisplay}</span>
                  <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-all group-hover:scale-110">
                    <Phone className="w-4 h-4" />
                  </div>
                </a>
              )}
              {contact.footer_whatsapp && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 justify-end text-sm hover:text-emerald-400 transition-all group">
                  <span className="font-medium">واتساب</span>
                  <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-all group-hover:scale-110">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800 pt-6 sm:pt-8">
          <div className="flex flex-col items-center text-center gap-4 sm:gap-5 md:flex-row md:justify-between md:text-right">
            <p className="text-xs sm:text-sm text-gray-400 font-medium order-1 md:order-2">
              {contact.footer_copyright}
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 order-2 md:order-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-400 font-medium">صنع بـ</span>
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-400 font-medium">في المملكة</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-slate-700"></div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-xs sm:text-sm text-gray-400 font-medium">الرياض</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
