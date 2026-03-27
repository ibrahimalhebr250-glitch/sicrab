import { Mail, Phone, MessageCircle, MapPin, Info, HelpCircle, Shield, Send } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'about',
      icon: Info,
      title: 'المنصة',
      color: 'amber',
      links: [
        { label: 'من نحن', href: '#' },
        { label: 'كيف نعمل', href: '#' },
        { label: 'الأسئلة الشائعة', href: '#' }
      ]
    },
    {
      id: 'support',
      icon: HelpCircle,
      title: 'الدعم',
      color: 'blue',
      links: [
        { label: 'المساعدة', href: '#' },
        { label: 'اتصل بنا', href: '#' },
        { label: 'بلغ عن مخالفة', href: '#' }
      ]
    },
    {
      id: 'policies',
      icon: Shield,
      title: 'السياسات',
      color: 'green',
      links: [
        { label: 'سياسة الاستخدام', href: '#' },
        { label: 'الخصوصية', href: '#' },
        { label: 'الشروط', href: '#' }
      ]
    }
  ];

  const getColorClasses = (color: string) => ({
    bg: color === 'amber' ? 'bg-amber-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-green-500/10',
    text: color === 'amber' ? 'text-amber-400' : color === 'blue' ? 'text-blue-400' : 'text-green-400',
    hover: color === 'amber' ? 'hover:bg-amber-500/20' : color === 'blue' ? 'hover:bg-blue-500/20' : 'hover:bg-green-500/20',
    border: color === 'amber' ? 'border-amber-500/30' : color === 'blue' ? 'border-blue-500/30' : 'border-green-500/30'
  });

  return (
    <footer className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-gray-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Mobile Accordion View */}
        <div className="lg:hidden space-y-3 mb-8">
          {sections.map((section) => {
            const Icon = section.icon;
            const colors = getColorClasses(section.color);
            const isExpanded = expandedSection === section.id;

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
                    {section.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.href}
                        className={`block py-2 px-3 text-sm rounded-lg ${colors.hover} transition-all text-gray-300 hover:${colors.text}`}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Contact Cards - Mobile */}
          <div className={`rounded-xl border border-rose-500/30 bg-rose-500/10 p-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4 text-rose-400" />
              </div>
              <span className="font-bold text-white text-sm">تواصل معنا</span>
            </div>
            <div className="space-y-2">
              <a href="mailto:info@souqalmawad.com" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-rose-500/20 transition-all group text-sm">
                <Mail className="w-4 h-4 text-rose-400" />
                <span className="text-gray-300 group-hover:text-rose-400">info@souqalmawad.com</span>
              </a>
              <a href="tel:+966501234567" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-rose-500/20 transition-all group text-sm">
                <Phone className="w-4 h-4 text-rose-400" />
                <span className="text-gray-300 group-hover:text-rose-400">966501234567+</span>
              </a>
              <a href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-rose-500/20 transition-all group text-sm">
                <MessageCircle className="w-4 h-4 text-rose-400" />
                <span className="text-gray-300 group-hover:text-rose-400">واتساب</span>
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8 mb-12 text-right">
          {sections.map((section) => {
            const Icon = section.icon;
            const colors = getColorClasses(section.color);

            return (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-2.5 justify-end mb-5">
                  <span className="text-white font-bold text-base">{section.title}</span>
                  <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <a href={link.href} className={`text-sm hover:${colors.text} transition-all hover:translate-x-1 inline-block font-medium`}>
                        {link.label}
                      </a>
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
              <a href="mailto:info@souqalmawad.com" className="flex items-center gap-3 justify-end text-sm hover:text-rose-400 transition-all group">
                <span className="font-medium">info@souqalmawad.com</span>
                <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-rose-500 transition-all group-hover:scale-110">
                  <Mail className="w-4 h-4" />
                </div>
              </a>
              <a href="tel:+966501234567" className="flex items-center gap-3 justify-end text-sm hover:text-green-400 transition-all group">
                <span className="font-medium">966501234567+</span>
                <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-all group-hover:scale-110">
                  <Phone className="w-4 h-4" />
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 justify-end text-sm hover:text-emerald-400 transition-all group">
                <span className="font-medium">واتساب</span>
                <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-all group-hover:scale-110">
                  <MessageCircle className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800 pt-6 sm:pt-8">
          <div className="flex flex-col items-center text-center gap-4 sm:gap-5 md:flex-row md:justify-between md:text-right">
            <p className="text-xs sm:text-sm text-gray-400 font-medium order-1 md:order-2">
              © 2024 سوق المشاتل - جميع الحقوق محفوظة
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
