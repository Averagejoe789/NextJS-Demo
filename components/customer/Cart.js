'use client';
import { useState } from 'react';

export default function Cart({ cart, onUpdateQuantity, onRemoveItem, onPlaceOrder, placingOrder }) {
  const [removingItem, setRemovingItem] = useState(null);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (menuItemId, change) => {
    const item = cart.find(i => i.menuItemId === menuItemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        handleRemoveItem(menuItemId);
      } else {
        onUpdateQuantity(menuItemId, newQuantity);
      }
    }
  };

  const handleRemoveItem = async (menuItemId) => {
    setRemovingItem(menuItemId);
    await new Promise(resolve => setTimeout(resolve, 200));
    onRemoveItem(menuItemId);
    setRemovingItem(null);
  };

  if (cart.length === 0) {
    return (
      <div style={styles.emptyCart}>
        <div style={styles.emptyIcon}>🛒</div>
        <h3 style={styles.emptyTitle}>Your Cart is Empty</h3>
        <p style={styles.emptyText}>Start adding delicious items to your order!</p>
      </div>
    );
  }

  return (
    <div style={styles.cart} className="cart-container">
      {/* Header */}
      <div style={styles.cartHeader}>
        <div>
          <h2 style={styles.cartTitle}>Your Order</h2>
          <p style={styles.cartSubtitle}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
        </div>
        <div style={styles.cartBadge}>{cart.length}</div>
      </div>
      
      {/* Items List */}
      <div style={styles.cartItems}>
        {cart.map((item) => (
          <div 
            key={item.menuItemId} 
            style={{
              ...styles.cartItem,
              ...(removingItem === item.menuItemId ? styles.cartItemRemoving : {})
            }}
            className="cart-item"
          >
            {/* Item Info */}
            <div style={styles.itemInfo}>
              <h4 style={styles.itemName}>{item.name}</h4>
              {item.specialInstructions && (
                <div style={styles.specialInstructions}>
                  <span style={styles.noteIcon}>📝</span>
                  {item.specialInstructions}
                </div>
              )}
              <div style={styles.itemPrice}>${item.price.toFixed(2)} each</div>
            </div>

            {/* Quantity Controls */}
            <div style={styles.itemControls}>
              <button
                onClick={() => handleQuantityChange(item.menuItemId, -1)}
                style={styles.quantityButton}
                className="quantity-button"
                aria-label="Decrease quantity"
              >
                <span style={styles.minusIcon}>−</span>
              </button>
              <span style={styles.quantity}>{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.menuItemId, 1)}
                style={styles.quantityButton}
                className="quantity-button"
                aria-label="Increase quantity"
              >
                <span style={styles.plusIcon}>+</span>
              </button>
            </div>

            {/* Item Total */}
            <div style={styles.itemTotal}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => handleRemoveItem(item.menuItemId)}
              style={styles.removeButton}
              className="remove-button"
              aria-label="Remove item"
              disabled={removingItem === item.menuItemId}
            >
              {removingItem === item.menuItemId ? (
                <span style={styles.removingSpinner}></span>
              ) : (
                <span style={styles.removeIcon}>×</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.cartFooter}>
        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>Subtotal</span>
          <span style={styles.totalAmount}>${total.toFixed(2)}</span>
        </div>
        
        <button
          onClick={onPlaceOrder}
          disabled={placingOrder || cart.length === 0}
          style={{
            ...styles.placeOrderButton,
            ...(placingOrder ? styles.placeOrderButtonLoading : {}),
            ...(cart.length === 0 ? styles.placeOrderButtonDisabled : {})
          }}
          className="place-order-button"
        >
          {placingOrder ? (
            <>
              <span style={styles.buttonSpinner}></span>
              Placing Order...
            </>
          ) : (
            <>
              <span style={styles.buttonIcon}>✓</span>
              Place Order • ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const styles = {
  cart: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 180px)',
    position: 'sticky',
    top: '1.25rem',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f3f4f6',
  },
  
  cartTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    marginBottom: '0.25rem',
  },
  
  cartSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  },
  
  cartBadge: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    minWidth: '2rem',
    textAlign: 'center',
  },
  
  emptyCart: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#6b7280',
  },
  
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem',
  },
  
  emptyText: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '1.5rem',
    minHeight: '200px',
    maxHeight: '400px',
    paddingRight: '0.5rem',
  },
  
  cartItem: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
    transition: 'all 200ms ease-in-out',
    borderRadius: '0.5rem',
    marginBottom: '0.5rem',
  },
  
  cartItemRemoving: {
    opacity: 0.5,
    transform: 'translateX(-10px)',
  },
  
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  
  itemName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    marginBottom: '0.375rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  specialInstructions: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  noteIcon: {
    fontSize: '0.875rem',
    flexShrink: 0,
  },
  
  itemPrice: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: 500,
  },
  
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#f9fafb',
    padding: '0.375rem',
    borderRadius: '0.5rem',
  },
  
  quantityButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: '#ffffff',
    color: '#0284c7',
    cursor: 'pointer',
    fontSize: '1.25rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease-in-out',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    minWidth: '44px', // Touch-friendly
    minHeight: '44px',
  },
  
  minusIcon: {
    lineHeight: 1,
  },
  
  plusIcon: {
    lineHeight: 1,
  },
  
  quantity: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    minWidth: '2rem',
    textAlign: 'center',
  },
  
  itemTotal: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0284c7',
    minWidth: '5rem',
    textAlign: 'right',
  },
  
  removeButton: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease-in-out',
    minWidth: '44px', // Touch-friendly
    minHeight: '44px',
  },
  
  removeIcon: {
    lineHeight: 1,
    fontWeight: 300,
  },
  
  removingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(220, 38, 38, 0.3)',
    borderTopColor: '#dc2626',
    borderRadius: '50%',
    animation: 'spin 600ms linear infinite',
  },
  
  cartFooter: {
    borderTop: '2px solid #f3f4f6',
    paddingTop: '1.5rem',
  },
  
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  
  totalLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#374151',
  },
  
  totalAmount: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0284c7',
  },
  
  placeOrderButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    minHeight: '52px', // Touch-friendly
  },
  
  placeOrderButtonLoading: {
    backgroundColor: '#16a34a',
    opacity: 0.8,
  },
  
  placeOrderButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  
  buttonIcon: {
    fontSize: '1.25rem',
  },
  
  buttonSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 600ms linear infinite',
  },
};
