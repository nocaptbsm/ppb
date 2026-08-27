'use client';

import { useEffect, useState } from 'react';
import { useAgent } from '@/context/AgentContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const { state } = useAgent();
  const pathname = usePathname();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <Link href="/" className="logo-container">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="logo-text">PrivacyShield</span>
          </Link>
          
          <nav className="header-nav">
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Dashboard
            </Link>
            <Link href="/agent" className={`nav-link ${pathname === '/agent' ? 'active' : ''}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 15h3"/><path d="M1 9h3"/><path d="M1 15h3"/></svg>
              Agent Firewall
            </Link>
            <Link href="/demo" className={`nav-link ${pathname === '/demo' ? 'active' : ''}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              Sandbox Portal
            </Link>
          </nav>
        </div>

        <div className="header-right">
          {/* Processing indicator */}
          {state.isProcessing && (
            <div className="header-processing">
              <span className="header-processing__dot" />
              <span className="header-processing__text">{state.processingStage || 'Processing...'}</span>
            </div>
          )}

          {/* Privacy status */}
          <div className="header-privacy-status" title="Privacy Protection Score">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="header-privacy-status__value">
              {state.privacyProtectionScore}% Protection
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Mode">
            {theme === 'light' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            )}
          </button>
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
          gap: var(--space-8);
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          text-decoration: none;
        }
        .logo-text {
          font-size: var(--text-base);
          font-weight: 800;
          letter-spacing: -0.02em;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .header-nav {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        :global(.nav-link) {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        :global(.nav-link:hover) {
          color: var(--color-text-primary);
          background: rgba(148, 163, 184, 0.08);
        }
        :global([data-theme="dark"] .nav-link:hover) {
          background: rgba(255, 255, 255, 0.03);
        }
        :global(.nav-link.active) {
          color: var(--color-accent-primary);
          background: rgba(8, 145, 178, 0.08);
          font-weight: 600;
        }
        :global([data-theme="dark"] .nav-link.active) {
          background: rgba(6, 182, 212, 0.1);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        .header-processing {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: rgba(8, 145, 178, 0.06);
          border: 1px solid rgba(8, 145, 178, 0.15);
          border-radius: var(--radius-full);
          animation: borderGlow 2s ease-in-out infinite;
        }
        :global([data-theme="dark"]) .header-processing {
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
        }
        .header-processing__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent-primary);
          animation: pulse 1s ease-in-out infinite;
        }
        .header-processing__text {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-accent-primary);
        }
        .header-privacy-status {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          background: rgba(5, 150, 105, 0.06);
          border: 1px solid rgba(5, 150, 105, 0.15);
          border-radius: var(--radius-full);
          color: var(--color-allow);
          font-weight: 600;
          font-size: var(--text-xs);
        }
        :global([data-theme="dark"]) .header-privacy-status {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .theme-toggle-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          background: transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .theme-toggle-btn:hover {
          color: var(--color-text-primary);
          background: rgba(148, 163, 184, 0.08);
          border-color: var(--color-border-hover);
        }
        :global([data-theme="dark"]) .theme-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>
    </header>
  );
}
