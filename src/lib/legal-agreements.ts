import type { LucideIcon } from "lucide-react";
import {
  Shield,
  Scale,
  Ban,
  Users,
  Car,
  Home,
  CreditCard,
  Globe,
  AlertTriangle,
  FileText,
  UserCheck,
  Landmark,
  ClipboardCheck,
  ShieldCheck,
  CalendarClock,
  Copyright,
  RefreshCw,
  ShieldAlert,
  FileCheck,
  Gift,
  Percent,
} from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  icon: LucideIcon;
  content: Array<{
    heading?: string;
    body?: string;
    list?: string[];
    callout?: string;
  }>;
}

export interface AgreementDoc {
  slug: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  tocLabel: string;
  intro: string[];
  sections: LegalSection[];
}

export const HOST_AGREEMENT: AgreementDoc = {
  slug: "host-agreement",
  title: "Host Agreement",
  subtitle:
    "StayScape Host Terms of Service for hosts listing properties on AfriBook Stayscape",
  effectiveDate: "August 8, 2026",
  lastUpdated: "August 8, 2026",
  tocLabel: "Host Agreement",
  intro: [
    'This Host Agreement ("Agreement") is a legally binding contract between you ("Host," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your listing and management of properties on the StayScape platform available through AfriBook Stayscape ("Platform").',
    "By signing this Agreement, you agree to list and manage properties on StayScape under the terms and conditions set out below. Your digital signature confirms that you have read, understood and agreed to these terms. If you do not agree to any part of this Agreement, do not list a property on StayScape.",
  ],
  sections: [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: FileCheck,
      content: [
        {
          body: "By signing this Agreement, you agree to list and manage properties on the Platform under these terms and conditions. Your continued operation as a Host, including listing a Property or accepting any booking through the Platform, reaffirms your acceptance of this Agreement.",
        },
      ],
    },
    {
      id: "definitions",
      title: "2. Definitions",
      icon: FileText,
      content: [
        {
          body: "In this Agreement:",
          list: [
            '"Property" means any accommodation unit you list on the Platform, including hotel rooms, suites, guesthouse rooms, apartments, villas, holiday homes or other short-stay accommodation.',
            '"Guest" means any person who books or stays at your Property through the Platform.',
            '"Booking" means a confirmed reservation of a Property made through the Platform.',
            '"Stay Price" means the total nightly or per-stay amount charged to the Guest, exclusive of Platform fees and applicable taxes.',
            '"Force Majeure" has the meaning set out in the Terms of Service.',
            '"SHARFT" means sexual harassment, assault, rape, fraud or trafficking — and any other form of sexual exploitation, abuse or financial crime — which is strictly and absolutely prohibited on the Platform.',
          ],
        },
      ],
    },
    {
      id: "role",
      title: "3. Your Relationship With AfriBook",
      icon: Users,
      content: [
        {
          body: "You operate your Property as an independent business. AfriBook acts solely as an intermediary technology platform that connects Hosts with Guests. AfriBook is not a party to the stay, does not occupy, manage, or control your Property, and is not your employer, agent, joint venturer or partner.",
        },
        {
          body: "You are solely responsible for the operation of your Property, the accuracy of your listings, the safety and quality of the accommodation you provide, and the conduct of your staff and sub-contractors. You retain full control over pricing, availability, house rules and the provision of the accommodation itself.",
        },
      ],
    },
    {
      id: "responsibilities",
      title: "4. Host Responsibilities",
      icon: ClipboardCheck,
      content: [
        {
          body: "As a Host you agree to:",
          list: [
            "Provide accurate property information, including photos, amenities, and descriptions.",
            "Maintain your Property in good condition and ensure cleanliness between stays.",
            "Respond to guest inquiries within 24 hours.",
            "Honor confirmed bookings and provide all stated amenities.",
            "Comply with all local laws, regulations, and tax requirements applicable to your hosting activities.",
            "Maintain proper insurance coverage for the Property, including liability insurance.",
          ],
        },
      ],
    },
    {
      id: "listing",
      title: "5. Property Listings",
      icon: Home,
      content: [
        {
          body: "All property listings must:",
          list: [
            "Be for properties you own or have written authorization to rent.",
            "Include accurate photos and descriptions, without misleading images, overstated quality or inaccurate information.",
            "Specify all amenities, house rules, and restrictions.",
            "Disclose any safety hazards or property limitations.",
            "Set reasonable and competitive pricing.",
          ],
        },
        {
          heading: "5.1 Your Due Diligence",
          body: "You are responsible for conducting your own due diligence regarding the laws, regulations, licences, permits, zoning requirements, safety codes, insurance obligations and tax obligations that apply to your Property in your jurisdiction. This includes, without limitation, municipal registration, tourist levy, guest documentation, and fire and building safety compliance.",
        },
        {
          heading: "5.2 No Illegal Use",
          body: "You must not use the Platform, or permit your Property to be used, for any illegal, unethical, criminal or corrupt purpose. You must not permit any Guest to use the Property for unlawful activity. Any such use is a material breach and grounds for immediate termination.",
        },
      ],
    },
    {
      id: "guests",
      title: "6. Guest Management",
      icon: Users,
      content: [
        {
          body: "You are responsible for the safety and conduct of all persons at your Property, including Guests and their visitors. You must:",
          list: [
            "Verify the identity of Guests in accordance with local law and Platform policy.",
            "Maintain a safe, hygienic and properly functioning Property at all times.",
            "Refuse accommodation, and promptly report to AfriBook and relevant authorities, any Guest who engages in or attempts SHARFT, harassment, illegal activity or behaviour that endangers others.",
            "Ensure that no Guest is subjected to discrimination on any protected ground.",
          ],
        },
        {
          callout:
            "AfriBook has a zero-tolerance policy for SHARFT — including sexual harassment, assault, exploitation, fraud and trafficking. Any Host who engages in, facilitates, or fails to report such conduct will be immediately and permanently removed from the Platform and referred to law enforcement.",
        },
      ],
    },
    {
      id: "safety",
      title: "7. Guest Safety",
      icon: ShieldCheck,
      content: [
        {
          body: "You must take reasonable measures to ensure the safety of Guests at your Property, including:",
          list: [
            "Ensuring all safety equipment is functional, including smoke detectors and carbon monoxide detectors.",
            "Providing emergency contact information to every Guest.",
            "Disclosing any potential safety concerns or property limitations.",
            "Maintaining secure locks and entry systems.",
            "Ensuring your Property meets all applicable safety standards and building codes.",
          ],
        },
      ],
    },
    {
      id: "fees",
      title: "8. Service Fees - Industry Leading Low Rates",
      icon: CreditCard,
      content: [
        {
          body: "StayScape charges a competitive host service fee of only 10% on each booking. This means you keep more of what you earn. Fees are automatically deducted from payouts.",
        },
        {
          body: "Combined with our 4% guest fee, StayScape's total platform fee is 14% — less than half of Airbnb's 29% combined fees, making us the most cost-effective platform for both hosts and guests.",
        },
        {
          heading: "8.1 Payouts",
          body: "Payouts are processed within 3–5 business days after guest check-in. StayScape is not responsible for any payment delays caused by banking institutions. You are responsible for the accuracy of your payout details.",
        },
      ],
    },
    {
      id: "cancellation",
      title: "9. Cancellation Policy",
      icon: CalendarClock,
      content: [
        {
          body: "Hosts must honor confirmed bookings. Cancellations may result in penalties and reduced listing visibility. Where a stay cannot be fulfilled, both parties will cooperate to refund or rebook affected Guests in accordance with the applicable cancellation policy and the AfriBook Refund Policy.",
        },
        {
          body: "Excessive cancellations may also affect your Host rating, search placement, and eligibility for featured placement, and may, in serious cases, lead to suspension under Section 16.",
        },
      ],
    },
    {
      id: "conduct",
      title: "10. Prohibited Conduct & Activities",
      icon: Ban,
      content: [
        {
          body: "You must not, and must ensure your staff and agents do not:",
          list: [
            "Engage in, facilitate, solicit, or condone SHARFT or any form of sexual exploitation, harassment, assault or trafficking.",
            "Discriminate against Guests based on protected characteristics.",
            "Ask Guests to book outside the Platform, or otherwise conduct transactions off-Platform with Guests sourced through the Platform in order to avoid fees.",
            "Use misleading photos or descriptions.",
            "List properties you do not have the rights to rent.",
            "Offer or accept bribes, kickbacks, or other corrupt or unethical payments.",
            "Engage in hate speech, harassment, or any conduct that endangers others.",
            "Misrepresent your Property, pricing, availability or identity.",
            "Engage in money laundering, fraud, or any financial crime.",
            "Violate local rental laws or regulations.",
          ],
        },
        {
          callout:
            "Violations of this section may result in immediate termination of your Host account, forfeiture of outstanding payments, legal action, and referral to law enforcement. You may also be personally liable for your own unlawful conduct.",
        },
      ],
    },
    {
      id: "compliance",
      title: "11. Regulatory Compliance",
      icon: Landmark,
      content: [
        {
          body: "As a Host, you acknowledge and agree that:",
          list: [
            "You are solely responsible for understanding and complying with all federal, state, and local laws, regulations, ordinances, and codes applicable to your Property and hosting activities.",
            "This includes but is not limited to zoning laws, building codes, health and safety regulations, tax obligations, licensing requirements, and short-term rental regulations.",
            "You will obtain and maintain all necessary permits, licenses, and approvals required to legally operate your Property as a short-term rental.",
            "AfriBook makes no representations or warranties regarding the legality of hosting in your jurisdiction and provides no legal advice.",
            "You agree to indemnify and hold harmless AfriBook for any violations of applicable laws or regulations.",
          ],
        },
        {
          body: "You represent and warrant that: (a) you hold all licences, permits and authorisations required to offer your Property for short-term rental in your jurisdiction; (b) your Property complies with all applicable health, safety, fire, sanitation and building regulations; (c) you carry the insurance required by law and will maintain it in force; and (d) you will comply with all applicable tax obligations.",
        },
      ],
    },
    {
      id: "liability",
      title: "12. Liability, Hold Harmless & Indemnification",
      icon: Shield,
      content: [
        {
          heading: "12.1 No Joint or Several Liability",
          body: "AfriBook shall not be jointly or severally liable with you for any loss, injury, damage or claim arising out of your operation of the Property, your acts or omissions, the acts of your staff, or the conduct of any Guest. Any liability arising from a stay is yours alone, unless caused by the gross negligence or wilful misconduct of AfriBook.",
        },
        {
          heading: "12.2 Release and Hold Harmless",
          body: "By signing this Agreement you acknowledge and agree that you are solely responsible for any and all damages, injuries, losses, claims, liabilities, costs, and expenses arising from or related to your Property, your hosting activities, and the actions or omissions of your guests.",
        },
        {
          heading: "12.3 Indemnification",
          body: 'To the fullest extent permitted by law, you agree to indemnify, defend, and hold harmless AfriBook, its parent companies, subsidiaries, affiliates, officers, directors, employees, workers, agents, contractors, partners, marketers, advertisers, service providers, and all other representatives (collectively, the "StayScape Parties") from and against any and all claims, demands, losses, liabilities, damages, costs, and expenses (including reasonable attorneys\u2019 fees) arising from or related to:',
          list: [
            "Your Property, including any defects, hazards, or unsafe conditions.",
            "Your breach of this Agreement or violation of any laws or regulations.",
            "Any negligent, reckless, or intentional acts or omissions by you or anyone acting on your behalf.",
            "Any disputes, injuries, property damage, or other incidents involving your guests or third parties.",
            "Any errors, omissions, misrepresentations, or inaccuracies in your property listings or communications.",
            "Any legal oversights, regulatory violations, or compliance failures on your part.",
            "Any injury, accident, loss or damage occurring at the Property.",
            "Force majeure events that prevent or disrupt stays.",
          ],
        },
        {
          heading: "12.4 Exclusion of Consequential Damages",
          body: "AfriBook is not liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or your hosting activities. This hold harmless provision survives the termination of this Agreement and your use of the Platform.",
        },
        {
          heading: "12.5 Personal Liability",
          body: "You acknowledge that you may be personally and/or entity-liable for claims arising from your own actions, errors, omissions, or negligence, and that AfriBook is not your insurer or guarantor. You are encouraged to maintain appropriate public liability, property and business insurance.",
        },
        {
          heading: "12.6 Force Majeure",
          body: "Neither party shall be liable for failure or delay caused by a Force Majeure event. Where a stay cannot be fulfilled due to Force Majeure, both parties will cooperate to refund or rebook affected Guests in accordance with the Refund Policy.",
        },
      ],
    },
    {
      id: "risk",
      title: "13. Assumption of Responsibility and Risk",
      icon: ShieldAlert,
      content: [
        {
          body: "You expressly acknowledge and assume full responsibility for:",
          list: [
            "Your own safety and well-being while managing and maintaining your Property.",
            "The safety, security, and well-being of all guests, visitors, and third parties at your Property.",
            "The care, maintenance, and condition of your Property and all furnishings, fixtures, and amenities.",
            "Ensuring your Property meets all applicable safety standards and building codes.",
            "Providing a safe environment free from hazards, defects, or dangerous conditions.",
            "The safety and security of any partners, contractors, or service providers you engage.",
            "Any risks inherent in hosting short-term rentals, including property damage, theft, personal injury, or other losses.",
            "Maintaining adequate insurance coverage, including liability insurance and property insurance.",
            "All business operations, financial obligations, and tax liabilities related to your hosting activities.",
          ],
        },
        {
          body: "You acknowledge that hosting involves inherent risks and you voluntarily assume all such risks. AfriBook does not guarantee the safety or security of hosts, guests, or properties and is not responsible for any incidents, injuries, or losses that may occur.",
        },
      ],
    },
    {
      id: "warranties",
      title: "14. Disclaimer of Warranties",
      icon: AlertTriangle,
      content: [
        {
          body: 'AfriBook provides the Platform on an "as is" and "as available" basis without warranties of any kind, either express or implied. AfriBook specifically disclaims all warranties regarding the Platform\u2019s operation, your ability to generate income, guest behavior, or the legal compliance of hosting activities in your jurisdiction.',
        },
      ],
    },
    {
      id: "ip",
      title: "15. Intellectual Property",
      icon: Copyright,
      content: [
        {
          body: "By uploading photos and content, you retain ownership of your content and grant AfriBook a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, adapt, publish, translate, and display this content for the purpose of operating, promoting and improving the Platform, including for marketing and promotional purposes.",
        },
        {
          body: "You may not use AfriBook\u2019s trademarks, logos, brand name, or other intellectual property without express written permission.",
        },
      ],
    },
    {
      id: "termination",
      title: "16. Account Suspension & Termination",
      icon: AlertTriangle,
      content: [
        {
          body: "AfriBook reserves the right to suspend or terminate host accounts for violations of these terms, guest complaints, fraudulent activity, or conduct that endangers Guests. AfriBook may suspend or terminate this Agreement and your access to the Platform:",
          list: [
            "Immediately, without notice, if you violate Section 10 (Prohibited Conduct & Activities), including any involvement in SHARFT, fraud, illegal activity or conduct that endangers Guests.",
            "On notice, for repeated or material breaches of this Agreement that you fail to remedy within 7 days.",
            "On notice, if required by law, regulation, or an order of a competent authority.",
          ],
        },
        {
          body: "Upon termination, all outstanding bookings will be handled in accordance with the Refund Policy, and any unpaid fees owed to AfriBook shall become immediately due.",
        },
      ],
    },
    {
      id: "insurance",
      title: "17. Insurance",
      icon: ShieldCheck,
      content: [
        {
          body: "You must maintain, at your own cost, all insurance required by law, including liability insurance and property insurance, and are strongly encouraged to maintain public liability, property, and business interruption cover appropriate to your Property. On request, you must provide evidence of your insurance to AfriBook.",
        },
      ],
    },
    {
      id: "modifications",
      title: "18. Modifications",
      icon: RefreshCw,
      content: [
        {
          body: "AfriBook may update these terms at any time. We will provide at least 30 days\u2019 notice before any material changes take effect, communicated via email and/or notification on the Platform. Continued hosting after changes take effect constitutes acceptance of the new terms.",
        },
        {
          body: "If you do not agree to the modified terms, you may close your Host account before the changes take effect without incurring any penalties.",
        },
      ],
    },
    {
      id: "law",
      title: "19. Governing Law & Disputes",
      icon: Scale,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service, with the seat of arbitration in Lagos, Nigeria.",
        },
      ],
    },
  ],
};

