import React from 'react';
import '../styles/LandingPage.css';
import logo from '../assets/logo.png';

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page-container">
      {/* Left Section - Content (60%) */}
      <div className="landing-left">
        <div className="content-wrapper">
          <h1 className="main-title">Manage Your Delays<br />The Smart Way</h1>
          <p className="description">
            Our advanced AI-powered tool helps you analyze shipment delays, generate customer-friendly messages, and get actionable improvement suggestions to optimize your logistics operations.
          </p>
          <button className="get-started-btn" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </div>

      {/* Right Section - Logo Placeholder (40%) */}
      <div className="landing-right">
        <div className="logo-placeholder">
          <img src={logo} alt="Delay Tool Logo" />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
