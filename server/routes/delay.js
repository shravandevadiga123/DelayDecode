import express from 'express';
import { explainDelay } from '../services/gemini.js';
import { generateDelayLog } from '../utils/delayLogGenerator.js';
import { analyticsService } from '../services/analyticsService.js';
import emailService from '../services/emailService.js';

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

/**
 * POST /api/send-email
 * Sends the delay message to a customer email (non-blocking)
 * @body {string} email - Customer email address
 * @body {string} message - Delay message to send
 * @body {string} trackingNumber - Optional shipment tracking number
 */
router.post('/send-email', async (req, res) => {
  try {
    const { email, message, trackingNumber } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate message
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long (max 5000 characters)' });
    }

    // Check if email service is initialized
    if (!emailService.initialized) {
      return res.status(500).json({ error: 'Email service is not available. Please check server configuration.' });
    }

    // Send email asynchronously (non-blocking) - fire and forget
    emailService.sendEmail(email, message, trackingNumber)
      .then(result => {
        console.log('✓ Email sent successfully:', result.messageId);
      })
      .catch(error => {
        console.error('❌ Error sending email:', error.message);
      });

    // Return immediately without waiting for email to send
    res.json({ 
      success: true, 
      message: 'Email is being sent...' 
    });
  } catch (error) {
    console.error('Error processing email request:', error);
    res.status(500).json({ error: 'Failed to process email request. Please try again later.' });
  }
});

export default router;
