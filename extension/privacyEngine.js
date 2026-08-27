// privacyEngine.js - Chrome Extension local PII sanitization engine
// Runs client-side in the extension popup.

const PII_TYPES = {
  PERSON_NAME: 'PERSON_NAME',
  PHONE_NUMBER: 'PHONE_NUMBER',
  EMAIL: 'EMAIL',
  AADHAAR: 'AADHAAR',
  PAN: 'PAN',
  CREDIT_CARD: 'CREDIT_CARD',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  IFSC_CODE: 'IFSC_CODE',
  UPI_ID: 'UPI_ID',
  PASSWORD: 'PASSWORD',
  OTP: 'OTP',
  CVV: 'CVV',
  ADDRESS: 'ADDRESS',
  DATE_OF_BIRTH: 'DATE_OF_BIRTH'
};

const PLACEHOLDERS = {
  PERSON_NAME: '[PERSON_NAME]',
  PHONE_NUMBER: '[PHONE_NUMBER]',
  EMAIL: '[EMAIL]',
  AADHAAR: '[BLOCKED_AADHAAR]',
  PAN: '[BLOCKED_PAN]',
  CREDIT_CARD: '[BLOCKED_CREDIT_CARD]',
  BANK_ACCOUNT: '[BLOCKED_ACCOUNT]',
  IFSC_CODE: '[IFSC_CODE]',
  UPI_ID: '[UPI_ID]',
  PASSWORD: '[BLOCKED_PASSWORD]',
  OTP: '[BLOCKED_OTP]',
  CVV: '[BLOCKED_CVV]',
  ADDRESS: '[ADDRESS_LOCATION]',
  DATE_OF_BIRTH: '[DATE_OF_BIRTH]'
};

const PRIVACY_DECISION = {
  ALLOW: 'ALLOW',
  TRANSFORM: 'TRANSFORM',
  BLOCK: 'BLOCK'
};

// Patterns
const INDIAN_PATTERNS = {
  AADHAAR: /\b\d{4}\s\d{4}\s\d{4}\b/,
  PAN: /\b[A-Z]{5}\d{4}[A-Z]\b/,
  PHONE_NUMBER: /\b(?:\+?91|0)?[-\s]?[6-9]\d{4}[-\s]?\d{5}\b/,
  IFSC_CODE: /\b[A-Z]{4}0[A-Z0-9]{6}\b/
};

const UNIVERSAL_PATTERNS = {
  EMAIL: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
  CREDIT_CARD: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})\b/,
  DATE_OF_BIRTH: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/,
  UPI_ID: /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/
};

const INDIAN_NAME_MARKERS = [
  'kumar', 'singh', 'sharma', 'verma', 'patel', 'mehta', 'shah', 'desai', 'anand', 'gupta',
  'rajesh', 'priya', 'amit', 'sunita', 'vikram', 'anita', 'rahul', 'sanjay', 'pooja', 'neha'
];

// Aadhaar validation (Verhoeff check)
function validateAadhaar(aadhaar) {
  const clean = aadhaar.replace(/\s+/g, '');
  if (clean.length !== 12) return false;
  
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
  const cleanReversed = clean.split('').reverse().map(Number);
  
  for (let i = 0; i < cleanReversed.length; i++) {
    c = d[c][p[i % 8][cleanReversed[i]]];
  }
  
  return c === 0;
}

