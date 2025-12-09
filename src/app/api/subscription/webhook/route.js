import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { SUBSCRIPTION_PLANS, getPlanLimits } from '@/lib/subscriptionPlans';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return new NextResponse('Webhook config error', { status: 500 });
  }

  let event;
  const rawBody = await request.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    await dbConnect();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan, amountPKR } = session.metadata || {};

        // Only proceed if payment is actually paid
        if (session.payment_status !== 'paid') {
          console.log('Payment not completed yet');
          return NextResponse.json({ received: true });
        }

        if (!userId || !plan || !SUBSCRIPTION_PLANS[plan]) {
          console.warn('Invalid metadata on checkout.session.completed');
          return NextResponse.json({ received: true });
        }

        const planLimits = getPlanLimits(plan);
        const now = new Date();
        const subscriptionEndDate = new Date(now);
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

        // Update user subscription
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            subscriptionPlan: plan,
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate: now,
            subscriptionEndDate,
            paymentMethod: 'STRIPE',
            stripeCustomerId: session.customer,
            invoiceLimit: planLimits.invoicesPerMonth,
            businessLimit: planLimits.businesses,
            invoicesCreatedThisMonth: 0,
            lastInvoiceCountReset: now,
          },
          { new: true }
        );

        // Create payment record
        await Payment.create({
          userId,
          plan,
          amount: parseInt(amountPKR) || SUBSCRIPTION_PLANS[plan].price,
          currency: 'PKR',
          amountUSD: session.amount_total / 100,
          status: 'COMPLETED',
          paymentMethod: 'STRIPE',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          stripeCustomerId: session.customer,
          receiptUrl: session.receipt_url,
          description: `${SUBSCRIPTION_PLANS[plan].name} Plan Subscription`,
          paidAt: now,
          metadata: {
            customerEmail: session.customer_email,
            paymentStatus: session.payment_status,
          },
        });

        console.log(`User ${userId} upgraded to ${plan} plan`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        
        // Update payment record if exists
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: 'FAILED' }
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Charge refunded:', charge.id);
        
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: charge.payment_intent },
          { 
            status: 'REFUNDED',
            refundedAt: new Date(),
          }
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new NextResponse('Webhook Handler Error', { status: 500 });
  }
}

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};
