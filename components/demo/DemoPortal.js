'use client';

import { useState } from 'react';
import { useAgent } from '@/context/AgentContext';
import { SCENARIO_DATA } from './scenarioData';
import { SCENARIOS } from '@/lib/utils/constants';

export default function DemoPortal() {
  const { state } = useAgent();
  const scenario = SCENARIO_DATA[state.activeScenario];

  // Interactive Demo States
  const [cartCount, setCartCount] = useState(0);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [fundsTransferred, setFundsTransferred] = useState(false);
  const [securityVerified, setSecurityVerified] = useState(false);
  const [toast, setToast] = useState('');
  const [toastTimer, setToastTimer] = useState(null);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToast('');
    }, 4000);
    setToastTimer(timer);
  };

  const handleAction = (actionId) => {
    switch (actionId) {
      case 'add-to-cart':
        setCartCount(prev => prev + 1);
        showToast('🛒 Item added to cart! Cart count updated.');
        break;
      case 'buy-now':
        showToast('🛍️ Opening secure checkout gateway...');
        break;
      case 'search-btn':
        const inputVal = document.getElementById('search-input')?.value || '';
        showToast(`🔍 Searching store catalog for: "${inputVal || 'wireless headphones'}"`);
        break;
      case 'update-profile':
        setProfileUpdated(true);
        showToast('👤 Citizen Profile updated locally in portal database.');
        break;
      case 'download-docs':
        showToast('📥 Verified documents packaged and downloaded securely.');
        break;
      case 'submit-application':
        setApplicationSubmitted(true);
        showToast('🏛️ Aadhaar application submitted successfully to government servers.');
        break;
      case 'fund-transfer':
        showToast('💸 Initializing NEFT/IMPS secure money transfer protocol...');
        break;
      case 'view-statement':
        showToast('📊 Generating encrypted account statement...');
        break;
      case 'submit-transfer':
        setFundsTransferred(true);
        showToast('✅ Transfer successful! ₹15,000 sent. Transaction ID: TXN892749');
        break;
      case 'compare':
        showToast('⚖️ Fetching competitor specs for side-by-side comparison.');
        break;
      case 'verify-identity':
        setSecurityVerified(true);
        showToast('🛡️ Credentials submitted successfully for identity verification.');
        break;
      default:
        showToast(`Triggered portal action: ${actionId}`);
    }
  };

  if (!scenario) return null;

  return (
    <div className="demo-portal" id="demo-portal-root">
      {/* Portal Header */}
      <div className="demo-header" style={{ background: scenario.headerColor }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: '28px' }}>{scenario.emblem}</span>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{scenario.title}</div>
            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>{scenario.subtitle}</div>
          </div>
        </div>
        {state.activeScenario === SCENARIOS.NORMAL && (
          <div className="cart-badge">
            🛒 Cart ({cartCount})
          </div>
        )}
      </div>

      {/* Portal Body */}
      <div className="demo-body">
        {/* Floating Toast Notification */}
        {toast && (
          <div className="demo-toast animate-slide-down">
            <span className="toast-icon">⚡</span>
            <div className="toast-text">{toast}</div>
          </div>
        )}

        {/* Attack Warning Banner */}
        {state.activeScenario === SCENARIOS.ATTACK && (
          <div className="attack-banner" data-pii-type="PROMPT_INJECTION">
            <span>⚠️</span>
            <div>
              <strong>Security Test Mode</strong>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)' }}>
                This page contains hidden prompt injection attempts. The privacy engine should detect and block them.
              </p>
            </div>
          </div>
        )}

        {scenario.sections.map((section) => (
          <div key={section.id} className="demo-section" id={`section-${section.id}`}>
            <div className="demo-section-title">
              {section.title}
              {section.id === 'citizen-profile' && profileUpdated && (
                <span className="status-badge status-badge--success">Updated</span>
              )}
              {section.id === 'citizen-profile' && applicationSubmitted && (
                <span className="status-badge status-badge--success">Submitted</span>
              )}
              {section.id === 'account-summary' && fundsTransferred && (
                <span className="status-badge status-badge--success">Transferred</span>
              )}
              {section.id === 'login-security' && securityVerified && (
                <span className="status-badge status-badge--success">Verified</span>
              )}
            </div>
            {renderSection(section, state.activeScenario, handleAction)}
          </div>
        ))}

        {/* Action Buttons */}
        {scenario.actions && (
          <div className="demo-actions">
            {scenario.actions.map((action) => (
              <button
                key={action.id}
                id={action.id}
                onClick={() => handleAction(action.id)}
                className={`demo-btn ${action.type === 'secondary' ? 'demo-btn--secondary' : ''}`}
                style={action.type === 'secondary' ? { background: '#e2e8f0', color: '#374151' } : {}}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .demo-toast {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: #ecfeff;
          border: 1px solid #06b6d4;
          border-radius: var(--radius-md);
          margin-bottom: var(--space-5);
          font-size: var(--text-sm);
          color: #0891b2;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.1);
        }
        .status-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          margin-left: var(--space-3);
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-badge--success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #34d399;
        }
        .cart-badge {
          background: #ffffff;
          color: #e65100;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 700;
          border: 2px solid #e65100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .attack-banner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-5);
          font-size: var(--text-sm);
          color: #b91c1c;
        }
        .demo-actions {
          display: flex;
          gap: var(--space-3);
          margin-top: var(--space-5);
          padding-top: var(--space-5);
          border-top: 1px solid #e5e7eb;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-4);
        }
        .product-card {
          border: 1px solid #e5e7eb;
          border-radius: var(--radius-md);
          padding: var(--space-4);
          text-align: center;
          transition: box-shadow 0.2s;
        }
        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .product-icon {
          font-size: 36px;
          margin-bottom: var(--space-2);
        }
        .product-name {
          font-size: var(--text-sm);
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: var(--space-1);
        }
        .product-price {
          font-size: var(--text-lg);
          font-weight: 700;
          color: #e65100;
          margin-bottom: var(--space-1);
        }
        .product-meta {
          font-size: var(--text-xs);
          color: #6b7280;
        }
        .review-card {
          padding: var(--space-4);
          border: 1px solid #f1f5f9;
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-3);
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }
        .review-author {
          font-weight: 600;
          font-size: var(--text-sm);
          color: #1a1a2e;
        }
        .review-rating {
          color: #f59e0b;
          font-size: var(--text-sm);
        }
        .review-text {
          font-size: var(--text-sm);
          color: #4b5563;
          line-height: 1.5;
        }
        .review-date {
          font-size: var(--text-xs);
          color: #9ca3af;
          margin-top: var(--space-2);
        }
        .search-container {
          display: flex;
          gap: var(--space-3);
        }
        .search-input {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          border: 2px solid #e5e7eb;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: #111827;
          background: #ffffff;
        }
        .search-input:focus {
          outline: none;
          border-color: #e65100;
        }
        .injection-hidden {
          position: absolute;
          left: -9999px;
          font-size: 1px;
          color: white;
          opacity: 0.01;
          pointer-events: none;
        }
        .doc-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          background: #f8fafc;
          border-radius: var(--radius-sm);
          border: 1px solid #e2e8f0;
        }
        .doc-item__left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .doc-status {
          font-size: var(--text-xs);
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .doc-status--verified {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        .doc-status--pending {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }
      `}</style>
    </div>
  );
}

function renderSection(section, scenario, handleAction) {
  switch (section.type) {
    case 'table':
      return renderTable(section);
    case 'products':
      return renderProducts(section);
    case 'reviews':
      return renderReviews(section);
    case 'search':
      return renderSearch(section, handleAction);
    case 'injection':
      return renderInjection(section);
    case 'fake-form':
      return renderFakeForm(section);
    case 'documents':
      return renderDocuments(section);
    default:
      return renderFields(section);
  }
}

function renderFields(section) {
  return (
    <div>
      {section.fields?.map((field, i) => (
        <div key={i} className="demo-field" data-pii-type={field.piiType || undefined} data-pii-value={field.value || undefined}>
          <label htmlFor={`field-${section.id}-${i}`}>{field.label}</label>
          {field.inputType === 'password' ? (
            <input
              id={`field-${section.id}-${i}`}
              className="demo-input"
              type="password"
              defaultValue={field.value}
              placeholder={field.placeholder}
              readOnly={!!field.value}
            />
          ) : (
            field.value ? (
              <div className="demo-value" data-pii-type={field.piiType || undefined}>{field.value}</div>
            ) : (
              <input
                id={`field-${section.id}-${i}`}
                className="demo-input"
                type={field.inputType || 'text'}
                placeholder={field.placeholder}
              />
            )
          )}
        </div>
      ))}
    </div>
  );
}

function renderTable(section) {
  return (
    <table className="demo-table">
      <thead>
        <tr>
          {section.headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {section.rows.map((row, i) => (
          <tr key={i}>
            {row.slice(0, -1).map((cell, j) => (
              <td
                key={j}
                data-pii-type={j === 2 && row[row.length - 1] ? row[row.length - 1] : undefined}
                data-pii-value={j === 2 && row[row.length - 1] ? cell : undefined}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderProducts(section) {
  return (
    <div className="product-grid">
      {section.products.map((product, i) => (
        <div key={i} className="product-card">
          <div className="product-icon">{product.image}</div>
          <div className="product-name">{product.name}</div>
          <div className="product-price">{product.price}</div>
          <div className="product-meta">{product.rating} · {product.reviews}</div>
        </div>
      ))}
    </div>
  );
}

function renderReviews(section) {
  return (
    <div>
      {section.reviews.map((review, i) => (
        <div key={i} className="review-card">
          <div className="review-header">
            <span className="review-author" data-pii-type={review.piiType} data-pii-value={review.author}>
              {review.author}
            </span>
            <span className="review-rating">{review.rating}</span>
          </div>
          <p className="review-text">{review.text}</p>
          <div className="review-date">{review.date}</div>
        </div>
      ))}
    </div>
  );
}

function renderSearch(section, handleAction) {
  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder={section.placeholder}
        id="search-input"
      />
      <button 
        className="demo-btn" 
        id="search-btn" 
        style={{ flexShrink: 0 }}
        onClick={() => handleAction('search-btn')}
      >
        Search
      </button>
    </div>
  );
}

function renderInjection(section) {
  return (
    <div style={{ position: 'relative' }}>
      <p style={{ fontSize: 'var(--text-sm)', color: '#374151', lineHeight: 1.6 }}>
        {section.visibleText}
      </p>
      <div
        className="injection-hidden"
        data-pii-type="PROMPT_INJECTION"
        aria-hidden="true"
      >
        {section.hiddenInjection.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function renderFakeForm(section) {
  return (
    <div style={{ background: '#fff3e0', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #ffcc02' }}>
      <p style={{ fontSize: 'var(--text-xs)', color: '#e65100', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
        ⚠ This form is part of the attack simulation
      </p>
      {section.fields?.map((field, i) => (
        <div key={i} className="demo-field" data-pii-type={field.piiType} data-pii-value={field.value}>
          <label htmlFor={`fake-${i}`}>{field.label}</label>
          <input
            id={`fake-${i}`}
            className="demo-input"
            type={field.inputType}
            placeholder={field.placeholder}
            data-pii-type={field.piiType}
          />
        </div>
      ))}
    </div>
  );
}

function renderDocuments(section) {
  return (
    <div className="doc-list">
      {section.documents.map((doc, i) => (
        <div key={i} className="doc-item">
          <div className="doc-item__left">
            <span>{doc.icon}</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{doc.name}</span>
          </div>
          <span className={`doc-status ${doc.status === 'Verified' ? 'doc-status--verified' : 'doc-status--pending'}`}>
            {doc.status}
          </span>
        </div>
      ))}
    </div>
  );
}
