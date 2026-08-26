'use client';

import { useAgent } from '@/context/AgentContext';
import DemoPortal from '@/components/demo/DemoPortal';
import AgentControlPanel from '@/components/agent/AgentControlPanel';
import { SCENARIOS } from '@/lib/utils/constants';

export default function AgentPage() {
  const { state } = useAgent();

  return (
    <div className="agent-workspace">
      {/* Left Panel: Webpage View (Demo Scenario) */}
      <div className="workspace-left">
        <div className="workspace-header">
          <div className="browser-chrome">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
            <div className="address-bar">
              🔒 https://demo.privacyshield.local/{state.activeScenario}
            </div>
          </div>
        </div>
        <div className="workspace-content custom-scrollbar">
          <DemoPortal />
        </div>
      </div>

      {/* Right Panel: Agent Control Panel */}
      <div className="workspace-right">
        <AgentControlPanel />
      </div>

      <style jsx>{`
        .agent-workspace {
          display: flex;
          height: calc(100vh - 64px); /* Subtract header height */
          width: 100%;
          background: var(--color-bg-primary);
          overflow: hidden;
        }

        .workspace-left {
          flex: 1 1 60%;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--color-border);
          background: #f8fafc;
        }

        .workspace-header {
          padding: var(--space-3) var(--space-4);
          background: #e2e8f0;
          border-bottom: 1px solid var(--color-border);
        }

        .browser-chrome {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: #ffffff;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          border: 1px solid #cbd5e1;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #f59e0b; }
        .dot-green { background: #10b981; }

        .address-bar {
          margin-left: var(--space-4);
          font-size: var(--text-xs);
          color: #475569;
          font-family: var(--font-mono);
          flex: 1;
        }

        .workspace-content {
          flex: 1;
          overflow-y: auto;
          position: relative;
        }

        .workspace-right {
          flex: 1 1 40%;
          min-width: 400px;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          background: var(--color-bg-primary);
          border-left: 1px solid var(--color-border);
          box-shadow: -4px 0 15px rgba(0,0,0,0.02);
          z-index: 10;
        }

        /* Custom Scrollbar for the panels */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