export const DRIVER_AGREEMENT: AgreementDoc = {
  slug: "driver-agreement",
  title: "Driver Agreement",
  subtitle:
    "For ride-hailing and delivery drivers on the AfriBook Rides & Delivery network",
  effectiveDate: "August 1, 2026",
  lastUpdated: "August 4, 2026",
  tocLabel: "Driver Agreement",
  intro: [
    'This Driver Agreement ("Agreement") is a legally binding contract between you ("Driver," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your provision of ride-hailing and delivery services through the AfriBook Rides & Delivery platform ("Platform").',
    "By registering as a Driver, accepting the Driver terms during onboarding, or accepting any ride or delivery request, you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy.",
    "You provide services as an independent contractor, not as an employee of AfriBook. This Agreement does not create an employment relationship.",
  ],
  sections: [
    {
      id: "independent",
      title: "1. Independent Contractor",
      icon: Users,
      content: [
        {
          body: "You provide services as an independent contractor. AfriBook does not control, supervise, or direct the manner in which you perform your services, including route selection, driving style, or scheduling. You may work for other platforms, companies or clients and set your own hours subject to Platform availability requirements.",
        },
        {
          body: "You are responsible for your own vehicle, fuel, maintenance, insurance, licences, permits, and all costs and expenses associated with providing your services. You are not entitled to employee benefits.",
        },
      ],
    },
    {
      id: "requirements",
      title: "2. Driver Requirements & Due Diligence",
      icon: UserCheck,
      content: [
        {
          body: "You represent and warrant that:",
          list: [
            "You hold a valid, current driving licence for the class of vehicle you operate, valid in your jurisdiction.",
            "Your vehicle is roadworthy, registered, and complies with all local vehicle and safety regulations.",
            "You hold all licences, permits, and registrations required to provide ride-hailing or delivery services, including any commercial or public transport authorisations required by local law.",
            "You carry valid third-party liability and, where required, commercial insurance.",
            "You have passed the background screening and safety verification required by AfriBook and local regulators.",
            "You are at least the minimum legal age to provide such services in your jurisdiction.",
          ],
        },
        {
          heading: "2.1 Your Due Diligence",
          body: "You are responsible for conducting your own due diligence on the legal, licensing, insurance and tax obligations that apply to your services in your jurisdiction. You must keep your documents valid and up to date and promptly upload any renewals to the Platform.",
        },
        {
          callout:
            "Providing services without required licences, insurance or a valid licence is a material breach of this Agreement and may result in immediate termination and referral to authorities.",
        },
      ],
    },
    {
      id: "service",
      title: "3. Provision of Services",
      icon: Car,
      content: [
        {
          body: "When you accept a ride or delivery request, you agree to:",
          list: [
            "Complete the trip or delivery in a safe, careful, lawful and professional manner.",
            "Follow the route suggested by the Platform unless a lawful, safe alternative is appropriate.",
            "Not charge riders or customers more than the amount agreed through the Platform, and not solicit cash or off-Platform payments.",
            "Not operate while impaired by alcohol, drugs, medication, or fatigue.",
            "Keep your vehicle clean, safe and in good working order.",
            "Treat riders, customers, merchants and the public with courtesy and respect.",
          ],
        },
      ],
    },
    {
      id: "prohibited",
      title: "4. Prohibited Conduct",
      icon: Ban,
      content: [
        {
          body: "You must not:",
          list: [
            "Engage in, solicit, facilitate, or condone SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — or any form of sexual misconduct with any rider or customer.",
            "Harass, threaten, discriminate against, or endanger any rider, customer, merchant or member of the public.",
            "Engage in reckless, dangerous or unlawful driving.",
            "Use the Platform to commit any fraud, theft, or financial crime, including phantom trips, fare manipulation, or collusion with riders.",
            "Carry illegal goods, weapons, contraband or any item prohibited by law.",
            "Conduct off-Platform trips with riders sourced through the Platform to avoid fees.",
            "Misrepresent your identity, vehicle, or insurance status.",
            "Solicit or accept bribes or engage in corrupt practices.",
          ],
        },
        {
          callout:
            "AfriBook has a zero-tolerance policy for SHARFT and any criminal conduct. Any Driver found to have engaged in such conduct will be permanently removed from the Platform, reported to law enforcement, and may be personally liable.",
        },
      ],
    },
    {
      id: "earnings",
      title: "5. Earnings, Fees & Payouts",
      icon: CreditCard,
      content: [
        {
          body: "Your earnings are calculated in accordance with the fare structure published in your driver dashboard, net of AfriBook fees and any applicable taxes or third-party charges. Payouts are made to your nominated bank or mobile money account on the published schedule.",
        },
        {
          body: "You are responsible for declaring and paying all taxes on your earnings, including income tax and any value-added or sales tax, in accordance with the law of your jurisdiction.",
        },
        {
          heading: "5.1 Fee Transparency",
          body: "AfriBook's platform fee is disclosed on every trip receipt and itemised in your Earnings statement into three parts: a government/regulatory pass-through, a commercial insurance and operational-cost pass-through, and AfriBook's own margin. AfriBook's own margin is capped well under the 25-30% commission common on comparable platforms, and Road Rewards tiers rebate a further share of it back to you — see the Fee & Commission Policy for the current schedule.",
        },
      ],
    },
    {
      id: "wait-time-cancellation",
      title: "6. Wait-Time Pay & Cancellation Fees",
      icon: AlertTriangle,
      content: [
        {
          heading: "6.1 Wait-Time Pay",
          body: "The first 5 minutes you wait at a pickup point after marking \"arrived\" are free to the rider. Every minute after that, until the rider boards or the trip is cancelled, is paid to you at your normal per-minute driving rate for that trip, credited automatically to your earnings.",
        },
        {
          heading: "6.2 Rider Cancellation Fee",
          body: "A rider may cancel free of charge before you have been assigned, or within the first 5 minutes after accepting and starting toward the pickup. Once you have been driving toward pickup for 5 minutes or more, or you have already arrived, a cancellation fee applies and is paid to you — a percentage of the estimated fare, higher if you had already arrived. This is designed to fairly compensate the time and distance you've already committed to the trip.",
        },
        {
          heading: "6.3 Driver Cancellations",
          body: "You may decline or cancel a request at any time before pickup without penalty, but a pattern of late cancellations after acceptance will affect your Road Rewards tier and acceptance-rate standing.",
        },
      ],
    },
    {
      id: "rewards-insurance",
      title: "7. Road Rewards & Insurance Add-Ons",
      icon: ShieldCheck,
      content: [
        {
          heading: "7.1 Road Rewards",
          body: "AfriBook's Road Rewards program scores your acceptance rate, cancellation rate, on-time pickup rate and rating over a trailing 30-day window and places you into a tier (Blue, Silver, Gold or Platinum). Higher tiers rebate a larger share of AfriBook's own platform margin back to you, unlock fee-free instant payouts, and discount optional insurance add-ons. Full current thresholds and benefits are published in your driver dashboard and may be adjusted from time to time with notice.",
        },
        {
          heading: "7.2 Base Coverage",
          body: "AfriBook provides free basic third-party liability and on-trip medical payments coverage (\"RideShield Basic\") for every trip, funded from the operational-expense portion of the platform fee disclosed under clause 5.1. This is not a substitute for your own required insurance under clause 2.",
        },
        {
          heading: "7.3 Optional Add-On Coverage",
          body: "You may opt into additional commercial coverage tiers (\"RideShield Plus\" / \"RideShield Total\") for a weekly premium calculated as a percentage of your own recent earnings, deducted automatically. You may cancel an add-on at any time; coverage ends at the close of the current billing week.",
        },
      ],
    },
    {
      id: "referral-program",
      title: "8. Referral Program",
      icon: Users,
      content: [
        {
          body: "You may share your personal referral code with prospective drivers, riders, and business partners. Referral bonuses are paid only once the referred person completes the qualifying milestone published for that referral type (for driver referrals, currently 20 completed trips within 30 days of activation), and are capped per referrer per month as published in the Referral Program terms in your dashboard.",
        },
        {
          callout:
            "Referral bonuses may be withheld or reversed if AfriBook determines, acting reasonably, that a referral was fraudulent, self-referred through a second account, or otherwise created to abuse the program.",
        },
      ],
    },
    {
      id: "liability",
      title: "9. Liability, Waiver & Hold Harmless",
      icon: Shield,
      content: [
        {
          heading: "6.1 Your Responsibility",
          body: "You are solely responsible for the safe operation of your vehicle and for the safety of your passengers and other road users. You acknowledge that you may be personally liable for injuries, damage or loss arising from your own actions, errors, omissions or negligence.",
        },
        {
          heading: "6.2 No Joint or Several Liability",
          body: "AfriBook shall not be jointly or severally liable with you for any accident, injury, damage or loss arising out of the provision of your services, except where caused by the gross negligence or wilful misconduct of AfriBook.",
        },
        {
          heading: "6.3 Release and Hold Harmless",
          body: "To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates, officers, directors, employees and agents from all claims, damages, losses and expenses (including reasonable legal fees) arising out of: (a) your provision of services; (b) any accident, injury or loss caused by your driving; (c) your non-compliance with local law or insurance requirements; (d) the conduct of riders or third parties; and (e) force majeure events.",
        },
        {
          heading: "6.4 Assumption of Risk",
          body: "You voluntarily assume the risks inherent in providing ride-hailing and delivery services, including the risk of traffic accidents, road hazards, adverse weather, and interactions with the public, to the fullest extent permitted by law.",
        },
      ],
    },
    {
      id: "termination",
      title: "10. Suspension & Immediate Termination",
      icon: AlertTriangle,
      content: [
        {
          body: "AfriBook may suspend or terminate this Agreement immediately, without notice, if you:",
          list: [
            "Engage in SHARFT, fraud, theft, or any criminal or unlawful activity through the Platform.",
            "Endanger riders, the public, or other road users through reckless or impaired driving.",
            "Operate without required licences, permits or insurance.",
            "Repeatedly breach Platform safety or quality standards.",
          ],
        },
        {
          body: "Otherwise, either party may terminate this Agreement on reasonable notice. Upon termination, any amounts due shall be settled in accordance with the payout schedule.",
        },
      ],
    },
    {
      id: "law",
      title: "11. Governing Law & Disputes",
      icon: Landmark,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.",
        },
      ],
    },
  ],
};

