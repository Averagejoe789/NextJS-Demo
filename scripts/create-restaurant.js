#!/usr/bin/env node

/**
 * Script to create sample restaurant and menu in Firestore
 * Usage: node scripts/create-restaurant.js
 * 
 * Make sure you have Firebase Admin credentials set up:
 * - Set FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)
 * - OR set GOOGLE_APPLICATION_CREDENTIALS to path of service account key
 * - OR place service-account-key.json in project root
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    // Try to use service account from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
      console.log('✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use the path to service account key file
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
      console.log('✅ Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      // Try to load from a local file
      const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || 'menuai-d0ab5',
          storageBucket: 'menuai-d0ab5.firebasestorage.app'
        });
        console.log('✅ Firebase Admin initialized from service-account-key.json');
      } catch (fileError) {
        throw new Error(
          'Firebase Admin credentials not found. Please set FIREBASE_SERVICE_ACCOUNT environment variable, ' +
          'GOOGLE_APPLICATION_CREDENTIALS, or place service-account-key.json in the project root.'
        );
      }
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }

  return admin.firestore();
}

async function createSampleRestaurant() {
  const db = initializeFirebase();
  
  try {
    console.log('\n🍽️  Creating sample restaurant...\n');

    const sampleRestaurantId = 'sample-restaurant-001';
    
    // Check if restaurant already exists
    const restaurantRef = db.collection('restaurants').doc(sampleRestaurantId);
    const restaurantSnap = await restaurantRef.get();
    
    if (restaurantSnap.exists) {
      console.log('⚠️  Sample restaurant already exists!');
      console.log('   Restaurant ID:', sampleRestaurantId);
      console.log('   Name:', restaurantSnap.data().name);
      
      const menuRef = restaurantRef.collection('menu');
      const menuSnapshot = await menuRef.get();
      console.log('   Menu items:', menuSnapshot.size);
      
      const tablesRef = restaurantRef.collection('tables');
      const tablesSnapshot = await tablesRef.get();
      console.log('   Tables:', tablesSnapshot.size);
      
      console.log('\n✅ Restaurant already set up. Nothing to do.');
      return;
    }

    // Sample restaurant data
    const sampleRestaurant = {
      name: 'Pizza Palace',
      description: 'Authentic Italian pizzeria serving traditional wood-fired pizzas with fresh ingredients',
      cuisine: 'Italian',
      address: '123 Main Street, New York, NY 10001',
      phone: '(555) 123-4567',
      email: 'info@pizzapalace.com',
      logoUrl: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create restaurant profile
    await restaurantRef.set(sampleRestaurant);
    console.log('✅ Restaurant created:', sampleRestaurant.name);
    console.log('   ID:', sampleRestaurantId);

    // Sample menu items
    const menuItems = [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
        price: 12.99,
        category: 'Pizza',
        available: true,
        allergens: ['dairy', 'gluten'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Traditional pepperoni pizza with mozzarella and tomato sauce',
        price: 14.99,
        category: 'Pizza',
        available: true,
        allergens: ['dairy', 'gluten'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
        price: 8.99,
        category: 'Salads',
        available: true,
        allergens: ['dairy', 'gluten', 'eggs'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Garlic Bread',
        description: 'Warm bread with garlic butter and herbs',
        price: 5.99,
        category: 'Appetizers',
        available: true,
        allergens: ['dairy', 'gluten'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 6.99,
        category: 'Desserts',
        available: true,
        allergens: ['dairy', 'eggs', 'gluten'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Spaghetti Carbonara',
        description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
        price: 13.99,
        category: 'Pasta',
        available: true,
        allergens: ['dairy', 'gluten', 'eggs'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    // Add menu items
    console.log('\n📋 Adding menu items...');
    const menuRef = restaurantRef.collection('menu');
    for (const item of menuItems) {
      await menuRef.add(item);
      console.log(`   ✓ ${item.name} - $${item.price.toFixed(2)}`);
    }

    // Create sample tables
    console.log('\n🍽️  Creating tables...');
    const tablesRef = restaurantRef.collection('tables');
    for (let i = 1; i <= 5; i++) {
      await tablesRef.add({
        tableNumber: i,
        status: 'available',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✓ Table ${i}`);
    }

    console.log('\n✨ Sample restaurant created successfully!');
    console.log('\n📊 Summary:');
    console.log('   Restaurant ID:', sampleRestaurantId);
    console.log('   Restaurant Name:', sampleRestaurant.name);
    console.log('   Menu Items:', menuItems.length);
    console.log('   Tables:', 5);
    console.log('\n✅ All done! You can now use the app with this restaurant.\n');

  } catch (error) {
    console.error('\n❌ Error creating sample restaurant:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Make sure your Firebase Admin credentials have write access to Firestore.');
      console.error('   Check your Firestore security rules and service account permissions.');
    }
    process.exit(1);
  }
}

// Run the script
createSampleRestaurant()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

