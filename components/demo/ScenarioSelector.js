'use client';

import { useAgent } from '@/context/AgentContext';
import { SCENARIOS, SCENARIO_LABELS } from '@/lib/utils/constants';

const scenarioMeta = {
  [SCENARIOS.GOVERNMENT]: { icon: '🏛️', desc: 'Aadhaar, PAN, Name, Address', color: '#1a237e' },
  [SCENARIOS.BANKING]: { icon: '🏦', desc: 'Account, Card, OTP, Password', color: '#004d40' },
  [SCENARIOS.NORMAL]: { icon: '🛒', desc: 'Products, Prices, Reviews', color: '#e65100' },
  [SCENARIOS.ATTACK]: { icon: '⚠️', desc: 'Prompt Injection Attack', color: '#b71c1c' },
};

export default function ScenarioSelector() {
  const { state, actions } = useAgent();

  return (
    <div className="scenario-selector">
      <div className="section-title">Select Scenario</div>
      <div className="scenario-grid">
        {Object.entries(scenarioMeta).map(([key, meta]) => {
          const isActive = state.activeScenario === key;
          return (
            <button
              key={key}
              className={`scenario-btn ${isActive ? 'scenario-btn--active' : ''}`}
              onClick={() => actions.setScenario(key)}
              style={{ '--scenario-color': meta.color }}
            >
              <span className="scenario-btn__icon">{meta.icon}</span>
              <span className="scenario-btn__label">{SCENARIO_LABELS[key]}</span>
              <span className="scenario-btn__desc">{meta.desc}</span>
              {key === SCENARIOS.ATTACK && (
                <span className="scenario-btn__warning">⚡ Security Test</span>
              )}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .scenario-selector {
          margin-bottom: var(--space-6);
        }
        .scenario-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }
        .scenario-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-base);
          text-align: center;
        }
        .scenario-btn:hover {
          border-color: var(--color-border-hover);
          background: var(--color-bg-card-hover);
          transform: translateY(-2px);
        }
        .scenario-btn--active {
          border-color: var(--scenario-color);
          background: rgba(6, 182, 212, 0.08);
          box-shadow: 0 0 12px color-mix(in srgb, var(--scenario-color) 30%, transparent);
        }
        .scenario-btn__icon {
          font-size: 24px;
        }
        .scenario-btn__label {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .scenario-btn__desc {
          font-size: 10px;
          color: var(--color-text-muted);
          line-height: 1.3;
        }
        .scenario-btn__warning {
          font-size: 9px;
          color: var(--color-danger);
          font-weight: 700;
          padding: 1px 6px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-sm);
        }
        @media (max-width: 768px) {
          .scenario-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
