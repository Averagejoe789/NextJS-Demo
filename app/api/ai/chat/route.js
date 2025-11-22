import { NextResponse } from 'next/server';
import { initOpenAI, OPENAI_TOOLS, createSystemPrompt, selectModel, calculateOpenAICost } from '../../../../lib/ai-utils';
import { adminDb } from '../../../../lib/firebase-admin';

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { restaurantId, tableId, chatId, message, chatHistory = [], menu, cart = [], context } = body;

    // Validate required fields
    if (!restaurantId || !tableId || !message) {
      return NextResponse.json(
        { error: 'restaurantId, tableId, and message are required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI
    let openai;
    try {
      openai = initOpenAI();
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      return NextResponse.json(
        { 
          error: 'AI service configuration error',
          details: error.message?.includes('OPENAI_API_KEY') 
            ? 'OpenAI API key is not configured'
            : error.message
        },
        { status: 500 }
      );
    }

    // Fetch menu if not provided
    let menuItems = menu || [];
    if (menuItems.length === 0) {
      try {
        const menuSnapshot = await adminDb
          .collection('restaurants')
          .doc(restaurantId)
          .collection('menu')
          .get();
        
        menuItems = menuSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (err) {
        console.error('Error fetching menu:', err);
      }
    }

    // Filter available items
    const availableMenuItems = menuItems.filter(item => item.available !== false);

    // Format cart for context
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Build system prompt
    const systemPrompt = createSystemPrompt(
      context || { name: 'Restaurant' },
      availableMenuItems,
      cart,
      cartTotal
    );

    // Format chat history for context (last 15 messages)
    const recentHistory = chatHistory.slice(-15).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text ? msg.text.substring(0, 500) : '' // Truncate long messages
    }));

    // Select model
    const model = selectModel(message, availableMenuItems.length, true);

    // Call OpenAI API with tools
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message }
      ],
      tools: OPENAI_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    const aiMessage = completion.choices[0].message;
    
    // Parse response
    let response = {
      text: aiMessage.content || '',
      action: 'none',
      items: [],
      suggestions: [],
      confidence: 0.9,
      metadata: {
        model: completion.model,
        tokens: completion.usage?.total_tokens,
        finishReason: completion.choices[0].finish_reason,
        responseTime: Date.now() - startTime
      }
    };

    // Handle tool calls
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      let functionArgs;
      
      try {
        functionArgs = JSON.parse(toolCall.function.arguments);
      } catch (err) {
        console.error('Error parsing function arguments:', err);
        functionArgs = {};
      }

      // Map tool calls to actions
      switch (functionName) {
        case 'add_to_cart':
          response.action = 'add_to_cart';
          response.items = functionArgs.items.map(item => {
            const menuItem = availableMenuItems.find(m => m.id === item.menuItemId);
            if (!menuItem) {
              console.warn(`Menu item not found: ${item.menuItemId}`);
              return null;
            }
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity || 1,
              specialInstructions: item.specialInstructions || '',
              name: menuItem.name,
              price: menuItem.price,
              imageUrl: menuItem.imageUrl
            };
          }).filter(item => item !== null);
          break;
          
        case 'remove_from_cart':
          response.action = 'remove_from_cart';
          const menuItemToRemove = availableMenuItems.find(m => m.id === functionArgs.menuItemId);
          response.items = [{
            menuItemId: functionArgs.menuItemId,
            quantity: functionArgs.quantity || null,
            name: menuItemToRemove?.name
          }];
          break;
          
        case 'show_cart':
          response.action = 'show_cart';
          break;
          
        case 'get_menu_item_info':
          response.action = 'get_menu_item_info';
          const menuItemInfo = availableMenuItems.find(m => m.id === functionArgs.menuItemId);
          if (menuItemInfo) {
            const allergens = menuItemInfo.allergens?.length > 0
              ? `\nAllergens: ${menuItemInfo.allergens.join(', ')}`
              : '';
            response.text = `${response.text}\n\n**${menuItemInfo.name}** - $${menuItemInfo.price.toFixed(2)}\n${menuItemInfo.description}\nCategory: ${menuItemInfo.category}${allergens}`;
          }
          response.metadata.menuItemId = functionArgs.menuItemId;
          break;
      }
    }

    // Calculate cost (for logging/monitoring)
    if (completion.usage) {
      response.metadata.cost = calculateOpenAICost(completion.usage, completion.model);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI Chat API Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });
    
    // Handle OpenAI-specific errors
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    
    if (error.status === 401 || error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'AI service configuration error. Please contact support.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
    
    // More detailed error message
    const errorMessage = error.message || 'Failed to process chat message';
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

