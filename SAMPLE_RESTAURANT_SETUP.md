# Sample Restaurant Setup

The app is configured to use a default sample restaurant with ID: `sample-restaurant-001`

## Quick Setup

The app is already configured to default all users to this restaurant. You just need to create the restaurant data in Firestore.

## Option 1: Create via Admin UI (Recommended)

1. Log in to the admin dashboard
2. Go to "My Restaurant" page
3. Fill out the restaurant form and save
4. Go to "Menu" page and add menu items
5. Go to "Tables" page and create tables

The system will automatically use the restaurant ID: `sample-restaurant-001`

## Option 2: Create Manually in Firebase Console

1. Open Firebase Console: https://console.firebase.google.com
2. Go to Firestore Database
3. Create the following structure:

```
restaurants/
  sample-restaurant-001/
    name: "Pizza Palace"
    description: "Authentic Italian pizzeria"
    cuisine: "Italian"
    address: "123 Main Street, New York, NY 10001"
    phone: "(555) 123-4567"
    email: "info@pizzapalace.com"
    createdAt: (timestamp)
    
    menu/
      (auto-generated-id)/
        name: "Margherita Pizza"
        description: "Classic pizza with fresh mozzarella"
        price: 12.99
        category: "Pizza"
        available: true
        allergens: ["dairy", "gluten"]
        
    tables/
      (auto-generated-id)/
        tableNumber: 1
        status: "available"
```

## Default Restaurant ID

The default restaurant ID is set in:
- `lib/auth-utils.js` - `DEFAULT_RESTAURANT_ID = 'sample-restaurant-001'`
- All components use `getRestaurantId()` which returns this default ID

## Testing

Once the restaurant is created:
- All admin users will see/manage this same restaurant
- Customers can scan QR codes that link to this restaurant
- Menu items, tables, and orders will all be associated with this restaurant

