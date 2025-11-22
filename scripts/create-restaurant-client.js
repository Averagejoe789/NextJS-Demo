/**
 * Client-side script to create sample restaurant
 * 
 * Usage in Browser Console:
 * 1. Open http://localhost:3000/admin/init in your browser
 * 2. Open browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste the code below
 * 4. Press Enter
 * 
 * OR use the web interface at /admin/init
 */

// Copy this code and paste in browser console:
/*
(async function createSampleRestaurant() {
  console.log('🍽️  Creating sample restaurant...\n');

  // Import Firebase (adjust path if needed)
  const { db } = await import('../../lib/firebase-client.js');
  const { doc, setDoc, collection, addDoc, getDoc, serverTimestamp } = await import('firebase/firestore');

  try {
    const sampleRestaurantId = 'sample-restaurant-001';
    
    // Check if restaurant already exists
    const restaurantRef = doc(db, 'restaurants', sampleRestaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    
    if (restaurantSnap.exists()) {
      console.log('⚠️  Sample restaurant already exists!');
      console.log('   Restaurant ID:', sampleRestaurantId);
      console.log('   Name:', restaurantSnap.data().name);
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
    console.log('\n📋 Adding menu items...');
    const menuRef = collection(db, `restaurants/${sampleRestaurantId}/menu`);
    for (const item of menuItems) {
      await addDoc(menuRef, item);
      console.log(`   ✓ ${item.name} - $${item.price.toFixed(2)}`);
    }

    // Create sample tables
    console.log('\n🍽️  Creating tables...');
    const tablesRef = collection(db, `restaurants/${sampleRestaurantId}/tables`);
    for (let i = 1; i <= 5; i++) {
      await addDoc(tablesRef, {
        tableNumber: i,
        status: 'available',
        createdAt: serverTimestamp()
      });
      console.log(`   ✓ Table ${i}`);
    }

    console.log('\n✨ Sample restaurant created successfully!');
    console.log('   Restaurant ID: sample-restaurant-001');
    console.log('   Menu Items: 6');
    console.log('   Tables: 5');
    console.log('\n✅ All done! You can now use the app.\n');

  } catch (error) {
    console.error('\n❌ Error creating sample restaurant:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Make sure your Firestore security rules allow writes.');
      console.error('   You may need to update Firestore rules in Firebase Console.');
    }
  }
})();
*/

