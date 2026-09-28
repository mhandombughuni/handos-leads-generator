import React, { useState } from 'react';
import { Campaign } from '../types';
import { Sliders, Trophy, TrendingUp, AlertCircle, CheckCircle, Zap, Percent, RefreshCw, BarChart2 } from 'lucide-react';

interface ABTestingPanelProps {
  campaigns: Campaign[];
  onTriggerRebalance?: () => void;
}

export const ABTestingPanel: React.FC<ABTestingPanelProps> = ({
  campaigns,
  onTriggerRebalance
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [autoBanditEnabled, setAutoBanditEnabled] = useState<boolean>(true);
  const [splitRatio, setSplitRatio] = useState<number>(80); // 80% to winner

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
  const abData = activeCampaign?.abTest;

  if (!activeCampaign || !abData) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        No campaign active for A/B testing.
      </div>
    );
  }

  const isBWinning = abData.winner === 'B';
  const isAWinning = abData.winner === 'A';

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase mb-1">
              <Sliders className="w-4 h-4" />
              <span>Multi-Armed Bandit Optimization</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Automated A/B Open Rate Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dynamically tests subject lines and audit angles (Direct Observation vs Complimentary Audit). Automatically promotes winning variants once statistical confidence exceeds 90%.
            </p>
          </div>

          {/* Campaign Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Campaign:</span>
            <select
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Winner Highlight Box */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Statistical Winner:
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  Variant {abData.winner} ({isBWinning ? 'Complimentary Audit' : 'Direct Observation'})
                </span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                  {abData.confidencePercentage}% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {abData.recommendation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-400">Traffic Routing:</span>
            <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded">
              {splitRatio}% Winner / {100 - splitRatio}% Challenger
            </span>
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Variant A */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isAWinning
              ? 'bg-slate-900/90 border-emerald-500/70 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Variant A
                </span>
                {isAWinning && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    Current Winner
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Direct Observation Angle
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                {abData.variantA.openRate}%
              </span>
              <p className="text-[11px] text-slate-400">Open Rate</p>
            </div>
          </div>

          <div className="space-y-2 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
            <p className="text-slate-400">
              Tested Subject: <span className="text-slate-200 font-medium">"Quick observation: how &#123;&#123;company_name&#125;&#125; looks to customers online"</span>
            </p>
            <p className="text-slate-400">
              Hook Style: <span className="text-slate-300">Curiosity & first-impression breakdown</span>
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <span className="block text-slate-400 text-[11px]">Sent / Delivered</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {abData.variantA.sent} / {abData.variantA.delivered}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <span className="block text-slate-400 text-[11px]">CTR to handos.co</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums">
                {abData.variantA.clickRate}%
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <span className="block text-slate-400 text-[11px]">Replies</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {abData.variantA.replied}
              </span>
            </div>
          </div>
        </div>

        {/* Variant B */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isBWinning
              ? 'bg-slate-900/90 border-emerald-500/70 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Variant B
                </span>
                {isBWinning && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    + {abData.openRateLift}% Lift (Leader)
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Complimentary Audit Angle
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {abData.variantB.openRate}%
              </span>
              <p className="text-[11px] text-slate-400">Open Rate</p>
            </div>
          </div>

          <div className="space-y-2 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
            <p className="text-slate-400">
              Tested Subject: <span className="text-slate-200 font-medium">"Complimentary digital presence audit for &#123;&#123;company_name&#125;&#125;"</span>
            </p>
            <p className="text-slate-400">
              Hook Style: <span className="text-slate-300">High-value complimentary teardown & operational blueprint</span>
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <span className="block text-slate-400 text-[11px]">Sent / Delivered</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {abData.variantB.sent} / {abData.variantB.delivered}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <span className="block text-slate-400 text-[11px]">CTR to handos.co</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums">
                {abData.variantB.clickRate}%
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <span className="block text-slate-400 text-[11px]">Replies</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {abData.variantB.replied}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Allocation Controls */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Automated Traffic Allocation Policy
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBanditEnabled}
              onChange={e => setAutoBanditEnabled(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
            />
            <span>Auto-shift traffic based on statistical p-value</span>
          </label>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          When enabled, the lead dispatch engine tests incoming contacts 50/50 for the first 30 sends. Once statistical confidence reaches {abData.confidencePercentage}%, the engine dynamically adjusts allocation to <strong className="text-white">{splitRatio}%</strong> for the winning message, leaving <strong className="text-white">{100 - splitRatio}%</strong> for challenger exploration.
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Winning Variant Weight ({splitRatio}%)</span>
            <span>Challenger Weight ({100 - splitRatio}%)</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={splitRatio}
            onChange={e => setSplitRatio(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
};
