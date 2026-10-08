import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Heart, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="bg-aurora-card text-aurora-muted border-t border-aurora-border pt-16 pb-12 mt-20 transition-colors">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-aurora-border">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-3.5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-aurora-accent flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-aurora-text tracking-tight">
                Find<span className="text-aurora-accent">Nest</span>
              </span>
            </Link>
            <p className="text-sm text-aurora-muted leading-relaxed">
              A community lost and found platform built to quickly match reported items with verified finders using smart AI similarity.
            </p>
            <div className="flex items-center gap-2 text-xs text-aurora-success">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Safe, community-verified recoveries</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-aurora-text uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/faq"
                  className="hover:text-aurora-accent transition-colors text-aurora-accent font-semibold"
                >
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link to="/browse?type=LOST" className="hover:text-aurora-accent transition-colors">
                  Browse Lost Items
                </Link>
              </li>
              <li>
                <Link to="/browse?type=FOUND" className="hover:text-aurora-accent transition-colors">
                  Browse Found Items
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-aurora-accent transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/community-stats" className="hover:text-aurora-accent transition-colors">
                  Community Impact
                </Link>
              </li>
              <li>
                <a href="mailto:support@findnest.org" className="hover:text-aurora-accent transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-aurora-muted" />
                  <span>Contact Support</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className="text-xs font-bold text-aurora-text uppercase tracking-wider mb-4">Top Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/browse?category=electronics" className="text-aurora-muted hover:text-aurora-accent transition-colors">
                  Electronics & Laptops
                </Link>
              </li>
              <li>
                <Link to="/browse?category=wallets" className="text-aurora-muted hover:text-aurora-accent transition-colors">
                  Wallets & Government IDs
                </Link>
              </li>
              <li>
                <Link to="/browse?category=keys" className="text-aurora-muted hover:text-aurora-accent transition-colors">
                  Keys & Keychains
                </Link>
              </li>
              <li>
                <Link to="/browse?category=pets" className="text-aurora-muted hover:text-aurora-accent transition-colors">
                  Pets & Animals
                </Link>
              </li>
              <li>
                <Link to="/browse?category=bags" className="text-aurora-muted hover:text-aurora-accent transition-colors">
                  Bags & Backpacks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Mission */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-aurora-text uppercase tracking-wider mb-2">Our Mission</h4>
            <p className="text-xs text-aurora-muted leading-relaxed">
              FindNest operates completely free for campus, transit, and neighborhood communities. Our goal is to reunite belongings as fast as possible.
            </p>
            <div className="p-3.5 rounded-xl bg-aurora-chip border border-aurora-border text-xs text-aurora-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aurora-accent shrink-0" />
              <span>AI Semantic Matching active across 6 categories</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-aurora-muted">
          <p>© {new Date().getFullYear()} FindNest Platform. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Built with care for communities everywhere</span>
            <Heart className="w-3.5 h-3.5 text-aurora-error inline fill-aurora-error" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
