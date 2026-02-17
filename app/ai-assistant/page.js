'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase-client';
import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
import AIChatInterface from '../../components/customer/AIChatInterface';
import Cart from '../../components/customer/Cart';
import Link from 'next/link';

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic';

function AIAssistantPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  useEffect(() => {
    if (!restaurantId || !tableId) {
      setError('Restaurant ID and Table ID are required');
      setLoading(false);
      return;
    }

    // Add timeout safety
    const timeoutId = setTimeout(() => {
      console.error('⏰ Initialization timeout - taking too long!');
      if (loading) {
        setError('Page is taking too long to load. Please check your internet connection and try again.');
        setLoading(false);
      }
    }, 10000);

    initializePage().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [restaurantId, tableId]);

  const initializePage = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Initializing AI assistant page...', { restaurantId, tableId });
      
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

      // Load table info
      console.log('🪑 Loading table info...');
      let tableData = null;
      
      const tableRef = doc(db, `restaurants/${restaurantId}/tables/${tableId}`);
      const tableSnap = await getDoc(tableRef);
      
      if (tableSnap.exists()) {
        tableData = { id: tableSnap.id, ...tableSnap.data() };
        console.log('✅ Table loaded by ID:', tableData);
        setTable(tableData);
      } else {
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
          console.error('❌ Table not found.');
          throw new Error(`Table not found (${tableId}). Please use a valid table ID.`);
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

      // Create or get chat session
      console.log('💬 Creating/finding chat session...');
      try {
        const chatSessionId = await getOrCreateChatSession(tableData);
        if (chatSessionId) {
          setChatId(chatSessionId);
          console.log('✅ Chat session ready:', chatSessionId);
          
          // Load cart for this chat session
          await loadCart(chatSessionId);
        }
      } catch (chatErr) {
        console.warn('⚠️ Chat session creation failed (non-critical):', chatErr.message);
      }

      console.log('✅ AI assistant page initialization complete!');
      
    } catch (err) {
      console.error('❌ Error initializing AI assistant page:', err);
      setError(err.message || 'Failed to load AI assistant page');
    } finally {
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
        const tableIdMatch = data.tableId === tableId || data.tableId === resolvedTableData.id;
        const tableNumberMatch = data.tableNumber === resolvedTableData.tableNumber;
        const isActive = data.status === 'active' || !data.status;
        
        if ((tableIdMatch || tableNumberMatch) && isActive) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        console.log('✅ Found existing chat session:', existingChat.id);
        setChatId(existingChat.id);
        return existingChat.id;
      }

      console.log('No existing chat session found, creating new one...');

      // Create new chat session
      const chatSessionData = {
        tableId: resolvedTableData.id || tableId,
        tableNumber: resolvedTableData.tableNumber || 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const newChatRef = await addDoc(chatSessionsRef, chatSessionData);
      console.log('✅ Chat session created successfully:', newChatRef.id);

      setChatId(newChatRef.id);
      return newChatRef.id;
    } catch (err) {
      console.error('❌ Error creating chat session:', err);
      return null;
    }
  };

  const loadCart = async (sessionId) => {
    try {
      if (!sessionId) return;
      
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
      alert(`Failed to place order: ${err.message || 'Please try again.'}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading AI assistant...</div>
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
      {/* Header */}
      <div style={styles.header} className="ai-assistant-header">
        <div style={styles.headerContent}>
          <div style={styles.restaurantInfo}>
            {restaurant?.logoUrl && (
              <div style={styles.logoContainer}>
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name} 
                  style={styles.logo} 
                  className="restaurant-logo" 
                />
              </div>
            )}
            <div style={styles.restaurantDetails}>
              <h1 style={styles.restaurantName} className="restaurant-name">
                {restaurant?.name || 'Restaurant'} - AI Assistant
              </h1>
              {table && (
                <div style={styles.tableBadge}>
                  <span style={styles.tableIcon}>🪑</span>
                  <span style={styles.tableText}>Table {table.tableNumber}</span>
                </div>
              )}
            </div>
          </div>
          <Link 
            href={`/order?restaurantId=${restaurantId}&tableId=${tableId}`}
            style={styles.backButton}
          >
            ← Back to Menu
          </Link>
        </div>
      </div>

      <div style={{
        ...styles.content,
        gridTemplateColumns: cart.length > 0 ? '1fr 350px' : '1fr'
      }} className="ai-assistant-content">
        <div style={styles.chatPanel} className="chat-panel">
          <AIChatInterface
            restaurantId={restaurantId}
            tableId={tableId}
            chatId={chatId}
            menuItems={menuItems}
            cart={cart}
            onCartUpdate={setCart}
            onAddToCart={addToCart}
            restaurant={restaurant}
          />
        </div>

        {cart.length > 0 && (
          <div style={styles.rightPanel} className="desktop-cart">
            <Cart
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onPlaceOrder={placeOrder}
              placingOrder={placingOrder}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <Suspense fallback={
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    }>
      <AIAssistantPageContent />
    </Suspense>
  );
}

const styles = {
  container: {
    height: '100vh',
    maxHeight: '100vh',
    backgroundColor: '#f8fafc',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    overflowY: 'hidden',
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 0,
    marginBottom: 0,
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
    borderBottom: '1px solid #e2e8f0',
    padding: '0.75rem 1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  restaurantInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  logoContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f3f4f6',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  restaurantDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  restaurantName: {
    fontSize: 'clamp(1rem, 4vw, 1.5rem)',
    fontWeight: 700,
    margin: 0,
    color: '#111827',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tableBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: 500,
    width: 'fit-content',
  },
  tableIcon: {
    fontSize: '0.875rem',
  },
  tableText: {
    fontSize: '0.875rem',
  },
  backButton: {
    padding: '0.5rem 0.875rem',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#ffffff',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.8125rem',
    fontWeight: 500,
    transition: 'all 200ms ease-in-out',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 12px',
    display: 'grid',
    gap: '0',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'hidden',
    flex: 1,
    minHeight: 0,
    paddingBottom: 0,
    marginBottom: 0,
    marginTop: 0,
  },
  chatPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
    padding: '0',
    boxShadow: 'none',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: 'none',
    position: 'relative',
    minHeight: 0,
    marginBottom: 0,
  },
  rightPanel: {
    height: 'fit-content'
  },
};

