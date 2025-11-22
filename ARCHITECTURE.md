# Restaurant QR Code Ordering System - Architecture & User Flow

## 1. System Overview

### Purpose
A QR code-based restaurant ordering system where:
- **Restaurant Owners**: Create accounts, upload menus, configure tables, generate QR codes
- **Customers**: Scan QR codes at tables, view menu, chat with AI assistant about dishes, place orders

### Core Value Proposition
- Contactless ordering through QR codes
- AI-powered menu assistance for customers
- Real-time order management for restaurants
- Streamlined table management

---

## 2. User Personas & Roles

### Restaurant Owner (Admin)
- **Authentication**: Email/password via Firebase Auth
- **Access Level**: Full CRUD on their restaurant data
- **Key Actions**:
  - Register/Login
  - Create/Edit restaurant profile
  - Upload menu items with images
  - Configure table count
  - Generate/manage QR codes per table
  - View/manage orders per table
  - View analytics/statistics

### Customer
- **Authentication**: None required (anonymous access via QR code)
- **Access Level**: Read menu, chat, place orders for specific table
- **Key Actions**:
  - Scan QR code at table
  - View menu
  - Chat with AI assistant about dishes
  - Add items to cart
  - Place orders
  - View order status

---

## 3. Data Models (Firestore Structure)

```
Firestore Database Structure:

restaurants/
  {restaurantId}/
    ├── profile/
    │   ├── name: string
    │   ├── description: string
    │   ├── cuisine: string
    │   ├── address: string
    │   ├── phone: string
    │   ├── email: string
    │   ├── logoUrl: string
    │   ├── ownerId: string (Firebase Auth UID)
    │   └── createdAt: timestamp
    │
    ├── menu/
    │   └── {menuItemId}/
    │       ├── name: string
    │       ├── description: string
    │       ├── price: number
    │       ├── category: string (Appetizers, Main Course, Desserts, etc.)
    │       ├── imageUrl: string
    │       ├── available: boolean
    │       ├── allergens: array<string> (optional)
    │       └── createdAt: timestamp
    │
    ├── tables/
    │   └── {tableId}/
    │       ├── tableNumber: number
    │       ├── qrCodeUrl: string (stored in Storage, URL here)
    │       ├── qrCodeData: string (URL params: ?restaurantId=X&tableId=Y)
    │       ├── status: string (available, occupied, reserved)
    │       ├── capacity: number (optional)
    │       └── createdAt: timestamp
    │
    ├── chatSessions/
    │   └── {chatId}/
    │       ├── tableId: string
    │       ├── tableNumber: number
    │       ├── status: string (active, closed)
    │       ├── createdAt: timestamp
    │       └── messages/
    │           └── {messageId}/
    │               ├── text: string
    │               ├── sender: string ('user' | 'assistant')
    │               ├── type: string ('message' | 'menu_item' | 'order')
    │               ├── metadata: object (optional - for structured data)
    │               └── timestamp: timestamp
    │
    └── orders/
        └── {orderId}/
            ├── tableId: string
            ├── tableNumber: number
            ├── chatId: string (links to chat session)
            ├── items: array<
            │   {
            │     menuItemId: string,
            │     name: string,
            │     price: number,
            │     quantity: number,
            │     specialInstructions: string (optional)
            │   }
            │ >
            ├── status: string (pending, confirmed, preparing, ready, completed, cancelled)
            ├── totalAmount: number
            ├── createdAt: timestamp
            ├── updatedAt: timestamp
            └── notes: string (optional)

users/ (Firebase Auth handles this, but we store additional profile data)
  {uid}/
    ├── email: string
    ├── restaurantId: string (reference to restaurants collection)
    └── createdAt: timestamp
```

---

## 4. User Flows

### 4.1 Restaurant Owner Flow

#### Onboarding Flow
```
1. Visit /admin/signup
   → Fill form (email, password)
   → Create Firebase Auth account
   → Create user profile document
   → Redirect to /admin/restaurant

2. Complete Restaurant Profile (/admin/restaurant)
   → Enter restaurant details (name, cuisine, description, etc.)
   → Upload logo
   → Save profile
   → Redirect to /admin/dashboard

3. Upload Menu (/admin/menu)
   → Add menu items (name, description, price, category)
   → Upload item images
   → Save items
   → View complete menu

4. Configure Tables (/admin/tables) [TO BE CREATED]
   → Specify number of tables
   → System generates table records
   → System generates QR codes for each table
   → Download/print QR codes
   → View/manage tables
```

#### Management Flow
```
Dashboard (/admin/dashboard)
  → View restaurant stats (menu items count, active tables, pending orders)
  → Quick links to:
    - Edit Restaurant
    - Manage Menu
    - Manage Tables
    - View Orders

Orders Management (/admin/orders) [TO BE CREATED]
  → View all orders grouped by table
  → Filter by status (pending, preparing, ready)
  → Update order status
  → View order details
```

### 4.2 Customer Flow

