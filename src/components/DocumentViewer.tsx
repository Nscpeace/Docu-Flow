import React, { useState } from 'react';
import { InvoiceDocument } from '../types/invoice';
import { ZoomIn, ZoomOut, Maximize2, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DocumentViewerProps {
  invoice: InvoiceDocument;
  selectedField: string | null;
  onSelectField: (fieldName: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  invoice,
  selectedField,
  onSelectField,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(150, Math.max(75, prev + delta)));
  };

  const isMathError = !invoice.validation.mathValid;
  const isDuplicate = invoice.validation.isDuplicate;

  return (
    <div className="flex flex-col h-full bg-[#0D121F] border border-slate-800 rounded-xl overflow-hidden">
      {/* Top Document Toolbar */}
      <div className="px-4 py-3 bg-[#111827] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-200 font-medium truncate max-w-[200px]">
            {invoice.fileName}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono">
            {invoice.fileSizeKb} KB
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 uppercase font-mono">
            {invoice.fileType}
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
              showOverlays
                ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle OCR Bounding Boxes"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>AI Bounding Boxes</span>
          </button>

          <div className="flex items-center border border-slate-700 rounded bg-[#161F30]">
            <button
              onClick={() => handleZoom(-15)}
              className="p-1 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-xs text-slate-400">
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(15)}
              className="p-1 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 hover:text-white transition-colors border-l border-slate-700"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Canvas Workspace */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-[#080B11]">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-[620px] bg-white text-slate-900 rounded-lg shadow-2xl p-8 min-h-[820px] relative select-none font-sans text-xs"
        >
          {/* Header Zone: Supplier & Invoice Title */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6 relative">
            {/* Supplier Information Bounding Area */}
            <div
              onClick={() => onSelectField('supplier')}
              className={`p-2 rounded cursor-pointer transition-all relative ${
                showOverlays
                  ? selectedField === 'supplier'
                    ? 'ring-2 ring-blue-500 bg-blue-50/60'
                    : 'hover:ring-1 hover:ring-blue-300'
                  : ''
              }`}
            >
              {showOverlays && (
                <span className="absolute -top-2.5 left-1 text-[9px] font-mono px-1 bg-blue-600 text-white rounded">
                  VENDOR
                </span>
              )}
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {invoice.supplier.name}
              </h2>
              <p className="text-slate-500 mt-1 max-w-[280px] leading-relaxed">
                {invoice.supplier.address || 'Corporate Billing Division'}
              </p>
              {invoice.supplier.taxId && (
                <p className="text-slate-600 font-mono mt-0.5 text-[11px]">
                  Tax ID / VAT: {invoice.supplier.taxId}
                </p>
              )}
              {invoice.supplier.email && (
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {invoice.supplier.email}
                </p>
              )}
            </div>

            {/* Invoice Meta Bounding Area */}
            <div
              onClick={() => onSelectField('invoiceDetails')}
              className={`text-right p-2 rounded cursor-pointer transition-all relative ${
                showOverlays
                  ? selectedField === 'invoiceDetails'
                    ? 'ring-2 ring-blue-500 bg-blue-50/60'
                    : 'hover:ring-1 hover:ring-blue-300'
                  : ''
              }`}
            >
              {showOverlays && (
                <span className="absolute -top-2.5 right-1 text-[9px] font-mono px-1 bg-blue-600 text-white rounded">
                  INVOICE_META
                </span>
              )}
              <div className="text-2xl font-black text-slate-800 tracking-wider font-mono">
                INVOICE
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-end gap-3">
                  <span className="text-slate-500">Invoice No:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-end gap-3">
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="font-mono text-slate-800">
                    {invoice.issueDate}
                  </span>
                </div>
                <div className="flex justify-end gap-3">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-mono text-slate-800">
                    {invoice.dueDate}
                  </span>
                </div>
                <div className="flex justify-end gap-3">
                  <span className="text-slate-500">Currency:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {invoice.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill-To Section */}
          <div className="mb-6 pb-4 border-b border-slate-100 flex justify-between text-slate-600">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Billed To
              </span>
              <p className="font-semibold text-slate-900">Acme Global Holdings Inc.</p>
              <p className="text-slate-500">Attn: Accounts Payable</p>
              <p className="text-slate-500">450 Mission Street, Floor 14</p>
              <p className="text-slate-500">San Francisco, CA 94105</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Payment Terms
              </span>
              <p className="font-mono text-slate-700">Net 30 Days</p>
              <p className="text-slate-500">Direct ACH / Wire Transfer</p>
            </div>
          </div>

          {/* Line Items Table Bounding Area */}
          <div
            onClick={() => onSelectField('lineItems')}
            className={`mb-6 p-2 rounded cursor-pointer transition-all relative ${
              showOverlays
                ? selectedField === 'lineItems'
                  ? 'ring-2 ring-blue-500 bg-blue-50/40'
                  : 'hover:ring-1 hover:ring-blue-300'
                : ''
            }`}
          >
            {showOverlays && (
              <span className="absolute -top-2.5 left-1 text-[9px] font-mono px-1 bg-blue-600 text-white rounded">
                LINE_ITEMS ({invoice.lineItems.length})
              </span>
            )}
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center w-16">Qty</th>
                  <th className="py-2 text-right w-24">Unit Price</th>
                  <th className="py-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-3 text-slate-800 pr-2">
                      <p className="font-medium">{item.description}</p>
                      {item.suggestedAccountName && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          GL: {item.suggestedAccountCode} · {item.suggestedAccountName}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-700">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-medium text-slate-900">
                      ${item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals & Arithmetic Verification */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div
              onClick={() => onSelectField('totals')}
              className={`w-64 p-3 rounded cursor-pointer transition-all relative ${
                showOverlays
                  ? isMathError
                    ? 'ring-2 ring-amber-500 bg-amber-50/70'
                    : selectedField === 'totals'
                    ? 'ring-2 ring-blue-500 bg-blue-50/60'
                    : 'hover:ring-1 hover:ring-blue-300'
                  : ''
              }`}
            >
              {showOverlays && (
                <span
                  className={`absolute -top-2.5 right-1 text-[9px] font-mono px-1 rounded text-white ${
                    isMathError ? 'bg-amber-600' : 'bg-blue-600'
                  }`}
                >
                  {isMathError ? 'ARITHMETIC_MISMATCH' : 'FINANCIAL_TOTALS'}
                </span>
              )}

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800">
                    ${invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax / VAT:</span>
                  <span className="font-mono text-slate-800">
                    ${invoice.taxTotal.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Due:</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      isMathError ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    ${invoice.totalAmount.toFixed(2)} {invoice.currency}
                  </span>
                </div>
              </div>

              {/* Invariant Warning inside Document Preview if Mismatched */}
              {isMathError && (
                <div className="mt-3 p-2 bg-amber-100/90 border border-amber-300 rounded text-[10px] text-amber-900 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Arithmetic Mismatch</span>
                    Items + Tax = ${(invoice.subtotal + invoice.taxTotal).toFixed(2)},
                    differing by ${Math.abs(invoice.validation.mathDiscrepancy).toFixed(2)}.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Thank you for your business. Remittance to accounts@company.com</span>
            <span className="font-mono">Page 1 of 1</span>
          </div>

          {/* Watermark badge if duplicate */}
          {isDuplicate && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-500/80 text-red-600/90 font-black text-3xl px-6 py-2 rounded-lg pointer-events-none uppercase tracking-widest bg-white/70 backdrop-blur-xs">
              DUPLICATE BILL
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Ticker */}
      <div className="px-4 py-2.5 bg-[#111827] border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">OCR Confidence:</span>
          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                invoice.confidenceScore >= 0.9
                  ? 'bg-emerald-500'
                  : invoice.confidenceScore >= 0.8
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.round(invoice.confidenceScore * 100)}%` }}
            />
          </div>
          <span className="font-mono text-slate-200">
            {Math.round(invoice.confidenceScore * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {invoice.validation.mathValid ? (
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Arithmetic Verified ($0.00 delta)
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              Variance: ${Math.abs(invoice.validation.mathDiscrepancy).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
