'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase-client';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { getRestaurantId } from '../../lib/auth-utils';
import { designSystem } from '../../lib/design-system';

export default function TableManagement() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState(new Set());
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }

      const branchesRef = collection(db, `restaurants/${restaurantId}/branches`);
      const q = query(branchesRef, orderBy('branchName', 'asc'));
      const snapshot = await getDocs(q);
      
      const branchesList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const branchData = doc.data();
          // Count tables for this branch
          const tablesRef = collection(db, `restaurants/${restaurantId}/tables`);
          const tablesSnapshot = await getDocs(tablesRef);
          const tablesCount = tablesSnapshot.docs.filter(
            tableDoc => tableDoc.data().branchId === doc.id
          ).length;

          return {
            id: doc.id,
            ...branchData,
            tablesCount
          };
        })
      );
      
      setBranches(branchesList);
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!branchName.trim()) {
      alert('Please enter a branch name');
      return;
    }

    if (!location.trim()) {
      alert('Please enter a location');
      return;
    }

    setCreating(true);
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }

      const branchData = {
        branchName: branchName.trim(),
        location: location.trim(),
        createdAt: new Date().toISOString()
      };

      const branchesRef = collection(db, `restaurants/${restaurantId}/branches`);
      await addDoc(branchesRef, branchData);

      setBranchName('');
      setLocation('');
      setShowCreateModal(false);
      await loadBranches();
    } catch (err) {
      console.error('Error creating branch:', err);
      alert(err.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBranches(new Set(branches.map(b => b.id)));
    } else {
      setSelectedBranches(new Set());
    }
  };

  const handleSelectBranch = (branchId) => {
    const newSelected = new Set(selectedBranches);
    if (newSelected.has(branchId)) {
      newSelected.delete(branchId);
    } else {
      newSelected.add(branchId);
    }
    setSelectedBranches(newSelected);
  };

  const handleEdit = (branch) => {
    router.push(`/admin/tables/${branch.id}`);
  };

  const handleCopy = (branch) => {
    // TODO: Implement copy functionality
    console.log('Copy branch:', branch);
  };

  const sortedBranches = [...branches].sort((a, b) => {
    let aVal, bVal;
    if (sortColumn === 'name') {
      aVal = a.branchName?.toLowerCase() || '';
      bVal = b.branchName?.toLowerCase() || '';
    } else if (sortColumn === 'location') {
      aVal = a.location?.toLowerCase() || '';
      bVal = b.location?.toLowerCase() || '';
    } else {
      aVal = a.tablesCount || 0;
      bVal = b.tablesCount || 0;
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

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
        <p style={styles.loadingText}>Loading dining areas...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dining Areas</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={styles.newButton}
        >
          <span style={styles.plusIcon}>+</span>
          New
        </button>
      </div>

      {/* Table View */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.checkboxHeader}>
                <input
                  type="checkbox"
                  checked={selectedBranches.size === branches.length && branches.length > 0}
                  onChange={handleSelectAll}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.actionHeader}></th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('name')}
              >
                <div style={styles.headerContent}>
                  Name
                  <span style={styles.sortIcon}>
                    {sortColumn === 'name' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                  </span>
                </div>
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('location')}
              >
                <div style={styles.headerContent}>
                  Location(s)
                  <span style={styles.sortIcon}>
                    {sortColumn === 'location' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                  </span>
                </div>
              </th>
              <th style={styles.tableHeader}>
                <div style={styles.headerContent}>
                  Tables
                  <span style={styles.filterIcon}>⚙</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBranches.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🏢</div>
                    <h3 style={styles.emptyTitle}>No dining areas yet</h3>
                    <p style={styles.emptyText}>Create your first branch to get started</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      style={styles.emptyButton}
                    >
                      Create Branch
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedBranches.map((branch) => (
                <tr key={branch.id} style={styles.tableRow}>
                  <td style={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedBranches.has(branch.id)}
                      onChange={() => handleSelectBranch(branch.id)}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={styles.actionCell}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleEdit(branch)}
                        style={styles.editButton}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleCopy(branch)}
                        style={styles.copyButton}
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <button
                      onClick={() => router.push(`/admin/tables/${branch.id}`)}
                      style={styles.branchNameLink}
                    >
                      {branch.branchName}
                    </button>
                  </td>
                  <td style={styles.tableCell}>{branch.location}</td>
                  <td style={styles.tableCell}>{branch.tablesCount || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedBranches.length > 0 && (
        <div style={styles.pagination}>
          <span style={styles.paginationText}>
            Showing 1-{sortedBranches.length} of {sortedBranches.length} records
          </span>
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Branch</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.modalClose}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Branch Name *</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g., Downtown Branch"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 123 Main St, City, State"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={createBranch}
                disabled={creating}
                style={styles.modalSubmitButton}
              >
                {creating ? 'Creating...' : 'Create Branch'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing[6],
  },
  title: {
    fontSize: designSystem.typography.fontSize['3xl'],
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    margin: 0,
  },
  newButton: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[4]}`,
    backgroundColor: '#f97316', // Orange color
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: designSystem.transitions.base,
    boxShadow: designSystem.shadows.md,
  },
  plusIcon: {
    fontSize: designSystem.typography.fontSize.xl,
    lineHeight: 1,
    fontWeight: 'bold',
  },
  tableCard: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    boxShadow: designSystem.shadows.base,
    overflow: 'hidden',
    border: `1px solid ${designSystem.colors.border}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    backgroundColor: designSystem.colors.gray[50],
    borderBottom: `1px solid ${designSystem.colors.border}`,
  },
  checkboxHeader: {
    width: '50px',
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[4]}`,
  },
  actionHeader: {
    width: '100px',
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[4]}`,
  },
  tableHeader: {
    padding: `${designSystem.spacing[4]} ${designSystem.spacing[6]}`,
    textAlign: 'left',
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing[2],
  },
  sortIcon: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.primary[600],
  },
  filterIcon: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.secondary,
    marginLeft: designSystem.spacing[1],
    cursor: 'pointer',
  },
  tableRow: {
    borderBottom: `1px solid ${designSystem.colors.border}`,
    transition: designSystem.transitions.base,
  },
  checkboxCell: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[4]}`,
    width: '50px',
  },
  actionCell: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[4]}`,
    width: '100px',
  },
  actionButtons: {
    display: 'flex',
    gap: designSystem.spacing[2],
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: designSystem.typography.fontSize.base,
    padding: designSystem.spacing[1],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: designSystem.transitions.base,
  },
  copyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: designSystem.typography.fontSize.base,
    padding: designSystem.spacing[1],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: designSystem.transitions.base,
    color: designSystem.colors.gray[600],
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  tableCell: {
    padding: `${designSystem.spacing[4]} ${designSystem.spacing[6]}`,
    fontSize: designSystem.typography.fontSize.base,
    color: designSystem.colors.text.primary,
  },
  branchNameLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: designSystem.typography.fontSize.base,
    color: designSystem.colors.primary[600],
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'left',
    fontWeight: designSystem.typography.fontWeight.medium,
    transition: designSystem.transitions.base,
  },
  emptyCell: {
    padding: designSystem.spacing[16],
    textAlign: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: designSystem.spacing[4],
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: designSystem.spacing[2],
  },
  emptyTitle: {
    fontSize: designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    margin: 0,
  },
  emptyText: {
    fontSize: designSystem.typography.fontSize.base,
    color: designSystem.colors.text.secondary,
    margin: 0,
    marginBottom: designSystem.spacing[4],
  },
  emptyButton: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[6]}`,
    backgroundColor: designSystem.colors.primary[600],
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.md,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: designSystem.transitions.base,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `${designSystem.spacing[4]} ${designSystem.spacing[6]}`,
    borderTop: `1px solid ${designSystem.colors.border}`,
    backgroundColor: designSystem.colors.gray[50],
  },
  paginationText: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.secondary,
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
  formGroup: {
    marginBottom: designSystem.spacing[4],
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
    transition: designSystem.transitions.base,
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
    transition: designSystem.transitions.base,
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
    transition: designSystem.transitions.base,
  },
};
