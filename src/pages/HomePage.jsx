import React, { useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldAlert, 
  PlusCircle, 
  ArrowRight, 
  Laptop, 
  Wallet, 
  KeyRound, 
  Briefcase, 
  Dog, 
  Watch, 
  ShieldCheck, 
  CheckCircle2,
  TrendingUp,
  Workflow
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';
import { ScanTerminal } from '../components/ScanTerminal';

const CATEGORY_ITEMS = [
  { id: 'electronics', name: 'Electronics', icon: Laptop, count: '142 active' },
  { id: 'wallets', name: 'Wallets & IDs', icon: Wallet, count: '98 active' },
  { id: 'keys', name: 'Keys & Fobs', icon: KeyRound, count: '64 active' },
  { id: 'bags', name: 'Bags & Luggage', icon: Briefcase, count: '51 active' },
  { id: 'pets', name: 'Pets', icon: Dog, count: '19 active' },
  { id: 'accessories', name: 'Jewelry & Watches', icon: Watch, count: '33 active' },
];

export function HomePage({ 
  items = [], 
  onSelectItem 
}) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FindNest — Smart AI-Powered Lost & Found Network';
  }, []);

  // Community reports available for interactive AI radar demo
  const demoReports = useMemo(() => {
    const lost = items.filter((i) => i.type === 'LOST');
    return lost.length > 0 ? lost.slice(0, 5) : items.slice(0, 5);
  }, [items]);

  return (
    <div className="w-full animate-fade-in">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-aurora-chip/40 via-aurora-bg to-aurora-bg border-b border-aurora-border transition-colors">
        {/* Animated background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[350px] bg-gradient-to-tr from-aurora-accent/15 via-aurora-radar/20 to-aurora-chip/30 blur-3xl pointer-events-none -z-10" />

        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aurora-card border border-aurora-border shadow-subtle text-xs font-bold text-aurora-accent">
              <span className="flex h-2 w-2 rounded-full bg-aurora-accent animate-ping" />
              <span>Smart Community Recovery Network</span>
              <Sparkles className="w-3.5 h-3.5 text-aurora-accent" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-aurora-text tracking-tight leading-[1.12]">
              Reuniting People With <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-aurora-accent via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                What Matters Most
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-aurora-muted max-w-2xl mx-auto leading-relaxed">
              FindNest connects lost belongings with kind finders, campus hubs, and transit centers in real-time using AI-powered semantic matching. Post a report in seconds and verify claims securely.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/report-lost" className="w-full sm:w-auto">
                <Button
                  id="hero-report-lost-btn"
                  variant="lost"
                  size="lg"
                  icon={ShieldAlert}
                  className="w-full sm:w-auto shadow-subtle"
                >
                  I Lost Something
                </Button>
              </Link>
              <Link to="/report-found" className="w-full sm:w-auto">
                <Button
                  id="hero-report-found-btn"
                  variant="found"
                  size="lg"
                  icon={PlusCircle}
                  className="w-full sm:w-auto shadow-subtle"
                >
                  I Found Something
                </Button>
              </Link>
              <Link to="/browse" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto"
                >
                  Browse Items
                </Button>
              </Link>
            </div>

            {/* Quick stats pills */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-aurora-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-aurora-success" />
                <span>1,200+ Verified Reunions</span>
              </div>
              <span className="hidden sm:inline text-aurora-border">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-aurora-accent" />
                <span>100% Private Contact Info</span>
              </div>
              <span className="hidden sm:inline text-aurora-border">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-aurora-accent" />
                <span>AI Semantic Similarity</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. CATEGORY EXPLORER */}
      <section className="py-12 border-b border-aurora-border bg-aurora-card/60 backdrop-blur-md transition-colors">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-aurora-text tracking-tight">
                Explore Top Categories
              </h2>
              <p className="text-xs sm:text-sm text-aurora-muted mt-0.5">
                Click any category to browse matched community listings
              </p>
            </div>
            <Link
              to="/browse"
              className="text-xs font-bold text-aurora-accent hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {CATEGORY_ITEMS.map((cat) => {
              const IconComponent = cat.icon;

              return (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/browse?category=${cat.id}`)}
                  className="p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col items-center text-center group bg-aurora-card border-aurora-border hover:border-aurora-accent/40 hover:shadow-card-hover hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors bg-aurora-chip text-aurora-muted group-hover:text-aurora-accent group-hover:bg-aurora-chip">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-aurora-text group-hover:text-aurora-accent transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-aurora-muted mt-1">
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. LIVE AI COMMUNITY DISCOVERY COMPASS DEMO */}
      <section className="py-16 bg-aurora-chip/25 border-b border-aurora-border transition-colors">
        <Container>
          <div className="max-w-4xl mx-auto">
            <ScanTerminal
              reports={demoReports}
              onSelectItem={onSelectItem}
              onOpenReportLost={() => navigate('/report-lost')}
              onOpenReportFound={() => navigate('/report-found')}
              mode="demo"
              title="Live AI Community Discovery Compass"
              subtitle="Experience our real multimodal Gemini 5-factor scoring engine scanning community listings in real time"
            />
          </div>
        </Container>
      </section>

      {/* 4. PLATFORM PILLARS TEASER (Linking to How It Works & Community Stats) */}
      <section className="py-16 bg-aurora-bg transition-colors">
        <Container>
          <div className="max-w-2xl mx-auto text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text tracking-tight">
              Why Communities Choose FindNest
            </h2>
            <p className="text-xs sm:text-sm text-aurora-muted">
              Built from the ground up for privacy, speed, and real verified recoveries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* How It Works Card */}
            <div className="p-8 rounded-3xl bg-aurora-card border border-aurora-border shadow-card space-y-4 flex flex-col justify-between group hover:-translate-y-1 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-aurora-chip text-aurora-accent flex items-center justify-center">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display text-aurora-text">
                  3-Step AI Recovery Flow
                </h3>
                <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
                  Understand how our multimodal embeddings, category heuristics, and temporal scoring work together to deliver verified match alerts.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-aurora-accent hover:underline group-hover:gap-2 transition-all"
                >
                  <span>Learn how it works</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Community Stats Card */}
            <div className="p-8 rounded-3xl bg-aurora-card border border-aurora-border shadow-card space-y-4 flex flex-col justify-between group hover:-translate-y-1 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-aurora-success-bg text-aurora-success flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display text-aurora-text">
                  Community Impact & Recovery Rates
                </h3>
                <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
                  Explore how 1,240+ items have been returned across campus and transit hubs, with an 89% recovery rate on items with photos.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/community-stats"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-aurora-success hover:underline group-hover:gap-2 transition-all"
                >
                  <span>View recovery statistics</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
