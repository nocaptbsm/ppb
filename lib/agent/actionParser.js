/**
 * Action Parser — Parses and validates JSON responses from the VLM.
 * Handles markdown formatting extraction and schema validation.
 */

import { ACTION_TYPES } from '@/lib/utils/constants';

/**
 * Parses VLM response text to extract the action JSON.
 * 
 * @param {string} responseText - Raw response text from VLM
 * @returns {Object} { action: Object, reasoning: string, isValid: boolean }
 */
export function parseVLMResponse(responseText) {
  let cleaned = responseText?.trim() || '';
  let action = { type: 'wait', target: null, value: null, confidence: 0 };
  let reasoning = 'Failed to parse VLM response.';
  let isValid = false;

  try {
    // 1. Remove markdown code blocks if present (```json ... ```)
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) {
        cleaned = match[1].trim();
      }
    }

    // 2. Parse JSON
    const parsed = JSON.parse(cleaned);
    
    if (parsed.action && parsed.action.type) {
      action = parsed.action;
      reasoning = parsed.reasoning || '';
      isValid = validateActionSchema(action);
    }
  } catch (error) {
    console.error('[ActionParser] Error parsing VLM response JSON:', error);
  }

  return {
    action,
    reasoning,
    isValid,
  };
}

/**
 * Validates that the action object complies with the defined browser primitives.
 */
function validateActionSchema(action) {
  const type = action.type;
  if (!Object.values(ACTION_TYPES).includes(type)) return false;

  if (type === ACTION_TYPES.CLICK || type === ACTION_TYPES.TYPE || type === ACTION_TYPES.SELECT) {
    // Structural actions must have target selector
    if (!action.target || typeof action.target !== 'string') return false;
  }

  if (type === ACTION_TYPES.TYPE && (action.value === undefined)) {
    return false;
  }

  return true;
}
