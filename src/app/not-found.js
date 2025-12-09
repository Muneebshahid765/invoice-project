import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>📄</div>
      <h1 style={{
        fontSize: '3rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
        color: 'hsl(var(--foreground))',
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: 'hsl(var(--foreground))',
      }}>
        Page Not Found
      </h2>
      <p style={{
        color: 'hsl(var(--muted-foreground))',
        marginBottom: '2rem',
        maxWidth: '400px',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
