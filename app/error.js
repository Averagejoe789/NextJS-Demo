'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '500px',
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
          ⚠️ Something went wrong!
        </h1>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={reset} 
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Try again
          </button>
          <a 
            href="/" 
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#f8f9fa', 
              color: '#333', 
              textDecoration: 'none', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
