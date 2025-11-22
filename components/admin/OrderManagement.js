'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getRestaurantId } from '../../lib/auth-utils';
import { formatOrderStatus, getOrderStatusColor, canUpdateOrder } from '../../lib/order-utils';

export default function OrderManagement() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
    
    // Refresh orders every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus]);

  const loadOrders = async () => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setError('Restaurant ID not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load orders');
      }

      setOrders(result.orders || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (selectedStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === selectedStatus));
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurantId,
          status: newStatus
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order');
      }

      setSuccess(`Order #${orderId} updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message || 'Failed to update order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['completed'],
      'completed': [],
      'cancelled': []
    };

    return statusFlow[currentStatus] || [];
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Order Management</h1>
      <p style={styles.subtitle}>View and manage customer orders</p>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.successBox}>
          {success}
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#ffa500' }}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#17a2b8' }}>{stats.preparing}</div>
          <div style={styles.statLabel}>Preparing</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#28a745' }}>{stats.ready}</div>
          <div style={styles.statLabel}>Ready</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#6c757d' }}>{stats.completed}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <label style={styles.filterLabel}>Filter by Status:</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div style={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <div>
                  <h3 style={styles.orderId}>Order #{order.id.slice(0, 8)}</h3>
                  <p style={styles.orderInfo}>
                    Table {order.tableNumber} • {order.items?.length || 0} item(s) • ${order.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                  <p style={styles.orderTime}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown time'}
                  </p>
                </div>
                <div style={styles.orderStatus}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getOrderStatusColor(order.status)
                    }}
                  >
                    {formatOrderStatus(order.status)}
                  </span>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div style={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <div key={index} style={styles.orderItem}>
                      <span style={styles.itemQuantity}>{item.quantity}x</span>
                      <span style={styles.itemName}>{item.name}</span>
                      <span style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                      {item.specialInstructions && (
                        <div style={styles.specialInstructions}>
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {order.specialInstructions && (
                <div style={styles.orderNotes}>
                  <strong>Order Notes:</strong> {order.specialInstructions}
                </div>
              )}

              <div style={styles.orderActions}>
                {getStatusOptions(order.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(order.id, status)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: getOrderStatusColor(status)
                    }}
                  >
                    Mark as {formatOrderStatus(status)}
                  </button>
                ))}
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: getOrderStatusColor('completed')
                    }}
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '32px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
    marginBottom: '20px',
  },
  successBox: {
    padding: '12px',
    backgroundColor: '#efe',
    border: '1px solid #cfc',
    borderRadius: '4px',
    color: '#3c3',
    fontSize: '14px',
    marginBottom: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
  },
  filters: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  orderId: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#333',
  },
  orderInfo: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  },
  orderTime: {
    fontSize: '12px',
    color: '#999',
  },
  orderStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
  },
  orderItems: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  itemQuantity: {
    fontWeight: '600',
    color: '#007bff',
    minWidth: '30px',
  },
  itemName: {
    flex: 1,
    color: '#333',
  },
  itemPrice: {
    fontWeight: '600',
    color: '#28a745',
    minWidth: '80px',
    textAlign: 'right',
  },
  specialInstructions: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
    marginLeft: '42px',
    marginTop: '-4px',
    marginBottom: '4px',
  },
  orderNotes: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#856404',
    marginBottom: '16px',
  },
  orderActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
};

