import type { LucideIcon } from 'lucide-react'
import {
  Shield, Scale, Ban, Users, Car, Home, CreditCard, Globe, AlertTriangle, FileText,
  UserCheck, Landmark, ClipboardCheck, ShieldCheck, CalendarClock, Copyright, RefreshCw, ShieldAlert, FileCheck,
} from 'lucide-react'

export interface LegalSection {
  id: string
  title: string
  icon: LucideIcon
  content: Array<{ heading?: string; body?: string; list?: string[]; callout?: string }>
}

export interface AgreementDoc {
  slug: string
  title: string
  subtitle: string
  effectiveDate: string
  lastUpdated: string
  tocLabel: string
  intro: string[]
  sections: LegalSection[]
}

export const HOST_AGREEMENT: AgreementDoc = {
  slug: 'host-agreement',
  title: 'Host Agreement',
  subtitle: 'For hotels, guesthouses, serviced apartments and accommodation hosts listing on AfriBook Stayscape',
  effectiveDate: 'August 1, 2026',
  lastUpdated: 'August 4, 2026',
  tocLabel: 'Host Agreement',
  intro: [
    'This Host Agreement ("Agreement") is a legally binding contract between you ("Host," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your listing and booking of accommodation — including hotel rooms, guesthouse stays, serviced apartments, holiday homes and short-term rentals — on the AfriBook Stayscape platform ("Platform").',
    'By signing this Agreement, you agree to list and manage properties on the Platform under the terms set out below. By registering as a Host, listing a Property, or accepting any booking through the Platform, you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy. If you operate a Property on behalf of another entity, you represent and warrant that you are duly authorised to bind that entity.',
    'This Agreement contains important limitations of liability, waivers, hold-harmless provisions, disclaimers of warranty and obligations to comply with local law. Please read it carefully before listing a Property. Your digital signature confirms that you have read, understood and agreed to these terms.',
  ],
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FileCheck,
      content: [
        {
          body: 'By signing this Agreement, you agree to list and manage properties on the Platform under these terms and conditions. Your continued operation as a Host, including listing a Property or accepting any booking through the Platform, reaffirms your acceptance of this Agreement.',
        },
      ],
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      icon: FileText,
      content: [
        {
          body: 'In this Agreement:',
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
      id: 'role',
      title: '3. Your Relationship With AfriBook',
      icon: Users,
      content: [
        {
          body: 'You operate your Property as an independent business. AfriBook acts solely as an intermediary technology platform that connects Hosts with Guests. AfriBook is not a party to the stay, does not occupy, manage, or control your Property, and is not your employer, agent, joint venturer or partner.',
        },
        {
          body: 'You are solely responsible for the operation of your Property, the accuracy of your listings, the safety and quality of the accommodation you provide, and the conduct of your staff and sub-contractors. You retain full control over pricing, availability, house rules and the provision of the accommodation itself.',
        },
      ],
    },
    {
      id: 'responsibilities',
      title: '4. Host Responsibilities',
      icon: ClipboardCheck,
      content: [
        {
          body: 'As a Host you agree to:',
          list: [
            'Provide accurate property information, including photos, amenities, and descriptions.',
            'Maintain your Property in good condition and ensure cleanliness between stays.',
            'Respond to guest inquiries within 24 hours.',
            'Honor confirmed bookings and provide all stated amenities.',
            'Comply with all local laws, regulations, and tax requirements applicable to your hosting activities.',
            'Maintain proper insurance coverage for the Property, including liability insurance.',
          ],
        },
      ],
    },
    {
      id: 'listing',
      title: '5. Property Listings',
      icon: Home,
      content: [
        {
          body: 'All property listings must:',
          list: [
            'Be for properties you own or have written authorization to rent.',
            'Include accurate photos and descriptions, without misleading images, overstated quality or inaccurate information.',
            'Specify all amenities, house rules, and restrictions.',
            'Disclose any safety hazards or property limitations.',
            'Set reasonable and competitive pricing.',
          ],
        },
        {
          heading: '5.1 Your Due Diligence',
          body: 'You are responsible for conducting your own due diligence regarding the laws, regulations, licences, permits, zoning requirements, safety codes, insurance obligations and tax obligations that apply to your Property in your jurisdiction. This includes, without limitation, municipal registration, tourist levy, guest documentation, and fire and building safety compliance.',
        },
        {
          heading: '5.2 No Illegal Use',
          body: 'You must not use the Platform, or permit your Property to be used, for any illegal, unethical, criminal or corrupt purpose. You must not permit any Guest to use the Property for unlawful activity. Any such use is a material breach and grounds for immediate termination.',
        },
      ],
    },
    {
      id: 'guests',
      title: '6. Guest Management',
      icon: Users,
      content: [
        {
          body: 'You are responsible for the safety and conduct of all persons at your Property, including Guests and their visitors. You must:',
          list: [
            'Verify the identity of Guests in accordance with local law and Platform policy.',
            'Maintain a safe, hygienic and properly functioning Property at all times.',
            'Refuse accommodation, and promptly report to AfriBook and relevant authorities, any Guest who engages in or attempts SHARFT, harassment, illegal activity or behaviour that endangers others.',
            'Ensure that no Guest is subjected to discrimination on any protected ground.',
          ],
        },
        {
          callout: 'AfriBook has a zero-tolerance policy for SHARFT — including sexual harassment, assault, exploitation, fraud and trafficking. Any Host who engages in, facilitates, or fails to report such conduct will be immediately and permanently removed from the Platform and referred to law enforcement.',
        },
      ],
    },
    {
      id: 'safety',
      title: '7. Guest Safety',
      icon: ShieldCheck,
      content: [
        {
          body: 'You must take reasonable measures to ensure the safety of Guests at your Property, including:',
          list: [
            'Ensuring all safety equipment is functional, including smoke detectors and carbon monoxide detectors.',
            'Providing emergency contact information to every Guest.',
            'Disclosing any potential safety concerns or property limitations.',
            'Maintaining secure locks and entry systems.',
            'Ensuring your Property meets all applicable safety standards and building codes.',
          ],
        },
      ],
    },
    {
      id: 'fees',
      title: '8. Service Fees, Pricing & Payments',
      icon: CreditCard,
      content: [
        {
          heading: '8.1 Fees',
          body: 'AfriBook charges a host service fee on completed bookings, as disclosed in your dashboard and fee schedule, which is automatically deducted from your payouts. Guests pay a separate guest fee at booking. Fees may vary by market and are subject to change with reasonable notice under Section 18 (Modifications).',
        },
        {
          heading: '8.2 Payouts',
          body: 'Payouts are processed within 3–5 business days after guest check-in, subject to the settlement of any refunds, chargebacks or disputes. StayScape is not responsible for any payment delays caused by banking institutions. You are responsible for the accuracy of your payout details.',
        },
        {
          heading: '8.3 Taxes',
          body: 'You are responsible for all taxes arising from your operation of the Property, including income tax, VAT or sales tax, tourist levies and occupancy taxes, except where AfriBook is required by law to collect or remit them on your behalf.',
        },
      ],
    },
    {
      id: 'cancellation',
      title: '9. Cancellation Policy',
      icon: CalendarClock,
      content: [
        {
          body: 'Hosts must honor confirmed bookings. Cancellations may result in penalties and reduced listing visibility. Where a stay cannot be fulfilled, both parties will cooperate to refund or rebook affected Guests in accordance with the applicable cancellation policy and the AfriBook Refund Policy.',
        },
        {
          body: 'Excessive cancellations may also affect your Host rating, search placement, and eligibility for featured placement, and may, in serious cases, lead to suspension under Section 16.',
        },
      ],
    },
    {
      id: 'conduct',
      title: '10. Prohibited Conduct & Activities',
      icon: Ban,
      content: [
        {
          body: 'You must not, and must ensure your staff and agents do not:',
          list: [
            'Engage in, facilitate, solicit, or condone SHARFT or any form of sexual exploitation, harassment, assault or trafficking.',
            'Discriminate against Guests based on protected characteristics.',
            'Ask Guests to book outside the Platform, or otherwise conduct transactions off-Platform with Guests sourced through the Platform in order to avoid fees.',
            'Use misleading photos or descriptions.',
            'List properties you do not have the rights to rent.',
            'Offer or accept bribes, kickbacks, or other corrupt or unethical payments.',
            'Engage in hate speech, harassment, or any conduct that endangers others.',
            'Misrepresent your Property, pricing, availability or identity.',
            'Engage in money laundering, fraud, or any financial crime.',
            'Violate local rental laws or regulations.',
          ],
        },
        {
          callout: 'Violations of this section may result in immediate termination of your Host account, forfeiture of outstanding payments, legal action, and referral to law enforcement. You may also be personally liable for your own unlawful conduct.',
        },
      ],
    },
    {
      id: 'compliance',
      title: '11. Regulatory Compliance',
      icon: Landmark,
      content: [
        {
          body: 'As a Host, you acknowledge and agree that:',
          list: [
            'You are solely responsible for understanding and complying with all federal, state, and local laws, regulations, ordinances, and codes applicable to your Property and hosting activities.',
            'This includes but is not limited to zoning laws, building codes, health and safety regulations, tax obligations, licensing requirements, and short-term rental regulations.',
            'You will obtain and maintain all necessary permits, licenses, and approvals required to legally operate your Property as a short-term rental.',
            'AfriBook makes no representations or warranties regarding the legality of hosting in your jurisdiction and provides no legal advice.',
            'You agree to indemnify and hold harmless AfriBook for any violations of applicable laws or regulations.',
          ],
        },
        {
          body: 'You represent and warrant that: (a) you hold all licences, permits and authorisations required to offer your Property for short-term rental in your jurisdiction; (b) your Property complies with all applicable health, safety, fire, sanitation and building regulations; (c) you carry the insurance required by law and will maintain it in force; and (d) you will comply with all applicable tax obligations.',
        },
      ],
    },
    {
      id: 'liability',
      title: '12. Liability, Hold Harmless & Indemnification',
      icon: Shield,
      content: [
        {
          heading: '12.1 No Joint or Several Liability',
          body: 'AfriBook shall not be jointly or severally liable with you for any loss, injury, damage or claim arising out of your operation of the Property, your acts or omissions, the acts of your staff, or the conduct of any Guest. Any liability arising from a stay is yours alone, unless caused by the gross negligence or wilful misconduct of AfriBook.',
        },
        {
          heading: '12.2 Release and Hold Harmless',
          body: 'By signing this Agreement you acknowledge and agree that you are solely responsible for any and all damages, injuries, losses, claims, liabilities, costs, and expenses arising from or related to your Property, your hosting activities, and the actions or omissions of your guests.',
        },
        {
          heading: '12.3 Indemnification',
          body: 'To the fullest extent permitted by law, you agree to indemnify, defend, and hold harmless AfriBook, its parent companies, subsidiaries, affiliates, officers, directors, employees, workers, agents, contractors, partners, marketers, advertisers, service providers, and all other representatives (collectively, the "StayScape Parties") from and against any and all claims, demands, losses, liabilities, damages, costs, and expenses (including reasonable attorneys\u2019 fees) arising from or related to:',
          list: [
            'Your Property, including any defects, hazards, or unsafe conditions.',
            'Your breach of this Agreement or violation of any laws or regulations.',
            'Any negligent, reckless, or intentional acts or omissions by you or anyone acting on your behalf.',
            'Any disputes, injuries, property damage, or other incidents involving your guests or third parties.',
            'Any errors, omissions, misrepresentations, or inaccuracies in your property listings or communications.',
            'Any legal oversights, regulatory violations, or compliance failures on your part.',
            'Any injury, accident, loss or damage occurring at the Property.',
            'Force majeure events that prevent or disrupt stays.',
          ],
        },
        {
          heading: '12.4 Exclusion of Consequential Damages',
          body: 'AfriBook is not liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or your hosting activities. This hold harmless provision survives the termination of this Agreement and your use of the Platform.',
        },
        {
          heading: '12.5 Personal Liability',
          body: 'You acknowledge that you may be personally and/or entity-liable for claims arising from your own actions, errors, omissions, or negligence, and that AfriBook is not your insurer or guarantor. You are encouraged to maintain appropriate public liability, property and business insurance.',
        },
        {
          heading: '12.6 Force Majeure',
          body: 'Neither party shall be liable for failure or delay caused by a Force Majeure event. Where a stay cannot be fulfilled due to Force Majeure, both parties will cooperate to refund or rebook affected Guests in accordance with the Refund Policy.',
        },
      ],
    },
    {
      id: 'risk',
      title: '13. Assumption of Responsibility and Risk',
      icon: ShieldAlert,
      content: [
        {
          body: 'You expressly acknowledge and assume full responsibility for:',
          list: [
            'Your own safety and well-being while managing and maintaining your Property.',
            'The safety, security, and well-being of all guests, visitors, and third parties at your Property.',
            'The care, maintenance, and condition of your Property and all furnishings, fixtures, and amenities.',
            'Ensuring your Property meets all applicable safety standards and building codes.',
            'Providing a safe environment free from hazards, defects, or dangerous conditions.',
            'The safety and security of any partners, contractors, or service providers you engage.',
            'Any risks inherent in hosting short-term rentals, including property damage, theft, personal injury, or other losses.',
            'Maintaining adequate insurance coverage, including liability insurance and property insurance.',
            'All business operations, financial obligations, and tax liabilities related to your hosting activities.',
          ],
        },
        {
          body: 'You acknowledge that hosting involves inherent risks and you voluntarily assume all such risks. AfriBook does not guarantee the safety or security of hosts, guests, or properties and is not responsible for any incidents, injuries, or losses that may occur.',
        },
      ],
    },
    {
      id: 'warranties',
      title: '14. Disclaimer of Warranties',
      icon: AlertTriangle,
      content: [
        {
          body: 'AfriBook provides the Platform on an "as is" and "as available" basis without warranties of any kind, either express or implied. AfriBook specifically disclaims all warranties regarding the Platform\u2019s operation, your ability to generate income, guest behavior, or the legal compliance of hosting activities in your jurisdiction.',
        },
      ],
    },
    {
      id: 'ip',
      title: '15. Intellectual Property',
      icon: Copyright,
      content: [
        {
          body: 'By uploading photos and content, you retain ownership of your content and grant AfriBook a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, adapt, publish, translate, and display this content for the purpose of operating, promoting and improving the Platform, including for marketing and promotional purposes.',
        },
        {
          body: 'You may not use AfriBook\u2019s trademarks, logos, brand name, or other intellectual property without express written permission.',
        },
      ],
    },
    {
      id: 'termination',
      title: '16. Account Suspension & Termination',
      icon: AlertTriangle,
      content: [
        {
          body: 'AfriBook reserves the right to suspend or terminate host accounts for violations of these terms, guest complaints, fraudulent activity, or conduct that endangers Guests. AfriBook may suspend or terminate this Agreement and your access to the Platform:',
          list: [
            'Immediately, without notice, if you violate Section 10 (Prohibited Conduct & Activities), including any involvement in SHARFT, fraud, illegal activity or conduct that endangers Guests.',
            'On notice, for repeated or material breaches of this Agreement that you fail to remedy within 7 days.',
            'On notice, if required by law, regulation, or an order of a competent authority.',
          ],
        },
        {
          body: 'Upon termination, all outstanding bookings will be handled in accordance with the Refund Policy, and any unpaid fees owed to AfriBook shall become immediately due.',
        },
      ],
    },
    {
      id: 'insurance',
      title: '17. Insurance',
      icon: ShieldCheck,
      content: [
        {
          body: 'You must maintain, at your own cost, all insurance required by law, including liability insurance and property insurance, and are strongly encouraged to maintain public liability, property, and business interruption cover appropriate to your Property. On request, you must provide evidence of your insurance to AfriBook.',
        },
      ],
    },
    {
      id: 'modifications',
      title: '18. Modifications',
      icon: RefreshCw,
      content: [
        {
          body: 'AfriBook may update these terms at any time. We will provide at least 30 days\u2019 notice before any material changes take effect, communicated via email and/or notification on the Platform. Continued hosting after changes take effect constitutes acceptance of the new terms.',
        },
        {
          body: 'If you do not agree to the modified terms, you may close your Host account before the changes take effect without incurring any penalties.',
        },
      ],
    },
    {
      id: 'law',
      title: '19. Governing Law & Disputes',
      icon: Scale,
      content: [
        {
          body: 'This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service, with the seat of arbitration in Lagos, Nigeria.',
        },
      ],
    },
  ],
}

