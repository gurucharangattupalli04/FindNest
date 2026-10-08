import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, ArrowRight } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  useEffect(() => {
    document.title = '404 - Page Not Found | FindNest';
  }, []);

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-16 px-4 bg-aurora-bg animate-fade-in">
      <Container size="sm">
        <div className="max-w-md mx-auto text-center space-y-6">
          {/* Compass Icon illustration */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-aurora-chip border-2 border-aurora-border flex items-center justify-center text-aurora-accent shadow-card">
              <Compass className="w-12 h-12 animate-pulse-subtle" />
            </div>
            <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black bg-aurora-accent text-white shadow-subtle">
              404
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-aurora-text tracking-tight">
              Looks like you're lost!
            </h1>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
              We couldn't find the page you're searching for. It might have been moved, renamed, or is temporarily unavailable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" icon={Home} className="w-full sm:w-auto shadow-subtle">
                Back to Home
              </Button>
            </Link>
            <Link to="/browse" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" icon={Search} className="w-full sm:w-auto">
                Browse Listings
              </Button>
            </Link>
          </div>

          {/* Additional quick links */}
          <div className="pt-8 border-t border-aurora-border text-xs text-aurora-muted space-y-2">
            <p className="font-semibold text-aurora-text">Popular Destinations:</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/how-it-works" className="hover:text-aurora-accent underline transition-colors">
                How It Works
              </Link>
              <span>•</span>
              <Link to="/community-stats" className="hover:text-aurora-accent underline transition-colors">
                Community Stats
              </Link>
              <span>•</span>
              <Link to="/faq" className="hover:text-aurora-accent underline transition-colors">
                FAQ & Help
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
