import React, { useState, useRef } from 'react';
import { InvoiceDocument } from '../types/invoice';
import { INITIAL_INVOICES } from '../data/mockLedger';
import { validateInvoice, suggestAccountCode } from '../utils/validation';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FolderOpen,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (newInvoice: InvoiceDocument) => void;
  existingInvoices: InvoiceDocument[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
  existingInvoices,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStatus('Uploading document stream...');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setProcessingStatus('Invoking Gemini 3.8 Flash Multimodal OCR...');

        try {
          const response = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type || 'image/png',
              fileName: file.name,
            }),
          });

          const result = await response.json();
          setProcessingStatus('Evaluating arithmetic invariants & duplicate checks...');

          const rawData = result.data || {};
          const isPdf = file.type.includes('pdf') || file.name.endsWith('.pdf');

          // Build line items with GL code recommendations
          const lineItems = (rawData.lineItems || []).map((li: any, idx: number) => {
            const suggestion = suggestAccountCode(li.description, rawData.supplierName);
            return {
              id: `li-live-${idx + 1}-${Date.now()}`,
              description: li.description || 'General Service Item',
              quantity: Number(li.quantity) || 1,
              unitPrice: Number(li.unitPrice) || Number(li.amount) || 0,
              amount: Number(li.amount) || (Number(li.quantity || 1) * Number(li.unitPrice || 0)),
              suggestedAccountCode: suggestion.code,
              suggestedAccountName: suggestion.name,
              codingConfidence: suggestion.confidence,
            };
          });

          const subtotal = Number(rawData.subtotal) || lineItems.reduce((s: number, i: any) => s + i.amount, 0);
          const taxTotal = Number(rawData.taxTotal) || 0;
          const totalAmount = Number(rawData.totalAmount) || (subtotal + taxTotal);

          const draftDoc: Partial<InvoiceDocument> = {
            id: `doc-${Date.now()}`,
            fileName: file.name,
            fileType: isPdf ? 'pdf' : 'image',
            fileSizeKb: Math.round(file.size / 1024) || 120,
            receivedAt: new Date().toISOString(),
            status: 'processing',
            supplier: {
              name: rawData.supplierName || 'Unregistered Vendor Inc',
              taxId: rawData.supplierTaxId,
              address: rawData.supplierAddress,
              isNewSupplier: true,
            },
            invoiceNumber: rawData.invoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`,
            issueDate: rawData.issueDate || new Date().toISOString().slice(0, 10),
            dueDate: rawData.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            currency: rawData.currency || 'USD',
            lineItems,
            subtotal,
            taxTotal,
            totalAmount,
            confidenceScore: rawData.confidenceScore || 0.94,
            targetErp: 'xero',
          };

          // Deterministic validation
          const validation = validateInvoice(draftDoc, existingInvoices);
          draftDoc.validation = validation;
          draftDoc.status = validation.mathValid && !validation.isDuplicate ? 'staged' : 'exception';

          setTimeout(() => {
            setIsProcessing(false);
            onInvoiceCreated(draftDoc as InvoiceDocument);
            onClose();
          }, 600);
        } catch (fetchErr: any) {
          console.error(fetchErr);
          setErrorMsg('Failed to process with Gemini: ' + (fetchErr?.message || 'Network error'));
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg('Error reading file: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Instant preloaded scenario loader
  const handleLoadPreset = (presetId: string) => {
    const found = INITIAL_INVOICES.find((i) => i.id === presetId);
    if (!found) return;

    // Clone with fresh ID and current timestamp
    const cloned: InvoiceDocument = {
      ...found,
      id: `doc-clone-${Date.now()}`,
      receivedAt: new Date().toISOString(),
    };

    onInvoiceCreated(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141C2E] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Intake Document into Extraction Pipeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drop your own PDF / image, or pick from our verification test suite.
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-950/30'
                : 'border-slate-700 hover:border-slate-500 bg-[#0E1422]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="text-sm font-semibold text-white">
                  {processingStatus}
                </span>
                <span className="text-xs text-slate-400">
                  Multimodal vision parsing & arithmetic checks running...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-400 rounded-full flex items-center justify-center mb-1">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Drag and drop invoice (PDF, PNG, JPG) or click to browse
                </span>
                <span className="text-xs text-slate-500">
                  Supports multi-page invoices, receipts, and delivery bills up to 25MB
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset Test Suite Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                Pre-Loaded Verification Scenarios
              </label>
              <span className="text-[11px] text-slate-500">Instant intake</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleLoadPreset('doc-001')}
                className="p-3 text-left bg-[#0F1626] border border-slate-800 hover:border-blue-500/60 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-blue-400">
                    Acme Cloud Services
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    Clean Staging
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  INV-2026-9041 · $2,180.00 · 100% matched, ready for Xero
                </p>
              </button>

              <button
                onClick={() => handleLoadPreset('doc-003')}
                className="p-3 text-left bg-[#0F1626] border border-slate-800 hover:border-amber-500/60 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400">
                    Apex Office Depot
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                    Math Discrepancy
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  APX-4410 · $30 unallocated variance triggering exception
                </p>
              </button>

              <button
                onClick={() => handleLoadPreset('doc-004')}
                className="p-3 text-left bg-[#0F1626] border border-slate-800 hover:border-red-500/60 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-red-400">
                    Acme Duplicate Sentry
                  </span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded">
                    Duplicate Bill
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  INV-2026-8812 · Blocked to prevent double payment
                </p>
              </button>

              <button
                onClick={() => handleLoadPreset('doc-005')}
                className="p-3 text-left bg-[#0F1626] border border-slate-800 hover:border-purple-500/60 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-purple-400">
                    Kyoto Precision Corp
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded">
                    New Supplier
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  KPI-5021 · $3,200.00 · International vendor onboarding
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141C2E] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
