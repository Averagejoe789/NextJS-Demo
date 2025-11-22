'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../../lib/firebase-client';
import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import MenuDisplay from '../../components/customer/MenuDisplay';
import AIChatInterface from '../../components/customer/AIChatInterface';
import Cart from '../../components/customer/Cart';
import FloatingCart from '../../components/customer/FloatingCart';
import OrderLoading from './loading';

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic';

function OrderPageContent() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const tableId = searchParams.get('tableId');

  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('menu'); // 'menu' or 'chat'

  useEffect(() => {
    if (!restaurantId || !tableId) {
      setError('Restaurant ID and Table ID are required');
      setLoading(false);
      return;
    }

    // Add timeout safety - if initialization takes more than 10 seconds, show error
    // This prevents the page from being stuck on "Loading..." indefinitely
    const timeoutId = setTimeout(() => {
      console.error('⏰ Initialization timeout - taking too long!');
      if (loading) {
        setError('Page is taking too long to load. Please check your internet connection and try again.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    initializeOrder().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [restaurantId, tableId]);

  const initializeOrder = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Initializing order page...', { restaurantId, tableId });
      console.log('🔍 Firebase db initialized?', !!db);
      
      // Test Firebase connection first
      if (!db) {
        throw new Error('Firebase database not initialized. Please check your Firebase configuration.');
      }
      
      // Load restaurant profile
      console.log('📋 Loading restaurant profile...');
      const restaurantRef = doc(db, `restaurants/${restaurantId}`);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (!restaurantSnap.exists()) {
        throw new Error(`Restaurant not found: ${restaurantId}. Please create the restaurant first.`);
      }
      const restaurantData = restaurantSnap.data();
      console.log('✅ Restaurant loaded:', restaurantData.name);
      setRestaurant(restaurantData);

      // Load table info - try by document ID first, then by tableNumber
      console.log('🪑 Loading table info...');
      let tableData = null;
      
      // Try to load by document ID
      const tableRef = doc(db, `restaurants/${restaurantId}/tables/${tableId}`);
      const tableSnap = await getDoc(tableRef);
      
      if (tableSnap.exists()) {
        tableData = { id: tableSnap.id, ...tableSnap.data() };
        console.log('✅ Table loaded by ID:', tableData);
        setTable(tableData);
      } else {
        // If not found by ID, try to find by tableNumber (in case URL uses table number)
        console.log('⚠️ Table not found by ID, searching by tableNumber...');
        const tablesRef = collection(db, `restaurants/${restaurantId}/tables`);
        const tablesSnapshot = await getDocs(tablesRef);
        
        const tableNumber = parseInt(tableId.replace('table-', '').replace(/[^0-9]/g, ''));
        console.log('🔍 Looking for table number:', tableNumber);
        
        if (!isNaN(tableNumber)) {
          tablesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tableNumber === tableNumber) {
              tableData = { id: doc.id, ...data };
              console.log('✅ Table found by number:', tableData);
              setTable(tableData);
            }
          });
        }
        
        if (!tableData) {
          console.error('❌ Table not found. Available tables:', tablesSnapshot.docs.map(d => d.data()));
          throw new Error(`Table not found (${tableId}). Please use a valid table ID or visit /admin/tables to view available tables.`);
        }
      }

      // Load menu items
      console.log('📋 Loading menu items...');
      const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
      const menuSnapshot = await getDocs(menuRef);
      const items = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const availableItems = items.filter(item => item.available !== false);
      console.log(`✅ Loaded ${availableItems.length} menu items`);
      setMenuItems(availableItems);

      // Create or get chat session (only after table is loaded)
      console.log('💬 Creating/finding chat session...');
      try {
        const chatSessionId = await getOrCreateChatSession(tableData);
        if (chatSessionId) {
          setChatId(chatSessionId);
          console.log('✅ Chat session ready:', chatSessionId);
        }
      } catch (chatErr) {
        console.warn('⚠️ Chat session creation failed (non-critical):', chatErr.message);
        // Don't block page load if chat session fails
      }

      console.log('✅ Order page initialization complete!');
      
    } catch (err) {
      console.error('❌ Error initializing order:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      setError(err.message || 'Failed to load order page');
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const getOrCreateChatSession = async (tableData) => {
    try {
      if (!restaurantId || !tableId) {
        console.error('Missing restaurantId or tableId');
        return null;
      }

      const resolvedTableData = tableData || table;
      if (!resolvedTableData) {
        console.error('Table data not available for chat session');
        return null;
      }

      console.log('Creating/finding chat session for:', { restaurantId, tableId, tableData: resolvedTableData });

      // Check for existing active chat session for this table
      const chatSessionsRef = collection(db, `restaurants/${restaurantId}/chatSessions`);
      const existingSessions = await getDocs(chatSessionsRef);
      
      let existingChat = null;
      existingSessions.forEach(doc => {
        const data = doc.data();
        // Match by tableId (can be document ID or tableNumber)
        const tableIdMatch = data.tableId === tableId || data.tableId === resolvedTableData.id;
        const tableNumberMatch = data.tableNumber === resolvedTableData.tableNumber;
        const isActive = data.status === 'active' || !data.status;
        
        if ((tableIdMatch || tableNumberMatch) && isActive) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        console.log('✅ Found existing chat session:', existingChat.id);
        console.log('Existing session data:', existingChat);
        setChatId(existingChat.id);
        return existingChat.id;
      }

      console.log('No existing chat session found, creating new one...');

      // Create new chat session
      console.log('Creating new chat session...');
      const chatSessionData = {
        tableId: resolvedTableData.id || tableId,
        tableNumber: resolvedTableData.tableNumber || 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const newChatRef = await addDoc(chatSessionsRef, chatSessionData);
      console.log('✅ Chat session created successfully:', newChatRef.id);
      console.log('Chat session data:', chatSessionData);

      setChatId(newChatRef.id);
      return newChatRef.id;
    } catch (err) {
      console.error('❌ Error creating chat session:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      
      // Don't block page load if chat session creation fails - just return null
      console.warn('Chat session creation failed, continuing without chat session');
      return null;
    }
  };

  const loadCart = async (sessionId) => {
    try {
      // Load cart from Firestore
      const cartRef = doc(db, `restaurants/${restaurantId}/chatSessions/${sessionId}/cart`);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        setCart(cartData.items || []);
      }

      // Listen for cart updates
      const unsubscribe = onSnapshot(cartRef, (snapshot) => {
        if (snapshot.exists()) {
          const cartData = snapshot.data();
          setCart(cartData.items || []);
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error loading cart:', err);
      // Fallback to local storage
      loadCartFromLocalStorage();
    }
  };

  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem(`cart_${restaurantId}_${tableId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error('Error loading cart from localStorage:', err);
    }
  };

  const saveCartToFirestore = async (cartItems) => {
    if (!chatId) return;

    try {
      const cartRef = doc(db, `restaurants/${restaurantId}/chatSessions/${chatId}/cart`);
      await setDoc(cartRef, {
        items: cartItems,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving cart to Firestore:', err);
      // Fallback to local storage
      localStorage.setItem(`cart_${restaurantId}_${tableId}`, JSON.stringify(cartItems));
    }
  };

  const addToCart = (menuItem, specialInstructions = '') => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => 
        item.menuItemId === menuItem.id && 
        item.specialInstructions === specialInstructions
      );

      let updatedCart;
      if (existingIndex >= 0) {
        updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += 1;
      } else {
        updatedCart = [...prevCart, {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          specialInstructions: specialInstructions,
          imageUrl: menuItem.imageUrl
        }];
      }

      saveCartToFirestore(updatedCart);
      return updatedCart;
    });
  };

  const updateCartQuantity = (menuItemId, quantity) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity }
          : item
      );
      saveCartToFirestore(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (menuItemId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.menuItemId !== menuItemId);
      saveCartToFirestore(updatedCart);
      return updatedCart;
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!confirm(`Place order for ${cart.length} item(s)?`)) {
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableId,
          chatId,
          items: cart
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Order API Error:', result);
        throw new Error(result.error || result.details || 'Failed to place order');
      }

      if (!result.success) {
        console.error('Order failed:', result);
        throw new Error(result.error || 'Failed to place order');
      }

      // Clear cart
      setCart([]);
      saveCartToFirestore([]);

      // Show success message
      alert(`Order placed successfully! Order #${result.orderId || 'N/A'}`);

    } catch (err) {
      console.error('Error placing order:', err);
      console.error('Error details:', err.message, err.stack);
      alert(`Failed to place order: ${err.message || 'Please try again.'}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading order interface...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header} className="order-header">
        <div style={styles.restaurantInfo}>
          {restaurant?.logoUrl && (
            <img src={restaurant.logoUrl} alt={restaurant.name} style={styles.logo} className="restaurant-logo" />
          )}
          <div>
            <h1 style={styles.restaurantName} className="restaurant-name">{restaurant?.name || 'Restaurant'}</h1>
            {table && (
              <p style={styles.tableInfo}>Table {table.tableNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Toggle buttons for switching between menu and chat */}
      <div style={styles.viewToggle} className="view-toggle">
        <button
          onClick={() => setActiveView('menu')}
          style={{
            ...styles.toggleButton,
            ...(activeView === 'menu' ? styles.toggleButtonActive : styles.toggleButtonInactive)
          }}
          className="toggle-button"
        >
          📋 Menu
        </button>
        <button
          onClick={() => setActiveView('chat')}
          style={{
            ...styles.toggleButton,
            ...(activeView === 'chat' ? styles.toggleButtonActive : styles.toggleButtonInactive)
          }}
          className="toggle-button"
        >
          💬 AI Assistant
        </button>
      </div>

      <div style={styles.content} className="order-content">
        <div style={styles.leftPanel} className="order-left-panel">
          {activeView === 'menu' && (
            <div style={styles.menuSection} className="menu-section">
              <h2 style={styles.sectionTitle} className="section-title">Menu</h2>
              <MenuDisplay menuItems={menuItems} onAddToCart={addToCart} />
            </div>
          )}

          {activeView === 'chat' && (
            <div style={styles.chatSection} className="chat-section chatgpt-view">
              <AIChatInterface
                restaurantId={restaurantId}
                tableId={tableId}
                chatId={chatId}
                menuItems={menuItems}
                cart={cart}
                onCartUpdate={setCart}
                onAddToCart={addToCart}
              />
            </div>
          )}
        </div>

        <div style={styles.rightPanel} className="order-right-panel desktop-cart">
          <Cart
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onPlaceOrder={placeOrder}
            placingOrder={placingOrder}
          />
        </div>

        {/* Floating Cart for Mobile */}
        <div className="mobile-floating-cart">
          <FloatingCart
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onPlaceOrder={placeOrder}
            placingOrder={placingOrder}
            restaurant={restaurant}
          />
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderLoading />}>
      <OrderPageContent />
    </Suspense>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh'
  },
  loadingText: {
    fontSize: '18px',
    color: '#666'
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  errorBox: {
    padding: '20px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    fontSize: '16px',
    maxWidth: '500px'
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  restaurantInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  logo: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    className: 'restaurant-logo'
  },
  restaurantName: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
    className: 'restaurant-name'
  },
  tableInfo: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0 0'
  },
  viewToggle: {
    display: 'flex',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    justifyContent: 'center',
    position: 'sticky',
    top: '80px',
    zIndex: 99,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  toggleButton: {
    flex: 1,
    padding: '12px 24px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '44px'
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
    color: '#fff',
    borderColor: '#007bff',
    boxShadow: '0 2px 4px rgba(0,123,255,0.3)'
  },
  toggleButtonInactive: {
    backgroundColor: '#f8f9fa',
    color: '#666',
    borderColor: '#e0e0e0'
  },
  content: {
    maxWidth: '1400px',
    margin: '20px auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '20px'
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightPanel: {
    height: 'fit-content'
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  chatSection: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    minHeight: '500px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333'
  }
};

