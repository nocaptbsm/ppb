import { PRIVACY_DECISION } from '@/lib/utils/constants';

/**
 * Calculates metrics for the PrivacyShield Agent pipeline.
 */
export class MetricsCalculator {
  /**
   * Calculate payload reduction by comparing original DOM vs Sanitized DOM.
   * @param {Object} originalDom 
   * @param {Object} sanitizedDom 
   * @param {string|null} originalScreenshot 
   * @param {string|null} sanitizedScreenshot 
   * @returns {Object} { original, transmitted, percent }
   */
  static calculatePayloadReduction(originalDom, sanitizedDom, originalScreenshot, sanitizedScreenshot) {
    const origDomSize = JSON.stringify(originalDom || {}).length;
    const sanDomSize = JSON.stringify(sanitizedDom || {}).length;
    
    // Base64 images are typically around 133% of original size.
    // We count the byte length of the base64 string.
    const origImgSize = originalScreenshot ? originalScreenshot.length : 0;
    const sanImgSize = sanitizedScreenshot ? sanitizedScreenshot.length : 0;

    const originalSize = origDomSize + origImgSize;
    const transmittedSize = sanDomSize + sanImgSize;

    // If nothing to transmit, reduction is 0
    if (originalSize === 0) return { original: 0, transmitted: 0, percent: 0 };

    const reductionPercent = Math.max(0, Math.round(((originalSize - transmittedSize) / originalSize) * 100));

    return {
      original: originalSize,
      transmitted: transmittedSize,
      percent: reductionPercent,
    };
  }

  /**
   * Calculate privacy protection score based on detected vs successfully mitigated PII.
   * @param {Array<Object>} classifiedEntities 
   * @returns {Object} { protectionScore, exposureScore }
   */
  static calculatePrivacyScores(classifiedEntities = []) {
    if (classifiedEntities.length === 0) {
      return { protectionScore: 100, exposureScore: 0 };
    }

    let sensitiveCount = 0;
    let protectedCount = 0;
    let criticalExposure = 0;

    for (const entity of classifiedEntities) {
      // Anything that is TRANSFORM or BLOCK is considered protected.
      if (entity.decision === PRIVACY_DECISION.TRANSFORM || entity.decision === PRIVACY_DECISION.BLOCK) {
        protectedCount++;
      } else if (entity.decision === PRIVACY_DECISION.ALLOW) {
        // If it was detected as PII but allowed, it's an exposure.
        criticalExposure++;
      }
      sensitiveCount++;
    }

    const protectionScore = Math.round((protectedCount / sensitiveCount) * 100);
    const exposureScore = Math.min(100, Math.round((criticalExposure / sensitiveCount) * 100));

    return { protectionScore, exposureScore };
  }

  /**
   * Calculate context retention (how much of the original page meaning is retained).
   * @param {Object} entityMap 
   * @param {Object} originalDom 
   * @returns {number} 0-100 score
   */
  static calculateContextRetention(entityMap, originalDom) {
    // A heuristic approach: count total text nodes vs redacted placeholders.
    // If we only redacted a few specific entities, retention is very high (95-99%).
    // If we blocked everything, retention is low.
    
    let totalTextNodes = 0;
    
    function countTextNodes(node) {
      if (!node) return;
      if (node.type === 'text' || node.directText) totalTextNodes++;
      if (node.children) {
        node.children.forEach(countTextNodes);
      }
    }
    
    countTextNodes(originalDom);

    const redactedCount = Object.keys(entityMap).length;

    // Base score is 100. Each redaction drops the context retention slightly depending on the size of the DOM.
    // E.g. in a DOM of 100 text nodes, redacting 5 means 95% retention.
    
    if (totalTextNodes === 0) return 100;
    
    // We use a small penalty for each redaction because it breaks natural context slightly.
    const retention = Math.max(0, 100 - ((redactedCount / totalTextNodes) * 100));
    
    // Floor at 30% to represent that the core HTML structure is always retained.
    return Math.round(Math.max(30, Math.min(100, retention)));
  }
}
