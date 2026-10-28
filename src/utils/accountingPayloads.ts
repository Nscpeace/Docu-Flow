import { InvoiceDocument } from '../types/invoice';

// Generate authentic Xero Bills API v2.0 payload
export function generateXeroPayload(invoice: InvoiceDocument) {
  return {
    Type: 'ACCPAY', // Accounts Payable Bill
    Contact: {
      ContactID: invoice.supplier.matchedId || undefined,
      Name: invoice.supplier.name,
      TaxNumber: invoice.supplier.taxId || undefined,
      EmailAddress: invoice.supplier.email || undefined,
      Addresses: invoice.supplier.address
        ? [
            {
              AddressType: 'STREET',
              AddressLine1: invoice.supplier.address,
            },
          ]
        : undefined,
    },
    InvoiceNumber: invoice.invoiceNumber,
    Reference: `DocuFlow-AP-${invoice.id}`,
    Date: invoice.issueDate,
    DueDate: invoice.dueDate,
    Status: 'DRAFT', // Safe staging safeguard: never AUTHORISED directly without approval
    LineAmountTypes: 'Exclusive',
    CurrencyCode: invoice.currency || 'USD',
    LineItems: invoice.lineItems.map((item, idx) => ({
      LineItemID: item.id || `line-${idx + 1}`,
      Description: item.description,
      Quantity: item.quantity,
      UnitAmount: item.unitPrice,
      LineAmount: item.amount,
      AccountCode: item.suggestedAccountCode || '420',
      TaxType: invoice.taxTotal > 0 ? 'OUTPUT2' : 'NONE',
      TaxAmount: Number(
        (invoice.taxTotal * (item.amount / (invoice.subtotal || 1))).toFixed(2)
      ),
    })),
    SubTotal: invoice.subtotal,
    TotalTax: invoice.taxTotal,
    Total: invoice.totalAmount,
    SentToContact: false,
    ExpectedPaymentDate: invoice.dueDate,
  };
}

// Generate authentic QuickBooks Online Bill API v3 payload
export function generateQuickBooksPayload(invoice: InvoiceDocument) {
  return {
    Bill: {
      DocNumber: invoice.invoiceNumber,
      TxnDate: invoice.issueDate,
      DueDate: invoice.dueDate,
      VendorRef: {
        value: invoice.supplier.matchedId || 'VENDOR-AUTO-GEN',
        name: invoice.supplier.name,
      },
      CurrencyRef: {
        value: invoice.currency || 'USD',
      },
      TotalAmt: invoice.totalAmount,
      Balance: invoice.totalAmount,
      GlobalTaxCalculation: 'TaxExcluded',
      PrivateNote: `Automated intake via DocuFlow AI Pipeline (ID: ${invoice.id}). Confidence: ${Math.round(
        (invoice.confidenceScore || 0.9) * 100
      )}%`,
      Line: invoice.lineItems.map((item, index) => ({
        Id: String(index + 1),
        LineNum: index + 1,
        Description: item.description,
        Amount: item.amount,
        DetailType: 'AccountBasedExpenseLineDetail',
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: item.suggestedAccountCode || '420',
            name: item.suggestedAccountName || 'IT Software & Subscriptions',
          },
          TaxCodeRef: {
            value: invoice.taxTotal > 0 ? 'TAX' : 'NON',
          },
          BillableStatus: 'NotBillable',
        },
      })),
      TxnTaxDetail: {
        TotalTax: invoice.taxTotal,
      },
    },
  };
}

// Download formatted JSON file helper
export function downloadJsonFile(filename: string, data: object) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download CSV for generic ERP import
export function downloadCsvLedger(invoices: InvoiceDocument[]) {
  const headers = [
    'Invoice ID',
    'Supplier Name',
    'Supplier Tax ID',
    'Invoice Number',
    'Issue Date',
    'Due Date',
    'Currency',
    'Subtotal',
    'Tax Total',
    'Total Amount',
    'Status',
    'Target ERP',
    'Confidence',
  ];

  const rows = invoices.map((inv) => [
    inv.id,
    `"${(inv.supplier.name || '').replace(/"/g, '""')}"`,
    inv.supplier.taxId || '',
    inv.invoiceNumber,
    inv.issueDate,
    inv.dueDate,
    inv.currency,
    inv.subtotal.toFixed(2),
    inv.taxTotal.toFixed(2),
    inv.totalAmount.toFixed(2),
    inv.status,
    inv.targetErp,
    `${Math.round(inv.confidenceScore * 100)}%`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `docuflow_staged_bills_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
