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
    await new Promise(resolve => setTimeout(resolve, 300));
    onAddToCart(item);
    setAddingItem(null);
  };

  if (menuItems.length === 0) {
    return (
      <div className="menu-empty-state">
        <div className="menu-empty-icon">🍽️</div>
        <h3 className="menu-empty-title">Menu Coming Soon</h3>
        <p className="menu-empty-text">Our menu is currently being updated. Please check back soon!</p>
      </div>
    );
  }

  return (
    <div className="menu-display-container">
      {/* Category Filter - Mobile Optimized */}
      {categories.length > 1 && (
        <div className="menu-category-section">
          <div className="menu-category-filter">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`menu-category-button ${selectedCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Grid - Mobile First */}
      <div className="menu-grid-container">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className={`menu-item-card ${addingItem === item.id ? 'adding' : ''}`}
          >
            {/* Image */}
            <div className="menu-item-image-wrapper">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="menu-item-image"
                  loading="lazy"
                />
              ) : (
                <div className="menu-item-placeholder">
                  <span className="menu-item-placeholder-icon">🍽️</span>
                </div>
              )}
              {addingItem === item.id && (
                <div className="menu-item-adding-overlay">
                  <div className="menu-item-checkmark">✓</div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="menu-item-content">
              <div className="menu-item-header">
                <h3 className="menu-item-name">{item.name}</h3>
                {item.category && (
                  <span className="menu-item-category-tag">{item.category}</span>
                )}
              </div>
              
              <p className="menu-item-description">{item.description}</p>
              
              {item.allergens && item.allergens.length > 0 && (
                <div className="menu-item-allergens">
                  <span className="menu-item-allergens-label">⚠️ Contains:</span>
                  <span className="menu-item-allergens-list">{item.allergens.join(', ')}</span>
                </div>
              )}

              <div className="menu-item-footer">
                <div className="menu-item-price">
                  <span className="menu-item-price-symbol">$</span>
                  <span className="menu-item-price-amount">{item.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={addingItem === item.id}
                  className={`menu-item-add-button ${addingItem === item.id ? 'adding' : ''}`}
                >
                  {addingItem === item.id ? (
                    <>
                      <span className="menu-button-spinner"></span>
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <span className="menu-button-plus">+</span>
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="menu-empty-state">
          <div className="menu-empty-icon">🔍</div>
          <h3 className="menu-empty-title">No Items Found</h3>
          <p className="menu-empty-text">Try selecting a different category.</p>
        </div>
      )}
    </div>
  );
}
