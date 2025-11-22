// Order utility functions

/**
 * Calculate total amount for order items
 */
export function calculateOrderTotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Validate order items exist in menu
 */
export function validateOrderItems(orderItems, menuItems) {
  const errors = [];
  
  orderItems.forEach((orderItem, index) => {
    const menuItem = menuItems.find(m => m.id === orderItem.menuItemId);
    
    if (!menuItem) {
      errors.push(`Item at index ${index}: Menu item not found (${orderItem.menuItemId})`);
      return;
    }
    
    if (menuItem.available === false) {
      errors.push(`Item "${menuItem.name}" is currently unavailable`);
    }
    
    // Validate price hasn't changed
    if (menuItem.price !== orderItem.price) {
      errors.push(`Item "${menuItem.name}": Price has changed from $${orderItem.price} to $${menuItem.price}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
}

/**
 * Get order status color for UI
 */
export function getOrderStatusColor(status) {
  const colorMap = {
    'pending': '#ffa500',
    'confirmed': '#007bff',
    'preparing': '#17a2b8',
    'ready': '#28a745',
    'completed': '#6c757d',
    'cancelled': '#dc3545'
  };
  
  return colorMap[status] || '#6c757d';
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status) {
  return ['pending', 'confirmed'].includes(status);
}

/**
 * Check if order can be updated
 */
export function canUpdateOrder(status) {
  return ['pending', 'confirmed', 'preparing'].includes(status);
}

