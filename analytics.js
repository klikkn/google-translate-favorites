
// ==========================================
// GOOGLE ANALYTICS 4 FOR CHROME EXTENSIONS
// ==========================================

// 1. CONFIGURATION
// Replace these with your actual values from the GA4 dashboard
const MEASUREMENT_ID = 'G-T70LYSTSCD';
const API_SECRET = 'hVhFjWkpRRqewCS5-l37Lg';

// GA4 Endpoints
const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

// Session config
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;
const SESSION_EXPIRATION_IN_MIN = 30;

/**
 * Returns a persistent unique Client ID for the user.
 * This ensures the user is counted as the same person across browser restarts.
 */
async function getOrCreateClientId() {
  const result = await chrome.storage.local.get('clientId');
  let clientId = result.clientId;
  if (!clientId) {
    // Generate a unique ID for this user
    clientId = self.crypto.randomUUID();
    await chrome.storage.local.set({ clientId });
  }
  return clientId;
}

/**
 * Manages the Session ID.
 * GA4 needs a session_id to group events into a "User Session".
 * Without this, all events look like "Bounces" or isolated hits.
 */
async function getOrCreateSessionId() {
  let { sessionData } = await chrome.storage.session.get('sessionData');
  const currentTimeInMs = Date.now();

  // Check if session exists and is still valid (within 30 mins)
  if (sessionData && sessionData.timestamp) {
    const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;
    if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
      sessionData = null; // Session expired
    } else {
      // Update timestamp to keep session alive
      sessionData.timestamp = currentTimeInMs;
      await chrome.storage.session.set({ sessionData });
      return sessionData.session_id;
    }
  }

  // Create a NEW session
  const newSessionId = currentTimeInMs.toString();
  await chrome.storage.session.set({
    sessionData: { session_id: newSessionId, timestamp: currentTimeInMs }
  });
  return newSessionId;
}

/**
 * THE MAIN FUNCTION
 * Call this from background.js to send data to Google.
 * * @param {string} eventName - e.g., 'button_click', 'extension_install'
 * @param {object} params - Extra data e.g., { button_id: 'save', score: 10 }
 */
export async function fireEvent(eventName, params = {}) {
  // 1. Get IDs
  const clientId = await getOrCreateClientId();
  const sessionId = await getOrCreateSessionId();

  // 2. Build the payload
  const body = {
    client_id: clientId,
    events: [{
      name: eventName,
      params: {
        session_id: sessionId,
        engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MSEC,
        ...params // Merges your custom params here
      }
    }]
  };

  // 3. Send the request
  // TIP: Change GA_ENDPOINT to DEBUG_ENDPOINT to see errors in the console while developing
  try {
    await fetch(
      `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );
    // console.log(`[Analytics] Sent event: ${eventName}`);
  } catch (e) {
    console.error('[Analytics] Failed to send event', e);
  }
}