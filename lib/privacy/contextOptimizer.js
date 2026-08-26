/**
 * Task-Aware Context Optimizer — The core innovation.
 * Analyzes the user command locally, decides what context (DOM and/or visual) is actually
 * required, and prunes out all unnecessary elements.
 */

import { CONTEXT_MODES } from '@/lib/utils/constants';

/**
 * Optimizes the context payload for transmission to the VLM based on the user's task.
 * 
 * @param {Object} sanitizedDOM - The full sanitized DOM tree
 * @param {string} sanitizedScreenshot - Base64 sanitized screenshot
 * @param {string} userCommand - Natural language command issued by the user
 * @returns {Object} Optimized context payload, metadata, and reduction metrics
 */
export function optimizeContext(sanitizedDOM, sanitizedScreenshot, userCommand) {
  if (!sanitizedDOM) {
    return {
      contextMode: CONTEXT_MODES.DOM_ONLY,
      minimumContext: null,
      includedElements: [],
      excludedCategories: [],
    };
  }

  const command = userCommand.toLowerCase();
  
  // 1. Analyze task requirements
  const isVisualTask = checkIfVisualTask(command);
  const isFormTask = checkIfFormTask(command);

  // 2. Select adaptive context mode
  let contextMode = CONTEXT_MODES.DOM_ONLY;
  if (isVisualTask) {
    contextMode = CONTEXT_MODES.DOM_SCREENSHOT;
  }

  // 3. Filter/Prune DOM nodes based on relevance
  const includedElements = [];
  const excludedCategories = [];
  
  const optimizedDOMTree = pruneDOMTree(
    JSON.parse(JSON.stringify(sanitizedDOM)), 
    command, 
    isFormTask,
    includedElements, 
    excludedCategories
  );

  // 4. Construct the minimum safe context payload
  const minimumContext = {
    contextMode,
    command: userCommand,
    timestamp: new Date().toISOString(),
    dom: optimizedDOMTree,
  };

  if (contextMode === CONTEXT_MODES.DOM_SCREENSHOT) {
    minimumContext.screenshot = sanitizedScreenshot;
  }

  return {
    contextMode,
    minimumContext,
    includedElements,
    excludedCategories,
  };
}

/**
 * Checks if the task requires visual information.
 */
function checkIfVisualTask(command) {
  const visualKeywords = [
    'color', 'layout', 'image', 'picture', 'photo', 'red', 'green', 'blue', 
    'look', 'visual', 'screenshot', 'where is', 'design', 'logo', 'banner'
  ];
  return visualKeywords.some(kw => command.includes(kw));
}

/**
 * Checks if the task involves filling out forms or logging in.
 */
function checkIfFormTask(command) {
  const formKeywords = [
    'type', 'enter', 'fill', 'input', 'write', 'submit', 'login', 'register', 
    'sign in', 'signup', 'form', 'password', 'otp'
  ];
  return formKeywords.some(kw => command.includes(kw));
}

/**
 * Recursively prunes the DOM tree, removing elements that aren't relevant to the task.
 * Updates arrays keeping track of included and excluded items.
 */
function pruneDOMTree(node, command, isFormTask, includedList, excludedList) {
  if (!node) return null;

  // Keep all text nodes as they contain semantic info (unless they are inside pruned elements)
  if (node.type === 'text') {
    return node;
  }

  // Determine element relevance
  const isRelevant = evaluateElementRelevance(node, command, isFormTask);

  if (isRelevant) {
    if (node.isInteractive || node.piiType) {
      includedList.push({
        tag: node.tag,
        selector: node.selector,
        label: node.label || node.placeholder || node.directText || 'unlabeled',
      });
    }

    // Keep children of relevant elements, but prune them too
    if (node.children) {
      node.children = node.children
        .map(child => pruneDOMTree(child, command, isFormTask, includedList, excludedList))
        .filter(Boolean);
    }
    
    return node;
  } else {
    // Collect stats on what we are filtering out
    if (node.isInteractive || node.piiType) {
      excludedList.push({
        tag: node.tag,
        selector: node.selector,
        reason: 'task_irrelevant',
      });
    }
    
    // Prune this node from the tree (return null)
    return null;
  }
}

/**
 * Core relevance algorithm. Decide if a DOM element is needed for the user command.
 */
function evaluateElementRelevance(node, command, isFormTask) {
  // Always keep structural root containers
  if (['html', 'body', 'main', 'form'].includes(node.tag)) {
    return true;
  }

  // If command is structural form filling, keep input fields, textareas, labels, select dropdowns, and submit buttons
  if (isFormTask) {
    if (node.tag === 'input' || node.tag === 'textarea' || node.tag === 'select' || node.tag === 'button' || node.tag === 'label') {
      return true;
    }
  }

  // If command mentions a specific element keyword (e.g. "click submit" -> match "submit" in tag, text, label, id, selector)
  const searchText = `${node.tag} ${node.directText || ''} ${node.label || ''} ${node.placeholder || ''} ${node.id || ''} ${node.selector || ''}`.toLowerCase();
  const commandWords = command.split(/\s+/).filter(w => w.length > 2 && !['click', 'type', 'enter', 'press', 'goto', 'fill'].includes(w));
  
  const matchesCommandKeywords = commandWords.some(word => searchText.includes(word));
  if (matchesCommandKeywords) {
    return true;
  }

  // Always keep interactive nodes that might be execution targets (fail-safe layout)
  if (node.isInteractive) {
    // If it's a primary submit button or search bar, keep it
    if (node.tag === 'button' || node.tag === 'input' || node.ariaRole === 'button') {
      return true;
    }
  }

  // Keep table nodes if the task is reading data/transaction checks
  if (command.includes('transaction') || command.includes('recent') || command.includes('read') || command.includes('table') || command.includes('history')) {
    if (['table', 'thead', 'tbody', 'tr', 'td', 'th'].includes(node.tag)) {
      return true;
    }
  }

  // Default to pruning non-interactive structural elements (divs, spans, sections, articles, headers, footers)
  // unless they contain relevant text or children.
  return false;
}