export const RIDER_AGREEMENT: AgreementDoc = {
  slug: "rider-agreement",
  title: "Rider Agreement",
  subtitle: "For riders and customers using AfriBook Rides & Delivery",
  effectiveDate: "August 1, 2026",
  lastUpdated: "August 4, 2026",
  tocLabel: "Rider Agreement",
  intro: [
    'This Rider Agreement ("Agreement") is a legally binding contract between you ("Rider," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your use of the AfriBook ride-hailing and delivery services ("Services").',
    "By requesting, booking or accepting a ride or delivery, you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy.",
    "Rides and deliveries are provided by independent drivers, not by AfriBook. This Agreement explains the limits of AfriBook\u2019s responsibility.",
  ],
  sections: [
    {
      id: "role",
      title: "1. The Platform\u2019s Role",
      icon: Globe,
      content: [
        {
          body: "AfriBook is an intermediary technology platform that connects you with independent drivers. AfriBook is not a transportation provider, does not own or operate any vehicles, and is not a party to the transportation services you receive. Your ride or delivery is performed by an independent driver who is not an employee, agent or joint venturer of AfriBook.",
        },
      ],
    },
    {
      id: "conduct",
      title: "2. Your Obligations & Conduct",
      icon: Users,
      content: [
        {
          body: "When using the Services, you agree to:",
          list: [
            "Provide accurate pickup and drop-off locations.",
            "Be ready and present at the pickup location at the agreed time.",
            "Treat drivers with courtesy and respect, and not engage in harassment, discrimination or abusive behaviour.",
            "Not use the Services for any illegal, unethical or criminal purpose, and not transport illegal goods.",
            "Not engage in SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — or any conduct that endangers or sexually exploits any driver or other person.",
            "Not solicit drivers for off-Platform services.",
            "Comply with all applicable laws and local safety requirements, including seat-belt and child-seat requirements.",
          ],
        },
        {
          callout:
            "AfriBook has a zero-tolerance policy for SHARFT and criminal conduct. Anyone found to have engaged in such conduct will be permanently removed from the Platform and reported to law enforcement.",
        },
      ],
    },
    {
      id: "responsibility",
      title: "3. Personal Responsibility & Due Diligence",
      icon: Shield,
      content: [
        {
          body: "You are responsible for exercising your own judgement and due diligence when using the Services, including assessing your safety before and during a ride. You acknowledge that you use the Services at your own risk to the fullest extent permitted by law.",
        },
        {
          body: "You agree to take reasonable precautions for your own safety, including verifying the driver, vehicle make and registration number against the details shown in the app before boarding, and reporting any mismatch to AfriBook.",
        },
      ],
    },
    {
      id: "cancellation-fees",
      title: "4. Cancellation Fees & Wait Time",
      icon: CalendarClock,
      content: [
        {
          body: "You may cancel a ride free of charge at any time before a driver is assigned, or within 5 minutes of a driver accepting and starting toward the pickup point.",
        },
        {
          body: "If you cancel after a driver has been driving toward your pickup for 5 minutes or more, or after the driver has already arrived, a cancellation fee applies. The fee is a percentage of the estimated fare (higher if the driver had already arrived) and is paid to the driver to compensate the time and distance already committed to your trip.",
        },
        {
          body: "If a driver has arrived and is waiting for you, the first 5 minutes are free. After that, wait-time charges may apply for each additional minute until you board or the trip is cancelled, calculated at the driver's normal per-minute rate for the trip.",
        },
      ],
    },
    {
      id: "referral-promotions",
      title: "5. Referrals & Promotions",
      icon: Gift,
      content: [
        {
          body: "AfriBook may offer referral codes, promotional credits, and other incentives from time to time. Referral bonuses are issued as ride or order credit once the referred person completes their first qualifying trip or order, and are subject to per-account limits published in the app to prevent abuse.",
        },
        {
          callout:
            "AfriBook may withhold, reverse, or reclaim promotional credit obtained through fraud, self-referral, or abuse of the referral system.",
        },
      ],
    },
    {
      id: "liability",
      title: "6. Limitation of Liability & Waiver",
      icon: AlertTriangle,
      content: [
        {
          heading: "4.1 No Joint or Several Liability",
          body: "AfriBook shall not be jointly or severally liable with any driver for accidents, injuries, damage or loss arising out of or in connection with a ride or delivery, except where caused by the gross negligence or wilful misconduct of AfriBook.",
        },
        {
          heading: "4.2 Release and Hold Harmless",
          body: "To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates, officers, directors, employees and agents from all claims, damages, losses and expenses arising out of: (a) your use of the Services; (b) any accident, injury or loss during a ride or delivery; (c) the conduct of drivers or third parties; (d) your non-compliance with applicable law; and (e) force majeure events.",
        },
        {
          heading: "4.3 Driver Responsibility",
          body: "Your legal relationship in respect of the transportation itself is directly with the driver. Any claim concerning driving conduct, vehicle condition or road safety should be pursued against the driver, subject to AfriBook\u2019s dispute resolution process.",
        },
        {
          heading: "4.4 Assumption of Risk",
          body: "You voluntarily assume the inherent risks of road travel, including the risk of accidents, traffic hazards and adverse weather, to the fullest extent permitted by law.",
        },
      ],
    },
    {
      id: "termination",
      title: "7. Suspension & Termination",
      icon: AlertTriangle,
      content: [
        {
          body: "AfriBook may suspend or terminate your account immediately, without notice, if you engage in SHARFT, fraud, harassment, illegal activity or any conduct that endangers drivers or others. Any amounts owed shall be settled in accordance with the Refund Policy.",
        },
      ],
    },
    {
      id: "law",
      title: "8. Governing Law & Disputes",
      icon: Landmark,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.",
        },
      ],
    },
  ],
};

