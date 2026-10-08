import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  X, 
  ArrowUpDown, 
  Calendar, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { CATEGORIES } from '../../services/mockItems';

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  locationFilter,
  onLocationChange,
  dateFilter = 'all',
  onDateFilterChange,
  sortBy = 'recent',
  onSortByChange,
  onResetFilters,
  totalResults: _totalResults = 0
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce local search input
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchQuery]);

  // Count active non-default filters
  const activeFiltersCount = [
    searchQuery.trim() !== '',
    locationFilter.trim() !== '',
    selectedType !== 'ALL',
    selectedCategory !== 'all',
    dateFilter !== 'all',
    sortBy !== 'recent'
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-aurora-card rounded-2xl border border-aurora-border p-4 sm:p-5 space-y-4 shadow-subtle transition-colors">
      {/* Search & Location Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Keyword Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-aurora-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="main-search-input"
            type="text"
            placeholder="Search by keywords (e.g. MacBook Pro, Wallet, Keys, Dog...)"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-aurora-card border border-aurora-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-aurora-text placeholder:text-aurora-muted focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-aurora-muted hover:text-aurora-text p-1 rounded-full cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Location Search */}
        <div className="md:col-span-4 relative">
          <MapPin className="w-4 h-4 text-aurora-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="location-search-input"
            type="text"
            placeholder="Filter location (e.g. Library, Terminal)"
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full bg-aurora-card border border-aurora-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-aurora-text placeholder:text-aurora-muted focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20 transition-all"
          />
          {locationFilter && (
            <button
              onClick={() => onLocationChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-aurora-muted hover:text-aurora-text p-1 rounded-full cursor-pointer"
              aria-label="Clear location filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle & Reset Button */}
        <div className="md:col-span-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-aurora-border bg-aurora-chip text-aurora-text text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-aurora-accent" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              title="Reset all filters"
              className="px-3 py-2.5 rounded-xl border border-aurora-border bg-aurora-card hover:bg-aurora-chip text-aurora-muted hover:text-aurora-accent text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Category & Type Filters */}
      <div className={`space-y-3 pt-2 border-t border-aurora-border ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
        {/* Row 1: Type Selection Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-aurora-chip rounded-xl border border-aurora-border">
            <button
              type="button"
              onClick={() => onTypeChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedType === 'ALL'
                  ? 'bg-aurora-accent text-white shadow-subtle'
                  : 'text-aurora-muted hover:text-aurora-text'
              }`}
            >
              All Listings
            </button>
            <button
              type="button"
              onClick={() => onTypeChange('LOST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedType === 'LOST'
                  ? 'bg-aurora-error-bg text-aurora-error border border-aurora-error/20'
                  : 'text-aurora-muted hover:text-aurora-text'
              }`}
            >
              Lost Items
            </button>
            <button
              type="button"
              onClick={() => onTypeChange('FOUND')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedType === 'FOUND'
                  ? 'bg-aurora-success-bg text-aurora-success border border-aurora-success/20'
                  : 'text-aurora-muted hover:text-aurora-text'
              }`}
            >
              Found Items
            </button>
          </div>

          {/* Date & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Date filter dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-aurora-border bg-aurora-card text-aurora-muted">
              <Calendar className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value)}
                className="bg-transparent text-aurora-text font-medium text-xs focus:outline-none cursor-pointer"
                aria-label="Filter by date range"
              >
                <option value="all">Any Date</option>
                <option value="today">Past 24 Hours</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-aurora-border bg-aurora-card text-aurora-muted">
              <ArrowUpDown className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="bg-transparent text-aurora-text font-medium text-xs focus:outline-none cursor-pointer"
                aria-label="Sort listings"
              >
                <option value="recent">Most Recent</option>
                <option value="reward">Highest Reward</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
              selectedCategory === 'all'
                ? 'bg-aurora-accent text-white border-aurora-accent shadow-subtle'
                : 'bg-aurora-chip text-aurora-muted border-aurora-border hover:text-aurora-text hover:border-aurora-accent/40'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-aurora-accent text-white border-aurora-accent shadow-subtle'
                    : 'bg-aurora-chip text-aurora-muted border-aurora-border hover:text-aurora-text hover:border-aurora-accent/40'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
