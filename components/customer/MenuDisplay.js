'use client';
import { useState, useMemo } from 'react';

export default function MenuDisplay({ menuItems, onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  const handleAddToCart = (item) => {
    onAddToCart(item);
  };

  if (menuItems.length === 0) {
    return (
      <div style={styles.emptyMenu}>
        <p>No menu items available at this time.</p>
      </div>
    );
  }

  return (
    <div style={styles.menuContainer}>
      {categories.length > 1 && (
        <div style={styles.categoryFilter} className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                ...styles.categoryButton,
                backgroundColor: selectedCategory === category ? '#007bff' : '#f8f9fa',
                color: selectedCategory === category ? 'white' : '#333'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div style={styles.menuGrid} className="menu-grid">
        {filteredItems.map((item) => (
          <div key={item.id} style={styles.menuItem} className="menu-item">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} style={styles.itemImage} />
            )}
            <div style={styles.itemContent}>
              <h3 style={styles.itemName}>{item.name}</h3>
              <p style={styles.itemDescription}>{item.description}</p>
              <div style={styles.itemFooter}>
                <span style={styles.itemPrice}>${item.price.toFixed(2)}</span>
                {item.category && (
                  <span style={styles.itemCategory}>{item.category}</span>
                )}
              </div>
              {item.allergens && item.allergens.length > 0 && (
                <div style={styles.allergens}>
                  Allergens: {item.allergens.join(', ')}
                </div>
              )}
              <button
                onClick={() => handleAddToCart(item)}
                style={styles.addButton}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  menuContainer: {
    width: '100%'
  },
  categoryFilter: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  categoryButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  menuItem: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  itemImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  itemContent: {
    padding: '16px'
  },
  itemName: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  itemDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  itemPrice: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#007bff'
  },
  itemCategory: {
    fontSize: '12px',
    color: '#999',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  allergens: {
    fontSize: '12px',
    color: '#dc3545',
    marginBottom: '12px',
    fontStyle: 'italic'
  },
  addButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  emptyMenu: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  }
};