// Luhn validation (Credit Card)
function validateLuhn(ccNum) {
  const clean = ccNum.replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i));
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Heuristics
function checkIsName(text, label = '') {
  const clean = text.toLowerCase().trim();
  const labelClean = label.toLowerCase();
  
  if (labelClean.includes('name') || labelClean.includes('holder') || labelClean.includes('owner')) {
    if (/^[A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?$/.test(text)) return true;
  }

  const words = clean.split(/\s+/);
  if (words.length >= 2 && words.length <= 4) {
    const hasMarker = words.some(word => INDIAN_NAME_MARKERS.includes(word));
    const isTitleCase = words.every(word => /^[A-Z]/.test(text.split(/\s+/)[words.indexOf(word)]));
    if (hasMarker && isTitleCase) return true;
  }
  return false;
}

function checkIsAddress(text, label = '') {
  const clean = text.toLowerCase().trim();
  const labelClean = label.toLowerCase();

  if (labelClean.includes('address') || labelClean.includes('location')) return true;

  const addressKeywords = ['road', 'nagar', 'colony', 'apartment', 'flat', 'floor', 'indiranagar', 'bengaluru', 'mumbai', 'delhi', 'pune', 'city', 'lane'];
  const hasMultipleKeywords = addressKeywords.filter(kw => clean.includes(kw)).length >= 2;
  const hasDigits = /\d+/.test(clean);

  return hasMultipleKeywords && hasDigits;
}

// Contextual cues (Password, OTP, CVV, PIN, etc.)
function identifyContextualPII(entity) {
  const label = (entity.label || '').toLowerCase();
  const id = (entity.id || '').toLowerCase();
  const typeAttr = (entity.inputType || '').toLowerCase();
  const placeholder = (entity.placeholder || '').toLowerCase();

  if (typeAttr === 'password' || label.includes('password') || id.includes('password')) {
    return PII_TYPES.PASSWORD;
  }
  if (label.includes('otp') || label.includes('one time password') || id.includes('otp')) {
    return PII_TYPES.OTP;
  }
  if (label.includes('cvv') || label.includes('cvc') || id.includes('cvv')) {
    return PII_TYPES.CVV;
  }
  if (label.includes('account number') || id.includes('accountnumber') || id.includes('acc-num')) {
    return PII_TYPES.BANK_ACCOUNT;
  }
  return null;
}

// Sensitivity classifier (ALLOW/TRANSFORM/BLOCK)
function classifySensitivity(piiEntity, policy = 'strict') {
  const type = piiEntity.piiType;

  // BLOCK Guarantee: Critical authentication secrets must always be BLOCKED
  const blockTypes = [PII_TYPES.PASSWORD, PII_TYPES.OTP, PII_TYPES.CVV, PII_TYPES.AADHAAR, PII_TYPES.PAN, PII_TYPES.CREDIT_CARD, PII_TYPES.BANK_ACCOUNT];
  if (blockTypes.includes(type)) {
    return PRIVACY_DECISION.BLOCK;
  }

  // Standard PII: TRANSFORM (Placeholders) under strict, but might be allowed under lenient
  const transformTypes = [PII_TYPES.PERSON_NAME, PII_TYPES.PHONE_NUMBER, PII_TYPES.EMAIL, PII_TYPES.ADDRESS, PII_TYPES.DATE_OF_BIRTH, PII_TYPES.UPI_ID, PII_TYPES.IFSC_CODE];
  if (transformTypes.includes(type)) {
    return policy === 'strict' ? PRIVACY_DECISION.TRANSFORM : PRIVACY_DECISION.ALLOW;
  }

  return PRIVACY_DECISION.ALLOW;
}

// Multi-layer PII detection in the DOM node tree
function extractPIIFromTree(node, detected = []) {
  if (!node) return detected;

  if (node.type === 'element') {
    const text = (node.directText || '').trim() || (node.value || '').trim();
    
    if (text) {
      let detectedType = null;
      let confidence = 0.5;

      // Ground truth dataset annotations in DOM
      if (node.piiType) {
        detectedType = node.piiType;
        confidence = 1.0;
      }

      // Contextual check
      if (!detectedType) {
        const contextual = identifyContextualPII(node);
        if (contextual) {
          detectedType = contextual;
          confidence = 0.9;
        }
      }

      // Regex check
      if (!detectedType) {
        if (INDIAN_PATTERNS.AADHAAR.test(text)) {
          const valid = validateAadhaar(text.match(INDIAN_PATTERNS.AADHAAR)[0]);
          detectedType = PII_TYPES.AADHAAR;
          confidence = valid ? 1.0 : 0.7;
        } else if (INDIAN_PATTERNS.PAN.test(text)) {
          detectedType = PII_TYPES.PAN;
          confidence = 0.95;
        } else if (UNIVERSAL_PATTERNS.EMAIL.test(text)) {
          detectedType = PII_TYPES.EMAIL;
          confidence = 1.0;
        } else if (INDIAN_PATTERNS.PHONE_NUMBER.test(text)) {
          detectedType = PII_TYPES.PHONE_NUMBER;
          confidence = 0.9;
        } else if (UNIVERSAL_PATTERNS.CREDIT_CARD.test(text)) {
          const valid = validateLuhn(text.match(UNIVERSAL_PATTERNS.CREDIT_CARD)[0]);
          detectedType = PII_TYPES.CREDIT_CARD;
          confidence = valid ? 1.0 : 0.7;
        } else if (UNIVERSAL_PATTERNS.UPI_ID.test(text)) {
          detectedType = PII_TYPES.UPI_ID;
          confidence = 0.9;
        } else if (INDIAN_PATTERNS.IFSC_CODE.test(text)) {
          detectedType = PII_TYPES.IFSC_CODE;
          confidence = 0.95;
        } else if (UNIVERSAL_PATTERNS.DATE_OF_BIRTH.test(text)) {
          detectedType = PII_TYPES.DATE_OF_BIRTH;
          confidence = 0.8;
        }
      }

      // Heuristic check
      if (!detectedType) {
        if (checkIsName(text, node.label)) {
          detectedType = PII_TYPES.PERSON_NAME;
          confidence = 0.85;
        } else if (checkIsAddress(text, node.label)) {
          detectedType = PII_TYPES.ADDRESS;
          confidence = 0.8;
        }
      }

      if (detectedType) {
        detected.push({
          selector: node.selector,
          piiType: detectedType,
          text: text,
          confidence,
          label: node.label,
          decision: classifySensitivity({ piiType: detectedType })
        });
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      extractPIIFromTree(child, detected);
    }
  }

  return detected;
}

// Sanitizes the semantic DOM tree recursively
function sanitizeDOMTree(domTree, classifiedEntities) {
  const entityMap = {};
  const sanitizedDOM = JSON.parse(JSON.stringify(domTree)); // clone

  for (const entity of classifiedEntities) {
    const decision = entity.decision;
    const piiType = entity.piiType;
    const rawValue = entity.text || '';
    const placeholder = PLACEHOLDERS[piiType] || '[REDACTED]';

    if (decision === PRIVACY_DECISION.TRANSFORM) {
      const placeholderKey = `${piiType}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      entityMap[placeholderKey] = {
        originalValue: rawValue,
        piiType,
        selector: entity.selector,
      };
      updateDOMNode(sanitizedDOM, entity.selector, placeholder);
    } 
    
    else if (decision === PRIVACY_DECISION.BLOCK) {
      // BLOCK guarantee: We do NOT write rawValue to entityMap
      updateDOMNode(sanitizedDOM, entity.selector, placeholder);
    }
  }

  return { sanitizedDOM, entityMap };
}

function updateDOMNode(node, selector, placeholder) {
  if (!node) return;

  if (node.selector === selector) {
    if (node.value) {
      node.value = placeholder;
    } else if (node.directText) {
      node.directText = placeholder;
    }
    if (node.children) {
      node.children = node.children.map(child => {
        if (child.type === 'text') {
          return { type: 'text', content: placeholder };
        }
        return child;
      });
    }
    return;
  }

  if (node.children) {
    for (const child of node.children) {
      updateDOMNode(child, selector, placeholder);
    }
  }
}

// Export module variables
window.PrivacyEngine = {
  PII_TYPES,
  PLACEHOLDERS,
  PRIVACY_DECISION,
  extractPIIFromTree,
  sanitizeDOMTree,
  classifySensitivity
};
