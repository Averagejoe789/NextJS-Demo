'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, onAuthChange } from '../../../lib/auth-utils';
import { db } from '../../../lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import RestaurantForm from '../../../components/admin/RestaurantForm';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isResubmit, setIsResubmit] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      try {
        const restaurantRef = doc(db, 'restaurants', user.uid);
        const restaurantSnap = await getDoc(restaurantRef);
        if (restaurantSnap.exists()) {
          const status = restaurantSnap.data().status || 'approved';
          if (status === 'pending') router.replace('/admin/pending');
          else if (status === 'rejected') {
            setNeedsSetup(true);
            setIsResubmit(true);
          } else router.replace('/admin/dashboard');
        } else {
          setNeedsSetup(true);
        }
      } catch (err) {
        console.error('Error checking restaurant:', err);
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe?.();
  }, [router]);

  const handleSetupComplete = () => {
    router.replace('/admin/pending');
  };

  if (loading) {
    return (
      <AuthContainer>
        <div style={styles.loadingBox}>
          <div style={styles.loadingText}>Loading...</div>
        </div>
      </AuthContainer>
    );
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <AuthContainer>
      <div style={styles.card}>
        <h1 style={styles.title}>Set up your restaurant</h1>
        <p style={styles.subtitle}>
          Add your restaurant details to get started. You can update these later from the dashboard.
        </p>
        <RestaurantForm isOnboarding={!isResubmit} resubmit={isResubmit} onSuccess={handleSetupComplete} />
      </div>
    </AuthContainer>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
  loadingBox: {
    padding: '40px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
};