export const GUEST_AGREEMENT: AgreementDoc = {
  slug: "guest-agreement",
  title: "Guest / Renter Agreement",
  subtitle:
    "For guests and renters booking accommodation through AfriBook Stayscape",
  effectiveDate: "August 1, 2026",
  lastUpdated: "August 4, 2026",
  tocLabel: "Guest & Renter Agreement",
  intro: [
    'This Guest / Renter Agreement ("Agreement") is a legally binding contract between you ("Guest," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your booking and stay at accommodation (hotels, guesthouses, serviced apartments, villas and short-term rentals) through the AfriBook Stayscape platform ("Platform").',
    "By making a booking, you agree to be bound by this Agreement, the AfriBook Terms of Service, the applicable cancellation policy, and the AfriBook Privacy Policy.",
    "Accommodation is provided by independent Hosts, not by AfriBook. This Agreement explains the limits of AfriBook\u2019s responsibility.",
  ],
  sections: [
    {
      id: "role",
      title: "1. The Platform\u2019s Role",
      icon: Globe,
      content: [
        {
          body: "AfriBook is an intermediary platform that connects Guests with independent Hosts. AfriBook does not own, operate, manage or control any accommodation listed on the Platform, and is not a party to the stay. Your accommodation is provided by an independent Host who is solely responsible for the Property and the stay.",
        },
      ],
    },
    {
      id: "booking",
      title: "2. Bookings & Payment",
      icon: CreditCard,
      content: [
        {
          body: "By completing a booking you authorise AfriBook to process payment through the payment method you provide. Prices, taxes, and fees are shown at the time of booking. Cancellations and refunds are governed by the cancellation policy applicable to your booking and the AfriBook Refund Policy.",
        },
      ],
    },
    {
      id: "conduct",
      title: "3. Your Obligations During the Stay",
      icon: Users,
      content: [
        {
          body: "During your stay you agree to:",
          list: [
            "Comply with the Host\u2019s published house rules, check-in/check-out times and occupancy limits.",
            "Use the Property and its contents with reasonable care, and report any damage promptly.",
            "Not sublet the Property, host events without permission, or exceed the maximum occupancy.",
            "Not use the Property for any illegal, unethical, criminal or corrupt purpose.",
            "Not engage in SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — or any conduct that sexually exploits, harasses or endangers the Host, staff or other guests.",
            "Not smoke where prohibited, and not engage in any activity that creates a nuisance or safety hazard.",
            "Notify the Host immediately of any safety or security issue.",
          ],
        },
        {
          callout:
            "AfriBook has a zero-tolerance policy for SHARFT and criminal conduct. Guests found to have engaged in such conduct will be immediately removed, permanently banned from the Platform, and reported to law enforcement.",
        },
      ],
    },
    {
      id: "liability",
      title: "4. Liability, Waiver & Hold Harmless",
      icon: Shield,
      content: [
        {
          heading: "4.1 No Joint or Several Liability",
          body: "AfriBook shall not be jointly or severally liable with any Host for accidents, injuries, damage or loss occurring at or in connection with any Property, except where caused by the gross negligence or wilful misconduct of AfriBook.",
        },
        {
          heading: "4.2 Release and Hold Harmless",
          body: "To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates, officers, directors, employees and agents from all claims, damages, losses and expenses arising out of: (a) your stay; (b) any injury, accident, damage or loss at the Property; (c) the conduct of the Host, staff or other guests; (d) your failure to comply with house rules or local law; and (e) force majeure events.",
        },
        {
          heading: "4.3 Host Responsibility",
          body: "Your legal relationship in respect of the accommodation itself is directly with the Host. Any claim concerning the condition, safety or quality of the Property should be pursued against the Host, subject to AfriBook\u2019s dispute resolution process.",
        },
        {
          heading: "4.4 Your Personal Responsibility",
          body: "You are responsible for your own conduct, the safety of your personal belongings, and compliance with the Property\u2019s rules and local law. You acknowledge that you may be personally liable for damage you cause to the Property.",
        },
      ],
    },
    {
      id: "termination",
      title: "5. Suspension & Termination",
      icon: AlertTriangle,
      content: [
        {
          body: "AfriBook may suspend or terminate your account immediately, without notice, if you engage in SHARFT, fraud, harassment, illegal activity, or any conduct that endangers the Host, staff or other guests. Any amounts owed shall be settled in accordance with the Refund Policy.",
        },
      ],
    },
    {
      id: "law",
      title: "6. Governing Law & Disputes",
      icon: Landmark,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.",
        },
      ],
    },
  ],
};

