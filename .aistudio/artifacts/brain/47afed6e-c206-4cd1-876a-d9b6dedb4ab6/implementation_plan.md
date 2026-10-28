# AI Invoice and Document Data Extraction Pipeline

An automated document intelligence pipeline that ingests invoices, receipts, and supplier documents, extracts structured financial entities with multimodal vision AI, enforces strict arithmetic and duplicate validations, and stages draft bills into Xero and QuickBooks Online for one-click finance approval.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the interactive clarification interview:
> - **Accounting Staging**: Dual-target support for both **Xero Bills** and **QuickBooks Online Draft Bills** with dynamic schema toggles and payload inspection.
> - **Document Intake**: Hybrid intake combining a **live PDF/image upload pipeline** (with server-side multimodal AI extraction) and a **preloaded suite of realistic supplier invoices** (clean bills, tax discrepancies, currency differences, and duplicate edge-cases).
> - **Primary Interface Showcase**: High-impact **side-by-side split-screen verification workstation**, dedicated **exception queue** for human-in-the-loop triage, and an **interactive pipeline workflow diagram** showing step-by-step progress from intake to staged bill.

---

## 1. Overview & Core Concept

### What It Does
The platform replaces manual Accounts Payable (AP) data entry with an autonomous yet human-governed extraction workflow. When an invoice arrives (via direct upload, simulated email inbox, or sample presets), the pipeline:
1. Performs multimodal optical character recognition (OCR) and structured field extraction (vendor name, invoice number, issue/due dates, currency, line items, subtotal, tax rates, grand total).
2. Executes three code-level validation gates:
   - **Arithmetic Invariant Check**: Computes $\sum (\text{Line Items}) + \text{Taxes} \stackrel{?}{=} \text{Total Amount}$ down to the cent.
   - **Duplicate Detection**: Cross-references supplier ID, invoice number, and bill hash against historical ledger records.
   - **Supplier & Chart of Accounts (COA) Matcher**: Resolves supplier records from past ledger data and predicts General Ledger (GL) expense codes with confidence scores.
3. Routes clean invoices straight to **Staged Draft Bills** (ready for one-click approval to Xero or QuickBooks).
4. Routes flag-bearing invoices (math discrepancy, duplicate alert, unmapped supplier, or confidence $<85\%$) into an **Exception Queue** where human reviewers can inspect the document side-by-side, correct field values with bounding box highlights, and release to staging.

### Target Audience & Persona
- **Finance Operations & AP Clerks**: Need to eliminate manual copy-pasting, prevent invoice fraud or double payments, and speed up month-end reconciliation.
- **Controllers & CFOs**: Need total auditability, assurance that no unapproved bill ever posts to the general ledger, and visibility into supplier expense trends.
- **Upwork Clients & Accounting Integrators**: Evaluating a turn-key solution capable of integrating Claude/Gemini vision pipelines with Xero and QuickBooks Online APIs.

### Key Value
- **Zero Ledger Hallucinations**: Inviolable rule that nothing touches accounting ledgers without explicit approval.
- **10x Faster Ingestion**: Extraction and verification completes in under 3 seconds per invoice.
- **Human-in-the-Loop Confidence**: Clear visual diffs and confidence badges that pinpoint exactly what requires review.

---

## 2. User Experience & Visual Design

### Key User Flows

#### Flow 1: Document Intake & Processing
1. User lands on the **Pipeline Dashboard** showing active metrics (Invoices Processed, Staged for Approval, Exception Queue Count, Auto-Extraction Accuracy).
2. User can drag and drop a new PDF/image invoice or click any pre-configured sample invoice (e.g., *Acme Cloud Services*, *Pacific Freight Logistics*, *BioLab Equipment*, or *Dubious Duplicate Invoice*).
3. The live progress stepper illuminates the document moving across the visual pipeline: `Intake` $\to$ `Multimodal Extraction` $\to$ `Validation & Checks` $\to$ `Accounting Staging`.

#### Flow 2: Side-by-Side Verification Workstation
1. User clicks any invoice to open the **Verification Studio**.
2. Left pane: High-fidelity document preview (rendered PDF/image canvas with interactive bounding highlights).
3. Right pane: Structured extraction form divided into **Header Info**, **Supplier & Account Coding**, **Line Items Table**, and **Financial Summary**.
4. Discrepancies or low-confidence fields are marked with clear amber warnings and contextual callouts (e.g., *"Line items sum to $1,420.00 but Invoice specifies $1,450.00 — $30.00 unallocated variance"*).
5. User can edit any field in real-time; math invariants recalculate instantly.

#### Flow 3: Accounting Sync & Staging (Xero & QuickBooks)
1. User toggles the target accounting system between **Xero** and **QuickBooks Online**.
2. The UI renders the exact draft bill preview formatted to that platform's schema (e.g., Xero `InvoiceID`, `ContactID`, `LineAmountTypes`, `AccountCode` vs QuickBooks `DocNumber`, `VendorRef`, `AccountBasedExpenseLineDetail`).
3. User clicks **"Approve & Stage Draft Bill"** to sync the bill to the staged queue, update the audit log, and optionally download the JSON/CSV payload for direct ERP import.

