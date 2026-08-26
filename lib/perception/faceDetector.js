/**
 * Face Detector — Client-side face detection using face-api.js.
 * Detects face regions in screenshots for privacy blurring.
 */

let faceapi = null;
let modelLoaded = false;
let isLoading = false;
let loadPromise = null;

// CDN URL for face-api.js weights (Tiny Face Detector)
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

/**
 * Dynamically imports face-api.js and loads the Tiny Face Detector model.
 * Runs strictly client-side.
 */
async function loadModel() {
  if (typeof window === 'undefined') return null;
  if (modelLoaded) return faceapi;
  if (isLoading) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      // Import face-api.js dynamically to prevent SSR compile issues
      const mod = await import('face-api.js');
      faceapi = mod.default || mod;
      
      // Load the tinyFaceDetector model weights from CDN
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      modelLoaded = true;
      isLoading = false;
      return faceapi;
    } catch (error) {
      console.error('[FaceDetector] Failed to load model weights:', error);
      isLoading = false;
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Detect faces in an image element or canvas.
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} imageSource - Canvas or Image element to analyze
 * @returns {Promise<Array<{ bbox: { x: number, y: number, width: number, height: number }, confidence: number }>>}
 */
export async function detectFaces(imageSource) {
  if (typeof window === 'undefined' || !imageSource) return [];

  const start = performance.now();
  try {
    const api = await loadModel();
    if (!api) return [];

    // Run tiny face detector with default threshold
    const detections = await api.detectAllFaces(
      imageSource, 
      new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
    );

    const faces = detections.map((det) => {
      const box = det.box;
      return {
        bbox: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        },
        confidence: det.score,
      };
    });

    const duration = performance.now() - start;
    console.log(`[FaceDetector] Found ${faces.length} faces in ${duration.toFixed(0)}ms`);
    return faces;
  } catch (error) {
    console.error('[FaceDetector] Error running face detection:', error);
    return [];
  }
}
