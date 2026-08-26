/* ── Metrics Calculator ── */

import { SENSITIVITY_WEIGHTS, PRIVACY_DECISION } from './constants';

/**
 * Calculate Privacy Exposure Score (PES).
 *
 * PES = Σ(weight_i × transmitted_i) / Σ(weight_i × present_i) × 100
 *
 * A score of 0% means no sensitive information was transmitted.
 * A score of 100% means all sensitive information was transmitted raw.
 *
 * @param {Array<{ type: string, decision: string, transmitted: boolean }>} entities
 * @returns {{ exposureScore: number, protectionScore: number }}
 */
export function calculatePrivacyExposure(entities) {
  let weightedPresent = 0;
  let weightedTransmitted = 0;

  for (const entity of entities) {
    const weight = SENSITIVITY_WEIGHTS[entity.decision] || 0;
    if (weight === 0) continue; // ALLOW items don't count

    weightedPresent += weight;
    if (entity.transmitted) {
      weightedTransmitted += weight;
    }
  }

  if (weightedPresent === 0) {
    return { exposureScore: 0, protectionScore: 100 };
  }

  const exposureScore = (weightedTransmitted / weightedPresent) * 100;
  const protectionScore = 100 - exposureScore;

  return {
    exposureScore: Math.round(exposureScore * 10) / 10,
    protectionScore: Math.round(protectionScore * 10) / 10,
  };
}

/**
 * Calculate Context Retention Score (CRS).
 *
 * CRS = (relevant elements retained / total semantic elements) × 100
 *
 * @param {number} totalElements - Total semantic elements on page
 * @param {number} retainedElements - Elements included in transmitted context
 * @returns {number} Score 0-100
 */
export function calculateContextRetention(totalElements, retainedElements) {
  if (totalElements === 0) return 100;
  return Math.round((retainedElements / totalElements) * 1000) / 10;
}

/**
 * Calculate Payload Reduction.
 *
 * @param {number} originalSize - Original payload size in bytes
 * @param {number} transmittedSize - Transmitted payload size in bytes
 * @returns {{ reductionPercent: number, originalSize: number, transmittedSize: number }}
 */
export function calculatePayloadReduction(originalSize, transmittedSize) {
  if (originalSize === 0) {
    return { reductionPercent: 0, originalSize: 0, transmittedSize: 0 };
  }

  const reductionPercent = ((originalSize - transmittedSize) / originalSize) * 100;

  return {
    reductionPercent: Math.round(reductionPercent * 10) / 10,
    originalSize,
    transmittedSize,
  };
}

/**
 * Calculate Precision, Recall, and F1 Score for PII detection.
 *
 * @param {Array<string>} detected - PII types detected by the system
 * @param {Array<string>} groundTruth - PII types actually present (from annotations)
 * @returns {{ precision: number, recall: number, f1: number }}
 */
export function calculatePrecisionRecall(detected, groundTruth) {
  const detectedSet = new Set(detected);
  const truthSet = new Set(groundTruth);

  let truePositives = 0;
  for (const item of detectedSet) {
    if (truthSet.has(item)) truePositives++;
  }

  const precision = detectedSet.size > 0 ? truePositives / detectedSet.size : 0;
  const recall = truthSet.size > 0 ? truePositives / truthSet.size : 0;
  const f1 = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  return {
    precision: Math.round(precision * 1000) / 10,
    recall: Math.round(recall * 1000) / 10,
    f1: Math.round(f1 * 1000) / 10,
  };
}

/**
 * Generate a summary metrics object.
 *
 * @param {Object} params
 * @returns {Object} Complete metrics summary
 */
export function generateMetricsSummary({
  entities = [],
  totalElements = 0,
  retainedElements = 0,
  originalPayloadSize = 0,
  transmittedPayloadSize = 0,
  latencyBreakdown = {},
  detected = [],
  groundTruth = [],
}) {
  const privacy = calculatePrivacyExposure(entities);
  const contextRetention = calculateContextRetention(totalElements, retainedElements);
  const payloadReduction = calculatePayloadReduction(originalPayloadSize, transmittedPayloadSize);
  const accuracy = calculatePrecisionRecall(detected, groundTruth);
  const totalLatency = Object.values(latencyBreakdown).reduce((sum, v) => sum + v, 0);

  return {
    privacy,
    contextRetention,
    payloadReduction,
    accuracy,
    latencyBreakdown,
    totalLatency: Math.round(totalLatency),
  };
}
