// background.js - Chrome Extension Service Worker
// Handles capturing screenshot of the active tab.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capture_visible_tab') {
    // We must execute captureVisibleTab on the background script where it has permissions
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Capture Error:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, base64: dataUrl });
      }
    });
    return true; // Keeps the sendResponse channel open for async execution
  }
});
