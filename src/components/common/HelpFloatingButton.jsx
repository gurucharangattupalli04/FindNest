import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export function HelpFloatingButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide button on the FAQ page itself
  if (location.pathname === '/faq') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
      <button
        id="floating-faq-help-btn"
        onClick={() => navigate('/faq')}
        className="flex items-center gap-2 px-4 py-2.5 bg-aurora-accent hover:bg-aurora-accent-hover text-white rounded-full shadow-card hover:shadow-card-hover border border-white/20 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer group"
        aria-label="Help & FAQ"
        title="View Frequently Asked Questions & Help"
      >
        <HelpCircle className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold tracking-wide pr-0.5">Help & FAQ</span>
      </button>
    </div>
  );
}
