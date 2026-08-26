/**
 * Indian PII Patterns — Regex and matching logic for Indian government IDs and contact info.
 */

export const INDIAN_PATTERNS = {
  // Aadhaar Number: 12 digits, doesn't start with 0 or 1, matches with or without spaces/hyphens
  AADHAAR: /\b[2-9]{1}[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/,

  // PAN Number: 5 letters, 4 digits, 1 letter
  PAN: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,

  // Indian Mobile Number: Starts with 6, 7, 8, 9; optional +91 prefix
  PHONE_NUMBER: /(?:\+91[-\s]?)?[6-9]\d{9}\b/,

  // Indian Financial System Code (IFSC): 4 letters, 0, 6 alphanumeric characters
  IFSC_CODE: /\b[A-Z]{4}0[A-Z0-9]{6}\b/,

  // Indian Passport: 1 letter, 7 digits
  PASSPORT: /\b[A-Z][0-9]{7}\b/,

  // Voter ID Card (EPIC Number): 3 letters followed by 7 digits
  VOTER_ID: /\b[A-Z]{3}[0-9]{7}\b/,

  // Vehicle Registration Number (e.g. DL-3C-AB-1234, KA 51 MB 9999)
  VEHICLE_REG: /\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b/,
};

/**
 * Validate Aadhaar number using Verhoeff algorithm.
 * Aadhaar numbers use a Verhoeff checksum as their 12th digit.
 * 
 * @param {string} aadhaar - Aadhaar digits
 * @returns {boolean} True if checksum is valid
 */
export function validateAadhaar(aadhaar) {
  const digits = aadhaar.replace(/[-\s]/g, '');
  if (digits.length !== 12) return false;
  
  // Verhoeff multiplication, inverse and permutation tables
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];
  
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];
  
  const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  let c = 0;
  const reversedArray = digits.split('').reverse().map(Number);
  
  for (let i = 0; i < reversedArray.length; i++) {
    c = d[c][p[i % 8][reversedArray[i]]];
  }
  
  return c === 0;
}
