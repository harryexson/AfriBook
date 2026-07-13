import { useEffect } from "react";

export default function StructuredData({ data }) {
  useEffect(() => {
    const scriptId = 'structured-data';
    let script = document.getElementById(scriptId);
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(data);

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript && existingScript !== script) {
        existingScript.remove();
      }
    };
  }, [data]);

  return null;
}

// Helper function to create Organization schema
export function createOrganizationSchema(customDomain = "restrobuddy.com") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RESTROBUDDY",
    "legalName": "Bold Intelligent Solutions Partners Inc.",
    "url": `https://${customDomain}`,
    "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png",
    "foundingDate": "2024",
    "description": "Your all-in-one solution for modern restaurant management. SMS ordering, kiosk mode, online ordering, and more.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@restrobuddy.com"
    },
    "sameAs": [
      "https://www.facebook.com/restrobuddy",
      "https://twitter.com/restrobuddy",
      "https://www.linkedin.com/company/restrobuddy",
      "https://www.instagram.com/restrobuddy"
    ]
  };
}

// Helper function to create SoftwareApplication schema
export function createSoftwareSchema(customDomain = "restrobuddy.com") {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RESTROBUDDY",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "99",
      "highPrice": "599",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "99",
        "priceCurrency": "USD",
        "unitText": "MONTH"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "Complete restaurant management system with SMS ordering, kiosk mode, online ordering, kitchen display, and delivery integration.",
    "featureList": [
      "SMS Keyword Ordering",
      "BYOD Kiosk Mode",
      "Online Ordering",
      "Kitchen Display System",
      "Inventory Management",
      "Employee Management",
      "Delivery Integration",
      "Loyalty Program",
      "Advanced Analytics"
    ]
  };
}

// Helper function to create Product schema for pricing
export function createProductSchema(plan, customDomain = "restrobuddy.com") {
  const prices = {
    starter: { monthly: 99, annual: 950 },
    professional: { monthly: 299, annual: 2868 },
    enterprise: { monthly: 599, annual: 5748 }
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `RESTROBUDDY ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
    "description": `RESTROBUDDY ${plan} plan for restaurant management`,
    "brand": {
      "@type": "Brand",
      "name": "RESTROBUDDY"
    },
    "offers": {
      "@type": "Offer",
      "price": prices[plan]?.monthly || 99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://${customDomain}/pricing`,
      "priceValidUntil": "2025-12-31"
    }
  };
}

// Helper function to create FAQPage schema
export function createFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does RESTROBUDDY cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "RESTROBUDDY offers three plans: Starter at $99/month, Professional at $299/month, and Enterprise at $599/month. All plans include a 14-day free trial with no credit card required."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to buy expensive hardware?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No! RESTROBUDDY's BYOD (Bring Your Own Device) approach lets you use any tablet, iPad, or computer you already own. Save $1,000+ on proprietary hardware costs."
        }
      },
      {
        "@type": "Question",
        "name": "How long does setup take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Setup takes approximately 1 hour. You can go live with online ordering, kiosk mode, and kitchen display on the same day you sign up."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a contract or cancellation fee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No contracts or cancellation fees. RESTROBUDDY is month-to-month, and you can cancel anytime with no penalties."
        }
      }
    ]
  };
}