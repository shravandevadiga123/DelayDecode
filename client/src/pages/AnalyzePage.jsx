import React from 'react';
import '../styles/AnalyzePage.css';

/**
 * Converts markdown bold (**text**) to React elements
 * @param {string} text - Text with markdown bold formatting
 * @returns {Array} Array of React elements
 */
function renderBoldText(text) {
  if (!text) return '';
  
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
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
    <main className="analyzer-main">
      {!loading && !result && !error && (
        <section className="input-section">
          <div className="section-container">
            <h2>Analyze Shipment Delay</h2>
            {generatedLog && (
              <div className="generated-log-info">
                <p className="info-text">📋 Using generated log from the dataset</p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="logText">Enter Delay Log:</label>
                <textarea
                  id="logText"
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  rows="8"
                  placeholder="Paste your shipment delay log here..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">
                Analyze Delay
              </button>
            </form>
          </div>
        </section>
      )}

      {loading && (
        <section className="loading-section">
          <div className="section-container loading-container">
            <div className="spinner"></div>
            <p>Analyzing your delay...</p>
          </div>
        </section>
      )}

      {result && !loading && (
        <section className="result-section">
          <div className="section-container">
            <h2>Analysis Results</h2>

            <div className="result-card customer-card">
              <div className="card-header">
                <h3>Customer Message</h3>
              </div>
              <div className="customer-message-content">
                <p className="message-intro">{renderBoldText(result.customerMessage.intro)}</p>
                <p className="message-body">{renderBoldText(result.customerMessage.explanation)}</p>
                <p className="message-body">{renderBoldText(result.customerMessage.resolution)}</p>
                <p className="message-closing">{renderBoldText(result.customerMessage.closing)}</p>
              </div>
            </div>

            <div className="result-card improvement-card">
              <div className="card-header">
                <h3>Improvement Suggestion</h3>
              </div>
              <div className="improvement-content">
                <div className="improvement-section">
                  <h4>Root Cause :</h4>
                  <p className="root-cause-text">{renderBoldText(result.improvementSuggestion.rootCause)}</p>
                </div>

                <div className="improvement-section">
                  <h4>Actionable Steps :</h4>
                  <ul className="actionable-steps">
                    {result.improvementSuggestion.actionableSteps.map((step, index) => (
                      <li key={index}>{renderBoldText(step)}</li>
                    ))}
                  </ul>
                </div>

                <div className="improvement-section">
                  <h4>Expected Impact :</h4>
                  <p className="impact-text">{renderBoldText(result.improvementSuggestion.expectedImpact)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Analyze Another Delay
            </button>
          </div>
        </section>
      )}

      {error && !loading && (
        <section className="error-section">
          <div className="section-container error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error</h3>
            <p id="errorMessage">{error}</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Try Again
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default AnalyzePage;
