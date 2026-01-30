'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '../../../lib/auth-utils';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminPending() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe?.();
  }, [router]);

  return (
    <AuthContainer>
      <div style={styles.card}>
        <div style={styles.icon}>⏳</div>
        <h1 style={styles.title}>Under review</h1>
        <p style={styles.message}>
          Your restaurant has been submitted and is pending approval. We’ll review your details and get back to you soon.
        </p>
        <p style={styles.hint}>You can sign out and check back later, or we’ll notify you when it’s approved.</p>
      </div>
    </AuthContainer>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  message: {
    fontSize: '16px',
    color: '#666',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  hint: {
    fontSize: '14px',
    color: '#999',
  },
};
