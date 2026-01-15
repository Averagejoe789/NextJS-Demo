'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRestaurantId } from '../../../../lib/auth-utils';
import { formatOrderStatus, getOrderStatusColor } from '../../../../lib/order-utils';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    // Create a unique request ID for this effect run
    const currentRequestId = ++requestIdRef.current;
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const restaurantId = getRestaurantId();
        if (!restaurantId) {
          setError('Restaurant ID not found. Please make sure you are logged in.');
          setLoading(false);
          return;
        }
        
        console.log('🔍 Loading order:', { orderId, restaurantId });
        
        const response = await fetch(`/api/orders/${orderId}?restaurantId=${restaurantId}`, {
          signal: abortController.signal
        });
        
        // Check if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          console.log('⚠️ Request outdated, ignoring...');
          return;
        }
        
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('❌ Error parsing JSON response:', jsonError);
          throw new Error(`Invalid response from server. Status: ${response.status}`);
        }

        console.log('📦 API Response:', { 
          ok: response.ok, 
          status: response.status, 
          hasError: !!result.error,
          hasOrder: !!result.order,
          success: result.success 
        });

        if (!response.ok) {
          // Handle API error responses
          const errorMessage = result.details || result.error || `Failed to load order (Status: ${response.status})`;
          console.error('❌ API Error:', {
            status: response.status,
            error: result.error,
            details: result.details,
            code: result.code
          });
          throw new Error(errorMessage);
        }

        // Check if result has success flag and order
        if (result.success !== undefined && !result.success) {
          const errorMessage = result.details || result.error || 'Failed to load order';
          console.error('❌ API returned success=false:', errorMessage);
          throw new Error(errorMessage);
        }

        if (!result.order) {
          console.error('❌ No order data in response:', result);
          throw new Error('Order data not found in response');
        }

        // Double-check we're still the latest request before updating state
        if (currentRequestId === requestIdRef.current) {
          console.log('✅ Order loaded successfully:', result.order.id);
          setOrder(result.order);
          setLoading(false);
          setError(''); // Clear any previous errors
        }
      } catch (err) {
        // Don't set error if request was aborted or not the latest request
        if (err.name === 'AbortError') {
          console.log('⚠️ Request aborted');
          return;
        }
        
        if (currentRequestId !== requestIdRef.current) {
          console.log('⚠️ Request outdated, ignoring error');
          return;
        }
        
        console.error('❌ Error loading order:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        // Set a user-friendly error message
        const errorMessage = err.message || 'Failed to load order. Please try again or check your connection.';
        setError(errorMessage);
        setLoading(false);
        setOrder(null); // Clear order on error
      }
    };

    loadOrder();
    
    // Cleanup function to abort request if orderId changes or component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [orderId]);

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
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

      setSuccess(`Order status updated to ${formatOrderStatus(newStatus)}`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Update local state
      setOrder(prevOrder => ({
        ...prevOrder,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }));

    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message || 'Failed to update order');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusOptions = (currentStatus) => {
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading order details...</div>
      </div>
    );
  }

  if (error && !order && !loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button
            onClick={() => router.push('/admin/orders')}
            style={styles.backButton}
          >
            ← Back to Orders
          </button>
          <h1 style={styles.title}>Order Details</h1>
        </div>
        <div style={styles.errorBox}>
          <h3 style={styles.errorTitle}>Unable to Load Order</h3>
          <p style={styles.errorMessage}>{error}</p>
          {error.includes('Firebase Admin') && (
            <div style={styles.errorDetails}>
              <p style={styles.errorDetailsTitle}>Configuration Required:</p>
              <ol style={styles.errorDetailsList}>
                <li>Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON</li>
                <li>Set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account key file</li>
                <li>Place service-account-key.json file in the project root</li>
                <li>Configure Google Cloud SDK with application default credentials</li>
              </ol>
              <p style={styles.errorDetailsNote}>
                See <strong>FIREBASE_SETUP.md</strong> in your project for detailed instructions.
              </p>
            </div>
          )}
        </div>
        <div style={styles.errorActions}>
          <button
            onClick={() => window.location.reload()}
            style={styles.retryButton}
          >
            🔄 Retry
          </button>
          <button
            onClick={() => router.push('/admin/orders')}
            style={styles.backButton}
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>Order not found</div>
        <button
          onClick={() => router.push('/admin/orders')}
          style={styles.backButton}
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  const statusOptions = getStatusOptions(order.status);
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => router.push('/admin/orders')}
          style={styles.backButton}
        >
          ← Back to Orders
        </button>
        <h1 style={styles.title}>Order Details</h1>
      </div>

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

      {/* Order Summary Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.orderId}>Order #{order.id.slice(0, 8)}</h2>
            <p style={styles.orderMeta}>
              Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <> • Updated: {new Date(order.updatedAt).toLocaleString()}</>
              )}
            </p>
          </div>
          <div style={styles.statusSection}>
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

        {/* Order Info Grid */}
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <label style={styles.infoLabel}>Table Number</label>
            <div style={styles.infoValue}>Table {order.tableNumber}</div>
          </div>
          <div style={styles.infoItem}>
            <label style={styles.infoLabel}>Total Items</label>
            <div style={styles.infoValue}>{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
          </div>
          <div style={styles.infoItem}>
            <label style={styles.infoLabel}>Item Types</label>
            <div style={styles.infoValue}>{order.items?.length || 0} type{(order.items?.length || 0) !== 1 ? 's' : ''}</div>
          </div>
          <div style={styles.infoItem}>
            <label style={styles.infoLabel}>Total Amount</label>
            <div style={{ ...styles.infoValue, ...styles.totalAmount }}>
              ${order.totalAmount?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Status Update Section */}
        {statusOptions.length > 0 && (
          <div style={styles.statusUpdateSection}>
            <label style={styles.statusUpdateLabel}>Update Status:</label>
            <div style={styles.statusButtons}>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => updateOrderStatus(status)}
                  disabled={updating}
                  style={{
                    ...styles.statusButton,
                    backgroundColor: getOrderStatusColor(status),
                    opacity: updating ? 0.6 : 1,
                    cursor: updating ? 'not-allowed' : 'pointer'
                  }}
                >
                  Mark as {formatOrderStatus(status)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Items Card */}
      {order.items && order.items.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Order Items</h3>
          <div style={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={index} style={styles.orderItem}>
                <div style={styles.itemHeader}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemQuantity}>{item.quantity}x</span>
                    <span style={styles.itemName}>{item.name}</span>
                  </div>
                  <span style={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div style={styles.itemDetails}>
                  <div style={styles.itemPriceDetail}>
                    ${item.price.toFixed(2)} each
                  </div>
                  {item.specialInstructions && (
                    <div style={styles.specialInstructions}>
                      <strong>Special Instructions:</strong> {item.specialInstructions}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={styles.totalValue}>
              ${order.totalAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      )}

      {/* Order Notes Card */}
      {order.specialInstructions && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Order Notes</h3>
          <div style={styles.notesContent}>
            {order.specialInstructions}
          </div>
        </div>
      )}

      {/* Additional Info Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Additional Information</h3>
        <div style={styles.additionalInfo}>
          <div style={styles.additionalInfoRow}>
            <label style={styles.additionalInfoLabel}>Order ID:</label>
            <span style={styles.additionalInfoValue}>{order.id}</span>
          </div>
          {order.chatId && (
            <div style={styles.additionalInfoRow}>
              <label style={styles.additionalInfoLabel}>Chat Session:</label>
              <span style={styles.additionalInfoValue}>{order.chatId.slice(0, 8)}...</span>
            </div>
          )}
          {order.tableId && (
            <div style={styles.additionalInfoRow}>
              <label style={styles.additionalInfoLabel}>Table ID:</label>
              <span style={styles.additionalInfoValue}>{order.tableId}</span>
            </div>
          )}
          <div style={styles.additionalInfoRow}>
            <label style={styles.additionalInfoLabel}>Created At:</label>
            <span style={styles.additionalInfoValue}>
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}
            </span>
          </div>
          {order.updatedAt && (
            <div style={styles.additionalInfoRow}>
              <label style={styles.additionalInfoLabel}>Last Updated:</label>
              <span style={styles.additionalInfoValue}>
                {new Date(order.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
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
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    minHeight: '400px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '32px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'inline-block',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  errorBox: {
    padding: '20px 24px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '6px',
    color: '#c33',
    fontSize: '14px',
    marginBottom: '20px',
  },
  successBox: {
    padding: '12px 16px',
    backgroundColor: '#efe',
    border: '1px solid #cfc',
    borderRadius: '6px',
    color: '#3c3',
    fontSize: '14px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '2px solid #f0f0f0',
  },
  orderId: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '8px',
    color: '#333',
    fontFamily: 'monospace',
  },
  orderMeta: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: '24px',
    color: '#28a745',
  },
  statusUpdateSection: {
    paddingTop: '24px',
    borderTop: '1px solid #f0f0f0',
  },
  statusUpdateLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '12px',
    display: 'block',
  },
  statusButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    marginBottom: '20px',
    color: '#333',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderItem: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemQuantity: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#007bff',
    minWidth: '40px',
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
  },
  itemPrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#28a745',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '52px',
  },
  itemPriceDetail: {
    fontSize: '13px',
    color: '#666',
  },
  specialInstructions: {
    fontSize: '13px',
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '8px 12px',
    borderRadius: '4px',
    borderLeft: '3px solid #ffc107',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '20px',
    marginTop: '20px',
    borderTop: '2px solid #e0e0e0',
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#28a745',
  },
  notesContent: {
    fontSize: '15px',
    color: '#333',
    lineHeight: '1.6',
    padding: '16px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    borderLeft: '4px solid #ffc107',
  },
  additionalInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  additionalInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  additionalInfoLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
  },
  additionalInfoValue: {
    fontSize: '14px',
    color: '#333',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    textAlign: 'right',
    maxWidth: '60%',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#c33',
  },
  errorMessage: {
    fontSize: '14px',
    margin: '0 0 16px 0',
    color: '#333',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
  },
  errorDetails: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#fff9e6',
    border: '1px solid #ffc107',
    borderRadius: '6px',
  },
  errorDetailsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#856404',
  },
  errorDetailsList: {
    margin: '0 0 12px 0',
    paddingLeft: '24px',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.8',
  },
  errorDetailsNote: {
    fontSize: '13px',
    color: '#666',
    margin: '12px 0 0 0',
    fontStyle: 'italic',
  },
  errorActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

