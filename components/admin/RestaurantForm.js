'use client';
import { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCurrentUser } from '../../lib/auth-utils';

export default function RestaurantForm() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisine: '',
    logoUrl: '',
  });

  useEffect(() => {
    // TEMPORARY: Use dummy data instead of loading from Firestore
    setFormData({
      name: 'Sample Restaurant',
      description: 'A wonderful Italian restaurant serving authentic cuisine',
      address: '123 Main St, City, State 12345',
      phone: '(555) 123-4567',
      email: 'contact@restaurant.com',
      cuisine: 'Italian',
      logoUrl: '',
    });
    setLoading(false);
    
    // Original code (commented out):
    // loadRestaurantData();
  }, []);

  // Original loadRestaurantData function (commented out):
  // const loadRestaurantData = async () => { ... }

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
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return formData.logoUrl;

    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const logoRef = ref(storage, `restaurants/${user.uid}/logo/${Date.now()}_${logoFile.name}`);
    await uploadBytes(logoRef, logoFile);
    const downloadURL = await getDownloadURL(logoRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    // TEMPORARY: Just show success message, don't save to Firestore
    setTimeout(() => {
      setSuccess('Restaurant information saved successfully! (Demo mode - not saved)');
      setLogoFile(null);
      setSaving(false);
    }, 500);

    // Original save code (commented out):
    // try {
    //   const user = getCurrentUser();
    //   if (!user) {
    //     throw new Error('User not authenticated');
    //   }
    //   let logoUrl = formData.logoUrl;
    //   if (logoFile) {
    //     logoUrl = await uploadLogo();
    //   }
    //   const restaurantData = { ...formData, logoUrl, ownerId: user.uid, updatedAt: new Date().toISOString() };
    //   const restaurantRef = doc(db, 'restaurants', user.uid);
    //   await setDoc(restaurantRef, restaurantData, { merge: true });
    //   setSuccess('Restaurant information saved successfully!');
    //   setLogoFile(null);
    // } catch (err) {
    //   console.error('Error saving restaurant:', err);
    //   setError(err.message || 'Failed to save restaurant information');
    // } finally {
    //   setSaving(false);
    // }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading restaurant data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Restaurant Information</h1>
      <p style={styles.subtitle}>Manage your restaurant details</p>

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

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Restaurant Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="My Restaurant"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Cuisine Type</label>
            <input
              type="text"
              name="cuisine"
              value={formData.cuisine}
              onChange={handleChange}
              style={styles.input}
              placeholder="Italian, Mexican, etc."
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={styles.textarea}
            placeholder="Tell customers about your restaurant..."
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={styles.input}
              placeholder="123 Main St, City, State"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            placeholder="contact@restaurant.com"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Restaurant Logo</label>
          {logoPreview && (
            <div style={styles.logoPreview}>
              <img src={logoPreview} alt="Logo preview" style={styles.logoImage} />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <p style={styles.helpText}>Upload a logo image (max 5MB)</p>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          style={styles.button}
        >
          {saving ? 'Saving...' : 'Save Restaurant Information'}
        </button>
      </form>
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
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
    transition: 'border-color 0.2s',
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
  logoPreview: {
    marginBottom: '12px',
  },
  logoImage: {
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
    transition: 'background-color 0.2s',
    alignSelf: 'flex-start',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
  },
  successBox: {
    padding: '12px',
    backgroundColor: '#efe',
    border: '1px solid #cfc',
    borderRadius: '4px',
    color: '#3c3',
    fontSize: '14px',
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

