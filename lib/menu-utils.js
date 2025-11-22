// Menu utility functions

/**
 * Format menu items for AI prompt context
 */
export function formatMenuForPrompt(menuItems) {
  return menuItems.map(item => {
    const allergens = item.allergens?.length > 0 
      ? `\n  Allergens: ${item.allergens.join(', ')}` 
      : '';
    return `
- ${item.name} - $${item.price.toFixed(2)}
  Description: ${item.description}
  Category: ${item.category}${allergens}
  Available: ${item.available !== false ? 'Yes' : 'No'}`
  }).join('\n');
}

/**
 * Find menu item by customer's natural language description
 */
export function findMenuItemByName(menuItems, query) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Strategy 1: Exact name match
  let match = menuItems.find(item => 
    item.name.toLowerCase() === normalizedQuery
  );
  if (match) return match;

  // Strategy 2: Contains match
  match = menuItems.find(item => 
    item.name.toLowerCase().includes(normalizedQuery) ||
    normalizedQuery.includes(item.name.toLowerCase())
  );
  if (match) return match;

  // Strategy 3: Fuzzy match (simple word matching)
  const queryWords = normalizedQuery.split(/\s+/);
  match = menuItems.find(item => {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    const matchingWords = queryWords.filter(qw => 
      itemWords.some(iw => iw.includes(qw) || qw.includes(iw))
    );
    return matchingWords.length >= queryWords.length * 0.6; // 60% match
  });
  if (match) return match;

  return null;
}

/**
 * Extract menu items from natural language text
 */
export function extractMenuItemsFromText(menuItems, text) {
  const phrases = text.split(/\s+(and|&|,)\s+/i);
  const extractedItems = [];

  phrases.forEach(phrase => {
    // Extract quantity and item name
    const quantityMatch = phrase.match(/^(\d+)\s+/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    // Remove quantity from phrase
    const itemPhrase = phrase.replace(/^\d+\s+/, '').trim();
    
    // Find matching menu item
    const menuItem = findMenuItemByName(menuItems, itemPhrase);
    if (menuItem) {
      extractedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: quantity,
        price: menuItem.price
      });
    }
  });

  return extractedItems;
}

/**
 * Calculate total price of cart items
 */
export function calculateCartTotal(cart) {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Find similar menu items (for suggestions)
 */
export function findSimilarItems(menuItems, query, limit = 3) {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);
  
  const scored = menuItems
    .filter(item => item.available !== false)
    .map(item => {
      const itemName = item.name.toLowerCase();
      const itemWords = itemName.split(/\s+/);
      
      // Calculate similarity score
      const matchingWords = queryWords.filter(qw => 
        itemWords.some(iw => iw.includes(qw) || qw.includes(iw))
      );
      const score = matchingWords.length / Math.max(queryWords.length, itemWords.length);
      
      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return scored.map(result => result.item);
}

