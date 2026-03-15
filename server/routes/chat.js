import express from 'express';
import { askAboutLog } from '../services/chatService.js';

const router = express.Router();

/**
 * POST /api/chat/ask
 * Processes user questions about a shipment delay log with full context
 * @body {string} question - User's question about the log
 * @body {string} sessionId - Chat session identifier
 * @body {object} logContext - Complete log data and analysis
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, sessionId, logContext } = req.body;

    // Validate question
    if (!question) {
      return res.status(400).json({ 
        success: false,
        error: 'Question is required',
        code: 'INVALID_INPUT'
      });
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Question cannot be empty or whitespace only',
        code: 'INVALID_INPUT'
      });
    }

    if (trimmedQuestion.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: 'Question exceeds 1000 character limit',
        code: 'INVALID_INPUT'
      });
    }

    // Validate sessionId
    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Session ID is required',
        code: 'INVALID_INPUT'
      });
    }

    // Validate logContext
    if (!logContext || !logContext.logText) {
      return res.status(400).json({ 
        success: false,
        error: 'Log context is required',
        code: 'INVALID_INPUT'
      });
    }

    // Process question with AI service
    const response = await askAboutLog(trimmedQuestion, sessionId, logContext);

    res.json({
      success: true,
      response: response,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    // Determine error type
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let errorMessage = 'Failed to process your question. Please try again later.';

    if (error.message.includes('timeout')) {
      errorCode = 'TIMEOUT';
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message.includes('rate limit')) {
      errorCode = 'RATE_LIMIT';
      statusCode = 429;
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('AI service')) {
      errorCode = 'AI_SERVICE_ERROR';
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      sessionId: req.body.sessionId
    });
  }
});

export default router;