#### Ordering Flow (via QR Code) - **RECOMMENDED HYBRID APPROACH**

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: QR Code Scan                                            │
│ ───────────────────────────────────────────────────────────────│
│ • Customer scans QR code at table                               │
│ • QR code contains: restaurantId + tableId                      │
│ • Opens: /order?restaurantId=X&tableId=Y                       │
│ • System creates/retrieves chat session for table               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Customer Landing Page (/order)                          │
│ ───────────────────────────────────────────────────────────────│
│ Layout: Split Screen                                            │
│                                                               │
│ ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│ │   MENU SECTION      │  │    AI CHAT + CART SECTION        │ │
│ │   (Left Panel)      │  │    (Right Panel)                 │ │
│ │                     │  │                                   │ │
│ │ • Restaurant Logo   │  │ ┌──────────────────────────────┐ │ │
│ │ • Table Number      │  │ │   AI Chat Interface          │ │ │
│ │ • Menu Categories   │  │ │                              │ │ │
│ │ • Menu Items Grid   │  │ │ • Greeting message           │ │ │
│ │   - Image           │  │ │ • Conversation history       │ │ │
│ │   - Name            │  │ │ • AI responses               │ │ │
│ │   - Price           │  │ │                              │ │ │
│ │   - [Add to Cart]   │  │ └──────────────────────────────┘ │ │
│ │                     │  │                                   │ │
│ │ [Click item → adds] │  │ ┌──────────────────────────────┐ │ │
│ │                     │  │ │   Shopping Cart (Sticky)     │ │ │
│ │                     │  │ │                              │ │ │
│ │                     │  │ │ Items: 3                     │ │ │
│ │                     │  │ │ Total: $45.98                │ │ │
│ │                     │  │ │ [View Cart] [Place Order]    │ │ │
│ │                     │  │ └──────────────────────────────┘ │ │
│ └─────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Ordering Methods (3 Ways to Add Items)                  │
│ ───────────────────────────────────────────────────────────────│
│                                                               │
│ METHOD A: Direct Menu Click                                    │
│ • Customer clicks "Add to Cart" button on menu item           │
│ • Item immediately added to cart                               │
│ • Cart updates with visual feedback                            │
│ • AI chat shows confirmation: "Added 1x Margherita Pizza"      │
│                                                               │
│ METHOD B: Natural Language via AI Chat                         │
│ • Customer types: "I'd like 2 pizzas and a salad"             │
│ • AI parses intent:                                            │
│   - Identifies items: Margherita Pizza (2x), Caesar Salad     │
│   - Confirms: "Adding 2x Margherita Pizza ($25.98) and         │
│     1x Caesar Salad ($8.99) to your cart"                      │
│ • Customer confirms or corrects                                │
│ • Items added to cart                                          │
│                                                               │
│ METHOD C: AI-Assisted Discovery + Order                        │
│ • Customer: "What's vegetarian on the menu?"                   │
│ • AI lists vegetarian options with prices                      │
│ • Customer: "Add the Margherita Pizza"                         │
│ • AI adds item and confirms                                    │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Cart Management & Review                                │
│ ───────────────────────────────────────────────────────────────│
│ • Cart updates in real-time (shared state)                     │
│ • Customer can view cart details:                              │
│   - Item name, quantity, price                                 │
│   - Special instructions (per item)                            │
│   - Edit/remove items                                          │
│ • Cart persists across page reloads                            │
│ • AI can answer questions about items in cart                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Place Order                                             │
│ ───────────────────────────────────────────────────────────────│
│ Option A: Via Cart Button                                       │
│ • Click "Place Order" in cart panel                            │
│ • Opens order review modal                                     │
│ • Final confirmation                                           │
│                                                               │
│ Option B: Via AI Chat                                           │
│ • Customer: "I'm ready to order" or "Place my order"          │
│ • AI: "Review your order: [list items] Total: $45.98.         │
│       Type 'confirm' to place order."                          │
│ • Customer confirms                                            │
│                                                               │
│ Order Submission:                                               │
│ • Creates order document in Firestore                          │
│ • Links to tableId and chatId                                  │
│ • Status: 'pending'                                            │
│ • Shows confirmation message                                    │
│ • Clears cart (or keeps for next order?)                       │
│ • Order appears in restaurant's queue                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Order Tracking                                          │
│ ───────────────────────────────────────────────────────────────│
│ • Order status updates in real-time (Firestore listener)       │
│ • UI shows status badge: Pending → Preparing → Ready           │
│ • Customer can ask AI: "Where's my order?"                     │
│ • AI responds with current status                              │
│ • Notification when order is ready                             │
│ • Option to place another order                                │
└─────────────────────────────────────────────────────────────────┘
```

#### **Key Design Decisions for Order Placement:**

1. **Hybrid Approach**: Menu + AI Chat + Cart
   - **Why**: Not everyone wants to chat - some prefer visual browsing
   - **Why**: AI adds value for discovery and questions
   - **Why**: Traditional cart provides familiar UX

2. **Multiple Ordering Methods**:
   - **Visual click** (fastest for repeat customers)
   - **Natural language** (conversational, discoverable)
   - **AI-assisted** (helpful for dietary needs/preferences)

3. **Unified Cart State**:
   - Cart visible in both chat and menu sections
   - All methods update the same cart
   - Real-time synchronization

4. **Persistent Session**:
   - Cart persists for entire table session
   - Can place multiple orders during session
   - Chat history maintained

5. **AI Message Types**:
   - **Regular messages**: Questions/answers
   - **Action messages**: Item added/removed
   - **Order messages**: Order placed/status updates

---

## 5. Component Architecture

### 5.1 Directory Structure

```
app/
├── admin/                          # Admin routes (restaurant owner)
│   ├── layout.js                   # Admin layout with auth protection
│   ├── login/page.js
│   ├── signup/page.js
│   ├── dashboard/page.js
│   ├── restaurant/page.js
│   ├── menu/page.js
│   ├── tables/page.js              # [TO BE CREATED] Table management
│   └── orders/page.js              # [TO BE CREATED] Order management
│
├── order/                          # [TO BE CREATED] Customer ordering interface
│   └── page.js                     # Main customer interface (QR code landing)
│
├── api/
│   ├── chat/
│   │   └── route.js                # Chat API (enhance for AI integration)
│   ├── orders/
│   │   ├── route.js                # [TO BE CREATED] Create/get orders
│   │   └── [orderId]/
│   │       └── route.js            # [TO BE CREATED] Update order status
│   ├── qr/
│   │   └── [restaurantId]/
│   │       └── [tableId]/
│   │           └── route.js        # [TO BE CREATED] Generate QR codes
│   └── ai/
│       └── chat/route.js           # [TO BE CREATED] AI assistant endpoint
│
└── page.js                         # Home page (can redirect or show info)

components/
├── admin/
│   ├── AdminNavbar.js
│   ├── Dashboard.js
│   ├── RestaurantForm.js
│   ├── MenuUpload.js
│   ├── TableManagement.js          # [TO BE CREATED] Table config & QR generation
│   ├── OrderManagement.js          # [TO BE CREATED] Order list & status updates
│   └── AuthContainer.js
│
├── customer/
│   ├── OrderInterface.js           # [TO BE CREATED] Main customer UI
│   ├── MenuDisplay.js              # [TO BE CREATED] Menu display component
│   ├── AIChatInterface.js          # [TO BE CREATED] Enhanced chat with AI
│   ├── Cart.js                     # [TO BE CREATED] Shopping cart
│   └── OrderStatus.js              # [TO BE CREATED] Order tracking
│
└── shared/
    ├── QRCodeGenerator.js          # [TO BE CREATED] QR code generation utility
    └── LoadingSpinner.js