export const SERVICE_PROVIDER_AGREEMENT: AgreementDoc = {
  slug: "service-provider-agreement",
  title: "Service Provider Agreement",
  subtitle:
    "For restaurants, gig-service providers, and other AfriBook Marketplace sellers of services",
  effectiveDate: "September 25, 2026",
  lastUpdated: "September 25, 2026",
  tocLabel: "Service Provider Agreement",
  intro: [
    'This Service Provider Agreement ("Agreement") is a legally binding contract between you ("Provider," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your listing and provision of services — restaurant menus, food preparation, and independent gig services such as cleaning, repairs, events staffing, tutoring and similar — through the AfriBook Marketplace.',
    "Property and vehicle listings are governed by the Host Agreement, not this Agreement. Ride and delivery driving is governed by the Driver Agreement.",
    "By listing on the Platform you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy. You operate as an independent business, not as an employee, agent or joint venturer of AfriBook.",
  ],
  sections: [
    {
      id: "role",
      title: "1. Your Relationship With AfriBook",
      icon: Users,
      content: [
        {
          body: "AfriBook is an intermediary technology platform that connects you with customers. You retain full control over your menu or service offering, pricing, hours of operation, and the manner in which you provide your goods or services. AfriBook does not employ your staff and is not responsible for the quality, safety or legality of what you provide, beyond the limited Platform standards set out below.",
        },
      ],
    },
    {
      id: "responsibilities",
      title: "2. Your Responsibilities",
      icon: ClipboardCheck,
      content: [
        {
          body: "You agree to:",
          list: [
            "Provide accurate listings, pricing, descriptions and availability.",
            "Hold all licences, permits, food-safety or trade certifications required in your jurisdiction.",
            "Fulfil accepted orders and bookings promptly and as described.",
            "Maintain appropriate liability insurance for your business.",
            "Comply with all applicable consumer-protection, health, safety and tax law.",
            "Treat customers and delivery couriers with courtesy and respect.",
          ],
        },
      ],
    },
    {
      id: "fees",
      title: "3. Fees & Payouts",
      icon: CreditCard,
      content: [
        {
          body: "AfriBook charges a commission on each completed order or booking, disclosed to you before you accept the Platform's terms and shown on every settlement statement. Current standard rates and any active launch-incentive rate for new Providers are published in the Fee & Commission Policy and your vendor dashboard, and are, category for category, kept below typical marketplace and delivery-platform norms.",
        },
        {
          body: "Payouts are made on the schedule shown in your vendor dashboard, net of AfriBook's commission, applicable taxes, and any refunds or chargebacks properly attributable to your order.",
        },
      ],
    },
    {
      id: "referral",
      title: "4. Referral Program",
      icon: Gift,
      content: [
        {
          body: "You may share your Provider referral code with other prospective restaurants and service providers. Referral bonuses are credited against your own platform fees once the referred Provider completes its first settled payout cycle, and are capped per referrer per month as published in the Referral Program terms in your dashboard.",
        },
      ],
    },
    {
      id: "prohibited",
      title: "5. Prohibited Conduct",
      icon: Ban,
      content: [
        {
          body: "You must not misrepresent your offering, solicit customers off-Platform to avoid fees, discriminate against customers or couriers, or engage in any fraudulent, unsafe or unlawful conduct through the Platform.",
        },
      ],
    },
    {
      id: "termination",
      title: "6. Suspension & Termination",
      icon: AlertTriangle,
      content: [
        {
          body: "AfriBook may suspend or remove your listing for repeated order-quality failures, food-safety violations, fraud, or breach of this Agreement. Either party may otherwise terminate this Agreement on reasonable notice.",
        },
      ],
    },
    {
      id: "law",
      title: "7. Governing Law & Disputes",
      icon: Landmark,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.",
        },
      ],
    },
  ],
};

