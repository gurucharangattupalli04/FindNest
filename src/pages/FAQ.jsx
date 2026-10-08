import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  Search, 
  Sparkles, 
  ArrowLeft, 
  Mail, 
  ShieldCheck, 
  X,
  FileQuestion
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';

const FAQ_DATA = [
  {
    id: 'faq-1',
    category: 'reporting',
    question: "How do I report a lost item?",
    answer: "Go to the 'Report Lost Item' page from the dashboard, fill in details like item name, category, description, location, and date it was lost, then submit. Our system will automatically check for potential matches among found items."
  },
  {
    id: 'faq-2',
    category: 'reporting',
    question: "How do I report a found item?",
    answer: "Click 'Report Found Item' from the dashboard, add a description, photo (if available), and the location/date you found it. This helps the owner identify it and increases the chance of a match."
  },
  {
    id: 'faq-3',
    category: 'ai',
    question: "How does the AI matching system work?",
    answer: "FindNest uses AI-powered semantic matching to compare descriptions of lost and found items, even if the exact wording is different. When a strong match is found, both parties are notified automatically."
  },
  {
    id: 'faq-4',
    category: 'ai',
    question: "How will I know if there's a match for my item?",
    answer: "You'll receive an email notification and an in-app alert whenever the system detects a potential match for an item you've reported as lost or found."
  },
  {
    id: 'faq-5',
    category: 'privacy',
    question: "Is my personal information visible to other users?",
    answer: "No. Your contact details remain private. When a match is confirmed, FindNest facilitates communication without exposing your personal information directly to the other party."
  },
  {
    id: 'faq-6',
    category: 'ai',
    question: "What should I do if I get a false match?",
    answer: "You can dismiss the suggested match from your dashboard. This helps improve future matching accuracy and won't affect your existing reports."
  },
  {
    id: 'faq-7',
    category: 'reporting',
    question: "Can I edit or delete a report after submitting it?",
    answer: "Yes, go to 'My Reports' in your dashboard, select the item, and choose to edit the details or delete the report entirely."
  },
  {
    id: 'faq-8',
    category: 'general',
    question: "Is FindNest free to use?",
    answer: "Yes, FindNest is completely free for all users to report, search, and recover lost or found items."
  },
  {
    id: 'faq-9',
    category: 'privacy',
    question: "What happens to my data if I delete my account?",
    answer: "All your personal data and reports are permanently removed from our system in accordance with our data retention policy."
  },
  {
    id: 'faq-10',
    category: 'support',
    question: "Who do I contact for support?",
    answer: "Use the 'Contact Us' link in the footer, or email our support team directly, and we'll get back to you as soon as possible."
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'reporting', label: 'Reporting Items' },
  { id: 'ai', label: 'AI Matching' },
  { id: 'privacy', label: 'Privacy & Data' },
  { id: 'general', label: 'General & Support' }
];

export function FAQPage() {
  useEffect(() => {
    document.title = 'Frequently Asked Questions | FindNest';
  }, []);

  const [openIds, setOpenIds] = useState(new Set(['faq-1']));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toggleItem = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setOpenIds(new Set(FAQ_DATA.map((item) => item.id)));
  };

  const handleCollapseAll = () => {
    setOpenIds(new Set());
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category === selectedCategory ||
        (selectedCategory === 'general' && (item.category === 'general' || item.category === 'support'));

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="py-10 animate-fade-in bg-aurora-bg min-h-[calc(100vh-140px)]">
      <Container>
        {/* Navigation Breadcrumb / Back */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-aurora-muted hover:text-aurora-accent transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aurora-chip border border-aurora-border text-aurora-accent text-xs font-bold mb-4 shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-aurora-accent" />
            <span>FindNest Help & Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-aurora-text tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-aurora-muted leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about reporting lost & found items, our AI-powered semantic matching, privacy protection, and getting help.
          </p>

          {/* Search bar */}
          <div className="mt-8 relative max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-aurora-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="faq-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by keyword (e.g. AI match, edit, privacy)..."
                className="w-full bg-aurora-card border border-aurora-border rounded-2xl pl-11 pr-10 py-3.5 text-sm text-aurora-text placeholder:text-aurora-muted/60 focus:outline-none focus:ring-2 focus:ring-aurora-accent/20 focus:border-aurora-accent shadow-subtle transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-aurora-muted hover:text-aurora-text p-1 rounded-lg transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-aurora-accent text-white shadow-subtle'
                    : 'bg-aurora-card border border-aurora-border text-aurora-muted hover:bg-aurora-chip hover:text-aurora-text'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Controls */}
        <div className="max-w-3xl mx-auto flex items-center justify-between pb-4 border-b border-aurora-border mb-6 text-xs text-aurora-muted">
          <span>
            Showing <strong className="text-aurora-text">{filteredFaqs.length}</strong> of {FAQ_DATA.length} questions
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExpandAll}
              className="text-aurora-accent hover:underline font-semibold cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-aurora-border">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-aurora-muted hover:text-aurora-text font-semibold cursor-pointer hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 px-4 bg-aurora-card rounded-2xl border border-aurora-border">
              <FileQuestion className="w-12 h-12 text-aurora-muted mx-auto mb-3" />
              <h3 className="text-base font-bold text-aurora-text mb-1">No matching questions found</h3>
              <p className="text-xs text-aurora-muted max-w-sm mx-auto mb-4">
                We couldn't find any questions matching "{searchQuery}". Try a different keyword or reset filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Search & Filters
              </Button>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIds.has(faq.id);
              const questionNumber = String(index + 1).padStart(2, '0');

              return (
                <div
                  key={faq.id}
                  className={`bg-aurora-card rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-aurora-accent/50 shadow-subtle ring-1 ring-aurora-accent/20'
                      : 'border-aurora-border hover:border-aurora-accent/40 hover:shadow-subtle'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer group select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md transition-colors ${
                          isOpen
                            ? 'bg-aurora-chip text-aurora-accent'
                            : 'bg-aurora-chip/60 text-aurora-muted group-hover:bg-aurora-chip group-hover:text-aurora-text'
                        }`}
                      >
                        {questionNumber}
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-aurora-text group-hover:text-aurora-accent transition-colors leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen
                          ? 'rotate-180 bg-aurora-chip text-aurora-accent'
                          : 'bg-aurora-chip/60 text-aurora-muted group-hover:bg-aurora-chip group-hover:text-aurora-text'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-sm text-aurora-muted leading-relaxed border-t border-aurora-border animate-fade-in">
                      <div className="bg-aurora-bg rounded-xl p-4 border border-aurora-border text-aurora-text">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Support Banner */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-aurora-card rounded-2xl p-6 sm:p-8 text-aurora-text shadow-card flex flex-col sm:flex-row items-center justify-between gap-6 border border-aurora-border">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-aurora-success text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Dedicated Community Support</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-aurora-text">Still have questions or need assistance?</h3>
              <p className="text-xs sm:text-sm text-aurora-muted max-w-md">
                Our support team is always available to help you recover your belongings or verify a found listing.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="mailto:support@findnest.org?subject=FindNest%20Support%20Inquiry"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-aurora-accent hover:bg-aurora-accent/90 text-white font-semibold text-xs sm:text-sm transition-all shadow-subtle hover:scale-105 active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Email Support</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
