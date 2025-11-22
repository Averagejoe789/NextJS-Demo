'use client';

import { useEffect } from 'react';

export default function OrderError({ error, reset }) {
  useEffect(() => {
    console.error('Order page error:', error);
  }, [error]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>⚠️ Error Loading Order Page</h1>
        <p style={styles.message}>
          {error?.message || 'Unable to load the order page. Please check that you have valid restaurantId and tableId in the URL.'}
        </p>
        <div style={styles.actions}>
          <button onClick={reset} style={styles.button}>
            Try again
          </button>
          <a href="/" style={styles.link}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '500px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  link: {
    padding: '12px 24px',
    backgroundColor: '#f8f9fa',
    color: '#333',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    border: '1px solid #ddd',
  },
};

