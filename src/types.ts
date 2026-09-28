export type IndustryCategory = 
  | 'General Contractors & Trades'
  | 'Youth Sports & Community Clubs'
  | 'Healthcare & Dental Practices'
  | 'Professional Services & Accounting'
  | 'Local Non-Profits & Charities'
  | 'Auto Repair & Towing'
  | 'Specialty Retail & Food';

export type WebPresenceStatus = 
  | 'no_website'
  | 'outdated_template_2010s'
  | 'unresponsive_mobile'
  | 'broken_intake_forms'
  | 'pdf_only_onboarding';

export interface DigitalAudit {
  score: number; // 0-100
  mobileOptimized: boolean;
  sslSecure: boolean;
  hasOnlineBooking: boolean;
  hasCentralizedIntake: boolean;
  templateEraEstimate: string; // e.g., "Pre-2015 static HTML", "No domain registered", "Legacy Joomla/Wix v1"
  detectedPainPoints: string[];
  intakeProcessType: 'Paper/PDF Forms' | 'Phone Call Only' | 'Unresponsive Form' | 'Missing Entirely';
  potentialRevenueLossNote: string;
  auditHighlights: {
    firstImpression: string;
    intakeFriction: string;
    dashboardMissingImpact: string;
  };
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  websiteUrl?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  industry: IndustryCategory;
  webStatus: WebPresenceStatus;
  audit: DigitalAudit;
  status: 'new' | 'contacted' | 'opened' | 'clicked' | 'replied' | 'demo_booked' | 'bounced';
  assignedCampaignId?: string;
  createdAt: string;
  lastContactedAt?: string;
  abVariantAssigned?: 'A' | 'B';
}

export interface EmailTemplate {
  step: 1 | 2 | 3;
  dayOffset: number; // e.g. Day 1, Day 3, Day 7
  stepTitle: string; // e.g., "Step 1: How Your Business Looks to Customers Online"
  subjectVariantA: string;
  subjectVariantB: string;
  bodyVariantA: string;
  bodyVariantB: string;
  focusPainPoint: string;
  callToAction: string;
  demoUrl: string; // e.g. https://handos.co
}

export interface ABTestResult {
  variantA: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  };
  variantB: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  };
  winner: 'A' | 'B' | 'inconclusive';
  confidencePercentage: number;
  openRateLift: number;
  recommendation: string;
}

export type CampaignCategory = 
  | 'Outdated Web Template Audit'
  | 'Zero-Website Outreach'
  | 'Client Intake Operations'
  | 'Member Intake & Dashboard';

export interface Campaign {
  id: string;
  name: string;
  category: CampaignCategory;
  targetIndustry: string;
  targetLocation: string; // e.g., "Austin, TX (78701)"
  totalLeads: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  replyCount: number;
  demoBookedCount: number;
  bounceCount: number;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  createdAt: string;
  abTest: ABTestResult;
  templates: EmailTemplate[];
}

export interface DailyMetric {
  date: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  demos: number;
}

export interface CampaignFilterOptions {
  dateRange: '7d' | '14d' | '30d' | '90d' | 'ytd' | 'custom';
  category: string; // 'all' or CampaignCategory
  status: string; // 'all' | 'active' | 'completed' | 'draft'
  searchQuery: string;
}
