'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase-client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AIChatInterface({ restaurantId, tableId, chatId, menuItems, cart, onCartUpdate, onAddToCart }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      inputRef.current?.focus();
    }
  }, []);

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('AI Chat API Error:', errorData);
        throw new Error(errorData.error || `Failed to get AI response (${response.status})`);
      }

      const aiResponse = await response.json();

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
      if (aiResponse.action === 'add_to_cart' && aiResponse.items) {
        aiResponse.items.forEach(item => {
          if (item.menuItemId && item.quantity) {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            if (menuItem) {
              onAddToCart(menuItem, item.quantity, item.specialInstructions || '');
            }
          }
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Save error message to chat
      const messagesRef = collection(
        db,
        `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
      );
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.message?.includes('OPENAI_API_KEY') || error.message?.includes('configuration')) {
        errorMessage = 'AI service is currently unavailable. Please contact support.';
      } else if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      await addDoc(messagesRef, {
        text: errorMessage,
        sender: 'assistant',
        type: 'error',
        timestamp: serverTimestamp()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container} className="chatgpt-chat-container">
      {/* Messages Area */}
      <div style={styles.messagesContainer} className="chatgpt-messages">
        {messages.length === 0 ? (
          <div style={styles.welcomeMessage}>
            <div style={styles.welcomeIcon}>💬</div>
            <h2 style={styles.welcomeTitle}>How can I help you today?</h2>
            <p style={styles.welcomeSubtext}>
              Ask me about menu items, dietary restrictions, or place an order!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageWrapper,
                ...(message.sender === 'user' ? styles.userWrapper : styles.assistantWrapper)
              }}
            >
              {message.sender === 'assistant' && (
                <div style={styles.avatar}>🤖</div>
              )}
              <div
                style={{
                  ...styles.message,
                  ...(message.sender === 'user' ? styles.userMessage : styles.assistantMessage)
                }}
              >
                {message.text.split('\n').map((line, i) => (
                  <div key={i} style={{ marginBottom: i < message.text.split('\n').length - 1 ? '8px' : '0' }}>
                    {line}
                  </div>
                ))}
                {message.type === 'error' && (
                  <span style={styles.errorIndicator}> ⚠️</span>
                )}
              </div>
              {message.sender === 'user' && (
                <div style={styles.userAvatar}>👤</div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={styles.loadingWrapper}>
            <div style={styles.avatar}>🤖</div>
            <div style={styles.loadingIndicator}>
              <span style={styles.loadingDot}>●</span>
              <span style={{ ...styles.loadingDot, animationDelay: '0.2s' }}>●</span>
              <span style={{ ...styles.loadingDot, animationDelay: '0.4s' }}>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - ChatGPT style */}
      <div style={styles.inputWrapper} className="chatgpt-input-wrapper">
        <div style={styles.inputContainer}>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message..."
            style={styles.textarea}
            disabled={loading}
            rows={1}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={loading || !inputText.trim()}
            style={{
              ...styles.sendButton,
              opacity: loading || !inputText.trim() ? 0.5 : 1,
              cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer'
            }}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div style={styles.inputFooter}>
          <span style={styles.footerText}>
            AI can make mistakes. Check important info.
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '500px',
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '20px 0',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch'
  },
  welcomeMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6b7280'
  },
  welcomeIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  welcomeSubtext: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
    maxWidth: '500px'
  },
  messageWrapper: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    alignItems: 'flex-start',
    maxWidth: '100%'
  },
  userWrapper: {
    backgroundColor: '#ffffff',
    justifyContent: 'flex-end'
  },
  assistantWrapper: {
    backgroundColor: '#f9fafb',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    backgroundColor: '#10a37f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0
  },
  message: {
    maxWidth: '85%',
    wordWrap: 'break-word',
    lineHeight: '1.75',
    fontSize: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap'
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    borderTopRightRadius: '2px'
  },
  assistantMessage: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderTopLeftRadius: '2px'
  },
  errorIndicator: {
    marginLeft: '8px',
    fontSize: '18px'
  },
  loadingWrapper: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  loadingIndicator: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  loadingDot: {
    fontSize: '12px',
    color: '#9ca3af',
    animation: 'pulse 1.4s ease-in-out infinite'
  },
  inputWrapper: {
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    position: 'sticky',
    bottom: 0,
    zIndex: 10
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '24px',
    padding: '8px 12px',
    maxWidth: '100%',
    marginBottom: '8px'
  },
  textarea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'none',
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '4px 0',
    lineHeight: '1.5',
    color: '#111827',
    minHeight: '24px'
  },
  sendButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.2s'
  },
  inputFooter: {
    textAlign: 'center',
    paddingTop: '8px'
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af'
  }
};