export const FEE_COMMISSION_POLICY: AgreementDoc = {
  slug: "fee-commission-policy",
  title: "Fee & Commission Policy",
  subtitle: "How AfriBook's platform fees compare, and where every cedi/naira/shilling goes",
  effectiveDate: "September 25, 2026",
  lastUpdated: "September 25, 2026",
  tocLabel: "Fee & Commission Policy",
  intro: [
    "AfriBook is built around one commitment: keep more of every transaction with the people doing the work — drivers, couriers, restaurants, hosts and independent service providers — than comparable platforms do.",
    "This policy explains AfriBook's standard commission and fee rates, how they compare to common industry rates, and exactly what each fee funds. Rates vary by market and may be updated from time to time; the current rate for your account is always shown in your dashboard before you accept any change.",
  ],
  sections: [
    {
      id: "rides",
      title: "1. Ride-Hailing & Delivery Drivers",
      icon: Car,
      content: [
        {
          body: "AfriBook's standard platform fee on rides and deliveries is 12-18% of the fare, compared to a commonly cited 25-30% on comparable ride-hailing platforms. Road Rewards tiers (see the Driver Agreement) rebate a further share of AfriBook's own margin back to qualifying drivers, so a driver's effective take-rate can fall well below the headline figure.",
        },
        {
          body: "The fee is itemised on every Earnings statement into: a government/regulatory pass-through, a commercial-insurance and operational-cost pass-through, and AfriBook's own margin — see the Full Breakdown section of your Earnings dashboard for the actual split on your trips.",
        },
      ],
    },
    {
      id: "restaurants",
      title: "2. Restaurants & Food Delivery",
      icon: CreditCard,
      content: [
        {
          body: "Standard commission is 15-18% of the order subtotal, with a reduced 10% launch rate for new restaurant Providers during their first 90 days — see Open Kitchen Boost in the Partners program. This compares to commission rates that commonly run 15-30% on other delivery marketplaces.",
        },
      ],
    },
    {
      id: "stays",
      title: "3. Short-Stay Hosts (StayScape)",
      icon: Home,
      content: [
        {
          body: "AfriBook charges a single host-side commission of 8-12% of the booking subtotal, with no additional stacked guest-service-fee layer of the kind that can push a comparable platform's combined host-and-guest fee load to roughly 14-20% of a booking.",
        },
      ],
    },
    {
      id: "rentals",
      title: "4. Vehicle Rental Hosts",
      icon: Car,
      content: [
        {
          body: "Standard host commission is 10-15% of the booking subtotal, with a reduced rate for a host's first 100 completed bookings under the Partner Launch Program — compared to commission rates that commonly run 15-25% on comparable peer-to-peer vehicle marketplaces.",
        },
      ],
    },
    {
      id: "marketplace",
      title: "5. Marketplace & Gig Services",
      icon: Percent,
      content: [
        {
          body: "Standard marketplace fee is 10-15% of the order or job value, with a reduced 10% launch rate for a provider's first 90 days — compared to fees that commonly run 20% or more on comparable gig-service marketplaces.",
        },
      ],
    },
    {
      id: "changes",
      title: "6. Changes To This Policy",
      icon: RefreshCw,
      content: [
        {
          body: "AfriBook may update these rates from time to time to reflect market conditions. Material fee increases affecting your account are disclosed in-app with reasonable advance notice before they take effect on new transactions.",
        },
      ],
    },
  ],
};

