'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '../../../lib/auth-utils';
import { db } from '../../../lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminRejected() {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      try {
        const restaurantRef = doc(db, 'restaurants', user.uid);
        const snap = await getDoc(restaurantRef);
        if (snap.exists() && snap.data().rejectionReason) {
          setRejectionReason(snap.data().rejectionReason);
        }
      } catch (err) {
        console.error('Error loading rejection reason:', err);
      }
    });
    return () => unsubscribe?.();
  }, [router]);

  return (
    <AuthContainer>
      <div style={styles.card}>
        <div style={styles.icon}>✕</div>
        <h1 style={styles.title}>Application not approved</h1>
        <p style={styles.message}>
          Your restaurant application was not approved at this time.
        </p>
        {rejectionReason && (
          <div style={styles.reasonBox}>
            <strong>Reason:</strong> {rejectionReason}
          </div>
        )}
        <p style={styles.hint}>
          You can update your details and resubmit, or contact support if you have questions.
        </p>
        <Link href="/admin/setup" style={styles.link}>
          Back to setup
        </Link>
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
    color: '#c33',
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
  reasonBox: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#991b1b',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  hint: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  link: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '500',
  },
};
