import { ChartOfAccount, InvoiceDocument, LineItem, SupplierRecord, ValidationFlag, ValidationResult } from '../types/invoice';
import { KNOWN_SUPPLIERS, MASTER_CHART_OF_ACCOUNTS } from '../data/mockLedger';

export function validateInvoice(
  invoice: Partial<InvoiceDocument>,
  allInvoices: InvoiceDocument[] = []
): ValidationResult {
  const flags: ValidationFlag[] = [];
  const lineItems = invoice.lineItems || [];
  
  // 1. Calculate line item sum
  const calculatedItemsTotal = lineItems.reduce((acc, item) => {
    const itemAmount = (item.quantity || 1) * (item.unitPrice || 0);
    return acc + itemAmount;
  }, 0);

  const subtotal = invoice.subtotal !== undefined ? invoice.subtotal : calculatedItemsTotal;
  const taxTotal = invoice.taxTotal || 0;
  const totalAmount = invoice.totalAmount || 0;

  // Arithmetic Check: Line items sum vs Subtotal
  const lineItemsDelta = Math.abs(calculatedItemsTotal - subtotal);
  if (lineItemsDelta > 0.02 && lineItems.length > 0) {
    flags.push({
      id: `flag_math_items_${Date.now()}`,
      field: 'lineItems',
      severity: 'warning',
      title: 'Line Items Sum Variance',
      message: `Line items compute to $${calculatedItemsTotal.toFixed(2)}, but document subtotal is $${subtotal.toFixed(2)} ($${lineItemsDelta.toFixed(2)} variance).`,
      resolutionSuggestion: 'Update line item quantities or adjust subtotal.',
    });
  }

  // Arithmetic Check: Subtotal + Tax vs Total Amount
  const expectedTotal = subtotal + taxTotal;
  const totalDelta = Number((expectedTotal - totalAmount).toFixed(2));
  const mathValid = Math.abs(totalDelta) < 0.02;

  if (!mathValid) {
    flags.push({
      id: `flag_math_total_${Date.now()}`,
      field: 'totalAmount',
      severity: 'critical',
      title: `Arithmetic Invariant Mismatch ($${Math.abs(totalDelta).toFixed(2)} delta)`,
      message: `Subtotal ($${subtotal.toFixed(2)}) + Tax ($${taxTotal.toFixed(2)}) equals $${expectedTotal.toFixed(2)}, but invoice printed total is $${totalAmount.toFixed(2)}.`,
      resolutionSuggestion: totalDelta > 0
        ? `Invoice total is under by $${totalDelta.toFixed(2)}. Adjust grand total or check discount line.`
        : `Unallocated charge of $${Math.abs(totalDelta).toFixed(2)}. Add shipping/handling fee line item or adjust totals.`,
      canAutoFix: true,
    });
  }

  // 2. Duplicate Check
  let isDuplicate = false;
  let duplicateInvoiceNumber: string | undefined;
  let duplicateMatchingVendor: string | undefined;

  const currentInvNum = (invoice.invoiceNumber || '').trim().toLowerCase();
  const currentSupplier = (invoice.supplier?.name || '').trim().toLowerCase();

  // Check against historical records in KNOWN_SUPPLIERS
  if (currentInvNum) {
    for (const sup of KNOWN_SUPPLIERS) {
      if (
        sup.name.toLowerCase().includes(currentSupplier) ||
        currentSupplier.includes(sup.name.toLowerCase())
      ) {
        if (sup.historicalInvoices.map((i) => i.toLowerCase()).includes(currentInvNum)) {
          isDuplicate = true;
          duplicateInvoiceNumber = invoice.invoiceNumber;
          duplicateMatchingVendor = sup.name;
          break;
        }
      }
    }

    // Also check against existing active invoices
    for (const existing of allInvoices) {
      if (
        existing.id !== invoice.id &&
        existing.invoiceNumber.trim().toLowerCase() === currentInvNum &&
        existing.supplier.name.trim().toLowerCase() === currentSupplier
      ) {
        isDuplicate = true;
        duplicateInvoiceNumber = invoice.invoiceNumber;
        duplicateMatchingVendor = existing.supplier.name;
        break;
      }
    }
  }

  if (isDuplicate) {
    flags.push({
      id: `flag_dup_${Date.now()}`,
      field: 'invoiceNumber',
      severity: 'critical',
      title: 'Duplicate Invoice Detected',
      message: `Invoice #${duplicateInvoiceNumber} from ${duplicateMatchingVendor || 'this supplier'} already exists in the accounting ledger history. Staging blocked to prevent double-payment.`,
      resolutionSuggestion: 'Verify if this is an updated re-billing, a payment reminder, or reject duplicate.',
      canAutoFix: false,
    });
  }

  // 3. Supplier Matching
  let supplierMatched = false;
  let matchedSupplierId: string | undefined;

  if (invoice.supplier?.name) {
    const sName = invoice.supplier.name.toLowerCase();
    const matched = KNOWN_SUPPLIERS.find(
      (s) =>
        s.name.toLowerCase() === sName ||
        sName.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(sName) ||
        (invoice.supplier?.taxId && s.taxId === invoice.supplier.taxId)
    );

    if (matched) {
      supplierMatched = true;
      matchedSupplierId = matched.id;
      flags.push({
        id: `flag_supp_match_${Date.now()}`,
        field: 'supplier',
        severity: 'info',
        title: 'Supplier Verified',
        message: `Matched to accounting contact "${matched.name}" (Tax ID: ${matched.taxId}).`,
      });
    } else {
      flags.push({
        id: `flag_supp_new_${Date.now()}`,
        field: 'supplier',
        severity: 'warning',
        title: 'Unregistered Supplier Contact',
        message: `"${invoice.supplier.name}" does not match any current contact in Xero/QBO.`,
        resolutionSuggestion: 'Contact will be created automatically in accounting software on approval.',
        canAutoFix: true,
      });
    }
  }

  // 4. Confidence evaluation
  const confidenceScore = invoice.confidenceScore !== undefined ? invoice.confidenceScore : 0.92;
  const confidencePassed = confidenceScore >= 0.85;

  if (!confidencePassed) {
    flags.push({
      id: `flag_conf_${Date.now()}`,
      field: 'confidence',
      severity: 'warning',
      title: `Low OCR Confidence (${Math.round(confidenceScore * 100)}%)`,
      message: 'Document scan has lower visual contrast or handwriting. Manual field verification recommended.',
    });
  }

  // Calculate composite health score (0 to 100)
  let score = 100;
  if (!mathValid) score -= 30;
  if (isDuplicate) score -= 55;
  if (!supplierMatched) score -= 15;
  if (!confidencePassed) score -= 20;
  score = Math.max(15, Math.min(100, score));

  return {
    mathValid,
    mathDiscrepancy: totalDelta,
    calculatedSubtotal: calculatedItemsTotal,
    isDuplicate,
    duplicateInvoiceNumber,
    duplicateMatchingVendor,
    supplierMatched,
    matchedSupplierId,
    confidencePassed,
    overallScore: score,
    flags,
  };
}

// Predict GL account code based on description and supplier
export function suggestAccountCode(
  description: string,
  supplierName?: string
): { code: string; name: string; confidence: number } {
  const descLower = (description || '').toLowerCase();
  const suppLower = (supplierName || '').toLowerCase();

  // 1. Check if supplier has a known default
  if (supplierName) {
    const known = KNOWN_SUPPLIERS.find(
      (s) =>
        s.name.toLowerCase() === suppLower ||
        suppLower.includes(s.name.toLowerCase())
    );
    if (known) {
      return {
        code: known.defaultAccountCode,
        name: known.defaultAccountName,
        confidence: 0.95,
      };
    }
  }

  // 2. Keyword matching across COA
  for (const account of MASTER_CHART_OF_ACCOUNTS) {
    for (const kw of account.keywords) {
      if (descLower.includes(kw)) {
        return {
          code: account.code,
          name: account.name,
          confidence: 0.91,
        };
      }
    }
  }

  // Default fallback to IT or Office Supplies
  return {
    code: '420',
    name: 'IT Software & Subscriptions',
    confidence: 0.65,
  };
}
