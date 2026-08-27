'use client';

import { useState } from 'react';
import { useAgent } from '@/context/AgentContext';
import BrowserAdapter from '@/lib/browser/browserAdapter';
import { fusePerceptionData } from '@/lib/perception/perceptionFusion';
import { detectPII } from '@/lib/privacy/piiDetector';
import { classifySensitivity } from '@/lib/privacy/sensitivityClassifier';
import { sanitizeContext } from '@/lib/privacy/sanitizer';
import { MetricsCalculator } from '@/lib/metrics/calculator';

export default function AgentControlPanel() {
  const { state, actions } = useAgent();
  const [command, setCommand] = useState('');
  const [activeTab, setActiveTab] = useState('command'); // command, privacy, logs

  const runAgent = async () => {
    if (!command.trim()) return;

    actions.setCommand(command);
    actions.setProcessing(true);
    actions.setProcessingStage('Capturing Webpage Context...');
    
    // Latency tracking
    const timings = { start: performance.now() };

    try {
      const adapter = BrowserAdapter.create('web');
      const rootElement = document.getElementById('demo-portal-root');

      // 1. Perception
      actions.setProcessingStage('Running Perception Engine...');
      const dom = await adapter.getDOM(rootElement);
      actions.setDOMTree(dom);

      const screenshotData = await adapter.captureScreenshot(rootElement);
      actions.setScreenshot(screenshotData?.base64);

      // Simulate Perception Fusion
      const fusedEntities = fusePerceptionData(dom, [], []);
      actions.setFusedEntities(fusedEntities);
      
      timings.perception = performance.now();

      // 2. Privacy Engine
      actions.setProcessingStage('Running Privacy Engine...');
      const detectedPII = detectPII(fusedEntities);
      
      const classifiedEntities = detectedPII.map(pii => ({
        ...pii,
        decision: classifySensitivity(pii, state.privacyPolicy)
      }));
      actions.setPIIEntities(classifiedEntities);

      const { sanitizedDOM, entityMap } = await sanitizeContext(dom, classifiedEntities, null);
      actions.setSanitizedData({ sanitizedDOM, sanitizedScreenshot: null, entityMap });
      
      timings.privacy = performance.now();

      // 3. VLM Analysis
      actions.setProcessingStage('Sending safe context to VLM...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          provider: state.vlmProvider,
          context: {
            contextMode: state.contextMode,
            dom: sanitizedDOM,
          }
        }),
      });

      const data = await response.json();
      timings.vlm = performance.now();

      if (!response.ok) {
        // Attack scenario or general error
        const isInjection = response.status === 403;
        actions.addActionHistory({
          id: Date.now(),
          command,
          action: { type: 'BLOCKED', target: 'FIREWALL' },
          reasoning: isInjection ? data.detail : (data.error || 'VLM Analysis failed'),
          latency: Math.round(performance.now() - timings.start),
          isBlocked: true,
          threatType: isInjection ? 'PROMPT_INJECTION' : 'ERROR'
        });
        throw new Error(data.error || 'VLM Analysis failed');
      }

      actions.setProposedAction(data.action);
      
      // Update history
      actions.addActionHistory({
        id: Date.now(),
        command,
        action: data.action,
        reasoning: data.reasoning,
        latency: data.latencyMs,
        isBlocked: false,
      });

      // 4. Action Execution
      actions.setProcessingStage('Executing Action on Page...');
      await new Promise(resolve => setTimeout(resolve, 600)); // visual delay
      await adapter.executeAction(data.action, rootElement);

      // Update real metrics
      const payloadStats = MetricsCalculator.calculatePayloadReduction(dom, sanitizedDOM, screenshotData?.base64, null);
      const privacyScores = MetricsCalculator.calculatePrivacyScores(classifiedEntities);
      const retentionScore = MetricsCalculator.calculateContextRetention(entityMap, dom);

      actions.setMetrics({
        exposureScore: privacyScores.exposureScore,
        protectionScore: privacyScores.protectionScore,
        contextRetention: retentionScore,
        payloadReduction: payloadStats
      });
      
      // Compute latency breakdown
      const percMs = Math.round(timings.perception - timings.start);
      const privMs = Math.round(timings.privacy - timings.perception);
      const vlmMs = Math.round(timings.vlm - timings.privacy);
      actions.setLatency({ perception: percMs, privacy: privMs, vlm: vlmMs, total: percMs + privMs + vlmMs });

      actions.setAnalysisComplete(true);

    } catch (err) {
      console.error('Agent Execution Failed:', err);
    } finally {
      actions.setProcessing(false);
      actions.setProcessingStage('');
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-tabs">
        <button className={`tab-btn ${activeTab === 'command' ? 'active' : ''}`} onClick={() => setActiveTab('command')}>Command</button>
        <button className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>Privacy Engine</button>
        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Action Log</button>
      </div>

      <div className="panel-content">
        {activeTab === 'command' && (
          <div className="command-view animate-fade-in">
            <h3>Issue Command</h3>
            <p className="helper-text">Enter a natural language command for the agent to execute on the webpage.</p>
            
            <div className="input-group">
              <input 
                type="text" 
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g. 'Submit my application'"
                disabled={state.isProcessing}
                className="command-input"
                onKeyDown={(e) => e.key === 'Enter' && runAgent()}
              />
              <button 
                className="btn btn--primary" 
                onClick={runAgent}
                disabled={state.isProcessing || !command.trim()}
              >
                {state.isProcessing ? 'Processing...' : 'Run'}
              </button>
            </div>

            {state.isProcessing && (
              <div className="processing-status">
                <div className="spinner"></div>
                <span>{state.processingStage}</span>
              </div>
            )}

            {state.proposedAction && !state.isProcessing && (
              <div className="proposed-action glass-card">
                <h4>VLM Response</h4>
                <div className="action-details">
                  <div className="detail-row"><strong>Type:</strong> <span className="action-badge">{state.proposedAction.type}</span></div>
                  <div className="detail-row"><strong>Target:</strong> <code>{state.proposedAction.target}</code></div>
                  {state.proposedAction.value && <div className="detail-row"><strong>Value:</strong> <code>{state.proposedAction.value}</code></div>}
                </div>
                <div className="action-reasoning">
                  <strong>Reasoning:</strong>
                  <p>{state.actionHistory[state.actionHistory.length - 1]?.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="privacy-view animate-fade-in">
            <h3>Privacy Dashboard</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{state.privacyProtectionScore}%</div>
                <div className="metric-label">Protection Score</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.contextRetentionScore}%</div>
                <div className="metric-label">Context Retained</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.payloadReduction.percent}%</div>
                <div className="metric-label">Payload Reduced</div>
              </div>
            </div>
            
            <div className="entity-map">
              <h4>Sanitization Map ({Object.keys(state.entityMap).length} entities)</h4>
              {Object.keys(state.entityMap).length > 0 ? (
                <ul className="entity-list">
                  {Object.entries(state.entityMap).map(([key, value]) => (
                    <li key={key}>
                      <span className="entity-key">{key}</span> 
                      <span className="entity-arrow">→</span> 
                      <span className="entity-val">{value.originalValue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="helper-text">No sensitive entities detected in the current context.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-view animate-fade-in">
            <h3>Action Log & Telemetry</h3>
            
            {/* Latency Waterfall */}
            {state.latencyBreakdown.total > 0 && (
              <div className="latency-waterfall">
                <h4>Pipeline Latency</h4>
                <div className="waterfall-bar">
                  <div className="waterfall-segment perception" style={{width: `${(state.latencyBreakdown.perception / state.latencyBreakdown.total) * 100}%`}}></div>
                  <div className="waterfall-segment privacy" style={{width: `${(state.latencyBreakdown.privacy / state.latencyBreakdown.total) * 100}%`}}></div>
                  <div className="waterfall-segment vlm" style={{width: `${(state.latencyBreakdown.vlm / state.latencyBreakdown.total) * 100}%`}}></div>
                </div>
                <div className="waterfall-legend">
                  <span><span className="dot perception"></span> Perception ({state.latencyBreakdown.perception}ms)</span>
                  <span><span className="dot privacy"></span> Privacy ({state.latencyBreakdown.privacy}ms)</span>
                  <span><span className="dot vlm"></span> VLM ({state.latencyBreakdown.vlm}ms)</span>
                </div>
              </div>
            )}

            {state.actionHistory.length > 0 ? (
              <div className="log-list">
                {state.actionHistory.map((log) => (
                  <div key={log.id} className={`log-item ${log.isBlocked ? 'log-item--blocked' : ''}`}>
                    <div className="log-header">
                      <span className="log-cmd">&quot;{log.command}&quot;</span>
                      <span className="log-time">{log.latency}ms</span>
                    </div>
                    {log.isBlocked && (
                       <div className="blocked-banner">
                         ⚠️ Blocked by {log.threatType === 'PROMPT_INJECTION' ? 'Prompt Injection Guard' : 'Action Firewall'}
                       </div>
                    )}
                    <div className="log-body">
                      <span className={`action-badge ${log.isBlocked ? 'blocked' : ''}`}>{log.action.type}</span>
                      <code>{log.action.target}</code>
                    </div>
                    {log.isBlocked && <p className="log-reasoning">{log.reasoning}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">No actions executed yet.</p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .control-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .panel-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(15, 23, 42, 0.35);
        }
        .tab-btn {
          flex: 1;
          padding: var(--space-3) 0;
          border: none;
          background: transparent;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--color-text-primary);
          background: rgba(255, 255, 255, 0.03);
        }
        .tab-btn.active {
          color: var(--color-accent-primary);
          border-bottom-color: var(--color-accent-primary);
        }
        
        .panel-content {
          flex: 1;
          padding: var(--space-6);
          overflow-y: auto;
        }
        
        h3 {
          font-size: var(--text-lg);
          font-weight: 700;
          margin-bottom: var(--space-2);
        }
        .helper-text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-5);
        }
        
        .input-group {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }
        .command-input {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
          transition: all var(--transition-fast);
        }
        .command-input:focus {
          outline: none;
          border-color: var(--color-accent-primary);
          background: var(--color-bg-secondary);
        }
        .command-input:disabled {
          background: var(--color-bg-tertiary);
          color: var(--color-text-secondary) !important;
          -webkit-text-fill-color: var(--color-text-secondary) !important;
          opacity: 0.8;
          cursor: not-allowed;
        }
        
        .processing-status {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(6, 182, 212, 0.05);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: var(--radius-md);
          color: var(--color-accent-primary);
          font-size: var(--text-sm);
          font-weight: 500;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(6, 182, 212, 0.3);
          border-top-color: var(--color-accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .proposed-action {
          margin-top: var(--space-6);
          padding: var(--space-5);
          background: #ffffff;
        }
        .proposed-action h4 {
          margin-bottom: var(--space-3);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .detail-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
          font-size: var(--text-sm);
        }
        .action-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
        }
        .action-reasoning {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px dashed var(--color-border);
          font-size: var(--text-sm);
        }
        .action-reasoning p {
          color: var(--color-text-secondary);
          margin-top: var(--space-2);
          font-style: italic;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .metric-card {
          background: #f8fafc;
          border: 1px solid var(--color-border);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          text-align: center;
        }
        .metric-value {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-accent-primary);
          margin-bottom: var(--space-1);
        }
        .metric-label {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          font-weight: 600;
        }

        .entity-map {
          margin-top: var(--space-6);
        }
        .entity-map h4 {
          margin-bottom: var(--space-3);
          font-size: var(--text-sm);
        }
        .entity-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .entity-list li {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          padding: var(--space-2) var(--space-3);
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }
        .entity-key {
          color: #d97706;
          font-family: var(--font-mono);
          font-weight: 600;
        }
        .entity-arrow {
          color: #94a3b8;
        }
        .entity-val {
          color: #475569;
        }

        .log-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .log-item {
          padding: var(--space-4);
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }
        .log-cmd {
          font-weight: 600;
          font-size: var(--text-sm);
        }
        .log-time {
          font-size: var(--text-xs);
          color: #94a3b8;
        }
        .log-body {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
        }
        .log-item--blocked {
          border-color: #fca5a5;
          background: #fef2f2;
        }
        .blocked-banner {
          font-size: var(--text-xs);
          font-weight: 700;
          color: #b91c1c;
          margin-bottom: var(--space-2);
        }
        .log-reasoning {
          font-size: var(--text-xs);
          color: #b91c1c;
          margin-top: var(--space-2);
          font-style: italic;
        }
        .action-badge.blocked {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Waterfall */
        .latency-waterfall {
          margin-bottom: var(--space-6);
          padding: var(--space-4);
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .latency-waterfall h4 {
          font-size: var(--text-sm);
          margin-bottom: var(--space-3);
        }
        .waterfall-bar {
          display: flex;
          height: 12px;
          background: #f1f5f9;
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--space-3);
        }
        .waterfall-segment.perception { background: #8b5cf6; }
        .waterfall-segment.privacy { background: #f59e0b; }
        .waterfall-segment.vlm { background: #ec4899; }
        
        .waterfall-legend {
          display: flex;
          gap: var(--space-4);
          font-size: 11px;
          color: var(--color-text-secondary);
        }
        .waterfall-legend .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }
        .waterfall-legend .dot.perception { background: #8b5cf6; }
        .waterfall-legend .dot.privacy { background: #f59e0b; }
        .waterfall-legend .dot.vlm { background: #ec4899; }
      `}</style>
    </div>
  );
}