export const VEHICLE_HOST_AGREEMENT: AgreementDoc = {
  slug: "vehicle-host-agreement",
  title: "Vehicle Host Agreement",
  subtitle: "For hosts and rental companies listing vehicles on the AfriBook Vehicle Rental marketplace",
  effectiveDate: "September 25, 2026",
  lastUpdated: "September 25, 2026",
  tocLabel: "Vehicle Host Agreement",
  intro: [
    'This Vehicle Host Agreement ("Agreement") is a legally binding contract between you ("Vehicle Host," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your listing and rental of vehicles — individually or as a rental company fleet — through the AfriBook Vehicle Rental marketplace.',
    "This Agreement covers vehicle listings specifically. Property listings are governed by the Host Agreement (StayScape); ride-hailing and delivery driving is governed by the Driver Agreement.",
    "By listing a vehicle you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy. You operate your rental business independently — AfriBook is an intermediary technology platform, not the owner, insurer or operator of your vehicle.",
  ],
  sections: [
    {
      id: "role",
      title: "1. Your Relationship With AfriBook",
      icon: Users,
      content: [
        {
          body: "You retain full control over which vehicles you list, your pricing, availability calendar, and any house rules (mileage limits, fuel policy, permitted use). AfriBook does not own, inspect, or maintain your vehicle and is not a party to the rental itself.",
        },
      ],
    },
    {
      id: "vehicle-standards",
      title: "2. Vehicle & Listing Standards",
      icon: Car,
      content: [
        {
          body: "Every vehicle you list must:",
          list: [
            "Be legally owned by you or a business you are authorised to represent, and be registered and roadworthy under local law.",
            "Carry valid, current insurance meeting or exceeding the minimum required by your jurisdiction for rental use.",
            "Be accurately described — make, model, year, mileage limits, fuel type, features and condition — with recent photos.",
            "Be delivered to the Renter clean, in safe mechanical condition, and with a full tank (or the fuel level stated in your listing) at handoff.",
            "Pass any periodic safety/condition check AfriBook may require to keep the listing active.",
          ],
        },
      ],
    },
    {
      id: "deposit-fees",
      title: "3. Security Deposits, Fees & Payouts",
      icon: CreditCard,
      content: [
        {
          body: "You may require a refundable security deposit, authorised on the Renter's payment card at pickup through the Platform's supported payment methods. The deposit amount is set by you within any published market cap, shown to the Renter before booking, and must be released within 5 business days of the vehicle's return where no damage, missing fuel, unpaid tolls/fines, or contract breach is identified.",
        },
        {
          body: "AfriBook charges a host commission disclosed in your dashboard and the Fee & Commission Policy — kept below typical peer-to-peer vehicle-marketplace norms. Payouts of the rental price (net of commission and any deposit deduction you are entitled to) are made on the schedule shown in your dashboard.",
        },
        {
          body: "Any deposit deduction beyond the standard cleaning/refuelling schedule (for damage, loss, or contract breach) must be itemised and evidenced (photos, repair estimate) and is subject to AfriBook's dispute process if the Renter contests it.",
        },
      ],
    },
    {
      id: "handoff",
      title: "4. Pickup, Handoff & Availability",
      icon: CalendarClock,
      content: [
        {
          body: "You must honour confirmed bookings and be reasonably reachable in the app at the agreed handoff window. If you are unable to fulfil a confirmed booking (the vehicle is unavailable, damaged, or you are unreachable), the Renter is entitled to a full refund and, at AfriBook's discretion, a rebooking credit; repeated failures to fulfil bookings may result in listing suspension.",
        },
        {
          body: "If you offer vehicle delivery to the Renter's location, this must be disclosed and priced in your listing before booking.",
        },
      ],
    },
    {
      id: "referral",
      title: "5. Referral Program",
      icon: Gift,
      content: [
        {
          body: "You may share your Host referral code with other prospective vehicle hosts and rental companies. Referral bonuses are credited against your own platform fees once the referred host completes their first settled payout cycle, capped per referrer per month as published in the Referral Program terms in your dashboard.",
        },
      ],
    },
    {
      id: "liability",
      title: "6. Liability & Hold Harmless",
      icon: Shield,
      content: [
        {
          body: "AfriBook shall not be jointly or severally liable with you for any accident, injury, damage or loss arising from a rental of your vehicle, except where caused by AfriBook's gross negligence or wilful misconduct. To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates from all claims, damages, losses and expenses arising out of your vehicle, your listing, or the conduct of your Renters.",
        },
      ],
    },
    {
      id: "termination",
      title: "7. Suspension & Termination",
      icon: AlertTriangle,
      content: [
        {
          body: "AfriBook may suspend or remove a listing for safety violations, fraud, repeated unfulfilled bookings, or breach of this Agreement. Either party may otherwise terminate this Agreement on reasonable notice, subject to honouring any already-confirmed bookings.",
        },
      ],
    },
    {
      id: "law",
      title: "8. Governing Law & Disputes",
      icon: Landmark,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.",
        },
      ],
    },
  ],
};

