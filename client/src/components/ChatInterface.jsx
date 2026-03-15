import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Message from './Message';
import MessageInput from './MessageInput';
import '../styles/ChatInterface.css';

const API_URL = 'http://localhost:5004/api/chat';

/**
 * ChatInterface component - main chat interface for asking questions about logs
 * @param {object} logContext - Complete log data and analysis
 * @param {function} onNewLog - Callback when user generates new log
 */
function ChatInterface({ logContext, onNewLog }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(uuidv4());
  const messagesEndRef = useRef(null);

  // Reset chat when new log is generated
  useEffect(() => {
    if (onNewLog) {
      const handleNewLog = () => {
        setMessages([]);
        setInputValue('');
        setError(null);
      };
      
      // This will be called from parent when new log is generated
      window.addEventListener(`newLog-${sessionId}`, handleNewLog);
      return () => window.removeEventListener(`newLog-${sessionId}`, handleNewLog);
    }
  }, [sessionId, onNewLog]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (question) => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (question.length > 1000) {
      setError('Question exceeds 1000 character limit');
      return;
    }

    try {
      setError(null);
      
      // Add user message immediately
      const userMessage = {
        id: uuidv4(),
        type: 'user',
        content: question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // Show loading state
      setLoading(true);

      // Send to backend
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: question.trim(),
          sessionId,
          logContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add AI response
      const aiMessage = {
        id: uuidv4(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        id: uuidv4(),
        type: 'ai',
        content: `❌ Error: ${err.message || 'Failed to process your question. Please try again.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (text) => {
    setInputValue(text);
    setError(null);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3 className="chat-title">💬 Ask About This Delay</h3>
        <p className="chat-subtitle">Ask questions about the shipment delay and analysis</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="empty-icon">💭</p>
            <p className="empty-text">No questions yet. Ask something about this delay!</p>
          </div>
        )}
        
        {messages.map(msg => (
          <Message
            key={msg.id}
            type={msg.type}
            content={msg.content}
            timestamp={msg.timestamp}
            isLoading={false}
          />
        ))}
        
        {loading && (
          <Message
            type="ai"
            content=""
            timestamp={new Date()}
            isLoading={true}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        disabled={loading}
        error={error}
      />
    </div>
  );
}

export default ChatInterface;
