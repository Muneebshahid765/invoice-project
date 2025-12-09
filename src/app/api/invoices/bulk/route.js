import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// POST /api/invoices/bulk - Bulk operations on invoices
export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const body = await request.json();
    const { action, invoiceIds } = body;

    if (!action || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and invoiceIds are required.' },
        { status: 400 }
      );
    }

    const validActions = ['markPaid', 'markSent', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Valid actions: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user's businesses
    const userBusinesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).select('_id');

    const businessIds = userBusinesses.map(b => b._id);

    // Find invoices that belong to user's businesses
    const invoices = await Invoice.find({
      _id: { $in: invoiceIds },
      businessId: { $in: businessIds },
      isDeleted: false,
    });

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'No valid invoices found' },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    let updateResult;
    let logAction;

    switch (action) {
      case 'markPaid':
        updateResult = await Invoice.updateMany(
          { _id: { $in: invoices.map(i => i._id) } },
          { $set: { status: 'PAID', paidAt: new Date() } }
        );
        logAction = 'INVOICE_PAID';
        break;

      case 'markSent':
        updateResult = await Invoice.updateMany(
          { _id: { $in: invoices.map(i => i._id) } },
          { $set: { status: 'SENT' } }
        );
        logAction = 'INVOICE_SENT';
        break;

      case 'delete':
        updateResult = await Invoice.updateMany(
          { _id: { $in: invoices.map(i => i._id) } },
          { $set: { isDeleted: true } }
        );
        logAction = 'INVOICE_DELETED';
        break;
    }

    // Log activity for each invoice
    for (const invoice of invoices) {
      await logActivity({
        userId: user._id,
        action: logAction,
        entityType: 'invoice',
        entityId: invoice._id,
        details: { 
          invoiceNumber: invoice.invoiceNumber,
          bulkAction: action,
        },
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({
      message: `Successfully processed ${invoices.length} invoices`,
      processed: invoices.length,
      action,
    }, { status: 200 });
  } catch (error) {
    console.error('Bulk invoice operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