lib/
├── firebase-client.js              # Firebase client config
├── auth-utils.js                   # Auth utilities
├── menu-utils.js                   # [TO BE CREATED] Menu helper functions
├── order-utils.js                  # [TO BE CREATED] Order helper functions
└── ai-utils.js                     # [TO BE CREATED] AI integration utilities
```

---

## 6. API Routes & Endpoints

### 6.1 Chat API (`/api/chat`)
- **POST**: Save user message to Firestore
- **Enhancement**: Integrate with AI service to generate assistant responses

### 6.2 AI Chat API (`/api/ai/chat`) [TO BE CREATED]
- **POST**: 
  - Input: `{ restaurantId, tableId, message, chatHistory }`
  - Fetch restaurant menu
  - Process with AI (OpenAI, Anthropic, or similar)
  - Return: `{ response, suggestions, menuItems }`

### 6.3 Orders API (`/api/orders`) [TO BE CREATED]
- **POST**: Create new order
  - Input: `{ restaurantId, tableId, items[], specialInstructions }`
  - Validate items exist in menu
  - Calculate total
  - Create order document
  - Return: `{ orderId, status, total }`

- **GET**: Get orders for restaurant
  - Query params: `restaurantId`, `status?`, `tableId?`
  - Return: `{ orders[] }`

### 6.4 Order Update API (`/api/orders/[orderId]`) [TO BE CREATED]
- **PATCH**: Update order status
  - Input: `{ status }`
  - Update order document
  - Return: `{ orderId, status }`

### 6.5 QR Code API (`/api/qr/[restaurantId]/[tableId]`) [TO BE CREATED]
- **GET**: Generate/return QR code image
  - Generate QR code with URL: `/order?restaurantId=X&tableId=Y`
  - Store QR code image in Firebase Storage
  - Return: QR code image or URL

---

## 7. Order Placement: Technical Implementation

### 7.1 Cart State Management

**Shared Cart State** (Client-side):
```javascript
// Component: OrderInterface.js
const [cart, setCart] = useState([]);
const [restaurantId, setRestaurantId] = useState(null);
const [tableId, setTableId] = useState(null);

// Cart structure:
cart = [
  {
    menuItemId: string,
    name: string,
    price: number,
    quantity: number,
    specialInstructions: string (optional),
    imageUrl: string (optional)
  }
]
```

**Cart Storage**:
- Option 1: **Local Storage** (per table session)
  - Persists across page reloads
  - Key: `cart_${restaurantId}_${tableId}`
  - Clears when session ends

- Option 2: **Firestore** (preferred for real-time sync)
  - Document: `restaurants/{restaurantId}/chatSessions/{chatId}/cart`
  - Real-time updates across devices at same table
  - Can share cart state between multiple customers at table

**Recommended**: Firestore for multi-device support at same table.

### 7.2 Adding Items to Cart

**Method 1: Direct Menu Click**
```javascript
const handleAddToCart = (menuItem) => {
  // Update cart state
  setCart(prevCart => {
    // Check if item already in cart
    const existingIndex = prevCart.findIndex(item => item.menuItemId === menuItem.id);
    if (existingIndex >= 0) {
      // Increment quantity
      const updated = [...prevCart];
      updated[existingIndex].quantity += 1;
      return updated;
    } else {
      // Add new item
      return [...prevCart, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        imageUrl: menuItem.imageUrl
      }];
    }
  });
  
  // Send confirmation to AI chat
  addMessageToChat({
    text: `Added 1x ${menuItem.name} to your cart`,
    sender: 'assistant',
    type: 'action'
  });
  
  // Sync to Firestore (if using Firestore cart)
  updateFirestoreCart();
};
```

**Method 2: Natural Language via AI**
```javascript
// User message: "Add 2 Margherita Pizzas"
// AI parses and returns structured data:
{
  action: 'add_to_cart',
  items: [
    { menuItemId: 'pizza-123', quantity: 2 }
  ],
  response: "Adding 2x Margherita Pizza ($25.98) to your cart"
}

// Handler:
const handleAICartAction = (actionData) => {
  if (actionData.action === 'add_to_cart') {
    actionData.items.forEach(item => {
      // Add each item to cart
      addItemToCart(item.menuItemId, item.quantity);
    });
  }
  // Display AI response in chat
  displayAIMessage(actionData.response);
};
```

**Method 3: AI Suggestion**
```javascript
// Customer: "What do you recommend?"
// AI responds with menu items + "Would you like me to add [item]?"
// Customer confirms → same flow as Method 2
```

### 7.3 Order Placement Flow

**Step 1: Customer Initiates Order**
- Clicks "Place Order" button OR
- Types "I'm ready to order" in chat

**Step 2: Order Review**
- Display modal/section with:
  - All cart items with quantities
  - Total price
  - Option to add special instructions
  - Final confirmation button

**Step 3: Create Order Document**
```javascript
const placeOrder = async () => {
  const orderData = {
    restaurantId: restaurantId,
    tableId: tableId,
    tableNumber: table.number,
    chatId: chatSessionId,
    items: cart.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || ''
    })),
    totalAmount: calculateTotal(cart),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  // Create order in Firestore
  const orderRef = await addDoc(
    collection(db, `restaurants/${restaurantId}/orders`),
    orderData
  );
  
  // Add order message to chat
  await addDoc(
    collection(db, `restaurants/${restaurantId}/chatSessions/${chatId}/messages`),
    {
      text: `Order #${orderRef.id} placed successfully! Total: $${orderData.totalAmount.toFixed(2)}`,
      sender: 'assistant',
      type: 'order',
      metadata: { orderId: orderRef.id },
      timestamp: serverTimestamp()
    }
  );
  
  // Option: Clear cart or keep for next order
  // setCart([]);
  
  // Show confirmation
  showConfirmation(orderRef.id);
};
```

**Step 4: Real-time Order Tracking**
```javascript
// Listen for order status updates
useEffect(() => {
  if (!orderId) return;
  
  const orderRef = doc(db, `restaurants/${restaurantId}/orders`, orderId);
  const unsubscribe = onSnapshot(orderRef, (snapshot) => {
    const order = snapshot.data();
    setOrderStatus(order.status);
    
    // Update UI with status
    if (order.status === 'ready') {
      showNotification('Your order is ready!');
    }
  });
  
  return () => unsubscribe();
}, [orderId]);
```

### 7.4 AI Integration for Order Parsing

**AI Chat API Enhancement**:
```javascript
// POST /api/ai/chat
{
  restaurantId: string,
  tableId: string,
  message: string,
  chatHistory: array,
  menu: array,  // Current menu items
  cart: array   // Current cart state
}

