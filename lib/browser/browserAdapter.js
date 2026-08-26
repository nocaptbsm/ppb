/* ── Browser Adapter ──
 * Facade composing DOMProvider, ScreenshotProvider, and ActionExecutor.
 * Single entry point for all browser interactions.
 */

import { createDOMProvider } from './domProvider';
import { createScreenshotProvider } from './screenshotProvider';
import { createActionExecutor } from './actionExecutor';

/**
 * BrowserAdapter — Coordinates all browser-specific operations.
 *
 * Usage:
 *   const adapter = BrowserAdapter.create('web');
 *   const dom = await adapter.getDOM(element);
 *   const screenshot = await adapter.captureScreenshot(element);
 *   const result = await adapter.executeAction(action, element);
 */
class BrowserAdapter {
  constructor(mode) {
    this.mode = mode;
    this.domProvider = createDOMProvider(mode);
    this.screenshotProvider = createScreenshotProvider(mode);
    this.actionExecutor = createActionExecutor(mode);
  }

  /**
   * Factory method.
   * @param {'web' | 'chrome' | 'firefox'} mode
   * @returns {BrowserAdapter}
   */
  static create(mode = 'web') {
    return new BrowserAdapter(mode);
  }

  /**
   * Get semantic DOM tree.
   * @param {HTMLElement} [rootElement]
   * @returns {Promise<Object>}
   */
  async getDOM(rootElement) {
    return this.domProvider.getDOM(rootElement);
  }

  /**
   * Capture screenshot.
   * @param {HTMLElement} [element]
   * @param {Object} [options]
   * @returns {Promise<{ base64: string, width: number, height: number, captureTimeMs: number }>}
   */
  async captureScreenshot(element, options) {
    return this.screenshotProvider.capture(element, options);
  }

  /**
   * Execute a browser action.
   * @param {Object} action
   * @param {HTMLElement} [contextRoot]
   * @returns {Promise<{ success: boolean, detail: string, timestamp: number }>}
   */
  async executeAction(action, contextRoot) {
    return this.actionExecutor.execute(action, contextRoot);
  }

  /**
   * Observe DOM changes.
   * @param {HTMLElement} target
   * @param {Function} callback
   * @returns {MutationObserver | null}
   */
  observeDOM(target, callback) {
    return this.domProvider.observeChanges(target, callback);
  }
}

export default BrowserAdapter;
