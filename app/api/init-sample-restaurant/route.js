import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  try {
    console.log('Creating sample restaurant...');

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

    // Check if restaurant already exists
    const restaurantRef = adminDb.collection('restaurants').doc(sampleRestaurantId);
    const restaurantSnap = await restaurantRef.get();
    
    if (restaurantSnap.exists) {
      return NextResponse.json({
        success: true,
        message: 'Sample restaurant already exists',
        restaurantId: sampleRestaurantId
      });
    }

    // Create restaurant profile
    await restaurantRef.set(sampleRestaurant);
    console.log('✅ Sample restaurant created:', sampleRestaurantId);

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
    const menuRef = restaurantRef.collection('menu');
    const menuItemsAdded = [];
    for (const item of menuItems) {
      const docRef = await menuRef.add(item);
      menuItemsAdded.push({ id: docRef.id, name: item.name });
      console.log(`✅ Added menu item: ${item.name}`);
    }

    // Create sample tables (without QR codes - they'll be generated when accessed)
    const tables = [];
    for (let i = 1; i <= 5; i++) {
      tables.push({
        tableNumber: i,
        status: 'available',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Add tables
    const tablesRef = restaurantRef.collection('tables');
    const tablesAdded = [];
    for (const table of tables) {
      const docRef = await tablesRef.add(table);
      tablesAdded.push({ id: docRef.id, tableNumber: table.tableNumber });
      console.log(`✅ Added table: Table ${table.tableNumber}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Sample restaurant created successfully',
      restaurantId: sampleRestaurantId,
      restaurant: sampleRestaurant,
      menuItems: menuItemsAdded.length,
      tables: tablesAdded.length,
      details: {
        menuItems: menuItemsAdded,
        tables: tablesAdded
      }
    });

  } catch (error) {
    console.error('❌ Error creating sample restaurant:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create sample restaurant', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