export const VEHICLE_RENTER_AGREEMENT: AgreementDoc = {
  slug: "vehicle-renter-agreement",
  title: "Vehicle Renter Agreement",
  subtitle: "For renters booking a vehicle through the AfriBook Vehicle Rental marketplace",
  effectiveDate: "September 25, 2026",
  lastUpdated: "September 25, 2026",
  tocLabel: "Vehicle Renter Agreement",
  intro: [
    'This Vehicle Renter Agreement ("Agreement") is a legally binding contract between you ("Renter," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your booking and use of a vehicle listed by an independent Vehicle Host through the AfriBook Vehicle Rental marketplace.',
    "AfriBook is an intermediary technology platform that connects you with independent Vehicle Hosts. AfriBook does not own, inspect or operate the vehicle you book, and is not a party to the rental contract between you and the Host.",
  ],
  sections: [
    {
      id: "booking",
      title: "1. Booking, Documents & Payment",
      icon: FileCheck,
      content: [
        {
          body: "To collect a booked vehicle you will generally need: a valid driver's licence in your name meeting the Host's stated requirements, the payment method used for your booking, and a valid photo ID. Some Hosts may require the licence and deposit card to belong to the same person as the booking.",
        },
        {
          body: "Accepted deposit and payment methods are set by each Host and shown on the listing before you book — some Hosts only accept a credit card (not a debit card) for the security deposit. Review the listing's terms before booking to confirm the payment method you'll need.",
        },
        {
          body: "Payment methods and currencies available for a booking vary by country — the options available to you are always shown during checkout.",
        },
      ],
    },
    {
      id: "deposit",
      title: "2. Security Deposit",
      icon: CreditCard,
      content: [
        {
          body: "Most vehicle bookings require a refundable security deposit, set by the Host and disclosed before you confirm your booking. The deposit is authorised at pickup and is released after the vehicle is returned, provided there is no damage, missing fuel, unpaid tolls or fines, or other breach of the Host's rental terms.",
        },
        {
          body: "If the Host proposes a deduction from your deposit, they must provide evidence (photos, a repair estimate, or similar). If you disagree with a proposed deduction, contact AfriBook support — do not simply accept or dispute the charge with your card issuer first, as this can delay resolution.",
        },
      ],
    },
    {
      id: "pickup-issues",
      title: "3. Problems At Pickup",
      icon: AlertTriangle,
      content: [
        {
          heading: "3.1 Host unreachable at the agreed handoff time",
          body: "First, try contacting the Host through in-app chat or the phone number on your booking. If the Host does not respond within a reasonable time, take a timestamped photo of the pickup location and contact AfriBook support with: your booking reference, a screenshot showing your contact attempt, and any proof you arrived on time (map location, trip receipt, etc). You are entitled to a full refund if the booking cannot be fulfilled.",
        },
        {
          heading: "3.2 Vehicle not available",
          body: "If the Host cannot provide the booked vehicle, ask for written confirmation (a message in the app is sufficient) and contact AfriBook support with your booking reference. You are entitled to a full refund and, where available, help finding a comparable replacement vehicle.",
        },
        {
          heading: "3.3 Vehicle is unsafe, has mechanical issues, or is unclean",
          body: "If you have a significant concern about the vehicle's condition or safety, raise it with the Host directly first — many issues can be resolved on the spot (a swap, a discount, a cleaning). If the issue persists or the Host is unresponsive, contact AfriBook support through the app; do not drive a vehicle you believe is unsafe.",
        },
      ],
    },
    {
      id: "insurance",
      title: "4. Insurance",
      icon: Shield,
      content: [
        {
          body: "Base insurance coverage for a rented vehicle is provided by the Host and disclosed on the listing before you book; coverage, exclusions and any excess (deductible) vary by Host and are not standardised across the Platform. Review the listing's insurance details and the Host's terms before booking.",
        },
        {
          body: "Some Hosts may offer optional additional protection at pickup. Any such product, its price and its terms are offered directly by the Host, not by AfriBook.",
        },
      ],
    },
    {
      id: "responsibility",
      title: "5. Your Responsibility & Conduct",
      icon: ClipboardCheck,
      content: [
        {
          body: "You agree to use the vehicle only as permitted by the Host's listed terms (mileage limits, permitted regions, no subletting or commercial use unless stated), to drive safely and lawfully, and to return the vehicle on time, in the condition you received it, with the agreed fuel level.",
        },
        {
          body: "You are responsible for any traffic violations, tolls, or fines incurred during your rental period, and for damage caused by your negligence or misuse, subject to the insurance and deposit terms disclosed on the listing.",
        },
      ],
    },
    {
      id: "cancellation",
      title: "6. Cancellations",
      icon: CalendarClock,
      content: [
        {
          body: "See the Cancellation Policy for current renter cancellation windows and refund percentages. If the Host cancels a confirmed booking, you receive a full refund regardless of timing.",
        },
      ],
    },
    {
      id: "liability",
      title: "7. Limitation of Liability",
      icon: Scale,
      content: [
        {
          body: "AfriBook shall not be jointly or severally liable with any Host for accidents, injuries, damage or loss arising from your rental, except where caused by AfriBook's gross negligence or wilful misconduct. To the fullest extent permitted by law, you release and hold harmless AfriBook from claims arising out of your use of a rented vehicle, the conduct of the Host, and your non-compliance with applicable law.",
        },
      ],
    },
    {
      id: "law",
      title: "8. Governing Law & Disputes",
      icon: Landmark,
      content: [
        {
          body: "This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.",
        },
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: AgreementDoc[] = [
  HOST_AGREEMENT,
  DRIVER_AGREEMENT,
  RIDER_AGREEMENT,
  GUEST_AGREEMENT,
  SERVICE_PROVIDER_AGREEMENT,
  FEE_COMMISSION_POLICY,
  VEHICLE_HOST_AGREEMENT,
  VEHICLE_RENTER_AGREEMENT,
];

export function getAgreementBySlug(slug: string): AgreementDoc | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.slug === slug);
}
