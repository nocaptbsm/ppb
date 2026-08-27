// content.js - Chrome Extension Content Script
// Interacts directly with the active webpage DOM.

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'get_dom') {
    try {
      const start = performance.now();
      const tree = analyzeNode(document.body, 0);
      const extractionTimeMs = performance.now() - start;
      const elementCount = countElementsInTree(tree);

      sendResponse({
        success: true,
        dom: {
          tree,
          extractionTimeMs: Math.round(extractionTimeMs * 100) / 100,
          elementCount
        }
      });
    } catch (error) {
      console.error('[Content] DOM Extraction Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  else if (message.action === 'execute_action') {
    try {
      const result = executeAction(message.payload);
      sendResponse({ success: true, result });
    } catch (error) {
      console.error('[Content] Action Execution Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // async channel open
});

// DOM Analyzer logic
function analyzeNode(node, depth = 0) {
  if (!node || depth > 20) return null;

  // Handle TEXT nodes
  if (node.nodeType === 3) {
    const text = node.textContent?.trim();
    if (!text) return null;
    return { type: 'text', content: text };
  }

  // Handle ELEMENT nodes
  if (node.nodeType !== 1) return null;

  const tag = node.tagName.toLowerCase();
  
  if (['script', 'style', 'noscript', 'svg', 'path', 'iframe'].includes(tag)) {
    return null;
  }

  try {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return null;
    }
  } catch (e) {}

  const rect = node.getBoundingClientRect ? node.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 };

  const element = {
    type: 'element',
    tag,
    id: node.id || undefined,
    className: node.className && typeof node.className === 'string' ? node.className : undefined,
    isInteractive: isInteractiveElement(node, tag),
    inputType: node.type || undefined,
    directText: getDirectNodeText(node),
    label: getElementLabel(node),
    ariaRole: node.getAttribute('role') || undefined,
    ariaLabel: node.getAttribute('aria-label') || undefined,
    placeholder: node.placeholder || undefined,
    value: getSafeElementValue(node, tag),
    bbox: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    selector: buildCSSSelector(node),
    children: [],
  };

  // Add custom tags if defined in webpage dataset (useful for demos)
  const piiType = node.dataset?.piiType || node.getAttribute('data-pii-type');
  const piiValue = node.dataset?.piiValue || node.getAttribute('data-pii-value');
  if (piiType) element.piiType = piiType;
  if (piiValue) element.piiValue = piiValue;

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    const analyzedChild = analyzeNode(child, depth + 1);
    if (analyzedChild) {
      element.children.push(analyzedChild);
    }
  }

  return element;
}

function isInteractiveElement(node, tag) {
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'details', 'summary'];
  if (interactiveTags.includes(tag)) return true;
  if (node.getAttribute('role') === 'button') return true;
  if (node.onclick || node.getAttribute('onclick')) return true;
  if (node.tabIndex >= 0) return true;
  
  try {
    const style = window.getComputedStyle(node);
    if (style.cursor === 'pointer') return true;
  } catch (e) {}
  
  return false;
}

function getDirectNodeText(node) {
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 3) {
      text += child.textContent;
    }
  }
  return text.trim();
}

function getElementLabel(node) {
  if (node.id) {
    try {
      const label = document.querySelector(`label[for="${node.id}"]`);
      if (label) return label.textContent?.trim();
    } catch (e) {}
  }
  const parentLabel = node.closest ? node.closest('label') : null;
  if (parentLabel) return parentLabel.textContent?.trim();
  return node.getAttribute('aria-label') || node.title || undefined;
}

function getSafeElementValue(node, tag) {
  if (tag === 'input' || tag === 'textarea') {
    if (node.type === 'password') return '••••••••';
    return node.value || undefined;
  }
  if (tag === 'select') {
    return node.options?.[node.selectedIndex]?.text || undefined;
  }
  return undefined;
}

