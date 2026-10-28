import React, { useState } from 'react';
import { InvoiceDocument } from '../types/invoice';
import {
  AlertTriangle,
  AlertCircle,
  Wand2,
  ExternalLink,
  ShieldAlert,
  Building,
  RotateCcw,
} from 'lucide-react';

interface ExceptionCenterProps {
  invoices: InvoiceDocument[];
  onSelectInvoice: (invoiceId: string) => void;
  onAutoFixMath: (invoiceId: string) => void;
  onRejectDuplicate: (invoiceId: string) => void;
  onApproveInvoice: (invoice: InvoiceDocument) => void;
}

export const ExceptionCenter: React.FC<ExceptionCenterProps> = ({
  invoices,
  onSelectInvoice,
  onAutoFixMath,
  onRejectDuplicate,
  onApproveInvoice,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'math' | 'duplicate' | 'vendor'>('all');

  // Exceptions are invoices with status === 'exception' or failed rules
  const exceptionInvoices = invoices.filter((i) => i.status === 'exception');

  const filtered = exceptionInvoices.filter((inv) => {
    if (filterType === 'math') return !inv.validation.mathValid;
    if (filterType === 'duplicate') return inv.validation.isDuplicate;
    if (filterType === 'vendor') return !inv.validation.supplierMatched;
    return true;
  });

  const mathCount = exceptionInvoices.filter((i) => !i.validation.mathValid).length;
  const duplicateCount = exceptionInvoices.filter((i) => i.validation.isDuplicate).length;
  const vendorCount = exceptionInvoices.filter((i) => !i.validation.supplierMatched).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Exception Triage & Human-in-the-Loop Queue
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Invoices failing arithmetic tolerance, duplicate hash validation, or supplier matching are quarantined here.
              Under the DocuFlow security safeguard, nothing is staged or posted to accounting software without explicit resolution.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Quarantined</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                {exceptionInvoices.length}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Blocked Payout Risk</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-red-400">
                ${exceptionInvoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            All Exceptions ({exceptionInvoices.length})
          </button>
          <button
            onClick={() => setFilterType('math')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'math'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Arithmetic Invariant Deltas ({mathCount})
          </button>
          <button
            onClick={() => setFilterType('duplicate')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'duplicate'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Duplicate Sentry Alerts ({duplicateCount})
          </button>
          <button
            onClick={() => setFilterType('vendor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'vendor'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Unmapped Vendors ({vendorCount})
          </button>
        </div>
      </div>

      {/* Exception Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Exception Queue Clear</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All ingested invoices currently comply with mathematical invariants, duplicate hashes, and supplier mapping rules.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv) => {
            const flags = inv.validation.flags;
            const isMath = !inv.validation.mathValid;
            const isDup = inv.validation.isDuplicate;

            return (
              <div
                key={inv.id}
                className="bg-[#111827] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Invoice details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">
                        {inv.supplier.name}
                      </span>
                      <span className="text-slate-500 font-mono">·</span>
                      <span className="text-xs font-mono text-slate-300">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-slate-500 font-mono">·</span>
                      <span className="text-xs font-mono text-slate-400">
                        {inv.issueDate}
                      </span>
                      <span className="text-slate-500 font-mono">·</span>
                      <span className="text-xs font-mono font-bold text-slate-100">
                        ${inv.totalAmount.toFixed(2)} {inv.currency}
                      </span>
                    </div>

                    {/* Flag Messages */}
                    <div className="space-y-2 mt-3">
                      {flags.map((flag) => (
                        <div
                          key={flag.id}
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                            flag.severity === 'critical'
                              ? 'bg-red-950/30 border-red-800/80 text-red-200'
                              : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                          }`}
                        >
                          {flag.severity === 'critical' ? (
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <span className="font-semibold block">{flag.title}</span>
                            <span className="text-slate-300">{flag.message}</span>
                            {flag.resolutionSuggestion && (
                              <p className="text-[11px] text-slate-400 mt-1 italic">
                                Recommended Action: {flag.resolutionSuggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => onSelectInvoice(inv.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Verification Studio
                    </button>

                    {isMath && (
                      <button
                        onClick={() => onAutoFixMath(inv.id)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Auto-Balance Line Items
                      </button>
                    )}

                    {isDup && (
                      <button
                        onClick={() => onRejectDuplicate(inv.id)}
                        className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        Reject Duplicate Submission
                      </button>
                    )}

                    {!isDup && inv.validation.mathValid && (
                      <button
                        onClick={() => onApproveInvoice(inv)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        Approve & Stage to ERP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
