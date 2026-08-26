/**
 * Universal PII Patterns — Regex and validation logic for emails, credit cards, dates of birth, etc.
 */

export const UNIVERSAL_PATTERNS = {
  // Email address
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,

  // Credit Card (Visa, Mastercard, Amex, Discover, etc.)
  CREDIT_CARD: /\b(?:4[0-9]{12}(?:[0-9]{3})?|[25][0-9]{14}|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/,

  // Date of Birth (DD-MM-YYYY, YYYY-MM-DD, and DD/MM/YYYY)
  DATE_OF_BIRTH: /\b(?:0[1-9]|[12]\d|3[01])[-\/\s.](?:0[1-9]|1[0-2])[-\/\s.](?:19|20)\d{2}\b|\b(?:19|20)\d{2}[-\/\s.](?:0[1-9]|1[0-2])[-\/\s.](?:0[1-9]|[12]\d|3[01])\b/,

  // IPv4 Address
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,

  // UPI ID / VPA
  UPI_ID: /\b[\w.\-]+@[a-zA-Z]{3,}\b/,
};

/**
 * Validate Credit Card number using Luhn's algorithm.
 * 
 * @param {string} ccNum - Credit card number
 * @returns {boolean} True if card number checksum is valid
 */
export function validateLuhn(ccNum) {
  const digits = ccNum.replace(/[-\s]/g, '');
  if (!/^\d+$/.test(digits) || digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
}
