'use client';
import { useState } from 'react';
import Link from 'next/link';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={styles.googleIcon}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function LoginForm({ onLogin, onGoogleSignIn, loading: externalLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!onGoogleSignIn) return;
    setError('');
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to sign in...');
      await onLogin(email, password);
      console.log('Sign in successful, redirecting...');
      // Don't set loading to false here - let the redirect happen
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Restaurant Admin Login</h1>
      <p style={styles.subtitle}>Sign in to manage your restaurant</p>
      
      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="your@email.com"
            disabled={isLoading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(isLoading ? styles.buttonDisabled : {})
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        {onGoogleSignIn && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerText}>or</span>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || googleLoading}
              style={{
                ...styles.googleButton,
                ...(isLoading || googleLoading ? styles.buttonDisabled : {})
              }}
            >
              <GoogleIcon />
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </>
        )}
      </form>

      <p style={styles.signupLink}>
        Don't have an account?{' '}
        <Link href="/admin/signup" style={styles.link}>
          Sign up here
        </Link>
      </p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
    marginBottom: '20px',
  },
  signupLink: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '4px 0',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: '14px',
    color: '#999',
  },
  googleButton: {
    padding: '12px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  googleIcon: {
    flexShrink: 0,
  },
};

