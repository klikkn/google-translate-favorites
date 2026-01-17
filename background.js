import { fireEvent } from './analytics.js';

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'track_event') {
    fireEvent(message.category, {
      label: message.label
    });
  }
});