// AI Response:
{
  text: string,           // Natural language response
  action: string,         // 'none' | 'add_to_cart' | 'remove_from_cart' | 'show_cart' | 'place_order'
  items: array,           // Structured item data if action involves cart
  suggestions: array      // Suggested menu items
}
```

**Action Parsing**:
- **"Add X to cart"** → `action: 'add_to_cart'`, `items: [{ menuItemId, quantity }]`
- **"Remove X from cart"** → `action: 'remove_from_cart'`, `items: [...]`
- **"Show my cart"** → `action: 'show_cart'`
- **"Place order"** → `action: 'place_order'`
- **Questions** → `action: 'none'`, just return text response

---

## 8. Key Features & Integration Points

### 8.1 QR Code Generation
- **Library**: `qrcode` or `react-qrcode` npm package
- **Process**:
  1. When restaurant owner specifies table count, create table documents
  2. For each table, generate QR code containing URL: `/order?restaurantId={id}&tableId={id}`
  3. Store QR code image in Firebase Storage
  4. Store Storage URL in table document
  5. Allow restaurant owner to download/print QR codes

### 8.2 AI Assistant Integration (OpenAI)

The AI assistant is the core value proposition of this system. It helps customers discover menu items, answer questions, and place orders through natural conversation using **OpenAI's GPT models**.

#### 8.2.1 OpenAI Model Selection

**Selected Model: OpenAI GPT-4 Turbo** (gpt-4-turbo-preview or gpt-4o)

**Why OpenAI GPT-4 Turbo:**
- ✅ **Function Calling (Tools)**: Excellent support for structured actions
- ✅ **Context Window**: 128K tokens (sufficient for menu + chat history)
- ✅ **Speed**: Fast response times for conversational AI
- ✅ **Reliability**: Mature API with excellent error handling
- ✅ **JSON Mode**: Structured outputs for cart operations
- ✅ **Cost-Effective**: Good balance of performance and cost

**Model Options:**
- **gpt-4o** (Recommended): Latest model, fastest, best cost/performance
- **gpt-4-turbo-preview**: Stable, excellent for function calling
- **gpt-4**: Most capable but slower and more expensive
- **gpt-3.5-turbo**: Faster and cheaper, good for simple queries (fallback option)

**Recommended Setup:**
- Primary: `gpt-4o` or `gpt-4-turbo-preview` for full features
- Fallback: `gpt-3.5-turbo` for simple questions to reduce costs

#### 8.2.2 System Prompt Design

The system prompt defines the AI's role, capabilities, and behavior. It should be comprehensive but concise.

```javascript
const SYSTEM_PROMPT = `You are a friendly and knowledgeable restaurant assistant helping customers at {restaurantName}.

**Your Role:**
- Answer questions about menu items (ingredients, allergens, preparation)
- Help customers discover dishes based on preferences (dietary restrictions, cuisine types)
- Assist with ordering by adding items to their cart
- Provide friendly, conversational service

**Restaurant Information:**
- Name: {restaurantName}
- Cuisine: {cuisine}
- Description: {description}

**Menu Items Available:**
{formattedMenuItems}

**Current Cart:**
{currentCartItems}
Total: ${cartTotal}

**Your Capabilities:**
1. **Answer Questions**: When customers ask about menu items, provide accurate information
2. **Recommendations**: Suggest dishes based on preferences (vegetarian, spicy, etc.)
3. **Add to Cart**: When customers want to order, use the add_to_cart function
4. **Show Cart**: When customers ask about their cart, show current items
5. **Place Order**: Help customers finalize their order when ready

**Guidelines:**
- Be friendly, helpful, and concise
- If asked about items not on the menu, politely say they're not available
- Always confirm quantities when adding items to cart
- When unsure, ask clarifying questions
- For dietary restrictions, highlight relevant menu items
- Show prices in responses: "Margherita Pizza - $12.99"

**Response Format:**
- Provide natural, conversational responses
- When adding items, confirm clearly: "Added 2x Margherita Pizza ($25.98) to your cart"
- When recommending, explain why: "If you like spicy food, try our Pepperoni Pizza"
`;
```

**Menu Formatting for Context:**
```javascript
const formatMenuForPrompt = (menuItems) => {
  return menuItems.map(item => {
    const allergens = item.allergens?.length > 0 
      ? `\n  Allergens: ${item.allergens.join(', ')}` 
      : '';
    return `
- ${item.name} - $${item.price.toFixed(2)}
  Description: ${item.description}
  Category: ${item.category}${allergens}
  Available: ${item.available ? 'Yes' : 'No'}`
  }).join('\n');
};
```

#### 8.2.3 API Endpoint Architecture

**Endpoint**: `/api/ai/chat`

**Request Structure:**
```javascript
// POST /api/ai/chat
{
  restaurantId: string,
  tableId: string,
  chatId: string,        // Chat session ID
  message: string,       // User's message
  chatHistory: array,    // Previous messages (last 10-20)
  menu: array,           // Current menu items
  cart: array,           // Current cart state
  context: {
    restaurantName: string,
    cuisine: string,
    tableNumber: number
  }
}
```

**Response Structure:**
```javascript
{
  text: string,                    // Natural language response
  action: 'none' | 'add_to_cart' | 'remove_from_cart' | 'show_cart' | 'place_order' | 'clarify',
  items: array,                    // Items affected (if action involves cart)
  suggestions: array,              // Suggested menu items
  confidence: number,              // Confidence score (0-1)
  metadata: {
    parsedQuantity: number,       // Parsed quantity from message
    menuItemId: string,           // Identified menu item ID
    reason: string                // Reasoning for action
  }
}
```

#### 8.2.4 OpenAI Function Calling (Tools)

**Structured Actions via OpenAI Function Calling:**

OpenAI's function calling (now called "tools" in the API) allows the AI to call predefined functions for structured cart operations. This ensures reliable parsing and execution of order actions.

```javascript
// Define available tools (functions) for OpenAI
// OpenAI uses "tools" instead of "functions" in newer API versions
const OPENAI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Add menu items to the customer\'s cart. Use this when the customer wants to order items.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of menu items to add to cart',
            items: {
              type: 'object',
              properties: {
                menuItemId: {
                  type: 'string',
                  description: 'The ID of the menu item to add (must match a menu item ID)'
                },
                quantity: {
                  type: 'number',
                  description: 'Number of this item to add (default: 1)',
                  minimum: 1
                },
                specialInstructions: {
                  type: 'string',
                  description: 'Any special instructions or modifications for this item (e.g., "no onions", "extra cheese")'
                }
              },
              required: ['menuItemId']
            }
          }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_cart',
      description: 'Remove items from the customer\'s cart. Use this when the customer wants to remove or cancel items.',
      parameters: {
        type: 'object',
        properties: {
          menuItemId: {
            type: 'string',
            description: 'The ID of the menu item to remove from cart'
          },
          quantity: {
            type: 'number',
            description: 'Quantity to remove (if not specified, removes all of this item)',
            minimum: 1
          }
        },
        required: ['menuItemId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'show_cart',
      description: 'Show the current cart contents to the customer. Use this when the customer asks about their cart, what they ordered, or wants to review their order.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_menu_item_info',
      description: 'Get detailed information about a specific menu item. Use this when the customer asks about ingredients, allergens, description, or price of a menu item.',
      parameters: {
        type: 'object',
        properties: {
          menuItemId: {
            type: 'string',
            description: 'The ID of the menu item to get information about'
          }
        },
        required: ['menuItemId']
      }
    }
  }
];
```

**OpenAI Response with Tool Call:**
```javascript
// Example: User says "Add 2 Margherita Pizzas"
// OpenAI response structure (newer API uses 'tool_calls' instead of 'function_call')
{
  id: "chatcmpl-abc123",
  object: "chat.completion",
  created: 1234567890,
  model: "gpt-4-turbo-preview",
  choices: [{
    index: 0,
    message: {
      role: "assistant",
      content: "I'll add 2 Margherita Pizzas to your cart!",
      tool_calls: [{
        id: "call_abc123",
        type: "function",
        function: {
          name: "add_to_cart",
          arguments: "{\"items\":[{\"menuItemId\":\"pizza-123\",\"quantity\":2}]}"
        }
      }]
    },
    finish_reason: "tool_calls"
  }],
  usage: {
    prompt_tokens: 500,
    completion_tokens: 100,
    total_tokens: 600
  }
}
```

#### 8.2.5 Implementation: Server-Side API Route

**Full API Route Example (`/app/api/ai/chat/route.js`):**

```javascript
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminDb } from '../../../lib/firebase-admin'; // Use admin SDK for server-side

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define OpenAI tools (functions) for cart operations
const OPENAI_TOOLS = [/* ... (defined above) ... */];

