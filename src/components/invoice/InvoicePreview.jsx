"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";

export function InvoicePreview({ 
  invoice, 
  business, 
  customer, 
  items = [], 
  subtotal = 0,
  tax = 0,
  discount = 0,
  total = 0,
  currency = "PKR",
  compact = false,
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className={compact ? "shadow-sm" : "shadow-lg"}>
      <CardContent className={compact ? "p-4" : "p-8"}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {business?.logo ? (
              <img src={business.logo} alt={business.businessName} className="h-12 mb-2" />
            ) : (
              <h2 className="text-2xl font-bold text-primary">{business?.businessName || 'Your Business'}</h2>
            )}
            {business?.email && <p className="text-sm text-muted-foreground">{business.email}</p>}
            {business?.phone && <p className="text-sm text-muted-foreground">{business.phone}</p>}
            {business?.address && (
              <p className="text-sm text-muted-foreground">
                {[business.address.street, business.address.city, business.address.country].filter(Boolean).join(', ')}
              </p>
            )}
            {business?.taxId && <p className="text-sm text-muted-foreground">Tax ID: {business.taxId}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-muted-foreground mb-2">INVOICE</h1>
            {invoice?.invoiceNumber && (
              <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
            )}
            {invoice?.status && (
              <div className="mt-2">
                <StatusBadge status={invoice.status} />
              </div>
            )}
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO</h3>
            <p className="font-semibold">{customer?.name || 'Customer Name'}</p>
            {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
            {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
            {customer?.address && (
              <p className="text-sm text-muted-foreground">
                {[customer.address.street, customer.address.city, customer.address.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invoice Date:</span>
                <span className="text-sm font-medium">{formatDate(invoice?.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due Date:</span>
                <span className="text-sm font-medium">{formatDate(invoice?.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Items Table */}
        <div className="mb-6">
          <div className="grid grid-cols-12 gap-4 py-3 bg-muted/50 rounded-t-lg px-4 font-semibold text-sm">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 py-3 px-4 border-b text-sm">
                <div className="col-span-6">{item.description || '-'}</div>
                <div className="col-span-2 text-right">{item.quantity || 0}</div>
                <div className="col-span-2 text-right">{formatCurrency(item.price)}</div>
                <div className="col-span-2 text-right font-medium">{formatCurrency(item.total)}</div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No items added yet
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice?.notes || invoice?.terms) && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-8 text-sm">
              {invoice?.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice?.terms && (
                <div>
                  <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default InvoicePreview;
