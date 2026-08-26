/**
 * Sanitizer — Context-preserving sanitization of DOM tree and screenshot canvas.
 * Implements the BLOCK guarantee (deleting raw values) and draws visual overlays.
 */

import { PRIVACY_DECISION, PLACEHOLDERS, PII_TYPES } from '@/lib/utils/constants';

/**
 * Sanitizes the visual and structural context of a webpage.
 * 
 * @param {Object} domTree - Semantic DOM tree
 * @param {Array<Object>} classifiedEntities - Fused PII entities with sensitivity decisions
 * @param {HTMLCanvasElement} [canvas] - Screenshot canvas to redact (optional)
 * @returns {Promise<{ sanitizedDOM: Object, sanitizedScreenshot: string|null, entityMap: Object }>}
 */
export async function sanitizeContext(domTree, classifiedEntities, canvas = null) {
  const entityMap = {};
  
  // Clone DOM tree to avoid modifying the original tree
  const sanitizedDOM = JSON.parse(JSON.stringify(domTree));
  
  let canvasCtx = null;
  if (canvas) {
    canvasCtx = canvas.getContext('2d');
  }

  // 1. Process each entity
  for (const entity of classifiedEntities) {
    const decision = entity.decision;
    const piiType = entity.piiType;
    const rawValue = entity.text || '';
    const placeholder = PLACEHOLDERS[piiType] || '[REDACTED]';

    // Apply the BLOCK guarantee: Original value is NEVER stored in the local entityMap
    if (decision === PRIVACY_DECISION.TRANSFORM) {
      const placeholderKey = `${piiType}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      entityMap[placeholderKey] = {
        originalValue: rawValue,
        piiType,
        selector: entity.selector,
      };
      
      // Update DOM tree node
      updateDOMNode(sanitizedDOM, entity.selector, placeholder);
      
      // Visual redaction on canvas
      if (canvasCtx && entity.bbox) {
        drawRedactionOverlay(canvasCtx, entity.bbox, '#f59e0b', placeholder); // Amber for TRANSFORM
      }
    } 
    
    else if (decision === PRIVACY_DECISION.BLOCK) {
      // BLOCK guarantee: We do NOT write rawValue to entityMap
      // We just record that it was blocked, keeping the value strictly local to browser memory
      
      // Update DOM tree node
      updateDOMNode(sanitizedDOM, entity.selector, placeholder);
      
      // Visual redaction on canvas
      if (canvasCtx && entity.bbox) {
        drawRedactionOverlay(canvasCtx, entity.bbox, '#ef4444', placeholder); // Red for BLOCK
      }
    }

    // Process face redacts
    if (piiType === PII_TYPES.FACE && canvasCtx && entity.bbox) {
      blurFaceRegion(canvasCtx, entity.bbox);
      drawRedactionOverlay(canvasCtx, entity.bbox, '#8b5cf6', '[FACE_REDACTED]'); // Purple for face blur
    }
  }

  const sanitizedScreenshot = canvas ? canvas.toDataURL('image/png') : null;

  return {
    sanitizedDOM,
    sanitizedScreenshot,
    entityMap,
  };
}

/**
 * Traverses the cloned DOM tree and replaces value/text of matching node with placeholder.
 */
function updateDOMNode(node, selector, placeholder) {
  if (!node) return;

  if (node.selector === selector) {
    if (node.value) {
      node.value = placeholder;
    } else if (node.directText) {
      node.directText = placeholder;
    }
    // Also mask inside children text nodes
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

/**
 * Draws a solid overlay box with semantic label text on the canvas.
 */
function drawRedactionOverlay(ctx, bbox, color, labelText) {
  const pad = 2;
  const x = bbox.x - pad;
  const y = bbox.y - pad;
  const w = bbox.width + pad * 2;
  const h = bbox.height + pad * 2;

  // Draw background block
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  // Draw border outline
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Draw label text inside block if size permits
  if (w > 50 && h > 12) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Courier, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Truncate text if box is too small
    let text = labelText;
    if (ctx.measureText(text).width > w - 4) {
      text = labelText.replace('[', '').replace(']', '').substring(0, Math.floor(w / 7)) + '..';
    }
    
    ctx.fillText(text, x + w / 2, y + h / 2);
  }
}

/**
 * Apply simple pixelation/blur to a face region on the canvas.
 */
function blurFaceRegion(ctx, bbox) {
  const x = Math.max(0, bbox.x);
  const y = Math.max(0, bbox.y);
  const w = bbox.width;
  const h = bbox.height;

  if (w <= 0 || h <= 0) return;

  try {
    const imgData = ctx.getImageData(x, y, w, h);
    const data = imgData.data;

    // Simple pixelation effect
    const pixelSize = 8;
    for (let dy = 0; dy < h; dy += pixelSize) {
      for (let dx = 0; dx < w; dx += pixelSize) {
        // Get center pixel color
        const rIndex = ((dy + Math.floor(pixelSize / 2)) * w + (dx + Math.floor(pixelSize / 2))) * 4;
        if (rIndex >= data.length) continue;

        const r = data[rIndex];
        const g = data[rIndex + 1];
        const b = data[rIndex + 2];

        // Draw pixel block
        for (let py = 0; py < pixelSize && dy + py < h; py++) {
          for (let px = 0; px < pixelSize && dx + px < w; px++) {
            const pIndex = ((dy + py) * w + (dx + px)) * 4;
            data[pIndex] = r;
            data[pIndex + 1] = g;
            data[pIndex + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imgData, x, y);
  } catch (e) {
    // Fallback if canvas is cross-origin tainted
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(x, y, w, h);
  }
}
