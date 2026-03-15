import React, { useState } from 'react';
import '../styles/MessageInput.css';

/**
 * MessageInput component - handles user input for chat
 * @param {string} value - Current input value
 * @param {function} onChange - Called when input changes
 * @param {function} onSubmit - Called when user submits message
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} error - Error message to display
 */
function MessageInput({ value, onChange, onSubmit, disabled, error }) {
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 1000;

  const handleChange = (e) => {
    const text = e.target.value;
    setCharCount(text.length);
    onChange(text);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    if (!value.trim()) {
      return;
    }
    
    if (value.length > MAX_CHARS) {
      return;
    }
    
    onSubmit(value);
  };

  const handleKeyPress = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const isValid = value.trim().length > 0 && value.length <= MAX_CHARS;
  const isNearLimit = charCount > 900;

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <textarea
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this delay log... (Ctrl+Enter to send)"
            className="message-textarea"
            disabled={disabled}
            rows="3"
          />
          <button
            type="submit"
            className={`send-button ${disabled ? 'disabled' : ''}`}
            disabled={disabled || !isValid}
          >
            {disabled ? (
              <>
                <span className="button-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <span className="button-icon">📤</span>
                Send
              </>
            )}
          </button>
        </div>

        <div className="input-footer">
          <div className="char-count">
            <span className={isNearLimit ? 'near-limit' : ''}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
          
          {error && (
            <div className="input-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          {charCount > MAX_CHARS && (
            <div className="input-error">
              <span className="error-icon">❌</span>
              Question exceeds {MAX_CHARS} character limit
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default MessageInput;
