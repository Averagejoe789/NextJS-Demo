'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase-client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AIChatInterface({ restaurantId, tableId, chatId, menuItems, cart, onCartUpdate, onAddToCart }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up Firestore listener for real-time updates
  useEffect(() => {
    if (!restaurantId || !chatId) {
      return;
    }

    let isMounted = true;
    let unsubscribe = null;

    async function setupFirestoreListener() {
      try {
        const messagesRef = collection(
          db,
          `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
        );
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          
          const messagesList = snapshot.docs.map(doc => ({
            id: doc.id,
            text: doc.data().text || '',
            sender: doc.data().sender || 'user',
            type: doc.data().type || 'message',
            metadata: doc.data().metadata || {},
            timestamp: doc.data().timestamp
          }));
          
          setMessages(messagesList);
        }, (error) => {
          console.error('Firestore listener error:', error);
        });
      } catch (error) {
        console.error('Error setting up Firestore listener:', error);
      }
    }

    setupFirestoreListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [restaurantId, chatId]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || loading) return;
    if (!restaurantId || !tableId || !chatId) {
      console.error('restaurantId, tableId, and chatId are required');
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      // Save user message to Firestore
      const messagesRef = collection(
        db,
        `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
      );
      
      await addDoc(messagesRef, {
        text: userMessage,
        sender: 'user',
        type: 'message',
        timestamp: serverTimestamp()
      });

      // Call AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableId,
          chatId,
          message: userMessage,
          chatHistory: messages.slice(-20),
          menu: menuItems,
          cart: cart,
          context: {
            restaurantName: 'Restaurant',
            tableNumber: 1
          }
        })
      });

      const aiResponse = await response.json();

      if (!response.ok) {
        throw new Error(aiResponse.error || 'Failed to get AI response');
      }

      // Save AI response to Firestore
      await addDoc(messagesRef, {
        text: aiResponse.text,
        sender: 'assistant',
        type: 'message',
        metadata: {
          action: aiResponse.action,
          items: aiResponse.items
        },
        timestamp: serverTimestamp()
      });

      // Handle action if present
      if (aiResponse.action !== 'none' && aiResponse.items) {
        handleAIAction(aiResponse.action, aiResponse.items);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Save error message to chat
      const messagesRef = collection(
        db,
        `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
      );
      await addDoc(messagesRef, {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        type: 'error',
        timestamp: serverTimestamp()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIAction = (action, items) => {
    switch (action) {
      case 'add_to_cart':
        items.forEach(item => {
          if (item.menuItemId && item.quantity) {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            if (menuItem) {
              // Add to cart multiple times if quantity > 1
              for (let i = 0; i < item.quantity; i++) {
                onAddToCart({
                  ...menuItem,
                  specialInstructions: item.specialInstructions
                });
              }
            }
          }
        });
        break;
      case 'remove_from_cart':
        items.forEach(item => {
          // Handle remove from cart
          if (item.menuItemId) {
            // This would need to be implemented in the parent component
            console.log('Remove from cart:', item);
          }
        });
        break;
      case 'show_cart':
        // Cart is already visible, just scroll to it
        break;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container} className="chat-container">
      <div style={styles.messagesContainer} className="chat-messages">
        {messages.length === 0 ? (
          <div style={styles.welcomeMessage}>
            <p style={styles.welcomeText}>👋 Hi! I'm your AI assistant.</p>
            <p style={styles.welcomeSubtext}>
              Ask me about menu items, or tell me what you'd like to order!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.message,
                ...(message.sender === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              {message.text}
              {message.type === 'error' && (
                <span style={styles.errorIndicator}>⚠️</span>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={styles.loadingIndicator}>
            <span>AI is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about menu items or place an order..."
          style={styles.input}
          disabled={loading}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={loading || !inputText.trim()}
          style={{
            ...styles.button,
            opacity: loading || !inputText.trim() ? 0.6 : 1,
            cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '400px',
    maxHeight: '600px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff'
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  welcomeMessage: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666'
  },
  welcomeText: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '8px'
  },
  welcomeSubtext: {
    fontSize: '14px'
  },
  message: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '75%',
    wordWrap: 'break-word',
    lineHeight: '1.5'
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px'
  },
  botMessage: {
    backgroundColor: '#fff',
    color: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  errorIndicator: {
    marginLeft: '8px'
  },
  loadingIndicator: {
    padding: '12px 16px',
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic',
    alignSelf: 'flex-start'
  },
  inputContainer: {
    display: 'flex',
    padding: '16px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    gap: '12px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontSize: '16px',
    outline: 'none',
    minHeight: '44px'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    minHeight: '44px',
    minWidth: '80px'
  }
};

