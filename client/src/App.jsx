import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import GenerateLogPage from './pages/GenerateLogPage';
import AnalyzePage from './pages/AnalyzePage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Navbar from './components/Navbar';
import './App.css';

// ✅ Use env variable instead of hardcoded URL
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [logText, setLogText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedLog, setGeneratedLog] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

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
    setCurrentPage('analyzer');
  };

  const goToGenerateLog = () => {
    setCurrentPage('generateLog');
  };

  const goToAnalytics = () => {
    setCurrentPage('analytics');
  };

  const goToAnalyzeFromGenerate = (log) => {
    setLogText(log);
    setGeneratedLog(log);
    setResult(null);
    setError(null);
    setCurrentPage('analyzer');
  };

  const goToLanding = () => {
    resetForm();
    setCurrentPage('landing');
  };

  return (
    <div className={isDarkMode ? 'app dark-mode' : 'app'}>
      {currentPage === 'landing' && (
        <LandingPage onGetStarted={goToGenerateLog} />
      )}

      {currentPage === 'generateLog' && (
        <div className="generate-log-page">
          <Navbar 
            onBackClick={goToLanding}
            onGenerateLogClick={goToGenerateLog}
            onAnalyzeClick={goToAnalyzer}
            onAnalyticsClick={goToAnalytics}
            currentPage="generateLog"
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
          <GenerateLogPage onNavigateToAnalyze={goToAnalyzeFromGenerate} />
        </div>
      )}

      {currentPage === 'analyzer' && (
        <div className="analyzer-page">
          <Navbar 
            onBackClick={goToLanding}
            onGenerateLogClick={goToGenerateLog}
            onAnalyzeClick={goToAnalyzer}
            onAnalyticsClick={goToAnalytics}
            currentPage="analyzer"
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
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
          <Navbar 
            onBackClick={goToLanding}
            onGenerateLogClick={goToGenerateLog}
            onAnalyzeClick={goToAnalyzer}
            onAnalyticsClick={goToAnalytics}
            currentPage="analytics"
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
          <AnalyticsDashboard />
        </div>
      )}
    </div>
  );
}

export default App;