/**
 * PII Detector — Multi-layer PII detection engine.
 * Combines pattern matching, contextual clues, name heuristics, and ground truth annotations.
 */

import { PII_TYPES } from '@/lib/utils/constants';
import { INDIAN_PATTERNS, validateAadhaar } from './patterns/indian';
import { UNIVERSAL_PATTERNS, validateLuhn } from './patterns/universal';
import { identifyContextualPII } from './patterns/contextual';

// Common Indian names keywords for name heuristics
const INDIAN_NAME_MARKERS = [
  'kumar', 'singh', 'sharma', 'verma', 'patel', 'mehta', 'shah', 'desai', 'anand', 'gupta',
  'rajesh', 'priya', 'amit', 'sunita', 'vikram', 'anita', 'rahul', 'sanjay', 'pooja', 'neha',
  'arun', 'ajay', 'vijay', 'deepak', 'suresh', 'ramesh', 'aditya', 'karan', 'divya', 'rhea'
];

/**
 * Detect PII in a list of fused perception entities.
 * 
 * @param {Array<Object>} fusedEntities - Output from PerceptionFusionEngine
 * @returns {Array<Object>} Entities with detected piiType, value and confidence
 */
export function detectPII(fusedEntities) {
  const detected = [];

  for (const entity of fusedEntities) {
    const text = entity.text?.trim() || '';
    if (!text) continue;

    let detectedType = null;
    let detectionConfidence = entity.fusedConfidence || 0.5;
    let detectionSource = 'heuristics';

    // Layer 0: Ground Truth Dataset Annotations
    if (entity.piiType) {
      detectedType = entity.piiType;
      detectionConfidence = 1.0;
      detectionSource = 'annotation';
    }

    // Layer 1: Contextual checks (Passwords, OTPs, CVV, PIN, etc.)
    if (!detectedType) {
      const contextualType = identifyContextualPII(entity);
      if (contextualType) {
        detectedType = contextualType;
        detectionConfidence = Math.max(detectionConfidence, 0.9);
        detectionSource = 'contextual';
      }
    }

    // Layer 2: Regex & Validation checks (Aadhaar, PAN, Card, Email, Phone, etc.)
    if (!detectedType) {
      // 2.1 Aadhaar number
      if (INDIAN_PATTERNS.AADHAAR.test(text)) {
        const match = text.match(INDIAN_PATTERNS.AADHAAR)[0];
        const isValid = validateAadhaar(match);
        detectedType = PII_TYPES.AADHAAR;
        detectionConfidence = isValid ? 1.0 : 0.7; // high confidence if Verhoeff passes
        detectionSource = 'regex_validated';
      }
      // 2.2 PAN Card
      else if (INDIAN_PATTERNS.PAN.test(text)) {
        detectedType = PII_TYPES.PAN;
        detectionConfidence = 0.95;
        detectionSource = 'regex';
      }
      // 2.3 Email Address
      else if (UNIVERSAL_PATTERNS.EMAIL.test(text)) {
        detectedType = PII_TYPES.EMAIL;
        detectionConfidence = 1.0;
        detectionSource = 'regex';
      }
      // 2.4 Phone Number
      else if (INDIAN_PATTERNS.PHONE_NUMBER.test(text)) {
        // Boost phone number confidence if label is phone-related
        const isPhoneLabel = /phone|mobile|tel|contact/i.test(entity.label || '');
        detectedType = PII_TYPES.PHONE_NUMBER;
        detectionConfidence = isPhoneLabel ? 0.95 : 0.8;
        detectionSource = 'regex';
      }
      // 2.5 Credit Card
      else if (UNIVERSAL_PATTERNS.CREDIT_CARD.test(text)) {
        const match = text.match(UNIVERSAL_PATTERNS.CREDIT_CARD)[0];
        const isValid = validateLuhn(match);
        detectedType = PII_TYPES.CREDIT_CARD;
        detectionConfidence = isValid ? 1.0 : 0.7;
        detectionSource = 'regex_validated';
      }
      // 2.6 UPI ID
      else if (UNIVERSAL_PATTERNS.UPI_ID.test(text)) {
        detectedType = PII_TYPES.UPI_ID;
        detectionConfidence = 0.9;
        detectionSource = 'regex';
      }
      // 2.7 IFSC Code
      else if (INDIAN_PATTERNS.IFSC_CODE.test(text)) {
        detectedType = PII_TYPES.IFSC_CODE;
        detectionConfidence = 0.95;
        detectionSource = 'regex';
      }
      // 2.8 Voter ID
      else if (INDIAN_PATTERNS.VOTER_ID.test(text)) {
        detectedType = PII_TYPES.VOTER_ID;
        detectionConfidence = 0.9;
        detectionSource = 'regex';
      }
      // 2.9 Passport
      else if (INDIAN_PATTERNS.PASSPORT.test(text)) {
        detectedType = PII_TYPES.PASSPORT;
        detectionConfidence = 0.9;
        detectionSource = 'regex';
      }
      // 2.10 Date of Birth
      else if (UNIVERSAL_PATTERNS.DATE_OF_BIRTH.test(text)) {
        const isDOBLabel = /birth|dob|born|date/i.test(entity.label || '');
        detectedType = PII_TYPES.DATE_OF_BIRTH;
        detectionConfidence = isDOBLabel ? 0.95 : 0.7;
        detectionSource = 'regex';
      }
      // 2.11 IP Address
      else if (UNIVERSAL_PATTERNS.IP_ADDRESS.test(text)) {
        detectedType = PII_TYPES.IP_ADDRESS;
        detectionConfidence = 0.95;
        detectionSource = 'regex';
      }
    }

    // Layer 3: Heuristics (Indian Names, Addresses, etc.)
    if (!detectedType) {
      if (checkIsName(text, entity.label)) {
        detectedType = PII_TYPES.PERSON_NAME;
        detectionConfidence = 0.85;
        detectionSource = 'heuristics';
      } else if (checkIsAddress(text, entity.label)) {
        detectedType = PII_TYPES.ADDRESS;
        detectionConfidence = 0.8;
        detectionSource = 'heuristics';
      }
    }

    if (detectedType) {
      detected.push({
        ...entity,
        piiType: detectedType,
        value: text,
        confidence: Math.round(detectionConfidence * 100) / 100,
        source: detectionSource,
      });
    }
  }

  return detected;
}

