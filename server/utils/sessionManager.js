import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory session store for chat sessions
 * Maps sessionId -> session data
 */
const sessions = new Map();

/**
 * Session timeout in milliseconds (30 minutes)
 */
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Generates a unique session ID
 * @returns {string} UUID v4 session ID
 */
export function generateSessionId() {
  return uuidv4();
}

/**
 * Creates a new chat session
 * @param {string} sessionId - Session identifier
 * @param {object} logContext - Initial log context
 * @returns {object} Created session object
 */
export function createSession(sessionId, logContext) {
  const session = {
    sessionId,
    logContext,
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
    timeoutHandle: null
  };

  // Set auto-cleanup timeout
  session.timeoutHandle = setTimeout(() => {
    deleteSession(sessionId);
    console.log(`Session ${sessionId} expired and cleaned up`);
  }, SESSION_TIMEOUT);

  sessions.set(sessionId, session);
  console.log(`✓ Session created: ${sessionId}`);
  return session;
}

/**
 * Gets a session by ID
 * @param {string} sessionId - Session identifier
 * @returns {object|null} Session object or null if not found
 */
export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Updates session activity timestamp
 * @param {string} sessionId - Session identifier
 */
export function updateSessionActivity(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.updatedAt = new Date();
    session.messageCount++;
  }
}

/**
 * Deletes a session
 * @param {string} sessionId - Session identifier
 */
export function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    // Clear timeout
    if (session.timeoutHandle) {
      clearTimeout(session.timeoutHandle);
    }
    sessions.delete(sessionId);
    console.log(`✓ Session deleted: ${sessionId}`);
  }
}

/**
 * Validates a session exists and is active
 * @param {string} sessionId - Session identifier
 * @returns {boolean} True if session is valid and active
 */
export function isSessionValid(sessionId) {
  return sessions.has(sessionId);
}

/**
 * Gets all active sessions (for debugging)
 * @returns {array} Array of active session IDs
 */
export function getActiveSessions() {
  return Array.from(sessions.keys());
}

/**
 * Clears all sessions (for testing/cleanup)
 */
export function clearAllSessions() {
  sessions.forEach((session) => {
    if (session.timeoutHandle) {
      clearTimeout(session.timeoutHandle);
    }
  });
  sessions.clear();
  console.log('✓ All sessions cleared');
}

/**
 * Gets session statistics
 * @returns {object} Statistics about active sessions
 */
export function getSessionStats() {
  return {
    activeSessionCount: sessions.size,
    sessions: Array.from(sessions.values()).map(s => ({
      sessionId: s.sessionId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messageCount,
      ageMinutes: Math.round((new Date() - s.createdAt) / 60000)
    }))
  };
}
