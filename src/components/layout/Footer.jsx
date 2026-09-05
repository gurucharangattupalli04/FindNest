import React from 'react';
import { Compass, Heart, ShieldCheck } from 'lucide-react';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 mt-24">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-400 flex items-center justify-center text-white shadow-sm">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Find<span className="text-brand-400">Nest</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A community-driven lost and found platform built to quickly match reported items with verified finders.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe, community-verified recoveries</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#browse-section" className="hover:text-white transition-colors">Browse Lost Items</a></li>
              <li><a href="#browse-section" className="hover:text-white transition-colors">Browse Found Items</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#community-impact" className="hover:text-white transition-colors">Community Impact</a></li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Top Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li><span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Electronics & Laptops</span></li>
              <li><span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Wallets & Government IDs</span></li>
              <li><span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Keys & Keychains</span></li>
              <li><span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Pets & Animals</span></li>
            </ul>
          </div>

          {/* Col 4: Stay Informed */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Lost & Found Alerts</h4>
            <p className="text-xs text-slate-400">
              Receive notifications when items matching your keywords are found in your area.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400"
              />
              <button className="bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-colors shrink-0">
                Notify
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} FindNest Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with care for communities everywhere</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
