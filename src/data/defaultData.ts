import type { Campaign, EmailTemplate, Lead, DailyMetric } from '../types.ts';

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    step: 1,
    dayOffset: 1,
    stepTitle: 'Step 1: How Your Business Looks to Customers Online',
    subjectVariantA: 'Quick observation: how {{company_name}} looks to customers online',
    subjectVariantB: 'Complimentary digital presence audit for {{company_name}}',
    bodyVariantA: `Hi {{first_name}},

I was reviewing local organizations in your area and noticed how {{company_name}} appears to prospective customers browsing on mobile devices today.

Many small businesses lose up to 40% of first-time inquiries simply because their web layout doesn't adapt to smartphones or lacks a seamless first impression. 

We put together a complimentary 5-point digital presence audit covering:
• Your mobile viewport rendering and modern visual credibility
• First impression bottlenecks that cause prospective clients to bounce
• Quick adjustments to ensure your contact channels are immediately accessible

No sales pitch or commitment—just an objective teardown of how {{company_name}} looks from a customer's perspective.

If you'd like to review your complimentary audit together on a quick 10-minute screen share, you can pick a time here:
https://handos.co

Best regards,
The Handos Advisory Team
handos.co`,
    bodyVariantB: `Hi {{first_name}},

When a client or member searches for {{company_name}} today, what is their exact digital first impression?

Our team conducts complimentary online footprint reviews for organizations across your sector. We noticed a few simple improvements {{company_name}} could make to project a modern, credible presence without costly overhauls.

We summarized our findings into an executive snapshot showing:
1. Why mobile visitors might struggle to find your essential services
2. Key visual trust factors that convert casual searchers into inquiries

Would you be open to a 10-minute walkthrough of your audit findings this week? You can reserve a convenient slot here:
https://handos.co

Warm regards,
Client Solutions at Handos
handos.co`,
    focusPainPoint: 'Outdated web templates, mobile unresponsiveness, loss of customer trust at first impression',
    callToAction: 'Review 5-point visual audit via 10-minute demo at handos.co',
    demoUrl: 'https://handos.co'
  },
  {
    step: 2,
    dayOffset: 3,
    stepTitle: 'Step 2: How Your Client Intake Process Looks Like',
    subjectVariantA: 'How your client intake process looks like at {{company_name}}',
    subjectVariantB: 'Streamlining {{company_name}}\'s customer onboarding & inquiry flow',
    bodyVariantA: `Hi {{first_name}},

Following up on my note earlier this week about {{company_name}}'s online presence. 

Beyond visual design, another critical area where organizations leak revenue is their client intake process. When interested customers reach out, how long does it take for their inquiry to be logged, scheduled, and answered?

If your team is still relying on downloaded PDF forms, phone tag, or unformatted email inquiries, leads often cool off within the first 60 minutes.

We developed an intake friction checklist specifically for teams like {{company_name}}:
• Eliminating paper/PDF friction for instant mobile client intake
• Automated instant confirmations so clients know their request is in progress
• Reducing manual data re-entry for your administrative staff

We'd love to share this customized intake analysis with you. You can schedule a zero-pressure demo session here:
https://handos.co

Best,
The Handos Advisory Team
handos.co`,
    bodyVariantB: `Hi {{first_name}},

Quick question regarding operations at {{company_name}}:

When a new prospective client reaches out, what does their onboarding experience look like from start to finish?

Most organizations we assist tell us that managing intake through phone voicemails or static forms creates hours of weekly admin friction and lost opportunities. 

We mapped out a frictionless intake workflow tailored for {{company_name}} that allows clients to submit their details directly from any device and automatically updates your calendar.

Happy to walk you through this intake blueprint at your convenience:
https://handos.co

Best regards,
Client Solutions at Handos
handos.co`,
    focusPainPoint: 'Manual client intake, phone tag, static PDF forms, slow lead response time',
    callToAction: 'Walk through customized intake blueprint at handos.co',
    demoUrl: 'https://handos.co'
  },
  {
    step: 3,
    dayOffset: 7,
    stepTitle: 'Step 3: Centralized Member Intake & Response Tracking Dashboard',
    subjectVariantA: 'How do you manage member intake and track responses through a centralized dashboard?',
    subjectVariantB: 'Centralized operational visibility for {{company_name}}',
    bodyVariantA: `Hi {{first_name}},

One final thought as you look ahead at optimizing operations at {{company_name}}.

How do you currently track member or client intake and monitor real-time status across your organization?

When inquiries and member records are scattered across email inboxes, paper files, or separate spreadsheets, leadership lacks a single source of truth. Internal teams spend valuable hours chasing follow-ups rather than serving clients.

At Handos, we help organizations consolidate modern web touchpoints and internal workflows into a centralized operational dashboard where:
• Every incoming intake is instantly tracked with status flags
• Automated alerts trigger if an inquiry hasn't received a response in 24 hours
• Stakeholders see live volume metrics and completion rates at a glance

I'd be delighted to offer you a quick, tailored walkthrough of how a unified intake dashboard would work for {{company_name}}. 

Feel free to pick a time that works on your calendar:
https://handos.co

Thank you for your time, {{first_name}}!

Warm regards,
The Handos Advisory Team
handos.co`,
    bodyVariantB: `Hi {{first_name}},

Closing the loop regarding {{company_name}}'s digital presence and internal workflow.

When inquiries arrive, having your team track them across disconnected tools often leads to missed follow-ups and administrative burnout. 

We've prepared a demonstration showing how organizations in your sector manage client intake through a unified dashboard—providing real-time response tracking, automated confirmations, and zero paperwork.

If this would save your staff time this quarter, let's connect for 10 minutes:
https://handos.co

Wishing you continued success with {{company_name}},

Client Solutions at Handos
handos.co`,
    focusPainPoint: 'Fragmented internal operations, lack of centralized dashboard, response tracking blind spots',
    callToAction: 'Book 10-minute centralized dashboard demo at handos.co',
    demoUrl: 'https://handos.co'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    companyName: 'Lone Star Mechanical & HVAC',
    contactName: 'Marcus Vance',
    firstName: 'Marcus',
    lastName: 'Vance',
    title: 'Owner & Managing Director',
    email: 'm.vance@lonestarhvac-example.com',
    phone: '(512) 555-0182',
    websiteUrl: 'http://lonestar-hvac-austin-old.net',
    address: '4201 S Congress Ave',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    industry: 'General Contractors & Trades',
    webStatus: 'outdated_template_2010s',
    audit: {
      score: 32,
      mobileOptimized: false,
      sslSecure: false,
      hasOnlineBooking: false,
      hasCentralizedIntake: false,
      templateEraEstimate: 'Circa 2011 Flash/Frameset site, no HTTPS',
      detectedPainPoints: [
        'Unsecured HTTP domain warning in modern browsers',
        'Intake requires downloading a printable 3-page PDF estimate request',
        'Horizontal scroll required on modern smartphone screens',
        'No emergency service dispatched tracker'
      ],
      intakeProcessType: 'Paper/PDF Forms',
      potentialRevenueLossNote: 'Estimated 8-12 missed emergency service calls weekly due to broken mobile layout',
      auditHighlights: {
        firstImpression: 'Browser flags site as "Not Secure". Flash banner placeholder fails to render on iOS and Android.',
        intakeFriction: 'Customer must print PDF, fill with pen, and fax or scan back to get an estimate.',
        dashboardMissingImpact: 'Dispatches are tracked on a whiteboard in the office; field techs have no live dashboard.'
      }
    },
    status: 'opened',
    assignedCampaignId: 'camp-1',
    createdAt: '2026-09-15T09:20:00Z',
    lastContactedAt: '2026-09-26T14:10:00Z',
    abVariantAssigned: 'A'
  },
  {
    id: 'lead-2',
    companyName: 'Capital Youth Soccer Association',
    contactName: 'Elena Rostova',
    firstName: 'Elena',
    lastName: 'Rostova',
    title: 'Executive Director',
    email: 'director@capitalyouthsoccer-demo.org',
    phone: '(512) 555-0394',
    websiteUrl: '',
    address: '8800 MoPac Expy',
    city: 'Austin',
    state: 'TX',
    zipCode: '78759',
    industry: 'Youth Sports & Community Clubs',
    webStatus: 'no_website',
    audit: {
      score: 18,
      mobileOptimized: false,
      sslSecure: false,
      hasOnlineBooking: false,
      hasCentralizedIntake: false,
      templateEraEstimate: 'No official domain; reliance on outdated Facebook page',
      detectedPainPoints: [
        'Zero standalone web presence; parents cannot find schedule or registration',
        'Seasonal member registration conducted via paper packet at community park',
        'No centralized dashboard to track parent waivers and emergency contacts',
        'Volunteer coaches overwhelmed with manual text threads'
      ],
      intakeProcessType: 'Paper/PDF Forms',
      potentialRevenueLossNote: 'High drop-off rate during fall signups; 35% of parents fail to complete physical waiver packets',
      auditHighlights: {
        firstImpression: 'No searchable website. Parents searching Google find inactive 2021 social media page.',
        intakeFriction: 'Physical clipboard signups at park pavilion during registration Saturday.',
        dashboardMissingImpact: 'Registrar manually keys in 400 paper forms into Excel; zero automated response tracking.'
      }
    },
    status: 'demo_booked',
    assignedCampaignId: 'camp-2',
    createdAt: '2026-09-18T11:00:00Z',
    lastContactedAt: '2026-09-27T10:45:00Z',
    abVariantAssigned: 'B'
  },
  {
    id: 'lead-3',
    companyName: 'Piedmont Family Dental Center',
    contactName: 'Dr. Gregory Hayes',
    firstName: 'Gregory',
    lastName: 'Hayes',
    title: 'Lead Practitioner & Practice Owner',
    email: 'dr.hayes@piedmontdental-demo.com',
    phone: '(404) 555-0147',
    websiteUrl: 'http://piedmontdentalatlanta.com',
    address: '1840 Piedmont Ave NE',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30324',
    industry: 'Healthcare & Dental Practices',
    webStatus: 'broken_intake_forms',
    audit: {
      score: 41,
      mobileOptimized: true,
      sslSecure: true,
      hasOnlineBooking: false,
      hasCentralizedIntake: false,
      templateEraEstimate: 'WordPress 2014 theme with non-functional PHP contact form',
      detectedPainPoints: [
        'Contact form throws PHP 500 error on mobile submission',
        'No HIPAA-compliant digital new patient intake',
        'Receptionist spends 2.5 hours daily manually scanning clipboard health histories',
        'No appointment calendar sync'
      ],
      intakeProcessType: 'Unresponsive Form',
      potentialRevenueLossNote: 'New patient intake abandonment rate ~28% due to form submission failures',
      auditHighlights: {
        firstImpression: 'Clean color palette but outdated stock photography; submit button triggers script error.',
        intakeFriction: 'Patients arrive 25 mins early to fill out 4-page paper clipboards in waiting room.',
        dashboardMissingImpact: 'Front desk has no real-time dashboard of patient intake completions prior to arrival.'
      }
    },
    status: 'clicked',
    assignedCampaignId: 'camp-3',
    createdAt: '2026-09-20T14:15:00Z',
    lastContactedAt: '2026-09-27T16:30:00Z',
    abVariantAssigned: 'A'
  },
  {
    id: 'lead-4',
    companyName: 'Blue Ridge Community Foundation',
    contactName: 'Sarah Jenkins',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    title: 'Operations & Grants Manager',
    email: 'sjenkins@blueridgecf-demo.org',
    phone: '(828) 555-0231',
    websiteUrl: 'http://blueridge-charity-portal.org',
    address: '112 Broadway St',
    city: 'Asheville',
    state: 'NC',
    zipCode: '28801',
    industry: 'Local Non-Profits & Charities',
    webStatus: 'pdf_only_onboarding',
    audit: {
      score: 36,
      mobileOptimized: false,
      sslSecure: true,
      hasOnlineBooking: false,
      hasCentralizedIntake: false,
      templateEraEstimate: 'Legacy Wix template with outdated fixed-width tables',
      detectedPainPoints: [
        'Grant applications require emailing 12-page Word documents',
        'Board members have no centralized intake view to score applicants',
        'Donation page redirects to unbranded third-party payment page',
        'Table layout broken on screens under 1024px width'
      ],
      intakeProcessType: 'Paper/PDF Forms',
      potentialRevenueLossNote: 'Non-profit loses youth volunteers and small donors due to friction-heavy processes',
      auditHighlights: {
        firstImpression: 'Text overlaps on mobile viewports; navigation menu collapses unexpectedly.',
        intakeFriction: 'Volunteers must download DOCX files, sign by hand, and email to a shared inbox.',
        dashboardMissingImpact: 'No tracking dashboard to know which grant applicants have pending docs or review stages.'
      }
    },
    status: 'replied',
    assignedCampaignId: 'camp-4',
    createdAt: '2026-09-21T08:45:00Z',
    lastContactedAt: '2026-09-28T09:15:00Z',
    abVariantAssigned: 'B'
  },
  {
    id: 'lead-5',
    companyName: 'Apex Commercial Accounting & Tax',
    contactName: 'David Chen',
    firstName: 'David',
    lastName: 'Chen',
    title: 'Partner',
    email: 'dchen@apexaccounting-demo.com',
    phone: '(312) 555-0812',
    websiteUrl: 'http://apex-tax-chicago.com',
    address: '333 N Michigan Ave',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    industry: 'Professional Services & Accounting',
    webStatus: 'unresponsive_mobile',
    audit: {
      score: 44,
      mobileOptimized: false,
      sslSecure: true,
      hasOnlineBooking: false,
      hasCentralizedIntake: false,
      templateEraEstimate: 'Custom HTML template built in 2012, no viewport meta tag',
      detectedPainPoints: [
        'Prospective business clients must pinch-to-zoom on phone screens',
        'Tax intake questionnaire is mailed or emailed as unprotected attachments',
        'Zero status tracking for client document receipt',
        'No direct link to book consultation calls'
      ],
      intakeProcessType: 'Paper/PDF Forms',
      potentialRevenueLossNote: 'Losing high-value business advisory clients to tech-forward accounting firms',
      auditHighlights: {
        firstImpression: 'Tiny font size on modern devices; no favicon or SSL security trust badges.',
        intakeFriction: 'Clients must print and scan 14 pages of financial discovery questionnaires.',
        dashboardMissingImpact: 'Staff tracks 180 corporate tax clients via multiple disjointed Excel sheets.'
      }
    },
    status: 'bounced',
    assignedCampaignId: 'camp-1',
    createdAt: '2026-09-22T10:10:00Z',
    lastContactedAt: '2026-09-26T11:00:00Z',
    abVariantAssigned: 'A'
  },
  {
    id: 'lead-6',
    companyName: 'Highland Park Athletic League',
    contactName: 'Robert Gomez',
    firstName: 'Robert',
    lastName: 'Gomez',
    title: 'President & League Coordinator',
    email: 'rgomez@highlandparkleague-demo.com',
    phone: '(214) 555-0919',
    websiteUrl: '',
    address: '4700 Abbott Ave',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75205',
    industry: 'Youth Sports & Community Clubs',
    webStatus: 'no_website',
    audit: {
      score: 22,
      mobileOptimized: false,
      sslSecure: false,
      hasOnlineBooking: false,
      hasCentralizedIntake: false,
      templateEraEstimate: 'Zero web presence; reliant on word of mouth and flyer handouts',
      detectedPainPoints: [
        'Prospective coaches and parents have no online intake portal',
        'Payment collected primarily via checks or cash at pre-season meetings',
        'No roster tracking dashboard or schedule notification system'
      ],
      intakeProcessType: 'Paper/PDF Forms',
      potentialRevenueLossNote: 'Over 50 parent inquiries lost each season due to lack of digital intake',
      auditHighlights: {
        firstImpression: 'Google search returns empty results or obsolete directory listing.',
        intakeFriction: 'Parents must mail paper checks with physical registration forms.',
        dashboardMissingImpact: 'Board spends 4 weekends manually collating player cards and rosters.'
      }
    },
    status: 'opened',
    assignedCampaignId: 'camp-4',
    createdAt: '2026-09-23T13:30:00Z',
    lastContactedAt: '2026-09-27T15:20:00Z',
    abVariantAssigned: 'B'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Q3 Trade Contractors - Web Presence & Intake Audit',
    category: 'Outdated Web Template Audit',
    targetIndustry: 'General Contractors & Trades',
    targetLocation: 'Austin & Central Texas (78701 - 78759)',
    totalLeads: 48,
    sentCount: 144, // 3-step sequence
    openCount: 68,
    clickCount: 29,
    replyCount: 11,
    demoBookedCount: 8,
    bounceCount: 5,
    status: 'active',
    createdAt: '2026-09-10T08:00:00Z',
    abTest: {
      variantA: {
        sent: 72,
        delivered: 70,
        opened: 31,
        clicked: 12,
        replied: 4,
        bounced: 2,
        openRate: 44.3,
        clickRate: 17.1
      },
      variantB: {
        sent: 72,
        delivered: 69,
        opened: 37,
        clicked: 17,
        replied: 7,
        bounced: 3,
        openRate: 53.6,
        clickRate: 24.6
      },
      winner: 'B',
      confidencePercentage: 94.2,
      openRateLift: 9.3,
      recommendation: 'Variant B ("Complimentary digital presence audit") yields a 9.3% higher open rate and 41% higher CTR. Automated bandit is routing 80% of new volume to Variant B.'
    },
    templates: DEFAULT_TEMPLATES
  },
  {
    id: 'camp-2',
    name: 'Community Clubs & Youth Sports - Zero Website Outreach',
    category: 'Zero-Website Outreach',
    targetIndustry: 'Youth Sports & Community Clubs',
    targetLocation: 'Austin Metro & Surrounding Counties',
    totalLeads: 36,
    sentCount: 108,
    openCount: 57,
    clickCount: 26,
    replyCount: 9,
    demoBookedCount: 6,
    bounceCount: 3,
    status: 'active',
    createdAt: '2026-09-12T10:00:00Z',
    abTest: {
      variantA: {
        sent: 54,
        delivered: 53,
        opened: 26,
        clicked: 11,
        replied: 3,
        bounced: 1,
        openRate: 49.1,
        clickRate: 20.8
      },
      variantB: {
        sent: 54,
        delivered: 52,
        opened: 31,
        clicked: 15,
        replied: 6,
        bounced: 2,
        openRate: 59.6,
        clickRate: 28.8
      },
      winner: 'B',
      confidencePercentage: 96.8,
      openRateLift: 10.5,
      recommendation: 'Variant B subject line resonates heavily with non-profit directors seeking turnkey digital solutions.'
    },
    templates: DEFAULT_TEMPLATES
  },
  {
    id: 'camp-3',
    name: 'Southeast Healthcare - Intake & Operations Audit',
    category: 'Client Intake Operations',
    targetIndustry: 'Healthcare & Dental Practices',
    targetLocation: 'Atlanta, GA (30301 - 30328)',
    totalLeads: 52,
    sentCount: 156,
    openCount: 79,
    clickCount: 34,
    replyCount: 14,
    demoBookedCount: 9,
    bounceCount: 6,
    status: 'active',
    createdAt: '2026-09-14T09:30:00Z',
    abTest: {
      variantA: {
        sent: 78,
        delivered: 75,
        opened: 41,
        clicked: 18,
        replied: 7,
        bounced: 3,
        openRate: 54.7,
        clickRate: 24.0
      },
      variantB: {
        sent: 78,
        delivered: 75,
        opened: 38,
        clicked: 16,
        replied: 7,
        bounced: 3,
        openRate: 50.7,
        clickRate: 21.3
      },
      winner: 'A',
      confidencePercentage: 81.5,
      openRateLift: 4.0,
      recommendation: 'Variant A ("How your business looks to customers online") performs marginally better in healthcare due to patient reputation awareness.'
    },
    templates: DEFAULT_TEMPLATES
  },
  {
    id: 'camp-4',
    name: 'Midwest Non-Profits - Centralized Dashboard Pilot',
    category: 'Member Intake & Dashboard',
    targetIndustry: 'Local Non-Profits & Charities',
    targetLocation: 'Chicago & Great Lakes Region (60601)',
    totalLeads: 40,
    sentCount: 120,
    openCount: 52,
    clickCount: 21,
    replyCount: 7,
    demoBookedCount: 5,
    bounceCount: 4,
    status: 'completed',
    createdAt: '2026-09-01T12:00:00Z',
    abTest: {
      variantA: {
        sent: 60,
        delivered: 58,
        opened: 24,
        clicked: 9,
        replied: 3,
        bounced: 2,
        openRate: 41.4,
        clickRate: 15.5
      },
      variantB: {
        sent: 60,
        delivered: 58,
        opened: 28,
        clicked: 12,
        replied: 4,
        bounced: 2,
        openRate: 48.3,
        clickRate: 20.7
      },
      winner: 'B',
      confidencePercentage: 91.0,
      openRateLift: 6.9,
      recommendation: 'Clear winner on Variant B with centralized operations focus.'
    },
    templates: DEFAULT_TEMPLATES
  }
];

export const HISTORICAL_METRICS: DailyMetric[] = [
  { date: '2026-09-22', sent: 64, delivered: 62, opens: 32, clicks: 14, bounces: 2, demos: 3 },
  { date: '2026-09-23', sent: 78, delivered: 76, opens: 41, clicks: 18, bounces: 2, demos: 4 },
  { date: '2026-09-24', sent: 85, delivered: 82, opens: 46, clicks: 21, bounces: 3, demos: 5 },
  { date: '2026-09-25', sent: 92, delivered: 89, opens: 50, clicks: 23, bounces: 3, demos: 6 },
  { date: '2026-09-26', sent: 110, delivered: 106, opens: 61, clicks: 29, bounces: 4, demos: 7 },
  { date: '2026-09-27', sent: 125, delivered: 121, opens: 69, clicks: 33, bounces: 4, demos: 8 },
  { date: '2026-09-28', sent: 142, delivered: 138, opens: 78, clicks: 38, bounces: 4, demos: 9 }
];
