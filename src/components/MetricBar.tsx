import React from 'react';
import { InvoiceDocument } from '../types/invoice';

interface MetricBarProps {
  invoices: InvoiceDocument[];
}

export const MetricBar: React.FC<MetricBarProps> = ({ invoices }) => {
  const totalCount = invoices.length;
  const exceptionCount = invoices.filter((i) => i.status === 'exception').length;
  const stagedCount = invoices.filter((i) => i.status === 'staged').length;
  const approvedCount = invoices.filter((i) => i.status === 'approved').length;

  const totalValue = invoices
    .filter((i) => i.status !== 'rejected')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const avgConfidence = Math.round(
    (invoices.reduce((acc, i) => acc + (i.confidenceScore || 0.9), 0) /
      (invoices.length || 1)) *
      100
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Ingested Documents</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">
            {totalCount}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>{invoices.filter(i => i.fileType === 'pdf').length} PDFs</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>{invoices.filter(i => i.fileType === 'image').length} Scans/Images</span>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Auto-Extraction Accuracy</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {avgConfidence}%
          </span>
          <span className="text-xs text-slate-500 font-mono">mean confidence</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Multimodal Vision AI</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>Arithmetic checked</span>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Exception Queue</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className={`text-2xl font-bold font-mono tabular-nums ${exceptionCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {exceptionCount}
          </span>
          <span className="text-xs text-amber-500/80 font-mono">requires review</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Math deltas</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>Duplicates</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>New vendors</span>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Staged Draft Bills</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-blue-400">
            {stagedCount + approvedCount}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {approvedCount} approved
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Xero Bills</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>QuickBooks Online</span>
        </div>
      </div>
    </div>
  );
};
