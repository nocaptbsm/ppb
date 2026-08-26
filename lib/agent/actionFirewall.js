/**
 * Action Firewall — Validates VLM actions against the original local DOM
 * and local privacy mappings. Protects user from high-risk executions.
 */

import { RISK_LEVELS, PII_TYPES, PRIVACY_DECISION, ACTION_TYPES } from '@/lib/utils/constants';
import { validateActionExfiltration } from './promptInjectionGuard';

/**
 * Validates a VLM action and assesses its security risk.
 * Restores sanitized placeholders with real PII locally if safe.
 * 
 * @param {Object} action - Action proposed by VLM { type, target, value }
 * @param {Object} originalDOM - The original, un-sanitized DOM tree
 * @param {Object} entityMap - Local placeholder mapping
 * @param {Array<Object>} piiEntities - Detected PII entities on page
 * @returns {Object} { riskLevel, allowedAction, message, isBlocked }
 */
export function validateAction(action, originalDOM, entityMap = {}, piiEntities = []) {
  // 1. Scan for exfiltration attacks
  const exfilCheck = validateActionExfiltration(action, entityMap);
  if (!exfilCheck.isSafe) {
    return {
      riskLevel: RISK_LEVELS.BLOCKED,
      allowedAction: null,
      message: `Blocked: Exfiltration attempt detected. (${exfilCheck.alerts[0].evidence})`,
      isBlocked: true,
    };
  }

  const actType = action.type;
  let targetSelector = action.target;
  let actionValue = action.value;
  let riskLevel = RISK_LEVELS.LOW;
  let message = 'Action is safe to execute.';

  // Scroll and Wait actions are low risk
  if (actType === ACTION_TYPES.SCROLL || actType === ACTION_TYPES.WAIT) {
    return { riskLevel, allowedAction: action, message, isBlocked: false };
  }

  // 2. Resolve target node in original DOM
  const targetNode = findNodeBySelector(originalDOM, targetSelector);
  if (!targetNode && actType !== ACTION_TYPES.NAVIGATE) {
    return {
      riskLevel: RISK_LEVELS.BLOCKED,
      allowedAction: null,
      message: `Blocked: Target selector "${targetSelector}" does not exist in the DOM.`,
      isBlocked: true,
    };
  }

  // 3. Assess risk based on action target type and privacy details
  const piiAnnotation = targetNode?.piiType || null;
  const isPasswordField = targetNode?.inputType === 'password' || piiAnnotation === PII_TYPES.PASSWORD;
  const isOTPField = piiAnnotation === PII_TYPES.OTP;

  // CRITICAL BLOCKED: VLM cannot touch passwords/OTPs directly
  if (isPasswordField || isOTPField) {
    return {
      riskLevel: RISK_LEVELS.BLOCKED,
      allowedAction: null,
      message: `Blocked: Autonomous interactions on Passwords or OTP fields are prohibited for safety.`,
      isBlocked: true,
    };
  }

  // 4. Form Submission checks (clicking Submit buttons)
  if (actType === ACTION_TYPES.CLICK) {
    const isSubmit = targetSelector.includes('submit') || 
                     targetNode.tag === 'button' && (targetSelector.includes('confirm') || targetSelector.includes('pay') || targetSelector.includes('buy') || targetSelector.includes('verify'));

    if (isSubmit) {
      riskLevel = RISK_LEVELS.HIGH;
      message = 'Form submission or payment action. Requires manual review.';
    } else if (targetNode.tag === 'button' || targetNode.tag === 'a') {
      riskLevel = RISK_LEVELS.MEDIUM;
      message = 'Interactive click on page button.';
    }
  }

  // 5. Data input checks (typing data)
  if (actType === ACTION_TYPES.TYPE) {
    riskLevel = RISK_LEVELS.MEDIUM;
    message = 'Entering input value.';

    // Check if the VLM is attempting to restore PII placeholders (e.g. typing "[PERSON_NAME]")
    // Local Firewall replaces "[PERSON_NAME]" with the real user name "Rajesh Kumar"
    if (actionValue) {
      let restored = false;
      
      // Look up placeholder in local entity map
      for (const [key, mapData] of Object.entries(entityMap)) {
        const placeholderToken = `[${mapData.piiType}]`; // e.g. [PERSON_NAME]
        
        if (actionValue.includes(placeholderToken) || actionValue.includes(key)) {
          // Replace token with original local value
          actionValue = actionValue.replace(placeholderToken, mapData.originalValue);
          actionValue = actionValue.replace(key, mapData.originalValue);
          restored = true;
        }
      }

      if (restored) {
        riskLevel = RISK_LEVELS.HIGH;
        message = 'Action fills personal PII details. User confirmation required.';
      }
      
      // If VLM outputs raw PII matching known blocked types, block it
      const hasGovID = /\b[2-9]{1}[0-9]{11}\b/.test(actionValue.replace(/[-\s]/g, '')) || 
                       /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(actionValue);
      if (hasGovID) {
        return {
          riskLevel: RISK_LEVELS.BLOCKED,
          allowedAction: null,
          message: 'Blocked: Attempted to submit unredacted government IDs.',
          isBlocked: true,
        };
      }
    }
  }

  const allowedAction = {
    ...action,
    value: actionValue, // updated restored value
  };

  return {
    riskLevel,
    allowedAction,
    message,
    isBlocked: false,
  };
}

/**
 * Find node in original semantic DOM tree by CSS selector.
 */
function findNodeBySelector(node, selector) {
  if (!node) return null;
  if (node.selector === selector) return node;
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeBySelector(child, selector);
      if (found) return found;
    }
  }
  return null;
}
