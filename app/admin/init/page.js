'use client';
import { useState } from 'react';
import { db } from '../../../lib/firebase-client';
import { doc, setDoc, collection, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function InitSampleRestaurant() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const createSampleRestaurant = async () => {
    setLoading(true);
    setError('');
    setStatus('Creating sample restaurant...');

    try {
      const sampleRestaurantId = 'sample-restaurant-001';
      
      // Check if restaurant already exists
      const restaurantRef = doc(db, 'restaurants', sampleRestaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (restaurantSnap.exists()) {
        setStatus('Sample restaurant already exists! ✓');
        setLoading(false);
        return;
      }

      // Create restaurant profile
      const sampleRestaurant = {
        name: 'Pizza Palace',
        description: 'Authentic Italian pizzeria serving traditional wood-fired pizzas with fresh ingredients',
        cuisine: 'Italian',
        address: '123 Main Street, New York, NY 10001',
        phone: '(555) 123-4567',
        email: 'info@pizzapalace.com',
        logoUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(restaurantRef, sampleRestaurant);
      setStatus('✅ Restaurant created! Adding menu items...');

      // Sample menu items
      const menuItems = [
        {
          name: 'Margherita Pizza',
          description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
          price: 12.99,
          category: 'Pizza',
          available: true,
          allergens: ['dairy', 'gluten'],
          createdAt: serverTimestamp()
        },
        {
          name: 'Pepperoni Pizza',
          description: 'Traditional pepperoni pizza with mozzarella and tomato sauce',
          price: 14.99,
          category: 'Pizza',
          available: true,
          allergens: ['dairy', 'gluten'],
          createdAt: serverTimestamp()
        },
        {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
          price: 8.99,
          category: 'Salads',
          available: true,
          allergens: ['dairy', 'gluten', 'eggs'],
          createdAt: serverTimestamp()
        },
        {
          name: 'Garlic Bread',
          description: 'Warm bread with garlic butter and herbs',
          price: 5.99,
          category: 'Appetizers',
          available: true,
          allergens: ['dairy', 'gluten'],
          createdAt: serverTimestamp()
        },
        {
          name: 'Tiramisu',
          description: 'Classic Italian dessert with coffee and mascarpone',
          price: 6.99,
          category: 'Desserts',
          available: true,
          allergens: ['dairy', 'eggs', 'gluten'],
          createdAt: serverTimestamp()
        },
        {
          name: 'Spaghetti Carbonara',
          description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
          price: 13.99,
          category: 'Pasta',
          available: true,
          allergens: ['dairy', 'gluten', 'eggs'],
          createdAt: serverTimestamp()
        }
      ];

      // Add menu items
      const menuRef = collection(db, `restaurants/${sampleRestaurantId}/menu`);
      for (const item of menuItems) {
        await addDoc(menuRef, item);
        setStatus(`✅ Added menu item: ${item.name}`);
      }

      setStatus('✅ Menu items added! Creating tables...');

      // Create sample tables
      const tablesRef = collection(db, `restaurants/${sampleRestaurantId}/tables`);
      for (let i = 1; i <= 5; i++) {
        await addDoc(tablesRef, {
          tableNumber: i,
          status: 'available',
          createdAt: serverTimestamp()
        });
        setStatus(`✅ Added table ${i}...`);
      }

      setStatus('✅ Sample restaurant created successfully! Restaurant ID: sample-restaurant-001');

    } catch (err) {
      console.error('Error creating sample restaurant:', err);
      setError(err.message || 'Failed to create sample restaurant');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Initialize Sample Restaurant</h1>
      <p style={styles.subtitle}>
        This will create a sample restaurant with menu items and tables for testing.
      </p>

      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {status && (
        <div style={styles.statusBox}>
          {status}
        </div>
      )}

      <button
        onClick={createSampleRestaurant}
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating...' : 'Create Sample Restaurant'}
      </button>

      <div style={styles.infoBox}>
        <h3 style={styles.infoBoxTitle}>What will be created:</h3>
        <ul style={styles.infoBoxList}>
          <li style={styles.infoBoxListItem}>Restaurant: Pizza Palace (ID: sample-restaurant-001)</li>
          <li style={styles.infoBoxListItem}>6 Menu items (Pizzas, Salads, Appetizers, Desserts, Pasta)</li>
          <li style={styles.infoBoxListItem}>5 Tables (Table 1-5)</li>
        </ul>
        <p style={styles.note}>
          Note: You need to have write permissions in Firestore for this to work.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    margin: '40px auto',
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
  button: {
    padding: '14px 32px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '24px',
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
  statusBox: {
    padding: '12px',
    backgroundColor: '#e7f5ff',
    border: '1px solid #b3d9ff',
    borderRadius: '4px',
    color: '#004085',
    fontSize: '14px',
    marginBottom: '20px',
    whiteSpace: 'pre-wrap',
  },
  infoBox: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  infoBoxTitle: {
    marginTop: 0,
    marginBottom: '12px',
    fontSize: '16px',
    color: '#333',
  },
  infoBoxList: {
    marginBottom: '12px',
    paddingLeft: '20px',
  },
  infoBoxListItem: {
    marginBottom: '6px',
  },
  note: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '12px',
    marginBottom: 0,
  },
};

