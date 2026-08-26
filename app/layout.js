import './globals.css';
import { AgentProvider } from '@/context/AgentContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata = {
  title: 'PrivacyShield Agent — Task-Aware Privacy Firewall for Visual Browser Agents',
  description:
    'A privacy-preserving browser agent that locally analyzes webpages, detects and sanitizes sensitive information, and sends only the minimum necessary context to a remote VLM. Built for SIH Problem Statement 26171 by ISRO.',
  keywords: 'privacy, browser agent, PII detection, visual language model, ISRO, SIH',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AgentProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="app-main">
              <Header />
              <div className="app-content">
                {children}
              </div>
            </main>
          </div>
        </AgentProvider>
      </body>
    </html>
  );
}
