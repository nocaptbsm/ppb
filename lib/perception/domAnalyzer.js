/**
 * DOM Analyzer — Core parsing logic for structural and semantic analysis of DOM nodes.
 * Decoupled from specific browser adapters to ensure portability to browser extensions.
 */

/**
 * Parses a DOM node recursively to build a semantic node tree.
 * 
 * @param {Node} node - The raw DOM node to inspect
 * @param {number} depth - Current recursion depth (limit to prevent stack overflow)
 * @param {Object} documentRef - Reference to the root document object
 * @returns {Object|null} Standardized semantic node representation
 */
export function analyzeNode(node, depth = 0, documentRef = typeof document !== 'undefined' ? document : null) {
  if (!node || depth > 20) return null;

  // Handle TEXT nodes
  if (node.nodeType === 3) { // Node.TEXT_NODE
    const text = node.textContent?.trim();
    if (!text) return null;
    return { type: 'text', content: text };
  }

  // Handle ELEMENT nodes
  if (node.nodeType !== 1) return null; // Node.ELEMENT_NODE

  const tag = node.tagName.toLowerCase();
  
  // Skip script, style, and svg elements
  if (['script', 'style', 'noscript', 'svg', 'path', 'iframe'].includes(tag)) {
    return null;
  }

  // Check visibility if window/getComputedStyle is available
  if (typeof window !== 'undefined') {
    try {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return null;
      }
    } catch (e) {
      // Fallback if styling can't be fetched
    }
  }

  const rect = node.getBoundingClientRect ? node.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 };

  const element = {
    type: 'element',
    tag,
    id: node.id || undefined,
    className: node.className && typeof node.className === 'string' ? node.className : undefined,
    isInteractive: isInteractiveElement(node, tag),
    inputType: node.type || undefined,
    directText: getDirectNodeText(node),
    label: getElementLabel(node, documentRef),
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
    piiType: node.dataset?.piiType || node.getAttribute('data-pii-type') || undefined,
    piiValue: node.dataset?.piiValue || node.getAttribute('data-pii-value') || undefined,
    selector: buildCSSSelector(node),
    children: [],
  };

  // Process children recursively
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    const analyzedChild = analyzeNode(child, depth + 1, documentRef);
    if (analyzedChild) {
      element.children.push(analyzedChild);
    }
  }

  return element;
}

/**
 * Checks if a DOM element is interactive.
 */
export function isInteractiveElement(node, tag) {
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'details', 'summary'];
  if (interactiveTags.includes(tag)) return true;
  if (node.getAttribute('role') === 'button') return true;
  if (node.onclick || node.getAttribute('onclick')) return true;
  if (node.tabIndex >= 0) return true;
  
  // Elements with pointer cursor are often interactive
  if (typeof window !== 'undefined') {
    try {
      const style = window.getComputedStyle(node);
      if (style.cursor === 'pointer') return true;
    } catch (e) {}
  }
  
  return false;
}

/**
 * Extracts direct text content of an element without text of its children.
 */
function getDirectNodeText(node) {
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 3) { // Node.TEXT_NODE
      text += child.textContent;
    }
  }
  return text.trim();
}

/**
 * Resolves label text associated with the element.
 */
function getElementLabel(node, documentRef) {
  if (node.id && documentRef) {
    try {
      const label = documentRef.querySelector(`label[for="${node.id}"]`);
      if (label) return label.textContent?.trim();
    } catch (e) {}
  }
  
  // Check parent label
  const parentLabel = node.closest ? node.closest('label') : null;
  if (parentLabel) return parentLabel.textContent?.trim();
  
  // Fallbacks
  return node.getAttribute('aria-label') || node.title || undefined;
}

/**
 * Gets value of an input element safely, hiding secrets.
 */
function getSafeElementValue(node, tag) {
  if (tag === 'input' || tag === 'textarea') {
    if (node.type === 'password') {
      return '••••••••';
    }
    return node.value || undefined;
  }
  if (tag === 'select') {
    return node.options?.[node.selectedIndex]?.text || undefined;
  }
  return undefined;
}

/**
 * Builds a CSS selector path for uniquely identifying the element.
 */
export function buildCSSSelector(node) {
  if (node.id) return `#${node.id}`;
  
  const tag = node.tagName.toLowerCase();
  
  if (node.dataset?.testId || node.getAttribute('data-test-id')) {
    return `[data-test-id="${node.dataset.testId || node.getAttribute('data-test-id')}"]`;
  }

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

/**
 * Counts all element nodes inside a semantic tree.
 */
export function countElementsInTree(tree) {
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
