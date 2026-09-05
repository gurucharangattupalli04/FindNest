import React from 'react';
import { Search, MapPin, Filter, Layers } from 'lucide-react';
import { CATEGORIES } from '../../services/mockItems';

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  locationFilter,
  onLocationChange
}) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Search Inputs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Main Item Search */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="main-search-input"
            type="text"
            placeholder="Search keywords (e.g., iPhone 14, Leather Wallet, Keys, Dog...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Location Filter */}
        <div className="sm:col-span-5 relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="location-search-input"
            type="text"
            placeholder="Filter by location (e.g., Library, Metro)"
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
      </div>

      {/* Filter Chips Row: Type Switch + Category Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {/* Type Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => onTypeChange('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedType === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => onTypeChange('LOST')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedType === 'LOST'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => onTypeChange('FOUND')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedType === 'FOUND'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Found
          </button>
        </div>

        {/* Category horizontal scroll pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
