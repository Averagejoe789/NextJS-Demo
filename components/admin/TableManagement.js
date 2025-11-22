'use client';
import { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase-client';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCurrentUser, getRestaurantId } from '../../lib/auth-utils';
import QRCode from 'qrcode';

export default function TableManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tables, setTables] = useState([]);
  const [tableCount, setTableCount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setError('Restaurant ID not found');
        setLoading(false);
        return;
      }

      const tablesRef = collection(db, `restaurants/${restaurantId}/tables`);
      const q = query(tablesRef, orderBy('tableNumber', 'asc'));
      const snapshot = await getDocs(q);
      
      const tablesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTables(tablesList);
      setLoading(false);
    } catch (err) {
      console.error('Error loading tables:', err);
      setError('Failed to load tables');
      setLoading(false);
    }
  };

  const generateQRCode = async (restaurantId, tableId, tableNumber) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/order?restaurantId=${restaurantId}&tableId=${tableId}`;
    
    try {
      // Generate QR code data URL
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to blob
      const response = await fetch(qrDataURL);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const user = getCurrentUser();
      const storageRef = ref(storage, `restaurants/${restaurantId}/qr-codes/table-${tableNumber}-${tableId}.png`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      return {
        qrCodeUrl: downloadURL,
        qrCodeData: url,
        dataURL: qrDataURL
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  };

  const createTables = async () => {
    if (!tableCount || isNaN(tableCount) || parseInt(tableCount) <= 0) {
      setError('Please enter a valid number of tables');
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }

      const count = parseInt(tableCount);
      const baseUrl = window.location.origin;
      const newTables = [];

      // Create tables
      for (let i = 1; i <= count; i++) {
        // Check if table number already exists
        const existingTable = tables.find(t => t.tableNumber === i);
        if (existingTable) {
          continue; // Skip if table already exists
        }

        const tableData = {
          tableNumber: i,
          status: 'available',
          createdAt: new Date().toISOString()
        };

        // Create table document
        const tableRef = collection(db, `restaurants/${restaurantId}/tables`);
        const docRef = await addDoc(tableRef, tableData);
        const tableId = docRef.id;

        // Generate QR code
        const qrData = await generateQRCode(restaurantId, tableId, i);

        // Update table with QR code data
        const tableDocRef = doc(db, `restaurants/${restaurantId}/tables`, tableId);
        await updateDoc(tableDocRef, {
          qrCodeUrl: qrData.qrCodeUrl,
          qrCodeData: qrData.qrCodeData
        });

        newTables.push({
          id: tableId,
          ...tableData,
          ...qrData
        });
      }

      setSuccess(`Successfully created ${newTables.length} table(s)!`);
      setTableCount('');
      await loadTables();
    } catch (err) {
      console.error('Error creating tables:', err);
      setError(err.message || 'Failed to create tables');
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table? This cannot be undone.')) {
      return;
    }

    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }

      await deleteDoc(doc(db, `restaurants/${restaurantId}/tables`, tableId));
      setSuccess('Table deleted successfully');
      await loadTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      setError(err.message || 'Failed to delete table');
    }
  };

  const downloadQRCode = (qrCodeUrl, tableNumber) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `table-${tableNumber}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading tables...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Table Management</h1>
      <p style={styles.subtitle}>Configure tables and generate QR codes for customer ordering</p>

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

      <div style={styles.createSection}>
        <h2 style={styles.sectionTitle}>Create New Tables</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Number of Tables:</label>
          <input
            type="number"
            value={tableCount}
            onChange={(e) => setTableCount(e.target.value)}
            min="1"
            placeholder="e.g., 10"
            style={styles.input}
          />
          <button 
            onClick={createTables} 
            disabled={saving}
            style={styles.button}
          >
            {saving ? 'Creating...' : 'Create Tables'}
          </button>
        </div>
        <p style={styles.helpText}>
          Enter the number of tables to create. Each table will get a unique QR code.
        </p>
      </div>

      <div style={styles.tablesSection}>
        <h2 style={styles.sectionTitle}>Existing Tables ({tables.length})</h2>
        {tables.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No tables created yet. Create tables above to get started.</p>
          </div>
        ) : (
          <div style={styles.tablesGrid}>
            {tables.map((table) => (
              <div key={table.id} style={styles.tableCard}>
                <div style={styles.tableHeader}>
                  <h3 style={styles.tableNumber}>Table {table.tableNumber}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: table.status === 'available' ? '#28a745' : 
                                   table.status === 'occupied' ? '#ffc107' : '#6c757d'
                  }}>
                    {table.status}
                  </span>
                </div>
                
                {table.qrCodeUrl && (
                  <div style={styles.qrSection}>
                    <img src={table.qrCodeUrl} alt={`Table ${table.tableNumber} QR Code`} style={styles.qrImage} />
                    <div style={styles.qrActions}>
                      <button
                        onClick={() => downloadQRCode(table.qrCodeUrl, table.tableNumber)}
                        style={styles.downloadButton}
                      >
                        Download QR Code
                      </button>
                      <button
                        onClick={() => window.open(table.qrCodeUrl, '_blank')}
                        style={styles.viewButton}
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                )}
                
                {table.qrCodeData && (
                  <div style={styles.qrUrl}>
                    <label style={styles.label}>QR Code URL:</label>
                    <input
                      type="text"
                      value={table.qrCodeData}
                      readOnly
                      style={styles.urlInput}
                      onClick={(e) => e.target.select()}
                    />
                  </div>
                )}
                
                <button
                  onClick={() => deleteTable(table.id)}
                  style={styles.deleteButton}
                >
                  Delete Table
                </button>
              </div>
            ))}
          </div>
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
  createSection: {
    marginBottom: '40px',
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    marginBottom: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
    display: 'block',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    width: '150px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  helpText: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
  tablesSection: {
    marginTop: '32px',
  },
  tablesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  tableCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fff',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  tableNumber: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#333',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
  },
  qrSection: {
    marginBottom: '16px',
    textAlign: 'center',
  },
  qrImage: {
    width: '200px',
    height: '200px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '12px',
  },
  qrActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  downloadButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  viewButton: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  qrUrl: {
    marginBottom: '16px',
  },
  urlInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  deleteButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
};

