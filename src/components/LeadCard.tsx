import React from 'react';
import { Lead } from '../types';
import { Globe, AlertTriangle, FileText, CheckCircle2, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenAudit: (lead: Lead) => void;
  onQuickSequence: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  selected,
  onToggleSelect,
  onOpenAudit,
  onQuickSequence
}) => {
  const isNoWebsite = lead.webStatus === 'no_website';

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'demo_booked':
        return 'text-emerald-400 font-semibold';
      case 'clicked':
        return 'text-cyan-400';
      case 'opened':
        return 'text-blue-400';
      case 'replied':
        return 'text-amber-400 font-medium';
      case 'bounced':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatStatus = (status: Lead['status']) => {
    switch (status) {
      case 'demo_booked':
        return 'Demo Booked (handos.co)';
      case 'clicked':
        return 'Audit Link Clicked';
      case 'opened':
        return 'Email Opened';
      case 'replied':
        return 'Audit Inquired';
      case 'bounced':
        return 'Delivery Bounced';
      default:
        return 'Ready for Outreach';
    }
  };

  return (
    <div
      className={`group relative rounded-xl border p-5 transition-all duration-200 bg-slate-900/70 hover:bg-slate-900/90 ${
        selected
          ? 'border-cyan-500/70 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/40'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Top Header & Selection */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(lead.id)}
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-slate-900 cursor-pointer"
            aria-label={`Select ${lead.companyName}`}
          />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white tracking-tight truncate group-hover:text-cyan-200 transition-colors">
              {lead.companyName}
            </h3>
            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="font-medium text-slate-300">{lead.contactName}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{lead.title}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {lead.city}, {lead.state} {lead.zipCode}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Footprint Score Gauge */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs text-slate-400">Audit Score:</span>
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                lead.audit.score < 30
                  ? 'text-rose-400'
                  : lead.audit.score < 45
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {lead.audit.score}/100
            </span>
          </div>
          <p className="text-[11px] text-rose-400/90 font-medium">Critical Modernization Need</p>
        </div>
      </div>

      {/* Website & Digital Status Bar */}
      <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 mb-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[70%]">
            <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            {isNoWebsite ? (
              <span className="text-rose-400 font-medium">No registered website (Offline / Social only)</span>
            ) : (
              <a
                href={lead.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400/90 hover:underline truncate"
              >
                {lead.websiteUrl}
              </a>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-500 uppercase">
            {lead.industry.split(' ')[0]}
          </span>
        </div>

        {/* Friction flags */}
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="text-amber-400/90 flex items-center gap-1 flex-shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Intake Bottleneck:
          </span>
          <span className="text-slate-300 truncate">{lead.audit.intakeProcessType}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400 truncate">{lead.audit.templateEraEstimate}</span>
        </div>
      </div>

      {/* Primary Detected Pain Points */}
      <div className="space-y-1.5 mb-4">
        {lead.audit.detectedPainPoints.slice(0, 2).map((pt, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
            <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{pt}</span>
          </div>
        ))}
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-slate-500 mr-1.5">Funnel Status:</span>
          <span className={getStatusColor(lead.status)}>
            {formatStatus(lead.status)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAudit(lead)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-md transition-colors"
          >
            Full Teardown
          </button>
          <button
            onClick={() => onQuickSequence(lead)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/60 border border-cyan-700/60 rounded-md transition-colors"
          >
            <span>Generate Pitch</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
