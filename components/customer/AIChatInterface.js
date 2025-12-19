'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase-client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AIChatInterface({ restaurantId, tableId, chatId, menuItems, cart, onCartUpdate, onAddToCart, restaurant }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Suggested questions for friendly UX
  const suggestedQuestions = [
    "What do you recommend?",
    "Show me vegetarian options",
    "What's your most popular dish?",
    "I'd like to order a pizza",
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

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

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading) return;
    if (!restaurantId || !tableId || !chatId) {
      console.error('restaurantId, tableId, and chatId are required');
      return;
    }

    if (!messageText) {
      setInputText('');
    }
    setLoading(true);

    try {
      // Save user message to Firestore
      const messagesRef = collection(
        db,
        `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
      );
      
      await addDoc(messagesRef, {
        text: textToSend,
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
          message: textToSend,
          chatHistory: messages.slice(-20),
          menu: menuItems,
          cart: cart,
          context: {
            restaurantName: restaurant?.name || 'Restaurant',
            tableNumber: restaurant?.tableNumber || 1
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
      
      // Save friendly error message to chat
      const messagesRef = collection(
        db,
        `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
      );
      
      let errorMessage = 'Oops! 😅 Something went wrong. Could you please try again?';
      if (error.message?.includes('OPENAI_API_KEY') || error.message?.includes('configuration')) {
        errorMessage = 'I\'m having trouble connecting right now. Please let the staff know! 😊';
      } else if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        errorMessage = 'I\'m getting a lot of requests! Please wait a moment and try again. ⏱️';
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

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  return (
    <div style={styles.container} className="chatgpt-chat-container">
      {/* Messages Area */}
      <div style={styles.messagesContainer} className="chatgpt-messages">
        {messages.length === 0 ? (
          <div style={styles.welcomeMessage}>
            <div style={styles.welcomeAvatar}>
              <div style={styles.avatarIcon}>🤖</div>
            </div>
            <h2 style={styles.welcomeTitle}>
              👋 Hi! I'm your friendly AI assistant
            </h2>
            <p style={styles.welcomeSubtext}>
              I'm here to help you discover amazing dishes, answer questions about our menu, 
              and help you place your order. What can I do for you today?
            </p>
            
            {/* Suggested Questions */}
            <div style={styles.suggestionsContainer}>
              <p style={styles.suggestionsLabel}>Try asking me:</p>
              <div style={styles.suggestionsGrid}>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    style={styles.suggestionButton}
                    className="suggestion-button"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Info */}
            <div style={styles.quickInfo}>
              <div style={styles.quickInfoItem}>
                <span style={styles.quickInfoIcon}>📋</span>
                <span style={styles.quickInfoText}>Browse menu items</span>
              </div>
              <div style={styles.quickInfoItem}>
                <span style={styles.quickInfoIcon}>🌱</span>
                <span style={styles.quickInfoText}>Ask about allergens</span>
              </div>
              <div style={styles.quickInfoItem}>
                <span style={styles.quickInfoIcon}>🛒</span>
                <span style={styles.quickInfoText}>Order food naturally</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageWrapper,
                ...(message.sender === 'user' ? styles.userWrapper : styles.assistantWrapper)
              }}
              className={`message-wrapper ${message.sender}`}
            >
              {message.sender === 'assistant' && (
                <div style={styles.assistantAvatar}>
                  <div style={styles.avatarIcon}>🤖</div>
                </div>
              )}
              <div
                style={{
                  ...styles.message,
                  ...(message.sender === 'user' ? styles.userMessage : styles.assistantMessage)
                }}
                className={`message ${message.sender === 'user' ? 'user' : 'assistant'}`}
              >
                {message.text.split('\n').map((line, i) => (
                  <div key={i} style={{ 
                    marginBottom: i < message.text.split('\n').length - 1 ? '0.5rem' : '0',
                    lineHeight: 1.6
                  }}>
                    {line}
                  </div>
                ))}
                {message.type === 'error' && (
                  <div style={styles.errorNote}>
                    <span style={styles.errorIcon}>⚠️</span>
                    <span>There was an issue, but I'm here to help!</span>
                  </div>
                )}
              </div>
              {message.sender === 'user' && (
                <div style={styles.userAvatar}>
                  <div style={styles.userIcon}>👤</div>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={styles.loadingWrapper}>
            <div style={styles.assistantAvatar}>
              <div style={styles.avatarIcon}>🤖</div>
            </div>
            <div style={styles.loadingBubble}>
              <div style={styles.loadingDots}>
                <span style={styles.loadingDot}></span>
                <span style={{ ...styles.loadingDot, animationDelay: '0.2s' }}></span>
                <span style={{ ...styles.loadingDot, animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Friendly Design */}
      <div style={styles.inputWrapper} className="chatgpt-input-wrapper">
        <div style={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Ask about menu, place order, or say hello!)"
            style={styles.textarea}
            disabled={loading}
            rows={1}
            maxLength={500}
          />
          <button 
            onClick={() => handleSendMessage()} 
            disabled={loading || !inputText.trim()}
            style={{
              ...styles.sendButton,
              ...(loading || !inputText.trim() ? styles.sendButtonDisabled : {})
            }}
            className="send-button"
            aria-label="Send message"
          >
            {loading ? (
              <div style={styles.sendButtonSpinner}></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
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
    minHeight: '600px',
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    border: 'none',
  },
  
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0.75rem 0.5rem',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#f9fafb',
  },
  
  // Welcome Message
  welcomeMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    padding: '1.5rem 0.5rem',
    textAlign: 'center',
    maxWidth: '100%',
    margin: '0 auto',
  },
  
  welcomeAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
    animation: 'fadeIn 400ms ease-in-out',
  },
  
  avatarIcon: {
    fontSize: '2rem',
  },
  
  welcomeTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 0.75rem 0',
    lineHeight: 1.3,
  },
  
  welcomeSubtext: {
    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
    color: '#6b7280',
    margin: '0 0 2rem 0',
    lineHeight: 1.6,
    maxWidth: '500px',
  },
  
  // Suggested Questions
  suggestionsContainer: {
    width: '100%',
    marginBottom: '2rem',
  },
  
  suggestionsLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.75rem',
    textAlign: 'left',
  },
  
  suggestionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'stretch',
  },
  
  suggestionButton: {
    padding: '0.75rem 1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 200ms ease-in-out',
    textAlign: 'left',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    minHeight: '44px', // Touch-friendly
  },
  
  // Quick Info
  quickInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    marginTop: '1rem',
  },
  
  quickInfoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  
  quickInfoIcon: {
    fontSize: '1.25rem',
  },
  
  quickInfoText: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  
  // Message Wrappers
  messageWrapper: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.5rem 0.5rem',
    alignItems: 'flex-start',
    maxWidth: '100%',
    animation: 'fadeIn 300ms ease-in-out',
  },
  
  userWrapper: {
    flexDirection: 'row-reverse',
  },
  
  assistantWrapper: {
    flexDirection: 'row',
  },
  
  // Avatars
  assistantAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  userIcon: {
    fontSize: '1.125rem',
    color: '#ffffff',
  },
  
  // Messages
  message: {
    maxWidth: '92%',
    wordWrap: 'break-word',
    lineHeight: 1.6,
    fontSize: '0.9375rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  
  userMessage: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderBottomRightRadius: '0.25rem',
  },
  
  assistantMessage: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: 'none',
    borderBottomLeftRadius: '0.25rem',
  },
  
  errorNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#fef2f2',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    color: '#dc2626',
  },
  
  errorIcon: {
    fontSize: '1rem',
  },
  
  // Loading State
  loadingWrapper: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.5rem 0.5rem',
    alignItems: 'flex-start',
  },
  
  loadingBubble: {
    padding: '0.75rem 1rem',
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: '0.75rem',
    borderBottomLeftRadius: '0.25rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  
  loadingDots: {
    display: 'flex',
    gap: '0.375rem',
    alignItems: 'center',
  },
  
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af',
    animation: 'pulse 1.4s ease-in-out infinite',
  },
  
  // Input Area
  inputWrapper: {
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    padding: '0.75rem 0.5rem 0.5rem 0.5rem',
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
  },
  
  inputContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.5rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '1.25rem',
    padding: '0.625rem 0.875rem',
    transition: 'all 200ms ease-in-out',
    marginBottom: 0,
  },
  
  inputContainerFocused: {
    borderColor: '#0284c7',
    boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.1)',
  },
  
  textarea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    resize: 'none',
    maxHeight: '120px',
    overflowY: 'auto',
    padding: '0',
    lineHeight: 1.5,
    color: '#111827',
    minHeight: '24px',
  },
  
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 200ms ease-in-out',
    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
    minWidth: '44px', // Touch-friendly
    minHeight: '44px',
  },
  
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 0.5,
  },
  
  sendButtonSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 600ms linear infinite',
  },
};
