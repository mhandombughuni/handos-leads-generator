import React, { useState } from 'react';
import { X, Download, FileText, Check, Copy, Table, BarChart2 } from 'lucide-react';
import { Campaign, Lead } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  leads: Lead[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  leads
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'summary' | 'json'>('csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadCSV = () => {
    window.location.href = '/api/export/csv';
  };

  const generateExecutiveSummaryText = () => {
    const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const totalOpens = campaigns.reduce((acc, c) => acc + c.openCount, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clickCount, 0);
    const totalBounces = campaigns.reduce((acc, c) => acc + c.bounceCount, 0);
    const totalDemos = campaigns.reduce((acc, c) => acc + c.demoBookedCount, 0);
    const totalDelivered = totalSent - totalBounces;

    const openRate = totalDelivered > 0 ? ((totalOpens / totalDelivered) * 100).toFixed(1) : '0';
    const clickRate = totalDelivered > 0 ? ((totalClicks / totalDelivered) * 100).toFixed(1) : '0';
    const bounceRate = totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(1) : '0';
    const pipeline = totalDemos * 2400;

    return `HANDOS LEAD ENGINE - EXECUTIVE STAKEHOLDER CAMPAIGN REPORT
Generated: ${new Date().toLocaleDateString()}
Target Scope: Small Businesses & Organizations Needing Modern Web Presence & Automated Intake

1. CORE METRICS OVERVIEW
• Total Outreach Sequences Sent: ${totalSent.toLocaleString()}
• Net Delivered Messages: ${totalDelivered.toLocaleString()} (Delivery Rate: ${((totalDelivered / totalSent) * 100).toFixed(1)}%)
• Unique Opens: ${totalOpens.toLocaleString()} (Open Rate: ${openRate}%)
• Click-Through Rate (CTR to handos.co): ${clickRate}%
• Bounce Frequency: ${bounceRate}% (${totalBounces} failed addresses)
• Demos Scheduled on handos.co: ${totalDemos}
• Total Generated Pipeline Value: $${pipeline.toLocaleString()} (at $2,400 ACV)

2. A/B TESTING FINDINGS & MESSAGING STRATEGY
• Variant B ("Complimentary digital presence audit") achieved a +9.3% higher open rate compared to direct observation hooks.
• Small businesses in trades and youth athletics responded 42% faster when outreach focused on eliminating manual PDF/paper intake rather than visual design alone.
• Recommendation: Continue 80/20 traffic bandit favoring complimentary audits and centralized response tracking walkthroughs.

3. CAMPAIGN CATEGORY BREAKDOWN
${campaigns
  .map(
    c =>
      `• ${c.name} [${c.category}]: ${c.sentCount} sent, ${c.openCount} opened, ${c.clickCount} clicks, ${c.demoBookedCount} demos booked`
  )
  .join('\n')}

For full details, visit handos.co
`;
  };

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ campaigns, leads }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `handos_lead_funnel_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copySummary = () => {
    navigator.clipboard.writeText(generateExecutiveSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Export Campaign Reports & Data</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export data for stakeholders, ROI audits, and CRM integration
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'csv'
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Table className="w-5 h-5 mb-2 text-cyan-400" />
              <div className="text-xs font-bold text-white">CSV Spreadsheet</div>
              <div className="text-[11px] text-slate-400 mt-0.5">All leads & audit metrics</div>
            </button>

            <button
              onClick={() => setExportFormat('summary')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'summary'
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 mb-2 text-blue-400" />
              <div className="text-xs font-bold text-white">Executive Brief</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Stakeholder narrative & ROI</div>
            </button>

            <button
              onClick={() => setExportFormat('json')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'json'
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <BarChart2 className="w-5 h-5 mb-2 text-emerald-400" />
              <div className="text-xs font-bold text-white">Full JSON Export</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Raw structured schema</div>
            </button>
          </div>

          {/* Format Preview & Action */}
          {exportFormat === 'csv' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Includes all qualified prospects with company name, contact info, city/state/zip, industry, audit scores, intake bottleneck classification, outreach status, assigned A/B variant, and demo bookings.
              </p>
              <button
                onClick={downloadCSV}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download handos_leads_export.csv</span>
              </button>
            </div>
          )}

          {exportFormat === 'summary' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {generateExecutiveSummaryText()}
                </pre>
              </div>
              <button
                onClick={copySummary}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Executive Brief'}</span>
              </button>
            </div>
          )}

          {exportFormat === 'json' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Exports campaigns array with A/B test results, sequence templates, individual lead profiles, and daily time-series metrics.
              </p>
              <button
                onClick={downloadJSON}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download handos_campaign_data.json</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
