'use client';
import { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase-client';
import { collection, getDocs, getDoc, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getCurrentUser } from '../../lib/auth-utils';

export default function MenuUpload() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // TEMPORARY: Use dummy menu data instead of loading from Firestore
    const dummyMenuItems = [
      {
        id: '1',
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
        price: 12.99,
        category: 'Main Course',
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        price: 8.99,
        category: 'Appetizers',
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 6.99,
        category: 'Desserts',
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Spaghetti Carbonara',
        description: 'Creamy pasta with bacon and parmesan cheese',
        price: 14.99,
        category: 'Main Course',
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
    ];
    setMenuItems(dummyMenuItems);
    setLoading(false);
    
    // Original code (commented out):
    // loadMenuItems();
  }, []);

  // Original loadMenuItems function (commented out):
  // const loadMenuItems = async () => { ... }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return '';

    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const imageRef = ref(storage, `restaurants/${user.uid}/menu/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    // TEMPORARY: Just add to local state, don't save to Firestore
    try {
      if (!formData.name || !formData.price || !formData.category) {
        throw new Error('Name, price, and category are required');
      }

      const newItem = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        imageUrl: imagePreview || '',
        createdAt: new Date().toISOString(),
      };

      setMenuItems([...menuItems, newItem].sort((a, b) => a.category.localeCompare(b.category)));
      setSuccess('Menu item added successfully! (Demo mode - not saved)');
      setFormData({ name: '', description: '', price: '', category: '' });
      setImageFile(null);
      setImagePreview('');
      const imageInput = document.getElementById('image-input');
      if (imageInput) imageInput.value = '';
    } catch (err) {
      setError(err.message || 'Failed to add menu item');
    } finally {
      setUploading(false);
    }

    // Original save code (commented out):
    // try {
    //   const user = getCurrentUser();
    //   if (!user) throw new Error('User not authenticated');
    //   if (!formData.name || !formData.price || !formData.category) {
    //     throw new Error('Name, price, and category are required');
    //   }
    //   let imageUrl = '';
    //   if (imageFile) {
    //     imageUrl = await uploadImage();
    //   }
    //   const menuItem = { name: formData.name.trim(), description: formData.description.trim(), price: parseFloat(formData.price), category: formData.category.trim(), imageUrl, createdAt: new Date().toISOString() };
    //   const menuRef = collection(db, `restaurants/${user.uid}/menu`);
    //   await addDoc(menuRef, menuItem);
    //   setSuccess('Menu item added successfully!');
    //   setFormData({ name: '', description: '', price: '', category: '' });
    //   setImageFile(null);
    //   setImagePreview('');
    //   document.getElementById('image-input').value = '';
    //   loadMenuItems();
    // } catch (err) {
    //   console.error('Error adding menu item:', err);
    //   setError(err.message || 'Failed to add menu item');
    // } finally {
    //   setUploading(false);
    // }
  };

  const handleDelete = async (itemId, imageUrl) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    // TEMPORARY: Just remove from local state, don't delete from Firestore
    setMenuItems(menuItems.filter(item => item.id !== itemId));
    setSuccess('Menu item deleted successfully! (Demo mode - not saved)');

    // Original delete code (commented out):
    // try {
    //   const user = getCurrentUser();
    //   if (!user) throw new Error('User not authenticated');
    //   const menuItemRef = doc(db, `restaurants/${user.uid}/menu`, itemId);
    //   await deleteDoc(menuItemRef);
    //   if (imageUrl) {
    //     try {
    //       const imageRef = ref(storage, imageUrl);
    //       await deleteObject(imageRef);
    //     } catch (storageErr) {
    //       console.warn('Could not delete image:', storageErr);
    //     }
    //   }
    //   setSuccess('Menu item deleted successfully!');
    //   loadMenuItems();
    // } catch (err) {
    //   console.error('Error deleting menu item:', err);
    //   setError(err.message || 'Failed to delete menu item');
    // }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading menu...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Menu Management</h1>
      <p style={styles.subtitle}>Add and manage your restaurant menu items</p>

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

      <div style={styles.content}>
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Add Menu Item</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Item Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Pizza Margherita"
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
                placeholder="Delicious pizza with fresh mozzarella..."
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
                  placeholder="Appetizers, Main Course, etc."
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Item Image</label>
              {imagePreview && (
                <div style={styles.imagePreview}>
                  <img src={imagePreview} alt="Preview" style={styles.previewImage} />
                </div>
              )}
              <input
                id="image-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              <p style={styles.helpText}>Upload an image (max 5MB)</p>
            </div>

            <button 
              type="submit" 
              disabled={uploading}
              style={styles.button}
            >
              {uploading ? 'Adding...' : 'Add Menu Item'}
            </button>
          </form>
        </div>

        <div style={styles.menuSection}>
          <h2 style={styles.sectionTitle}>Menu Items ({menuItems.length})</h2>
          {menuItems.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No menu items yet. Add your first item above!</p>
            </div>
          ) : (
            <div style={styles.menuGrid}>
              {menuItems.map((item) => (
                <div key={item.id} style={styles.menuCard}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} style={styles.menuImage} />
                  )}
                  <div style={styles.menuCardContent}>
                    <h3 style={styles.menuItemName}>{item.name}</h3>
                    <p style={styles.menuItemDescription}>{item.description}</p>
                    <div style={styles.menuItemFooter}>
                      <span style={styles.menuItemPrice}>${item.price.toFixed(2)}</span>
                      <span style={styles.menuItemCategory}>{item.category}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id, item.imageUrl)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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
    marginBottom: '24px',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
  },
  formSection: {
    borderRight: '1px solid #e0e0e0',
    paddingRight: '32px',
  },
  menuSection: {
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  fileInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  imagePreview: {
    marginBottom: '12px',
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '4px',
    objectFit: 'cover',
  },
  helpText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
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
  menuGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  menuCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    gap: '16px',
  },
  menuImage: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
  },
  menuCardContent: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  menuItemName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  menuItemDescription: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    flex: 1,
  },
  menuItemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#007bff',
  },
  menuItemCategory: {
    fontSize: '12px',
    color: '#999',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  deleteButton: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
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
};

