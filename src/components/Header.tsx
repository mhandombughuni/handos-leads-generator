import React from 'react';
import { Sparkles, BarChart3, Search, MailCheck, Sliders, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'prospect' | 'sequence' | 'abtest' | 'analytics';
  setActiveTab: (tab: 'prospect' | 'sequence' | 'abtest' | 'analytics') => void;
  leadCount: number;
  openExport: () => void;
  onQuickSimulate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  leadCount,
  openExport,
  onQuickSimulate
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Value Proposition */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="font-bold text-white text-lg tracking-wider">H</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">Handos</span>
                <span className="text-xs text-cyan-400 font-mono font-medium bg-cyan-950/70 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                  Lead Funnel Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Digital Presence & Intake Overhaul Outreach for Small Businesses
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('prospect')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'prospect'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Prospecting</span>
              {leadCount > 0 && (
                <span className="text-[11px] font-mono text-cyan-400/90 ml-1">
                  ({leadCount})
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sequence')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'sequence'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MailCheck className="w-4 h-4" />
              <span>3-Step Sequence</span>
            </button>

            <button
              onClick={() => setActiveTab('abtest')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'abtest'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>A/B Optimizer</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & ROI</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onQuickSimulate}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              title="Test email dispatch sequence simulation with realistic open/click dynamics"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Outreach</span>
            </button>

            <button
              onClick={openExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700/80 border border-slate-700 transition-colors"
            >
              <span>Export Reports</span>
            </button>

            <a
              href="https://handos.co"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition-colors ml-1"
            >
              <span>handos.co</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
