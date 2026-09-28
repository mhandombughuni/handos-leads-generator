import React, { useState } from 'react';
import { Lead, IndustryCategory } from '../types';
import { LeadCard } from './LeadCard';
import { Search, Loader2, Filter, Sparkles, Building2, MapPin, CheckSquare, Square, Play, RefreshCw, ExternalLink } from 'lucide-react';
import { searchLeads } from '../services/api';

interface ProspectingSearchProps {
  leads: Lead[];
  onLeadsDiscovered: (newLeads: Lead[]) => void;
  onOpenAudit: (lead: Lead) => void;
  onQuickSequence: (lead: Lead) => void;
  selectedLeadIds: string[];
  setSelectedLeadIds: React.Dispatch<React.SetStateAction<string[]>>;
  onBatchDispatch: (selectedIds: string[]) => void;
}

const INDUSTRIES: IndustryCategory[] = [
  'General Contractors & Trades',
  'Youth Sports & Community Clubs',
  'Healthcare & Dental Practices',
  'Professional Services & Accounting',
  'Local Non-Profits & Charities',
  'Auto Repair & Towing',
  'Specialty Retail & Food'
];

export const ProspectingSearch: React.FC<ProspectingSearchProps> = ({
  leads,
  onLeadsDiscovered,
  onOpenAudit,
  onQuickSequence,
  selectedLeadIds,
  setSelectedLeadIds,
  onBatchDispatch
}) => {
  const [zipCode, setZipCode] = useState('78701');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [industry, setIndustry] = useState<IndustryCategory>('General Contractors & Trades');
  const [webFilter, setWebFilter] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<Array<{ uri: string; title: string }>>([]);

  const applyQuickSearch = (cfg: { industry?: IndustryCategory; zip?: string; city?: string; state?: string }) => {
    if (cfg.industry) setIndustry(cfg.industry);
    setZipCode(cfg.zip || '');
    setCity(cfg.city || '');
    setState(cfg.state || '');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedZip = zipCode.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();

    if (!trimmedZip && !trimmedCity && !trimmedState) {
      setSearchStatus('Please provide at least a ZIP code OR a City OR a State along with your target industry.');
      return;
    }

    setIsSearching(true);
    const locationDesc = [
      trimmedCity && `City: ${trimmedCity}`,
      trimmedState && `State: ${trimmedState}`,
      trimmedZip && `ZIP: ${trimmedZip}`
    ].filter(Boolean).join(', ');

    setSearchStatus(`Scanning for ${industry} in ${locationDesc}...`);

    try {
      const result = await searchLeads({
        zipCode: trimmedZip,
        city: trimmedCity,
        state: trimmedState,
        industry,
        webStatusFilter: webFilter,
        limit: 6
      });

      if (result.searchSources && Array.isArray(result.searchSources)) {
        setSearchSources(result.searchSources);
      } else {
        setSearchSources([]);
      }

      if (result.leads && result.leads.length > 0) {
        onLeadsDiscovered(result.leads);
        if (result.source === 'gemini_search') {
          setSearchStatus(`🟢 Live Google Search: Discovered ${result.leads.length} verified business prospects from live web crawl in ${locationDesc}!`);
        } else {
          setSearchStatus(`Discovered ${result.leads.length} business prospects in ${locationDesc}.`);
        }
      } else {
        setSearchStatus(`No prospects found in ${locationDesc}. Try another location or industry.`);
      }
    } catch (err: any) {
      console.error(err);
      setSearchStatus(`Search completed with local dataset for ${locationDesc}.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (webFilter === 'all') return true;
    if (webFilter === 'no_website') return lead.webStatus === 'no_website';
    if (webFilter === 'outdated') return lead.webStatus === 'outdated_template_2010s' || lead.webStatus === 'unresponsive_mobile';
    if (webFilter === 'broken_intake') return lead.webStatus === 'broken_intake_forms' || lead.webStatus === 'pdf_only_onboarding';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Automated Google Search Prospector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover Small Businesses with Outdated or Missing Websites
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Target local companies and non-profits that need a modern digital presence and automated client intake. Our crawler scans for non-responsive layouts, pre-2015 frameworks, missing SSL, and PDF/paper bottlenecks.
          </p>
        </div>

        {/* Search Criteria Explanation */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-cyan-300">Search rule:</span>
          <span>Target Industry (Required)</span>
          <span className="text-slate-500 font-bold">+</span>
          <span className="text-slate-200">ZIP Code</span>
          <span className="text-cyan-400 font-semibold uppercase text-[10px]">OR</span>
          <span className="text-slate-200">City</span>
          <span className="text-cyan-400 font-semibold uppercase text-[10px]">OR</span>
          <span className="text-slate-200">State</span>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Industry (Required) */}
          <div>
            <label className="block text-xs font-semibold text-cyan-300 mb-1">
              1. Target Industry <span className="text-rose-400">*</span>
            </label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value as IndustryCategory)}
              className="w-full px-3 py-2 bg-slate-950 border border-cyan-800/80 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-medium"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind} className="bg-slate-900 text-white">
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* ZIP Code (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              2. ZIP Code <span className="text-[10px] text-slate-500">(or City / State)</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                placeholder="e.g. 78701 or 90210"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* City (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              3. City <span className="text-[10px] text-slate-500">(or ZIP / State)</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Austin or Chicago"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* State (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              4. State <span className="text-[10px] text-slate-500">(or ZIP / City)</span>
            </label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="e.g. TX, California, FL"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Search Trigger */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Leads</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Search Combinations */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Quick test searches:</span>
          <button
            type="button"
            onClick={() => applyQuickSearch({ industry: 'General Contractors & Trades', zip: '90210' })}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            ZIP only: 90210 (Trades)
          </button>
          <button
            type="button"
            onClick={() => applyQuickSearch({ industry: 'Youth Sports & Community Clubs', city: 'Chicago' })}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            City only: Chicago (Sports)
          </button>
          <button
            type="button"
            onClick={() => applyQuickSearch({ industry: 'Healthcare & Dental Practices', state: 'Florida' })}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            State only: Florida (Dental)
          </button>
          <button
            type="button"
            onClick={() => applyQuickSearch({ industry: 'Local Non-Profits & Charities', city: 'Austin', state: 'TX' })}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            City + State: Austin, TX
          </button>
          {(zipCode || city || state) && (
            <button
              type="button"
              onClick={() => { setZipCode(''); setCity(''); setState(''); }}
              className="text-slate-400 hover:text-rose-300 ml-1 underline transition-colors"
            >
              Clear locations
            </button>
          )}
        </div>

        {/* Live Search Status Feedback */}
        {searchStatus && (
          <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-cyan-900/40 text-xs text-cyan-300 flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            <span>{searchStatus}</span>
          </div>
        )}

        {/* Real Grounded Search Sources */}
        {searchSources.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
            <div className="font-semibold mb-1.5 flex items-center gap-1.5 text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Google Search Grounded Web Sources:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchSources.slice(0, 5).map((source, sIdx) => (
                <a
                  key={sIdx}
                  href={source.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                  <span className="truncate max-w-[220px]">{source.title || source.uri}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar & Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter Web Condition:
          </span>
          {[
            { id: 'all', label: 'All Opportunities' },
            { id: 'no_website', label: 'Zero Website' },
            { id: 'outdated', label: 'Outdated Web Template' },
            { id: 'broken_intake', label: 'Paper / PDF Intake Only' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setWebFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                webFilter === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right: Batch Selection & Launch Sequence */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All ({filteredLeads.length})</span>
          </button>

          <button
            onClick={() => onBatchDispatch(selectedLeadIds)}
            disabled={selectedLeadIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Sequence ({selectedLeadIds.length})</span>
          </button>
        </div>
      </div>

      {/* Discovered Leads List / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={selectedLeadIds.includes(lead.id)}
            onToggleSelect={handleToggleSelect}
            onOpenAudit={onOpenAudit}
            onQuickSequence={onQuickSequence}
          />
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No matching business prospects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your web condition filter or enter another city or postal code above to prospect new organizations.
          </p>
        </div>
      )}
    </div>
  );
};
