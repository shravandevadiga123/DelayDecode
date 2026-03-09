import express from 'express';
import { explainDelay } from '../services/gemini.js';
import { generateDelayLog } from '../utils/delayLogGenerator.js';
import { analyticsService } from '../services/analyticsService.js';

const router = express.Router();

/**
 * POST /api/explain
 * Accepts a delay log and returns a customer message and improvement suggestion
 * @body {string} logText - The delay log text to explain
 */
router.post('/explain', async (req, res) => {
  try {
    const { logText } = req.body;
    
    if (!logText) {
      return res.status(400).json({ error: 'logText is required' });
    }
    
    const result = await explainDelay(logText);
    
    res.json(result);
  } catch (error) {
    console.error('Error explaining delay:', error);
    res.status(500).json({ error: 'Failed to explain delay' });
  }
});

/**
 * GET /api/generate-log
 * Generates a random delayed shipment log from the dataset
 * @returns {object} { log: string, delayReasons: array }
 */
router.get('/generate-log', async (req, res) => {
  try {
    const result = await generateDelayLog();
    
    // Store log in analytics (prevent duplicates)
    if (result.log && result.delayReasons) {
      analyticsService.addLog(result.log, result.delayReasons);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating delay log:', error);
    res.status(500).json({ error: 'Failed to generate delay log' });
  }
});

/**
 * GET /api/analytics
 * Returns all stored delay logs and computed analytics
 * @returns {object} { logs: array, analytics: object }
 */
router.get('/analytics', (req, res) => {
  try {
    const logs = analyticsService.getAllLogs();
    const analytics = analyticsService.computeAnalytics();
    
    res.json({
      logs,
      analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
