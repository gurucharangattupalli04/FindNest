import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Clock, 
  Award, 
  HeartHandshake, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  PlusCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';

export function CommunityStatsPage() {
  useEffect(() => {
    document.title = 'Community Stats & Impact | FindNest';
  }, []);

  return (
    <div className="py-12 sm:py-16 animate-fade-in bg-aurora-bg min-h-[calc(100vh-140px)]">
      <Container>
        {/* Header Hero */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-aurora-success bg-aurora-success-bg px-3.5 py-1.5 rounded-full border border-aurora-success/30 shadow-subtle">
            <TrendingUp className="w-3.5 h-3.5 text-aurora-success" />
            Live Network Impact
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-aurora-text tracking-tight">
            Real Recovery in Numbers
          </h1>
          <p className="text-base sm:text-lg text-aurora-muted max-w-2xl mx-auto leading-relaxed">
            Together, our network of students, transit operators, campus security, and good Samaritans reunites hundreds of belongings each month.
          </p>
        </div>

        {/* 4 Key Stat Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-8 rounded-3xl bg-aurora-card border border-aurora-border text-center space-y-2 shadow-card hover:-translate-y-1 transition-all">
            <span className="text-4xl sm:text-5xl font-black font-display text-aurora-success block">89%</span>
            <p className="text-xs sm:text-sm font-bold text-aurora-text">Recovery Match Rate</p>
            <p className="text-[11px] text-aurora-muted">Successful claims for items reported with photos</p>
          </div>

          <div className="p-8 rounded-3xl bg-aurora-card border border-aurora-border text-center space-y-2 shadow-card hover:-translate-y-1 transition-all">
            <span className="text-4xl sm:text-5xl font-black font-display text-aurora-accent block">&lt; 4 hrs</span>
            <p className="text-xs sm:text-sm font-bold text-aurora-text">Average Notification</p>
            <p className="text-[11px] text-aurora-muted">From found item submission to owner alert</p>
          </div>

          <div className="p-8 rounded-3xl bg-aurora-card border border-aurora-border text-center space-y-2 shadow-card hover:-translate-y-1 transition-all">
            <span className="text-4xl sm:text-5xl font-black font-display text-indigo-600 block">1,240+</span>
            <p className="text-xs sm:text-sm font-bold text-aurora-text">Items Reunited</p>
            <p className="text-[11px] text-aurora-muted">Total verified belongings safely returned</p>
          </div>

          <div className="p-8 rounded-3xl bg-aurora-card border border-aurora-border text-center space-y-2 shadow-card hover:-translate-y-1 transition-all">
            <span className="text-4xl sm:text-5xl font-black font-display text-aurora-warning block">100%</span>
            <p className="text-xs sm:text-sm font-bold text-aurora-text">Free Community Access</p>
            <p className="text-[11px] text-aurora-muted">No hidden recovery fees or paywalls</p>
          </div>
        </div>

        {/* Community Trust & Safety Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-7 rounded-2xl bg-aurora-card border border-aurora-border space-y-3 shadow-subtle">
            <div className="w-12 h-12 rounded-xl bg-aurora-chip text-aurora-accent flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-aurora-text">
              Verified Ownership Protocols
            </h3>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
              Finders verify item ownership through hidden marks, serial numbers, or security questions before coordinating handover.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-aurora-card border border-aurora-border space-y-3 shadow-subtle">
            <div className="w-12 h-12 rounded-xl bg-aurora-success-bg text-aurora-success flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-aurora-text">
              Designated Safe Zones
            </h3>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
              Handovers are encouraged at campus desks, library information counters, and transit security offices for full peace of mind.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-aurora-card border border-aurora-border space-y-3 shadow-subtle">
            <div className="w-12 h-12 rounded-xl bg-aurora-warning-bg text-aurora-warning flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-aurora-text">
              Community Kindness Network
            </h3>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
              Over 94% of reported finders decline monetary rewards, motivated solely by helping fellow neighbors and colleagues.
            </p>
          </div>
        </div>

        {/* Milestone Impact Timeline */}
        <div className="bg-aurora-card rounded-3xl border border-aurora-border p-8 sm:p-12 shadow-card mb-16 space-y-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-accent">
              Platform Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text">
              Network Milestones
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-aurora-chip/50 border border-aurora-border space-y-2">
              <span className="text-xs font-bold text-aurora-accent uppercase">Q1 2026</span>
              <h4 className="text-base font-bold text-aurora-text">Campus Launch</h4>
              <p className="text-xs text-aurora-muted">
                Initial pilot program launched across university campus centers, connecting 350+ items in the first month.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aurora-chip/50 border border-aurora-border space-y-2">
              <span className="text-xs font-bold text-aurora-accent uppercase">Q2 2026</span>
              <h4 className="text-base font-bold text-aurora-text">Multimodal AI Engine</h4>
              <p className="text-xs text-aurora-muted">
                Integrated Gemini 768-dim embeddings and 5-factor hybrid ranking, improving recovery precision by 3.8x.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aurora-chip/50 border border-aurora-border space-y-2">
              <span className="text-xs font-bold text-aurora-success uppercase">Today</span>
              <h4 className="text-base font-bold text-aurora-text">Community Network</h4>
              <p className="text-xs text-aurora-muted">
                Over 1,240 items successfully reunited with an average notification time under 4 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="rounded-3xl bg-gradient-to-r from-aurora-card via-aurora-chip to-aurora-card border border-aurora-border p-8 sm:p-12 text-center space-y-6 shadow-card">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text">
              Have you lost or found something?
            </h2>
            <p className="text-xs sm:text-sm text-aurora-muted">
              Add your report in seconds to help keep our community recovery rate climbing.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/report-lost">
              <Button variant="lost" size="lg" icon={ShieldAlert}>
                Report Lost Item
              </Button>
            </Link>
            <Link to="/report-found">
              <Button variant="found" size="lg" icon={PlusCircle}>
                Found Something
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" size="lg" icon={ArrowRight} iconPosition="right">
                Browse Active Items
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
