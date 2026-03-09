import React from 'react';
import './Navbar.css';
import DDLogo from '../assets/DDLogo.png';

function Navbar({ onBackClick, onGenerateLogClick, onAnalyticsClick, currentPage }) {
  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-left">
          <img 
            src={DDLogo} 
            alt="DD Logo" 
            className="navbar-logo" 
            onClick={onBackClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div className="navbar-right">
          <button 
            className={`nav-link ${currentPage === 'generateLog' ? 'active' : ''}`}
            onClick={onGenerateLogClick}
          >
            Generate Log
          </button>
          <button 
            className={`nav-link ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={onAnalyticsClick}
          >
            Analytics
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
