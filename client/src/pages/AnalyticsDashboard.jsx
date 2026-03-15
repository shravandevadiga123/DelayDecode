import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import '../styles/AnalyticsDashboard.css';

const API_URL = 'http://localhost:5004/api';

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // Refresh analytics every 5 seconds
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data.analytics);
      setLogs(data.logs);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-card">
          <div className="loading-spinner">
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <div className="error-card">
          <div className="error-icon">❌</div>
          <h3>Error Loading Analytics</h3>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="action-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-empty">
        <div className="empty-card">
          <div className="empty-icon">📊</div>
          <h3>No Analytics Data</h3>
          <p>Generate some delay logs first to see analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="analytics-dashboard">
      <div className="dashboard-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Shipment Delay Analytics</h1>
          <p className="page-subtitle">Real-time insights from generated delay logs</p>
        </div>

        {/* Operational Insights Panel */}
        <section className="operational-insights">
          <h2 className="section-title">Operational Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-label">Total Logs Analyzed</div>
              <div className="insight-value">{analytics.totalLogs}</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Average Delay Duration</div>
              <div className="insight-value">{(analytics.averageDelay / 60).toFixed(1)} hrs</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Average Transit Hops</div>
              <div className="insight-value">{analytics.averageHops}</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Non-Metropolitan Delays</div>
              <div className="insight-value">{analytics.nonMetroPercentage}%</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Most Frequent Delay Cause</div>
              <div className="insight-value-text">
                {analytics.mostFrequentCause || 'N/A'}
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Most Common Transit Hops</div>
              <div className="insight-value">{analytics.mostCommonHops || 'N/A'}</div>
            </div>
          </div>
        </section>

      {/* Current Shipment Analysis */}
      {logs.length > 0 && (
        <section className="current-shipment">
          <h2 className="section-title">Current Shipment Analysis</h2>
          <CurrentShipmentMetrics latestLog={logs[logs.length - 1]} />
        </section>
      )}

      {/* Analytics Charts */}
      <section className="analytics-charts">
        <h2 className="section-title">Analytics Charts</h2>
        <div className="charts-grid">
          {/* Delay Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">Delay Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformDelayDistribution(analytics.delayDistribution)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 93, 190, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(20, 93, 190, 0.6)" />
                <YAxis stroke="rgba(20, 93, 190, 0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(20, 93, 190, 0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#145DBE" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Delay Causes Breakdown */}
          <div className="chart-card">
            <h3 className="chart-title">Delay Causes Breakdown</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={transformCauseBreakdown(analytics.causeBreakdown)}
                  cx="45%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {transformCauseBreakdown(analytics.causeBreakdown).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(20, 93, 190, 0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right"
                  layout="vertical"
                  wrapperStyle={{ paddingLeft: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Transit Hops Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">Transit Hops Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformHopsDistribution(logs)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 93, 190, 0.1)" />
                <XAxis dataKey="hops" stroke="rgba(20, 93, 190, 0.6)" />
                <YAxis stroke="rgba(20, 93, 190, 0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(20, 93, 190, 0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Hub Route Flow */}
      {Object.keys(analytics.routeFlows).length > 0 && (
        <section className="route-flow">
          <h2 className="section-title">Hub Route Flow Analysis</h2>
          <div className="route-flow-card">
            <div className="route-flows-list">
              {Object.entries(analytics.routeFlows)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([route, count], index) => {
                  const maxCount = Math.max(...Object.values(analytics.routeFlows));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={index} className="route-flow-item">
                      <div className="route-flow-label">{route}</div>
                      <div className="route-flow-bar">
                        <div 
                          className="route-flow-fill" 
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="route-flow-count">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Recent Delay Logs */}
      <section className="recent-logs">
        <h2 className="section-title">Recent Delay Logs</h2>
        <div className="logs-table-card">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Delay (hrs)</th>
                <th>Hops</th>
                <th>Zone</th>
                <th>Order Type</th>
                <th>SLA</th>
                <th>Reasons</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(-10).reverse().map((log) => (
                <tr key={log.logId}>
                  <td className="log-id">LOG-{log.logId}</td>
                  <td className="delay-value">{Math.abs(log.delay)}</td>
                  <td>{log.hops}</td>
                  <td>
                    <span className={`zone-badge ${log.zone === 'Metropolitan' ? 'metro' : 'non-metro'}`}>
                      {log.zone}
                    </span>
                  </td>
                  <td>{log.orderType}</td>
                  <td>{log.sla}</td>
                  <td>
                    <div className="reasons-tags">
                      {log.reasons.slice(0, 2).map((reason, idx) => (
                        <span key={idx} className="reason-tag">{reason}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </main>
  );
}

/**
 * Current Shipment Metrics Component
 */
function CurrentShipmentMetrics({ latestLog }) {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-label">Delay Duration</div>
        <div className="metric-value">{Math.abs(latestLog.delay/60).toFixed(2)} hrs</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Transit Hops</div>
        <div className="metric-value">{latestLog.hops}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Delivery Zone</div>
        <div className="metric-value-text">{latestLog.zone}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Order Type</div>
        <div className="metric-value-text">{latestLog.orderType}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Service Level Agreement</div>
        <div className="metric-value-text">{latestLog.sla}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Detected Factors</div>
        <div className="metric-factors">
          {latestLog.sunday && <span className="factor-badge">Weekend</span>}
          {latestLog.holiday && <span className="factor-badge">Holiday</span>}
          {latestLog.zone === 'Non-Metropolitan' && <span className="factor-badge">Non-Metro</span>}
        </div>
      </div>
    </div>
  );
}

// Data transformation functions
function transformDelayDistribution(distribution) {
  return [
    { name: '0-1 days', count: distribution['0-1'] || 0 },
    { name: '1-2 days', count: distribution['1-2'] || 0 },
    { name: '2+ days', count: distribution['2+'] || 0 }
  ];
}

function transformCauseBreakdown(causeBreakdown) {
  return Object.entries(causeBreakdown).map(([name, value]) => ({
    name,
    value
  }));
}

// FIXED: Compute zone breakdown with proper string normalization
function computeZoneBreakdown(logs) {
  let metroCount = 0;
  let nonMetroCount = 0;

  logs.forEach(log => {
    const zone = (log.zone || "")
      .toLowerCase()
      .trim()
      .replace("-", " ");
    
    // Check for non-metro first (contains "non")
    if (zone.includes("non")) {
      nonMetroCount++;
    } else if (zone.includes("metro")) {
      metroCount++;
    }
  });

  return [
    { name: "Metropolitan", value: metroCount },
    { name: "Non-Metropolitan", value: nonMetroCount }
  ];
}

function transformZoneBreakdown(zoneBreakdown) {
  return [
    { name: 'Metropolitan', value: zoneBreakdown.Metropolitan || 0 },
    { name: 'Non-Metropolitan', value: zoneBreakdown['Non-Metropolitan'] || 0 }
  ];
}

function transformHopsDistribution(logs) {
  const hopsMap = {};
  logs.forEach(log => {
    hopsMap[log.hops] = (hopsMap[log.hops] || 0) + 1;
  });
  
  return Object.entries(hopsMap)
    .map(([hops, count]) => ({ hops: parseInt(hops), count }))
    .sort((a, b) => a.hops - b.hops);
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const COLORS = ['#145DBE', '#3B82F6', '#22C55E', '#FACC15', '#EF4444', '#8B5CF6'];
const ZONE_COLORS = ['#145DBE', '#FACC15'];

export default AnalyticsDashboard;
