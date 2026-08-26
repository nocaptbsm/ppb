/**
 * Sensitivity Classifier — Resolves ALLOW, TRANSFORM, or BLOCK decisions
 * for PII candidates based on user settings, default policies, confidence, and page context.
 */

import { PRIVACY_DECISION, DEFAULT_SENSITIVITY, PII_TYPES } from '@/lib/utils/constants';

/**
 * Classifies a PII entity into ALLOW, TRANSFORM, or BLOCK.
 * 
 * @param {Object} piiEntity - Output from PII Detector
 * @param {string} policyOverride - Override policy setting ('strict' | 'balanced' | 'permissive')
 * @returns {string} PRIVACY_DECISION
 */
export function classifySensitivity(piiEntity, policyOverride = 'strict') {
  const piiType = piiEntity.piiType;
  
  if (!piiType) {
    return PRIVACY_DECISION.ALLOW;
  }

  // Get default decision from constants mapping
  let decision = DEFAULT_SENSITIVITY[piiType] || PRIVACY_DECISION.ALLOW;

  // Strict Policy adjustments: Upgrades low-confidence items to TRANSFORM or BLOCK (fail-safe)
  if (policyOverride === 'strict') {
    // If we have any doubt, treat as TRANSFORM
    if (piiEntity.confidence < 0.7 && decision === PRIVACY_DECISION.ALLOW) {
      decision = PRIVACY_DECISION.TRANSFORM;
    }
  }

  // Permissive Policy adjustments: Downgrades TRANSFORM items to ALLOW, but NEVER downgrades BLOCK items
  else if (policyOverride === 'permissive') {
    if (decision === PRIVACY_DECISION.TRANSFORM) {
      decision = PRIVACY_DECISION.ALLOW;
    }
  }

  // Balanced Policy: Standard defaults apply, except for specific contextual downgrades
  else if (policyOverride === 'balanced') {
    // If confidence is extremely low, and it's heuristics, maybe we allow it
    if (piiEntity.confidence < 0.6 && piiEntity.source === 'heuristics') {
      decision = PRIVACY_DECISION.ALLOW;
    }
  }

  // CRITICAL RULE: High-sensitivity IDs, passwords, and OTPs can NEVER be downgraded to ALLOW
  const absoluteBlockTypes = [
    PII_TYPES.PASSWORD,
    PII_TYPES.OTP,
    PII_TYPES.CVV,
    PII_TYPES.PIN,
    PII_TYPES.AADHAAR,
    PII_TYPES.PAN,
    PII_TYPES.BANK_ACCOUNT,
    PII_TYPES.CREDIT_CARD
  ];

  if (absoluteBlockTypes.includes(piiType) && decision !== PRIVACY_DECISION.BLOCK) {
    decision = PRIVACY_DECISION.BLOCK;
  }

  return decision;
}
