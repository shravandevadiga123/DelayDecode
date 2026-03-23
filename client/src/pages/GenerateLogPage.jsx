import React, { useState, useEffect } from 'react';
import '../styles/GenerateLogPage.css';

const API_URL = import.meta.env.VITE_API_URL;

const LoadingAnimation = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    'Scanning logistics dataset...',
    'Simulating shipment route...',
    'Analyzing delay factors...',
    'Constructing structured log...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-loading-container">
      <div className="ai-loading-content">
        <h2 className="ai-loading-title">Generating Shipment Scenario...</h2>
        
        <div className="ai-loading-animation">
          <div className="ai-spinner">
            <div className="ai-spinner-dot"></div>
            <div className="ai-spinner-dot"></div>
            <div className="ai-spinner-dot"></div>
          </div>
        </div>

        <p className="ai-loading-status">{statuses[statusIndex]}</p>
        
        <div className="ai-progress-bar">
          <div className="ai-progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

function GenerateLogPage({ onNavigateToAnalyze }) {
  const [generatedLog, setGeneratedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [delayReasons, setDelayReasons] = useState([]);
  const [logMetadata, setLogMetadata] = useState(null);

  const handleGenerateLog = async () => {
    try {
      setLoading(true);
      setError(null);
      setGeneratedLog(null);
      setDelayReasons([]);
      setLogMetadata(null);

      // Simulate loading animation for 1.8 seconds
      await new Promise(resolve => setTimeout(resolve, 1800));

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
      
      // Parse log metadata from the log text
      const metadata = parseLogMetadata(data.log);
      setLogMetadata(metadata);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while generating the log');
    } finally {
      setLoading(false);
    }
  };

  const parseLogMetadata = (logText) => {
    // Extract metadata from log text
    const lines = logText.split('\n');
    const metadata = {
      logId: 'LOG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      route: 'Route Unknown',
      delayDuration: 'On Time',
      plannedTimeMinutes: null,
      actualTimeMinutes: null,
      plannedTime: 'N/A',
      actualTime: 'N/A',
      origin: 'N/A',
      destination: 'N/A',
      transitHops: 0,
    };

    lines.forEach(line => {
      // Parse Route
      if (line.includes('Route:')) {
        metadata.route = line.split('Route:')[1]?.trim() || metadata.route;
      }
      
      // Parse Planned Delivery Time
      if (line.includes('Planned Delivery Time:') || line.includes('Planned:')) {
        const plannedValue = line.split(':')[1]?.trim();
        metadata.plannedTime = plannedValue;
        
        // Extract numeric value - remove any non-numeric characters except decimal point
        const plannedNumeric = plannedValue?.replace(/[^\d.]/g, '');
        const plannedMinutes = Number(plannedNumeric);
        
        if (!isNaN(plannedMinutes) && plannedMinutes > 0) {
          metadata.plannedTimeMinutes = plannedMinutes;
        }
      }
      
      // Parse Actual Delivery Time
      if (line.includes('Actual Delivery Time:') || line.includes('Actual:')) {
        const actualValue = line.split(':')[1]?.trim();
        metadata.actualTime = actualValue;
        
        // Extract numeric value - remove any non-numeric characters except decimal point
        const actualNumeric = actualValue?.replace(/[^\d.]/g, '');
        const actualMinutes = Number(actualNumeric);
        
        if (!isNaN(actualMinutes) && actualMinutes > 0) {
          metadata.actualTimeMinutes = actualMinutes;
        }
      }
      
      // Parse Origin
      if (line.includes('Origin:')) {
        metadata.origin = line.split('Origin:')[1]?.trim() || metadata.origin;
      }
      
      // Parse Destination
      if (line.includes('Destination:')) {
        metadata.destination = line.split('Destination:')[1]?.trim() || metadata.destination;
      }
    });

    // Calculate delay duration from raw timing values
    // IMPORTANT: delayMinutes = actualDeliveryTime - plannedDeliveryTime
    if (metadata.plannedTimeMinutes !== null && metadata.actualTimeMinutes !== null) {
      const delayMinutes = metadata.actualTimeMinutes - metadata.plannedTimeMinutes;
      metadata.delayDuration = formatDelayDuration(delayMinutes);
    }

    return metadata;
  };

  const formatDelayDuration = (delayMinutes) => {
    // Ensure delayMinutes is a number and handle edge cases
    const delay = Number(delayMinutes);
    
    // If delay is 0 or negative, shipment is on time
    if (delay <= 0) {
      return 'On Time';
    }
    
    // Convert minutes to hours and remaining minutes
    const hours = Math.floor(delay / 60);
    const minutes = Math.round(delay % 60);
    
    // Format based on values
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
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
    setLogMetadata(null);
  };

  const sampleLogStructure = `[2024-01-15 08:30:00] SHIPMENT_CREATED
Shipment ID: SHP-2024-001234
Origin: Hub H700 | Destination: Hub H299
[2024-01-15 14:22:00] IN_TRANSIT
Status: Delayed | Delay: 4h 30m`;

  return (
    <main className="generate-log-main">
      <div className="generate-log-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Generate Delay Log</h1>
          <p className="page-subtitle">Generate a realistic delayed shipment log from our logistics dataset</p>
        </div>

        {!generatedLog && !loading && !error && (
          <section className="input-state">
            {/* Hero Panel */}
            <div className="hero-panel">
              <h2 className="hero-title">Ready to Generate?</h2>
              <p className="hero-description">Create a realistic delayed shipment scenario from our logistics dataset and analyze the delay factors.</p>
              
              {/* Features Grid */}
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">📝</div>
                  <div className="feature-text">
                    <h4>Log Simulation</h4>
                    <p>Generates a random delayed shipment event from the dataset</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📋</div>
                  <div className="feature-text">
                    <h4>Structured Format</h4>
                    <p>Creates realistic logistics log entries</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">⚠️</div>
                  <div className="feature-text">
                    <h4>Delay Scenario</h4>
                    <p>Simulates common delay conditions in shipments</p>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button 
                className="btn-generate-primary"
                onClick={handleGenerateLog}
              >
                Generate Log
              </button>
            </div>

            {/* Sample Log Structure */}
            <div className="sample-section">
              <h3 className="sample-title">Sample Log Format</h3>
              <p className="sample-description">Example of a generated log entry:</p>
              <div className="sample-log-box">
                <pre className="sample-log-text">{sampleLogStructure}</pre>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <section className="loading-section">
            <LoadingAnimation />
          </section>
        )}

        {generatedLog && !loading && (
          <section className="result-state">
            {/* Log Summary Bar */}
            <div className="log-summary-bar">
              <div className="summary-item">
                <span className="summary-label">Log ID</span>
                <span className="summary-value">{logMetadata?.logId}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item">
                <span className="summary-label">Status</span>
                <span className="status-badge status-delayed">Delayed</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item">
                <span className="summary-label">Route</span>
                <span className="summary-value">{logMetadata?.route}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item">
                <span className="summary-label">Delay Duration</span>
                <span className={`summary-value ${logMetadata?.delayDuration === 'On Time' ? 'on-time' : 'delay-highlight'}`}>
                  {logMetadata?.delayDuration}
                </span>
              </div>
            </div>

            {/* Delivery Timing Card */}
            {(logMetadata?.plannedTime !== 'N/A' || logMetadata?.actualTime !== 'N/A' || logMetadata?.delayDuration !== 'On Time') && (
              <div className="result-card">
                <div className="card-header">
                  <h3 className="card-title">⏱️ Delivery Timing</h3>
                </div>
                <div className="card-content">
                  <div className="metrics-grid">
                    {logMetadata?.plannedTime && logMetadata?.plannedTime !== 'N/A' && (
                      <div className="metric-box">
                        <span className="metric-label">Planned Delivery (min)</span>
                        <span className="metric-value">{logMetadata.plannedTime}</span>
                      </div>
                    )}
                    {logMetadata?.actualTime && logMetadata?.actualTime !== 'N/A' && (
                      <div className="metric-box">
                        <span className="metric-label">Actual Delivery (min)</span>
                        <span className="metric-value">{logMetadata.actualTime}</span>
                      </div>
                    )}
                    {logMetadata?.delayDuration && logMetadata?.delayDuration !== 'On Time' && (
                      <div className="metric-box highlight">
                        <span className="metric-label">Delay Duration</span>
                        <span className="metric-value">{logMetadata.delayDuration}</span>
                      </div>
                    )}
                    {logMetadata?.delayDuration === 'On Time' && (
                      <div className="metric-box on-time">
                        <span className="metric-label">Status</span>
                        <span className="metric-value">{logMetadata.delayDuration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detected Delay Reasons */}
            {delayReasons && delayReasons.length > 0 && (
              <div className="reasons-container">
                <div className="reasons-header">
                  <h3 className="reasons-title">⚡ Detected Delay Reasons</h3>
                  <span className="reasons-count">{delayReasons.length} factors identified</span>
                </div>
                <div className="reasons-grid">
                  {delayReasons.map((reason, index) => (
                    <div key={index} className="reason-card">
                      <div className="reason-icon-wrapper">
                        <span className="reason-icon">⚠️</span>
                      </div>
                      <div className="reason-content">
                        <p className="reason-text">{reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Log Details - Collapsible */}
            <details className="raw-log-details">
              <summary className="raw-log-summary">
                <span className="raw-log-icon">📄</span>
                <span className="raw-log-title">View Raw Log</span>
                <span className="raw-log-toggle">▼</span>
              </summary>
              <div className="raw-log-content">
                <div className="raw-log-note">
                  <p className="raw-log-note-text">
                    <strong>Note:</strong> Delivery times are measured in <strong>minutes</strong>. 
                    Delay duration is calculated as: Actual Delivery Time - Planned Delivery Time.
                  </p>
                </div>
                <div className="log-text-box">
                  <pre className="log-text">{generatedLog}</pre>
                </div>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="buttons-row">
              <button 
                className="action-btn"
                onClick={handleAnalyzeLog}
              >
                Analyze This Log
              </button>
              <button 
                className="action-btn"
                onClick={handleGenerateAnother}
              >
                Generate Another
              </button>
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="error-section">
            <div className="error-container">
              <div className="error-icon">❌</div>
              <h3 className="error-title">Error</h3>
              <p className="error-message">{error}</p>
              <button
                className="btn-action btn-secondary"
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
