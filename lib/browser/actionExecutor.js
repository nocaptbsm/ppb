/* ── Action Executor (Browser Abstraction) ──
 * Interface + MVP implementation (direct DOM manipulation).
 * Extension mode would use chrome.scripting.executeScript().
 */

import { ACTION_TYPES } from '@/lib/utils/constants';

/**
 * Abstract ActionExecutor interface.
 */
class ActionExecutor {
  /**
   * Execute a browser action.
   * @param {Object} action - { type, target, value, ... }
   * @param {HTMLElement} [contextRoot] - Root element for selector resolution
   * @returns {Promise<{ success: boolean, detail: string, timestamp: number }>}
   */
  async execute(action, contextRoot) {
    throw new Error('ActionExecutor.execute() must be implemented');
  }
}

/**
 * MVP Implementation: Direct DOM manipulation.
 * Actions are executed on the demo page elements directly.
 */
class DirectDOMExecutor extends ActionExecutor {
  async execute(action, contextRoot) {
    const root = contextRoot || document;
    const timestamp = Date.now();

    try {
      switch (action.type) {
        case ACTION_TYPES.CLICK:
          return this._executeClick(action, root, timestamp);
        case ACTION_TYPES.TYPE:
          return this._executeType(action, root, timestamp);
        case ACTION_TYPES.SCROLL:
          return this._executeScroll(action, root, timestamp);
        case ACTION_TYPES.SELECT:
          return this._executeSelect(action, root, timestamp);
        case ACTION_TYPES.NAVIGATE:
          return this._executeNavigate(action, timestamp);
        case ACTION_TYPES.WAIT:
          return this._executeWait(action, timestamp);
        case ACTION_TYPES.EXTRACT:
          return this._executeExtract(action, root, timestamp);
        default:
          return { success: false, detail: `Unknown action type: ${action.type}`, timestamp };
      }
    } catch (err) {
      return { success: false, detail: `Error: ${err.message}`, timestamp };
    }
  }

  _findElement(selector, root) {
    const el = root.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    return el;
  }

  _executeClick(action, root, timestamp) {
    const el = this._findElement(action.target, root);
    el.click();
    // Add visual feedback
    el.style.outline = '2px solid #06b6d4';
    setTimeout(() => { el.style.outline = ''; }, 1000);
    return { success: true, detail: `Clicked: ${action.target}`, timestamp };
  }

  _executeType(action, root, timestamp) {
    const el = this._findElement(action.target, root);
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
      throw new Error(`Cannot type into ${el.tagName}`);
    }
    el.focus();
    el.value = action.value || '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { success: true, detail: `Typed into: ${action.target}`, timestamp };
  }

  _executeScroll(action, root, timestamp) {
    const amount = action.amount || 300;
    const direction = action.direction || 'down';
    const scrollY = direction === 'down' ? amount : -amount;
    
    if (action.target) {
      const el = this._findElement(action.target, root);
      el.scrollBy({ top: scrollY, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: scrollY, behavior: 'smooth' });
    }
    return { success: true, detail: `Scrolled ${direction} by ${amount}px`, timestamp };
  }

  _executeSelect(action, root, timestamp) {
    const el = this._findElement(action.target, root);
    if (el.tagName !== 'SELECT') {
      throw new Error(`Cannot select on ${el.tagName}`);
    }
    el.value = action.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { success: true, detail: `Selected "${action.value}" in: ${action.target}`, timestamp };
  }

  _executeNavigate(action, timestamp) {
    // In demo mode, we just log it rather than actually navigating
    return { success: true, detail: `[Demo] Navigate to: ${action.url}`, timestamp };
  }

  async _executeWait(action, timestamp) {
    const duration = action.duration || 1000;
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { success: true, detail: `Waited ${duration}ms`, timestamp };
  }

  _executeExtract(action, root, timestamp) {
    const el = this._findElement(action.target, root);
    const text = el.textContent?.trim() || '';
    return { success: true, detail: `Extracted: "${text.substring(0, 100)}"`, timestamp, data: text };
  }
}

/**
 * Factory: Create the appropriate action executor.
 * @param {'web' | 'chrome' | 'firefox'} mode
 * @returns {ActionExecutor}
 */
export function createActionExecutor(mode = 'web') {
  switch (mode) {
    case 'chrome':
    case 'firefox':
      // Future: Chrome/Firefox extension script executor
      return new DirectDOMExecutor(); // fallback for now
    case 'web':
    default:
      return new DirectDOMExecutor();
  }
}

export { ActionExecutor, DirectDOMExecutor };
