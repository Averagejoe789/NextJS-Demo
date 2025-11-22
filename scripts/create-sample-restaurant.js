// Script to create a sample restaurant in Firestore
import admin from 'firebase-admin';
import { adminDb } from '../lib/firebase-admin.js';

async function createSampleRestaurant() {
  try {
    console.log('Creating sample restaurant...');

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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create restaurant profile
    const restaurantRef = adminDb.collection('restaurants').doc(sampleRestaurantId);
    await restaurantRef.set(sampleRestaurant);
    console.log('✅ Sample restaurant created:', sampleRestaurantId);

    // Create sample menu items
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
    const menuRef = restaurantRef.collection('menu');
    for (const item of menuItems) {
      await menuRef.add(item);
      console.log(`✅ Added menu item: ${item.name}`);
    }

    // Create sample tables
    const tables = [];
    for (let i = 1; i <= 5; i++) {
      tables.push({
        tableNumber: i,
        status: 'available',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Add tables (we'll generate QR codes when accessed through the UI)
    const tablesRef = restaurantRef.collection('tables');
    for (const table of tables) {
      await tablesRef.add(table);
      console.log(`✅ Added table: Table ${table.tableNumber}`);
    }

    console.log('\n✅ Sample restaurant setup complete!');
    console.log(`Restaurant ID: ${sampleRestaurantId}`);
    console.log(`Menu items: ${menuItems.length}`);
    console.log(`Tables: ${tables.length}`);

  } catch (error) {
    console.error('❌ Error creating sample restaurant:', error);
    process.exit(1);
  }
}

// Run the script
createSampleRestaurant()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

