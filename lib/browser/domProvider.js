/* ── DOM Provider ──
 * Interface + MVP implementation (live DOM reading).
 * Designed to be swapped for Chrome/Firefox content script injection later.
 */

/**
 * Abstract DOMProvider interface.
 * Implementations must provide getDOM() and observeChanges().
 */
class DOMProvider {
  /**
   * Get the semantic DOM tree for the given root element.
   * @param {HTMLElement} [rootElement] - Root element (optional, defaults to document.body)
   * @returns {Promise<Object>} Semantic DOM tree
   */
  async getDOM(rootElement) {
    throw new Error('DOMProvider.getDOM() must be implemented');
  }

  /**
   * Observe DOM changes.
   * @param {HTMLElement} target - Element to observe
   * @param {Function} callback - Called when DOM changes
   * @returns {MutationObserver | null}
   */
  observeChanges(target, callback) {
    throw new Error('DOMProvider.observeChanges() must be implemented');
  }
}

import { analyzeNode, countElementsInTree } from '@/lib/perception/domAnalyzer';

/**
 * MVP Implementation: Reads from the live DOM directly.
 * Works for the web application demo where the demo page is in the same document.
 */
class LiveDOMProvider extends DOMProvider {
  async getDOM(rootElement) {
    const root = rootElement || document.body;
    const start = performance.now();
    const tree = analyzeNode(root, 0, document);
    const extractionTimeMs = performance.now() - start;

    return {
      tree,
      extractionTimeMs: Math.round(extractionTimeMs * 100) / 100,
      elementCount: countElementsInTree(tree),
    };
  }

  observeChanges(target, callback) {
    if (typeof MutationObserver === 'undefined') return null;

    const observer = new MutationObserver((mutations) => {
      callback(mutations);
    });

    observer.observe(target || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return observer;
  }
}

/**
 * Stub for Chrome Extension content script DOM reading.
 */
class ChromeExtensionDOMProvider extends DOMProvider {
  async getDOM(_rootElement) {
    // Future: chrome.scripting.executeScript() to read DOM from active tab
    throw new Error('ChromeExtensionDOMProvider not yet implemented');
  }

  observeChanges(_target, _callback) {
    throw new Error('ChromeExtensionDOMProvider.observeChanges() not yet implemented');
  }
}

/**
 * Factory: Create the appropriate DOM provider.
 * @param {'web' | 'chrome' | 'firefox'} mode
 * @returns {DOMProvider}
 */
export function createDOMProvider(mode = 'web') {
  switch (mode) {
    case 'chrome':
    case 'firefox':
      return new ChromeExtensionDOMProvider();
    case 'web':
    default:
      return new LiveDOMProvider();
  }
}

export { DOMProvider, LiveDOMProvider };
