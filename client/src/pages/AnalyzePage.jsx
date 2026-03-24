import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import '../styles/AnalyzePage.css';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Converts markdown bold (**text**) to React elements with proper phrase wrapping
 * Ensures complete phrases are highlighted, not individual words
 * @param {string} text - Text with markdown bold formatting
 * @returns {Array} Array of React elements
 */
function renderBoldText(text) {
  if (!text) return '';
  
  // Split by markdown bold markers (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    // Check if this part is a markdown bold marker
    if (part.startsWith('**') && part.endsWith('**')) {
      // Extract the content between ** markers
      const content = part.slice(2, -2);
      
      // Return as a single highlight span for the entire phrase
      return (
        <span key={index} className="keyword-tag">
          {content}
        </span>
      );
    }
    
    // Return regular text as-is
    return part;
  });
}

function AnalyzePage({
  logText,
  setLogText,
  result,
  setResult,
  loading,
  setLoading,
  error,
  setError,
  handleSubmit,
  resetForm,
  analyzeDelay,
  generatedLog,
}) {
  const [emailState, setEmailState] = useState({
    email: '',
    loading: false,
    success: false,
    error: null,
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendEmail = async () => {
    // Validate email
    if (!emailState.email.trim()) {
      setEmailState(prev => ({
        ...prev,
        error: 'Email address is required',
      }));
      return;
    }

    if (!validateEmail(emailState.email)) {
      setEmailState(prev => ({
        ...prev,
        error: 'Please enter a valid email address',
      }));
      return;
    }

    // Prepare message
    const fullMessage = `${result.customerMessage.intro}\n\n${result.customerMessage.explanation}\n\n${result.customerMessage.resolution}\n\n${result.customerMessage.closing}`;

    try {
      setEmailState(prev => ({
        ...prev,
        loading: true,
        error: null,
        success: false,
      }));

      const response = await fetch(`${API_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailState.email,
          message: fullMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      await response.json();

      setEmailState(prev => ({
        ...prev,
        loading: false,
        success: true,
        error: null,
        email: '',
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setEmailState(prev => ({
          ...prev,
          success: false,
        }));
      }, 3000);
    } catch (err) {
      console.error('Error sending email:', err);
      setEmailState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to send email. Please try again.',
      }));
    }
  };
  return (
    <main className="analyze-main">
      <div className="analyze-container">
        {/* Page Header */}
        {!loading && !result && !error && (
          <div className="page-header">
            <h1 className="page-title">Analyze Shipment Delay</h1>
            <p className="page-subtitle">Use the generated shipment log to identify delay causes and improvement opportunities</p>
          </div>
        )}

        {!loading && !result && !error && (
          <section className="input-state">
            {/* Input Card */}
            <div className="input-card">
              <div className="card-header">
                <h3 className="card-title">📋 Delay Log Input</h3>
              </div>
              <div className="card-content">
                {generatedLog && (
                  <div className="generated-log-info">
                    <p className="info-text">✓ Using generated log from the dataset</p>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="logText" className="form-label">Enter Delay Log:</label>
                    <textarea
                      id="logText"
                      value={logText}
                      onChange={(e) => setLogText(e.target.value)}
                      rows="10"
                      placeholder="Paste your shipment delay log here..."
                      className="form-textarea"
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="action-btn">
                    Analyze Delay
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <section className="loading-state">
            <div className="loading-card">
              <div className="loading-spinner">
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
              </div>
              <h2 className="loading-title">Analyzing Shipment Delay...</h2>
              <p className="loading-subtitle">Identifying root causes and generating improvement recommendations</p>
            </div>
          </section>
        )}

        {result && !loading && (
          <section className="result-state">
            <div className="page-header">
              <h1 className="page-title">Analysis Results</h1>
              <p className="page-subtitle">Detailed insights and recommendations for your shipment delay</p>
            </div>

            {/* Customer Message Card */}
            <div className="result-card">
              <div className="card-header">
                <h3 className="card-title">💬 Customer Message</h3>
              </div>
              <div className="card-content">
                <div className="message-content">
                  <p className="message-intro">{renderBoldText(result.customerMessage.intro)}</p>
                  <p className="message-body">{renderBoldText(result.customerMessage.explanation)}</p>
                  <p className="message-body">{renderBoldText(result.customerMessage.resolution)}</p>
                  <p className="message-closing">{renderBoldText(result.customerMessage.closing)}</p>
                </div>

                {/* Email Section */}
                <div className="email-section">
                  <div className="email-divider"></div>
                  <h4 className="email-section-title">Send to Customer</h4>
                  
                  {emailState.success && (
                    <div className="email-feedback email-success">
                      <span className="feedback-icon">✓</span>
                      <span className="feedback-text">Email sent successfully!</span>
                    </div>
                  )}

                  {emailState.error && (
                    <div className="email-feedback email-error">
                      <span className="feedback-icon">✕</span>
                      <span className="feedback-text">{emailState.error}</span>
                    </div>
                  )}

                  <div className="email-input-group">
                    <input
                      type="email"
                      className="email-input"
                      placeholder="Enter customer email address"
                      value={emailState.email}
                      onChange={(e) => setEmailState(prev => ({
                        ...prev,
                        email: e.target.value,
                        error: null,
                      }))}
                      disabled={emailState.loading}
                    />
                    <button
                      className={`email-send-btn ${emailState.loading ? 'loading' : ''}`}
                      onClick={handleSendEmail}
                      disabled={emailState.loading}
                    >
                      {emailState.loading ? (
                        <>
                          <span className="btn-spinner"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          
                          Send Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat Interface */}
            <ChatInterface 
              logContext={{
                logText,
                analysis: result.improvementSuggestion,
                customerMessage: result.customerMessage
              }}
              onNewLog={resetForm}
            />

            {/* Root Cause Analysis Card */}
            <div className="result-card">
              <div className="card-header">
                <h3 className="card-title">🔍 Root Cause Analysis</h3>
              </div>
              <div className="card-content">
                <p className="root-cause-text">{renderBoldText(result.improvementSuggestion.rootCause)}</p>
              </div>
            </div>

            {/* Actionable Recommendations Card */}
            <div className="result-card">
              <div className="card-header">
                <h3 className="card-title">✅ Actionable Recommendations</h3>
              </div>
              <div className="card-content">
                <ul className="recommendation-list">
                  {result.improvementSuggestion.actionableSteps.map((step, index) => (
                    <li key={index} className="recommendation-item">
                      <span className="recommendation-bullet">•</span>
                      <span className="recommendation-text">{renderBoldText(step)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Expected Impact Card */}
            <div className="result-card">
              <div className="card-header">
                <h3 className="card-title">📈 Expected Impact</h3>
              </div>
              <div className="card-content">
                <p className="impact-text">{renderBoldText(result.improvementSuggestion.expectedImpact)}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="buttons-row">
              <button
                type="button"
                className="action-btn"
                onClick={resetForm}
              >
                Analyze Another Delay
              </button>
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="error-state">
            <div className="error-card">
              <div className="error-icon">❌</div>
              <h3 className="error-title">Error</h3>
              <p className="error-message">{error}</p>
              <button
                type="button"
                className="action-btn"
                onClick={resetForm}
              >
                Try Again
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default AnalyzePage;
