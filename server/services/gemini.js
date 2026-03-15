import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// API key rotation setup
const API_KEYS = [
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_API_KEY_BACKUP
].filter(key => key); // Remove undefined keys

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
  console.log(`Using API key ${currentKeyIndex} of ${API_KEYS.length}`);
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
 * Strips markdown formatting from text but preserves bold formatting
 * @param {string} text - Text with potential markdown formatting
 * @returns {string} Text with markdown removed but bold preserved
 */
function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/__(.+?)__/g, '**$1**') // Convert underscore bold to asterisk bold
    .replace(/_(.+?)_/g, '$1') // Remove underscore italics
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .trim();
}

/**
 * Ensures critical keywords are bolded in the text
 * @param {string} text - Text to process
 * @returns {string} Text with critical keywords bolded
 */
function ensureBoldKeywords(text) {
  if (!text) return text;
  
  const keywords = [
    'Non-Metropolitan',
    'holiday',
    'weekend',
    'Holiday',
    'Weekend',
    'multiple hub transfers',
    'Multiple hub transfers',
    'Service Level Agreement',
    'breach',
    'Breach',
    'operational pause',
    'Operational pause',
    'hub transfer',
    'Hub transfer',
    'percent',
    'Percent',
    '%'
  ];
  
  let result = text;
  keywords.forEach(keyword => {
    // Only bold if not already bolded
    const regex = new RegExp(`(?<!\\*\\*)${keyword}(?!\\*\\*)`, 'g');
    result = result.replace(regex, `**${keyword}**`);
  });
  
  return result;
}

/**
 * Sends delay log to Gemini and gets explanation with improvement suggestions
 * @param {string} logText - Formatted delay log text
 * @returns {Promise<{customerMessage: string, improvementSuggestion: string}>} Parsed response
 * @throws {Error} On API errors or parsing failures
 */
