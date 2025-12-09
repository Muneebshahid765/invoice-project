"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import styles from './pricing.module.css';

export default function PricingPage() {
  const { user, accessToken, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please login',
        description: 'You need to login to upgrade',
        variant: 'destructive',
      });
      return;
    }

    setUpgrading(planId);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        toast({
          title: 'Redirecting to payment',
          description: 'Opening secure Stripe checkout...',
          variant: 'success',
        });
        // Redirect to Stripe Checkout page with card form
        window.location.href = data.url;
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create checkout session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upgrade',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>📄</span>
          <span className={styles.logoText}>InvoiceSaaS</span>
        </Link>
        <div className={styles.headerRight}>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Simple, Transparent Pricing</h1>
          <p className={styles.subtitle}>
            Choose the plan that fits your business. Start with a 14-day free trial.
          </p>
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`${styles.planCard} ${plan.popular ? styles.popularCard : ''}`}
            >
              {plan.popular && (
                <Badge className={styles.popularBadge}>Most Popular</Badge>
              )}
              <CardHeader>
                <CardTitle className={styles.planName}>{plan.name}</CardTitle>
                <CardDescription>
                  <span className={styles.price}>{formatPrice(plan.price)}</span>
                  {plan.price > 0 && <span className={styles.period}>/{plan.period}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles.featureItem}>
                      <span className={styles.checkIcon}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.id === 'FREE' ? (
                  <Link href="/register" className={styles.fullWidth}>
                    <Button variant="outline" className={styles.planButton}>
                      Start Free Trial
                    </Button>
                  </Link>
                ) : user?.subscriptionPlan === plan.id ? (
                  <Button disabled className={styles.planButton}>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className={styles.planButton}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                  >
                    {upgrading === plan.id ? 'Processing...' : 'Upgrade Now'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className={styles.faq}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>Can I cancel anytime?</h3>
              <p>Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>What payment methods do you accept?</h3>
              <p>We accept JazzCash, EasyPaisa, bank transfers, and international cards through Stripe.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Is there a free trial?</h3>
              <p>Yes! All new accounts get a 14-day free trial with access to basic features.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Can I upgrade or downgrade?</h3>
              <p>Yes, you can change your plan at any time. Changes take effect immediately.</p>
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <h2>Ready to get started?</h2>
          <p>Start your 14-day free trial today. No credit card required.</p>
          <Link href="/register">
            <Button size="lg">Start Free Trial</Button>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2024 InvoiceSaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
