import React, { useState } from 'react';
import { Lead } from '../types';
import { X, Smartphone, Globe, ShieldAlert, CheckCircle2, AlertOctagon, Mail, Calendar, ArrowRight, Loader2, Copy, Check } from 'lucide-react';
import { generateCustomAuditSequence } from '../services/api';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSendSequence: (lead: Lead) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onSendSequence
}) => {
  const [customSequence, setCustomSequence] = useState<any[] | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!lead) return null;

  const handleGeneratePersonalized = async () => {
    setLoadingAI(true);
    try {
      const seq = await generateCustomAuditSequence(lead);
      setCustomSequence(seq);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{lead.companyName}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Audit Score: {lead.audit.score}/100
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{lead.contactName} ({lead.title})</span>
              <span>·</span>
              <span>{lead.city}, {lead.state} {lead.zipCode}</span>
              <span>·</span>
              <span>{lead.industry}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Diagnostic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 mb-2">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Online First Impression</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lead.audit.auditHighlights.firstImpression}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Template: <span className="text-slate-200">{lead.audit.templateEraEstimate}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertOctagon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Client Intake Friction</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lead.audit.auditHighlights.intakeFriction}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Intake Type: <span className="text-amber-300 font-medium">{lead.audit.intakeProcessType}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Operations Dashboard</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lead.audit.auditHighlights.dashboardMissingImpact}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Response Tracking: <span className="text-rose-400">Manual / Disconnected</span>
              </div>
            </div>
          </div>

          {/* Revenue Risk & Detected Issues */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Estimated Business Impact for {lead.companyName}
            </h4>
            <p className="text-sm text-rose-200/90 font-medium mb-3">
              "{lead.audit.potentialRevenueLossNote}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {lead.audit.detectedPainPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Sequence Preview & Generator */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  3-Step Value Audit Outreach Sequence
                </h3>
                <p className="text-xs text-slate-400">
                  Offers a free audit of online appearance and internal client intake with demo link at <span className="text-cyan-300 font-mono">handos.co</span>
                </p>
              </div>
              <button
                onClick={handleGeneratePersonalized}
                disabled={loadingAI}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
              >
                {loadingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Personalizing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Regenerate Custom Audit Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Sequence Cards */}
            <div className="space-y-4">
              {(customSequence || [
                {
                  step: 1,
                  dayOffset: 1,
                  stepTitle: 'Step 1: How Your Business Looks to Customers Online',
                  subject: `Quick observation: how ${lead.companyName} looks to customers online`,
                  body: `Hi ${lead.firstName},\n\nI was reviewing local organizations in ${lead.city} and noticed how ${lead.companyName} appears to prospective customers browsing on mobile devices today.\n\nWe put together a complimentary 5-point digital presence audit covering your mobile viewport rendering and customer trust factors.\n\nNo sales pitch—just an objective teardown of how ${lead.companyName} looks from a customer's perspective.\n\nIf you'd like to review your complimentary audit together on a quick 10-minute screen share, you can pick a time here:\nhttps://handos.co\n\nBest regards,\nThe Handos Advisory Team\nhandos.co`,
                  focus: 'Mobile unresponsiveness & initial trust barrier'
                },
                {
                  step: 2,
                  dayOffset: 3,
                  stepTitle: 'Step 2: How Your Client Intake Process Looks Like',
                  subject: `How your client intake process looks like at ${lead.companyName}`,
                  body: `Hi ${lead.firstName},\n\nFollowing up on my note earlier this week about ${lead.companyName}'s online presence.\n\nBeyond visual design, another critical area where organizations leak inquiries is their client intake process. Relying on ${lead.audit.intakeProcessType.toLowerCase()} creates hours of manual friction and lost opportunities.\n\nWe mapped out a frictionless intake workflow tailored for ${lead.companyName} that allows clients to submit details directly from any phone and syncs with your schedule.\n\nYou can book a quick walk-through here:\nhttps://handos.co\n\nBest,\nClient Solutions at Handos\nhandos.co`,
                  focus: 'Intake friction and manual paperwork drop-offs'
                },
                {
                  step: 3,
                  dayOffset: 7,
                  stepTitle: 'Step 3: Centralized Member Intake & Response Tracking Dashboard',
                  subject: `How do you manage member intake and track responses through a centralized dashboard?`,
                  body: `Hi ${lead.firstName},\n\nOne final thought as you look ahead at operations at ${lead.companyName}.\n\nHow do you currently track member or client intake and monitor real-time status across your organization?\n\nAt Handos, we help organizations consolidate modern web touchpoints and internal workflows into a centralized operational dashboard where every incoming intake is instantly tracked with response alerts.\n\nFeel free to pick a convenient 10-minute slot here:\nhttps://handos.co\n\nThank you for your time, ${lead.firstName}!\n\nWarm regards,\nThe Handos Advisory Team\nhandos.co`,
                  focus: 'Centralized operational visibility & response tracking'
                }
              ]).map((msg: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-cyan-400">
                        {msg.stepTitle || `Step ${msg.step}: Day ${msg.dayOffset}`}
                      </span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-xs text-slate-400">
                        Focus: {msg.focusPainPoint || msg.focus}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`Subject: ${msg.subjectVariantA || msg.subject}\n\n${msg.bodyVariantA || msg.body}`, i)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedStep === i ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-300">
                      Subject: <span className="text-white font-semibold">{msg.subjectVariantA || msg.subject}</span>
                    </p>
                  </div>

                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 leading-relaxed max-h-48 overflow-y-auto">
                    {msg.bodyVariantA || msg.body}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <div className="text-xs text-slate-400">
            Recipient: <span className="text-slate-200 font-mono">{lead.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSendSequence(lead);
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-colors"
            >
              <span>Dispatch 3-Step Sequence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
