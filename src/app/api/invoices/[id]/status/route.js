import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { updateInvoiceStatusSchema } from '@/lib/validations/invoice';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// PATCH /api/invoices/[id]/status - Update invoice status
export async function PATCH(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = updateInvoiceStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    await dbConnect();

    const invoice = await Invoice.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'userId businessName');

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify user owns the business
    if (invoice.businessId.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const previousStatus = invoice.status;
    invoice.status = status;

    // Set paidAt if marking as paid
    if (status === 'PAID' && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }

    // Clear paidAt if changing from paid to another status
    if (previousStatus === 'PAID' && status !== 'PAID') {
      invoice.paidAt = null;
    }

    await invoice.save();

    // Determine action for logging
    let action = 'INVOICE_UPDATED';
    if (status === 'SENT') action = 'INVOICE_SENT';
    if (status === 'PAID') action = 'INVOICE_PAID';
    if (status === 'CANCELLED') action = 'INVOICE_CANCELLED';

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action,
      entityType: 'invoice',
      entityId: invoice._id,
      details: { 
        invoiceNumber: invoice.invoiceNumber, 
        previousStatus, 
        newStatus: status,
      },
      ipAddress,
      userAgent,
    });

    // TODO: Send email notification on status change
    // if (status === 'SENT') {
    //   await sendInvoiceEmail(invoice);
    // }

    return NextResponse.json(
      { message: `Invoice marked as ${status}`, invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update invoice status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
