import React, { useState } from 'react';
import { InvoiceDocument } from '../types/invoice';
import {
  generateXeroPayload,
  generateQuickBooksPayload,
  downloadJsonFile,
} from '../utils/accountingPayloads';
import {
  X,
  Copy,
  Check,
  Download,
  Send,
  Code,
  ShieldCheck,
} from 'lucide-react';

interface AccountingExportModalProps {
  invoice: InvoiceDocument;
  isOpen: boolean;
  onClose: () => void;
  onStageSuccess: (invoice: InvoiceDocument) => void;
}

export const AccountingExportModal: React.FC<AccountingExportModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onStageSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'xero' | 'quickbooks'>(invoice.targetErp || 'xero');
  const [copied, setCopied] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  if (!isOpen) return null;

  const xeroPayload = generateXeroPayload(invoice);
  const qboPayload = generateQuickBooksPayload(invoice);

  const activePayload = activeTab === 'xero' ? xeroPayload : qboPayload;
  const jsonString = JSON.stringify(activePayload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const filename = `${activeTab}_draft_bill_${invoice.invoiceNumber}.json`;
    downloadJsonFile(filename, activePayload);
  };

  const handleSimulatePush = () => {
    setIsPushing(true);
    setTimeout(() => {
      setIsPushing(false);
      onStageSuccess({
        ...invoice,
        status: 'staged',
        targetErp: activeTab,
        stagedAt: new Date().toISOString(),
      });
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#141C2E] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Staging Payload Inspector · {invoice.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact formatted payload mapped to destination accounting schema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls & Actions Bar */}
        <div className="px-6 py-3 bg-[#0F1626] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('xero')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'xero'
                  ? 'bg-[#00B4D8]/20 text-[#00B4D8] border border-[#00B4D8]/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#00B4D8]"></span>
              Xero ACCPAY API (v2.0)
            </button>
            <button
              onClick={() => setActiveTab('quickbooks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'quickbooks'
                  ? 'bg-[#2CA01C]/20 text-[#2CA01C] border border-[#2CA01C]/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#2CA01C]"></span>
              QuickBooks Online Bill API (v3)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </div>

        {/* Payload Preview */}
        <div className="flex-1 overflow-auto p-6 bg-[#080B11] font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {jsonString}
          </pre>
        </div>

        {/* Modal Footer Safeguard & Push */}
        <div className="px-6 py-4 bg-[#141C2E] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Safeguard: Staged as <strong className="text-slate-200">DRAFT</strong>. Accounting ledger balance untouched until controller approval.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleSimulatePush}
              disabled={isPushing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isPushing ? 'Staging Bill...' : `Stage to ${activeTab === 'xero' ? 'Xero' : 'QuickBooks'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
