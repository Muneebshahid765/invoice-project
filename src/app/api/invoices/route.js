import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import Customer from '@/models/Customer';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { invoiceSchema } from '@/lib/validations/invoice';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// GET /api/invoices - Get all invoices with filters
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    await dbConnect();

    // Get user's businesses
    const userBusinesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).select('_id');

    const businessIds = userBusinesses.map(b => b._id);

    // Build query
    const query = {
      businessId: { $in: businessIds },
      isDeleted: false,
    };

    if (businessId && businessIds.some(id => id.toString() === businessId)) {
      query.businessId = businessId;
    }

    if (status) {
      query.status = status;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Check for overdue invoices and update status
    const now = new Date();
    await Invoice.updateMany(
      {
        businessId: { $in: businessIds },
        status: 'SENT',
        dueDate: { $lt: now },
        isDeleted: false,
      },
      { $set: { status: 'OVERDUE' } }
    );

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('businessId', 'businessName currency')
        .populate('customerId', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const body = await request.json();

    // Validate input
    const validationResult = invoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { businessId, customerId, ...invoiceData } = validationResult.data;

    await dbConnect();

    // Verify user owns this business
    const business = await Business.findOne({
      _id: businessId,
      userId: user._id,
      isDeleted: false,
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Verify customer belongs to this business
    const customer = await Customer.findOne({
      _id: customerId,
      businessId,
      isDeleted: false,
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check plan limits
    const invoiceCount = await Invoice.countDocuments({
      businessId,
      isDeleted: false,
    });

    const planLimits = {
      free: 10,
      basic: 100,
      pro: 1000,
      enterprise: Infinity,
    };

    const limit = planLimits[user.subscriptionPlan] || 10;

    if (invoiceCount >= limit) {
      return NextResponse.json(
        { 
          error: `You have reached the maximum number of invoices (${limit}) for your plan. Please upgrade to create more.` 
        },
        { status: 403 }
      );
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(businessId);

    // Create invoice
    const invoice = await Invoice.create({
      ...invoiceData,
      businessId,
      customerId,
      invoiceNumber,
      status: invoiceData.status || 'DRAFT',
    });

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'INVOICE_CREATED',
      entityType: 'invoice',
      entityId: invoice._id,
      details: { invoiceNumber: invoice.invoiceNumber, total: invoice.total },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Invoice created successfully', invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
