import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

// GET /api/invoices/[id]/pdf - Get invoice PDF data
export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template') || 'modern';

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

    // Return invoice data for client-side PDF generation
    return NextResponse.json({
      invoice: invoice.toObject(),
      business: invoice.businessId,
      customer: invoice.customerId,
      template,
    }, { status: 200 });
  } catch (error) {
    console.error('Get invoice PDF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
