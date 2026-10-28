import React, { useState } from 'react';
import { InvoiceDocument, AuditLogEntry } from './types/invoice';
import { INITIAL_INVOICES, INITIAL_AUDIT_LOGS } from './data/mockLedger';
import { validateInvoice } from './utils/validation';
import { Navbar } from './components/Navbar';
import { MetricBar } from './components/MetricBar';
import { InvoiceQueueTable } from './components/InvoiceQueueTable';
import { DocumentViewer } from './components/DocumentViewer';
import { StructuredDataEditor } from './components/StructuredDataEditor';
import { ExceptionCenter } from './components/ExceptionCenter';
import { PipelineDiagram } from './components/PipelineDiagram';
import { UploadModal } from './components/UploadModal';
import { AccountingExportModal } from './components/AccountingExportModal';
import {
  FileText,
  ChevronRight,
  ShieldCheck,
  History,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

export default function App() {
  const [invoices, setInvoices] = useState<InvoiceDocument[]>(INITIAL_INVOICES);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>('doc-001');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verification' | 'exceptions' | 'architecture'>('dashboard');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeInvoice = invoices.find((i) => i.id === activeInvoiceId) || invoices[0];
  const exceptionCount = invoices.filter((i) => i.status === 'exception').length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Select an invoice and navigate to Verification Studio
  const handleSelectInvoice = (id: string) => {
    setActiveInvoiceId(id);
    setActiveTab('verification');
  };

  // In-place invoice entity update (recalculates validation invariants)
  const handleUpdateInvoice = (updated: InvoiceDocument) => {
    const freshValidation = validateInvoice(updated, invoices);
    const validatedInvoice: InvoiceDocument = {
      ...updated,
      validation: freshValidation,
      // If it had math error and is now valid, promote from exception if no duplicate
      status:
        freshValidation.mathValid && !freshValidation.isDuplicate
          ? updated.status === 'exception'
            ? 'staged'
            : updated.status
          : 'exception',
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? validatedInvoice : inv)));
  };

  // Approve & Stage draft bill in accounting system
  const handleApproveAndStage = (invoice: InvoiceDocument) => {
    if (invoice.validation.isDuplicate) {
      showToast('Cannot stage: Duplicate invoice entry detected.');
      return;
    }

    const updated: InvoiceDocument = {
      ...invoice,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Controller (nscpeace1@gmail.com)',
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? updated : inv)));

    // Record audit event
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      timestamp: new Date().toISOString(),
      actor: 'Finance Controller',
      action: 'APPROVED',
      details: `Approved and staged draft bill #${invoice.invoiceNumber} ($${invoice.totalAmount.toFixed(
        2
      )} ${invoice.currency}) into ${invoice.targetErp === 'xero' ? 'Xero Bills' : 'QuickBooks Online'}.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      `✓ Successfully staged draft bill #${invoice.invoiceNumber} to ${
        invoice.targetErp === 'xero' ? 'Xero (ACCPAY)' : 'QuickBooks Online'
      }!`
    );
  };

  // Reject invoice with reason
  const handleRejectInvoice = (invoiceId: string, reason: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'rejected',
              rejectionReason: reason,
            }
          : inv
      )
    );

    const target = invoices.find((i) => i.id === invoiceId);
    if (target) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        invoiceId,
        invoiceNumber: target.invoiceNumber,
        timestamp: new Date().toISOString(),
        actor: 'AP Reviewer',
        action: 'REJECTED',
        details: `Rejected invoice #${target.invoiceNumber}. Reason: ${reason}`,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }

    showToast(`Invoice rejected and archived.`);
  };

  // Quick 1-click Auto Fix for math discrepancy
  const handleAutoFixMath = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    const discrepancy = target.validation.mathDiscrepancy;
    if (Math.abs(discrepancy) < 0.01) return;

    // Add unallocated line item
    const deltaAmount = Math.abs(discrepancy);
    const balancingItem = {
      id: `li-fix-${Date.now()}`,
      description: 'Shipping, Handling & Fuel Charge Adjustment',
      quantity: 1,
      unitPrice: deltaAmount,
      amount: deltaAmount,
      suggestedAccountCode: '500',
      suggestedAccountName: 'Freight, Logistics & Shipping',
      codingConfidence: 1.0,
    };

    const updatedLineItems = [...target.lineItems, balancingItem];
    const newSubtotal = Number((target.subtotal + deltaAmount).toFixed(2));

    const updated: InvoiceDocument = {
      ...target,
      lineItems: updatedLineItems,
      subtotal: newSubtotal,
    };

    handleUpdateInvoice(updated);
    showToast(`✓ Auto-balanced invoice #${target.invoiceNumber}: Added $${deltaAmount.toFixed(2)} balancing line.`);
  };

  // Handle new invoice upload from UploadModal
  const handleInvoiceCreated = (newInvoice: InvoiceDocument) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    setActiveInvoiceId(newInvoice.id);
    setActiveTab('verification');

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      timestamp: new Date().toISOString(),
      actor: 'Gemini Document AI',
      action: 'AI_EXTRACTED',
      details: `Extracted structured invoice from ${newInvoice.fileName} with ${Math.round(
        newInvoice.confidenceScore * 100
      )}% confidence score.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`✓ Document processed. Opened #${newInvoice.invoiceNumber} in Verification Studio.`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exceptionCount={exceptionCount}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-Header Workspace Breadcrumbs & Contextual Switcher */}
      <div className="bg-[#0E1422] border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>DocuFlow AP</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium capitalize">
            {activeTab === 'dashboard'
              ? 'Dashboard & Invoice Queue'
              : activeTab === 'verification'
              ? 'Side-by-Side Verification Studio'
              : activeTab === 'exceptions'
              ? 'Exception Queue & Triage'
              : 'Pipeline Architecture'}
          </span>
        </div>

        {/* Quick Sample Switcher for Client Review */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 hidden sm:inline">Active Sample:</span>
          <select
            value={activeInvoiceId}
            onChange={(e) => {
              setActiveInvoiceId(e.target.value);
              if (activeTab === 'dashboard') setActiveTab('verification');
            }}
            className="bg-[#161F30] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} · {inv.supplier.name} (${inv.totalAmount.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        {/* VIEW 1: DASHBOARD & QUEUE */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metric Bar */}
            <MetricBar invoices={invoices} />

            {/* Quick Action Ribbon */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Autonomous Accounts Payable Ingestion
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Multimodal AI reads invoices, validates arithmetic invariants, and drafts entries for Xero & QuickBooks.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Intake New Invoice
                </button>
                <button
                  onClick={() => setActiveTab('architecture')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Inspect Safeguards
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <InvoiceQueueTable
              invoices={invoices}
              onSelectInvoice={handleSelectInvoice}
              onApproveInvoice={handleApproveAndStage}
              onOpenUpload={() => setIsUploadOpen(true)}
            />

            {/* Recent Audit Trail Drawer */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Accounting Audit Trail
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Immutable event log
                </span>
              </div>

              <div className="space-y-2.5">
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#0E1422] border border-slate-800 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-semibold text-white">
                        {log.actor}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 self-start sm:self-auto">
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SIDE-BY-SIDE VERIFICATION STUDIO */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            {/* Studio Header bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Verification Studio · {activeInvoice.supplier.name} ({activeInvoice.invoiceNumber})
                </h2>
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                    activeInvoice.status === 'approved'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : activeInvoice.status === 'exception'
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      : 'bg-blue-950/60 text-blue-400 border border-blue-800'
                  }`}
                >
                  STATUS: {activeInvoice.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPayloadModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  View {activeInvoice.targetErp === 'xero' ? 'Xero' : 'QuickBooks'} Payload
                </button>
              </div>
            </div>

            {/* Split Screen 2-Column Workstation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-175px)] min-h-[750px]">
              {/* Left Column: Document Canvas & Bounding Boxes (5 cols on lg, 6 on xl) */}
              <div className="lg:col-span-5 xl:col-span-6 h-full">
                <DocumentViewer
                  invoice={activeInvoice}
                  selectedField={selectedField}
                  onSelectField={(f) => setSelectedField(f)}
                />
              </div>

              {/* Right Column: Structured Data Editor & Validation (7 cols on lg, 6 on xl) */}
              <div className="lg:col-span-7 xl:col-span-6 h-full">
                <StructuredDataEditor
                  invoice={activeInvoice}
                  onUpdateInvoice={handleUpdateInvoice}
                  onApproveAndStage={handleApproveAndStage}
                  onRejectInvoice={handleRejectInvoice}
                  onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
                  selectedField={selectedField}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: EXCEPTION QUEUE */}
        {activeTab === 'exceptions' && (
          <ExceptionCenter
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onAutoFixMath={handleAutoFixMath}
            onRejectDuplicate={(id) => handleRejectInvoice(id, 'Duplicate invoice entry detected.')}
            onApproveInvoice={handleApproveAndStage}
          />
        )}

        {/* VIEW 4: PIPELINE ARCHITECTURE & WORKFLOW DIAGRAM */}
        {activeTab === 'architecture' && <PipelineDiagram />}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
        existingInvoices={invoices}
      />

      <AccountingExportModal
        invoice={activeInvoice}
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        onStageSuccess={(inv) => {
          handleUpdateInvoice(inv);
          showToast(`✓ Staged draft bill to ${inv.targetErp === 'xero' ? 'Xero' : 'QuickBooks'}!`);
        }}
      />
    </div>
  );
}
