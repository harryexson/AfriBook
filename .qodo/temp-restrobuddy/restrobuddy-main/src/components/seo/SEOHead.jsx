import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SEOHead({ 
  title = "RESTROBUDDY - Modern Restaurant Management System",
  description = "Your all-in-one solution for modern restaurant management. SMS ordering, kiosk mode, online ordering, kitchen display, and delivery integration. Save money and increase revenue.",
  keywords = "restaurant management, pos system, online ordering, kiosk mode, sms ordering, kitchen display, restaurant software, delivery integration, menu management, restaurant technology",
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png",
  type = "website",
  author = "Bold Intelligent Solutions Partners Inc.",
  customDomain = "restrobuddy.com" // Change this to your actual domain
}) {
  const location = useLocation();
  const baseUrl = customDomain ? `https://${customDomain}` : window.location.origin;
  const currentUrl = `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // Open Graph meta tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'RESTROBUDDY', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@restrobuddy');
    updateMetaTag('twitter:creator', '@restrobuddy');

    // Additional SEO tags
    updateMetaTag('theme-color', '#10b981');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('apple-mobile-web-app-title', 'RESTROBUDDY');

    // Google Search Console verification - ADD YOUR VERIFICATION CODE HERE
    updateMetaTag('google-site-verification', 'YOUR_GOOGLE_VERIFICATION_CODE');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

  }, [title, description, keywords, image, currentUrl, type, author, baseUrl]);

  return null;
}