import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export default function SEO({
  title = 'سوق المواد - منصة بيع وشراء السكراب والمواد الصناعية',
  description = 'منصة موثوقة لبيع وشراء السكراب والمواد الصناعية في السعودية. اشتري وبع بكل سهولة وأمان.',
  keywords = 'سكراب, حديد, معادن, مواد صناعية, بيع سكراب, شراء سكراب, سوق السكراب, المواد المعاد تدويرها',
  image = 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&h=630',
  url = typeof window !== 'undefined' ? window.location.href : '',
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },

      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'ar_SA' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },

      { name: 'robots', content: 'index, follow' },
      { name: 'language', content: 'Arabic' },
      { name: 'author', content: 'سوق المواد' },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const attribute = property ? 'property' : 'name';
      const value = property || name;

      let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', value);
        } else {
          meta.setAttribute('name', value);
        }
        document.head.appendChild(meta);
      }

      meta.content = content;
    });
  }, [title, description, keywords, image, url]);

  return null;
}
