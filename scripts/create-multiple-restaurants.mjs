// Script to create multiple sample restaurants in Firestore
// Run with: node scripts/create-multiple-restaurants.mjs

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Helper to load .env.local
function loadEnvLocal() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT='(.+)'/s);
    if (match) {
      return match[1];
    }
  } catch (error) {
    // Ignore if file doesn't exist
  }
  return null;
}

// Initialize Firebase Admin
let db;
try {
  if (getApps().length === 0) {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      serviceAccountJson = loadEnvLocal();
    }
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'menu-ai-7888e',
        storageBucket: 'menu-ai-7888e.firebasestorage.app'
      });
    } else {
      initializeApp({
        projectId: 'menu-ai-7888e',
        storageBucket: 'menu-ai-7888e.firebasestorage.app'
      });
    }
  }
  
  db = getFirestore();
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

// Restaurant configurations
const restaurants = [
  {
    id: 'restaurant-001',
    name: 'Pizza Palace',
    description: 'Authentic Italian pizzeria serving traditional wood-fired pizzas with fresh ingredients',
    cuisine: 'Italian',
    address: '123 Main Street, New York, NY 10001',
    phone: '(555) 123-4567',
    email: 'info@pizzapalace.com',
    menuItems: [
      { name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil', price: 12.99, category: 'Pizza', allergens: ['dairy', 'gluten'] },
      { name: 'Pepperoni Pizza', description: 'Traditional pepperoni pizza with mozzarella and tomato sauce', price: 14.99, category: 'Pizza', allergens: ['dairy', 'gluten'] },
      { name: 'Caesar Salad', description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan', price: 8.99, category: 'Salads', allergens: ['dairy', 'gluten', 'eggs'] },
      { name: 'Garlic Bread', description: 'Warm bread with garlic butter and herbs', price: 5.99, category: 'Appetizers', allergens: ['dairy', 'gluten'] },
      { name: 'Tiramisu', description: 'Classic Italian dessert with coffee and mascarpone', price: 6.99, category: 'Desserts', allergens: ['dairy', 'eggs', 'gluten'] },
      { name: 'Spaghetti Carbonara', description: 'Creamy pasta with bacon, eggs, and parmesan cheese', price: 13.99, category: 'Pasta', allergens: ['dairy', 'gluten', 'eggs'] }
    ],
    numTables: 5
  },
  {
    id: 'restaurant-002',
    name: 'Burger Barn',
    description: 'Gourmet burgers made with locally sourced beef and fresh ingredients',
    cuisine: 'American',
    address: '456 Oak Avenue, Los Angeles, CA 90001',
    phone: '(555) 234-5678',
    email: 'hello@burgerbarn.com',
    menuItems: [
      { name: 'Classic Burger', description: 'Beef patty with lettuce, tomato, onion, and special sauce', price: 9.99, category: 'Burgers', allergens: ['gluten', 'eggs'] },
      { name: 'Cheeseburger', description: 'Classic burger with melted cheddar cheese', price: 10.99, category: 'Burgers', allergens: ['dairy', 'gluten', 'eggs'] },
      { name: 'Bacon Burger', description: 'Beef patty with crispy bacon, lettuce, and tomato', price: 12.99, category: 'Burgers', allergens: ['gluten', 'eggs'] },
      { name: 'French Fries', description: 'Crispy golden fries with sea salt', price: 4.99, category: 'Sides', allergens: [] },
      { name: 'Onion Rings', description: 'Beer-battered onion rings', price: 5.99, category: 'Sides', allergens: ['gluten', 'eggs'] },
      { name: 'Milkshake', description: 'Vanilla, chocolate, or strawberry', price: 5.99, category: 'Beverages', allergens: ['dairy'] }
    ],
    numTables: 8
  },
  {
    id: 'restaurant-003',
    name: 'Sushi Zen',
    description: 'Fresh sushi and sashimi with traditional Japanese flavors',
    cuisine: 'Japanese',
    address: '789 Pine Street, San Francisco, CA 94102',
    phone: '(555) 345-6789',
    email: 'reservations@sushizen.com',
    menuItems: [
      { name: 'Salmon Sashimi', description: 'Fresh salmon sashimi (6 pieces)', price: 15.99, category: 'Sashimi', allergens: ['fish'] },
      { name: 'California Roll', description: 'Crab, avocado, and cucumber', price: 8.99, category: 'Rolls', allergens: ['fish', 'eggs'] },
      { name: 'Spicy Tuna Roll', description: 'Tuna with spicy mayo and cucumber', price: 9.99, category: 'Rolls', allergens: ['fish', 'eggs'] },
      { name: 'Dragon Roll', description: 'Eel, avocado, and cucumber with eel sauce', price: 12.99, category: 'Rolls', allergens: ['fish', 'eggs'] },
      { name: 'Miso Soup', description: 'Traditional Japanese miso soup', price: 3.99, category: 'Soups', allergens: ['soy'] },
      { name: 'Edamame', description: 'Steamed soybeans with sea salt', price: 5.99, category: 'Appetizers', allergens: ['soy'] },
      { name: 'Green Tea Ice Cream', description: 'Traditional Japanese green tea flavored ice cream', price: 6.99, category: 'Desserts', allergens: ['dairy'] }
    ],
    numTables: 6
  },
  {
    id: 'restaurant-004',
    name: 'Taco Loco',
    description: 'Authentic Mexican street tacos and traditional dishes',
    cuisine: 'Mexican',
    address: '321 Elm Boulevard, Austin, TX 78701',
    phone: '(555) 456-7890',
    email: 'info@tacoloco.com',
    menuItems: [
      { name: 'Beef Tacos', description: 'Three soft shell tacos with seasoned beef, onion, and cilantro', price: 8.99, category: 'Tacos', allergens: ['gluten'] },
      { name: 'Chicken Tacos', description: 'Three soft shell tacos with grilled chicken, onion, and cilantro', price: 8.99, category: 'Tacos', allergens: ['gluten'] },
      { name: 'Carnitas', description: 'Slow-cooked pork with onions and cilantro', price: 10.99, category: 'Tacos', allergens: ['gluten'] },
      { name: 'Guacamole', description: 'Fresh avocado dip with tomatoes and lime', price: 6.99, category: 'Appetizers', allergens: [] },
      { name: 'Churros', description: 'Fried dough pastries with cinnamon sugar', price: 5.99, category: 'Desserts', allergens: ['gluten', 'eggs'] },
      { name: 'Horchata', description: 'Traditional rice-based drink with cinnamon', price: 4.99, category: 'Beverages', allergens: [] }
    ],
    numTables: 7
  }
];

async function createRestaurant(restaurantConfig) {
  try {
    const restaurantRef = db.collection('restaurants').doc(restaurantConfig.id);
    const restaurantSnap = await restaurantRef.get();
    
    if (restaurantSnap.exists) {
      console.log(`⏭️  Restaurant ${restaurantConfig.id} already exists, skipping...`);
      return;
    }

    const restaurant = {
      name: restaurantConfig.name,
      description: restaurantConfig.description,
      cuisine: restaurantConfig.cuisine,
      address: restaurantConfig.address,
      phone: restaurantConfig.phone,
      email: restaurantConfig.email,
      logoUrl: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await restaurantRef.set(restaurant);
    console.log(`✅ Created restaurant: ${restaurantConfig.name} (${restaurantConfig.id})`);

    // Add menu items
    const menuRef = restaurantRef.collection('menu');
    for (const item of restaurantConfig.menuItems) {
      await menuRef.add({
        ...item,
        available: true,
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`   ✓ ${item.name} - $${item.price}`);
    }

    // Create tables
    const tablesRef = restaurantRef.collection('tables');
    for (let i = 1; i <= restaurantConfig.numTables; i++) {
      await tablesRef.add({
        tableNumber: i,
        status: 'available',
        createdAt: FieldValue.serverTimestamp()
      });
    }
    console.log(`   ✓ Created ${restaurantConfig.numTables} tables\n`);

  } catch (error) {
    console.error(`❌ Error creating restaurant ${restaurantConfig.id}:`, error.message);
    throw error;
  }
}

async function createAllRestaurants() {
  console.log(`Creating ${restaurants.length} restaurants...\n`);
  
  for (const restaurantConfig of restaurants) {
    await createRestaurant(restaurantConfig);
  }

  console.log('✅ All restaurants created successfully!');
  console.log(`\nTotal restaurants: ${restaurants.length}`);
  console.log(`\nRestaurant IDs:`);
  restaurants.forEach(r => console.log(`  - ${r.id}: ${r.name}`));
}

// Run the script
createAllRestaurants()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