/**
 * Heuristic check: Is this string likely a person's name?
 */
function checkIsName(text, label = '') {
  const clean = text.toLowerCase().trim();
  const labelClean = label.toLowerCase();
  
  // Explicit label cue
  if (labelClean.includes('name') || labelClean.includes('holder') || labelClean.includes('owner')) {
    // Names are typically 2-3 capitalized words, length between 3 and 30 characters
    if (/^[A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?$/.test(text)) {
      return true;
    }
  }

  // Check against common Indian name markers
  const words = clean.split(/\s+/);
  if (words.length >= 2 && words.length <= 4) {
    const hasMarker = words.some(word => INDIAN_NAME_MARKERS.includes(word));
    // Must also be formatted as capital letters (e.g. Rajesh Kumar)
    const isTitleCase = words.every(word => /^[A-Z]/.test(text.split(/\s+/)[words.indexOf(word)]));
    
    if (hasMarker && isTitleCase) {
      return true;
    }
  }

  return false;
}

/**
 * Heuristic check: Is this string likely an address?
 */
function checkIsAddress(text, label = '') {
  const clean = text.toLowerCase().trim();
  const labelClean = label.toLowerCase();

  if (labelClean.includes('address') || labelClean.includes('location')) {
    return true;
  }

  // Indian Address keywords: street, road, nagar, colony, apartment, flat, pin, floor
  const addressKeywords = ['road', 'nagar', 'colony', 'apartment', 'flat', 'floor', 'indiranagar', 'bengaluru', 'mumbai', 'delhi', 'pune', 'city', 'lane'];
  const hasMultipleKeywords = addressKeywords.filter(kw => clean.includes(kw)).length >= 2;
  
  // Must also contain digits (house number or pincode)
  const hasDigits = /\d+/.test(clean);

  return hasMultipleKeywords && hasDigits;
}
