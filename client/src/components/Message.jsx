import React from 'react';
import '../styles/Message.css';

/**
 * Message component - displays a single chat message
 * @param {string} type - 'user' or 'ai'
 * @param {string} content - Message text content
 * @param {Date} timestamp - When the message was created
 * @param {boolean} isLoading - Whether this is a loading message
 */
function Message({ type, content, timestamp, isLoading }) {
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderContent = (text) => {
    if (!text) return '';
    
    // Split by line breaks and render as paragraphs
    return text.split('\n').map((line, idx) => {
      // Check if line is a bullet point
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={idx} className="message-bullet">
            {line}
          </div>
        );
      }
      
      // Regular line
      if (line.trim()) {
        return (
          <p key={idx} className="message-line">
            {line}
          </p>
        );
      }
      
      return null;
    });
  };

  return (
    <div className={`message message-${type}`}>
      <div className="message-content">
        {isLoading ? (
          <div className="message-loading">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-text">AI is thinking...</span>
          </div>
        ) : (
          <div className="message-text">
            {renderContent(content)}
          </div>
        )}
      </div>
      <div className="message-timestamp">
        {formatTime(timestamp)}
      </div>
    </div>
  );
}

export default Message;
