import React, { useState } from 'react';
import '../styles/GenerateLogPage.css';

const API_URL = 'http://localhost:5004/api';

function GenerateLogPage({ onNavigateToAnalyze }) {
  const [generatedLog, setGeneratedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [delayReasons, setDelayReasons] = useState([]);

  const handleGenerateLog = async () => {
    try {
      setLoading(true);
      setError(null);
      setGeneratedLog(null);
      setDelayReasons([]);

      const response = await fetch(`${API_URL}/generate-log`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate log');
      }

      const data = await response.json();
      setGeneratedLog(data.log);
      setDelayReasons(data.delayReasons || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while generating the log');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeLog = () => {
    if (generatedLog) {
      onNavigateToAnalyze(generatedLog);
    }
  };

  const handleGenerateAnother = () => {
    setGeneratedLog(null);
    setDelayReasons([]);
    setError(null);
  };

  return (
    <main className="generate-log-main">
      <div className="generate-log-container">
        <div className="generate-log-header">
          <h1>Generate Delay Log</h1>
          <p>Generate a random delayed shipment log from our dataset and analyze it</p>
        </div>

        {!generatedLog && !loading && !error && (
          <section className="generate-section">
            <div className="generate-card">
              <div className="generate-icon">📋</div>
              <h2>Ready to Generate?</h2>
              <p>Click the button below to generate a random delayed shipment log from our logistics dataset.</p>
              <button 
                className="btn btn-primary btn-large"
                onClick={handleGenerateLog}
              >
                Generate Log
              </button>
            </div>
          </section>
        )}

        {loading && (
          <section className="loading-section">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Generating delay log...</p>
            </div>
          </section>
        )}

        {generatedLog && !loading && (
          <section className="result-section">
            <div className="log-result-card">
              <div className="log-header">
                <h2>Generated Delay Log</h2>
              </div>
              
              <div className="log-content">
                <div className="log-text-box">
                  <p className="log-text">{generatedLog}</p>
                </div>

                {delayReasons && delayReasons.length > 0 && (
                  <div className="reasons-section">
                    <h3>Detected Delay Reasons:</h3>
                    <ul className="reasons-list">
                      {delayReasons.map((reason, index) => (
                        <li key={index} className="reason-item">
                          <span className="reason-icon">→</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={handleAnalyzeLog}
                >
                  Analyze This Log
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleGenerateAnother}
                >
                  Generate Another
                </button>
              </div>
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="error-section">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h3>Error</h3>
              <p>{error}</p>
              <button
                className="btn btn-secondary"
                onClick={handleGenerateAnother}
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

export default GenerateLogPage;
