/**
 * OCR Engine — Wrapper around Tesseract.js for client-side text extraction.
 * Extracts text content and bounding box coordinates from screenshots.
 */

import { createWorker } from 'tesseract.js';

let sharedWorker = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initializes a shared Tesseract worker.
 * Reuses the worker to avoid the overhead of spawning it for each screenshot.
 */
async function getWorker() {
  if (sharedWorker) return sharedWorker;
  
  if (isInitializing) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // In Tesseract.js v5, createWorker is async and by default configures itself
      const worker = await createWorker({
        logger: () => {}, // suppress verbose logs in console
      });
      sharedWorker = worker;
      return worker;
    } catch (error) {
      console.error('Failed to initialize Tesseract worker:', error);
      isInitializing = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Run OCR on a base64 screenshot.
 * 
 * @param {string} base64Image - Base64 encoded PNG/JPEG screenshot
 * @returns {Promise<Array<{ text: string, bbox: { x: number, y: number, width: number, height: number }, confidence: number }>>}
 */
export async function runOCR(base64Image) {
  if (!base64Image) return [];

  const start = performance.now();
  try {
    const worker = await getWorker();
    
    // Perform recognition
    const { data } = await worker.recognize(base64Image);
    
    const words = [];
    
    // Extract words with bounding box coordinates and confidence
    if (data && data.words) {
      for (const word of data.words) {
        const text = word.text?.trim();
        // Skip short symbols or empty text
        if (!text || text.length < 2) continue;

        words.push({
          text,
          bbox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
          },
          confidence: (word.confidence || 0) / 100, // Normalize to 0-1
        });
      }
    }
    
    const duration = performance.now() - start;
    console.log(`[OCR] Extracted ${words.length} words in ${duration.toFixed(0)}ms`);
    return words;
  } catch (error) {
    console.error('[OCR] Error running optical character recognition:', error);
    return [];
  }
}

/**
 * Clean up the shared worker resources.
 */
export async function terminateOCR() {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
    isInitializing = false;
    initPromise = null;
  }
}
