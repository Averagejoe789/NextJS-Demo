'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm({ onLogin, loading: externalLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
};

