import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProspectingSearch } from './components/ProspectingSearch';
import { SequenceBuilder } from './components/SequenceBuilder';
import { ABTestingPanel } from './components/ABTestingPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LeadDetailModal } from './components/LeadDetailModal';
import { ExportModal } from './components/ExportModal';
import { OutreachSimulatorModal } from './components/OutreachSimulatorModal';
import { Lead, Campaign, DailyMetric } from './types';
import { INITIAL_LEADS, INITIAL_CAMPAIGNS, HISTORICAL_METRICS } from './data/defaultData';
import { fetchLeads, fetchCampaigns, fetchAnalytics } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'prospect' | 'sequence' | 'abtest' | 'analytics'>('prospect');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>(HISTORICAL_METRICS);
  
  // Selection and modal state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [inspectedLead, setInspectedLead] = useState<Lead | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(INITIAL_CAMPAIGNS[0]?.id || 'camp-1');

  // Load latest state from server on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [loadedLeads, loadedCampaigns, analyticsRes] = await Promise.all([
          fetchLeads().catch(() => INITIAL_LEADS),
          fetchCampaigns().catch(() => INITIAL_CAMPAIGNS),
          fetchAnalytics().catch(() => null)
        ]);

        if (loadedLeads && loadedLeads.length > 0) setLeads(loadedLeads);
        if (loadedCampaigns && loadedCampaigns.length > 0) setCampaigns(loadedCampaigns);
        if (analyticsRes?.dailyTrends) setDailyMetrics(analyticsRes.dailyTrends);
      } catch (e) {
        console.warn('Initial server sync failed, using default state', e);
      }
    }
    loadInitialData();
  }, []);

  const handleLeadsDiscovered = (newLeads: Lead[]) => {
    setLeads(prev => {
      const existingIds = new Set(prev.map(l => l.id));
      const filteredNew = newLeads.filter(l => !existingIds.has(l.id));
      return [...filteredNew, ...prev];
    });
  };

  const handleBatchDispatch = (ids: string[]) => {
    setSelectedLeadIds(ids);
    setIsSimulatorOpen(true);
  };

  const handleOpenAudit = (lead: Lead) => {
    setInspectedLead(lead);
  };

  const handleQuickSequence = (lead: Lead) => {
    setInspectedLead(lead);
  };

  const handleSendSingleSequence = (lead: Lead) => {
    setSelectedLeadIds([lead.id]);
    setIsSimulatorOpen(true);
  };

  const handleDispatchSuccess = (updatedCampaign: Campaign) => {
    setCampaigns(prev =>
      prev.map(c => (c.id === updatedCampaign.id ? updatedCampaign : c))
    );
    // Refresh leads list to reflect contact status
    fetchLeads().then(setLeads).catch(console.warn);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leadCount={leads.length}
        openExport={() => setIsExportOpen(true)}
        onQuickSimulate={() => setIsSimulatorOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'prospect' && (
          <ProspectingSearch
            leads={leads}
            onLeadsDiscovered={handleLeadsDiscovered}
            onOpenAudit={handleOpenAudit}
            onQuickSequence={handleQuickSequence}
            selectedLeadIds={selectedLeadIds}
            setSelectedLeadIds={setSelectedLeadIds}
            onBatchDispatch={handleBatchDispatch}
          />
        )}

        {activeTab === 'sequence' && (
          <SequenceBuilder
            sampleLead={leads[0]}
            onLaunchSequence={() => {
              setIsSimulatorOpen(true);
            }}
          />
        )}

        {activeTab === 'abtest' && (
          <ABTestingPanel
            campaigns={campaigns}
            onTriggerRebalance={() => setIsSimulatorOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            campaigns={campaigns}
            dailyMetrics={dailyMetrics}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Handos Lead Generator Funnel · Modern Web & Automated Client Intake Outreach
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">Sender: contact@handos.co</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="font-mono text-slate-400">Demo Target: https://handos.co</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LeadDetailModal
        lead={inspectedLead}
        onClose={() => setInspectedLead(null)}
        onSendSequence={handleSendSingleSequence}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        campaigns={campaigns}
        leads={leads}
      />

      <OutreachSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        leads={leads}
        selectedLeadIds={selectedLeadIds}
        campaignId={activeCampaignId}
        onDispatchSuccess={handleDispatchSuccess}
      />
    </div>
  );
}