export async function explainDelay(logText) {
  try {
    if (!logText || typeof logText !== 'string') {
      throw new Error('logText must be a non-empty string');
    }

    const prompt = `You are a senior logistics operations analyst working for a large e-commerce delivery company. Analyze this shipment delay log and generate:
1. A clear, empathetic customer-facing explanation that includes SPECIFIC details from the log (delay hours, route, hubs, zones)
2. Operational improvement recommendations that a logistics operations team could implement

CRITICAL: Your customer message MUST include:
- The EXACT delay duration in hours (extract from the log - NOTE: delay values in the log are in MINUTES, convert to hours by dividing by 60)
- The SPECIFIC route or hubs involved
- The SPECIFIC delivery zone (Metropolitan or Non-Metropolitan)
- The NUMBER of transit hops
- Any weekend or holiday factors
- Specific operational reasons for THIS particular delay

IMPORTANT: When you see delay values like "10833" in the log, this is in MINUTES. Convert to hours: 10833 minutes ÷ 60 = approximately 180.5 hours or 7.5 days. Always convert minutes to hours in your response.

Use the information in the shipment log such as route, number of transit hubs, delivery timing difference, operational context, weekend or holiday indicators, delivery zone, and shipment characteristics to infer the most likely operational causes of the delay.

Focus on realistic logistics causes such as:
- Multiple hub transfers increasing transit time
- Long-distance transportation routes
- Weekend operational pauses
- Rural or non-metropolitan delivery areas
- Service Level Agreement breaches
- Transit congestion between hubs
- Operational scheduling inefficiencies

CRITICAL RULES:
1. Do NOT use any abbreviations or acronyms. Always write the full term.
   - Write "Service Level Agreement" instead of "SLA"
   - Write "Turn Around Time" instead of "TAT"
   - Write "Expected Delivery Date" instead of "EDD"
   - Write "Cash on Delivery" instead of "COD"
   - Write "Metropolitan" instead of "Metro"
   - Write "Non-Metropolitan" instead of "Non-Metro"
2. The explanation must be simple enough for a customer to understand.
3. The improvement suggestions must be operational and actionable for a logistics company.
4. IMPORTANT: Use **bold formatting** (with double asterisks) to highlight critical operational details such as:
   - Specific delay hours (e.g., **5.5 hours**)
   - Holiday or weekend indicators
   - Non-Metropolitan or remote delivery areas
   - Service Level Agreement breaches
   - Multiple hub transfers
   - Specific delay causes
   - Key improvement metrics

Customer message guidelines:
- Use a polite and empathetic tone
- MUST include specific numbers: delay hours (converted from minutes), number of hubs, route details
- IMPORTANT: If you see delay values in the log, they are in MINUTES. Always convert to hours by dividing by 60
- Clearly explain the cause of the delay using simple language with specific details from THIS log
- Reassure the customer that corrective actions are being taken
- Bold important details like **X hours delay**, **holiday**, **weekend**, **Non-Metropolitan area**, **X hub transfers**, etc.

Improvement suggestion guidelines:
- Identify the most likely operational root cause from the log
- Provide concrete operational improvements that logistics teams could implement
- Focus on realistic improvements such as route optimization, hub scheduling, weekend dispatch planning, and delivery planning improvements
- Bold critical factors in the root cause (e.g., **multiple hub transfers**, **weekend pause**, **Non-Metropolitan delivery**)
- Bold specific metrics and improvements in actionable steps (e.g., **reduce by 30%**, **eliminate weekend pauses**)

Return ONLY valid JSON with this exact structure (no markdown, no additional text):
{
  "customerMessage": {
    "intro": "1-2 sentence introduction acknowledging the issue",
    "explanation": "Clear explanation of what caused the delay and why (with **bold** formatting for important details like holiday, weekend, Non-Metropolitan area, etc.)",
    "resolution": "Timeframe and next steps for resolution (no abbreviations)",
    "closing": "Closing statement assuring customer support"
  },
  "improvementSuggestion": {
    "rootCause": "Clear statement of root cause with **bold** formatting for critical factors (spell out all terms fully, no abbreviations)",
    "actionableSteps": [
      "Specific, actionable step 1 with **bold** formatting for key metrics (no abbreviations)",
      "Specific, actionable step 2 with **bold** formatting for key metrics (no abbreviations)",
      "Specific, actionable step 3 with **bold** formatting for key metrics (no abbreviations)"
    ],
    "expectedImpact": "Expected business impact of these improvements with **bold** formatting for key metrics (no abbreviations)"
  }
}

Shipment Delay Log:
${logText}`;

    const client = createClient();
    const response = await client.chat.completions.create({
      model: process.env.GEMINI_MODEL,
      messages: [{ "role": "user", "content": prompt }]
    });

    const rawText = response.choices[0].message.content;
    console.log('Raw Gemini response:', rawText);

    // Strip markdown from response
    let cleanedText = stripMarkdown(rawText);
    
    // Ensure critical keywords are bolded
    cleanedText = ensureBoldKeywords(cleanedText);

    // Parse JSON
    const parsed = JSON.parse(cleanedText);

    // Validate required fields
    if (!parsed.customerMessage || !parsed.improvementSuggestion) {
      throw new Error('Response missing required fields');
    }
    
    // Ensure bold formatting in all text fields
    const result = {
      customerMessage: {
        intro: ensureBoldKeywords(parsed.customerMessage.intro),
        explanation: ensureBoldKeywords(parsed.customerMessage.explanation),
        resolution: ensureBoldKeywords(parsed.customerMessage.resolution),
        closing: ensureBoldKeywords(parsed.customerMessage.closing)
      },
      improvementSuggestion: {
        rootCause: ensureBoldKeywords(parsed.improvementSuggestion.rootCause),
        actionableSteps: parsed.improvementSuggestion.actionableSteps.map(step => ensureBoldKeywords(step)),
        expectedImpact: ensureBoldKeywords(parsed.improvementSuggestion.expectedImpact)
      }
    };

    return result;
  } catch (error) {
    console.error('Error in explainDelay:', error);
    throw new Error(`Failed to explain delay: ${error.message}`);
  }
}
