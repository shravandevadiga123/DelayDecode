import React from 'react';
import '../styles/AnalyzePage.css';

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
              </div>
            </div>

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