#### Flow 4: Exception Queue Triage
1. Reviewers filter the invoice queue by status: `All`, `Ready for Approval`, `Needs Review (Exceptions)`, or `Synced to ERP`.
2. The Exception Queue groups issues by category: `Math Mismatch`, `Potential Duplicate`, `New Supplier`, or `Low Confidence OCR`.
3. One-click resolution actions allow users to mark duplicate as rejected, auto-correct rounding deltas, or confirm new vendor creation.

### Visual Identity & Theme

- **Aesthetic Direction**: High-density, utilitarian financial software aesthetic inspired by modern enterprise fintech (e.g., Ramp, Stripe Dashboard, Mercury). Crisp contrast, zero-fluff layout, razor-sharp typography, and calm structural surfaces.
- **Color Palette**:
  - `Canvas Background`: Clean slate `#0B0F17` (Dark Mode default) and crisp neutral white `#F8FAFC` (Light Mode toggleable).
  - `Surface Containers`: `#111827` (card panels), hairline borders `#1F2937` (`border-slate-800`).
  - `Primary Action Accent`: Precision Cobalt `#2563EB` / Sapphire `#3B82F6`.
  - `Semantic Accounting Statuses`:
    - Clean / Approved / Matched: Emerald `#059669` / `#10B981`
    - Caution / Exception / Variance: Amber `#D97706` / `#F59E0B`
    - Duplicate / Critical Failure: Crimson `#DC2626` / `#EF4444`
    - Xero Brand Tag: Deep Sky Blue `#00B4D8`
    - QuickBooks Brand Tag: Intuit Green `#2CA01C`
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` (tight tracking, semi-bold 600).
  - Body Prose & Labels: `DM Sans` or `Plus Jakarta Sans` (13px–15px, legible and quiet).
  - Numbers, Currency, Codes & Dates: `JetBrains Mono` or tabular figures (`tabular-nums font-mono`) with decimal alignment.
- **Layout Structure**:
  - Top Bar: Brand wordmark, 4 navigation views (`Overview & Queue`, `Verification Studio`, `Exception Center`, `Pipeline Architecture`), and live Quick-Upload CTA.
  - Sub-Header Workspace Bar: Filter controls, accounting system toggle (Xero / QBO), and processing trigger.
  - Multi-Column Workstation: Designed for standard 1440px desktop screens with responsive collapse for mobile/tablet.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Preloaded Showcase + Live Multimodal Extraction
- **Chosen Approach**: Ship with 6 diverse, production-realistic sample invoices (clean bill, multi-tax European invoice, subtotal rounding error, duplicate invoice test, unmapped overseas vendor) while simultaneously providing a live file drag-and-drop intake backed by server-side Gemini 3.8 Flash multimodal vision.
- **Why**: Allows Upwork clients and stakeholders to immediately test edge cases without searching for private documents, while demonstrating genuine real-time AI extraction on arbitrary user-provided files.
- **Alternatives Considered**: Mock-only static JSON (fails to demonstrate real AI capabilities) or live-only without samples (leaves new users with an empty zero-state).

### Decision 2: Dual Accounting Software Schema Harmonization
- **Chosen Approach**: Implement an internal `CanonicalBill` schema that dynamically compiles to both **Xero Bills API v2.0** format and **QuickBooks Online Bill API v3** payload format.
- **Why**: The job brief specifies both Xero and QuickBooks. Demonstrating live schema translation between the two industry leaders proves high architectural maturity and direct enterprise value.
- **Alternatives Considered**: Supporting only one platform or building two completely separate unlinked views.

### Decision 3: Client-Side + Server Verification Invariant Engine
- **Chosen Approach**: Real arithmetic verification executed in code on both the server and client. The system checks:
  $$\left| \sum (\text{Line Item Quantity} \times \text{Unit Price}) - \text{Subtotal} \right| < 0.01$$
  $$\left| \text{Subtotal} + \text{Tax} - \text{Total} \right| < 0.01$$
  If an invariant fails, the invoice cannot be auto-approved and is routed to the Exception Queue with the exact delta highlighted.
- **Why**: Accounting accuracy is non-negotiable. Pure LLM outputs can occasionally suffer from 1-cent rounding errors or hallucinated subtotals. Pure deterministic code validation guarantees 100% mathematical integrity.

### Decision 4: Chart of Accounts (COA) Suggestion Model
- **Chosen Approach**: Provide an automated account coding engine that compares supplier category, description keywords, and historical entries to suggest standard GL accounts (e.g., `6200 - Software & Subscriptions`, `5100 - Freight & Shipping`, `6400 - Office Supplies`) with calculated confidence bars.
- **Why**: Saves finance staff the friction of picking codes from scratch while maintaining full human oversight.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Document Intake Layer                             │
│  [Drag & Drop Upload]   [Simulated Email Inbox]   [Preset Invoice Catalog]  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Server Processing & AI Extraction                      │
│                          (Express Backend: /api/*)                          │
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────┐   ┌──────────────────┐  │
│  │ Multimodal Gemini OCR │   │  JSON Normalizer  │   │ Historical Match │  │
│  │  (gemini-3.8-flash)   │──▶│  & Sanitization   │──▶│  & COA Predictor │  │
│  └───────────────────────┘   └───────────────────┘   └──────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Deterministic Validation Engine                     │
│                                                                             │
│  • Totals & Tax Invariant Check (Subtotal + Tax == Total)                   │
│  • Duplicate Hash & Invoice # Detection against Ledger History              │
│  • Supplier ABN/Tax ID Verification & Confidence Threshold Scoring (>= 85%) │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
        [Passed All Validation]             [Failed Rule / Low Confidence]
                        ▼                             ▼
┌───────────────────────────────┐     ┌───────────────────────────────────────┐
│     Staged Bills Queue        │     │            Exception Queue            │
│  • Ready for 1-Click Sync     │     │  • Flagged Field Highlighting         │
│  • Xero Bill API Payload      │     │  • Interactive Bounding Box Inspector │
│  • QuickBooks Online Payload  │     │  • Human Override & Recalculate       │
│  • Downloadable Sync Manifest │     │  • Re-route to Staging upon Fix       │
└───────────────────────────────┘     └───────────────────────────────────────┘
                                │                     ▲
                                └──[Manual Review]────┘
```

