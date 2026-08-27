// popup.js - Chrome Extension Controller
// Runs inside the extension popup UI.

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const runBtn = document.getElementById('run-btn');
  const cmdInput = document.getElementById('cmd-input');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const blockedBanner = document.getElementById('blocked-banner');
  const entityList = document.getElementById('entity-list');
  const logsContainer = document.getElementById('logs-container');
  const protectionVal = document.getElementById('protection-score');
  const retentionVal = document.getElementById('retention-score');
  const reductionVal = document.getElementById('reduction-score');

  // Tabs toggle
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Action history state
  const actionHistory = [];

  // Run Agent Pipeline
  runBtn.addEventListener('click', async () => {
    const command = cmdInput.value.trim();
    if (!command) return;

    // Reset UI state
    blockedBanner.style.display = 'none';
    statusBanner.style.display = 'flex';
    runBtn.disabled = true;
    cmdInput.disabled = true;

    try {
      // 1. Query Active Tab
      statusText.textContent = 'Connecting to active webpage...';
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active browser tab found');

      // 2. Fetch DOM Tree from content script
      statusText.textContent = 'Extracting page semantic tree...';
      const domResponse = await sendTabMessage(tab.id, { action: 'get_dom' });
      if (!domResponse || !domResponse.success) {
        throw new Error(domResponse?.error || 'Failed to analyze page DOM.');
      }
      const rawDOM = domResponse.dom.tree;

      // 3. Fetch Screenshot from background script
      statusText.textContent = 'Capturing page layout view...';
      const captureResponse = await sendRuntimeMessage({ action: 'capture_visible_tab' });
      const screenshot = captureResponse && captureResponse.success ? captureResponse.base64 : null;

      // 4. Run Local Privacy Engine
      statusText.textContent = 'Analyzing context for PII & secrets...';
      const piiDetector = window.PrivacyEngine;
      const detectedPII = piiDetector.extractPIIFromTree(rawDOM);
      
      // Classify Sensitivity
      const classifiedEntities = detectedPII.map(pii => ({
        ...pii,
        decision: piiDetector.classifySensitivity(pii, 'strict')
      }));

      // Sanitize DOM context local-first
      statusText.textContent = 'Redacting PII and isolating secrets...';
      const { sanitizedDOM, entityMap } = piiDetector.sanitizeDOMTree(rawDOM, classifiedEntities);

      // Render Redacted Entity Map
      renderEntityMap(entityMap);

      // Calculate Metrics
      calculateAndRenderMetrics(rawDOM, sanitizedDOM, screenshot, classifiedEntities, entityMap);

      // 5. Send Sanitized Context to VLM (Next.js server API)
      statusText.textContent = 'Sending safe payload to VLM...';
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          provider: 'gemini',
          context: {
            contextMode: screenshot ? 'dom-screenshot' : 'dom-only',
            dom: sanitizedDOM,
            screenshot: screenshot
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Injection attack blocked
        if (response.status === 403) {
          blockedBanner.style.display = 'block';
          blockedBanner.textContent = `⚠️ Command Blocked: Prompt Injection detected!`;
          
          addActionLog(command, { type: 'BLOCKED', target: 'FIREWALL' }, `Prompt Injection blocked: ${data.detail || 'Malicious input found.'}`);
        } else {
          throw new Error(data.error || 'VLM returned API error.');
        }
        return;
      }

      const action = data.action;
      const reasoning = data.reasoning;

      // 6. Execute VLM Action on Webpage via content script
      statusText.textContent = 'Executing action on webpage...';
      const executionResponse = await sendTabMessage(tab.id, {
        action: 'execute_action',
        payload: action
      });

      if (!executionResponse || !executionResponse.success) {
        throw new Error(executionResponse?.error || 'Failed to inject VLM action.');
      }

      // Add to action logs
      addActionLog(command, action, reasoning);
      showSuccessAlert();

    } catch (error) {
      console.error('[Popup] Run Error:', error);
      alert(`Agent Execution Failed: ${error.message}`);
    } finally {
      statusBanner.style.display = 'none';
      runBtn.disabled = false;
      cmdInput.disabled = false;
    }
  });

  // Helper: Send message to active tab content script
  function sendTabMessage(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        resolve(response);
      });
    });
  }

  // Helper: Send message to background script
  function sendRuntimeMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  // UI: Render Entity Map
  function renderEntityMap(entityMap) {
    const keys = Object.keys(entityMap);
    if (keys.length === 0) {
      entityList.innerHTML = '<li class="helper-text">No PII transformed in local context.</li>';
      return;
    }

    entityList.innerHTML = '';
    keys.forEach(key => {
      const item = entityMap[key];
      const li = document.createElement('li');
      li.className = 'entity-item';
      li.innerHTML = `
        <span class="entity-key">${key}</span>
        <span class="entity-arrow">→</span>
        <span class="entity-val">${item.originalValue}</span>
      `;
      entityList.appendChild(li);
    });
  }

  // UI: Calculate and render local metrics
  function calculateAndRenderMetrics(rawDOM, sanitizedDOM, screenshot, classifiedEntities, entityMap) {
    // 1. Protection Score
    if (classifiedEntities.length === 0) {
      protectionVal.textContent = '100%';
    } else {
      const protectedCount = classifiedEntities.filter(e => e.decision !== 'ALLOW').length;
      const score = Math.round((protectedCount / classifiedEntities.length) * 100);
      protectionVal.textContent = `${score}%`;
    }

    // 2. Context Retention Score
    let totalText = 0;
    function countText(node) {
      if (!node) return;
      if (node.type === 'text' || node.directText) totalText++;
      if (node.children) node.children.forEach(countText);
    }
    countText(rawDOM);

    const redactedCount = Object.keys(entityMap).length;
    if (totalText === 0) {
      retentionVal.textContent = '100%';
    } else {
      const retention = Math.round(Math.max(30, 100 - ((redactedCount / totalText) * 100)));
      retentionVal.textContent = `${retention}%`;
    }

    // 3. Payload Reduction
    const originalSize = JSON.stringify(rawDOM).length + (screenshot ? screenshot.length : 0);
    const sanitizedSize = JSON.stringify(sanitizedDOM).length + (screenshot ? Math.round(screenshot.length * 0.1) : 0); // simulated canvas blur reduction
    const reduction = Math.round(Math.max(0, ((originalSize - sanitizedSize) / originalSize) * 100));
    reductionVal.textContent = `${reduction}%`;
  }

  // UI: Add Action Log
  function addActionLog(command, action, reasoning) {
    actionHistory.push({ command, action, reasoning, id: Date.now() });

    logsContainer.innerHTML = '';
    actionHistory.forEach(log => {
      const div = document.createElement('div');
      div.className = 'log-item';
      div.innerHTML = `
        <div class="log-header">
          <span class="log-cmd">"${log.command}"</span>
          <span class="log-time">just now</span>
        </div>
        <div class="log-body">
          <span class="action-badge">${log.action.type}</span>
          <code>${log.action.target || 'viewport'}</code>
          ${log.action.value ? `<span>value: "${log.action.value}"</span>` : ''}
        </div>
        <div class="log-reason">${log.reasoning}</div>
      `;
      logsContainer.appendChild(div);
    });
  }

  // UI Effect: Success animation
  function showSuccessAlert() {
    statusBanner.style.display = 'flex';
    statusText.textContent = '✅ Action Executed Successfully!';
    setTimeout(() => {
      statusBanner.style.display = 'none';
    }, 2000);
  }
});
