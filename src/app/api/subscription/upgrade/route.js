import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { SUBSCRIPTION_PLANS, canUpgradeTo } from '@/lib/subscriptionPlans';
import stripe from '@/lib/stripe';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// POST /api/subscription/upgrade - Create Stripe Checkout session
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if upgrade is valid
    if (!canUpgradeTo(user.subscriptionPlan, plan)) {
      return NextResponse.json({ 
        error: 'Cannot upgrade to this plan. Please select a higher tier.' 
      }, { status: 400 });
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
    const amountInMinor = planConfig.price * 100; // Rs -> paisa

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Using USD for Stripe compatibility
            product_data: {
              name: `${planConfig.name} Plan - Monthly Subscription`,
              description: `Invoice SaaS ${planConfig.name} Plan`,
            },
            unit_amount: Math.round(planConfig.price / 280 * 100), // Convert PKR to USD cents (approx)
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        userId: user._id.toString(),
        plan,
        amountPKR: planConfig.price.toString(),
      },
      success_url: `${appUrl}/dashboard/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Upgrade (Stripe) error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
