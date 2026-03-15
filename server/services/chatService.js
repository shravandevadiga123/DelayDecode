import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// API key rotation setup (same as gemini service)
const API_KEYS = [
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_API_KEY_BACKUP
].filter(key => key);

let currentKeyIndex = 0;

/**
 * Gets the next API key in rotation
 * @returns {string} API key
 */
function getNextApiKey() {
  if (API_KEYS.length === 0) {
    throw new Error('No API keys configured');
  }
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

/**
 * Creates OpenAI client with rotated API key
 * @returns {OpenAI} OpenAI client instance
 */
function createClient() {
  const apiKey = getNextApiKey();
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_API_BASE_URL
  });
}

/**
 * Builds a prompt that includes full log context for the AI to answer questions
 * @param {string} question - User's question
 * @param {object} logContext - Complete log data and analysis
 * @returns {string} Formatted prompt with context
 */
function buildContextualPrompt(question, logContext) {
  const { logText, analysis, customerMessage } = logContext;

  return `You are a logistics operations expert helping users understand shipment delay logs and analysis.

You have access to the following shipment delay log and analysis:

=== SHIPMENT DELAY LOG ===
${logText}

=== AI ANALYSIS ===
Root Cause: ${analysis?.rootCause || 'Not analyzed'}

Actionable Steps:
${analysis?.actionableSteps?.map((step, i) => `${i + 1}. ${step}`).join('\n') || 'No steps provided'}

Expected Impact: ${analysis?.expectedImpact || 'Not analyzed'}

=== CUSTOMER MESSAGE ===
${customerMessage?.intro || ''}
${customerMessage?.explanation || ''}
${customerMessage?.resolution || ''}
${customerMessage?.closing || ''}

=== USER QUESTION ===
${question}

Please answer the user's question based on the shipment delay log and analysis provided above. Be concise, clear, and reference specific details from the log when relevant. Use simple language that a logistics professional would understand.`;
}

/**
 * Processes a user question about a shipment delay log using AI
 * @param {string} question - User's question
 * @param {string} sessionId - Chat session identifier
 * @param {object} logContext - Complete log data and analysis
 * @returns {Promise<string>} AI-generated response
 * @throws {Error} On API errors or processing failures
 */
export async function askAboutLog(question, sessionId, logContext) {
  try {
    if (!question || !logContext) {
      throw new Error('Question and log context are required');
    }

    // Build contextual prompt
    const prompt = buildContextualPrompt(question, logContext);

    // Create client with rotated API key
    const client = createClient();

    // Set timeout for API request (10 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI service request timeout')), 10000)
    );

    // Make API request
    const responsePromise = client.chat.completions.create({
      model: process.env.GEMINI_MODEL,
      messages: [{ role: 'user', content: prompt }]
    });

    // Race between response and timeout
    const response = await Promise.race([responsePromise, timeoutPromise]);

    // Extract response text
    const responseText = response.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response received from AI service');
    }

    console.log(`✓ Chat response generated for session ${sessionId}`);
    return responseText;
  } catch (error) {
    console.error('Error in askAboutLog:', error.message);
    throw error;
  }
}

/**
 * Validates a user question
 * @param {string} question - Question to validate
 * @returns {object} Validation result with isValid and error message
 */
export function validateQuestion(question) {
  if (!question) {
    return { isValid: false, error: 'Question is required' };
  }

  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Question cannot be empty or whitespace only' };
  }

  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Question exceeds 1000 character limit' };
  }

  return { isValid: true };
}
