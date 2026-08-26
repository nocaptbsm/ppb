'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';
import { SCENARIOS, CONTEXT_MODES, BROWSER_MODES, VLM_PROVIDERS } from '@/lib/utils/constants';

/* ── Initial State ── */
const initialState = {
  // Browser
  browserMode: BROWSER_MODES.WEB,

  // Perception
  domTree: null,
  screenshot: null,
  ocrResults: [],
  faceDetections: [],
  fusedEntities: [],

  // Privacy
  piiEntities: [],
  privacyDecisions: [],
  sanitizedDOM: null,
  sanitizedScreenshot: null,
  entityMap: {},

  // Context Optimization
  contextMode: CONTEXT_MODES.DOM_ONLY,
  minimumContext: null,
  includedElements: [],
  excludedCategories: [],

  // Agent
  currentCommand: '',
  proposedAction: null,
  actionHistory: [],
  isProcessing: false,
  processingStage: '',
  injectionAlerts: [],

  // Metrics
  latencyBreakdown: {},
  privacyExposureScore: 0,
  privacyProtectionScore: 100,
  contextRetentionScore: 100,
  payloadReduction: { original: 0, transmitted: 0, percent: 0 },
  jsHeapDelta: 0,
  accuracy: { precision: 0, recall: 0, f1: 0 },

  // Settings
  activeScenario: SCENARIOS.GOVERNMENT,
  vlmProvider: VLM_PROVIDERS.GEMINI,
  privacyPolicy: 'strict',
  autoExecuteLowRisk: true,

  // UI State
  showFirewallModal: false,
  showSanitizationView: false,
  analysisComplete: false,
};

/* ── Action Types ── */
const ActionType = {
  SET_SCENARIO: 'SET_SCENARIO',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_PROCESSING_STAGE: 'SET_PROCESSING_STAGE',
  SET_DOM_TREE: 'SET_DOM_TREE',
  SET_SCREENSHOT: 'SET_SCREENSHOT',
  SET_OCR_RESULTS: 'SET_OCR_RESULTS',
  SET_FACE_DETECTIONS: 'SET_FACE_DETECTIONS',
  SET_FUSED_ENTITIES: 'SET_FUSED_ENTITIES',
  SET_PII_ENTITIES: 'SET_PII_ENTITIES',
  SET_PRIVACY_DECISIONS: 'SET_PRIVACY_DECISIONS',
  SET_SANITIZED_DATA: 'SET_SANITIZED_DATA',
  SET_CONTEXT_OPTIMIZATION: 'SET_CONTEXT_OPTIMIZATION',
  SET_COMMAND: 'SET_COMMAND',
  SET_PROPOSED_ACTION: 'SET_PROPOSED_ACTION',
  ADD_ACTION_HISTORY: 'ADD_ACTION_HISTORY',
  ADD_INJECTION_ALERT: 'ADD_INJECTION_ALERT',
  SET_METRICS: 'SET_METRICS',
  SET_LATENCY: 'SET_LATENCY',
  SHOW_FIREWALL_MODAL: 'SHOW_FIREWALL_MODAL',
  HIDE_FIREWALL_MODAL: 'HIDE_FIREWALL_MODAL',
  TOGGLE_SANITIZATION_VIEW: 'TOGGLE_SANITIZATION_VIEW',
  SET_ANALYSIS_COMPLETE: 'SET_ANALYSIS_COMPLETE',
  RESET: 'RESET',
};

