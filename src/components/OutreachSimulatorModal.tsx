import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, Clock, Mail, MousePointerClick, Calendar, Loader2, Sparkles } from 'lucide-react';
import { Lead } from '../types';
import { dispatchOutreachSequence } from '../services/api';

interface OutreachSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  selectedLeadIds: string[];
  campaignId: string;
  onDispatchSuccess: (updatedCampaign: any) => void;
}

export const OutreachSimulatorModal: React.FC<OutreachSimulatorModalProps> = ({
  isOpen,
  onClose,
  leads,
  selectedLeadIds,
  campaignId,
  onDispatchSuccess
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultStats, setResultStats] = useState<any | null>(null);

  if (!isOpen) return null;

  const targetCount = selectedLeadIds.length > 0 ? selectedLeadIds.length : Math.min(leads.length, 6);

  const startSimulation = async () => {
    setIsRunning(true);
    setLogs([]);
    setResultStats(null);

    // Step 1 simulation
    setCurrentStep(1);
    setLogs(prev => [
      ...prev,
      `[T+0d] Initiating Step 1: "How Your Business Looks Online" for ${targetCount} small businesses...`
    ]);

    await new Promise(r => setTimeout(r, 600));
    setLogs(prev => [
      ...prev,
      `[T+0d] Injected merge tags ({{first_name}}, {{company_name}}), sender: contact@handos.co, link: handos.co`
    ]);

    // Step 2 simulation
    await new Promise(r => setTimeout(r, 700));
    setCurrentStep(2);
    setLogs(prev => [
      ...prev,
      `[T+3d] Scheduling Step 2: "How Your Client Intake Process Looks Like" to address manual paperwork & phone-tag bottlenecks...`
    ]);

    // Step 3 simulation
    await new Promise(r => setTimeout(r, 700));
    setCurrentStep(3);
    setLogs(prev => [
      ...prev,
      `[T+7d] Scheduling Step 3: "Centralized Dashboard & Member Intake" offering tailored executive walkthrough...`
    ]);

    try {
      const res = await dispatchOutreachSequence(campaignId || 'camp-1', selectedLeadIds);
      setResultStats(res.stats);
      setLogs(prev => [
        ...prev,
        `[Complete] Successfully dispatched ${res.stats.sent} messages! Recorded ${res.stats.opened} opens, ${res.stats.clicked} link clicks to handos.co, and ${res.stats.demosScheduled} scheduled demos.`
      ]);
      onDispatchSuccess(res.campaign);
    } catch (e: any) {
      setLogs(prev => [...prev, `[Error] ${e.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Simulate 3-Step Outreach Dispatch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-300 leading-relaxed">
            Simulate sending the full 3-step value audit sequence to <strong className="text-cyan-300">{targetCount} selected organizations</strong>. Tracks deliverability, A/B variant split, recipient opens, and click-throughs to schedule a demo at <strong className="text-white">handos.co</strong>.
          </p>

          {/* Sequence Steps Progression Indicator */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: 'Day 1: Online Appearance Audit' },
              { num: 2, label: 'Day 3: Client Intake Friction' },
              { num: 3, label: 'Day 7: Centralized Dashboard' }
            ].map(s => {
              const active = currentStep >= s.num;
              return (
                <div
                  key={s.num}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    active
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-xs font-mono font-bold mb-1">Step {s.num}</div>
                  <div className="text-[11px] font-medium leading-tight">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Simulation Output Logs */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1.5">
            {logs.length === 0 ? (
              <span className="text-slate-600">Click below to start sequence dispatch simulation...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>

          {/* Result Stats Box */}
          {resultStats && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-slate-400 block">Delivered</span>
                <span className="font-mono text-base font-bold text-white">{resultStats.delivered}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Opens & Clicks</span>
                <span className="font-mono text-base font-bold text-cyan-300">
                  {resultStats.opened} / {resultStats.clicked}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Demos on handos.co</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  {resultStats.demosScheduled}
                </span>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={startSimulation}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Dispatch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Sequence Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