function buildCSSSelector(node) {
  if (node.id) return `#${node.id}`;
  
  const tag = node.tagName.toLowerCase();
  
  const testId = node.dataset?.testId || node.getAttribute('data-test-id');
  if (testId) return `[data-test-id="${testId}"]`;

  const parent = node.parentElement;
  if (!parent) return tag;

  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName === node.tagName
  );
  
  if (siblings.length === 1) {
    return `${buildCSSSelector(parent)} > ${tag}`;
  }
  
  const index = siblings.indexOf(node) + 1;
  return `${buildCSSSelector(parent)} > ${tag}:nth-of-type(${index})`;
}

function countElementsInTree(tree) {
  if (!tree) return 0;
  if (tree.type === 'text') return 0;
  let count = 1;
  if (tree.children) {
    for (const child of tree.children) {
      count += countElementsInTree(child);
    }
  }
  return count;
}

// Action Executor logic
function executeAction(action) {
  const timestamp = Date.now();
  
  try {
    switch (action.type) {
      case 'click':
        return executeClick(action, timestamp);
      case 'type':
        return executeType(action, timestamp);
      case 'scroll':
        return executeScroll(action, timestamp);
      case 'select':
        return executeSelect(action, timestamp);
      case 'wait':
        return { success: true, detail: `Waited ${action.duration || 1000}ms`, timestamp };
      default:
        return { success: false, error: `Unsupported action: ${action.type}`, timestamp };
    }
  } catch (error) {
    return { success: false, error: error.message, timestamp };
  }
}

function findElement(selector) {
  let el = document.querySelector(selector);
  if (!el && selector === '#search-input') {
    el = document.querySelector('input[name="q"]') || 
         document.querySelector('input[type="search"]') || 
         document.querySelector('input[placeholder*="search" i]') ||
         document.querySelector('input[type="text"]');
  }
  if (!el && selector === '#search-btn') {
    el = document.querySelector('button[type="submit"]') ||
         document.querySelector('input[type="submit"]') ||
         document.querySelector('.search-button') ||
         document.querySelector('button');
  }
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

function addVisualFeedback(el) {
  // Add a nice cyan glowing border to targeted element
  const originalOutline = el.style.outline;
  const originalTransition = el.style.transition;
  const originalBoxShadow = el.style.boxShadow;
  
  el.style.transition = 'all 0.3s ease';
  el.style.outline = '3px solid #06b6d4';
  el.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.6)';
  
  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.transition = originalTransition;
    el.style.boxShadow = originalBoxShadow;
  }, 1500);
}

function executeClick(action, timestamp) {
  const el = findElement(action.target);
  addVisualFeedback(el);
  el.click();
  return { success: true, detail: `Clicked: ${action.target}`, timestamp };
}

function executeType(action, timestamp) {
  const el = findElement(action.target);
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
    throw new Error(`Cannot type into non-input tag ${el.tagName}`);
  }
  addVisualFeedback(el);
  el.focus();
  el.value = action.value || '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { success: true, detail: `Typed into: ${action.target}`, timestamp };
}

function executeScroll(action, timestamp) {
  const amount = action.amount || 300;
  const direction = action.direction || 'down';
  const scrollY = direction === 'down' ? amount : -amount;
  
  if (action.target) {
    const el = findElement(action.target);
    addVisualFeedback(el);
    el.scrollBy({ top: scrollY, behavior: 'smooth' });
  } else {
    window.scrollBy({ top: scrollY, behavior: 'smooth' });
  }
  return { success: true, detail: `Scrolled ${direction} by ${amount}px`, timestamp };
}

function executeSelect(action, timestamp) {
  const el = findElement(action.target);
  if (el.tagName !== 'SELECT') {
    throw new Error(`Cannot select on non-select tag ${el.tagName}`);
  }
  addVisualFeedback(el);
  el.value = action.value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { success: true, detail: `Selected "${action.value}" in: ${action.target}`, timestamp };
}
