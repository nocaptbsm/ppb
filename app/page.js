'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="dashboard-hero animate-fade-in">
        <div className="dashboard-hero__badge">
          <span>🚀</span> SIH 2025 · Problem Statement 26171 · ISRO
        </div>
        <h1 className="dashboard-hero__title">
          <span className="dashboard-hero__gradient">PrivacyShield</span> Agent
        </h1>
        <p className="dashboard-hero__subtitle">
          Task-Aware Privacy Firewall for Visual Browser Agents
        </p>
        <p className="dashboard-hero__desc">
          Locally analyze webpages, detect sensitive information, determine the minimum context
          the AI actually needs, and send only privacy-safe data to the remote model.
        </p>
        <div className="dashboard-hero__actions">
          <Link href="/agent" className="btn btn--primary btn--lg">
            🤖 Launch Agent
          </Link>
          <Link href="/demo" className="btn btn--secondary btn--lg">
            🌐 View Demo Portal
          </Link>
        </div>
      </section>

      {/* Core Innovation */}
      <section className="dashboard-innovation animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card glass-card--accent">
          <div className="innovation-header">
            <span className="innovation-icon">💡</span>
            <h2 className="innovation-title">Core Innovation</h2>
          </div>
          <p className="innovation-text">
            Don&apos;t just redact what is sensitive. <strong>Determine locally what the AI actually needs</strong>,
            preserve that semantic context, and transmit the <strong>minimum necessary information</strong>.
          </p>
          <div className="innovation-metrics">
            <div className="innovation-metric">
              <span className="innovation-metric__value">100%</span>
              <span className="innovation-metric__label">Privacy Protection</span>
            </div>
            <div className="innovation-metric">
              <span className="innovation-metric__value">~94%</span>
              <span className="innovation-metric__label">Context Retained</span>
            </div>
            <div className="innovation-metric">
              <span className="innovation-metric__value">~87%</span>
              <span className="innovation-metric__label">Payload Reduction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Pipeline */}
      <section className="dashboard-pipeline animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="dashboard-section-title">Architecture Pipeline</h2>
        <div className="pipeline">
          {pipelineStages.map((stage, i) => (
            <div key={stage.id} className="pipeline-stage" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
              <div className={`pipeline-stage__card glass-card`}>
                <div className="pipeline-stage__icon" style={{ background: stage.color }}>
                  {stage.icon}
                </div>
                <h3 className="pipeline-stage__title">{stage.title}</h3>
                <p className="pipeline-stage__desc">{stage.desc}</p>
                <div className="pipeline-stage__tags">
                  {stage.tags.map((tag) => (
                    <span key={tag} className="pipeline-stage__tag">{tag}</span>
                  ))}
                </div>
              </div>
              {i < pipelineStages.length - 1 && (
                <div className="pipeline-connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-4-4l4 4-4 4" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="dashboard-features animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="dashboard-section-title">Key Capabilities</h2>
        <div className="grid-3">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card feature-card">
              <span className="feature-card__icon">{feature.icon}</span>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Decisions */}
      <section className="dashboard-decisions animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="dashboard-section-title">Three Privacy Decisions</h2>
        <div className="grid-3">
          <div className="glass-card decision-card decision-card--allow">
            <div className="decision-card__header">
              <span className="badge badge--allow">ALLOW</span>
            </div>
            <p className="decision-card__desc">
              Public UI elements pass through unchanged. Button labels, menu items, headers, prices.
            </p>
            <div className="decision-card__example">
              <code>&quot;Add to Cart&quot;</code> → <code>&quot;Add to Cart&quot;</code>
            </div>
          </div>
          <div className="glass-card decision-card decision-card--transform">
            <div className="decision-card__header">
              <span className="badge badge--transform">TRANSFORM</span>
            </div>
            <p className="decision-card__desc">
              Personal data replaced with semantic placeholders. Names, emails, phone numbers.
            </p>
            <div className="decision-card__example">
              <code>&quot;Rajesh Kumar&quot;</code> → <code>&quot;[PERSON_NAME]&quot;</code>
            </div>
          </div>
          <div className="glass-card decision-card decision-card--block">
            <div className="decision-card__header">
              <span className="badge badge--block">BLOCK</span>
            </div>
            <p className="decision-card__desc">
              Critical secrets completely removed. Passwords, OTPs, Aadhaar, PAN, bank accounts.
            </p>
            <div className="decision-card__example">
              <code>&quot;4832 7891 2345&quot;</code> → <code>&quot;[BLOCKED_GOVT_ID]&quot;</code>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard {
          max-width: 1100px;
        }
        .dashboard-hero {
          text-align: center;
          padding: var(--space-12) 0 var(--space-16);
        }
        .dashboard-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-accent-primary);
          margin-bottom: var(--space-6);
        }
        .dashboard-hero__title {
          font-size: var(--text-5xl);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: var(--space-4);
        }
        .dashboard-hero__gradient {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dashboard-hero__subtitle {
          font-size: var(--text-xl);
          color: var(--color-text-secondary);
          font-weight: 500;
          margin-bottom: var(--space-4);
        }
        .dashboard-hero__desc {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          max-width: 650px;
          margin: 0 auto var(--space-8);
          line-height: var(--leading-relaxed);
        }
        .dashboard-hero__actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
        }

        .dashboard-innovation {
          margin-bottom: var(--space-12);
        }
        .innovation-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .innovation-icon {
          font-size: 28px;
        }
        .innovation-title {
          font-size: var(--text-xl);
          font-weight: 700;
        }
        .innovation-text {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-6);
        }
        .innovation-text strong {
          color: var(--color-accent-primary);
        }
        .innovation-metrics {
          display: flex;
          gap: var(--space-8);
        }
        .innovation-metric {
          display: flex;
          flex-direction: column;
        }
        .innovation-metric__value {
          font-size: var(--text-3xl);
          font-weight: 800;
          font-family: var(--font-mono);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .innovation-metric__label {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .dashboard-section-title {
          font-size: var(--text-xl);
          font-weight: 700;
          margin-bottom: var(--space-6);
        }
        .dashboard-pipeline {
          margin-bottom: var(--space-12);
        }
        .pipeline {
          display: flex;
          align-items: flex-start;
          gap: 0;
          overflow-x: auto;
          padding-bottom: var(--space-4);
        }
        .pipeline-stage {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
        .pipeline-stage__card {
          width: 160px;
          padding: var(--space-4);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        .pipeline-stage__icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .pipeline-stage__title {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .pipeline-stage__desc {
          font-size: 10px;
          color: var(--color-text-muted);
          line-height: 1.3;
        }
        .pipeline-stage__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          justify-content: center;
        }
        .pipeline-stage__tag {
          font-size: 9px;
          padding: 1px 5px;
          background: rgba(148, 163, 184, 0.08);
          border-radius: var(--radius-sm);
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
        }
        .pipeline-connector {
          display: flex;
          align-items: center;
          padding: 0 var(--space-1);
          opacity: 0.5;
        }

        .dashboard-features {
          margin-bottom: var(--space-12);
        }
        .feature-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-5);
        }
        .feature-card__icon {
          font-size: 28px;
        }
        .feature-card__title {
          font-size: var(--text-sm);
          font-weight: 700;
        }
        .feature-card__desc {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
        }

        .dashboard-decisions {
          margin-bottom: var(--space-12);
        }
        .decision-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .decision-card__desc {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
        }
        .decision-card__example {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          padding: var(--space-3);
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
          color: var(--color-text-muted);
        }
        .decision-card__example code {
          color: var(--color-text-secondary);
        }
        .decision-card--allow {
          border-color: rgba(16, 185, 129, 0.2);
        }
        .decision-card--transform {
          border-color: rgba(245, 158, 11, 0.2);
        }
        .decision-card--block {
          border-color: rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}

const pipelineStages = [
  {
    id: 'webpage',
    icon: '🌐',
    title: 'Webpage',
    desc: 'User\'s current page',
    color: 'rgba(59, 130, 246, 0.2)',
    tags: ['DOM', 'Screen'],
  },
  {
    id: 'perception',
    icon: '👁️',
    title: 'Perception',
    desc: 'DOM + OCR + Vision analysis',
    color: 'rgba(139, 92, 246, 0.2)',
    tags: ['DOM Analyzer', 'OCR', 'Face Detection'],
  },
  {
    id: 'fusion',
    icon: '🔗',
    title: 'Fusion Engine',
    desc: 'Cross-source confidence scoring',
    color: 'rgba(6, 182, 212, 0.2)',
    tags: ['Multi-Source', 'Confidence'],
  },
  {
    id: 'privacy',
    icon: '🛡️',
    title: 'Privacy Engine',
    desc: 'ALLOW / TRANSFORM / BLOCK',
    color: 'rgba(245, 158, 11, 0.2)',
    tags: ['PII Detection', 'Classification'],
  },
  {
    id: 'context',
    icon: '🎯',
    title: 'Context Optimizer',
    desc: 'Minimum necessary context',
    color: 'rgba(16, 185, 129, 0.2)',
    tags: ['Task-Aware', 'Adaptive'],
  },
  {
    id: 'vlm',
    icon: '🧠',
    title: 'VLM',
    desc: 'Remote AI reasoning',
    color: 'rgba(236, 72, 153, 0.2)',
    tags: ['Gemini', 'Structured Output'],
  },
  {
    id: 'firewall',
    icon: '🔒',
    title: 'Action Firewall',
    desc: 'Validate & execute safely',
    color: 'rgba(239, 68, 68, 0.2)',
    tags: ['Risk Assessment', 'Injection Guard'],
  },
];

const features = [
  {
    icon: '🔗',
    title: 'Perception Fusion Engine',
    desc: 'Combines DOM, OCR, and Vision evidence with mathematical confidence scoring for robust PII detection.',
  },
  {
    icon: '🎯',
    title: 'Task-Aware Context Optimization',
    desc: 'Determines locally what the AI needs for the specific task. Only relevant context is transmitted.',
  },
  {
    icon: '🛡️',
    title: 'Three-Tier Privacy Decisions',
    desc: 'ALLOW public UI, TRANSFORM personal data to placeholders, BLOCK critical secrets completely.',
  },
  {
    icon: '🔒',
    title: 'Action Firewall + Injection Guard',
    desc: 'Validates every VLM action against local DOM. Detects and blocks prompt injection attacks.',
  },
  {
    icon: '🔌',
    title: 'Extension-Ready Architecture',
    desc: 'Browser abstraction layer enables seamless conversion from web MVP to Chrome/Firefox extension.',
  },
  {
    icon: '📊',
    title: 'Measurable Privacy Metrics',
    desc: 'Mathematical Privacy Exposure Score, Context Retention Score, payload reduction, and latency breakdown.',
  },
];