export async function POST(request) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, chatId, message, chatHistory = [], menu, cart, context } = body;

    // Validate required fields
    if (!restaurantId || !tableId || !message) {
      return NextResponse.json(
        { error: 'restaurantId, tableId, and message are required' },
        { status: 400 }
      );
    }

    // Fetch menu if not provided (or refresh to ensure latest)
    let menuItems = menu;
    if (!menuItems || menuItems.length === 0) {
      // Use Firestore Admin SDK for server-side access
      const menuSnapshot = await adminDb
        .collection('restaurants')
        .doc(restaurantId)
        .collection('menu')
        .get();
      
      menuItems = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Format menu for AI context
    const formattedMenu = formatMenuForPrompt(menuItems.filter(item => item.available !== false));
    
    // Format cart for context
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const formattedCart = cart.length > 0 
      ? cart.map(item => `- ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')
      : 'Cart is empty';

    // Build system prompt
    const systemPrompt = SYSTEM_PROMPT
      .replace('{restaurantName}', context.restaurantName || 'the restaurant')
      .replace('{cuisine}', context.cuisine || '')
      .replace('{description}', context.description || '')
      .replace('{formattedMenuItems}', formattedMenu)
      .replace('{currentCartItems}', formattedCart)
      .replace('{cartTotal}', cartTotal.toFixed(2));

    // Format chat history for context (last 10 messages)
    const recentHistory = chatHistory.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Call OpenAI API with tools (function calling)
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o', // Use gpt-4o, gpt-4-turbo, or gpt-3.5-turbo
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message }
      ],
      tools: OPENAI_TOOLS, // Use 'tools' instead of 'functions' in newer API
      tool_choice: 'auto', // Let AI decide when to use tools ('auto' | 'none' | { type: 'function', function: { name: 'add_to_cart' }})
      temperature: 0.7, // Balanced creativity/consistency (0.0-2.0)
      max_tokens: 500, // Limit response length
      response_format: null // Use null for text + tool calls, or { type: 'json_object' } for JSON-only mode
    });

    const aiMessage = completion.choices[0].message;
    
    // Parse response
    let response = {
      text: aiMessage.content || '',
      action: 'none',
      items: [],
      suggestions: [],
      confidence: 0.9,
      metadata: {
        model: completion.model,
        tokens: completion.usage?.total_tokens,
        finishReason: completion.choices[0].finish_reason
      }
    };

    // Handle tool calls (OpenAI uses 'tool_calls' array in newer API)
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      // Process first tool call (typically only one)
      const toolCall = aiMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      // Map tool calls to actions
      switch (functionName) {
        case 'add_to_cart':
          response.action = 'add_to_cart';
          response.items = functionArgs.items.map(item => {
            // Find menu item details
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            if (!menuItem) {
              throw new Error(`Menu item not found: ${item.menuItemId}`);
            }
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity || 1,
              specialInstructions: item.specialInstructions || '',
              name: menuItem.name,
              price: menuItem.price,
              imageUrl: menuItem.imageUrl
            };
          });
          break;
          
        case 'remove_from_cart':
          response.action = 'remove_from_cart';
          const menuItemToRemove = menuItems.find(m => m.id === functionArgs.menuItemId);
          response.items = [{
            menuItemId: functionArgs.menuItemId,
            quantity: functionArgs.quantity || null, // null means remove all
            name: menuItemToRemove?.name
          }];
          break;
          
        case 'show_cart':
          response.action = 'show_cart';
          // AI will provide text response describing the cart
          break;
          
        case 'get_menu_item_info':
          response.action = 'get_menu_item_info';
          const menuItemInfo = menuItems.find(m => m.id === functionArgs.menuItemId);
          if (menuItemInfo) {
            // Enhance text response with menu item details
            const allergens = menuItemInfo.allergens?.length > 0
              ? `\nAllergens: ${menuItemInfo.allergens.join(', ')}`
              : '';
            response.text = `${response.text}\n\n**${menuItemInfo.name}** - $${menuItemInfo.price.toFixed(2)}\n${menuItemInfo.description}\nCategory: ${menuItemInfo.category}${allergens}`;
          }
          response.metadata.menuItemId = functionArgs.menuItemId;
          break;
      }
    }

    // Extract suggested menu items from response text (optional enhancement)
    // Could use NER or keyword matching to identify menu item mentions

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error.message },
      { status: 500 }
    );
  }
}
```

#### 8.2.6 Client-Side Integration

**How the Chat Interface Calls the AI:**

```javascript
// components/customer/AIChatInterface.js
const handleSendMessage = async () => {
  if (!inputText.trim()) return;

  const userMessage = inputText.trim();
  setInputText('');

  // Save user message to Firestore immediately
  await addMessageToChat({
    text: userMessage,
    sender: 'user',
    timestamp: serverTimestamp()
  });

  // Call AI API
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        tableId,
        chatId,
        message: userMessage,
        chatHistory: messages.slice(-20), // Last 20 messages
        menu: menuItems,
        cart: cart,
        context: {
          restaurantName: restaurant.name,
          cuisine: restaurant.cuisine,
          tableNumber: table.number
        }
      })
    });

    const aiResponse = await response.json();

    // Save AI response message
    await addMessageToChat({
      text: aiResponse.text,
      sender: 'assistant',
      type: 'message',
      timestamp: serverTimestamp()
    });

    // Handle action if present
    if (aiResponse.action !== 'none') {
      await handleAIAction(aiResponse.action, aiResponse.items, aiResponse.metadata);
    }

  } catch (error) {
    console.error('AI Chat Error:', error);
    // Show error message to user
    await addMessageToChat({
      text: 'Sorry, I encountered an error. Please try again.',
      sender: 'assistant',
      type: 'error',
      timestamp: serverTimestamp()
    });
  }
};

const handleAIAction = async (action, items, metadata) => {
  switch (action) {
    case 'add_to_cart':
      // Add items to cart
      items.forEach(item => {
        addItemToCart(item.menuItemId, item.quantity, item.specialInstructions);
      });
      break;
      
    case 'remove_from_cart':
      items.forEach(item => {
        removeItemFromCart(item.menuItemId, item.quantity);
      });
      break;
      
    case 'show_cart':
      // Show cart modal or update UI
      showCartModal();
      break;
  }
};
```

#### 8.2.7 Menu Item Matching Strategy

**Challenge**: Customer says "Margherita Pizza" but menu has ID "pizza-123"

**Solution**: Hybrid matching approach

```javascript
// lib/ai-utils.js

/**
 * Find menu item by customer's natural language description
 */
export function findMenuItemByName(menuItems, query) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Strategy 1: Exact name match
  let match = menuItems.find(item => 
    item.name.toLowerCase() === normalizedQuery
  );
  if (match) return match;

  // Strategy 2: Contains match
  match = menuItems.find(item => 
    item.name.toLowerCase().includes(normalizedQuery) ||
    normalizedQuery.includes(item.name.toLowerCase())
  );
  if (match) return match;

  // Strategy 3: Fuzzy match (simple word matching)
  const queryWords = normalizedQuery.split(/\s+/);
  match = menuItems.find(item => {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    const matchingWords = queryWords.filter(qw => 
      itemWords.some(iw => iw.includes(qw) || qw.includes(iw))
    );
    return matchingWords.length >= queryWords.length * 0.6; // 60% match
  });
  if (match) return match;

  // Strategy 4: Use AI embedding similarity (advanced)
  // Could use OpenAI embeddings API for semantic similarity

  return null;
}

/**
 * Extract menu items from natural language
 * Example: "2 Margherita Pizzas and a Caesar Salad"
 */
export function extractMenuItemsFromText(menuItems, text) {
  // Split by common conjunctions
  const phrases = text.split(/\s+(and|&|,)\s+/i);
  const extractedItems = [];

  phrases.forEach(phrase => {
    // Extract quantity and item name
    const quantityMatch = phrase.match(/^(\d+)\s+/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    // Remove quantity from phrase
    const itemPhrase = phrase.replace(/^\d+\s+/, '').trim();
    
    // Find matching menu item
    const menuItem = findMenuItemByName(menuItems, itemPhrase);
    if (menuItem) {
      extractedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: quantity,
        price: menuItem.price
      });
    }
  });

  return extractedItems;
}
```

#### 8.2.8 Response Handling & Error Cases

**Edge Cases to Handle:**

1. **Item Not Found:**
```javascript
// AI Response:
{
  text: "I couldn't find that item on the menu. Could you check the menu or try a different name?",
  action: 'clarify',
  suggestions: findSimilarItems(menuItems, query) // Suggest similar items
}
```

2. **Ambiguous Request:**
```javascript
// User: "I want pizza"
// AI Response:
{
  text: "We have several pizzas: Margherita ($12.99), Pepperoni ($14.99), and Hawaiian ($13.99). Which one would you like?",
  action: 'clarify',
  suggestions: menuItems.filter(item => item.category === 'Pizza')
}
```

3. **Quantity Extraction:**
```javascript
// User: "Give me a couple of pizzas"
// Parse "couple" as 2
const quantityMap = {
  'a couple': 2,
  'a few': 3,
  'several': 3,
  'a bunch': 4
};
```

4. **Special Instructions:**
```javascript
// User: "Add pizza, no onions"
// Extract: menuItemId + specialInstructions: "no onions"
```

#### 8.2.9 Rate Limiting & Cost Optimization

**Rate Limiting:**
```javascript
// Prevent abuse and manage costs
const rateLimiter = new Map(); // In-memory (use Redis in production)

export function checkRateLimit(chatId) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // 10 requests per minute per chat

  if (!rateLimiter.has(chatId)) {
    rateLimiter.set(chatId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  const limit = rateLimiter.get(chatId);
  if (now > limit.resetAt) {
    limit.count = 1;
    limit.resetAt = now + windowMs;
    return { allowed: true };
  }

  if (limit.count >= maxRequests) {
    return { 
      allowed: false, 
      message: 'Too many requests. Please wait a moment before trying again.',
      retryAfter: Math.ceil((limit.resetAt - now) / 1000)
    };
  }

  limit.count++;
  return { allowed: true };
}
```

**Cost Optimization Strategies:**

1. **Model Selection Based on Complexity:**
```javascript
// Use cheaper model for simple queries, expensive for complex ones
function selectModel(message, menuSize, hasToolCalls) {
  const isSimpleQuery = message.length < 50 && !hasToolCalls;
  
  if (isSimpleQuery) {
    return 'gpt-3.5-turbo'; // Cheaper for simple questions
  }
  
  return 'gpt-4o'; // Better for complex ordering and function calling
}
```

2. **Cache Menu Context**: Menu doesn't change frequently
```javascript
// Cache formatted menu for 5 minutes
const menuCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedMenu(restaurantId) {
  const cached = menuCache.get(restaurantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.formattedMenu;
  }
  return null;
}
```

3. **Limit Chat History**: Only send last 10-20 messages
```javascript
// Only include recent messages to reduce token usage
const recentHistory = chatHistory.slice(-15).map(msg => ({
  role: msg.sender === 'user' ? 'user' : 'assistant',
  content: msg.text.substring(0, 500) // Truncate long messages
}));
```

4. **Token Budget Management:**
```javascript
// Set token limits based on model
const TOKEN_LIMITS = {
  'gpt-4o': { maxTokens: 500, contextWindow: 128000 },
  'gpt-4-turbo': { maxTokens: 500, contextWindow: 128000 },
  'gpt-3.5-turbo': { maxTokens: 300, contextWindow: 16385 }
};

// Estimate prompt tokens (rough estimate: ~4 chars per token)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Trim menu if too large
function trimMenuForContext(menuItems, maxTokens) {
  let totalTokens = 0;
  const trimmed = [];
  
  for (const item of menuItems) {
    const itemTokens = estimateTokens(JSON.stringify(item));
    if (totalTokens + itemTokens > maxTokens) break;
    trimmed.push(item);
    totalTokens += itemTokens;
  }
  
  return trimmed;
}
```

5. **Streaming for Better UX (Optional):**
```javascript
// Stream responses for faster perceived performance
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  tools: OPENAI_TOOLS,
  stream: true // Enable streaming
});

for await (const chunk of stream) {
  // Send chunks to client as they arrive
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    // Send partial response to client
  }
}
```

**OpenAI Pricing (as of 2024):**
- **gpt-4o**: $5/$15 per 1M input/output tokens
- **gpt-4-turbo**: $10/$30 per 1M input/output tokens  
- **gpt-3.5-turbo**: $0.50/$1.50 per 1M input/output tokens

**Estimated Costs per Chat Session:**
- Average prompt: ~500 tokens (menu + history + message)
- Average response: ~150 tokens
- With gpt-4o: ~$0.0005 per message
- With gpt-3.5-turbo: ~$0.00008 per message (fallback for simple queries)

#### 8.2.10 Prompt Engineering Best Practices

**Tips for Better AI Responses:**

1. **Be Specific**: Include current cart state so AI knows what's already ordered
2. **Provide Examples**: Show AI examples of good responses in system prompt
3. **Clear Instructions**: Explicitly state when to use functions vs. natural response
4. **Context Management**: Keep relevant context (menu, cart) but not too much history
5. **Temperature Settings**:
   - `0.7` - Balanced (default)
   - `0.3` - More consistent for ordering
   - `0.9` - More creative for recommendations

**Example Enhanced System Prompt Excerpt:**
```
When customers want to order:
1. Confirm the item name and quantity clearly
2. Use the add_to_cart function with the correct menuItemId
3. Provide a friendly confirmation message

Example good response:
User: "I'll have two pizzas"
You: "Perfect! I'll add 2 Margherita Pizzas ($25.98) to your cart."
[Call add_to_cart function]
```

#### 8.2.11 Monitoring & Analytics

**Track AI Performance:**

```javascript
// Log AI interactions for analysis
await logAIIteraction({
  chatId,
  restaurantId,
  userMessage,
  aiResponse,
  actionTaken: response.action,
  responseTime: Date.now() - startTime,
  tokensUsed: completion.usage?.total_tokens,
  success: true
});
```

**Metrics to Track:**
- Response time
- Token usage (cost tracking)
- Function call accuracy
- User satisfaction (via feedback)
- Common failure patterns

#### 8.2.12 OpenAI Error Handling & Fallback Strategies

**OpenAI-Specific Error Handling:**

```javascript
// Handle OpenAI API errors
try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
        // Invalid API key
        return NextResponse.json(
          { error: 'Authentication failed. Please check API key.' },
          { status: 500 }
        );
      case 429:
        // Rate limit exceeded
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      case 500:
        // OpenAI server error
        // Fallback to retry with smaller model
        return await retryWithFallbackModel(message, menu, cart);
      case 503:
        // Service unavailable
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      default:
        // Unknown error
        console.error('OpenAI API Error:', error);
        return NextResponse.json(
          { error: 'AI service error. Please try again.' },
          { status: 500 }
        );
    }
  }
}
```

**Fallback Strategies:**

1. **Retry with Smaller Model:**
```javascript
async function retryWithFallbackModel(message, menu, cart) {
  try {
    // Retry with GPT-3.5-turbo if GPT-4 fails
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Fallback to cheaper model
      messages: [...],
      tools: OPENAI_TOOLS,
      temperature: 0.7,
      max_tokens: 300 // Shorter responses
    });
    return completion;
  } catch (fallbackError) {
    // If fallback also fails, use simple keyword matching
    return handleWithKeywordMatching(message, menu, cart);
  }
}
```

2. **Simple Keyword Matching Fallback:**
```javascript
function handleWithKeywordMatching(message, menu, cart) {
  const lowerMessage = message.toLowerCase();
  
  // Detect ordering intent
  if (lowerMessage.includes('add') || lowerMessage.includes('order') || lowerMessage.includes('want')) {
    // Try to find mentioned menu items
    const mentionedItems = menu.filter(item => 
      lowerMessage.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().split(/\s+/).some(word => 
        lowerMessage.includes(word)
      )
    );
    
    if (mentionedItems.length > 0) {
      // Extract quantity (simple pattern matching)
      const quantityMatch = message.match(/(\d+)|(one|two|three|four|five)/i);
      const quantity = quantityMatch ? parseInt(quantityMatch[1] || convertWordToNumber(quantityMatch[2])) : 1;
      
      return {
        text: `I'll add ${quantity}x ${mentionedItems[0].name} to your cart.`,
        action: 'add_to_cart',
        items: [{
          menuItemId: mentionedItems[0].id,
          quantity: quantity,
          name: mentionedItems[0].name,
          price: mentionedItems[0].price
        }]
      };
    }
  }
  
  // Fallback response
  return {
    text: "I'm having trouble understanding. Please try browsing the menu or contact staff for assistance.",
    action: 'none'
  };
}
```

3. **Menu Browsing Fallback:**
```javascript
// If AI completely fails, suggest browsing menu
return {
  text: "I apologize, but I'm having technical difficulties. Please browse our menu to see available items and use the 'Add to Cart' buttons to order.",
  action: 'show_menu',
  suggestions: menu.filter(item => item.available)
};
```

4. **Human Handoff:**
```javascript
// Option to contact restaurant staff
if (aiFails || userRequestsHuman) {
  return {
    text: "I can connect you with our staff for assistance. Would you like me to notify them?",
    action: 'human_handoff',
    metadata: {
      notifyStaff: true,
      tableId: tableId,
      message: userMessage
    }
  };
}
```

**OpenAI API Best Practices:**

1. **Set Timeout**: Prevent hanging requests
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

const completion = await openai.chat.completions.create({
  ...options
}, {
  signal: controller.signal
});

clearTimeout(timeoutId);
```

