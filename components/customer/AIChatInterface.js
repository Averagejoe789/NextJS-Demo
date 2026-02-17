'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../../lib/firebase-client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AIChatInterface({ restaurantId, tableId, chatId, menuItems, cart, onCartUpdate, onAddToCart, restaurant }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const suggestedQuestions = [
    "What do you recommend?",
    "Show me vegetarian options",
    "What's your most popular dish?",
    "I'd like to order a pizza",
  ];

  const followUpSuggestions = [
    "Tell me more",
    "Add it to my cart",
    "What else do you have?",
    "Show my cart",
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

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distanceFromBottom > 150);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Set up Firestore listener for real-time updates
  useEffect(() => {
    if (!restaurantId || !chatId) return;

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
      if (unsubscribe) unsubscribe();
    };
  }, [restaurantId, chatId]);

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading) return;
    if (!restaurantId || !tableId || !chatId) {
      console.error('restaurantId, tableId, and chatId are required');
      return;
    }

    if (!messageText) setInputText('');
    setLoading(true);

    try {
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
      const messagesRef = collection(
        db,
        `restaurants/${restaurantId}/chatSessions/${chatId}/messages`
      );

      let errorMessage = 'Oops! Something went wrong. Could you please try again?';
      if (error.message?.includes('OPENAI_API_KEY') || error.message?.includes('configuration')) {
        errorMessage = 'I\'m having trouble connecting right now. Please let the staff know!';
      } else if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        errorMessage = 'I\'m getting a lot of requests! Please wait a moment and try again.';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyMessage = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const charCount = inputText.length;
  const maxChars = 500;
  const lastMessage = messages[messages.length - 1];
  const showFollowUp = !loading && messages.length > 0 && lastMessage?.sender === 'assistant';

  return (
    <div className="chat-container">
      {/* Messages Area */}
      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome__avatar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="chat-welcome__title">
              Hi there! I'm your AI assistant
            </h2>
            <p className="chat-welcome__subtitle">
              I can help you explore our menu, find dishes that match your taste,
              and place your order. What sounds good today?
            </p>

            <div className="chat-welcome__suggestions">
              <p className="chat-welcome__suggestions-label">Try asking me:</p>
              <div className="chat-welcome__suggestions-grid">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="chat-suggestion-chip"
                  >
                    <span className="chat-suggestion-chip__icon">
                      {index === 0 && '✨'}
                      {index === 1 && '🥗'}
                      {index === 2 && '🔥'}
                      {index === 3 && '🍕'}
                    </span>
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <div className="chat-welcome__capabilities">
              <div className="chat-welcome__capability">
                <div className="chat-welcome__capability-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                </div>
                <span>Browse the full menu</span>
              </div>
              <div className="chat-welcome__capability">
                <div className="chat-welcome__capability-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <span>Ask about allergens & dietary info</span>
              </div>
              <div className="chat-welcome__capability">
                <div className="chat-welcome__capability-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                </div>
                <span>Add items to your cart naturally</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isUser = message.sender === 'user';
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isGrouped = prevMessage?.sender === message.sender;

              return (
                <div
                  key={message.id}
                  className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--assistant'} ${isGrouped ? 'chat-msg--grouped' : ''}`}
                >
                  {!isUser && !isGrouped && (
                    <div className="chat-msg__avatar chat-msg__avatar--ai">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" />
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                  {!isUser && isGrouped && <div className="chat-msg__avatar-spacer" />}

                  <div className="chat-msg__content">
                    <div className={`chat-msg__bubble ${isUser ? 'chat-msg__bubble--user' : 'chat-msg__bubble--assistant'} ${message.type === 'error' ? 'chat-msg__bubble--error' : ''}`}>
                      {message.text.split('\n').map((line, i, arr) => (
                        <div key={i} className={i < arr.length - 1 ? 'chat-msg__line chat-msg__line--spaced' : 'chat-msg__line'}>
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>

                    <div className={`chat-msg__meta ${isUser ? 'chat-msg__meta--user' : ''}`}>
                      <span className="chat-msg__time">{formatTimestamp(message.timestamp)}</span>
                      {!isUser && (
                        <button
                          className={`chat-msg__copy ${copiedId === message.id ? 'chat-msg__copy--copied' : ''}`}
                          onClick={() => copyMessage(message.text, message.id)}
                          title="Copy message"
                        >
                          {copiedId === message.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && !isGrouped && (
                    <div className="chat-msg__avatar chat-msg__avatar--user">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                  )}
                  {isUser && isGrouped && <div className="chat-msg__avatar-spacer" />}
                </div>
              );
            })}

            {/* Follow-up suggestions */}
            {showFollowUp && (
              <div className="chat-followup">
                {followUpSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="chat-followup__chip"
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="chat-msg chat-msg--assistant">
            <div className="chat-msg__avatar chat-msg__avatar--ai">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="chat-msg__content">
              <div className="chat-msg__bubble chat-msg__bubble--assistant chat-typing">
                <span className="chat-typing__dot"></span>
                <span className="chat-typing__dot"></span>
                <span className="chat-typing__dot"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button className="chat-scroll-btn" onClick={scrollToBottom} aria-label="Scroll to bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Input Area */}
      <div className="chat-input">
        <div className="chat-input__container">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about our menu, place an order..."
            className="chat-input__textarea"
            disabled={loading}
            rows={1}
            maxLength={maxChars}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="chat-input__send"
            aria-label="Send message"
          >
            {loading ? (
              <div className="chat-input__spinner"></div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        {charCount > 0 && (
          <div className={`chat-input__charcount ${charCount > maxChars * 0.9 ? 'chat-input__charcount--warn' : ''}`}>
            {charCount}/{maxChars}
          </div>
        )}
      </div>
    </div>
  );
}
