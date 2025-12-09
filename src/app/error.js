"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      background: 'hsl(var(--background))',
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>⚠️</div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
        color: 'hsl(var(--foreground))',
      }}>
        Something went wrong!
      </h1>
      <p style={{
        color: 'hsl(var(--muted-foreground))',
        marginBottom: '2rem',
        maxWidth: '400px',
      }}>
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
