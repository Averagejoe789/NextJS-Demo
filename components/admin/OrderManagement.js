'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getRestaurantId } from '../../lib/auth-utils';
import { formatOrderStatus, getOrderStatusColor, canUpdateOrder } from '../../lib/order-utils';

export default function OrderManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  useEffect(() => {
    loadOrders();
    
    // Refresh orders every 1 minute
    const interval = setInterval(loadOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus]);

  const loadOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }
      
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setError('Restaurant ID not found');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load orders');
      }

      setOrders(result.orders || []);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadOrders(true);
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

      {/* Filters and Refresh Button */}
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
        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loading}
          onMouseEnter={() => !refreshing && !loading && setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          style={{
            ...styles.refreshButton,
            opacity: (refreshing || loading) ? 0.6 : 1,
            cursor: (refreshing || loading) ? 'not-allowed' : 'pointer',
            backgroundColor: buttonHovered && !refreshing && !loading ? '#0056b3' : '#007bff',
            transition: 'background-color 0.2s ease'
          }}
        >
          {refreshing ? (
            <>
              <span style={{ ...styles.refreshIcon, animation: 'spin 1s linear infinite' }}>⟳</span>
              Refreshing...
            </>
          ) : (
            <>
              <span style={styles.refreshIcon}>⟳</span>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Orders Table */}
      <div style={styles.tableWrapper}>
        {filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No orders found</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Order ID</th>
                <th style={styles.tableHeader}>Table</th>
                <th style={styles.tableHeader}>Items</th>
                <th style={styles.tableHeader}>Total</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const itemsCount = order.items?.length || 0;
                const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                return (
                  <tr 
                    key={order.id} 
                    style={styles.tableRow}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = styles.tableRow.backgroundColor;
                    }}
                  >
                      <td style={styles.tableCell}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          style={styles.orderIdLink}
                          onClick={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => {
                            e.currentTarget.querySelector('span').style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.querySelector('span').style.textDecoration = 'none';
                          }}
                        >
                          <span style={styles.orderIdText}>#{order.id.slice(0, 8)}</span>
                        </Link>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.tableNumber}>Table {order.tableNumber}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.itemsCount}>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                        <span style={styles.itemsDetail}>({itemsCount} type{itemsCount !== 1 ? 's' : ''})</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.totalAmount}>${order.totalAmount?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getOrderStatusColor(order.status)
                          }}
                        >
                          {formatOrderStatus(order.status)}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.createdAt}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
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
  refreshButton: {
    marginLeft: 'auto',
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease, opacity 0.2s ease',
  },
  refreshIcon: {
    fontSize: '16px',
    display: 'inline-block',
    animation: 'none',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  },
  tableHeaderRow: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e0e0e0',
  },
  tableHeader: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#333',
    verticalAlign: 'middle',
  },
  orderIdLink: {
    textDecoration: 'none',
    cursor: 'pointer',
    display: 'inline-block',
  },
  orderIdText: {
    fontWeight: '600',
    color: '#007bff',
    fontFamily: 'monospace',
    transition: 'color 0.2s ease',
  },
  tableNumber: {
    fontWeight: '500',
    color: '#333',
  },
  itemsCount: {
    fontWeight: '500',
    color: '#333',
    display: 'block',
  },
  itemsDetail: {
    fontSize: '12px',
    color: '#666',
    display: 'block',
  },
  totalAmount: {
    fontWeight: '600',
    color: '#28a745',
    fontSize: '16px',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
    display: 'inline-block',
  },
  createdAt: {
    fontSize: '13px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
};