### Core Entities & Data Model

- **`InvoiceDocument`**:
  ```ts
  interface InvoiceDocument {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: 'pdf' | 'image';
    receivedAt: string;
    status: 'processing' | 'staged' | 'exception' | 'approved' | 'rejected';
    supplier: {
      name: string;
      taxId?: string;
      address?: string;
      matchedVendorId?: string;
      isNewVendor: boolean;
    };
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      suggestedAccountCode: string;
      suggestedAccountName: string;
      confidence: number;
    }>;
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
    confidenceScore: number;
    validationResults: {
      mathValid: boolean;
      mathDiscrepancy?: number;
      isDuplicate: boolean;
      duplicateInvoiceId?: string;
      supplierMatched: boolean;
      confidencePassed: boolean;
      flags: Array<{
        field: string;
        severity: 'critical' | 'warning' | 'info';
        message: string;
      }>;
    };
    targetErp: 'xero' | 'quickbooks';
    erpPayload: {
      xero?: Record<string, unknown>;
      quickbooks?: Record<string, unknown>;
    };
  }
  ```

- **`SupplierRecord`**:
  Contains known vendors, default expense accounts, payment terms, and past invoice numbers for instant duplicate detection.

- **`ChartOfAccount`**:
  Standard COA categories across general ledger codes (Expense, COGS, Asset, Liability).

### Interactive Component & State Mapping

| Component | State Mutated | User Actions & Events |
| :--- | :--- | :--- |
| `IntakeDropzone` | `invoicesList`, `activeInvoiceId` | File drop/browse, triggers `/api/extract` server endpoint with progress indicator. |
| `InvoiceCatalogStrip` | `activeInvoiceId` | Selects from pre-built test cases (Clean Bill, Math Error, Duplicate, Foreign Currency). |
| `SplitScreenWorkspace` | `activeInvoice` | Synchronized side-by-side zoom/pan document viewer and structured data editor. |
| `FieldEditorCard` | `activeInvoice.lineItems`, `totals` | In-place editing of quantities, amounts, tax rates, and GL codes; re-evaluates validation invariants on keystroke. |
| `ExceptionQueueDrawer` | `filterStatus`, `reviewQueue` | Filter by flag type; quick-resolve warnings (e.g., "Accept Rounding", "Mark As Duplicate"). |
| `AccountingExportModal` | `invoice.status`, `syncedBills` | Switch between Xero & QBO preview tabs, view live JSON payload, click "Approve & Stage to Accounting", copy API payload. |
| `WorkflowDiagramView` | `activeStep` | Visual architecture walkthrough showing data flow and security safeguards. |

---

## 5. Implementation Sequence

1. **Server Setup & Multimodal Vision API**: Configure Express server proxy with `/api/extract` using `@google/genai` (`gemini-3.8-flash`) and structured JSON schema extraction.
2. **Deterministic Rules & Validation Core**: Build TypeScript validation utilities for cent-level arithmetic, duplicate detection, and supplier mapping.
3. **Preset Invoice Data & Realistic Documents**: Prepare high-fidelity sample documents with pre-computed bounding coordinates and financial profiles.
4. **Interactive Side-by-Side UI**: Build split-screen view with document canvas, field editing, validation badges, and live math checks.
5. **Accounting Staging & Export Engine**: Build Xero Bills API and QuickBooks Online Bill transformers with copyable/downloadable payload viewers.
6. **Exception Queue & Pipeline Workflow Diagram**: Implement the exception triage console and interactive architectural diagram.
7. **Verification & Testing**: End-to-end testing of file intake, extraction, manual editing, and validation state transitions.