export const DRIVER_AGREEMENT: AgreementDoc = {
  slug: 'driver-agreement',
  title: 'Driver Agreement',
  subtitle: 'For ride-hailing and delivery drivers on the AfriBook Rides & Delivery network',
  effectiveDate: 'August 1, 2026',
  lastUpdated: 'August 4, 2026',
  tocLabel: 'Driver Agreement',
  intro: [
    'This Driver Agreement ("Agreement") is a legally binding contract between you ("Driver," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your provision of ride-hailing and delivery services through the AfriBook Rides & Delivery platform ("Platform").',
    'By registering as a Driver, accepting the Driver terms during onboarding, or accepting any ride or delivery request, you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy.',
    'You provide services as an independent contractor, not as an employee of AfriBook. This Agreement does not create an employment relationship.',
  ],
  sections: [
    {
      id: 'independent',
      title: '1. Independent Contractor',
      icon: Users,
      content: [
        {
          body: 'You provide services as an independent contractor. AfriBook does not control, supervise, or direct the manner in which you perform your services, including route selection, driving style, or scheduling. You may work for other platforms, companies or clients and set your own hours subject to Platform availability requirements.',
        },
        {
          body: 'You are responsible for your own vehicle, fuel, maintenance, insurance, licences, permits, and all costs and expenses associated with providing your services. You are not entitled to employee benefits.',
        },
      ],
    },
    {
      id: 'requirements',
      title: '2. Driver Requirements & Due Diligence',
      icon: UserCheck,
      content: [
        {
          body: 'You represent and warrant that:',
          list: [
            'You hold a valid, current driving licence for the class of vehicle you operate, valid in your jurisdiction.',
            'Your vehicle is roadworthy, registered, and complies with all local vehicle and safety regulations.',
            'You hold all licences, permits, and registrations required to provide ride-hailing or delivery services, including any commercial or public transport authorisations required by local law.',
            'You carry valid third-party liability and, where required, commercial insurance.',
            'You have passed the background screening and safety verification required by AfriBook and local regulators.',
            'You are at least the minimum legal age to provide such services in your jurisdiction.',
          ],
        },
        {
          heading: '2.1 Your Due Diligence',
          body: 'You are responsible for conducting your own due diligence on the legal, licensing, insurance and tax obligations that apply to your services in your jurisdiction. You must keep your documents valid and up to date and promptly upload any renewals to the Platform.',
        },
        {
          callout: 'Providing services without required licences, insurance or a valid licence is a material breach of this Agreement and may result in immediate termination and referral to authorities.',
        },
      ],
    },
    {
      id: 'service',
      title: '3. Provision of Services',
      icon: Car,
      content: [
        {
          body: 'When you accept a ride or delivery request, you agree to:',
          list: [
            'Complete the trip or delivery in a safe, careful, lawful and professional manner.',
            'Follow the route suggested by the Platform unless a lawful, safe alternative is appropriate.',
            'Not charge riders or customers more than the amount agreed through the Platform, and not solicit cash or off-Platform payments.',
            'Not operate while impaired by alcohol, drugs, medication, or fatigue.',
            'Keep your vehicle clean, safe and in good working order.',
            'Treat riders, customers, merchants and the public with courtesy and respect.',
          ],
        },
      ],
    },
    {
      id: 'prohibited',
      title: '4. Prohibited Conduct',
      icon: Ban,
      content: [
        {
          body: 'You must not:',
          list: [
            'Engage in, solicit, facilitate, or condone SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — or any form of sexual misconduct with any rider or customer.',
            'Harass, threaten, discriminate against, or endanger any rider, customer, merchant or member of the public.',
            'Engage in reckless, dangerous or unlawful driving.',
            'Use the Platform to commit any fraud, theft, or financial crime, including phantom trips, fare manipulation, or collusion with riders.',
            'Carry illegal goods, weapons, contraband or any item prohibited by law.',
            'Conduct off-Platform trips with riders sourced through the Platform to avoid fees.',
            'Misrepresent your identity, vehicle, or insurance status.',
            'Solicit or accept bribes or engage in corrupt practices.',
          ],
        },
        {
          callout: 'AfriBook has a zero-tolerance policy for SHARFT and any criminal conduct. Any Driver found to have engaged in such conduct will be permanently removed from the Platform, reported to law enforcement, and may be personally liable.',
        },
      ],
    },
    {
      id: 'earnings',
      title: '5. Earnings, Fees & Payouts',
      icon: CreditCard,
      content: [
        {
          body: 'Your earnings are calculated in accordance with the fare structure published in your driver dashboard, net of AfriBook fees and any applicable taxes or third-party charges. Payouts are made to your nominated bank or mobile money account on the published schedule.',
        },
        {
          body: 'You are responsible for declaring and paying all taxes on your earnings, including income tax and any value-added or sales tax, in accordance with the law of your jurisdiction.',
        },
      ],
    },
    {
      id: 'liability',
      title: '6. Liability, Waiver & Hold Harmless',
      icon: Shield,
      content: [
        {
          heading: '6.1 Your Responsibility',
          body: 'You are solely responsible for the safe operation of your vehicle and for the safety of your passengers and other road users. You acknowledge that you may be personally liable for injuries, damage or loss arising from your own actions, errors, omissions or negligence.',
        },
        {
          heading: '6.2 No Joint or Several Liability',
          body: 'AfriBook shall not be jointly or severally liable with you for any accident, injury, damage or loss arising out of the provision of your services, except where caused by the gross negligence or wilful misconduct of AfriBook.',
        },
        {
          heading: '6.3 Release and Hold Harmless',
          body: 'To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates, officers, directors, employees and agents from all claims, damages, losses and expenses (including reasonable legal fees) arising out of: (a) your provision of services; (b) any accident, injury or loss caused by your driving; (c) your non-compliance with local law or insurance requirements; (d) the conduct of riders or third parties; and (e) force majeure events.',
        },
        {
          heading: '6.4 Assumption of Risk',
          body: 'You voluntarily assume the risks inherent in providing ride-hailing and delivery services, including the risk of traffic accidents, road hazards, adverse weather, and interactions with the public, to the fullest extent permitted by law.',
        },
      ],
    },
    {
      id: 'termination',
      title: '7. Suspension & Immediate Termination',
      icon: AlertTriangle,
      content: [
        {
          body: 'AfriBook may suspend or terminate this Agreement immediately, without notice, if you:',
          list: [
            'Engage in SHARFT, fraud, theft, or any criminal or unlawful activity through the Platform.',
            'Endanger riders, the public, or other road users through reckless or impaired driving.',
            'Operate without required licences, permits or insurance.',
            'Repeatedly breach Platform safety or quality standards.',
          ],
        },
        {
          body: 'Otherwise, either party may terminate this Agreement on reasonable notice. Upon termination, any amounts due shall be settled in accordance with the payout schedule.',
        },
      ],
    },
    {
      id: 'law',
      title: '8. Governing Law & Disputes',
      icon: Landmark,
      content: [
        {
          body: 'This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.',
        },
      ],
    },
  ],
}

