import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Monitor,
  Tablet,
  Printer,
  CreditCard,
  Store,
  Car,
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Zap,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Globe,
  Briefcase,
  Award,
  MessageSquare,
  Gift,
  Share2,
  BarChart3,
  Crown,
  Rocket
} from "lucide-react";

export default function StrategicPositioning() {
  const [activeTab, setActiveTab] = useState("equipment");

  const equipmentPartners = {
    kitchenDisplays: {
      title: "Kitchen Display Systems (KDS)",
      icon: Monitor,
      partners: [
        {
          name: "Samsung Commercial Displays",
          tier: "Premium Partner",
          why: "Industry leader in commercial displays, excellent B2B programs",
          specs: "24-32\" touchscreens, IP65 rated, high brightness (1000+ nits)",
          models: ["QB24R-T", "QM32R", "QBR Series"],
          pricing: "$400-800 per unit (bulk discount available)",
          advantages: [
            "3-year commercial warranty",
            "MagicINFO cloud management",
            "24/7 reliability rating",
            "Existing restaurant vertical team"
          ],
          contact: {
            division: "B2B Display Solutions",
            email: "samsung.displays@partner.com",
            phone: "1-866-SAM-4BIZ"
          }
        },
        {
          name: "LG Business Solutions",
          tier: "Premium Partner",
          why: "Excellent commercial touch displays, strong partner program",
          specs: "22-32\" touchscreens, webOS, commercial-grade",
          models: ["22TP3D", "24TP3D", "32TP3D"],
          pricing: "$350-700 per unit",
          advantages: [
            "webOS built-in (can run browser apps)",
            "ThinQ IoT integration",
            "Energy efficient",
            "Strong reseller programs"
          ]
        },
        {
          name: "Dell OptiPlex All-in-One",
          tier: "Flexible Option",
          why: "Full PC solution, maximum compatibility",
          specs: "23.8-27\" touchscreen, Windows 10 IoT, fanless options",
          models: ["OptiPlex 7410 AIO", "OptiPlex 3280 AIO"],
          pricing: "$800-1200 per unit",
          advantages: [
            "Full Windows PC",
            "Run any software",
            "Easy IT management",
            "Long lifecycle support"
          ]
        }
      ],
      recommendation: "Start with Samsung QB24R-T for kitchen displays. Negotiate 20-30 unit pilot program with 35% discount."
    },
    kioskTablets: {
      title: "Kiosk Tablets (BYOD Compatible)",
      icon: Tablet,
      partners: [
        {
          name: "Apple iPad (9th/10th Gen)",
          tier: "Best for Kiosks",
          why: "Most reliable, long software support, customer familiarity",
          specs: "10.2-10.9\" display, A13-A14 chip, WiFi, iOS",
          models: ["iPad 10th Gen", "iPad Air"],
          pricing: "$329-449 retail (Education/Business discount: $299-399)",
          advantages: [
            "6+ years software updates",
            "Kiosk Mode built-in (Guided Access)",
            "99% customer familiarity",
            "Massive accessory ecosystem"
          ],
          accessories: [
            "Bouncepad Counter Twist - $249 (kiosk stand)",
            "CTA Digital PAD-ASKM - $180 (security mount)",
            "ArmorActive PIVOT - $329 (premium enclosure)"
          ]
        },
        {
          name: "Samsung Galaxy Tab A8/A9",
          tier: "Android Alternative",
          why: "Lower cost, good performance, enterprise features",
          specs: "10.5-11\" display, Android 12+, Knox security",
          models: ["Galaxy Tab A8", "Galaxy Tab A9+"],
          pricing: "$189-269 retail (Business: $159-229)",
          advantages: [
            "Lower upfront cost",
            "Samsung Knox security",
            "Split-screen capable",
            "Good for budget-conscious customers"
          ]
        },
        {
          name: "Amazon Fire HD 10 (for ultra-budget)",
          tier: "Economy Option",
          why: "Absolute lowest cost entry point",
          specs: "10.1\" display, Fire OS, WiFi",
          pricing: "$99-139 retail",
          advantages: [
            "Under $100 cost",
            "Good for demos/testing",
            "Built-in silk browser"
          ],
          limitations: ["Limited to web apps", "Shorter lifecycle"]
        }
      ],
      recommendation: "Promote iPad 10th Gen as primary BYOD option. Partner with Bouncepad for accessories. Offer 'Any Tablet Works' messaging."
    },
    receiptPrinters: {
      title: "Bluetooth Thermal Receipt Printers",
      icon: Printer,
      partners: [
        {
          name: "Star Micronics",
          tier: "Industry Standard",
          why: "#1 in restaurant POS printing, excellent Bluetooth reliability",
          specs: "3\" 80mm thermal, 250mm/s, auto-cutter, iOS/Android certified",
          models: [
            "TSP143IIIBI - $299 (Bluetooth, best seller)",
            "TSP654IIBI - $449 (faster, premium)",
            "mC-Print3 - $399 (modern design, USB-C)"
          ],
          pricing: "Bulk: $249-379 per unit (50+ units)",
          advantages: [
            "CloudPRNT protocol (cloud printing)",
            "WebPRNT (print from browser)",
            "Certified for Square, Stripe",
            "3-year warranty standard",
            "Kitchen printer variants (water-resistant)"
          ],
          contact: {
            division: "OEM/Partner Program",
            email: "oem@starmicronics.com",
            phone: "1-800-782-7636"
          }
        },
        {
          name: "Epson",
          tier: "Alternative Option",
          why: "Good quality, competitive pricing",
          specs: "3\" 80mm thermal, reliable, good SDK",
          models: [
            "TM-m30II - $279 (compact, modern)",
            "TM-m10 - $199 (ultra-compact)",
            "TM-T88VI - $399 (workhorse)"
          ],
          pricing: "Bulk: $219-349 per unit",
          advantages: [
            "ePOS-Print SDK",
            "Compact designs",
            "Energy efficient",
            "Good for mobile POS"
          ]
        }
      ],
      recommendation: "Standardize on Star Micronics TSP143IIIBI. Negotiate OEM partnership for 40% discount at 100+ units/quarter."
    },
    paymentProcessing: {
      title: "Payment Processing Integration",
      icon: CreditCard,
      partners: [
        {
          name: "Square",
          tier: "Primary Recommendation",
          why: "Best all-in-one solution, excellent API, restaurant-focused",
          pricing: "2.6% + $0.10 per transaction (card present)",
          features: [
            "Square Terminal ($299) - all-in-one",
            "Square Reader ($49) - mobile",
            "Square Register ($799) - full POS",
            "Virtual Terminal (3.5% + $0.15)"
          ],
          advantages: [
            "No monthly fees",
            "Same-day deposits",
            "Excellent API documentation",
            "PCI compliance included",
            "Gift card support",
            "Tip management",
            "Kitchen printer integration"
          ],
          integration: "Square Payments API - Full SDK available",
          partnerProgram: {
            name: "Square Partner Program",
            benefits: [
              "Revenue share on transactions",
              "Priority support",
              "Co-marketing opportunities",
              "Free dev hardware"
            ],
            apply: "https://squareup.com/partners"
          }
        },
        {
          name: "Stripe",
          tier: "Developer-Friendly Alternative",
          why: "Most flexible API, best for custom solutions",
          pricing: "2.9% + $0.30 per transaction (online)",
          features: [
            "Stripe Terminal ($59-299) - programmable readers",
            "Tap to Pay (iPhone/Android) - $0 hardware",
            "Custom payment flows",
            "Subscription billing"
          ],
          advantages: [
            "Best API in industry",
            "Global support (135+ currencies)",
            "Advanced fraud prevention (Radar)",
            "Revenue recognition tools",
            "Powerful dashboard"
          ],
          integration: "Stripe SDK - React/Node.js native",
          partnerProgram: {
            name: "Stripe Partner Ecosystem",
            benefits: [
              "Revenue share up to 90/10 split",
              "Free Terminal devices",
              "Technical partnership manager",
              "Joint go-to-market"
            ],
            apply: "https://stripe.com/partners/apply"
          }
        },
        {
          name: "PayPal/Zettle",
          tier: "Brand Recognition Play",
          why: "High customer trust, good for marketplaces",
          pricing: "2.29% + $0.09 (Zettle in-person)",
          advantages: [
            "PayPal brand trust",
            "Buy now, pay later (BNPL)",
            "Venmo integration",
            "Good for customer marketplaces"
          ]
        }
      ],
      recommendation: "Dual integration: Square (primary) + Stripe (advanced). Negotiate revenue share partnership with both."
    }
  };

  const negotiationStrategy = {
    approach: [
      {
        phase: "Phase 1: Research & Positioning",
        icon: Target,
        duration: "2-3 weeks",
        actions: [
          "Identify decision makers (VP of Partnerships, Director of Business Development)",
          "Research their current partner ecosystem",
          "Prepare compelling pitch deck with market opportunity",
          "Quantify potential order volume (50 restaurants × 4 devices = 200 units/quarter)",
          "Prepare competitor comparison showing why we're different"
        ]
      },
      {
        phase: "Phase 2: Initial Outreach",
        icon: MessageSquare,
        duration: "1-2 weeks",
        actions: [
          "Multi-channel approach: LinkedIn + Email + Phone",
          "Lead with value: 'Growing 500+ restaurant network seeking strategic hardware partner'",
          "Reference their competition: 'Currently evaluating Samsung vs LG for KDS'",
          "Request 30-minute intro call",
          "Name drop any mutual connections"
        ],
        emailTemplate: `Subject: Partnership Opportunity - 500+ Restaurant Network

Hi [Name],

I'm reaching out from RESTROBUDDY, a rapidly growing restaurant management platform serving 500+ restaurants nationwide. We're seeing 30% month-over-month growth and need to establish a strategic hardware partnership.

Key Opportunity:
• 200+ device orders in Q1 2024 alone
• Projected 1,000+ devices in first year
• Co-marketing to our growing restaurant network
• Testimonials & case studies featuring your products

We're currently evaluating [Samsung/LG/Star Micronics] and would love to explore how [Company] could be our preferred partner.

Are you available for a 30-minute call this week?

Best regards,
[Your Name]
CEO, RESTROBUDDY`
      },
      {
        phase: "Phase 3: Negotiation Points",
        icon: Briefcase,
        duration: "2-4 weeks",
        keyLeverages: [
          {
            point: "Volume Commitments",
            strategy: "Start with 100-unit pilot, commit to 500+ in year 1",
            ask: "35-40% discount off MSRP"
          },
          {
            point: "Marketing Partnership",
            strategy: "Feature their brand in our materials, case studies, restaurant events",
            ask: "Co-marketing fund ($10-25k), free demo units"
          },
          {
            point: "Technical Integration",
            strategy: "Dedicate engineering resources for seamless integration",
            ask: "Free API access, priority technical support, dev units"
          },
          {
            point: "Exclusivity (carefully)",
            strategy: "Offer 'preferred partner' status (not exclusive)",
            ask: "Better pricing, extended payment terms (Net 60)"
          },
          {
            point: "Revenue Share Model",
            strategy: "Propose rev-share on ongoing services (e.g., 10% on printer paper sales)",
            ask: "Deeper hardware discounts upfront"
          }
        ]
      },
      {
        phase: "Phase 4: Pilot Program",
        icon: Zap,
        duration: "3 months",
        structure: [
          "Start with 3-5 pilot restaurants",
          "Document everything: setup time, reliability, customer feedback",
          "Create video testimonials",
          "Weekly check-ins with partner",
          "Build case studies showing ROI",
          "Use pilot success to negotiate better terms for full rollout"
        ]
      }
    ],
    winningTactics: [
      "Use 'The Squeeze': Get quotes from 3 competitors, use as leverage",
      "Decision deadline: 'We need to decide by [date] to hit our Q1 targets'",
      "Walk-away power: Be prepared to actually choose competitor",
      "Executive alignment: Get their VP on a call with your CEO",
      "Success-based terms: 'Pay more per unit after we hit 500 units'",
      "Multi-year play: 'Start at 40% discount Y1, 35% Y2, 30% Y3 as we scale'"
    ]
  };

  const customerAcquisition = {
    restaurants: {
      title: "Restaurant Customer Acquisition",
      icon: Store,
      target: "5,000 restaurants by Year 2",
      strategies: [
        {
          channel: "Direct Sales (High-Touch)",
          icon: Phone,
          focus: "Enterprise & Multi-Location",
          tactics: [
            "Hire 3 restaurant-focused SDRs (Sales Dev Reps)",
            "Target chains: 5-50 locations (sweet spot)",
            "LinkedIn Sales Navigator for prospecting",
            "Attend restaurant trade shows: NRA Show, Restaurant Franchising & Innovation Summit",
            "Cold calling list: Purchase from ZoomInfo, Apollo.io",
            "Email sequences: 7-touch campaign over 2 weeks"
          ],
          metrics: {
            costPerAcquisition: "$800-1,200",
            conversionRate: "15-20%",
            avgContractValue: "$3,600/year (Professional plan)"
          },
          monthlyTarget: "20 new restaurants"
        },
        {
          channel: "Content Marketing & SEO",
          icon: Globe,
          focus: "Organic Growth",
          tactics: [
            "Blog: '10 Ways to Increase Restaurant Revenue' (target: 10k monthly visitors)",
            "Comparison pages: 'Toast POS vs RESTROBUDDY', 'Square vs RESTROBUDDY'",
            "YouTube channel: Setup tutorials, customer success stories",
            "Podcast sponsorships: Restaurant owner podcasts",
            "SEO keywords: 'free restaurant POS', 'kiosk ordering system', 'SMS ordering'",
            "Guest posts on QSR Magazine, Modern Restaurant Management"
          ],
          metrics: {
            costPerAcquisition: "$200-400",
            conversionRate: "3-5%",
            timeToResults: "4-6 months"
          },
          monthlyTarget: "30 sign-ups from organic"
        },
        {
          channel: "Paid Advertising",
          icon: Target,
          focus: "Rapid Scaling",
          tactics: [
            "Google Ads: Target 'restaurant POS alternative', 'Toast competitor', 'replace Clover'",
            "Facebook/Instagram: Carousel ads showing UI, testimonials",
            "YouTube pre-roll: 30-second demo videos",
            "Reddit: r/restaurantowners, r/smallbusiness (soft pitch + value)",
            "LinkedIn Ads: Target job titles: Restaurant Owner, GM, Operations Director",
            "Retargeting: Website visitors get $100 off promo"
          ],
          budget: "$10,000-15,000/month",
          metrics: {
            costPerAcquisition: "$400-600",
            conversionRate: "8-12%",
            avgCostPerClick: "$3-8"
          },
          monthlyTarget: "25 sign-ups"
        },
        {
          channel: "Partnership & Referrals",
          icon: Share2,
          focus: "Leverage Existing Networks",
          tactics: [
            "Commercial real estate brokers (they work with new restaurants)",
            "Restaurant equipment suppliers: Webstaurant, Restaurant Depot",
            "Food distributors: Sysco, US Foods (co-marketing)",
            "Business consultants: SCORE, small business advisors",
            "Referral program: $500 credit for referrer + referee",
            "Integration partners: QuickBooks, Gusto (payroll), Shopify"
          ],
          metrics: {
            costPerAcquisition: "$250-500 (referral bonus)",
            conversionRate: "25-35% (warm leads)",
            lifetime: "Higher retention (trust-based)"
          },
          monthlyTarget: "15 referral sign-ups"
        },
        {
          channel: "Freemium + Free Trial",
          icon: Gift,
          focus: "Low-Friction Entry",
          tactics: [
            "14-day free trial (no credit card)",
            "Free Starter plan (1 location, 100 orders/month)",
            "Free setup call + training",
            "Success milestones: Send tutorial emails at days 1, 3, 7, 14",
            "In-app prompts: 'Add online ordering to get 20% more sales'",
            "Gamification: 'Complete setup checklist to unlock features'"
          ],
          metrics: {
            freeTopaid: "20-30%",
            avgTimeToUpgrade: "45 days",
            costPerAcquisition: "$150-250"
          },
          monthlyTarget: "100 free trials → 25 paid"
        }
      ],
      projectedGrowth: {
        month1: 20,
        month3: 45,
        month6: 90,
        month12: 200,
        month24: 500
      }
    },
    drivers: {
      title: "Ride-ly Driver Acquisition",
      icon: Car,
      target: "10,000 active drivers by Year 1",
      strategies: [
        {
          channel: "Performance Marketing",
          tactics: [
            "Facebook/Instagram: Target DoorDash, Uber Eats drivers with 'Earn More' messaging",
            "Google Ads: 'Delivery driver jobs near me', 'gig economy'",
            "TikTok: Short videos showing driver earnings, freedom, flexibility",
            "Craigslist: Gig/jobs section in major cities",
            "Indeed/ZipRecruiter: 'Independent Contractor - Delivery Driver'"
          ],
          creativeAngles: [
            "Earn $25-35/hour with Ride-ly",
            "No boss, your schedule, instant payouts",
            "Better pay than DoorDash/Uber",
            "Drive for multiple apps at once",
            "Weekly bonuses: $200 for 30 deliveries"
          ],
          incentives: {
            signUpBonus: "$100 (after 10 completed deliveries)",
            weeklyGoal: "$200 bonus (30 deliveries/week)",
            referralBonus: "$150 (refer another driver)"
          },
          budget: "$8,000-12,000/month",
          costPerDriver: "$80-120",
          monthlyTarget: "100 new drivers"
        },
        {
          channel: "Grassroots & Community",
          tactics: [
            "College campuses: Flyers, info sessions (target students)",
            "Uber/Lyft driver hubs: Guerrilla marketing",
            "Car washes: Leave flyers on windshields",
            "Community centers: Spanish-language areas (untapped market)",
            "WhatsApp groups: Latino driver communities",
            "Driver meetups: Host monthly events, pizza + info session"
          ],
          focus: "Underserved communities, immigrant populations",
          costPerDriver: "$40-60",
          monthlyTarget: "80 new drivers"
        },
        {
          channel: "Driver Retention Program",
          focus: "Keep drivers active (50% churn is normal)",
          tactics: [
            "Gamification: Levels (Bronze → Platinum), unlock better pay",
            "Weekly challenges: 'Complete 25 deliveries, get $100 bonus'",
            "Driver leaderboard: Top 10 get $50/week extra",
            "24/7 driver support: Dedicated phone line",
            "Instant cash-out: Daily earnings → bank account in 30 minutes",
            "Driver insurance: Partner with insurance company",
            "Fuel cards: 5% cash back on gas",
            "Driver community: Private Facebook group, tips & support"
          ],
          retentionGoal: "70% active after 90 days (vs industry 50%)"
        }
      ],
      launchCities: [
        "Tier 1: Los Angeles, NYC, Chicago, Houston, Phoenix (months 1-3)",
        "Tier 2: Philadelphia, San Antonio, San Diego, Dallas, Austin (months 4-6)",
        "Tier 3: Miami, Atlanta, Boston, Seattle, Denver (months 7-12)"
      ]
    },
    consumers: {
      title: "Consumer/Rider Acquisition",
      icon: Users,
      target: "50,000 active users by Year 1",
      strategies: [
        {
          channel: "Restaurant Partnership Marketing",
          tactics: [
            "QR codes on tables: 'Order from your phone'",
            "Receipt marketing: '$5 off your next order'",
            "SMS campaigns: Restaurants text their customers about marketplace",
            "In-store signage: 'Now on RESTROBUDDY Marketplace'",
            "Loyalty integration: 'Order on app, earn double points'",
            "Email co-marketing: Joint emails with restaurants"
          ],
          advantage: "Pre-qualified, hungry customers already at restaurants",
          costPerAcquisition: "$2-5 (very low)",
          conversionRate: "15-25%",
          monthlyTarget: "2,000 new users"
        },
        {
          channel: "Paid User Acquisition",
          tactics: [
            "Facebook/Instagram: Carousel ads showing local restaurants",
            "Google Ads: 'Food delivery near me', '[City] restaurant delivery'",
            "Snapchat: Geo-targeted filters near restaurants",
            "Uber Eats/DoorDash competitors ads: Intercept competitor users",
            "App Store Optimization (ASO): Rank for 'food delivery', 'restaurant order'",
            "Apple Search Ads: Appear when searching for competitors"
          ],
          creativeAngles: [
            "Support Local: 'Order direct, restaurants keep more'",
            "Lower fees: '$0 delivery on orders $15+' (vs $5 on competitors)",
            "Exclusive deals: 'Restaurants offer better deals on RESTROBUDDY'",
            "Faster pickup: 'Order ahead, skip the line'"
          ],
          incentives: {
            firstOrder: "$10 off (minimum $20 order)",
            referralCredit: "$5 for referrer + referee",
            subscriptionModel: "RESTROBUDDY Plus: $9.99/month for free delivery"
          },
          budget: "$15,000-25,000/month",
          costPerAcquisition: "$15-25",
          monthlyTarget: "1,000 paid users"
        },
        {
          channel: "Influencer & Content Marketing",
          tactics: [
            "Micro-influencers: Local food bloggers (5-50k followers)",
            "Instagram: Partner with foodie accounts in each city",
            "TikTok: #FoodTok creators showing RESTROBUDDY unboxing",
            "YouTube: 'Order from 5 local restaurants' challenge",
            "Food bloggers: Free meals in exchange for reviews",
            "User-generated content: '#RESTROBUDDYEats photo contest'"
          ],
          budget: "$3,000-5,000/month",
          costPerAcquisition: "$8-15",
          monthlyTarget: "300 users from influencers"
        },
        {
          channel: "Viral/Growth Hacking",
          tactics: [
            "Referral program: 'Invite 3 friends, get free delivery for a month'",
            "Social sharing: 'Share your order on Instagram story, get 10% off next order'",
            "Group ordering: 'Order with friends, everyone saves'",
            "Gamification: 'Order from 5 different restaurants, unlock VIP status'",
            "Limited-time events: 'Today only: 50% off all sushi'",
            "Flash sales: Push notifications for lunch/dinner rush"
          ],
          viralCoefficient: "Target 1.5 (each user brings 1.5 more)",
          costPerAcquisition: "$5-10",
          monthlyTarget: "500 viral users"
        },
        {
          channel: "SEO & Organic",
          tactics: [
            "City-specific pages: '[City] Food Delivery', '[City] Restaurant Ordering'",
            "Restaurant pages: SEO-optimized pages for each restaurant",
            "Blog content: 'Best restaurants in [City]', 'Food delivery guide'",
            "Google My Business: Claim for each city",
            "Local PR: Press releases in local news",
            "Food delivery listicles: 'Best food delivery apps 2024'"
          ],
          timeToResults: "3-6 months",
          costPerAcquisition: "$3-8 (long-term)",
          monthlyTarget: "500 organic users (by month 6)"
        }
      ],
      retentionStrategy: {
        week1: "Welcome email with $5 credit, tutorial video",
        week2: "Push notification: 'Miss you! Here's 20% off'",
        month1: "Personalized recommendations based on orders",
        month3: "Loyalty program: 'You've earned 500 points!'",
        ongoing: "Weekly deals, push notifications, email campaigns"
      }
    }
  };

  const kpiDashboard = {
    restaurants: {
      year1Target: 500,
      monthlyGrowth: "15-20%",
      avgRevenue: "$299/month (Professional plan)",
      ltv: "$10,764 (3-year retention assumed)",
      cac: "$400-800",
      ltvCacRatio: "13:1 (healthy)"
    },
    drivers: {
      year1Target: 10000,
      activeRate: "30% (3000 active weekly)",
      avgEarnings: "$800-1200/week",
      commissionRate: "15%",
      avgRevenuePerDriver: "$600/month to Ride-ly"
    },
    consumers: {
      year1Target: 50000,
      activeRate: "25% (12,500 monthly active)",
      avgOrderValue: "$32",
      ordersPerMonth: "2.5 (per active user)",
      commissionPerOrder: "$4.80 (15% of $32)"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Badge className="bg-purple-600 text-white mb-4">
            <Rocket className="w-4 h-4 mr-2" />
            STRATEGIC POSITIONING & GROWTH
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Market Strategy & Partnership Playbook
          </h1>
          <p className="text-lg text-slate-600">
            Comprehensive strategy for equipment partnerships, customer acquisition, and market domination
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="equipment">Equipment Partners</TabsTrigger>
            <TabsTrigger value="negotiation">Negotiation Strategy</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurant Acquisition</TabsTrigger>
            <TabsTrigger value="drivers">Driver Acquisition</TabsTrigger>
            <TabsTrigger value="consumers">Consumer Acquisition</TabsTrigger>
            <TabsTrigger value="kpis">KPI Dashboard</TabsTrigger>
          </TabsList>

          {/* Equipment Partners Tab */}
          <TabsContent value="equipment" className="space-y-8">
            {Object.entries(equipmentPartners).map(([key, category]) => (
              <Card key={key} className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {category.partners.map((partner, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">{partner.name}</h3>
                          <Badge className="bg-blue-600 text-white">{partner.tier}</Badge>
                        </div>
                        {partner.pricing && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{partner.pricing.split(' ')[0]}</p>
                            <p className="text-xs text-slate-600">{partner.pricing.split(' ').slice(1).join(' ')}</p>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="font-semibold text-slate-700 mb-1">Why Partner?</p>
                        <p className="text-slate-600">{partner.why}</p>
                      </div>

                      {partner.specs && (
                        <div className="mb-4">
                          <p className="font-semibold text-slate-700 mb-1">Specifications:</p>
                          <p className="text-slate-600">{partner.specs}</p>
                        </div>
                      )}

                      {partner.models && (
                        <div className="mb-4">
                          <p className="font-semibold text-slate-700 mb-1">Recommended Models:</p>
                          <div className="flex flex-wrap gap-2">
                            {partner.models.map((model, mIdx) => (
                              <Badge key={mIdx} variant="outline" className="bg-white">
                                {model}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-4">
                        <p className="font-semibold text-slate-700 mb-2">Key Advantages:</p>
                        <div className="grid md:grid-cols-2 gap-2">
                          {partner.advantages.map((adv, aIdx) => (
                            <div key={aIdx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-700">{adv}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {partner.contact && (
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <p className="font-semibold text-slate-700 mb-2">Contact Information:</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-600">
                              <strong>Division:</strong> {partner.contact.division}
                            </p>
                            {partner.contact.email && (
                              <p className="text-slate-600">
                                <Mail className="w-4 h-4 inline mr-2" />
                                {partner.contact.email}
                              </p>
                            )}
                            {partner.contact.phone && (
                              <p className="text-slate-600">
                                <Phone className="w-4 h-4 inline mr-2" />
                                {partner.contact.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {partner.partnerProgram && (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-4">
                          <p className="font-semibold text-green-900 mb-2">
                            <Award className="w-4 h-4 inline mr-2" />
                            {partner.partnerProgram.name}
                          </p>
                          <ul className="space-y-1">
                            {partner.partnerProgram.benefits.map((benefit, bIdx) => (
                              <li key={bIdx} className="text-sm text-green-800 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                          {partner.partnerProgram.apply && (
                            <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700" asChild>
                              <a href={partner.partnerProgram.apply} target="_blank" rel="noopener noreferrer">
                                Apply Now
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {category.recommendation && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-400">
                      <div className="flex items-start gap-3">
                        <Crown className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-bold text-amber-900 mb-2">Strategic Recommendation:</p>
                          <p className="text-amber-800">{category.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Negotiation Strategy Tab */}
          <TabsContent value="negotiation" className="space-y-8">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                  4-Phase Partnership Negotiation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {negotiationStrategy.approach.map((phase, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{phase.phase}</h3>
                        <p className="text-sm text-slate-600">Duration: {phase.duration}</p>
                      </div>
                    </div>

                    {phase.actions && (
                      <div className="space-y-2">
                        {phase.actions.map((action, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{action}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {phase.emailTemplate && (
                      <div className="mt-4 bg-white rounded-lg p-4 border-2 border-purple-200">
                        <p className="font-semibold text-purple-900 mb-2">Email Template:</p>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded">
                          {phase.emailTemplate}
                        </pre>
                        <Button size="sm" className="mt-3 bg-purple-600">
                          Copy Template
                        </Button>
                      </div>
                    )}

                    {phase.keyLeverages && (
                      <div className="mt-4 space-y-3">
                        {phase.keyLeverages.map((leverage, lIdx) => (
                          <div key={lIdx} className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-slate-900">{leverage.point}</h4>
                              <Badge className="bg-green-600 text-white">{leverage.ask}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Strategy:</strong> {leverage.strategy}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {phase.structure && (
                      <div className="mt-4 bg-white rounded-lg p-4">
                        <ul className="space-y-2">
                          {phase.structure.map((item, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" />
                              <span className="text-slate-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Winning Negotiation Tactics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {negotiationStrategy.winningTactics.map((tactic, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{tactic}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurant Acquisition Tab */}
          <TabsContent value="restaurants" className="space-y-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Store className="w-10 h-10" />
                  Restaurant Customer Acquisition Strategy
                </CardTitle>
                <p className="text-emerald-100 text-lg">
                  Target: {customerAcquisition.restaurants.target} | Multi-Channel Growth Playbook
                </p>
              </CardHeader>
            </Card>

            {customerAcquisition.restaurants.strategies.map((strategy, idx) => (
              <Card key={idx} className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <strategy.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{strategy.channel}</CardTitle>
                      <p className="text-slate-600">Focus: {strategy.focus}</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-lg px-4 py-2">
                      Target: {strategy.monthlyTarget}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3">Tactics:</h4>
                    <div className="grid gap-2">
                      {strategy.tactics.map((tactic, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{tactic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {strategy.metrics && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-semibold mb-1">Cost Per Acquisition</p>
                        <p className="text-2xl font-bold text-blue-900">{strategy.metrics.costPerAcquisition}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-semibold mb-1">Conversion Rate</p>
                        <p className="text-2xl font-bold text-green-900">{strategy.metrics.conversionRate}</p>
                      </div>
                      {strategy.metrics.avgContractValue && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-purple-600 font-semibold mb-1">Avg Contract Value</p>
                          <p className="text-2xl font-bold text-purple-900">{strategy.metrics.avgContractValue}</p>
                        </div>
                      )}
                      {strategy.metrics.timeToResults && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <p className="text-sm text-amber-600 font-semibold mb-1">Time to Results</p>
                          <p className="text-2xl font-bold text-amber-900">{strategy.metrics.timeToResults}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {strategy.budget && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <p className="font-semibold text-purple-900">Monthly Budget: {strategy.budget}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  Projected Growth Trajectory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(customerAcquisition.restaurants.projectedGrowth).map(([period, value]) => (
                    <div key={period} className="text-center bg-white rounded-lg p-4 shadow">
                      <p className="text-xs text-slate-600 uppercase mb-1">{period}</p>
                      <p className="text-3xl font-bold text-blue-600">{value}</p>
                      <p className="text-xs text-slate-500">restaurants</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Driver Acquisition Tab */}
          <TabsContent value="drivers" className="space-y-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Car className="w-10 h-10" />
                  Ride-ly Driver Acquisition Strategy
                </CardTitle>
                <p className="text-blue-100 text-lg">
                  Target: {customerAcquisition.drivers.target} | Build the Fleet
                </p>
              </CardHeader>
            </Card>

            {customerAcquisition.drivers.strategies.map((strategy, idx) => (
              <Card key={idx} className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">{strategy.channel}</CardTitle>
                  {strategy.focus && (
                    <p className="text-slate-600">Focus: {strategy.focus}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3">Tactics:</h4>
                    <div className="grid gap-2">
                      {strategy.tactics.map((tactic, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{tactic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {strategy.creativeAngles && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-3">Creative Angles:</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {strategy.creativeAngles.map((angle, aIdx) => (
                          <div key={aIdx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border-l-4 border-blue-500">
                            <p className="text-slate-800 font-medium">"{angle}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {strategy.incentives && (
                    <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                      <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        Driver Incentives
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(strategy.incentives).map(([key, value]) => (
                          <div key={key} className="bg-white rounded-lg p-4">
                            <p className="text-sm text-green-600 font-semibold mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-xl font-bold text-green-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {strategy.budget && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-semibold mb-1">Monthly Budget</p>
                        <p className="text-2xl font-bold text-purple-900">{strategy.budget}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-semibold mb-1">Cost Per Driver</p>
                        <p className="text-2xl font-bold text-blue-900">{strategy.costPerDriver}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-semibold mb-1">Monthly Target</p>
                        <p className="text-2xl font-bold text-green-900">{strategy.monthlyTarget}</p>
                      </div>
                    </div>
                  )}

                  {strategy.retentionGoal && (
                    <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                      <p className="font-semibold text-amber-900">Retention Goal: {strategy.retentionGoal}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Globe className="w-8 h-8 text-blue-600" />
                  Geographic Launch Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerAcquisition.drivers.launchCities.map((tier, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-slate-800 font-medium">{tier}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consumer Acquisition Tab */}
          <TabsContent value="consumers" className="space-y-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Users className="w-10 h-10" />
                  Consumer/Rider Acquisition Strategy
                </CardTitle>
                <p className="text-purple-100 text-lg">
                  Target: {customerAcquisition.consumers.target} | Build the User Base
                </p>
              </CardHeader>
            </Card>

            {customerAcquisition.consumers.strategies.map((strategy, idx) => (
              <Card key={idx} className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{strategy.channel}</CardTitle>
                    {strategy.monthlyTarget && (
                      <Badge className="bg-purple-600 text-white text-lg px-4 py-2">
                        Target: {strategy.monthlyTarget}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3">Tactics:</h4>
                    <div className="grid gap-2">
                      {strategy.tactics.map((tactic, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{tactic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {strategy.advantage && (
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="font-semibold text-green-900">Key Advantage: {strategy.advantage}</p>
                    </div>
                  )}

                  {strategy.creativeAngles && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-3">Creative Angles:</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {strategy.creativeAngles.map((angle, aIdx) => (
                          <div key={aIdx} className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border-l-4 border-purple-500">
                            <p className="text-slate-800 font-medium">"{angle}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {strategy.incentives && (
                    <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        User Incentives
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(strategy.incentives).map(([key, value]) => (
                          <div key={key} className="bg-white rounded-lg p-4">
                            <p className="text-sm text-blue-600 font-semibold mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-lg font-bold text-blue-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(strategy.costPerAcquisition || strategy.budget) && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {strategy.budget && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-purple-600 font-semibold mb-1">Monthly Budget</p>
                          <p className="text-2xl font-bold text-purple-900">{strategy.budget}</p>
                        </div>
                      )}
                      {strategy.costPerAcquisition && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-blue-600 font-semibold mb-1">Cost Per User</p>
                          <p className="text-2xl font-bold text-blue-900">{strategy.costPerAcquisition}</p>
                        </div>
                      )}
                      {strategy.conversionRate && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-green-600 font-semibold mb-1">Conversion Rate</p>
                          <p className="text-2xl font-bold text-green-900">{strategy.conversionRate}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {strategy.viralCoefficient && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-300">
                      <p className="font-semibold text-pink-900">
                        <Zap className="w-5 h-5 inline mr-2" />
                        Viral Coefficient Target: {strategy.viralCoefficient}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="border-0 shadow-xl bg-gradient-to-r from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-600" />
                  User Retention Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(customerAcquisition.consumers.retentionStrategy).map(([period, action]) => (
                    <div key={period} className="bg-white rounded-lg p-4 shadow border-l-4 border-amber-500">
                      <p className="text-sm text-amber-600 font-semibold mb-2 uppercase">{period}</p>
                      <p className="text-slate-700">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI Dashboard Tab */}
          <TabsContent value="kpis" className="space-y-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <BarChart3 className="w-10 h-10" />
                  Key Performance Indicators & Financial Projections
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Restaurants KPIs */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-6 h-6" />
                    Restaurants
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {Object.entries(kpiDashboard.restaurants).map(([key, value]) => (
                    <div key={key} className="border-b pb-3 last:border-0">
                      <p className="text-sm text-slate-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xl font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Drivers KPIs */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-6 h-6" />
                    Drivers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {Object.entries(kpiDashboard.drivers).map(([key, value]) => (
                    <div key={key} className="border-b pb-3 last:border-0">
                      <p className="text-sm text-slate-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xl font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Consumers KPIs */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Consumers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {Object.entries(kpiDashboard.consumers).map(([key, value]) => (
                    <div key={key} className="border-b pb-3 last:border-0">
                      <p className="text-sm text-slate-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xl font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  Year 1 Revenue Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                    <p className="text-sm text-green-600 font-semibold mb-2">Restaurant Revenue</p>
                    <p className="text-3xl font-bold text-green-900 mb-1">$1.79M</p>
                    <p className="text-xs text-slate-600">500 restaurants × $299/mo × 12</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-600 font-semibold mb-2">Driver Commission</p>
                    <p className="text-3xl font-bold text-blue-900 mb-1">$2.16M</p>
                    <p className="text-xs text-slate-600">3,000 active × $600/mo × 12</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                    <p className="text-sm text-purple-600 font-semibold mb-2">Marketplace Commission</p>
                    <p className="text-3xl font-bold text-purple-900 mb-1">$1.8M</p>
                    <p className="text-xs text-slate-600">12,500 active × $4.80 × 30 orders</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-lg text-white">
                    <p className="text-sm font-semibold mb-2">Total ARR</p>
                    <p className="text-4xl font-bold mb-1">$5.75M</p>
                    <p className="text-xs">Annual Recurring Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}