import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// POST /api/invoices/[id]/duplicate - Duplicate invoice
export async function POST(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const originalInvoice = await Invoice.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'userId');

    if (!originalInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify user owns the business
    if (originalInvoice.businessId.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Generate new invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(originalInvoice.businessId._id);

    // Create duplicate invoice
    const duplicateData = {
      businessId: originalInvoice.businessId._id,
      customerId: originalInvoice.customerId,
      invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: originalInvoice.items,
      taxRate: originalInvoice.taxRate,
      discount: originalInvoice.discount,
      discountType: originalInvoice.discountType,
      notes: originalInvoice.notes,
      terms: originalInvoice.terms,
      status: 'DRAFT',
    };

    const duplicateInvoice = await Invoice.create(duplicateData);

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'INVOICE_CREATED',
      entityType: 'invoice',
      entityId: duplicateInvoice._id,
      details: { 
        invoiceNumber: duplicateInvoice.invoiceNumber, 
        duplicatedFrom: originalInvoice.invoiceNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Invoice duplicated successfully', invoice: duplicateInvoice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Duplicate invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
