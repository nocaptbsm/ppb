/**
 * Policy Engine — Configures and executes privacy policies for PII detection.
 * Supports default profiles (strict, balanced, permissive) and overrides per PII type.
 */

import { SCENARIOS, DEFAULT_SENSITIVITY, PRIVACY_DECISION } from '@/lib/utils/constants';

/**
 * Gets the policy profile for a given scenario.
 * 
 * @param {string} scenario - Active scenario name
 * @returns {Object} Policy profile configuration
 */
export function getScenarioPolicy(scenario) {
  switch (scenario) {
    case SCENARIOS.BANKING:
      return {
        profileName: 'banking_strict',
        policyMode: 'strict',
        description: 'Maximum privacy security. All banking and gov IDs are strictly blocked.',
        customOverrides: {},
      };

    case SCENARIOS.GOVERNMENT:
      return {
        profileName: 'gov_strict',
        policyMode: 'strict',
        description: 'High security for government services. Redacts identifiers and personal data.',
        customOverrides: {},
      };

    case SCENARIOS.NORMAL:
      return {
        profileName: 'ecom_balanced',
        policyMode: 'balanced',
        description: 'Balanced profile. Public UI, products, and prices are allowed.',
        customOverrides: {},
      };

    case SCENARIOS.ATTACK:
      return {
        profileName: 'attack_sandbox',
        policyMode: 'strict',
        description: 'Sandbox testing mode. Detects injection scripts and isolates raw assets.',
        customOverrides: {},
      };

    default:
      return {
        profileName: 'default_balanced',
        policyMode: 'balanced',
        description: 'Standard security settings.',
        customOverrides: {},
      };
  }
}

/**
 * Evaluates the final decision for an entity type under the active policy.
 * 
 * @param {string} piiType - Type of PII (e.g. AADHAAR)
 * @param {Object} scenarioPolicy - Scenario policy config from getScenarioPolicy
 * @returns {string} PRIVACY_DECISION
 */
export function getDecisionForType(piiType, scenarioPolicy) {
  if (!piiType) return PRIVACY_DECISION.ALLOW;

  // 1. Check custom overrides in active policy
  if (scenarioPolicy?.customOverrides?.[piiType]) {
    return scenarioPolicy.customOverrides[piiType];
  }

  // 2. Check default sensitivity map
  let decision = DEFAULT_SENSITIVITY[piiType] || PRIVACY_DECISION.ALLOW;

  // 3. Scale decisions based on overall policyMode
  const mode = scenarioPolicy?.policyMode || 'balanced';
  
  if (mode === 'strict') {
    // Elevate TRANSFORM to BLOCK for key identifiers in strict mode
    if (decision === PRIVACY_DECISION.TRANSFORM && piiType.includes('ID')) {
      return PRIVACY_DECISION.BLOCK;
    }
  } else if (mode === 'permissive') {
    // Permissive mode relaxes TRANSFORM decisions, but preserves BLOCK constraints
    if (decision === PRIVACY_DECISION.TRANSFORM) {
      return PRIVACY_DECISION.ALLOW;
    }
  }

  return decision;
}
