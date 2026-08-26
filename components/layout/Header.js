'use client';

import { useAgent } from '@/context/AgentContext';
import { SCENARIO_LABELS } from '@/lib/utils/constants';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { state } = useAgent();
  const pathname = usePathname();

  const getPageTitle = (path) => {
    if (path === '/agent') return 'Agent Control Panel';
    if (path === '/demo') return 'Demo Portal';
    return 'PrivacyShield Dashboard';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">
            {getPageTitle(pathname)}
          </h1>
        </div>

        <div className="header-right">
          {/* Processing indicator */}
          {state.isProcessing && (
            <div className="header-processing">
              <span className="header-processing__dot" />
              <span className="header-processing__text">{state.processingStage || 'Processing...'}</span>
            </div>
          )}

          {/* Active scenario badge */}
          <div className="header-scenario">
            <span className="header-scenario__label">Scenario:</span>
            <span className="header-scenario__value">
              {SCENARIO_LABELS[state.activeScenario] || state.activeScenario}
            </span>
          </div>

          {/* Privacy status */}
          <div className="header-privacy-status" title="Privacy Protection Score">
            <span className="header-privacy-status__icon">🛡️</span>
            <span className="header-privacy-status__value">
              {state.privacyProtectionScore}%
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        .header-title {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-5);
        }
        .header-processing {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: var(--radius-full);
          animation: borderGlow 2s ease-in-out infinite;
        }
        .header-processing__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-accent-primary);
          animation: pulse 1s ease-in-out infinite;
        }
        .header-processing__text {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-accent-primary);
        }
        .header-scenario {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
        }
        .header-scenario__label {
          color: var(--color-text-muted);
        }
        .header-scenario__value {
          color: var(--color-text-primary);
          font-weight: 600;
          padding: 2px var(--space-3);
          background: var(--color-bg-elevated);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }
        .header-privacy-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: var(--radius-full);
          cursor: default;
        }
        .header-privacy-status__icon {
          font-size: 14px;
        }
        .header-privacy-status__value {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-allow);
          font-family: var(--font-mono);
        }
      `}</style>
    </header>
  );
}
