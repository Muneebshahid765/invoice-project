import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { updateInvoiceSchema } from '@/lib/validations/invoice';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// GET /api/invoices/[id] - Get single invoice with full details
export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const invoice = await Invoice.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate('businessId', 'businessName email phone address currency logo taxId')
      .populate('customerId', 'name email phone address');

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify user owns the business
    const business = await Business.findOne({
      _id: invoice.businessId._id,
      userId: user._id,
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if overdue
    const now = new Date();
    let isOverdue = false;
    if (invoice.status === 'SENT' && invoice.dueDate < now) {
      isOverdue = true;
      invoice.status = 'OVERDUE';
      await invoice.save();
    }

    return NextResponse.json({ 
      invoice: invoice.toObject(),
      isOverdue,
    }, { status: 200 });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = updateInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await dbConnect();

    const invoice = await Invoice.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'userId');

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

    // Update fields
    Object.assign(invoice, validationResult.data);
    await invoice.save();

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'INVOICE_UPDATED',
      entityType: 'invoice',
      entityId: invoice._id,
      details: { invoiceNumber: invoice.invoiceNumber, updatedFields: Object.keys(validationResult.data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Invoice updated successfully', invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Soft delete invoice
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const invoice = await Invoice.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'userId');

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

    // Soft delete
    invoice.isDeleted = true;
    await invoice.save();

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'INVOICE_DELETED',
      entityType: 'invoice',
      entityId: invoice._id,
      details: { invoiceNumber: invoice.invoiceNumber },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
