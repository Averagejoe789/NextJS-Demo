'use client';
import { useState, useMemo } from 'react';

export default function MenuDisplay({ menuItems, onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addingItem, setAddingItem] = useState(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
    return ['All', ...cats];
  }, [menuItems]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleAddToCart = async (item) => {
    setAddingItem(item.id);
    await new Promise(resolve => setTimeout(resolve, 300)); // Visual feedback
    onAddToCart(item);
    setAddingItem(null);
  };

  if (menuItems.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🍽️</div>
        <h3 style={styles.emptyTitle}>Menu Coming Soon</h3>
        <p style={styles.emptyText}>Our menu is currently being updated. Please check back soon!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Category Filter - Sticky on mobile */}
      {categories.length > 1 && (
        <div style={styles.categorySection}>
          <div style={styles.categoryFilter} className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  ...styles.categoryButton,
                  ...(selectedCategory === category ? styles.categoryButtonActive : styles.categoryButtonInactive)
                }}
                className="category-button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div style={styles.menuGrid} className="menu-grid">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            style={{
              ...styles.menuItem,
              ...(addingItem === item.id ? styles.menuItemAdding : {})
            }} 
            className="menu-item-card"
          >
            {/* Image Container */}
            <div style={styles.imageContainer}>
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  style={styles.itemImage}
                  loading="lazy"
                />
              ) : (
                <div style={styles.placeholderImage}>
                  <span style={styles.placeholderIcon}>🍽️</span>
                </div>
              )}
              {addingItem === item.id && (
                <div style={styles.addingOverlay}>
                  <div style={styles.checkmark}>✓</div>
                </div>
              )}
            </div>

            {/* Content */}
            <div style={styles.itemContent}>
              <div style={styles.itemHeader}>
                <h3 style={styles.itemName}>{item.name}</h3>
                {item.category && (
                  <span style={styles.categoryTag}>{item.category}</span>
                )}
              </div>
              
              <p style={styles.itemDescription}>{item.description}</p>
              
              {item.allergens && item.allergens.length > 0 && (
                <div style={styles.allergens}>
                  <span style={styles.allergensLabel}>⚠️ Contains:</span>
                  <span style={styles.allergensList}>{item.allergens.join(', ')}</span>
                </div>
              )}

              <div style={styles.itemFooter}>
                <div style={styles.priceContainer}>
                  <span style={styles.priceSymbol}>$</span>
                  <span style={styles.priceAmount}>{item.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={addingItem === item.id}
                  style={{
                    ...styles.addButton,
                    ...(addingItem === item.id ? styles.addButtonAdding : {})
                  }}
                  className="add-to-cart-button"
                >
                  {addingItem === item.id ? (
                    <>
                      <span style={styles.buttonSpinner}></span>
                      Added!
                    </>
                  ) : (
                    <>
                      <span style={styles.buttonPlus}>+</span>
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <h3 style={styles.emptyTitle}>No Items Found</h3>
          <p style={styles.emptyText}>Try selecting a different category.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  
  categorySection: {
    marginBottom: '1.5rem',
    position: 'sticky',
    top: '80px',
    zIndex: 10,
    backgroundColor: '#ffffff',
    padding: '1rem 0',
    borderBottom: '1px solid #e5e7eb',
  },
  
  categoryFilter: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  
  categoryButton: {
    padding: '0.625rem 1.25rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 200ms ease-in-out',
    border: 'none',
    whiteSpace: 'nowrap',
    minHeight: '44px', // Touch-friendly
  },
  
  categoryButtonActive: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
  },
  
  categoryButtonInactive: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    padding: '0.5rem 0',
  },
  
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  
  menuItemAdding: {
    transform: 'scale(0.98)',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
  },
  
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 300ms ease-in-out',
  },
  
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  
  placeholderIcon: {
    fontSize: '3rem',
    opacity: 0.5,
  },
  
  addingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 200ms ease-in-out',
  },
  
  checkmark: {
    fontSize: '3rem',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  itemContent: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '0.75rem',
  },
  
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  
  itemName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    lineHeight: 1.4,
    flex: 1,
  },
  
  categoryTag: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.625rem',
    borderRadius: '0.375rem',
    whiteSpace: 'nowrap',
  },
  
  itemDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    lineHeight: 1.6,
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  
  allergens: {
    fontSize: '0.75rem',
    color: '#dc2626',
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    padding: '0.5rem',
    backgroundColor: '#fef2f2',
    borderRadius: '0.5rem',
  },
  
  allergensLabel: {
    fontWeight: 500,
  },
  
  allergensList: {
    fontWeight: 400,
  },
  
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginTop: 'auto',
    paddingTop: '0.5rem',
  },
  
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.125rem',
  },
  
  priceSymbol: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0284c7',
  },
  
  priceAmount: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0284c7',
  },
  
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms ease-in-out',
    whiteSpace: 'nowrap',
    minHeight: '44px', // Touch-friendly
    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
  },
  
  addButtonAdding: {
    backgroundColor: '#16a34a',
  },
  
  buttonPlus: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 600ms linear infinite',
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#6b7280',
  },
  
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem',
  },
  
  emptyText: {
    fontSize: '1rem',
    color: '#6b7280',
  },
};
