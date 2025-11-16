'use client';
import { useEffect, useState } from 'react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! 👋', sender: 'bot' },
    { id: 2, text: 'Welcome to the chat!', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [anonUid, setAnonUid] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function bootstrapSession() {
      try {
        const res = await fetch('/api/chat', { method: 'GET', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (isMounted && data?.uid) {
          setAnonUid(data.uid);
        }
      } catch {
        // ignore bootstrap errors on client
      }
    }
    bootstrapSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user'
    };

    setMessages([...messages, newUserMessage]);

    const num = Number(inputText);
    let botText = '';
    if (Number.isNaN(num)) {
      botText = 'Please enter a valid number.';
    } else {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: num })
        });
        if (!res.ok) {
          botText = `Server error: ${res.status}`;
        } else {
          const data = await res.json().catch(() => ({}));
          if (typeof data?.result === 'number') {
            botText = `Server result: ${data.result}${data.anonCreated ? ' (new session)' : ''}`;
            if (data.uid && !anonUid) {
              setAnonUid(data.uid);
            }
          } else {
            botText = 'Unexpected server response.';
          }
        }
      } catch {
        botText = 'Network error contacting server.';
      }
    }

    const newBotMessage = {
      id: messages.length + 2,
      text: botText,
      sender: 'bot'
    };
    setMessages(prev => [...prev, newBotMessage]);
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Simple Chat 💬</h1>
      <div style={styles.sessionBar}>
        <span style={styles.sessionText}>
          {anonUid ? `Session: ${anonUid}` : 'Starting session...'}
        </span>
      </div>
      
      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.message,
                ...(message.sender === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              {message.text}
            </div>
          ))}
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
  sessionBar: {
    marginTop: '-12px',
    marginBottom: '8px',
    textAlign: 'center'
  },
  sessionText: {
    fontSize: '12px',
    color: '#444'
  }
};