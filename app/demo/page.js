'use client';

import ScenarioSelector from '@/components/demo/ScenarioSelector';
import DemoPortal from '@/components/demo/DemoPortal';

export default function DemoPage() {
  return (
    <div className="demo-page">
      <div className="demo-page__header animate-fade-in">
        <h2 className="demo-page__title">Demo Portal</h2>
        <p className="demo-page__desc">
          Select a scenario to load a controlled test webpage. Each scenario contains
          different types of PII with ground-truth annotations for evaluating detection accuracy.
        </p>
      </div>

      <ScenarioSelector />

      <div className="demo-page__portal animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <DemoPortal />
      </div>

      <style jsx>{`
        .demo-page {
          max-width: 900px;
        }
        .demo-page__header {
          margin-bottom: var(--space-6);
        }
        .demo-page__title {
          font-size: var(--text-2xl);
          font-weight: 700;
          margin-bottom: var(--space-2);
        }
        .demo-page__desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
        }
        .demo-page__portal {
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}
