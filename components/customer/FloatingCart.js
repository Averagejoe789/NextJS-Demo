'use client';
import { useState, useEffect } from 'react';

export default function FloatingCart({ cart, onUpdateQuantity, onRemoveItem, onPlaceOrder, placingOrder, onClose, restaurant }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Show cart when items are added
  useEffect(() => {
    if (cart.length > 0) {
      setIsVisible(true);
      setIsMinimized(false);
    }
  }, [cart.length]);

  const handleQuantityChange = (menuItemId, change) => {
    const item = cart.find(i => i.menuItemId === menuItemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        onRemoveItem(menuItemId);
      } else {
        onUpdateQuantity(menuItemId, newQuantity);
      }
    }
  };

  if (!isVisible || cart.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        style={styles.backdrop}
        onClick={() => setIsMinimized(true)}
      />

      {/* Floating Cart */}
      <div 
        style={{
          ...styles.cartContainer,
          ...(isMinimized ? styles.cartMinimized : styles.cartExpanded)
        }}
        className="floating-cart"
      >
        {isMinimized ? (
          // Minimized state - just show badge
          <div 
            style={styles.minimizedBar}
            onClick={() => setIsMinimized(false)}
          >
            <div style={styles.minimizedContent}>
              <span style={styles.minimizedText}>🛒 {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              <span style={styles.minimizedTotal}>${total.toFixed(2)}</span>
            </div>
            <button 
              style={styles.minimizeButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
            >
              ↑
            </button>
          </div>
        ) : (
          // Expanded state - show full cart
          <>
            {/* Header */}
            <div style={styles.cartHeader}>
              <h3 style={styles.cartTitle}>Your Order</h3>
              <div style={styles.headerActions}>
                <span style={styles.itemCountBadge}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                <button 
                  style={styles.closeButton}
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimize cart"
                >
                  ↓
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div style={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.menuItemId} style={styles.cartItem}>
                  <div style={styles.itemInfo}>
                    <div style={styles.itemName}>{item.name}</div>
                    {item.specialInstructions && (
                      <div style={styles.specialInstructions}>{item.specialInstructions}</div>
                    )}
                    <div style={styles.itemPrice}>${item.price.toFixed(2)} each</div>
                  </div>
                  <div style={styles.itemControls}>
                    <button
                      onClick={() => handleQuantityChange(item.menuItemId, -1)}
                      style={styles.quantityButton}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span style={styles.quantity}>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.menuItemId, 1)}
                      style={styles.quantityButton}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.menuItemId)}
                      style={styles.removeButton}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                  <div style={styles.itemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={styles.cartFooter}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalAmount}>${total.toFixed(2)}</span>
              </div>
              <button
                onClick={onPlaceOrder}
                disabled={placingOrder || cart.length === 0}
                style={{
                  ...styles.placeOrderButton,
                  opacity: placingOrder || cart.length === 0 ? 0.6 : 1,
                  cursor: placingOrder || cart.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {placingOrder ? 'Placing Order...' : `Place Order • $${total.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    animation: 'fadeIn 0.2s ease-in'
  },
  cartContainer: {
    position: 'fixed',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    transition: 'transform 0.3s ease-out',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  },
  cartExpanded: {
    bottom: 0,
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '0',
    animation: 'slideUp 0.3s ease-out'
  },
  cartMinimized: {
    bottom: 0,
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    padding: '0'
  },
  minimizedBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#ffffff'
  },
  minimizedContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  },
  minimizedText: {
    fontSize: '16px',
    fontWeight: '500'
  },
  minimizedTotal: {
    fontSize: '18px',
    fontWeight: '600'
  },
  minimizeButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px'
  },
  cartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    color: '#111827'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  itemCountBadge: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    color: '#6b7280',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px'
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    maxHeight: 'calc(90vh - 200px)',
    WebkitOverflowScrolling: 'touch'
  },
  cartItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'flex-start'
  },
  itemInfo: {
    flex: 1,
    minWidth: 0
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '4px'
  },
  specialInstructions: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: '4px'
  },
  itemPrice: {
    fontSize: '14px',
    color: '#6b7280'
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151'
  },
  quantity: {
    fontSize: '16px',
    fontWeight: '500',
    minWidth: '24px',
    textAlign: 'center',
    color: '#111827'
  },
  removeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '4px'
  },
  itemTotal: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#007bff',
    minWidth: '70px',
    textAlign: 'right',
    flexShrink: 0
  },
  cartFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  totalAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#007bff'
  },
  placeOrderButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

