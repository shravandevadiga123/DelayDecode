/**
 * Analytics Service - Stores and analyzes shipment delay logs
 * Maintains in-memory storage with duplicate prevention
 */

class AnalyticsService {
  constructor() {
    this.generatedLogs = [];
    this.logIds = new Set();
  }

  /**
   * Extracts route transitions from route string
   * Example: "H700 → H561 → H882" becomes [["H700", "H561"], ["H561", "H882"]]
   * @param {string} route - Route string with hubs
   * @returns {Array} Array of [from, to] transitions
   */
  extractRouteTransitions(route) {
    if (!route || route === 'Unknown Route') return [];
    
    const hubs = route.split(' → ').map(h => h.trim());
    const transitions = [];
    
    for (let i = 0; i < hubs.length - 1; i++) {
      transitions.push([hubs[i], hubs[i + 1]]);
    }
    
    return transitions;
  }

  /**
   * Parses delay log to extract structured data
   * @param {string} logText - Full delay log text
   * @param {Array} delayReasons - Array of delay reasons
   * @returns {Object} Structured log data
   */
  parseLogData(logText, delayReasons = []) {
    const logIdMatch = logText.match(/LOG-(\d+)/);
    const logId = logIdMatch ? logIdMatch[1] : null;

    // Extract delay duration
    const delayMatch = logText.match(/Delay Duration:\s*(-?\d+)\s*time units/);
    const delay = delayMatch ? parseInt(delayMatch[1], 10) : 0;

    // Extract transit hops
    const hopsMatch = logText.match(/Transit Hops:\s*(\d+)/);
    const hops = hopsMatch ? parseInt(hopsMatch[1], 10) : 0;

    // Extract delivery zone
    const zoneMatch = logText.match(/Delivery Zone:\s*(Metropolitan|Non-Metropolitan)/);
    const zone = zoneMatch ? zoneMatch[1] : 'Unknown';

    // Extract route
    const routeMatch = logText.match(/Route:\s*(.+?)(?:\n|$)/);
    const route = routeMatch ? routeMatch[1].trim() : 'Unknown Route';

    // Extract shipment weight
    const weightMatch = logText.match(/Shipment Weight:\s*(\d+)\s*kg/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : 0;

    // Extract order type
    const orderTypeMatch = logText.match(/Order Type:\s*(Prepaid|Cash on Delivery)/);
    const orderType = orderTypeMatch ? orderTypeMatch[1] : 'Unknown';

    // Extract SLA
    const slaMatch = logText.match(/Service Level Agreement \(SLA\):\s*(\w+)/);
    const sla = slaMatch ? slaMatch[1] : 'Unknown';

    // Extract weekend/holiday flags
    const sundayMatch = logText.match(/Sunday In Between:\s*(Yes|No)/);
    const sunday = sundayMatch ? sundayMatch[1] === 'Yes' : false;

    const holidayMatch = logText.match(/Holiday In Between:\s*(Yes|No)/);
    const holiday = holidayMatch ? holidayMatch[1] === 'Yes' : false;

    return {
      logId,
      delay,
      hops,
      zone,
      route,
      weight,
      orderType,
      sla,
      sunday,
      holiday,
      reasons: delayReasons,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Adds a new log to storage if not duplicate
   * @param {string} logText - Full delay log text
   * @param {Array} delayReasons - Array of delay reasons
   * @returns {Object} Parsed log data or null if duplicate
   */
  addLog(logText, delayReasons = []) {
    const logData = this.parseLogData(logText, delayReasons);
    
    if (!logData.logId) {
      console.warn('Could not extract log ID');
      return null;
    }

    // Check for duplicate
    if (this.logIds.has(logData.logId)) {
      console.log(`Duplicate log detected: LOG-${logData.logId}`);
      return null;
    }

    // Add to storage
    this.logIds.add(logData.logId);
    this.generatedLogs.push(logData);

    return logData;
  }

  /**
   * Gets all stored logs
   * @returns {Array} Array of all stored logs
   */
  getAllLogs() {
    return this.generatedLogs;
  }

  /**
   * Gets the latest log
   * @returns {Object} Latest log or null
   */
  getLatestLog() {
    return this.generatedLogs.length > 0 
      ? this.generatedLogs[this.generatedLogs.length - 1] 
      : null;
  }

  /**
   * Computes analytics from all stored logs
   * @returns {Object} Analytics summary
   */
  computeAnalytics() {
    if (this.generatedLogs.length === 0) {
      return {
        totalLogs: 0,
        averageDelay: 0,
        averageHops: 0,
        nonMetroPercentage: 0,
        mostFrequentCause: null,
        mostCommonHops: null,
        delayDistribution: { '0-1': 0, '1-2': 0, '2+': 0 },
        causeBreakdown: {},
        routeFlows: {},
        zoneBreakdown: { Metropolitan: 0, 'Non-Metropolitan': 0 }
      };
    }

    const logs = this.generatedLogs;
    let totalDelay = 0;
    let totalHops = 0;
    let nonMetroCount = 0;
    const causeFrequency = {};
    const hopFrequency = {};
    const delayDistribution = { '0-1': 0, '1-2': 0, '2+': 0 };
    const routeFlows = {};
    const zoneBreakdown = { Metropolitan: 0, 'Non-Metropolitan': 0 };

    logs.forEach(log => {
      // Delay stats
      totalDelay += Math.abs(log.delay);
      
      // Hops stats
      totalHops += log.hops;
      hopFrequency[log.hops] = (hopFrequency[log.hops] || 0) + 1;

      // Zone stats
      if (log.zone === 'Non-Metropolitan') {
        nonMetroCount++;
      }
      zoneBreakdown[log.zone] = (zoneBreakdown[log.zone] || 0) + 1;

      // Delay distribution (in days, assuming time units are hours)
      const delayDays = Math.abs(log.delay) / 24;
      if (delayDays < 1) {
        delayDistribution['0-1']++;
      } else if (delayDays < 2) {
        delayDistribution['1-2']++;
      } else {
        delayDistribution['2+']++;
      }

      // Cause frequency
      if (log.reasons && log.reasons.length > 0) {
        log.reasons.forEach(reason => {
          causeFrequency[reason] = (causeFrequency[reason] || 0) + 1;
        });
      }

      // Route flows
      const transitions = this.extractRouteTransitions(log.route);
      transitions.forEach(([from, to]) => {
        const key = `${from} → ${to}`;
        routeFlows[key] = (routeFlows[key] || 0) + 1;
      });
    });

    // Find most frequent cause
    let mostFrequentCause = null;
    let maxCauseFreq = 0;
    Object.entries(causeFrequency).forEach(([cause, freq]) => {
      if (freq > maxCauseFreq) {
        maxCauseFreq = freq;
        mostFrequentCause = cause;
      }
    });

    // Find most common hops
    let mostCommonHops = null;
    let maxHopFreq = 0;
    Object.entries(hopFrequency).forEach(([hops, freq]) => {
      if (freq > maxHopFreq) {
        maxHopFreq = freq;
        mostCommonHops = parseInt(hops, 10);
      }
    });

    return {
      totalLogs: logs.length,
      averageDelay: Math.round(totalDelay / logs.length),
      averageHops: (totalHops / logs.length).toFixed(2),
      nonMetroPercentage: Math.round((nonMetroCount / logs.length) * 100),
      mostFrequentCause,
      mostCommonHops,
      delayDistribution,
      causeBreakdown: causeFrequency,
      routeFlows,
      zoneBreakdown
    };
  }

  /**
   * Clears all stored logs (for testing)
   */
  clearLogs() {
    this.generatedLogs = [];
    this.logIds.clear();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
