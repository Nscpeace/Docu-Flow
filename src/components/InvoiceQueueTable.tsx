import React, { useState } from 'react';
import { InvoiceDocument } from '../types/invoice';
import { downloadCsvLedger } from '../utils/accountingPayloads';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Download,
  Filter,
  FileText,
  Send,
  Building,
} from 'lucide-react';

interface InvoiceQueueTableProps {
  invoices: InvoiceDocument[];
  onSelectInvoice: (invoiceId: string) => void;
  onApproveInvoice: (invoice: InvoiceDocument) => void;
  onOpenUpload: () => void;
}

export const InvoiceQueueTable: React.FC<InvoiceQueueTableProps> = ({
  invoices,
  onSelectInvoice,
  onApproveInvoice,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'staged' | 'exception' | 'approved'>('all');
  const [erpFilter, setErpFilter] = useState<'all' | 'xero' | 'quickbooks'>('all');

  const filteredInvoices = invoices.filter((inv) => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      inv.supplier.name.toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.lineItems.some((li) => li.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;

    // ERP filter
    if (erpFilter !== 'all' && inv.targetErp !== erpFilter) return false;

    return true;
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Table Controls Toolbar */}
      <div className="p-4 bg-[#141C2E] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supplier, invoice #, or line items..."
            className="w-full bg-[#182338] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Controls & Bulk Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-700 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('exception')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'exception'
                  ? 'bg-amber-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Exceptions ({invoices.filter((i) => i.status === 'exception').length})
            </button>
            <button
              onClick={() => setStatusFilter('staged')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'staged'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Staged ({invoices.filter((i) => i.status === 'staged').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved ({invoices.filter((i) => i.status === 'approved').length})
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={() => downloadCsvLedger(invoices)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            title="Download full AP ledger in CSV format"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0E1422] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Document / Supplier</th>
              <th className="py-3 px-3">Invoice #</th>
              <th className="py-3 px-3">Issue Date</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Confidence</th>
              <th className="py-3 px-3">Validation Status</th>
              <th className="py-3 px-3">Target ERP</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No invoices match current filters.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isMath = !inv.validation.mathValid;
                const isDup = inv.validation.isDuplicate;
                const isApproved = inv.status === 'approved';
                const isException = inv.status === 'exception';

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#151D2E] transition-colors group cursor-pointer"
                    onClick={() => onSelectInvoice(inv.id)}
                  >
                    {/* Supplier & Filename */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {inv.supplier.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                            {inv.fileName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Invoice Number */}
                    <td className="py-3.5 px-3 font-mono text-slate-300 font-medium">
                      {inv.invoiceNumber}
                    </td>

                    {/* Issue Date */}
                    <td className="py-3.5 px-3 font-mono text-slate-400">
                      {inv.issueDate}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-3 font-mono text-slate-400">
                      {inv.dueDate}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                      ${inv.totalAmount.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">
                        {inv.currency}
                      </span>
                    </td>

                    {/* AI Confidence */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          inv.confidenceScore >= 0.95
                            ? 'text-emerald-400'
                            : inv.confidenceScore >= 0.85
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {Math.round(inv.confidenceScore * 100)}%
                      </span>
                    </td>

                    {/* Validation Status */}
                    <td className="py-3.5 px-3">
                      {isDup ? (
                        <span className="text-red-400 flex items-center gap-1 font-mono text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Duplicate Sentry
                        </span>
                      ) : isMath ? (
                        <span className="text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Math Delta: ${Math.abs(inv.validation.mathDiscrepancy).toFixed(2)}
                        </span>
                      ) : !inv.validation.supplierMatched ? (
                        <span className="text-purple-400 flex items-center gap-1 font-mono text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Unmapped Contact
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Arithmetic Verified
                        </span>
                      )}
                    </td>

                    {/* Target ERP */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          inv.targetErp === 'xero' ? 'text-[#00B4D8]' : 'text-[#2CA01C]'
                        }`}
                      >
                        {inv.targetErp === 'xero' ? 'Xero Draft' : 'QuickBooks'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Open in Verification Studio"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {!isDup && inv.validation.mathValid && !isApproved && (
                          <button
                            onClick={() => onApproveInvoice(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            Stage
                          </button>
                        )}

                        {isApproved && (
                          <span className="text-[11px] font-mono text-emerald-400 font-medium">
                            Approved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
