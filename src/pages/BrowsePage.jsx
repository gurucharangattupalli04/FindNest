import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle, 
  FileSearch, 
  ChevronLeft, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';
import { ItemCard } from '../features/items/ItemCard';
import { SearchFilters } from '../features/search/SearchFilters';
import { SmartMatchesModal } from '../features/items/SmartMatchesModal';
import { SkeletonCard } from '../components/common/Skeleton';
import { useApp } from '../context/AppContext';

const ITEMS_PER_PAGE = 6;

export function BrowsePage({ onSelectItem }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, error, refreshItems, setSelectedItem } = useApp();

  // Page title
  useEffect(() => {
    document.title = 'Browse Listings | FindNest';
  }, []);

  // Initialize filters from URL parameters if present
  const initialCategory = searchParams.get('category') || 'all';
  const initialType = (searchParams.get('type') || 'ALL').toUpperCase();
  const initialSearch = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [matchingItem, setMatchingItem] = useState(null);

  // Sync state if URL query params change externally
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
      setCurrentPage(1);
    }
  }, [searchParams, selectedCategory]);

  // Update URL search parameters when filters change
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (cat && cat !== 'all') {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (type && type !== 'ALL') {
      newParams.set('type', type);
    } else {
      newParams.delete('type');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Live filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
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
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      // Location filter
      if (locationFilter.trim()) {
        const loc = locationFilter.toLowerCase();
        if (!item.location?.toLowerCase().includes(loc)) return false;
      }
      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.date || item.created_at || 0).getTime();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today' && now - itemDate > dayMs) return false;
        if (dateFilter === 'week' && now - itemDate > 7 * dayMs) return false;
        if (dateFilter === 'month' && now - itemDate > 30 * dayMs) return false;
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'recent') {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'alpha') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'reward') {
        const hasRewardA = a.reward ? 1 : 0;
        const hasRewardB = b.reward ? 1 : 0;
        return hasRewardB - hasRewardA;
      }
      return 0;
    });

    return result;
  }, [items, selectedType, selectedCategory, searchQuery, locationFilter, dateFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedItems, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedCategory('all');
    setLocationFilter('');
    setDateFilter('all');
    setSortBy('recent');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemSelect = (item) => {
    if (onSelectItem) {
      onSelectItem(item);
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className="py-10 sm:py-14 animate-fade-in bg-aurora-bg min-h-[calc(100vh-140px)]">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-aurora-border">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aurora-chip text-aurora-accent text-xs font-bold mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>Live Community Database</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-aurora-text tracking-tight">
                Browse Community Listings
              </h1>
              <p className="text-xs sm:text-sm text-aurora-muted mt-1">
                Showing <strong className="text-aurora-text">{filteredAndSortedItems.length}</strong>{' '}
                {filteredAndSortedItems.length === 1 ? 'item' : 'items'} matching your current criteria
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                id="browse-report-lost-btn"
                variant="outline"
                size="sm"
                icon={ShieldAlert}
                onClick={() => navigate('/report-lost')}
                className="border-aurora-error/30 text-aurora-error hover:bg-aurora-error-bg"
              >
                Report Lost
              </Button>
              <Button
                id="browse-report-found-btn"
                variant="outline"
                size="sm"
                icon={PlusCircle}
                onClick={() => navigate('/report-found')}
                className="border-aurora-success/30 text-aurora-success hover:bg-aurora-success-bg"
              >
                Report Found
              </Button>
            </div>
          </div>

          {/* Search Filters Bar */}
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            locationFilter={locationFilter}
            onLocationChange={(l) => {
              setLocationFilter(l);
              setCurrentPage(1);
            }}
            dateFilter={dateFilter}
            onDateFilterChange={(d) => {
              setDateFilter(d);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortByChange={(s) => {
              setSortBy(s);
              setCurrentPage(1);
            }}
            onResetFilters={handleResetFilters}
            totalResults={filteredAndSortedItems.length}
          />

          {/* Grid of Listings with Loading, Error, and Empty states */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-aurora-error-bg border border-aurora-error/30 rounded-2xl p-8 sm:p-10 text-center max-w-md mx-auto space-y-4 shadow-subtle">
              <div className="w-12 h-12 bg-aurora-error/15 rounded-2xl flex items-center justify-center mx-auto text-aurora-error">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-aurora-text">Database Connection Issue</h3>
                <p className="text-xs text-aurora-error leading-relaxed">
                  {error}
                </p>
              </div>
              {refreshItems && (
                <Button variant="outline" size="sm" onClick={refreshItems} icon={RefreshCw}>
                  Retry Connection
                </Button>
              )}
            </div>
          ) : filteredAndSortedItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {paginatedItems.map((item) => (
                  <ItemCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onSelect={handleItemSelect}
                    onCheckMatches={(selected) => setMatchingItem(selected)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-aurora-border">
                  <p className="text-xs text-aurora-muted font-medium">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedItems.length)} of{' '}
                    {filteredAndSortedItems.length} items
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-aurora-border text-aurora-text hover:bg-aurora-chip disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-aurora-accent text-white shadow-subtle'
                            : 'text-aurora-muted hover:bg-aurora-chip hover:text-aurora-text'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-aurora-border text-aurora-text hover:bg-aurora-chip disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Enhanced Empty State */
            <div className="bg-aurora-card rounded-2xl border border-aurora-border p-12 text-center max-w-md mx-auto space-y-4 shadow-subtle animate-fade-in">
              <div className="w-16 h-16 bg-aurora-chip rounded-2xl flex items-center justify-center mx-auto text-aurora-muted">
                <FileSearch className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-display text-aurora-text">No matching items found</h3>
                <p className="text-xs text-aurora-muted leading-relaxed max-w-xs mx-auto">
                  We couldn't find any items matching your active filters. Try broadening your keywords or resetting filters.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetFilters} icon={RefreshCw}>
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </Container>

      {/* Smart Matches Modal */}
      {matchingItem && (
        <SmartMatchesModal
          sourceItem={matchingItem}
          isOpen={Boolean(matchingItem)}
          onClose={() => setMatchingItem(null)}
          onSelectItem={handleItemSelect}
        />
      )}
    </div>
  );
}
