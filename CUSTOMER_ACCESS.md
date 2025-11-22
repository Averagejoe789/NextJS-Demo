# How Customers Access the Chat

## Overview

Once the sample restaurant is created, customers can access the AI chat interface through the order page. The chat is **automatically integrated** on the order page - no separate route needed!

## Customer Access Flow

### 1. **Via QR Code (Recommended)**
- Restaurant owner generates QR codes in `/admin/tables`
- Customer scans QR code at their table
- Opens: `/order?restaurantId=sample-restaurant-001&tableId=<table-document-id>`
- **Chat interface appears automatically on the right side of the order page**

### 2. **Direct URL Access**
Customers can visit the order page directly with:
```
http://localhost:3000/order?restaurantId=sample-restaurant-001&tableId=<table-id>
```

## Finding Table IDs

Since tables have auto-generated document IDs, here's how to find them:

### Option 1: Admin Tables Page (Easiest)
1. Visit: `http://localhost:3000/admin/tables`
2. View the list of tables
3. Each table shows its ID
4. QR codes are generated automatically with the correct IDs

### Option 2: Firebase Console
1. Go to Firebase Console
2. Navigate to: `restaurants/sample-restaurant-001/tables`
3. Copy the document IDs (these are your tableIds)

### Option 3: Using Table Number
The order page now supports finding tables by number if you format the URL as:
```
http://localhost:3000/order?restaurantId=sample-restaurant-001&tableId=table-1
```
(where `1` is the table number)

## What Customers See

When visiting the order page, customers see:

1. **Left Side:**
   - Restaurant header with logo/name
   - Menu items (categorized)
   - "Add to Cart" buttons

2. **Right Side:**
   - **AI Chat Interface** - automatically loaded
   - Shopping cart
   - "Place Order" button

## Chat Features

The AI chat interface allows customers to:
- Ask questions about menu items
- Request recommendations
- Add items to cart via chat ("I'd like a Margherita Pizza")
- Remove items from cart
- View current cart contents
- Get dish information (ingredients, allergens, etc.)

## Example Customer Journey

1. **Customer sits at Table 1**
2. **Scans QR code** → Opens order page
3. **Chat appears automatically** on right side
4. **Types:** "What's on your menu?"
5. **AI responds** with menu overview
6. **Types:** "I'd like a Margherita Pizza"
7. **AI adds pizza to cart** automatically
8. **Reviews cart** on right side
9. **Clicks "Place Order"** button

## Technical Details

- **Order Page Route:** `/app/order/page.js`
- **Chat Component:** `components/customer/AIChatInterface.js`
- **Chat Session:** Automatically created/fetched when order page loads
- **Real-time Updates:** Uses Firestore listeners for live chat and cart updates

## Admin Actions

- **Generate QR Codes:** Visit `/admin/tables` → Click "Generate QR Codes"
- **View Orders:** Visit `/admin/orders` to see customer orders
- **Manage Menu:** Visit `/admin/menu` to add/edit items

## Troubleshooting

**"Table not found" error:**
- Make sure the table ID is correct (check `/admin/tables`)
- Or use table number format: `tableId=table-1`

**Chat not appearing:**
- Ensure `restaurantId` and `tableId` are in URL params
- Check browser console for errors
- Verify chat session is created (check Firestore)
