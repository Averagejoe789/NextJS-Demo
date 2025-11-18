'use client';
import { useState } from 'react';
// TEMPORARY: All API calls bypassed - using dummy data
// import { db } from '../../lib/firebase-client';
// import { doc, getDoc } from 'firebase/firestore';
// import { collection, getDocs } from 'firebase/firestore';
// import { getCurrentUser } from '../../lib/auth-utils';
import Link from 'next/link';

export default function Dashboard() {
  // TEMPORARY: Use dummy data - no API calls
  const [loading] = useState(false);
  const [restaurant] = useState({
    name: 'Sample Restaurant',
    cuisine: 'Italian',
    description: 'A wonderful Italian restaurant',
    address: '123 Main St, City, State',
    phone: '(555) 123-4567',
    email: 'contact@restaurant.com',
    logoUrl: null, // You can add a dummy image URL if needed
  });
  const [menuItemCount] = useState(12);
  const [error] = useState('');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Welcome back! Here's an overview of your restaurant.</p>

      {!restaurant ? (
        <div style={styles.setupCard}>
          <h2 style={styles.setupTitle}>Get Started</h2>
          <p style={styles.setupText}>
            You haven't registered your restaurant yet. Complete your restaurant profile to get started.
          </p>
          <Link href="/admin/restaurant" style={styles.setupButton}>
            Register Restaurant
          </Link>
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🍽️</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{restaurant.name || 'Unnamed Restaurant'}</h3>
                <p style={styles.statLabel}>Restaurant Name</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>📋</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{menuItemCount}</h3>
                <p style={styles.statLabel}>Menu Items</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>📍</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{restaurant.cuisine || 'Not set'}</h3>
                <p style={styles.statLabel}>Cuisine Type</p>
              </div>
            </div>
          </div>

          <div style={styles.quickActions}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.actionsGrid}>
              <Link href="/admin/restaurant" style={styles.actionCard}>
                <div style={styles.actionIcon}>✏️</div>
                <h3 style={styles.actionTitle}>Edit Restaurant</h3>
                <p style={styles.actionDescription}>Update your restaurant information</p>
              </Link>

              <Link href="/admin/menu" style={styles.actionCard}>
                <div style={styles.actionIcon}>📝</div>
                <h3 style={styles.actionTitle}>Manage Menu</h3>
                <p style={styles.actionDescription}>Add or edit menu items</p>
              </Link>
            </div>
          </div>

          {restaurant.logoUrl && (
            <div style={styles.logoSection}>
              <h2 style={styles.sectionTitle}>Restaurant Logo</h2>
              <img src={restaurant.logoUrl} alt="Restaurant logo" style={styles.logo} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '32px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  errorContainer: {
    padding: '20px',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
  },
  setupCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
  },
  setupTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  setupText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
  },
  setupButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: '40px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#333',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    marginTop: '4px',
  },
  quickActions: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '24px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'block',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  actionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    marginBottom: '8px',
    color: '#333',
  },
  actionDescription: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  logoSection: {
    marginTop: '32px',
  },
  logo: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
};

