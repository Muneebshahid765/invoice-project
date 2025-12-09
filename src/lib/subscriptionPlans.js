// Subscription Plans Configuration

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free Trial',
    price: 0,
    currency: 'PKR',
    period: '14 days',
    features: [
      '5 invoices per month',
      '1 business profile',
      'Basic PDF templates',
      'Email support',
      'Basic analytics',
    ],
    limits: {
      invoicesPerMonth: 5,
      businesses: 1,
      templates: ['modern'],
      whatsappIntegration: false,
      customBranding: false,
      apiAccess: false,
      advancedAnalytics: false,
      paymentReminders: false,
    },
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: 999,
    currency: 'PKR',
    period: 'month',
    features: [
      '50 invoices per month',
      '2 business profiles',
      'All PDF templates',
      'WhatsApp integration',
      'Email notifications',
      'Priority support',
    ],
    limits: {
      invoicesPerMonth: 50,
      businesses: 2,
      templates: ['modern', 'classic', 'minimal'],
      whatsappIntegration: true,
      customBranding: false,
      apiAccess: false,
      advancedAnalytics: false,
      paymentReminders: true,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Professional',
    price: 1999,
    currency: 'PKR',
    period: 'month',
    popular: true,
    features: [
      'Unlimited invoices',
      '5 business profiles',
      'Custom branding',
      'Payment reminders',
      'Advanced analytics',
      'API access',
      'Priority support',
    ],
    limits: {
      invoicesPerMonth: -1, // Unlimited
      businesses: 5,
      templates: ['modern', 'classic', 'minimal'],
      whatsappIntegration: true,
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
      paymentReminders: true,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 4999,
    currency: 'PKR',
    period: 'month',
    features: [
      'Unlimited everything',
      'Unlimited businesses',
      'White-label option',
      'Dedicated account manager',
      'Custom integrations',
      'SLA support',
      'Priority phone support',
    ],
    limits: {
      invoicesPerMonth: -1, // Unlimited
      businesses: -1, // Unlimited
      templates: ['modern', 'classic', 'minimal'],
      whatsappIntegration: true,
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
      paymentReminders: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
  },
};

export const getPlanLimits = (plan) => {
  return SUBSCRIPTION_PLANS[plan]?.limits || SUBSCRIPTION_PLANS.FREE.limits;
};

export const getPlanDetails = (plan) => {
  return SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.FREE;
};

export const canUpgradeTo = (currentPlan, targetPlan) => {
  const planOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  return targetIndex > currentIndex;
};

export const canDowngradeTo = (currentPlan, targetPlan) => {
  const planOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  return targetIndex < currentIndex && targetIndex >= 0;
};

export const formatPrice = (price, currency = 'PKR') => {
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
};
