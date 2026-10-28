import React, { useState } from 'react';
import {
  Inbox,
  FileSearch,
  Calculator,
  ShieldCheck,
  CheckCircle,
  FileText,
  Lock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const PipelineDiagram: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(3);

  const steps = [
    {
      num: 1,
      name: 'Document Intake',
      subtitle: 'Email & S3 / Folder / Drag & Drop',
      icon: Inbox,
      badge: 'Multi-Channel',
      description:
        'Captures incoming invoices from dedicated AP inboxes (e.g., invoices@company.com), cloud storage folders, and direct browser uploads.',
      tech: 'Express.js, Multer, Base64 Stream Parsing',
      safeguard: 'Pre-flight MIME type validation and malware sanitization.',
    },
    {
      num: 2,
      name: 'Multimodal AI Extraction',
      subtitle: 'Gemini 3.8 Flash Vision OCR',
      icon: FileSearch,
      badge: 'Vision Model',
      description:
        'Converts unstructured PDFs, scanned receipts, and image files into typed JSON entities (Supplier, Tax ID, Invoice No, Due Dates, Itemized Lines, Taxes, Totals).',
      tech: 'Gemini 3.8 Flash with Strict JSON Schema Enforcement',
      safeguard: 'Zero hallucinated formats via rigid responseSchema constraints.',
    },
    {
      num: 3,
      name: 'Deterministic Validation',
      subtitle: 'Arithmetic & Duplicate Gates',
      icon: Calculator,
      badge: 'Code Engine',
      description:
        'Code-level mathematical invariant validation: computes line items sum, tax additions, and checks subtotal + tax = grand total down to the cent. Compares hashes against historical ledger.',
      tech: 'Pure TypeScript Invariant Rules Engine',
      safeguard: 'Arithmetic checked in code; never relies on LLM arithmetic accuracy.',
    },
    {
      num: 4,
      name: 'Exception Queue Triage',
      subtitle: 'Human-in-the-Loop Routing',
      icon: ShieldCheck,
      badge: 'Quality Gate',
      description:
        'Any document with math discrepancies (delta > $0.01), duplicate hash collision, new unverified vendor, or confidence < 85% is held in the Exception Queue.',
      tech: 'Interactive Side-by-Side Review Studio',
      safeguard: 'Low-confidence extractions routed to human; automated blocking.',
    },
    {
      num: 5,
      name: 'Accounting Software Staging',
      subtitle: 'Xero & QuickBooks Online',
      icon: CheckCircle,
      badge: 'Draft Mode Only',
      description:
        'Stages bills into Xero Bills API (Status: DRAFT) or QuickBooks Online Bill API v3. Generates GL chart-of-accounts predictions based on historical postings.',
      tech: 'Xero ACCPAY API v2.0 & Intuit QBO Bill API v3',
      safeguard: 'Inviolable rule: Nothing is posted or authorized without explicit human sign-off.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" />
              Autonomous AP Architecture & Security Safeguards
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Designed for enterprise finance reliability. Combines multimodal vision AI with deterministic code gates so no unverified bill or duplicate invoice ever reaches your general ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
              Safe Staging Mode: Active
            </span>
          </div>
        </div>

        {/* Safeguard Pills / Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="p-3 bg-[#0D1321] border border-slate-800 rounded-lg flex items-start gap-2.5">
            <Calculator className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Arithmetic Checked in Code</span>
              <span className="text-slate-400 text-[11px]">
                Subtotals, taxes, and line sums are validated deterministically, bypassing LLM calculation limits.
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0D1321] border border-slate-800 rounded-lg flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Zero Unapproved Ledger Writes</span>
              <span className="text-slate-400 text-[11px]">
                Bills are only staged as DRAFT records in Xero/QBO; never marked AUTHORISED without sign-off.
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0D1321] border border-slate-800 rounded-lg flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Human-in-the-Loop Fallback</span>
              <span className="text-slate-400 text-[11px]">
                Low confidence (&lt;85%) and duplicates trigger immediate quarantine in the Exception Queue.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Flow Visualizer */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
          End-to-End Execution Pipeline (Click any stage to inspect)
        </h3>

        {/* Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = activeStep === s.num;

            return (
              <div
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-[#0F1626] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">
                      Step 0{s.num}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s.badge}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {s.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {s.subtitle}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Stage Deep-Dive */}
        {activeStep && (
          <div className="mt-6 p-5 bg-[#0A0E17] border border-slate-800 rounded-xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs font-mono text-blue-400">
                  Detailed Specifications: Stage 0{steps[activeStep - 1].num}
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {steps[activeStep - 1].name} · {steps[activeStep - 1].subtitle}
                </h4>
                <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  {steps[activeStep - 1].description}
                </p>
              </div>

              <div className="text-right space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Core Technology
                  </span>
                  <span className="text-xs font-mono text-slate-200">
                    {steps[activeStep - 1].tech}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Security Safeguard
                  </span>
                  <span className="text-xs text-emerald-400">
                    {steps[activeStep - 1].safeguard}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accounting System Compatibility Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Xero Box */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00B4D8]"></span>
              <h4 className="text-sm font-bold text-white">Xero Bills API Integration</h4>
            </div>
            <span className="text-xs font-mono text-[#00B4D8]">ACCPAY / Invoices v2.0</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5">
            <li>• Auto-maps Contacts via Legal Vendor Name & Tax ID</li>
            <li>• Line Items mapped to standard Account Codes (e.g. 408 Hosting, 500 Freight)</li>
            <li>• Invariant check ensures TaxType ('OUTPUT2' vs 'NONE') balances</li>
            <li>• Staged in 'DRAFT' status for final approval by financial controller</li>
          </ul>
        </div>

        {/* QuickBooks Online Box */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2CA01C]"></span>
              <h4 className="text-sm font-bold text-white">QuickBooks Online Bill API</h4>
            </div>
            <span className="text-xs font-mono text-[#2CA01C]">Bill Entity API v3</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5">
            <li>• Auto-populates VendorRef with historical vendor ID or auto-gen token</li>
            <li>• AccountBasedExpenseLineDetail populated per itemized charge</li>
            <li>• GlobalTaxCalculation aligned to TaxExcluded with verified tax total</li>
            <li>• Generates clean sync audit record with Document AI confidence rating</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
