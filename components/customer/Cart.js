'use client';
import { useState } from 'react';

export default function Cart({ cart, onUpdateQuantity, onRemoveItem, onPlaceOrder, placingOrder }) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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

  if (cart.length === 0) {
    return (
      <div style={styles.emptyCart}>
        <p>Your cart is empty</p>
        <p style={styles.emptyCartSubtext}>Start adding items to your order!</p>
      </div>
    );
  }

  return (
    <div style={styles.cart} className="cart-container">
      <div style={styles.cartHeader}>
        <h3 style={styles.cartTitle}>Your Order</h3>
        {cart.length > 0 && (
          <div style={styles.cartBadge}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</div>
        )}
      </div>
      
      <div style={styles.cartItems}>
        {cart.map((item) => (
          <div key={item.menuItemId} style={styles.cartItem}>
            <div style={styles.itemInfo}>
              <div style={styles.itemName}>{item.name}</div>
              {item.specialInstructions && (
                <div style={styles.specialInstructions}>Note: {item.specialInstructions}</div>
              )}
              <div style={styles.itemPrice}>${item.price.toFixed(2)} each</div>
            </div>
            <div style={styles.itemControls}>
              <button
                onClick={() => handleQuantityChange(item.menuItemId, -1)}
                style={styles.quantityButton}
              >
                −
              </button>
              <span style={styles.quantity}>{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.menuItemId, 1)}
                style={styles.quantityButton}
              >
                +
              </button>
              <button
                onClick={() => onRemoveItem(item.menuItemId)}
                style={styles.removeButton}
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

      <div style={styles.cartFooter}>
        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>Total:</span>
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
          {placingOrder ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  cart: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    maxHeight: '600px',
    position: 'sticky',
    top: '20px',
    overflowY: 'auto'
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '12px'
  },
  cartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    color: '#333'
  },
  cartBadge: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  emptyCart: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999'
  },
  emptyCartSubtext: {
    fontSize: '14px',
    marginTop: '8px'
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px'
  },
  cartItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center'
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px'
  },
  specialInstructions: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: '4px'
  },
  itemPrice: {
    fontSize: '14px',
    color: '#666'
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  quantityButton: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantity: {
    fontSize: '16px',
    fontWeight: '500',
    minWidth: '30px',
    textAlign: 'center'
  },
  removeButton: {
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    className: 'remove-button',
    touchAction: 'manipulation'
  },
  itemTotal: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#007bff',
    minWidth: '80px',
    textAlign: 'right'
  },
  cartFooter: {
    borderTop: '2px solid #e0e0e0',
    paddingTop: '16px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  totalAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff'
  },
  placeOrderButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

