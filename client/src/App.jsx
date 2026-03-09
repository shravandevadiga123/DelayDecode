import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import GenerateLogPage from './pages/GenerateLogPage';
import AnalyzePage from './pages/AnalyzePage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Navbar from './components/Navbar';
import './App.css';

const API_URL = 'http://localhost:5004/api';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [logText, setLogText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedLog, setGeneratedLog] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedText = logText.trim();
    if (!trimmedText) {
      setError('Please enter a delay log');
      return;
    }

    await analyzeDelay(trimmedText);
  };

  const analyzeDelay = async (text) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch(`${API_URL}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logText: text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze delay');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while analyzing the delay');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLogText('');
    setResult(null);
    setError(null);
  };

  const goToAnalyzer = () => {
    resetForm();
    setCurrentPage('analyzer');
  };

  const goToGenerateLog = () => {
    resetForm();
    setCurrentPage('generateLog');
  };

  const goToAnalytics = () => {
    resetForm();
    setCurrentPage('analytics');
  };

  const goToAnalyzeFromGenerate = (log) => {
    setLogText(log);
    setGeneratedLog(log);
    setCurrentPage('analyzer');
  };

  const goToLanding = () => {
    resetForm();
    setCurrentPage('landing');
  };

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage onGetStarted={goToAnalyzer} />
      )}

      {currentPage === 'generateLog' && (
        <div className="generate-log-page">
          <Navbar onBackClick={goToLanding} onGenerateLogClick={goToGenerateLog} onAnalyticsClick={goToAnalytics} currentPage="generateLog" />
          <GenerateLogPage onNavigateToAnalyze={goToAnalyzeFromGenerate} />
        </div>
      )}

      {currentPage === 'analyzer' && (
        <div className="analyzer-page">
          <Navbar onBackClick={goToLanding} onGenerateLogClick={goToGenerateLog} onAnalyticsClick={goToAnalytics} currentPage="analyzer" />
          <AnalyzePage 
            logText={logText}
            setLogText={setLogText}
            result={result}
            setResult={setResult}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
            handleSubmit={handleSubmit}
            resetForm={resetForm}
            analyzeDelay={analyzeDelay}
            generatedLog={generatedLog}
          />
        </div>
      )}

      {currentPage === 'analytics' && (
        <div className="analytics-page">
          <Navbar onBackClick={goToLanding} onGenerateLogClick={goToGenerateLog} onAnalyticsClick={goToAnalytics} currentPage="analytics" />
          <AnalyticsDashboard />
        </div>
      )}
    </>
  );
}

export default App;
