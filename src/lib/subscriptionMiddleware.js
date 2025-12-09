import User from '@/models/User';
import Business from '@/models/Business';
import Invoice from '@/models/Invoice';
import { getPlanLimits } from './subscriptionPlans';

/**
 * Check if user's trial has expired
 */
export async function checkTrialExpiry(userId) {
  const user = await User.findById(userId);
  if (!user) return { expired: true, message: 'User not found' };

  // If user has active paid subscription, trial doesn't matter
  if (user.subscriptionStatus === 'ACTIVE' && user.subscriptionPlan !== 'FREE') {
    return { expired: false };
  }

  // Check if trial has expired
  if (user.subscriptionStatus === 'TRIAL') {
    const now = new Date();
    if (user.trialEndDate && now > user.trialEndDate) {
      // Update user status to expired
      await User.findByIdAndUpdate(userId, { subscriptionStatus: 'EXPIRED' });
      return { 
        expired: true, 
        message: 'Your trial has expired. Please upgrade to continue.',
        daysExpired: Math.floor((now - user.trialEndDate) / (1000 * 60 * 60 * 24))
      };
    }
    
    // Calculate remaining trial days
    const daysRemaining = Math.ceil((user.trialEndDate - now) / (1000 * 60 * 60 * 24));
    return { expired: false, daysRemaining };
  }

  // Check if subscription has expired
  if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') {
    return { 
      expired: true, 
      message: 'Your subscription has expired. Please renew to continue.' 
    };
  }

  // Check subscription end date for paid plans
  if (user.subscriptionEndDate && new Date() > user.subscriptionEndDate) {
    await User.findByIdAndUpdate(userId, { subscriptionStatus: 'EXPIRED' });
    return { 
      expired: true, 
      message: 'Your subscription has expired. Please renew to continue.' 
    };
  }

  return { expired: false };
}

/**
 * Check if user can create more invoices this month
 */
export async function checkInvoiceLimit(userId) {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, message: 'User not found' };

  // First check if subscription/trial is active
  const trialCheck = await checkTrialExpiry(userId);
  if (trialCheck.expired) {
    return { allowed: false, message: trialCheck.message };
  }

  const limits = getPlanLimits(user.subscriptionPlan);
  
  // Unlimited invoices
  if (limits.invoicesPerMonth === -1) {
    return { allowed: true, remaining: -1 };
  }

  // Reset monthly count if needed
  const now = new Date();
  const lastReset = new Date(user.lastInvoiceCountReset);
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    await User.findByIdAndUpdate(userId, {
      invoicesCreatedThisMonth: 0,
      lastInvoiceCountReset: now,
    });
    user.invoicesCreatedThisMonth = 0;
  }

  const remaining = limits.invoicesPerMonth - user.invoicesCreatedThisMonth;
  
  if (remaining <= 0) {
    return { 
      allowed: false, 
      message: `You've reached your monthly invoice limit (${limits.invoicesPerMonth}). Upgrade your plan for more.`,
      limit: limits.invoicesPerMonth,
      used: user.invoicesCreatedThisMonth,
      remaining: 0,
    };
  }

  return { 
    allowed: true, 
    limit: limits.invoicesPerMonth,
    used: user.invoicesCreatedThisMonth,
    remaining,
  };
}

/**
 * Increment invoice count after successful creation
 */
export async function incrementInvoiceCount(userId) {
  await User.findByIdAndUpdate(userId, {
    $inc: { invoicesCreatedThisMonth: 1 },
  });
}

/**
 * Check if user can create more businesses
 */
export async function checkBusinessLimit(userId) {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, message: 'User not found' };

  // First check if subscription/trial is active
  const trialCheck = await checkTrialExpiry(userId);
  if (trialCheck.expired) {
    return { allowed: false, message: trialCheck.message };
  }

  const limits = getPlanLimits(user.subscriptionPlan);
  
  // Unlimited businesses
  if (limits.businesses === -1) {
    return { allowed: true, remaining: -1 };
  }

  // Count existing businesses
  const businessCount = await Business.countDocuments({ 
    userId, 
    isDeleted: { $ne: true } 
  });

  const remaining = limits.businesses - businessCount;
  
  if (remaining <= 0) {
    return { 
      allowed: false, 
      message: `You've reached your business limit (${limits.businesses}). Upgrade your plan for more.`,
      limit: limits.businesses,
      used: businessCount,
      remaining: 0,
    };
  }

  return { 
    allowed: true, 
    limit: limits.businesses,
    used: businessCount,
    remaining,
  };
}

/**
 * Check if user's subscription is active
 */
export async function checkSubscriptionStatus(userId) {
  const user = await User.findById(userId);
  if (!user) return { active: false, message: 'User not found' };

  const trialCheck = await checkTrialExpiry(userId);
  
  return {
    active: !trialCheck.expired,
    plan: user.subscriptionPlan,
    status: user.subscriptionStatus,
    trialDaysRemaining: trialCheck.daysRemaining,
    message: trialCheck.message,
  };
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(userId, feature) {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, message: 'User not found' };

  const limits = getPlanLimits(user.subscriptionPlan);
  
  const featureMap = {
    whatsapp: limits.whatsappIntegration,
    customBranding: limits.customBranding,
    apiAccess: limits.apiAccess,
    advancedAnalytics: limits.advancedAnalytics,
    paymentReminders: limits.paymentReminders,
    whiteLabel: limits.whiteLabel,
  };

  const hasAccess = featureMap[feature] || false;
  
  return {
    allowed: hasAccess,
    message: hasAccess ? null : `This feature requires a higher plan. Please upgrade.`,
    currentPlan: user.subscriptionPlan,
  };
}

/**
 * Get user's current usage statistics
 */
export async function getUsageStats(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const limits = getPlanLimits(user.subscriptionPlan);
  
  // Reset monthly count if needed
  const now = new Date();
  const lastReset = new Date(user.lastInvoiceCountReset);
  let invoicesThisMonth = user.invoicesCreatedThisMonth;
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    invoicesThisMonth = 0;
  }

  const businessCount = await Business.countDocuments({ 
    userId, 
    isDeleted: { $ne: true } 
  });

  const totalInvoices = await Invoice.countDocuments({
    userId,
    isDeleted: { $ne: true },
  });

  return {
    invoices: {
      used: invoicesThisMonth,
      limit: limits.invoicesPerMonth,
      remaining: limits.invoicesPerMonth === -1 ? -1 : limits.invoicesPerMonth - invoicesThisMonth,
      percentage: limits.invoicesPerMonth === -1 ? 0 : Math.round((invoicesThisMonth / limits.invoicesPerMonth) * 100),
    },
    businesses: {
      used: businessCount,
      limit: limits.businesses,
      remaining: limits.businesses === -1 ? -1 : limits.businesses - businessCount,
      percentage: limits.businesses === -1 ? 0 : Math.round((businessCount / limits.businesses) * 100),
    },
    totalInvoices,
    plan: user.subscriptionPlan,
    status: user.subscriptionStatus,
    trialEndDate: user.trialEndDate,
    subscriptionEndDate: user.subscriptionEndDate,
  };
}
