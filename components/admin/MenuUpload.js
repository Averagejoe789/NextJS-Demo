'use client';
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase-client';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getRestaurantId } from '../../lib/auth-utils';
import { designSystem } from '../../lib/design-system';

const ds = designSystem;

export default function MenuUpload() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('category'); // 'name' | 'price' | 'category'
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', category: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  const loadMenuItems = async () => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      setError('Restaurant ID not found');
      setLoading(false);
      return;
    }
    try {
      const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
      const snapshot = await getDocs(menuRef);
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        price: typeof d.data().price === 'number' ? d.data().price : parseFloat(d.data().price) || 0,
        available: d.data().available !== false,
      }));
      setMenuItems(items);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => {
      setSuccess('');
      setError('');
    }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const categories = useMemo(
    () => ['all', ...[...new Set(menuItems.map((item) => item.category).filter(Boolean))].sort()],
    [menuItems]
  );

  const filteredAndSortedItems = useMemo(() => {
    let list = menuItems;
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
      return (a.category || '').localeCompare(b.category || '');
    });
    return list;
  }, [menuItems, selectedCategory, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) throw new Error('Restaurant ID not found');
      if (!formData.name?.trim() || !formData.price || !formData.category?.trim()) {
        throw new Error('Name, price, and category are required');
      }
      const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
      await addDoc(menuRef, {
        name: formData.name.trim(),
        description: (formData.description || '').trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSuccess('Menu item added successfully.');
      setFormData({ name: '', description: '', price: '', category: '' });
      setShowAddModal(false);
      await loadMenuItems();
    } catch (err) {
      setError(err.message || 'Failed to add menu item');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      setError('Restaurant ID not found');
      return;
    }
    try {
      const menuItemRef = doc(db, `restaurants/${restaurantId}/menu`, itemId);
      await deleteDoc(menuItemRef);
      setSuccess('Menu item deleted.');
      await loadMenuItems();
    } catch (err) {
      setError(err.message || 'Failed to delete menu item');
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      category: item.category || '',
    });
  };

  const closeEdit = () => {
    setEditingItem(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setError('');
    setSuccess('');
    setUploading(true);
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      setUploading(false);
      return;
    }
    try {
      const menuItemRef = doc(db, `restaurants/${restaurantId}/menu`, editingItem.id);
      await updateDoc(menuItemRef, {
        name: editForm.name.trim(),
        description: (editForm.description || '').trim(),
        price: parseFloat(editForm.price),
        category: editForm.category.trim(),
        updatedAt: new Date().toISOString(),
      });
      setSuccess('Menu item updated.');
      closeEdit();
      await loadMenuItems();
    } catch (err) {
      setError(err.message || 'Failed to update menu item');
    } finally {
      setUploading(false);
    }
  };

  const toggleAvailability = async (item) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;
    const newAvailable = !(item.available !== false);
    try {
      const menuItemRef = doc(db, `restaurants/${restaurantId}/menu`, item.id);
      await updateDoc(menuItemRef, {
        available: newAvailable,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(newAvailable ? 'Item is now available.' : 'Item marked unavailable.');
      await loadMenuItems();
    } catch (err) {
      setError(err.message || 'Failed to update availability');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading menu...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Menu Management</h1>
        <p style={styles.subtitle}>Add, edit, and manage your restaurant menu items</p>
      </div>

      {error && <div style={styles.alertError}>{error}</div>}
      {success && <div style={styles.alertSuccess}>{success}</div>}

      <div style={styles.content}>
        <section style={styles.menuSection}>
          <div style={styles.toolbar}>
            <div style={styles.filtersRow}>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={styles.addButton}
              >
                Add menu item
              </button>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={styles.select}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All categories' : cat}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="category">Sort by category</option>
                <option value="name">Sort by name</option>
                <option value="price">Sort by price</option>
              </select>
            </div>
          </div>

          {filteredAndSortedItems.length === 0 ? (
            <div style={styles.emptyState}>
              <p>
                {menuItems.length === 0
                  ? 'No menu items yet. Click "Add menu item" to get started.'
                  : 'No items match your filter.'}
              </p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.tableHeader}>Name</th>
                    <th style={styles.tableHeader}>Description</th>
                    <th style={styles.tableHeader}>Category</th>
                    <th style={styles.tableHeader}>Price</th>
                    <th style={styles.tableHeader}>Available</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedItems.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        ...styles.tableRow,
                        opacity: item.available !== false ? 1 : 0.8,
                      }}
                    >
                      <td style={styles.tableCell}>{item.name}</td>
                      <td style={{ ...styles.tableCell, ...styles.tableCellDesc }}>
                        {item.description || '—'}
                      </td>
                      <td style={styles.tableCell}>{item.category}</td>
                      <td style={styles.tableCell}>
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}
                      </td>
                      <td style={styles.tableCell}>
                        <button
                          type="button"
                          onClick={() => toggleAvailability(item)}
                          style={{
                            ...styles.availabilityBadge,
                            backgroundColor:
                              item.available !== false ? ds.colors.success[500] : ds.colors.gray[400],
                          }}
                          title={item.available !== false ? 'Click to mark unavailable' : 'Click to mark available'}
                        >
                          {item.available !== false ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.cellActions}>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            style={styles.editButton}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            style={styles.deleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showAddModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add menu item</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={styles.modalClose} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="e.g. Margherita Pizza"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  style={styles.textarea}
                  placeholder="Short description..."
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    style={styles.input}
                    placeholder="12.99"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="e.g. Main Course"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.filter((c) => c !== 'all').map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" disabled={uploading} style={styles.button}>
                  {uploading ? 'Adding…' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={styles.modalBackdrop} onClick={closeEdit}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit menu item</h2>
              <button type="button" onClick={closeEdit} style={styles.modalClose} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item name *</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditChange}
                    required
                    min="0"
                    step="0.01"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    required
                    style={styles.input}
                    list="edit-categories"
                  />
                  <datalist id="edit-categories">
                    {categories.filter((c) => c !== 'all').map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={closeEdit} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" disabled={uploading} style={styles.button}>
                  {uploading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing[8],
    boxShadow: designSystem.shadows.md,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: designSystem.spacing[6],
  },
  title: {
    fontSize: designSystem.typography.fontSize['3xl'],
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    margin: 0,
    marginBottom: designSystem.spacing[1],
  },
  subtitle: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.secondary,
    margin: 0,
  },
  content: {
    width: '100%',
    maxWidth: '100%',
  },
  sectionTitle: {
    fontSize: designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing[5],
    marginTop: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: designSystem.spacing[5],
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: designSystem.spacing[4],
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: designSystem.spacing[2],
  },
  label: {
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.text.primary,
  },
  input: {
    padding: designSystem.spacing[3],
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.base,
    outline: 'none',
  },
  textarea: {
    padding: designSystem.spacing[3],
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.base,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  button: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[6]}`,
    backgroundColor: designSystem.colors.primary[500],
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.medium,
    cursor: 'pointer',
  },
  alertError: {
    padding: designSystem.spacing[3],
    backgroundColor: designSystem.colors.accent[50],
    border: `1px solid ${designSystem.colors.accent[500]}`,
    borderRadius: designSystem.borderRadius.sm,
    color: designSystem.colors.accent[700],
    fontSize: designSystem.typography.fontSize.sm,
    marginBottom: designSystem.spacing[5],
  },
  alertSuccess: {
    padding: designSystem.spacing[3],
    backgroundColor: designSystem.colors.success[50],
    border: `1px solid ${designSystem.colors.success[500]}`,
    borderRadius: designSystem.borderRadius.sm,
    color: designSystem.colors.success[600],
    fontSize: designSystem.typography.fontSize.sm,
    marginBottom: designSystem.spacing[5],
  },
  menuSection: {
    minWidth: 0,
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  toolbar: {
    width: '100%',
    marginBottom: designSystem.spacing[5],
  },
  addButton: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[5]}`,
    backgroundColor: designSystem.colors.primary[500],
    color: designSystem.colors.text.inverse,
    border: 'none',
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.medium,
    cursor: 'pointer',
  },
  filtersRow: {
    display: 'flex',
    gap: designSystem.spacing[3],
    flexWrap: 'wrap',
  },
  select: {
    padding: designSystem.spacing[3],
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.sm,
    backgroundColor: designSystem.colors.surface,
    minWidth: '140px',
    outline: 'none',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.base,
    backgroundColor: designSystem.colors.surface,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: designSystem.typography.fontSize.sm,
  },
  tableHeadRow: {
    backgroundColor: designSystem.colors.gray[50],
    borderBottom: `2px solid ${designSystem.colors.border}`,
  },
  tableHeader: {
    padding: designSystem.spacing[3],
    textAlign: 'left',
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: `1px solid ${designSystem.colors.border}`,
  },
  tableCell: {
    padding: designSystem.spacing[3],
    color: designSystem.colors.text.primary,
    verticalAlign: 'middle',
  },
  tableCellDesc: {
    maxWidth: '280px',
    color: designSystem.colors.text.secondary,
    whiteSpace: 'normal',
  },
  cellActions: {
    display: 'flex',
    gap: designSystem.spacing[2],
    flexWrap: 'wrap',
  },
  availabilityBadge: {
    padding: `${designSystem.spacing[1]} ${designSystem.spacing[2]}`,
    borderRadius: designSystem.borderRadius.full,
    fontSize: designSystem.typography.fontSize.xs,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.text.inverse,
    border: 'none',
    cursor: 'pointer',
  },
  editButton: {
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[3]}`,
    backgroundColor: designSystem.colors.primary[50],
    color: designSystem.colors.primary[700],
    border: `1px solid ${designSystem.colors.primary[200]}`,
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.sm,
    cursor: 'pointer',
  },
  deleteButton: {
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[3]}`,
    backgroundColor: designSystem.colors.accent[50],
    color: designSystem.colors.accent[600],
    border: `1px solid ${designSystem.colors.accent[500]}`,
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.sm,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: designSystem.spacing[12],
    color: designSystem.colors.text.secondary,
    fontSize: designSystem.typography.fontSize.base,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing[16],
  },
  loadingText: {
    fontSize: designSystem.typography.fontSize.lg,
    color: designSystem.colors.text.secondary,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: designSystem.zIndex.modalBackdrop,
    padding: designSystem.spacing[4],
  },
  modal: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    boxShadow: designSystem.shadows['2xl'],
    maxWidth: '480px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: designSystem.zIndex.modal,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designSystem.spacing[5],
    borderBottom: `1px solid ${designSystem.colors.border}`,
  },
  modalTitle: {
    fontSize: designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.semibold,
    margin: 0,
    color: designSystem.colors.text.primary,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: designSystem.colors.text.secondary,
    lineHeight: 1,
    padding: designSystem.spacing[1],
  },
  modalActions: {
    display: 'flex',
    gap: designSystem.spacing[3],
    justifyContent: 'flex-end',
    marginTop: designSystem.spacing[4],
  },
  cancelButton: {
    padding: `${designSystem.spacing[3]} ${designSystem.spacing[5]}`,
    backgroundColor: designSystem.colors.gray[100],
    color: designSystem.colors.text.primary,
    border: `1px solid ${designSystem.colors.border}`,
    borderRadius: designSystem.borderRadius.sm,
    fontSize: designSystem.typography.fontSize.base,
    cursor: 'pointer',
  },
};
