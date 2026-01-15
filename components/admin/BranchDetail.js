'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase-client';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { getRestaurantId } from '../../lib/auth-utils';
import { designSystem } from '../../lib/design-system';

export default function BranchDetail({ branchId }) {
  const router = useRouter();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [tables, setTables] = useState([]);
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSection, setNewTableSection] = useState('');
  const [newTablePriority, setNewTablePriority] = useState(0);

  useEffect(() => {
    loadBranch();
    loadSections();
  }, [branchId]);

  useEffect(() => {
    if (selectedSection !== null) {
      loadTables();
    }
  }, [selectedSection, branchId]);

  const loadBranch = async () => {
    try {
      setLoading(true);
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }

      const branchRef = doc(db, `restaurants/${restaurantId}/branches`, branchId);
      const branchSnap = await getDoc(branchRef);
      
      if (branchSnap.exists()) {
        const data = branchSnap.data();
        setBranch({ id: branchSnap.id, ...data });
        setBranchName(data.branchName || '');
        setLocations(Array.isArray(data.locations) ? data.locations : (data.location ? [data.location] : []));
      } else {
        throw new Error('Branch not found');
      }
    } catch (err) {
      console.error('Error loading branch:', err);
      alert('Failed to load branch details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const restaurantId = getRestaurantId();
      const sectionsRef = collection(db, `restaurants/${restaurantId}/branches/${branchId}/sections`);
      const q = query(sectionsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      let sectionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Create default sections if none exist
      if (sectionsList.length === 0) {
        const defaultSections = [
          { name: 'Ground Floor', priority: 0 },
          { name: 'First Floor', priority: 1 }
        ];

        for (const section of defaultSections) {
          const docRef = await addDoc(sectionsRef, {
            ...section,
            createdAt: new Date().toISOString()
          });
          sectionsList.push({
            id: docRef.id,
            ...section
          });
        }
      }

      setSections(sectionsList);
      if (sectionsList.length > 0 && selectedSection === null) {
        setSelectedSection(sectionsList[0].id);
      }
    } catch (err) {
      console.error('Error loading sections:', err);
    }
  };

  const loadTables = async () => {
    try {
      const restaurantId = getRestaurantId();
      const tablesRef = collection(db, `restaurants/${restaurantId}/tables`);
      const q = query(tablesRef, where('branchId', '==', branchId));
      const snapshot = await getDocs(q);
      
      const tablesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by section if selected
      const filtered = selectedSection 
        ? tablesList.filter(t => t.sectionId === selectedSection)
        : tablesList;

      setTables(filtered);
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const restaurantId = getRestaurantId();
      const branchRef = doc(db, `restaurants/${restaurantId}/branches`, branchId);
      
      await updateDoc(branchRef, {
        branchName: branchName.trim(),
        locations: locations,
        updatedAt: new Date().toISOString()
      });

      alert('Branch saved successfully');
      await loadBranch();
    } catch (err) {
      console.error('Error saving branch:', err);
      alert('Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      const restaurantId = getRestaurantId();
      const branchRef = doc(db, `restaurants/${restaurantId}/branches`, branchId);
      await deleteDoc(branchRef);
      
      router.push('/admin/tables');
    } catch (err) {
      console.error('Error deleting branch:', err);
      alert('Failed to delete branch');
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (locationToRemove) => {
    setLocations(locations.filter(loc => loc !== locationToRemove));
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) {
      alert('Please enter a table number');
      return;
    }

    try {
      const restaurantId = getRestaurantId();
      const tableData = {
        tableNumber: parseInt(newTableNumber),
        branchId: branchId,
        sectionId: selectedSection || null,
        priority: parseInt(newTablePriority) || 0,
        status: 'available',
        createdAt: new Date().toISOString()
      };

      const tablesRef = collection(db, `restaurants/${restaurantId}/tables`);
      await addDoc(tablesRef, tableData);

      setNewTableNumber('');
      setNewTableSection('');
      setNewTablePriority(0);
      setShowNewRecordModal(false);
      await loadTables();
    } catch (err) {
      console.error('Error adding table:', err);
      alert('Failed to add table');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table?')) {
      return;
    }

    try {
      const restaurantId = getRestaurantId();
      const tableRef = doc(db, `restaurants/${restaurantId}/tables`, tableId);
      await deleteDoc(tableRef);
      await loadTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      alert('Failed to delete table');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${designSystem.colors.gray[200]}`,
          borderTop: `4px solid ${designSystem.colors.primary[600]}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <p style={styles.loadingText}>Loading branch details...</p>
      </div>
    );
  }

  if (!branch) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backButton}>
          ←
        </button>
        <h1 style={styles.title}>Dining Area Edit</h1>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <div style={styles.saveButtonContainer}>
          <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
            <span style={styles.saveIcon}>💾</span>
            {saving ? 'Saving...' : 'Save'}
            <span style={styles.dropdownArrow}>▼</span>
          </button>
        </div>
        <button onClick={handleDelete} style={styles.deleteButton}>
          🗑️
        </button>
      </div>

      {/* Form Fields */}
      <div style={styles.formSection}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Location(s)</label>
          <div style={styles.locationInputContainer}>
            <div style={styles.locationTags}>
              {locations.map((location, index) => (
                <span key={index} style={styles.locationTag}>
                  {location}
                  <button
                    onClick={() => handleRemoveLocation(location)}
                    style={styles.removeLocationButton}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={styles.locationInputGroup}>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                placeholder="Add location"
                style={styles.locationInput}
              />
              <button onClick={handleAddLocation} style={styles.addLocationButton}>
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div>
        <div style={styles.tabContent}>
          <div style={styles.sectionsSidebar}>
            <h3 style={styles.sectionsTitle}>Sections</h3>
            <div style={styles.sectionsList}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  style={{
                    ...styles.sectionItem,
                    ...(selectedSection === section.id ? styles.sectionItemActive : {})
                  }}
                >
                  {section.name}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.tablesList}>
            {tables.map((table) => (
              <div key={table.id} style={styles.tableRecord}>
                <div style={styles.tableRecordLeft}>
                  <div style={styles.statusCircle}></div>
                  <span style={styles.tableNumber}>{table.tableNumber}</span>
                  <span style={styles.tableInfo}>
                    {table.tableNumber} - {table.tableNumber * 11} (0)
                  </span>
                </div>
                <div style={styles.tableRecordRight}>
                  <span style={styles.tableMeta}>
                    Section: -- Priority: {table.priority || 0}
                  </span>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    style={styles.deleteTableButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowNewRecordModal(true)}
              style={styles.newRecordButton}
            >
              + New Record
            </button>
          </div>
        </div>
      </div>

      {/* New Record Modal */}
      {showNewRecordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewRecordModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Table Record</h2>
              <button
                onClick={() => setShowNewRecordModal(false)}
                style={styles.modalClose}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Table Number *</label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g., 1"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Section</label>
                <select
                  value={newTableSection}
                  onChange={(e) => setNewTableSection(e.target.value)}
                  style={styles.input}
                >
                  <option value="">-- Select Section --</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Priority</label>
                <input
                  type="number"
                  value={newTablePriority}
                  onChange={(e) => setNewTablePriority(e.target.value)}
                  placeholder="0"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowNewRecordModal(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTable}
                style={styles.modalSubmitButton}
              >
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: designSystem.spacing[8],
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing[16],
    gap: designSystem.spacing[4],
  },
  loadingText: {
    fontSize: designSystem.typography.fontSize.base,
    color: designSystem.colors.text.secondary,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing[4],
    marginBottom: designSystem.spacing[6],
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: designSystem.typography.fontSize['2xl'],
    cursor: 'pointer',
    padding: designSystem.spacing[2],
    display: 'flex',
    alignItems: 'center',
    color: designSystem.colors.text.primary,
  },
  title: {
    fontSize: designSystem.typography.fontSize['3xl'],
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    margin: 0,
  },
  actionButtons: {
    display: 'flex',
    gap: designSystem.spacing[3],
    marginBottom: designSystem.spacing[6],
  },
  saveButtonContainer: {
    position: 'relative',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[4]}`,
    backgroundColor: '#f97316',
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: designSystem.transitions.base,
  },
  saveIcon: {
    fontSize: designSystem.typography.fontSize.base,
  },
  dropdownArrow: {
    fontSize: designSystem.typography.fontSize.xs,
    marginLeft: designSystem.spacing[1],
  },
  deleteButton: {
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[4]}`,
    backgroundColor: designSystem.colors.accent[50],
    color: designSystem.colors.accent[600],
    border: `1px solid ${designSystem.colors.accent[100]}`,
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    cursor: 'pointer',
  },
  formSection: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing[6],
    marginBottom: designSystem.spacing[6],
    boxShadow: designSystem.shadows.base,
    border: `1px solid ${designSystem.colors.border}`,
  },
  formGroup: {
    marginBottom: designSystem.spacing[6],
  },
  label: {
    display: 'block',
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing[2],
  },
  input: {
    width: '100%',
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[4]}`,
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    backgroundColor: designSystem.colors.surface,
    color: designSystem.colors.text.primary,
    boxSizing: 'border-box',
    outline: 'none',
  },
  locationInputContainer: {
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing[2],
    minHeight: '48px',
  },
  locationTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: designSystem.spacing[2],
    marginBottom: designSystem.spacing[2],
  },
  locationTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: designSystem.spacing[1],
    padding: `${designSystem.spacing[1]} ${designSystem.spacing[3]}`,
    backgroundColor: designSystem.colors.primary[50],
    color: designSystem.colors.primary[700],
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.sm,
  },
  removeLocationButton: {
    background: 'none',
    border: 'none',
    color: designSystem.colors.primary[700],
    cursor: 'pointer',
    fontSize: designSystem.typography.fontSize.base,
    padding: 0,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInputGroup: {
    display: 'flex',
    gap: designSystem.spacing[2],
  },
  locationInput: {
    flex: 1,
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[3]}`,
    border: 'none',
    outline: 'none',
    fontSize: designSystem.typography.fontSize.base,
  },
  addLocationButton: {
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[3]}`,
    backgroundColor: designSystem.colors.gray[100],
    border: 'none',
    borderRadius: designSystem.borderRadius.md,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: designSystem.spacing[4],
    borderBottom: `2px solid ${designSystem.colors.border}`,
    marginBottom: designSystem.spacing[6],
  },
  tab: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[6]}`,
    background: 'none',
    border: 'none',
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.text.secondary,
    cursor: 'pointer',
    borderBottom: `2px solid transparent`,
    marginBottom: '-2px',
    transition: designSystem.transitions.base,
  },
  tabActive: {
    color: '#f97316',
    borderBottomColor: '#f97316',
  },
  tabContent: {
    display: 'flex',
    gap: designSystem.spacing[6],
    minHeight: '400px',
  },
  sectionsSidebar: {
    width: '200px',
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing[4],
    boxShadow: designSystem.shadows.base,
    border: `1px solid ${designSystem.colors.border}`,
    height: 'fit-content',
  },
  sectionsTitle: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing[4],
  },
  sectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: designSystem.spacing[2],
  },
  sectionItem: {
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[3]}`,
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.primary,
    cursor: 'pointer',
    borderRadius: designSystem.borderRadius.md,
    transition: designSystem.transitions.base,
  },
  sectionItemActive: {
    backgroundColor: designSystem.colors.primary[50],
    color: designSystem.colors.primary[700],
  },
  tablesList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: designSystem.spacing[3],
  },
  tableRecord: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designSystem.spacing[4],
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    boxShadow: designSystem.shadows.base,
    border: `1px solid ${designSystem.colors.border}`,
  },
  tableRecordLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing[3],
  },
  statusCircle: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: designSystem.colors.success[600],
  },
  tableNumber: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
  },
  tableInfo: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.secondary,
  },
  tableRecordRight: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing[4],
  },
  tableMeta: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.secondary,
  },
  deleteTableButton: {
    background: 'none',
    border: 'none',
    color: designSystem.colors.accent[600],
    cursor: 'pointer',
    fontSize: designSystem.typography.fontSize.base,
    padding: designSystem.spacing[1],
  },
  newRecordButton: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[6]}`,
    backgroundColor: designSystem.colors.primary[600],
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  comingSoon: {
    textAlign: 'center',
    padding: designSystem.spacing[16],
    color: designSystem.colors.text.secondary,
    fontSize: designSystem.typography.fontSize.base,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: designSystem.zIndex.modal,
    padding: designSystem.spacing[4],
  },
  modal: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.xl,
    boxShadow: designSystem.shadows['2xl'],
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designSystem.spacing[6],
    borderBottom: `1px solid ${designSystem.colors.border}`,
  },
  modalTitle: {
    fontSize: designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: designSystem.typography.fontSize['3xl'],
    color: designSystem.colors.text.secondary,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: designSystem.spacing[6],
  },
  modalFooter: {
    display: 'flex',
    gap: designSystem.spacing[3],
    justifyContent: 'flex-end',
    padding: designSystem.spacing[6],
    borderTop: `1px solid ${designSystem.colors.border}`,
  },
  modalCancelButton: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[6]}`,
    backgroundColor: designSystem.colors.surface,
    color: designSystem.colors.text.secondary,
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.medium,
    cursor: 'pointer',
  },
  modalSubmitButton: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[6]}`,
    backgroundColor: designSystem.colors.primary[600],
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    cursor: 'pointer',
  },
};