/* ── Reducer ── */
function agentReducer(state, action) {
  switch (action.type) {
    case ActionType.SET_SCENARIO:
      return { ...initialState, activeScenario: action.payload, browserMode: state.browserMode };

    case ActionType.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };

    case ActionType.SET_PROCESSING_STAGE:
      return { ...state, processingStage: action.payload };

    case ActionType.SET_DOM_TREE:
      return { ...state, domTree: action.payload };

    case ActionType.SET_SCREENSHOT:
      return { ...state, screenshot: action.payload };

    case ActionType.SET_OCR_RESULTS:
      return { ...state, ocrResults: action.payload };

    case ActionType.SET_FACE_DETECTIONS:
      return { ...state, faceDetections: action.payload };

    case ActionType.SET_FUSED_ENTITIES:
      return { ...state, fusedEntities: action.payload };

    case ActionType.SET_PII_ENTITIES:
      return { ...state, piiEntities: action.payload };

    case ActionType.SET_PRIVACY_DECISIONS:
      return { ...state, privacyDecisions: action.payload };

    case ActionType.SET_SANITIZED_DATA:
      return {
        ...state,
        sanitizedDOM: action.payload.sanitizedDOM,
        sanitizedScreenshot: action.payload.sanitizedScreenshot,
        entityMap: action.payload.entityMap || {},
      };

    case ActionType.SET_CONTEXT_OPTIMIZATION:
      return {
        ...state,
        contextMode: action.payload.contextMode,
        minimumContext: action.payload.minimumContext,
        includedElements: action.payload.includedElements || [],
        excludedCategories: action.payload.excludedCategories || [],
      };

    case ActionType.SET_COMMAND:
      return { ...state, currentCommand: action.payload };

    case ActionType.SET_PROPOSED_ACTION:
      return { ...state, proposedAction: action.payload };

    case ActionType.ADD_ACTION_HISTORY:
      return {
        ...state,
        actionHistory: [...state.actionHistory, action.payload],
      };

    case ActionType.ADD_INJECTION_ALERT:
      return {
        ...state,
        injectionAlerts: [...state.injectionAlerts, action.payload],
      };

    case ActionType.SET_METRICS:
      return {
        ...state,
        privacyExposureScore: action.payload.exposureScore ?? state.privacyExposureScore,
        privacyProtectionScore: action.payload.protectionScore ?? state.privacyProtectionScore,
        contextRetentionScore: action.payload.contextRetention ?? state.contextRetentionScore,
        payloadReduction: action.payload.payloadReduction ?? state.payloadReduction,
        accuracy: action.payload.accuracy ?? state.accuracy,
        jsHeapDelta: action.payload.jsHeapDelta ?? state.jsHeapDelta,
      };

    case ActionType.SET_LATENCY:
      return { ...state, latencyBreakdown: action.payload };

    case ActionType.SHOW_FIREWALL_MODAL:
      return { ...state, showFirewallModal: true };

    case ActionType.HIDE_FIREWALL_MODAL:
      return { ...state, showFirewallModal: false };

    case ActionType.TOGGLE_SANITIZATION_VIEW:
      return { ...state, showSanitizationView: !state.showSanitizationView };

    case ActionType.SET_ANALYSIS_COMPLETE:
      return { ...state, analysisComplete: action.payload };

    case ActionType.RESET:
      return { ...initialState, activeScenario: state.activeScenario, browserMode: state.browserMode };

    default:
      return state;
  }
}

/* ── Context ── */
const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  const actions = {
    setScenario: useCallback((s) => dispatch({ type: ActionType.SET_SCENARIO, payload: s }), []),
    setProcessing: useCallback((v) => dispatch({ type: ActionType.SET_PROCESSING, payload: v }), []),
    setProcessingStage: useCallback((s) => dispatch({ type: ActionType.SET_PROCESSING_STAGE, payload: s }), []),
    setDOMTree: useCallback((t) => dispatch({ type: ActionType.SET_DOM_TREE, payload: t }), []),
    setScreenshot: useCallback((s) => dispatch({ type: ActionType.SET_SCREENSHOT, payload: s }), []),
    setOCRResults: useCallback((r) => dispatch({ type: ActionType.SET_OCR_RESULTS, payload: r }), []),
    setFaceDetections: useCallback((d) => dispatch({ type: ActionType.SET_FACE_DETECTIONS, payload: d }), []),
    setFusedEntities: useCallback((e) => dispatch({ type: ActionType.SET_FUSED_ENTITIES, payload: e }), []),
    setPIIEntities: useCallback((e) => dispatch({ type: ActionType.SET_PII_ENTITIES, payload: e }), []),
    setPrivacyDecisions: useCallback((d) => dispatch({ type: ActionType.SET_PRIVACY_DECISIONS, payload: d }), []),
    setSanitizedData: useCallback((d) => dispatch({ type: ActionType.SET_SANITIZED_DATA, payload: d }), []),
    setContextOptimization: useCallback((o) => dispatch({ type: ActionType.SET_CONTEXT_OPTIMIZATION, payload: o }), []),
    setCommand: useCallback((c) => dispatch({ type: ActionType.SET_COMMAND, payload: c }), []),
    setProposedAction: useCallback((a) => dispatch({ type: ActionType.SET_PROPOSED_ACTION, payload: a }), []),
    addActionHistory: useCallback((a) => dispatch({ type: ActionType.ADD_ACTION_HISTORY, payload: a }), []),
    addInjectionAlert: useCallback((a) => dispatch({ type: ActionType.ADD_INJECTION_ALERT, payload: a }), []),
    setMetrics: useCallback((m) => dispatch({ type: ActionType.SET_METRICS, payload: m }), []),
    setLatency: useCallback((l) => dispatch({ type: ActionType.SET_LATENCY, payload: l }), []),
    showFirewallModal: useCallback(() => dispatch({ type: ActionType.SHOW_FIREWALL_MODAL }), []),
    hideFirewallModal: useCallback(() => dispatch({ type: ActionType.HIDE_FIREWALL_MODAL }), []),
    toggleSanitizationView: useCallback(() => dispatch({ type: ActionType.TOGGLE_SANITIZATION_VIEW }), []),
    setAnalysisComplete: useCallback((v) => dispatch({ type: ActionType.SET_ANALYSIS_COMPLETE, payload: v }), []),
    reset: useCallback(() => dispatch({ type: ActionType.RESET }), []),
  };

  return (
    <AgentContext.Provider value={{ state, actions }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within an AgentProvider');
  return ctx;
}

export default AgentContext;
