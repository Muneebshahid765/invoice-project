import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';

// GET /api/subscription/plans - Get all available plans
export async function GET() {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      period: plan.period,
      features: plan.features,
      popular: plan.popular || false,
      limits: {
        invoicesPerMonth: plan.limits.invoicesPerMonth,
        businesses: plan.limits.businesses,
      },
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