export const RIDER_AGREEMENT: AgreementDoc = {
  slug: 'rider-agreement',
  title: 'Rider Agreement',
  subtitle: 'For riders and customers using AfriBook Rides & Delivery',
  effectiveDate: 'August 1, 2026',
  lastUpdated: 'August 4, 2026',
  tocLabel: 'Rider Agreement',
  intro: [
    'This Rider Agreement ("Agreement") is a legally binding contract between you ("Rider," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your use of the AfriBook ride-hailing and delivery services ("Services").',
    'By requesting, booking or accepting a ride or delivery, you agree to be bound by this Agreement, the AfriBook Terms of Service, and the AfriBook Privacy Policy.',
    'Rides and deliveries are provided by independent drivers, not by AfriBook. This Agreement explains the limits of AfriBook\u2019s responsibility.',
  ],
  sections: [
    {
      id: 'role',
      title: '1. The Platform\u2019s Role',
      icon: Globe,
      content: [
        {
          body: 'AfriBook is an intermediary technology platform that connects you with independent drivers. AfriBook is not a transportation provider, does not own or operate any vehicles, and is not a party to the transportation services you receive. Your ride or delivery is performed by an independent driver who is not an employee, agent or joint venturer of AfriBook.',
        },
      ],
    },
    {
      id: 'conduct',
      title: '2. Your Obligations & Conduct',
      icon: Users,
      content: [
        {
          body: 'When using the Services, you agree to:',
          list: [
            'Provide accurate pickup and drop-off locations.',
            'Be ready and present at the pickup location at the agreed time.',
            'Treat drivers with courtesy and respect, and not engage in harassment, discrimination or abusive behaviour.',
            'Not use the Services for any illegal, unethical or criminal purpose, and not transport illegal goods.',
            'Not engage in SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — or any conduct that endangers or sexually exploits any driver or other person.',
            'Not solicit drivers for off-Platform services.',
            'Comply with all applicable laws and local safety requirements, including seat-belt and child-seat requirements.',
          ],
        },
        {
          callout: 'AfriBook has a zero-tolerance policy for SHARFT and criminal conduct. Anyone found to have engaged in such conduct will be permanently removed from the Platform and reported to law enforcement.',
        },
      ],
    },
    {
      id: 'responsibility',
      title: '3. Personal Responsibility & Due Diligence',
      icon: Shield,
      content: [
        {
          body: 'You are responsible for exercising your own judgement and due diligence when using the Services, including assessing your safety before and during a ride. You acknowledge that you use the Services at your own risk to the fullest extent permitted by law.',
        },
        {
          body: 'You agree to take reasonable precautions for your own safety, including verifying the driver, vehicle make and registration number against the details shown in the app before boarding, and reporting any mismatch to AfriBook.',
        },
      ],
    },
    {
      id: 'liability',
      title: '4. Limitation of Liability & Waiver',
      icon: AlertTriangle,
      content: [
        {
          heading: '4.1 No Joint or Several Liability',
          body: 'AfriBook shall not be jointly or severally liable with any driver for accidents, injuries, damage or loss arising out of or in connection with a ride or delivery, except where caused by the gross negligence or wilful misconduct of AfriBook.',
        },
        {
          heading: '4.2 Release and Hold Harmless',
          body: 'To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates, officers, directors, employees and agents from all claims, damages, losses and expenses arising out of: (a) your use of the Services; (b) any accident, injury or loss during a ride or delivery; (c) the conduct of drivers or third parties; (d) your non-compliance with applicable law; and (e) force majeure events.',
        },
        {
          heading: '4.3 Driver Responsibility',
          body: 'Your legal relationship in respect of the transportation itself is directly with the driver. Any claim concerning driving conduct, vehicle condition or road safety should be pursued against the driver, subject to AfriBook\u2019s dispute resolution process.',
        },
        {
          heading: '4.4 Assumption of Risk',
          body: 'You voluntarily assume the inherent risks of road travel, including the risk of accidents, traffic hazards and adverse weather, to the fullest extent permitted by law.',
        },
      ],
    },
    {
      id: 'termination',
      title: '5. Suspension & Termination',
      icon: AlertTriangle,
      content: [
        {
          body: 'AfriBook may suspend or terminate your account immediately, without notice, if you engage in SHARFT, fraud, harassment, illegal activity or any conduct that endangers drivers or others. Any amounts owed shall be settled in accordance with the Refund Policy.',
        },
      ],
    },
    {
      id: 'law',
      title: '6. Governing Law & Disputes',
      icon: Landmark,
      content: [
        {
          body: 'This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.',
        },
      ],
    },
  ],
}

