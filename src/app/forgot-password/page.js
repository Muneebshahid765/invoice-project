"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { forgotPassword, error, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    // Validate form
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const response = await forgotPassword(email);
    setIsLoading(false);

    if (response.success) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>📄</span>
            <span className={styles.logoText}>InvoiceSaaS</span>
          </Link>

          <Card className={styles.card}>
            <CardHeader className={styles.cardHeader}>
              <div className={styles.successIcon}>✉️</div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                If an account with that email exists, we&apos;ve sent you a password reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.successContent}>
              <p>
                The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
              </p>
            </CardContent>
            <CardFooter className={styles.cardFooter}>
              <Link href="/login" className={styles.backLink}>
                <Button variant="outline" className={styles.backButton}>
                  Back to login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>📄</span>
          <span className={styles.logoText}>InvoiceSaaS</span>
        </Link>

        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle>Forgot password?</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <Alert variant="destructive" className={styles.alert}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className={styles.formGroup}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={errors.email ? styles.inputError : ''}
                />
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>

              <Button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className={styles.cardFooter}>
            <Link href="/login" className={styles.link}>
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
