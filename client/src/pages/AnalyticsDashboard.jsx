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
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>Error: {error}</p>
        <button onClick={fetchAnalytics} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-empty">
        <p>No analytics data available. Generate some delay logs first!</p>
      </div>
    );
  }

  return (
    <main className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Shipment Delay Analytics Dashboard</h1>
        <p>Real-time insights from generated delay logs</p>
      </div>

      {/* Operational Insights Panel */}
      <section className="operational-insights">
        <h2>Operational Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-label">Total Logs Analyzed</div>
            <div className="insight-value">{analytics.totalLogs}</div>
          </div>
          <div className="insight-card">
            <div className="insight-label">Average Delay Duration</div>
            <div className="insight-value">{analytics.averageDelay} hrs</div>
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
          <h2>Current Shipment Analysis</h2>
          <CurrentShipmentMetrics latestLog={logs[logs.length - 1]} />
        </section>
      )}

      {/* Analytics Charts */}
      <section className="analytics-charts">
        <h2>Analytics Charts</h2>
        <div className="charts-grid">
          {/* Delay Distribution */}
          <div className="chart-container">
            <h3>Delay Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformDelayDistribution(analytics.delayDistribution)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#145DBE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Delay Causes Breakdown */}
          <div className="chart-container">
            <h3>Delay Causes Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transformCauseBreakdown(analytics.causeBreakdown)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {transformCauseBreakdown(analytics.causeBreakdown).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Metro vs Non-Metro Delays */}
          <div className="chart-container">
            <h3>Metro vs Non-Metro Delays</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transformZoneBreakdown(analytics.zoneBreakdown)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {transformZoneBreakdown(analytics.zoneBreakdown).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ZONE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Transit Hops Distribution */}
          <div className="chart-container">
            <h3>Transit Hops Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformHopsDistribution(logs)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hops" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#28a745" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Hub Route Flow */}
      {Object.keys(analytics.routeFlows).length > 0 && (
        <section className="route-flow">
          <h2>Hub Route Flow Analysis</h2>
          <div className="route-flow-container">
            <div className="route-flows-list">
              {Object.entries(analytics.routeFlows)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([route, count], index) => (
                  <div key={index} className="route-flow-item">
                    <div className="route-flow-label">{route}</div>
                    <div className="route-flow-bar">
                      <div 
                        className="route-flow-fill" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.routeFlows))) * 100}%` 
                        }}
                      >
                        <span className="route-flow-count">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Delay Logs */}
      <section className="recent-logs">
        <h2>Recent Delay Logs</h2>
        <div className="logs-table">
          <table>
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
                  <td>LOG-{log.logId}</td>
                  <td>{Math.abs(log.delay)}</td>
                  <td>{log.hops}</td>
                  <td>{log.zone}</td>
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
        <div className="metric-value">{Math.abs(latestLog.delay)} hrs</div>
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

const COLORS = ['#145DBE', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'];
const ZONE_COLORS = ['#145DBE', '#ffc107'];

export default AnalyticsDashboard;