2. **Retry Logic**: Implement exponential backoff
```javascript
async function callOpenAIWithRetry(options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.chat.completions.create(options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

3. **Logging**: Track OpenAI usage and errors
```javascript
// Log OpenAI interactions for monitoring
const logEntry = {
  timestamp: new Date().toISOString(),
  chatId,
  restaurantId,
  model: completion.model,
  tokens: completion.usage?.total_tokens,
  cost: calculateCost(completion.usage, completion.model),
  duration: Date.now() - startTime,
  success: true,
  finishReason: completion.choices[0].finish_reason
};

// Save to database or logging service
await logAIIteraction(logEntry);
```

4. **Token Usage Tracking**: Monitor costs
```javascript
function calculateCost(usage, model) {
  const pricing = {
    'gpt-4o': { input: 2.50, output: 10.00 }, // per 1M tokens
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
  };
  
  const modelPricing = pricing[model] || pricing['gpt-4o'];
  const inputCost = (usage.prompt_tokens / 1000000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1000000) * modelPricing.output;
  
  return inputCost + outputCost;
}
```

### 8.3 Real-time Updates
- **Firestore Listeners**: Use `onSnapshot` for:
  - Chat messages (already implemented)
  - Order status updates (to be implemented)
  - Menu updates (optional - for real-time menu changes)

### 8.4 Order Management
- **Restaurant Side**: Real-time order queue with status updates
- **Customer Side**: Real-time order status tracking
- **Status Flow**: `pending → confirmed → preparing → ready → completed`

---

## 9. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **React**: 18+
- **Styling**: Inline styles (current) or CSS Modules / Tailwind (recommend migration)

### Backend
- **API Routes**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage (for images and QR codes)

### AI Integration
- **AI Service**: TBD (OpenAI, Anthropic, or Google Gemini)
- **API Layer**: Server-side API route to handle AI calls securely

### QR Codes
- **Library**: `qrcode` (Node.js) or `react-qrcode` (client-side)
- **Format**: URL with query parameters

### Real-time
- **Firestore**: Real-time listeners for chat and orders

---

## 10. Security Considerations

### Authentication
- Restaurant owners: Firebase Auth (email/password)
- Customers: No authentication required (access via QR code)

### Authorization
- Restaurant owners can only access their own restaurant data
- Customers can only place orders for the table they scanned QR code from
- Server-side validation for all API routes

### Data Validation
- Validate all inputs on server-side
- Sanitize user messages before sending to AI
- Validate order items exist in menu before creating order

### Rate Limiting
- Implement rate limiting on AI chat endpoint
- Prevent abuse of order creation endpoint

---

## 11. Implementation Phases

### Phase 1: Foundation (Current State)
- ✅ Restaurant owner authentication
- ✅ Restaurant profile management
- ✅ Menu upload/management
- ✅ Basic chat interface
- ⚠️ Currently using dummy data (needs Firebase integration)

### Phase 2: Table & QR Code Management
- [ ] Create table management UI
- [ ] Generate table records
- [ ] QR code generation and storage
- [ ] QR code download/print functionality

### Phase 3: Customer Interface
- [ ] Customer landing page (QR code destination)
- [ ] Menu display component
- [ ] Enhanced chat interface
- [ ] Shopping cart functionality
- [ ] Order placement

### Phase 4: AI Integration
- [ ] AI service setup (OpenAI/Anthropic/Gemini)
- [ ] AI chat API endpoint
- [ ] Menu context injection
- [ ] Order parsing from AI responses

### Phase 5: Order Management
- [ ] Order creation API
- [ ] Restaurant order queue UI
- [ ] Order status updates
- [ ] Real-time order tracking for customers

### Phase 6: Polish & Optimization
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Analytics/statistics
- [ ] Performance optimization
- [ ] Mobile responsiveness

---

## 12. Next Steps

1. **Review & Approve Architecture**: Confirm data models and user flows
2. **Implement Phase 2**: Table & QR Code Management (highest priority)
3. **Implement Phase 3**: Customer Interface
4. **Implement Phase 4**: AI Integration
5. **Implement Phase 5**: Order Management

---

## 13. Questions to Resolve

1. **AI Service Choice**: Which AI provider to use? (OpenAI, Anthropic, Google Gemini)
2. **Order Flow**: ✅ **RESOLVED** - Customers can place multiple orders per table session. Each order is tracked separately. Cart can be reused or cleared after each order (configurable).
3. **Menu Updates**: How should real-time menu changes (item unavailability) be handled?
4. **Payment Integration**: Will payment be integrated, or orders just sent to kitchen?
5. **Table Session Management**: How long should a customer session remain active?
6. **QR Code Format**: Static URL or dynamic session-based?
7. **Notifications**: How should order status updates be communicated? (Real-time only, or push notifications?)

---

*Document created: [Date]*
*Last updated: [Date]*

