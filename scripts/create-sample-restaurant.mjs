// Script to create a sample restaurant in Firestore
// Run with: node scripts/create-sample-restaurant.mjs

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
let db;
try {
  if (getApps().length === 0) {
    // Try to use service account from environment
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
    } else {
      // Use default credentials
      initializeApp({
        projectId: 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
    }
  }
  
  db = getFirestore();
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.error('Make sure FIREBASE_SERVICE_ACCOUNT environment variable is set');
  process.exit(1);
}

async function createSampleRestaurant() {
  try {
    console.log('Creating sample restaurant...\n');

    // Sample restaurant data
    const sampleRestaurantId = 'sample-restaurant-001';
    const sampleRestaurant = {
      name: 'Pizza Palace',
      description: 'Authentic Italian pizzeria serving traditional wood-fired pizzas with fresh ingredients',
      cuisine: 'Italian',
      address: '123 Main Street, New York, NY 10001',
      phone: '(555) 123-4567',
      email: 'info@pizzapalace.com',
      logoUrl: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Create restaurant profile
    const restaurantRef = db.collection('restaurants').doc(sampleRestaurantId);
    await restaurantRef.set(sampleRestaurant);
    console.log('✅ Sample restaurant created:', sampleRestaurantId);
    console.log('   Name:', sampleRestaurant.name);

    // Create sample menu items
    const menuItems = [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
        price: 12.99,
        category: 'Pizza',
        available: true,
        allergens: ['dairy', 'gluten'],
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Traditional pepperoni pizza with mozzarella and tomato sauce',
        price: 14.99,
        category: 'Pizza',
        available: true,
        allergens: ['dairy', 'gluten'],
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
        price: 8.99,
        category: 'Salads',
        available: true,
        allergens: ['dairy', 'gluten', 'eggs'],
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Garlic Bread',
        description: 'Warm bread with garlic butter and herbs',
        price: 5.99,
        category: 'Appetizers',
        available: true,
        allergens: ['dairy', 'gluten'],
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 6.99,
        category: 'Desserts',
        available: true,
        allergens: ['dairy', 'eggs', 'gluten'],
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'Spaghetti Carbonara',
        description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
        price: 13.99,
        category: 'Pasta',
        available: true,
        allergens: ['dairy', 'gluten', 'eggs'],
        createdAt: FieldValue.serverTimestamp()
      }
    ];

    // Add menu items
    const menuRef = restaurantRef.collection('menu');
    for (const item of menuItems) {
      await menuRef.add(item);
      console.log(`✅ Added menu item: ${item.name} ($${item.price})`);
    }

    // Create sample tables
    const tables = [];
    for (let i = 1; i <= 5; i++) {
      tables.push({
        tableNumber: i,
        status: 'available',
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Add tables
    const tablesRef = restaurantRef.collection('tables');
    for (const table of tables) {
      await tablesRef.add(table);
      console.log(`✅ Added table: Table ${table.tableNumber}`);
    }

    console.log('\n✅ Sample restaurant setup complete!');
    console.log(`\nRestaurant ID: ${sampleRestaurantId}`);
    console.log(`Menu items: ${menuItems.length}`);
    console.log(`Tables: ${tables.length}`);
    console.log('\nYou can now use restaurant ID:', sampleRestaurantId);

  } catch (error) {
    console.error('❌ Error creating sample restaurant:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Make sure your Firebase Admin credentials have write access.');
    }
    process.exit(1);
  }
}

// Run the script
createSampleRestaurant()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

