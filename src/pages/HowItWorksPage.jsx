import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldAlert, 
  PlusCircle, 
  ShieldCheck, 
  ArrowRight,
  Layers,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';

export function HowItWorksPage() {
  useEffect(() => {
    document.title = 'How It Works | FindNest';
  }, []);

  return (
    <div className="py-12 sm:py-16 animate-fade-in bg-aurora-bg min-h-[calc(100vh-140px)]">
      <Container>
        {/* Header Hero */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-aurora-accent bg-aurora-chip px-3.5 py-1.5 rounded-full border border-aurora-border shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-aurora-accent" />
            Simple 3-Step Process
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-aurora-text tracking-tight">
            How FindNest Works
          </h1>
          <p className="text-base sm:text-lg text-aurora-muted max-w-2xl mx-auto leading-relaxed">
            Our intelligent platform transforms the uncertainty of lost items into seamless, fast community reunions powered by multimodal AI.
          </p>
        </div>

        {/* 3 Core Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Step 1 */}
          <div className="bg-aurora-card rounded-2xl border border-aurora-border p-8 space-y-5 shadow-card hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-aurora-error-bg text-aurora-error flex items-center justify-center font-black text-xl border border-aurora-error/20">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-aurora-text">
                Post Your Report
              </h3>
              <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
                Report a lost or found item in under 60 seconds with title, category, location, and photos. Your contact details remain 100% private.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-aurora-text pt-2 border-t border-aurora-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Instant upload with photo previews</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Automatic timestamping & geo-tagging</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
                <span>Personal phone & email shielded</span>
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="bg-aurora-card rounded-2xl border border-aurora-border p-8 space-y-5 shadow-card hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-aurora-chip text-aurora-accent flex items-center justify-center font-black text-xl border border-aurora-border">
              02
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-aurora-accent bg-aurora-chip px-2 py-0.5 rounded-md border border-aurora-border">
                <Sparkles className="w-3 h-3 text-aurora-accent" />
                <span>AI 5-FACTOR ENGINE</span>
              </div>
              <h3 className="text-xl font-bold font-display text-aurora-text">
                Smart Semantic Matching
              </h3>
              <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
                FindNest analyzes item attributes, photo vectors, and semantic text across community listings to detect high-confidence matches automatically.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-aurora-text pt-2 border-t border-aurora-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>768-dimensional multimodal vectors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Understands synonyms & variations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Real-time email and in-app alerts</span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="bg-aurora-card rounded-2xl border border-aurora-border p-8 space-y-5 shadow-card hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-aurora-success-bg text-aurora-success flex items-center justify-center font-black text-xl border border-aurora-success/20">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-aurora-text">
                Verify & Reunite
              </h3>
              <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
                Review matched item photos and proof details. Facilitate a safe, verified exchange and mark the item recovered for the entire community.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-aurora-text pt-2 border-t border-aurora-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Inspect detailed evidence scores</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Coordinate safely at campus desks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span>Close report once safely returned</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Deep Dive: 5-Factor Scoring Model */}
        <div className="bg-aurora-card rounded-3xl border border-aurora-border p-8 sm:p-12 shadow-card mb-20 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-accent flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Multimodal Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text">
              The 5-Factor Hybrid Scoring Model
            </h2>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
              Unlike keyword searches, FindNest evaluates every candidate match through five distinct weighted algorithmic dimensions to avoid false positives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-aurora-chip/60 border border-aurora-border space-y-2">
              <span className="text-2xl font-black text-aurora-accent">50%</span>
              <h4 className="text-sm font-bold text-aurora-text">Multimodal Embedding</h4>
              <p className="text-xs text-aurora-muted">
                Analyzes semantic meaning and photos via high-dimension Gemini vector cosine similarity.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aurora-chip/60 border border-aurora-border space-y-2">
              <span className="text-2xl font-black text-aurora-success">20%</span>
              <h4 className="text-sm font-bold text-aurora-text">Category Match</h4>
              <p className="text-xs text-aurora-muted">
                Strict taxonomy validation ensures electronics never mistakenly pair with apparel or keys.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aurora-chip/60 border border-aurora-border space-y-2">
              <span className="text-2xl font-black text-aurora-accent">15%</span>
              <h4 className="text-sm font-bold text-aurora-text">Location Proximity</h4>
              <p className="text-xs text-aurora-muted">
                Spatial analysis checking building, campus zone, or transit corridor correlation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aurora-chip/60 border border-aurora-border space-y-2">
              <span className="text-2xl font-black text-aurora-warning">10%</span>
              <h4 className="text-sm font-bold text-aurora-text">Brand & Color</h4>
              <p className="text-xs text-aurora-muted">
                Token matching for distinctive identifiers, manufacturers, and primary color descriptors.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-aurora-chip/60 border border-aurora-border space-y-2">
              <span className="text-2xl font-black text-aurora-accent">5%</span>
              <h4 className="text-sm font-bold text-aurora-text">Temporal Decay</h4>
              <p className="text-xs text-aurora-muted">
                Favoring items reported within a plausible recovery window while allowing for delayed claims.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-aurora-card via-aurora-chip to-aurora-card border border-aurora-border p-8 sm:p-12 text-center space-y-6 shadow-card">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text">
              Ready to report an item or browse?
            </h2>
            <p className="text-xs sm:text-sm text-aurora-muted">
              Join thousands of community members actively reuniting lost possessions every single week.
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
                Browse All Listings
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
