/**
 * Perception Fusion Engine — Merges DOM analysis, OCR text extraction,
 * and Vision face detections into a single, unified list of PII candidate entities.
 * Includes confidence scoring and spatial alignment algorithms.
 */

import { PII_TYPES, PRIVACY_DECISION } from '@/lib/utils/constants';

/**
 * Fuse evidence from DOM, OCR, and face detections.
 * 
 * @param {Object} domTree - Semantic DOM tree returned by DOMProvider
 * @param {Array} ocrWords - Flat list of words with bboxes and confidence from runOCR
 * @param {Array} faces - List of detected faces with bboxes from detectFaces
 * @returns {Array<Object>} Fused entities list
 */
export function fusePerceptionData(domTree, ocrWords = [], faces = []) {
  const start = performance.now();
  const fusedEntities = [];

  // 1. Flatten the DOM tree into a list of analyzeable elements
  const domElements = flattenDOMTree(domTree);

  // 2. Associate OCR words with DOM elements using spatial alignment (box overlap)
  const unmatchedOcrWords = [...ocrWords];
  
  for (const domEl of domElements) {
    // Only map OCR to elements that are actually visible on screen
    if (!domEl.bbox || domEl.bbox.width === 0 || domEl.bbox.height === 0) continue;

    const overlappingWords = [];
    
    // Find all OCR words that fit inside this DOM element's boundary
    for (let i = unmatchedOcrWords.length - 1; i >= 0; i--) {
      const ocrWord = unmatchedOcrWords[i];
      const overlapFraction = calculateOverlap(domEl.bbox, ocrWord.bbox);
      
      // If OCR word is mostly inside the DOM element
      if (overlapFraction > 0.6) {
        overlappingWords.push(ocrWord);
        unmatchedOcrWords.splice(i, 1); // remove from unmatched pool
      }
    }

    // If we have overlapping OCR words, combine them
    let ocrText = '';
    let ocrConfidence = 0;
    if (overlappingWords.length > 0) {
      // Sort words by X coordinate to reconstruct natural text flow
      overlappingWords.sort((a, b) => a.bbox.x - b.bbox.x);
      ocrText = overlappingWords.map(w => w.text).join(' ');
      ocrConfidence = overlappingWords.reduce((sum, w) => sum + w.confidence, 0) / overlappingWords.length;
    }

    // Determine initial entity characteristics
    const hasDomText = !!(domEl.directText || domEl.value);
    const hasOcrText = !!ocrText;

    if (hasDomText || hasOcrText || domEl.inputType === 'password') {
      const evidenceSources = [];
      if (hasDomText || domEl.inputType === 'password') evidenceSources.push('dom');
      if (hasOcrText) evidenceSources.push('ocr');

      // Calculate fused confidence score
      const domConfidence = getDOMConfidence(domEl);
      const fusedConfidence = calculateFusedConfidence(evidenceSources, domConfidence, ocrConfidence);

      fusedEntities.push({
        id: domEl.id,
        tag: domEl.tag,
        selector: domEl.selector,
        bbox: domEl.bbox,
        inputType: domEl.inputType,
        label: domEl.label,
        placeholder: domEl.placeholder,
        domText: domEl.directText || domEl.value || '',
        ocrText: ocrText,
        text: domEl.value || domEl.directText || ocrText, // fallback chain
        piiType: domEl.piiType || null, // ground truth annotation if present
        evidenceSources,
        fusedConfidence,
        confidenceBreakdown: {
          dom: domConfidence,
          ocr: ocrConfidence,
        }
      });
    }
  }

  // 3. Keep OCR words that did not match any DOM element (e.g. text in canvas, images)
  for (const ocrWord of unmatchedOcrWords) {
    fusedEntities.push({
      id: null,
      tag: 'canvas-text',
      selector: `ocr-text-${ocrWord.text}`,
      bbox: ocrWord.bbox,
      text: ocrWord.text,
      evidenceSources: ['ocr'],
      fusedConfidence: ocrWord.confidence,
      confidenceBreakdown: {
        dom: 0,
        ocr: ocrWord.confidence,
      }
    });
  }

  // 4. Fuse face detections (Vision)
  for (const face of faces) {
    // Check if face overlaps any DOM element (e.g. profile photo, avatar)
    let matchingDom = null;
    let maxOverlap = 0;

    for (const domEl of domElements) {
      if (domEl.tag === 'img' || domEl.className?.includes('avatar') || domEl.id?.includes('avatar')) {
        const overlap = calculateOverlap(domEl.bbox, face.bbox);
        if (overlap > maxOverlap && overlap > 0.4) {
          maxOverlap = overlap;
          matchingDom = domEl;
        }
      }
    }

    const evidenceSources = ['vision'];
    if (matchingDom) evidenceSources.push('dom');

    fusedEntities.push({
      id: matchingDom?.id || null,
      tag: matchingDom?.tag || 'face-region',
      selector: matchingDom?.selector || 'vision-face-region',
      bbox: face.bbox,
      text: '[FACE_IMAGE]',
      piiType: PII_TYPES.FACE, // Intrinsic face type
      evidenceSources,
      fusedConfidence: calculateFusedConfidence(evidenceSources, matchingDom ? 0.8 : 0, face.confidence),
      confidenceBreakdown: {
        dom: matchingDom ? 0.8 : 0,
        vision: face.confidence,
      }
    });
  }

  const duration = performance.now() - start;
  console.log(`[FusionEngine] Fused ${fusedEntities.length} entities in ${duration.toFixed(0)}ms`);
  return fusedEntities;
}

/**
 * Flatten tree structure into a simple array.
 */
function flattenDOMTree(node) {
  if (!node || node.type === 'text') return [];
  
  const list = [node];
  if (node.children) {
    for (const child of node.children) {
      list.push(...flattenDOMTree(child));
    }
  }
  return list;
}

/**
 * Calculate the fraction of box B that overlaps with box A.
 * Overlap = Area(A ∩ B) / Area(B)
 */
function calculateOverlap(rectA, rectB) {
  const xOverlap = Math.max(0, Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - Math.max(rectA.x, rectB.x));
  const yOverlap = Math.max(0, Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - Math.max(rectA.y, rectB.y));
  
  const intersectionArea = xOverlap * yOverlap;
  const areaB = rectB.width * rectB.height;
  
  if (areaB === 0) return 0;
  return intersectionArea / areaB;
}

/**
 * Determine a starting confidence score for a DOM element based on structural cues.
 */
function getDOMConfidence(element) {
  // If explicitly annotated with piiType dataset attribute, it is ground truth
  if (element.piiType) return 1.0;
  
  // Password fields are 100% sensitive by design
  if (element.inputType === 'password') return 1.0;
  
  // Explicit forms / interactive components have higher structure confidence
  if (element.isInteractive) {
    if (element.label || element.placeholder) return 0.9;
    return 0.7;
  }
  
  // Plain text nodes
  return 0.5;
}

/**
 * Standard union formula for multi-source probability fusion.
 * fused = 1 - ∏(1 - confidence_i)
 */
function calculateFusedConfidence(sources, domConf, secondaryConf) {
  if (sources.length === 1) {
    return sources[0] === 'dom' ? domConf : secondaryConf;
  }
  
  // Compute using union formula
  const d = domConf || 0;
  const s = secondaryConf || 0;
  return Math.round((1 - (1 - d) * (1 - s)) * 100) / 100;
}
