import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <Link to="/" className="logo">
              <div className="logo-mark">
                <Sparkles size={18} />
              </div>
              <span className="logo-text">TalentAI</span>
            </Link>

            <div className="header-badge">
              <span className="badge-dot"></span>
              <span>AI-Powered Matching</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {children}
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2026 TalentAI · Semantic resume screening powered by AI</p>
        </div>
      </footer>

      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(12, 12, 15, 0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
        }

        .logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          border-radius: var(--radius-lg);
          color: white;
        }

        .logo-text {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--gray-50);
          letter-spacing: -0.02em;
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--gray-400);
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: var(--success-400);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .main {
          flex: 1;
          padding: var(--space-8) 0;
        }

        .footer {
          padding: var(--space-6) 0;
          border-top: 1px solid var(--border-subtle);
        }

        .footer p {
          font-size: var(--text-sm);
          color: var(--gray-600);
          text-align: center;
        }

        @media (max-width: 768px) {
          .header-badge {
            display: none;
          }

          .header-inner {
            height: 56px;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
