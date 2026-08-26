'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/lib/utils/constants';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: '🏠',
    description: 'System overview',
  },
  {
    label: 'Agent Panel',
    href: '/agent',
    icon: '🤖',
    description: 'Run the browser agent',
  },
  {
    label: 'Demo Portal',
    href: '/demo',
    icon: '🌐',
    description: 'Controlled test pages',
  },
];

const footerLinks = [
  { label: 'SIH 2025', icon: '🏆' },
  { label: 'ISRO', icon: '🚀' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo__icon">
          <span className="sidebar-logo__shield">🛡️</span>
        </div>
        <div className="sidebar-logo__text">
          <span className="sidebar-logo__name">{APP_NAME}</span>
          <span className="sidebar-logo__sub">Privacy Firewall</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="section-title" style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-4)' }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav__item ${isActive ? 'sidebar-nav__item--active' : ''}`}
            >
              <span className="sidebar-nav__icon">{item.icon}</span>
              <div className="sidebar-nav__content">
                <span className="sidebar-nav__label">{item.label}</span>
                <span className="sidebar-nav__desc">{item.description}</span>
              </div>
              {isActive && <span className="sidebar-nav__indicator" />}
            </Link>
          );
        })}
      </nav>

      {/* Architecture Info */}
      <div className="sidebar-info">
        <div className="section-title" style={{ padding: '0' }}>Architecture</div>
        <div className="sidebar-info__list">
          <div className="sidebar-info__item">
            <span className="sidebar-info__dot" style={{ background: 'var(--color-allow)' }} />
            <span>Perception Fusion</span>
          </div>
          <div className="sidebar-info__item">
            <span className="sidebar-info__dot" style={{ background: 'var(--color-transform)' }} />
            <span>Privacy Engine</span>
          </div>
          <div className="sidebar-info__item">
            <span className="sidebar-info__dot" style={{ background: 'var(--color-accent-primary)' }} />
            <span>Context Optimizer</span>
          </div>
          <div className="sidebar-info__item">
            <span className="sidebar-info__dot" style={{ background: 'var(--color-accent-secondary)' }} />
            <span>Action Firewall</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {footerLinks.map((link) => (
          <span key={link.label} className="sidebar-footer__badge">
            {link.icon} {link.label}
          </span>
        ))}
        <span className="sidebar-footer__version">v1.0.0-mvp</span>
      </div>

      <style jsx>{`
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border);
        }
        .sidebar-logo__icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: var(--shadow-glow-cyan);
        }
        .sidebar-logo__shield {
          filter: brightness(1.2);
        }
        .sidebar-logo__name {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--color-text-primary);
          display: block;
          line-height: 1.2;
        }
        .sidebar-logo__sub {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          display: block;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-2) 0;
        }
        .sidebar-nav__item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-5);
          margin: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          text-decoration: none;
          position: relative;
        }
        .sidebar-nav__item:hover {
          color: var(--color-text-primary);
          background: rgba(148, 163, 184, 0.08);
        }
        .sidebar-nav__item--active {
          color: var(--color-text-primary);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
        }
        .sidebar-nav__icon {
          font-size: 18px;
          width: 24px;
          text-align: center;
        }
        .sidebar-nav__content {
          display: flex;
          flex-direction: column;
        }
        .sidebar-nav__label {
          font-size: var(--text-sm);
          font-weight: 600;
        }
        .sidebar-nav__desc {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }
        .sidebar-nav__indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--color-accent-primary);
          border-radius: 0 var(--radius-full) var(--radius-full) 0;
        }

        .sidebar-info {
          padding: var(--space-5);
          border-top: 1px solid var(--color-border);
        }
        .sidebar-info__list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }
        .sidebar-info__item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }
        .sidebar-info__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          align-items: center;
        }
        .sidebar-footer__badge {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          background: rgba(148, 163, 184, 0.06);
          padding: 2px var(--space-2);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }
        .sidebar-footer__version {
          font-size: 10px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          margin-left: auto;
        }
      `}</style>
    </aside>
  );
}
