import { Campaign, Lead, EmailTemplate } from '../types';

export async function searchLeads(params: {
  zipCode: string;
  city: string;
  state: string;
  industry: string;
  webStatusFilter?: string;
  limit?: number;
}): Promise<{ leads: Lead[]; count: number; source?: string; searchSources?: Array<{ uri: string; title: string }> }> {
  const response = await fetch('/api/leads/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to search leads: ${response.statusText}`);
  }

  return response.json();
}

export async function generateCustomAuditSequence(lead: Lead): Promise<EmailTemplate[]> {
  const response = await fetch('/api/leads/generate-custom-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate customized audit sequence');
  }

  const data = await response.json();
  return data.sequence;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch('/api/campaigns');
  if (!response.ok) throw new Error('Failed to load campaigns');
  const data = await response.json();
  return data.campaigns;
}

export async function createCampaign(payload: {
  name: string;
  category: string;
  targetIndustry: string;
  targetLocation: string;
  leadIds: string[];
}): Promise<Campaign> {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to create campaign');
  const data = await response.json();
  return data.campaign;
}

export async function dispatchOutreachSequence(campaignId: string, leadIds: string[]) {
  const response = await fetch(`/api/campaigns/${campaignId}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadIds }),
  });

  if (!response.ok) throw new Error('Failed to dispatch sequence');
  return response.json();
}

export async function fetchAnalytics(params?: { range?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.category) query.set('category', params.category);

  const response = await fetch(`/api/analytics?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to load analytics');
  return response.json();
}

export async function fetchLeads(params?: { industry?: string; status?: string; campaignId?: string }): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (params?.industry) query.set('industry', params.industry);
  if (params?.status) query.set('status', params.status);
  if (params?.campaignId) query.set('campaignId', params.campaignId);

  const response = await fetch(`/api/leads?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to load leads');
  const data = await response.json();
  return data.leads;
}
