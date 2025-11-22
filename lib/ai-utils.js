// AI utility functions
import OpenAI from 'openai';

/**
 * Initialize OpenAI client
 */
export function initOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Define OpenAI tools (functions) for cart operations
 */
export const OPENAI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Add menu items to the customer\'s cart. Use this when the customer wants to order items.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of menu items to add to cart',
            items: {
              type: 'object',
              properties: {
                menuItemId: {
                  type: 'string',
                  description: 'The ID of the menu item to add (must match a menu item ID from the menu)'
                },
                quantity: {
                  type: 'number',
                  description: 'Number of this item to add (default: 1)',
                  minimum: 1
                },
                specialInstructions: {
                  type: 'string',
                  description: 'Any special instructions or modifications for this item (e.g., "no onions", "extra cheese")'
                }
              },
              required: ['menuItemId']
            }
          }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_cart',
      description: 'Remove items from the customer\'s cart. Use this when the customer wants to remove or cancel items.',
      parameters: {
        type: 'object',
        properties: {
          menuItemId: {
            type: 'string',
            description: 'The ID of the menu item to remove from cart'
          },
          quantity: {
            type: 'number',
            description: 'Quantity to remove (if not specified, removes all of this item)',
            minimum: 1
          }
        },
        required: ['menuItemId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'show_cart',
      description: 'Show the current cart contents to the customer. Use this when the customer asks about their cart, what they ordered, or wants to review their order.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_menu_item_info',
      description: 'Get detailed information about a specific menu item. Use this when the customer asks about ingredients, allergens, description, or price of a menu item.',
      parameters: {
        type: 'object',
        properties: {
          menuItemId: {
            type: 'string',
            description: 'The ID of the menu item to get information about'
          }
        },
        required: ['menuItemId']
      }
    }
  }
];

/**
 * Create system prompt for AI assistant
 */
export function createSystemPrompt(restaurant, menuItems, cart, cartTotal) {
  const formattedMenu = formatMenuForPrompt(menuItems.filter(item => item.available !== false));
  const formattedCart = cart.length > 0 
    ? cart.map(item => `- ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')
    : 'Cart is empty';

  return `You are a friendly and knowledgeable restaurant assistant helping customers at ${restaurant.name || 'our restaurant'}.

**Your Role:**
- Answer questions about menu items (ingredients, allergens, preparation)
- Help customers discover dishes based on preferences (dietary restrictions, cuisine types)
- Assist with ordering by adding items to their cart
- Provide friendly, conversational service

**Restaurant Information:**
- Name: ${restaurant.name || 'Restaurant'}
- Cuisine: ${restaurant.cuisine || 'Various'}
- Description: ${restaurant.description || ''}

**Menu Items Available:**
${formattedMenu}

**Current Cart:**
${formattedCart}
Total: $${cartTotal.toFixed(2)}

**Your Capabilities:**
1. **Answer Questions**: When customers ask about menu items, provide accurate information
2. **Recommendations**: Suggest dishes based on preferences (vegetarian, spicy, etc.)
3. **Add to Cart**: When customers want to order, use the add_to_cart function
4. **Show Cart**: When customers ask about their cart, use the show_cart function
5. **Place Order**: Help customers finalize their order when ready

**Guidelines:**
- Be friendly, helpful, and concise
- If asked about items not on the menu, politely say they're not available
- Always confirm quantities when adding items to cart
- When unsure, ask clarifying questions
- For dietary restrictions, highlight relevant menu items
- Show prices in responses: "Margherita Pizza - $12.99"
- When adding items, confirm clearly: "Added 2x Margherita Pizza ($25.98) to your cart"

**Response Format:**
- Provide natural, conversational responses
- When recommending, explain why: "If you like spicy food, try our Pepperoni Pizza"`;
}

/**
 * Format menu for AI prompt context
 */
function formatMenuForPrompt(menuItems) {
  return menuItems.map(item => {
    const allergens = item.allergens?.length > 0 
      ? `\n  Allergens: ${item.allergens.join(', ')}` 
      : '';
    return `
- ${item.name} - $${item.price.toFixed(2)} (ID: ${item.id})
  Description: ${item.description}
  Category: ${item.category}${allergens}
  Available: ${item.available !== false ? 'Yes' : 'No'}`
  }).join('\n');
}

/**
 * Select appropriate OpenAI model based on query complexity
 */
export function selectModel(message, menuSize, hasToolCalls) {
  const isSimpleQuery = message.length < 50 && !hasToolCalls;
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  
  // Use cheaper model for simple queries if configured
  if (isSimpleQuery && process.env.OPENAI_FALLBACK_MODEL) {
    return process.env.OPENAI_FALLBACK_MODEL;
  }
  
  return model;
}

/**
 * Calculate cost for OpenAI usage
 */
export function calculateOpenAICost(usage, model) {
  const pricing = {
    'gpt-4o': { input: 2.50, output: 10.00 }, // per 1M tokens
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
  };
  
  const modelPricing = pricing[model] || pricing['gpt-4o'];
  const inputCost = (usage.prompt_tokens / 1000000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1000000) * modelPricing.output;
  
  return {
    inputCost,
    outputCost,
    total: inputCost + outputCost,
    tokens: usage.total_tokens
  };
}

