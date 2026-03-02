
// ==========================================
// UMAMI ANALYTICS FOR CHROME EXTENSIONS
// ==========================================

const UMAMI_ENDPOINT = 'https://cloud.umami.is/api/send';
const WEBSITE_ID = '33be3362-b64a-47b1-bf82-57fe7e4e7be0';

/**
 * Sends a custom event to Umami.
 * @param {string} eventName - e.g., 'quick_link_item'
 * @param {object} data - Extra data e.g., { label: 'save_quick_link' }
 */
export async function fireEvent(eventName, data = {}) {  
  try {
    await fetch(UMAMI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          name: eventName,
          data,
        },
      }),
    });
  } catch (e) {
    console.error('[Analytics] Failed to send event', e);
  }
}
