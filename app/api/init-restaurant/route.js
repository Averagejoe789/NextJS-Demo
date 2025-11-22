import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (same pattern as /api/chat/route.js)
if (!admin.apps.length) {
	try {
		// Try to use service account credentials from environment variable
		const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
		
		if (serviceAccountJson) {
			// Parse the JSON string from environment variable
			const serviceAccount = JSON.parse(serviceAccountJson);
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				projectId: serviceAccount.project_id || 'menuai-d0ab5',
			});
		} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			// Use the path to service account key file
			admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				projectId: 'menuai-d0ab5',
			});
		} else {
			// Fallback: try to use application default credentials
			// This will work if gcloud is configured locally
			admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				projectId: 'menuai-d0ab5',
			});
		}
	} catch (error) {
		console.error('❌ Error initializing Firebase Admin:', error);
		// Continue anyway - will fail below if not initialized
	}
}

// Initialize restaurant using Firebase Admin SDK (same as used in other API routes)
export async function POST(request) {
  try {
    console.log('🍽️  Creating sample restaurant...\n');

    const sampleRestaurantId = 'sample-restaurant-001';
    
    // Get Firestore instance (same as chat route)
    const db = admin.firestore();
    
    // Check if restaurant already exists
    const restaurantRef = db.collection('restaurants').doc(sampleRestaurantId);
    const restaurantSnap = await restaurantRef.get();
    
    if (restaurantSnap.exists) {
      const restaurantData = restaurantSnap.data();
      const menuSnapshot = await restaurantRef.collection('menu').get();
      const tablesSnapshot = await restaurantRef.collection('tables').get();
      
      return NextResponse.json({
        success: true,
        message: 'Sample restaurant already exists',
        restaurantId: sampleRestaurantId,
        restaurant: restaurantData,
        menuItems: menuSnapshot.size,
        tables: tablesSnapshot.size
      });
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await restaurantRef.set(sampleRestaurant);
    console.log('✅ Restaurant created:', sampleRestaurant.name);

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
    const menuItemsAdded = [];
    for (const item of menuItems) {
      const docRef = await menuRef.add(item);
      menuItemsAdded.push({ id: docRef.id, name: item.name });
      console.log(`   ✓ ${item.name} - $${item.price.toFixed(2)}`);
    }

    // Create sample tables
    console.log('\n🍽️  Creating tables...');
    const tablesRef = restaurantRef.collection('tables');
    const tablesAdded = [];
    for (let i = 1; i <= 5; i++) {
      const docRef = await tablesRef.add({
        tableNumber: i,
        status: 'available',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      tablesAdded.push({ id: docRef.id, tableNumber: i });
      console.log(`   ✓ Table ${i}`);
    }

    console.log('\n✨ Sample restaurant created successfully!');

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

