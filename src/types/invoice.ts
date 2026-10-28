export type DocumentStatus =
  | 'intake'
  | 'processing'
  | 'staged'
  | 'exception'
  | 'approved'
  | 'rejected';

export type AccountingTarget = 'xero' | 'quickbooks';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  suggestedAccountCode: string;
  suggestedAccountName: string;
  codingConfidence: number; // 0 to 1
  taxRate?: number;
}

export interface SupplierRecord {
  id: string;
  name: string;
  taxId: string;
  email: string;
  address: string;
  currency: string;
  defaultAccountCode: string;
  defaultAccountName: string;
  paymentTermsDays: number;
  historicalInvoices: string[]; // for duplicate checking
}

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'EXPENSE' | 'COGS' | 'ASSET' | 'LIABILITY';
  description: string;
  keywords: string[];
}

export interface ValidationFlag {
  id: string;
  field: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  resolutionSuggestion?: string;
  canAutoFix?: boolean;
}

export interface ValidationResult {
  mathValid: boolean;
  mathDiscrepancy: number; // calculated delta: subtotal + tax - total
  calculatedSubtotal: number;
  isDuplicate: boolean;
  duplicateInvoiceNumber?: string;
  duplicateMatchingVendor?: string;
  supplierMatched: boolean;
  matchedSupplierId?: string;
  confidencePassed: boolean;
  overallScore: number;
  flags: ValidationFlag[];
}

export interface InvoiceDocument {
  id: string;
  fileName: string;
  fileUrl?: string;
  thumbnailSvg?: string;
  fileType: 'pdf' | 'image';
  fileSizeKb: number;
  receivedAt: string;
  status: DocumentStatus;
  
  // Extracted entities
  supplier: {
    name: string;
    taxId?: string;
    address?: string;
    email?: string;
    matchedId?: string;
    isNewSupplier: boolean;
  };
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  
  // Intelligence & Validation
  confidenceScore: number;
  validation: ValidationResult;
  
  // Accounting Staging
  targetErp: AccountingTarget;
  stagedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface AuditLogEntry {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  timestamp: string;
  actor: string;
  action: 'INTAKE' | 'AI_EXTRACTED' | 'VALIDATION_FAILED' | 'EXCEPTION_RESOLVED' | 'STAGED' | 'APPROVED' | 'REJECTED';
  details: string;
}
