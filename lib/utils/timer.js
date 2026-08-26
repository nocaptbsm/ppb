/* ── Performance Timer Utility ── */

/**
 * Creates a timer for measuring pipeline stage latency.
 * Uses performance.now() for high-precision timing.
 */
export function createTimer() {
  const stages = {};
  let currentStage = null;
  let currentStart = null;

  return {
    /**
     * Start timing a named stage.
     */
    start(stageName) {
      if (currentStage) {
        this.end();
      }
      currentStage = stageName;
      currentStart = performance.now();
    },

    /**
     * End timing the current stage.
     * @returns {number} Duration in milliseconds.
     */
    end() {
      if (!currentStage || !currentStart) return 0;
      const duration = performance.now() - currentStart;
      stages[currentStage] = duration;
      const ended = currentStage;
      currentStage = null;
      currentStart = null;
      return duration;
    },

    /**
     * Measure an async function's execution time.
     * @param {string} stageName
     * @param {Function} fn - Async function to time.
     * @returns {Promise<*>} The function's return value.
     */
    async measure(stageName, fn) {
      this.start(stageName);
      try {
        const result = await fn();
        this.end();
        return result;
      } catch (err) {
        this.end();
        throw err;
      }
    },

    /**
     * Get all recorded stage durations.
     * @returns {Object} Map of stage name → duration (ms).
     */
    getBreakdown() {
      return { ...stages };
    },

    /**
     * Get total time across all stages.
     * @returns {number} Total milliseconds.
     */
    getTotal() {
      return Object.values(stages).reduce((sum, d) => sum + d, 0);
    },

    /**
     * Reset all recorded timings.
     */
    reset() {
      Object.keys(stages).forEach((k) => delete stages[k]);
      currentStage = null;
      currentStart = null;
    },
  };
}

/**
 * Get JS heap usage if available (Chrome only).
 * @returns {{ usedJSHeapSize: number, totalJSHeapSize: number } | null}
 */
export function getHeapUsage() {
  if (typeof performance !== 'undefined' && performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
    };
  }
  return null;
}

/**
 * Measure the byte size of a payload (string or object).
 * @param {*} payload
 * @returns {number} Size in bytes.
 */
export function measurePayloadSize(payload) {
  if (typeof payload === 'string') {
    return new Blob([payload]).size;
  }
  return new Blob([JSON.stringify(payload)]).size;
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format milliseconds to human-readable string.
 * @param {number} ms
 * @returns {string}
 */
export function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
