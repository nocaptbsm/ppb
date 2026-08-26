/* ── Screenshot Provider ──
 * Interface + MVP implementation (html2canvas).
 * Designed to be swapped for Chrome/Firefox extension APIs later.
 */

/**
 * Abstract ScreenshotProvider interface.
 * Implementations must provide a `capture()` method.
 */
class ScreenshotProvider {
  /**
   * Capture a screenshot of the given element or full page.
   * @param {HTMLElement} [element] - Target element (optional, defaults to full page)
   * @param {Object} [options] - Capture options
   * @returns {Promise<{ base64: string, width: number, height: number, captureTimeMs: number }>}
   */
  async capture(element, options = {}) {
    throw new Error('ScreenshotProvider.capture() must be implemented');
  }
}

/**
 * MVP Implementation: Uses html2canvas for in-page screenshot capture.
 * This works for the web application demo.
 */
class Html2CanvasProvider extends ScreenshotProvider {
  constructor() {
    super();
    this._html2canvas = null;
  }

  async _loadLib() {
    if (!this._html2canvas) {
      const mod = await import('html2canvas');
      this._html2canvas = mod.default || mod;
    }
    return this._html2canvas;
  }

  async capture(element, options = {}) {
    const html2canvas = await this._loadLib();
    const target = element || document.body;
    const start = performance.now();

    const canvas = await html2canvas(target, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      scale: options.scale || 1,
      logging: false,
      ...options,
    });

    const captureTimeMs = performance.now() - start;
    const base64 = canvas.toDataURL('image/png');

    return {
      base64,
      canvas,
      width: canvas.width,
      height: canvas.height,
      captureTimeMs: Math.round(captureTimeMs * 100) / 100,
    };
  }
}

/**
 * Stub for future Chrome Extension implementation.
 * Will use chrome.tabs.captureVisibleTab().
 */
class ChromeExtensionScreenshotProvider extends ScreenshotProvider {
  async capture(_element, _options = {}) {
    // Future: chrome.tabs.captureVisibleTab(null, { format: 'png' })
    throw new Error('ChromeExtensionScreenshotProvider not yet implemented');
  }
}

/**
 * Stub for future Firefox Extension implementation.
 * Will use browser.tabs.captureVisibleTab().
 */
class FirefoxExtensionScreenshotProvider extends ScreenshotProvider {
  async capture(_element, _options = {}) {
    // Future: browser.tabs.captureVisibleTab()
    throw new Error('FirefoxExtensionScreenshotProvider not yet implemented');
  }
}

/**
 * Factory: Create the appropriate screenshot provider.
 * @param {'web' | 'chrome' | 'firefox'} mode
 * @returns {ScreenshotProvider}
 */
export function createScreenshotProvider(mode = 'web') {
  switch (mode) {
    case 'chrome':
      return new ChromeExtensionScreenshotProvider();
    case 'firefox':
      return new FirefoxExtensionScreenshotProvider();
    case 'web':
    default:
      return new Html2CanvasProvider();
  }
}

export { ScreenshotProvider, Html2CanvasProvider };