export const GUEST_AGREEMENT: AgreementDoc = {
  slug: 'guest-agreement',
  title: 'Guest / Renter Agreement',
  subtitle: 'For guests and renters booking accommodation through AfriBook Stayscape',
  effectiveDate: 'August 1, 2026',
  lastUpdated: 'August 4, 2026',
  tocLabel: 'Guest & Renter Agreement',
  intro: [
    'This Guest / Renter Agreement ("Agreement") is a legally binding contract between you ("Guest," "you") and AfriBook Technologies Limited ("AfriBook," "we," "us"). It governs your booking and stay at accommodation (hotels, guesthouses, serviced apartments, villas and short-term rentals) through the AfriBook Stayscape platform ("Platform").',
    'By making a booking, you agree to be bound by this Agreement, the AfriBook Terms of Service, the applicable cancellation policy, and the AfriBook Privacy Policy.',
    'Accommodation is provided by independent Hosts, not by AfriBook. This Agreement explains the limits of AfriBook\u2019s responsibility.',
  ],
  sections: [
    {
      id: 'role',
      title: '1. The Platform\u2019s Role',
      icon: Globe,
      content: [
        {
          body: 'AfriBook is an intermediary platform that connects Guests with independent Hosts. AfriBook does not own, operate, manage or control any accommodation listed on the Platform, and is not a party to the stay. Your accommodation is provided by an independent Host who is solely responsible for the Property and the stay.',
        },
      ],
    },
    {
      id: 'booking',
      title: '2. Bookings & Payment',
      icon: CreditCard,
      content: [
        {
          body: 'By completing a booking you authorise AfriBook to process payment through the payment method you provide. Prices, taxes, and fees are shown at the time of booking. Cancellations and refunds are governed by the cancellation policy applicable to your booking and the AfriBook Refund Policy.',
        },
      ],
    },
    {
      id: 'conduct',
      title: '3. Your Obligations During the Stay',
      icon: Users,
      content: [
        {
          body: 'During your stay you agree to:',
          list: [
            'Comply with the Host\u2019s published house rules, check-in/check-out times and occupancy limits.',
            'Use the Property and its contents with reasonable care, and report any damage promptly.',
            'Not sublet the Property, host events without permission, or exceed the maximum occupancy.',
            'Not use the Property for any illegal, unethical, criminal or corrupt purpose.',
            'Not engage in SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — or any conduct that sexually exploits, harasses or endangers the Host, staff or other guests.',
            'Not smoke where prohibited, and not engage in any activity that creates a nuisance or safety hazard.',
            'Notify the Host immediately of any safety or security issue.',
          ],
        },
        {
          callout: 'AfriBook has a zero-tolerance policy for SHARFT and criminal conduct. Guests found to have engaged in such conduct will be immediately removed, permanently banned from the Platform, and reported to law enforcement.',
        },
      ],
    },
    {
      id: 'liability',
      title: '4. Liability, Waiver & Hold Harmless',
      icon: Shield,
      content: [
        {
          heading: '4.1 No Joint or Several Liability',
          body: 'AfriBook shall not be jointly or severally liable with any Host for accidents, injuries, damage or loss occurring at or in connection with any Property, except where caused by the gross negligence or wilful misconduct of AfriBook.',
        },
        {
          heading: '4.2 Release and Hold Harmless',
          body: 'To the fullest extent permitted by law, you release and hold harmless AfriBook and its affiliates, officers, directors, employees and agents from all claims, damages, losses and expenses arising out of: (a) your stay; (b) any injury, accident, damage or loss at the Property; (c) the conduct of the Host, staff or other guests; (d) your failure to comply with house rules or local law; and (e) force majeure events.',
        },
        {
          heading: '4.3 Host Responsibility',
          body: 'Your legal relationship in respect of the accommodation itself is directly with the Host. Any claim concerning the condition, safety or quality of the Property should be pursued against the Host, subject to AfriBook\u2019s dispute resolution process.',
        },
        {
          heading: '4.4 Your Personal Responsibility',
          body: 'You are responsible for your own conduct, the safety of your personal belongings, and compliance with the Property\u2019s rules and local law. You acknowledge that you may be personally liable for damage you cause to the Property.',
        },
      ],
    },
    {
      id: 'termination',
      title: '5. Suspension & Termination',
      icon: AlertTriangle,
      content: [
        {
          body: 'AfriBook may suspend or terminate your account immediately, without notice, if you engage in SHARFT, fraud, harassment, illegal activity, or any conduct that endangers the Host, staff or other guests. Any amounts owed shall be settled in accordance with the Refund Policy.',
        },
      ],
    },
    {
      id: 'law',
      title: '6. Governing Law & Disputes',
      icon: Landmark,
      content: [
        {
          body: 'This Agreement is governed by the laws of the Federal Republic of Nigeria and any disputes shall be resolved in accordance with the dispute resolution provisions of the Terms of Service.',
        },
      ],
    },
  ],
}

export const LEGAL_DOCUMENTS: AgreementDoc[] = [HOST_AGREEMENT, DRIVER_AGREEMENT, RIDER_AGREEMENT, GUEST_AGREEMENT]

export function getAgreementBySlug(slug: string): AgreementDoc | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.slug === slug)
}
