/**
 * Contextual PII Patterns — Helper matches based on DOM elements and surroundings
 */

import { PII_TYPES } from '@/lib/utils/constants';

/**
 * Identify contextual PII using form fields, tags, and labels.
 * 
 * @param {Object} entity - Fused entity from PerceptionFusionEngine
 * @returns {string|null} Resolved PII type if matches contextual clues
 */
export function identifyContextualPII(entity) {
  const label = entity.label?.toLowerCase() || '';
  const placeholder = entity.placeholder?.toLowerCase() || '';
  const tag = entity.tag?.toLowerCase() || '';
  const id = entity.id?.toLowerCase() || '';
  const selector = entity.selector?.toLowerCase() || '';
  const value = entity.text || '';

  // 1. Password Field
  if (entity.inputType === 'password' || label.includes('password') || id.includes('password')) {
    return PII_TYPES.PASSWORD;
  }

  // 2. One Time Password (OTP) / Verification Code
  if (
    label.includes('otp') || 
    label.includes('one time password') || 
    label.includes('verification code') || 
    placeholder.includes('otp') ||
    id.includes('otp')
  ) {
    return PII_TYPES.OTP;
  }

  // 3. Credit Card CVV
  if (
    label.includes('cvv') || 
    label.includes('cvc') || 
    label.includes('card verification value') ||
    placeholder.includes('cvv') ||
    id.includes('cvv')
  ) {
    return PII_TYPES.CVV;
  }

  // 4. Pin code / MPIN
  if (
    label.includes('mpin') || 
    label.includes('transaction pin') ||
    id.includes('mpin') ||
    (label.includes('pin') && !label.includes('code')) // Avoid matching "pincode" / address zip
  ) {
    return PII_TYPES.PIN;
  }

  // 5. Secret Security Question Answer
  if (
    label.includes('security question') || 
    label.includes('secret answer') || 
    label.includes('mother\'s maiden') ||
    id.includes('security-question')
  ) {
    return PII_TYPES.SECRET_ANSWER;
  }

  // 6. Financial Amount (Only if it contains Rupee symbols or transaction keywords nearby)
  if (
    (tag !== 'button' && tag !== 'a') && 
    (label.includes('balance') || label.includes('amount') || label.includes('transaction limit') || id.includes('balance')) &&
    (/^[₹R]?\s?\d+(?:,\d{3})*(?:\.\d{2})?$/.test(value) || /^\d+\.\d{2}$/.test(value))
  ) {
    return PII_TYPES.FINANCIAL_AMOUNT;
  }

  return null;
}
