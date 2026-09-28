import React, { useState } from 'react';
import { EmailTemplate, Lead } from '../types';
import { DEFAULT_TEMPLATES } from '../data/defaultData';
import { Mail, Clock, Calendar, Check, Copy, ExternalLink, Sparkles, Eye, Code, ArrowRight } from 'lucide-react';

interface SequenceBuilderProps {
  sampleLead?: Lead;
  onLaunchSequence: (templates: EmailTemplate[]) => void;
}

export const SequenceBuilder: React.FC<SequenceBuilderProps> = ({
  sampleLead,
  onLaunchSequence
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');
  const [previewMode, setPreviewMode] = useState<'merged' | 'raw'>('merged');
  const [copied, setCopied] = useState(false);

  const currentTemplate = templates.find(t => t.step === activeStep) || templates[0];

  const previewFirstName = sampleLead ? sampleLead.firstName : 'Marcus';
  const previewCompanyName = sampleLead ? sampleLead.companyName : 'Lone Star Mechanical';

  const replaceMergeTags = (text: string) => {
    return text
      .replace(/{{first_name}}/g, previewFirstName)
      .replace(/{{company_name}}/g, previewCompanyName);
  };

  const getSubjectText = () => {
    const raw = activeVariant === 'A' ? currentTemplate.subjectVariantA : currentTemplate.subjectVariantB;
    return previewMode === 'merged' ? replaceMergeTags(raw) : raw;
  };

  const getBodyText = () => {
    const raw = activeVariant === 'A' ? currentTemplate.bodyVariantA : currentTemplate.bodyVariantB;
    return previewMode === 'merged' ? replaceMergeTags(raw) : raw;
  };

  const handleUpdateBody = (newBody: string) => {
    setTemplates(prev =>
      prev.map(t => {
        if (t.step === activeStep) {
          return {
            ...t,
            [activeVariant === 'A' ? 'bodyVariantA' : 'bodyVariantB']: newBody
          };
        }
        return t;
      })
    );
  };

  const handleUpdateSubject = (newSubject: string) => {
    setTemplates(prev =>
      prev.map(t => {
        if (t.step === activeStep) {
          return {
            ...t,
            [activeVariant === 'A' ? 'subjectVariantA' : 'subjectVariantB']: newSubject
          };
        }
        return t;
      })
    );
  };

  const copyEmail = () => {
    const full = `Subject: ${getSubjectText()}\n\n${getBodyText()}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sequence Header & Strategy Explanation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase mb-1">
            <Mail className="w-4 h-4" />
            <span>Consultative Value-First Funnel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            3-Step Automated Outreach Sequence
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Engineered specifically to avoid aggressive SaaS selling. Each follow-up offers a complimentary, zero-pressure audit diagnosing: 
            (1) online customer first impressions, (2) intake friction, and (3) centralized dashboard tracking. Every email includes personalized merge tags and direct link to schedule a demo at <span className="text-cyan-300 font-mono">handos.co</span>.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {templates.map(tmpl => {
            const isSelected = tmpl.step === activeStep;
            return (
              <button
                key={tmpl.step}
                onClick={() => setActiveStep(tmpl.step)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/70 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-mono font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                    Day {tmpl.dayOffset}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Step {tmpl.step} of 3
                  </span>
                </div>
                <h4 className={`text-sm font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {tmpl.step === 1 && 'How Your Business Looks Online'}
                  {tmpl.step === 2 && 'How Your Client Intake Looks'}
                  {tmpl.step === 3 && 'Centralized Dashboard & Tracking'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  Focus: {tmpl.focusPainPoint}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Preview Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Template Controls & Variant Toggles (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select A/B Testing Variant:
                </span>
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveVariant('A')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activeVariant === 'A'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Variant A (Observation)
                  </button>
                  <button
                    onClick={() => setActiveVariant('B')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activeVariant === 'B'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Variant B (Complimentary Audit)
                  </button>
                </div>
              </div>

              {/* Merge Tag Chips */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-slate-500">Tags:</span>
                <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px] text-cyan-400 font-mono">
                  {'{{first_name}}'}
                </code>
                <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px] text-cyan-400 font-mono">
                  {'{{company_name}}'}
                </code>
              </div>
            </div>

            {/* Subject Line Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Subject Line ({activeVariant === 'A' ? 'Variant A' : 'Variant B'})
              </label>
              <input
                type="text"
                value={activeVariant === 'A' ? currentTemplate.subjectVariantA : currentTemplate.subjectVariantB}
                onChange={e => handleUpdateSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Email Body Textarea */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Body Copy ({activeVariant === 'A' ? 'Variant A' : 'Variant B'})
              </label>
              <textarea
                rows={14}
                value={activeVariant === 'A' ? currentTemplate.bodyVariantA : currentTemplate.bodyVariantB}
                onChange={e => handleUpdateBody(e.target.value)}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* CTA & Audit Demo Link Note */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  Verified Call to Action: <strong className="font-mono">https://handos.co</strong>
                </span>
              </div>
              <span className="text-[11px] text-cyan-400/80 font-mono">Zero sales pressure</span>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Inbox Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recipient Inbox Preview
                </h3>
              </div>

              {/* Toggle Merge vs Raw */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setPreviewMode('merged')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    previewMode === 'merged'
                      ? 'bg-slate-800 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Merged View
                </button>
                <button
                  onClick={() => setPreviewMode('raw')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    previewMode === 'raw'
                      ? 'bg-slate-800 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Tags
                </button>
              </div>
            </div>

            {/* Email Header Simulation */}
            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4">
              <div className="flex items-center justify-between text-slate-400">
                <span>From: <strong className="text-slate-200">Handos Advisory &lt;contact@handos.co&gt;</strong></span>
                <span className="font-mono text-[11px] text-slate-500">Day {currentTemplate.dayOffset} Sequence</span>
              </div>
              <div className="text-slate-400">
                To: <strong className="text-slate-200">{previewFirstName} &lt;{previewFirstName.toLowerCase()}@{previewCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com&gt;</strong>
              </div>
              <div className="text-slate-400 pt-1 border-t border-slate-800">
                Subject: <strong className="text-white">{getSubjectText()}</strong>
              </div>
            </div>

            {/* Rendered Email Body */}
            <div className="flex-1 bg-slate-950 p-5 rounded-xl border border-slate-800/80 overflow-y-auto">
              <pre className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {getBodyText()}
              </pre>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={copyEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Subject & Body'}</span>
              </button>

              <button
                onClick={() => onLaunchSequence(templates)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <span>Save & Launch Sequence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
