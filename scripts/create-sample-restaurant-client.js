// Client-side script to create sample restaurant
// Copy and paste this into the browser console while on the admin dashboard
// Make sure you're logged in first

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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Sample menu items
const menuItems = [
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
    price: 12.99,
    category: 'Pizza',
    available: true,
    allergens: ['dairy', 'gluten'],
    createdAt: new Date().toISOString()
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Traditional pepperoni pizza with mozzarella and tomato sauce',
    price: 14.99,
    category: 'Pizza',
    available: true,
    allergens: ['dairy', 'gluten'],
    createdAt: new Date().toISOString()
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
    price: 8.99,
    category: 'Salads',
    available: true,
    allergens: ['dairy', 'gluten', 'eggs'],
    createdAt: new Date().toISOString()
  },
  {
    name: 'Garlic Bread',
    description: 'Warm bread with garlic butter and herbs',
    price: 5.99,
    category: 'Appetizers',
    available: true,
    allergens: ['dairy', 'gluten'],
    createdAt: new Date().toISOString()
  },
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee and mascarpone',
    price: 6.99,
    category: 'Desserts',
    available: true,
    allergens: ['dairy', 'eggs', 'gluten'],
    createdAt: new Date().toISOString()
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
    price: 13.99,
    category: 'Pasta',
    available: true,
    allergens: ['dairy', 'gluten', 'eggs'],
    createdAt: new Date().toISOString()
  }
];

// Sample tables
const tables = [];
for (let i = 1; i <= 5; i++) {
  tables.push({
    tableNumber: i,
    status: 'available',
    createdAt: new Date().toISOString()
  });
}

// Create restaurant (copy this into browser console)
async function createSampleRestaurant() {
  const { db } = await import('/lib/firebase-client.js');
  const { doc, setDoc, collection, addDoc } = await import('firebase/firestore');
  
  try {
    // Create restaurant profile
    const restaurantRef = doc(db, 'restaurants', sampleRestaurantId);
    await setDoc(restaurantRef, sampleRestaurant);
    console.log('✅ Created restaurant:', sampleRestaurantId);
    
    // Create menu items
    const menuRef = collection(db, `restaurants/${sampleRestaurantId}/menu`);
    for (const item of menuItems) {
      await addDoc(menuRef, item);
      console.log('✅ Added menu item:', item.name);
    }
    
    // Create tables
    const tablesRef = collection(db, `restaurants/${sampleRestaurantId}/tables`);
    for (const table of tables) {
      await addDoc(tablesRef, table);
      console.log('✅ Added table:', table.tableNumber);
    }
    
    console.log('✅ Sample restaurant created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating sample restaurant:', error);
    return false;
  }
}

// Usage: Run createSampleRestaurant() in browser console
console.log('Sample restaurant creation script loaded. Run createSampleRestaurant() to create the restaurant.');

