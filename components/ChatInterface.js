'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase-client';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up Firestore listener for real-time updates
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    async function setupFirestoreListener() {
      try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          
          const messagesList = snapshot.docs.map(doc => ({
            id: doc.id,
            text: doc.data().text || '',
            sender: doc.data().sender || 'user',
            timestamp: doc.data().timestamp
          }));
          
          setMessages(messagesList);
          setLoading(false);
        }, (error) => {
          console.error('Firestore listener error:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up Firestore listener:', error);
        setLoading(false);
      }
    }

    setupFirestoreListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    // Save message directly to Firestore from client
    // The Firestore listener will automatically update the UI
    try {
      const messagesRef = collection(db, 'messages');
      
      await addDoc(messagesRef, {
        country: "india",
        text: messageText,
        sender: 'user',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error to user
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Simple Chat 💬</h1>
      
      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {loading ? (
            <div style={styles.loadingText}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={styles.loadingText}>No messages yet. Start chatting!</div>
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
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={styles.input}
          />
          <button onClick={handleSendMessage} style={styles.button}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    textAlign: 'center',
    color: 'black',
    marginBottom: '30px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #ddd',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    backgroundColor: '#5f5a5aff',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  message: {
    padding: '12px 16px',
    borderRadius: '15px',
    maxWidth: '70%',
    wordWrap: 'break-word'
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '5px'
  },
  botMessage: {
    backgroundColor: '#e9ecef',
    color: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '5px'
  },
  inputContainer: {
    display: 'flex',
    padding: '20px',
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    fontSize: '16px',
    outline: 'none'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontStyle: 'italic'
  }
};