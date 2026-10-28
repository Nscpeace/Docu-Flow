import React, { useState } from 'react';
import { InvoiceDocument, LineItem } from '../types/invoice';
import { MASTER_CHART_OF_ACCOUNTS } from '../data/mockLedger';
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Code2,
  Sparkles,
  Wand2,
  Ban,
  Building,
} from 'lucide-react';

interface StructuredDataEditorProps {
  invoice: InvoiceDocument;
  onUpdateInvoice: (updated: InvoiceDocument) => void;
  onApproveAndStage: (invoice: InvoiceDocument) => void;
  onRejectInvoice: (invoiceId: string, reason: string) => void;
  onOpenPayloadModal: () => void;
  selectedField: string | null;
}

export const StructuredDataEditor: React.FC<StructuredDataEditorProps> = ({
  invoice,
  onUpdateInvoice,
  onApproveAndStage,
  onRejectInvoice,
  onOpenPayloadModal,
  selectedField,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Duplicate invoice entry detected.');

  const validation = invoice.validation;
  const mathDiscrepancy = validation.mathDiscrepancy;
  const isMathValid = validation.mathValid;

  // Handle supplier edits
  const handleSupplierChange = (field: string, value: string) => {
    onUpdateInvoice({
      ...invoice,
      supplier: {
        ...invoice.supplier,
        [field]: value,
      },
    });
  };

  // Handle general invoice fields
  const handleFieldChange = (field: keyof InvoiceDocument, value: any) => {
    onUpdateInvoice({
      ...invoice,
      [field]: value,
    });
  };

  // Line item updates
  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...invoice.lineItems];
    const targetItem = { ...updatedItems[index], [field]: value };

    // Auto-update amount if quantity or unitPrice changed
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : targetItem.quantity;
      const p = field === 'unitPrice' ? Number(value) : targetItem.unitPrice;
      targetItem.amount = Number((q * p).toFixed(2));
    }

    updatedItems[index] = targetItem;

    // Recalculate subtotal
    const newSubtotal = updatedItems.reduce((acc, it) => acc + (it.amount || 0), 0);

    onUpdateInvoice({
      ...invoice,
      lineItems: updatedItems,
      subtotal: Number(newSubtotal.toFixed(2)),
    });
  };

  // Change GL Account Code
  const handleAccountCodeChange = (index: number, code: string) => {
    const coa = MASTER_CHART_OF_ACCOUNTS.find((a) => a.code === code);
    const updatedItems = [...invoice.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      suggestedAccountCode: code,
      suggestedAccountName: coa?.name || '',
      codingConfidence: 1.0, // manually confirmed by user
    };
    onUpdateInvoice({
      ...invoice,
      lineItems: updatedItems,
    });
  };

  // Add new line item
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `li-${Date.now()}`,
      description: 'New Expense Item',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      suggestedAccountCode: '420',
      suggestedAccountName: 'IT Software & Subscriptions',
      codingConfidence: 1.0,
    };
    onUpdateInvoice({
      ...invoice,
      lineItems: [...invoice.lineItems, newItem],
    });
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    const updated = invoice.lineItems.filter((_, idx) => idx !== index);
    const newSubtotal = updated.reduce((acc, it) => acc + (it.amount || 0), 0);
    onUpdateInvoice({
      ...invoice,
      lineItems: updated,
      subtotal: Number(newSubtotal.toFixed(2)),
    });
  };

  // 1-Click Auto Fix for Arithmetic Discrepancy
  const handleAutoFixMathDiscrepancy = () => {
    if (Math.abs(mathDiscrepancy) < 0.01) return;

    // If totalAmount is higher, add a balancing line item (e.g. shipping or adjustment)
    if (mathDiscrepancy < 0) {
      const deltaAmount = Math.abs(mathDiscrepancy);
      const balancingItem: LineItem = {
        id: `li-fix-${Date.now()}`,
        description: 'Shipping & Delivery Handling Adjustment',
        quantity: 1,
        unitPrice: deltaAmount,
        amount: deltaAmount,
        suggestedAccountCode: '500',
        suggestedAccountName: 'Freight, Logistics & Shipping',
        codingConfidence: 1.0,
      };

      const updatedItems = [...invoice.lineItems, balancingItem];
      const newSubtotal = Number((invoice.subtotal + deltaAmount).toFixed(2));

      onUpdateInvoice({
        ...invoice,
        lineItems: updatedItems,
        subtotal: newSubtotal,
      });
    } else {
      // Alternatively align totalAmount to match Subtotal + Tax
      onUpdateInvoice({
        ...invoice,
        totalAmount: Number((invoice.subtotal + invoice.taxTotal).toFixed(2)),
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
      {/* Editor Header */}
      <div className="px-5 py-3.5 bg-[#141C2E] border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Structured Extraction Data
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
              {invoice.targetErp === 'xero' ? 'Xero Bill Format' : 'QuickBooks Online'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Review and adjust extracted entities before staging to accounting.
          </p>
        </div>

        {/* ERP Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-700 rounded-lg">
          <button
            onClick={() => handleFieldChange('targetErp', 'xero')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              invoice.targetErp === 'xero'
                ? 'bg-[#00B4D8]/20 text-[#00B4D8] border border-[#00B4D8]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Xero
          </button>
          <button
            onClick={() => handleFieldChange('targetErp', 'quickbooks')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              invoice.targetErp === 'quickbooks'
                ? 'bg-[#2CA01C]/20 text-[#2CA01C] border border-[#2CA01C]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            QuickBooks
          </button>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Validation Alert Banner (if issues exist) */}
        {validation.flags.length > 0 && (
          <div className="space-y-2">
            {validation.flags.map((flag) => (
              <div
                key={flag.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  flag.severity === 'critical'
                    ? 'bg-red-950/40 border-red-800/80 text-red-200'
                    : flag.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-blue-950/30 border-blue-800/60 text-blue-200'
                }`}
              >
                {flag.severity === 'critical' ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : flag.severity === 'warning' ? (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{flag.title}</div>
                  <div className="text-slate-300 mt-0.5">{flag.message}</div>
                  {flag.resolutionSuggestion && (
                    <div className="text-xs text-slate-400 mt-1 italic">
                      Suggestion: {flag.resolutionSuggestion}
                    </div>
                  )}
                  {flag.canAutoFix && !isMathValid && (
                    <button
                      onClick={handleAutoFixMathDiscrepancy}
                      className="mt-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-xs flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <Wand2 className="w-3 h-3" />
                      Auto-Balance: Add ${Math.abs(mathDiscrepancy).toFixed(2)} Line Item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section 1: Supplier & Contact */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            selectedField === 'supplier'
              ? 'border-blue-500/80 bg-blue-950/20'
              : 'border-slate-800 bg-[#0F1626]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              Supplier Entity
            </label>
            {invoice.supplier.matchedId ? (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Matched in ERP Contacts
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400">
                New Contact Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Supplier Name</label>
              <input
                type="text"
                value={invoice.supplier.name}
                onChange={(e) => handleSupplierChange('name', e.target.value)}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tax ID / VAT #</label>
              <input
                type="text"
                value={invoice.supplier.taxId || ''}
                onChange={(e) => handleSupplierChange('taxId', e.target.value)}
                placeholder="e.g. US-94-3829104"
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Billing Address</label>
              <input
                type="text"
                value={invoice.supplier.address || ''}
                onChange={(e) => handleSupplierChange('address', e.target.value)}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoice Metadata & Dates */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            selectedField === 'invoiceDetails'
              ? 'border-blue-500/80 bg-blue-950/20'
              : 'border-slate-800 bg-[#0F1626]'
          }`}
        >
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Invoice Reference & Terms
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoice.invoiceNumber}
                onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                className={`w-full bg-[#161F30] border rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${
                  validation.isDuplicate ? 'border-red-500 text-red-300' : 'border-slate-700 focus:border-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Issue Date</label>
              <input
                type="date"
                value={invoice.issueDate}
                onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
              <input
                type="date"
                value={invoice.dueDate}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Currency</label>
              <select
                value={invoice.currency}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD ($)</option>
                <option value="CAD">CAD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Itemized Line Items & GL Coding */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            selectedField === 'lineItems'
              ? 'border-blue-500/80 bg-blue-950/20'
              : 'border-slate-800 bg-[#0F1626]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Line Items & Account Coding
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                ({invoice.lineItems.length} lines)
              </span>
            </div>
            <button
              onClick={handleAddLineItem}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Line
            </button>
          </div>

          <div className="space-y-3">
            {invoice.lineItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 bg-[#131B2C] border border-slate-800 rounded-lg text-xs space-y-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                      className="w-full bg-[#192438] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {invoice.lineItems.length > 1 && (
                    <button
                      onClick={() => handleRemoveLineItem(idx)}
                      className="mt-5 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="Delete line item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                      className="w-full bg-[#192438] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full bg-[#192438] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Total</label>
                    <div className="w-full bg-[#162032] border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono text-right font-semibold">
                      ${item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Account Coding Selector */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>Suggested Account:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 sm:max-w-[320px]">
                    <select
                      value={item.suggestedAccountCode}
                      onChange={(e) => handleAccountCodeChange(idx, e.target.value)}
                      className="w-full bg-[#192438] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    >
                      {MASTER_CHART_OF_ACCOUNTS.map((account) => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      {Math.round(item.codingConfidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Totals & Arithmetic Invariant Check */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            selectedField === 'totals'
              ? 'border-blue-500/80 bg-blue-950/20'
              : 'border-slate-800 bg-[#0F1626]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Financial Summary & Balance Check
            </label>
            {isMathValid ? (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Math Invariant Passed (0.00 delta)
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Discrepancy: ${Math.abs(mathDiscrepancy).toFixed(2)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Subtotal</label>
              <input
                type="number"
                step="0.01"
                value={invoice.subtotal}
                onChange={(e) => handleFieldChange('subtotal', Number(e.target.value))}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tax Total</label>
              <input
                type="number"
                step="0.01"
                value={invoice.taxTotal}
                onChange={(e) => handleFieldChange('taxTotal', Number(e.target.value))}
                className="w-full bg-[#161F30] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Total Due</label>
              <input
                type="number"
                step="0.01"
                value={invoice.totalAmount}
                onChange={(e) => handleFieldChange('totalAmount', Number(e.target.value))}
                className={`w-full bg-[#161F30] border rounded px-2.5 py-1.5 text-xs font-mono font-bold text-right focus:outline-none ${
                  !isMathValid
                    ? 'border-amber-500 text-amber-300'
                    : 'border-slate-700 text-white focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="p-4 bg-[#141C2E] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPayloadModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            Inspect {invoice.targetErp === 'xero' ? 'Xero' : 'QuickBooks'} Payload
          </button>

          <button
            onClick={() => setRejectModalOpen(true)}
            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-900/60 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onApproveAndStage(invoice)}
            disabled={validation.isDuplicate}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              validation.isDuplicate
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {invoice.status === 'approved'
              ? 'Re-Sync Staged Bill'
              : `Approve & Stage to ${invoice.targetErp === 'xero' ? 'Xero' : 'QuickBooks'}`}
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2">Reject Invoice Document</h4>
            <p className="text-xs text-slate-400 mb-4">
              Specify the reason for rejection. This will archive the document and log the action in the audit trail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full bg-[#161F30] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRejectInvoice(invoice.id, rejectReason);
                  setRejectModalOpen(false);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
