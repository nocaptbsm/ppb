/**
 * Prompt Injection Guard — Detects malicious instruction overrides originating
 * from webpage content, blocking suspicious actions before execution.
 */

/**
 * Scans the user command and webpage elements for known injection patterns.
 * 
 * @param {string} userCommand - Command issued by the user
 * @param {Object} domTree - Semantic DOM tree
 * @returns {Object} Security analysis result
 */
export function scanForInjection(userCommand, domTree) {
  const alerts = [];
  
  // 1. Flatten DOM tree to search all text nodes
  const texts = [];
  collectTextNodes(domTree, texts);
  
  const injectionPatterns = [
    /ignore (?:all )?previous instructions/i,
    /system message/i,
    /override (?:privacy|policy)/i,
    /you are now (?:in|a) (?:maintenance|developer|admin)/i,
    /exfiltrate/i,
    /send (?:the )?user's? (?:data|aadhaar|pan|password)/i,
    /leak/i,
    /bypass firewall/i
  ];

  // 2. Scan each text block
  for (const textItem of texts) {
    for (const pattern of injectionPatterns) {
      if (pattern.test(textItem.text)) {
        alerts.push({
          threatType: 'PROMPT_INJECTION_PATTERN',
          evidence: `Webpage text matches: "${textItem.text.substring(0, 100)}"`,
          severity: 'HIGH',
        });
        break; // check next text item
      }
    }
  }

  // 3. Scan user command (though user is trusted, we watch for accidental overrides)
  for (const pattern of injectionPatterns) {
    if (pattern.test(userCommand)) {
      alerts.push({
        threatType: 'INJECTION_KEYWORDS_IN_GOAL',
        evidence: `User command contains keyword matching pattern: ${pattern}`,
        severity: 'MEDIUM',
      });
      break;
    }
  }

  return {
    isSuspicious: alerts.length > 0,
    alerts,
  };
}

/**
 * Scans a VLM proposed action to prevent unauthorized data exfiltration.
 * 
 * @param {Object} action - Proposed VLM action { type, target, value, url }
 * @param {Object} entityMap - Ephemeral client-side PII map
 * @returns {Object} Security evaluation
 */
export function validateActionExfiltration(action, entityMap = {}) {
  const alerts = [];

  // Prevent navigations or clicks sending data out
  if (action.type === 'navigate' && action.url) {
    const url = action.url.toLowerCase();
    
    // Check if URL looks like an exfiltration endpoint with query parameters
    if (url.includes('?') && (url.includes('data=') || url.includes('pii=') || url.includes('aadhaar=') || url.includes('pan='))) {
      alerts.push({
        threatType: 'DATA_EXFILTRATION_VIA_URL',
        evidence: `Agent tried to navigate to URL with query parameters: ${action.url}`,
        severity: 'CRITICAL',
      });
    }

    // Check if navigating to a suspicious unlisted host
    const isSuspiciousHost = /evil-server|malicious|hacker|attacker/i.test(url);
    if (isSuspiciousHost) {
      alerts.push({
        threatType: 'UNAUTHORIZED_DESTINATION',
        evidence: `Agent tried to navigate to unauthorized domain: ${action.url}`,
        severity: 'CRITICAL',
      });
    }
  }

  // Prevent typing sensitive values into public fields (e.g. typing password into search bar)
  if (action.type === 'type' && action.value) {
    const targetSelector = action.target.toLowerCase();
    const typedVal = action.value.replace(/[-\s]/g, '');

    // Check if they are typing a value matching a known blocked Gov ID or Credit Card
    const isAadhaarLike = /\b[2-9]{1}[0-9]{11}\b/.test(typedVal);
    const isPanLike = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(typedVal);
    
    const isPublicField = targetSelector.includes('search') || targetSelector.includes('query') || targetSelector.includes('q') || targetSelector.includes('filter');

    if ((isAadhaarLike || isPanLike) && isPublicField) {
      alerts.push({
        threatType: 'GOVERNMENT_ID_LEAK',
        evidence: `Agent tried to type government ID into public field: ${action.target}`,
        severity: 'CRITICAL',
      });
    }
  }

  return {
    isSafe: alerts.length === 0,
    alerts,
  };
}

/**
 * Traverses semantic tree to collect text node segments.
 */
function collectTextNodes(node, list) {
  if (!node) return;
  if (node.type === 'text') {
    list.push({ text: node.content });
    return;
  }
  if (node.children) {
    for (const child of node.children) {
      collectTextNodes(child, list);
    }
  }
}
