import React, { useState, useMemo } from 'react';
import { 
  Search, 
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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';
import { ItemCard } from '../features/items/ItemCard';
import { SearchFilters } from '../features/search/SearchFilters';
import { SmartMatchesModal } from '../features/items/SmartMatchesModal';
import { PLATFORM_STATS } from '../services/mockItems';

const CATEGORY_ITEMS = [
  { id: 'electronics', name: 'Electronics', icon: Laptop, count: '142 active' },
  { id: 'wallets', name: 'Wallets & IDs', icon: Wallet, count: '98 active' },
  { id: 'keys', name: 'Keys & Fobs', icon: KeyRound, count: '64 active' },
  { id: 'bags', name: 'Bags & Luggage', icon: Briefcase, count: '51 active' },
  { id: 'pets', name: 'Pets', icon: Dog, count: '19 active' },
  { id: 'accessories', name: 'Jewelry & Watches', icon: Watch, count: '33 active' },
];

export function HomePage({ 
  items, 
  loading = false,
  error = null,
  onRefresh,
  onOpenReportLost, 
  onOpenReportFound, 
  onSelectItem 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [matchingItem, setMatchingItem] = useState(null);

  // Live filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search query filter (title or description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      // Location filter
      if (locationFilter.trim()) {
        const loc = locationFilter.toLowerCase();
        if (!item.location.toLowerCase().includes(loc)) return false;
      }
      return true;
    });
  }, [items, selectedType, selectedCategory, searchQuery, locationFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedCategory('all');
    setLocationFilter('');
  };

  return (
    <main className="w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-indigo-50/70 via-slate-50 to-slate-50 border-b border-slate-200/60">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-brand-300/30 to-indigo-300/20 blur-3xl pointer-events-none -z-10" />

        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-200/70 shadow-sm text-xs font-semibold text-brand-700">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-ping" />
              <span>Smart Community Recovery Network</span>
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Reuniting People With <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 bg-clip-text text-transparent">
                What Matters Most
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              FindNest connects lost belongings with kind finders, campus hubs, and transit centers in real-time. Post a report in seconds and verify claims securely.
            </p>

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                id="hero-report-lost-btn"
                variant="lost"
                size="lg"
                icon={ShieldAlert}
                onClick={onOpenReportLost}
                className="w-full sm:w-auto shadow-md"
              >
                I Lost Something
              </Button>
              <Button
                id="hero-report-found-btn"
                variant="found"
                size="lg"
                icon={PlusCircle}
                onClick={onOpenReportFound}
                className="w-full sm:w-auto shadow-md"
              >
                I Found Something
              </Button>
              <a href="#browse-section" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto"
                >
                  Browse Listings
                </Button>
              </a>
            </div>

            {/* Metrics Ribbon */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-slate-200/80">
              {PLATFORM_STATS.map((stat, idx) => (
                <div key={idx} className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/70 shadow-xs text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-brand-600 font-medium mt-0.5">
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 2. CATEGORY EXPLORER */}
      <section className="py-12 bg-white border-b border-slate-200/60">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Browse By Category
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Explore items currently waiting to be recovered
              </p>
            </div>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Show All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORY_ITEMS.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'all' : cat.id);
                    const browseElem = document.getElementById('browse-section');
                    if (browseElem) browseElem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col items-center text-center group ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 shadow-sm ring-2 ring-brand-500/20'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                    isSelected ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 group-hover:text-brand-600 group-hover:bg-brand-50 shadow-xs'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. BROWSE & FILTER SECTION */}
      <section id="browse-section" className="py-14">
        <Container>
          <div className="space-y-6">
            {/* Section Heading & Active Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Recent Community Listings
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} matching your current filters
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  id="browse-report-lost-btn"
                  variant="outline"
                  size="sm"
                  icon={ShieldAlert}
                  onClick={onOpenReportLost}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Report Lost
                </Button>
                <Button
                  id="browse-report-found-btn"
                  variant="outline"
                  size="sm"
                  icon={PlusCircle}
                  onClick={onOpenReportFound}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Report Found
                </Button>
              </div>
            </div>

            {/* Filter Component */}
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
            />

            {/* Grid of Listings with Loading, Error, and Empty states */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-16 bg-slate-200 rounded-full" />
                      <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-full bg-slate-100 rounded" />
                      <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                      <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 sm:p-10 text-center max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-rose-900">Database Connection Issue</h3>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {error}
                  </p>
                </div>
                {onRefresh && (
                  <Button variant="outline" size="sm" onClick={onRefresh} icon={RefreshCw}>
                    Retry Connection
                  </Button>
                )}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onSelect={onSelectItem}
                    onCheckMatches={(selected) => setMatchingItem(selected)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No matching items found</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We couldn't find any items matching your active search or filter criteria. Try broadening your keywords or resetting filters.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} icon={RefreshCw}>
                  Reset All Filters
                </Button>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-slate-100/70 border-y border-slate-200/70">
        <Container>
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How FindNest Works
            </h2>
            <p className="text-sm text-slate-600">
              A transparent, safe, and modern approach to getting lost items back into the hands of their rightful owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-brand-500/30">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Submit a Report
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Whether you lost your keys or discovered someone's wallet, post key details, general location, and time in under 60 seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-indigo-500/30">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Match & Inquire
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse real-time listings or receive alerts when similar items are logged nearby. Send secure claims without exposing private info.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Safe Recovery
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verify ownership with distinctive details or serial keys. Coordinate handover at safe community spots, campus desks, or partner hubs.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section id="community-impact" className="py-16">
        <Container>
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 bg-brand-900/50 px-3 py-1 rounded-full border border-brand-700/50">
                <ShieldCheck className="w-3.5 h-3.5" /> Community Trust Network
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Lost an item today? Don't lose hope.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Over 80% of reported belongings on FindNest are located and claimed within 48 hours. Report your item now to alert the community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <Button
                variant="lost"
                size="lg"
                icon={ShieldAlert}
                onClick={onOpenReportLost}
                className="w-full sm:w-auto"
              >
                Report Lost Item
              </Button>
              <Button
                variant="found"
                size="lg"
                icon={PlusCircle}
                onClick={onOpenReportFound}
                className="w-full sm:w-auto"
              >
                I Found Something
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Smart AI Matches Modal */}
      {matchingItem && (
        <SmartMatchesModal
          sourceItem={matchingItem}
          isOpen={Boolean(matchingItem)}
          onClose={() => setMatchingItem(null)}
          onSelectItem={(matched) => {
            setMatchingItem(null);
            if (onSelectItem) onSelectItem(matched);
          }}
        />
      )}
    </main>
  );
}
