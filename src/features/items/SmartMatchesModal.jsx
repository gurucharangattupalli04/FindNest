import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  ShieldCheck,
  Award,
  Info,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { itemsApi } from '../../services/itemsApi';

export function SmartMatchesModal({
  sourceItem,
  isOpen,
  onClose,
  onSelectItem,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchesData, setMatchesData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('score');

  const isLost = sourceItem?.type === 'LOST';
  const oppositeType = isLost ? 'Found' : 'Lost';

  const fetchMatches = useCallback(async () => {
    if (!sourceItem?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await itemsApi.getItemMatches(sourceItem.id, sourceItem.type, 20);
      setMatchesData(data);
    } catch (err) {
      console.error('Failed to fetch AI matches:', err);
      setError(err.message || 'Unable to compute AI matches at this time.');
    } finally {
      setLoading(false);
    }
  }, [sourceItem]);

  useEffect(() => {
    if (isOpen && sourceItem?.id) {
      fetchMatches();
    } else {
      setMatchesData(null);
      setError(null);
      setExpandedId(null);
      setConfidenceFilter('ALL');
      setSortBy('score');
    }
  }, [isOpen, sourceItem?.id, fetchMatches]);

  const rawMatches = useMemo(() => matchesData?.matches || [], [matchesData?.matches]);
  const analyzedCount = matchesData?.total_candidates_analyzed || 0;

  // Confidence Filter & Sorting
  const filteredAndSortedMatches = useMemo(() => {
    let result = [...rawMatches];

    if (confidenceFilter !== 'ALL') {
      result = result.filter(
        (m) => m.confidence?.toLowerCase() === confidenceFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.matched_item?.date || a.matched_item?.created_at || 0).getTime();
        const dateB = new Date(b.matched_item?.date || b.matched_item?.created_at || 0).getTime();
        return dateB - dateA;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.matched_item?.id || 0) - (a.matched_item?.id || 0);
    });

    return result;
  }, [rawMatches, confidenceFilter, sortBy]);

  if (!sourceItem) return null;

  const getConfidenceBadge = (confidence, score) => {
    const conf = (confidence || '').toLowerCase();
    if (conf === 'high' || score >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-success-bg text-aurora-success border border-aurora-success/20">
          <Sparkles className="w-3 h-3 text-aurora-success" />
          High Match ({score}%)
        </span>
      );
    }
    if (conf === 'medium' || score >= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-warning-bg text-aurora-warning border border-aurora-warning/20">
          <CheckCircle2 className="w-3 h-3 text-aurora-warning" />
          Medium Match ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-chip text-aurora-muted border border-aurora-border">
        <Clock className="w-3 h-3 text-aurora-muted" />
        Possible Match ({score}%)
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart AI Matches"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Clean AI Header Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-aurora-chip border border-aurora-border text-aurora-text shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-aurora-card text-aurora-accent border border-aurora-border">
                  <Sparkles className="w-3 h-3 text-aurora-accent" />
                  Gemini Multimodal Engine
                </span>
                <span className="text-xs text-aurora-muted font-medium">
                  5-Factor Hybrid AI Matching
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-aurora-text tracking-tight">
                Scanning Active {oppositeType} Reports
              </h3>
              <p className="text-xs text-aurora-muted">
                Source: <span className="font-semibold text-aurora-text">"{sourceItem.title}"</span>{' '}
                <span className="text-aurora-muted">({sourceItem.category})</span>
              </p>
            </div>

            <button
              id="ai-matches-rescan-btn"
              onClick={fetchMatches}
              disabled={loading}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aurora-card hover:bg-aurora-chip text-xs font-semibold text-aurora-text transition-colors border border-aurora-border disabled:opacity-50 shrink-0 cursor-pointer shadow-subtle"
              title="Re-run AI Matching Engine"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-scan</span>
            </button>
          </div>

          {/* 5-Factor Weights Bar */}
          <div className="mt-3.5 pt-3 border-t border-aurora-border flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-aurora-muted font-semibold">
            <span className="bg-aurora-card px-2 py-0.5 rounded-md border border-aurora-border">Embedding 50%</span>
            <span className="bg-aurora-card px-2 py-0.5 rounded-md border border-aurora-border">Category 20%</span>
            <span className="bg-aurora-card px-2 py-0.5 rounded-md border border-aurora-border">Location 15%</span>
            <span className="bg-aurora-card px-2 py-0.5 rounded-md border border-aurora-border">Brand+Color 10%</span>
            <span className="bg-aurora-card px-2 py-0.5 rounded-md border border-aurora-border">Temporal 5%</span>
          </div>
        </div>

        {/* Filters & Sorting Toolbar */}
        {!loading && !error && rawMatches.length > 0 && (
          <div className="p-3 bg-aurora-card rounded-xl border border-aurora-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            {/* Confidence Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-semibold text-aurora-muted flex items-center gap-1 shrink-0 mr-1">
                <SlidersHorizontal className="w-3 h-3 text-aurora-muted" />
                Filter:
              </span>
              {[
                { id: 'ALL', label: `All (${rawMatches.length})` },
                { id: 'high', label: `High (≥75%)` },
                { id: 'medium', label: `Medium (50–74%)` },
                { id: 'low', label: `Possible (35–49%)` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setConfidenceFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    confidenceFilter === pill.id
                      ? 'bg-aurora-accent text-white shadow-subtle'
                      : 'bg-aurora-chip text-aurora-muted hover:text-aurora-text'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-aurora-muted flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-aurora-muted" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-aurora-card border border-aurora-border rounded-lg px-2.5 py-1 text-xs text-aurora-text font-semibold focus:outline-none focus:border-aurora-accent cursor-pointer"
              >
                <option value="score">Highest Score</option>
                <option value="date">Most Recent</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading State: Clean Skeletons */}
        {loading && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-aurora-border border-t-aurora-accent animate-spin" />
              <p className="text-sm font-bold text-aurora-text">
                Computing 5-Factor Hybrid AI Matches...
              </p>
              <p className="text-xs text-aurora-muted">
                Analyzing multimodal Gemini embeddings, geo coordinates, and metadata
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-aurora-card border border-aurora-border animate-pulse space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 bg-aurora-chip rounded-full" />
                    <div className="h-6 w-16 bg-aurora-chip rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-aurora-chip rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-aurora-chip rounded" />
                      <div className="h-3 w-1/2 bg-aurora-chip rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-full bg-aurora-chip rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-aurora-error-bg border border-aurora-error/20 text-aurora-error flex items-start gap-3 shadow-subtle">
            <AlertCircle className="w-5 h-5 text-aurora-error shrink-0 mt-0.5" />
            <div className="text-xs space-y-2 flex-1">
              <div>
                <p className="font-bold text-aurora-error text-sm">Matching Engine Notice</p>
                <p className="text-aurora-error leading-relaxed">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchMatches}
                className="text-xs"
              >
                Retry AI Scan
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && rawMatches.length === 0 && (
          <div className="py-10 px-6 rounded-2xl bg-aurora-chip border border-dashed border-aurora-border flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-aurora-card text-aurora-accent flex items-center justify-center shadow-subtle border border-aurora-border">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-base font-bold text-aurora-text">
                No Confident Matches Found Yet
              </h4>
              <p className="text-xs text-aurora-muted leading-relaxed">
                Our AI evaluated <strong className="text-aurora-text">{analyzedCount} active {oppositeType.toLowerCase()} items</strong>. None currently meet the 35% confidence threshold.
              </p>
              <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-aurora-accent font-medium">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>As new community reports arrive, matches will automatically appear here.</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && !error && rawMatches.length > 0 && filteredAndSortedMatches.length === 0 && (
          <div className="py-6 px-4 text-center space-y-1.5 bg-aurora-chip rounded-xl border border-aurora-border">
            <p className="text-xs font-semibold text-aurora-muted">
              No matches found in the <strong className="uppercase text-aurora-text">{confidenceFilter}</strong> confidence tier.
            </p>
            <button
              onClick={() => setConfidenceFilter('ALL')}
              className="text-xs font-bold text-aurora-accent hover:underline cursor-pointer"
            >
              Reset filter to show all {rawMatches.length} matches
            </button>
          </div>
        )}

        {/* Matches List */}
        {!loading && !error && filteredAndSortedMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-aurora-muted px-1 font-medium">
              <span>
                Showing <strong className="text-aurora-text">{filteredAndSortedMatches.length}</strong> of {rawMatches.length} candidates
              </span>
              <span>{analyzedCount} opposite reports evaluated</span>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {filteredAndSortedMatches.map((match) => {
                const item = match.matched_item;
                const isExpanded = expandedId === item.id;
                const b = match.breakdown;

                return (
                  <div
                    key={`${item.type || 'match'}-${item.id}`}
                    className="rounded-xl bg-aurora-card border border-aurora-border hover:border-aurora-accent hover:shadow-card-hover transition-all duration-150 overflow-hidden"
                  >
                    {/* Top Row: Thumbnail, Title, Badge, Action */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-aurora-chip border border-aurora-border shrink-0 overflow-hidden flex items-center justify-center relative">
                          {(item.imageUrl || item.image_url) ? (
                            <img
                              src={item.imageUrl || item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center text-aurora-muted ${
                              (item.imageUrl || item.image_url) ? 'hidden' : 'flex'
                            }`}
                          >
                            <Tag className="w-5 h-5" />
                          </div>

                          <div className="absolute bottom-0 inset-x-0 bg-aurora-card/90 text-aurora-accent text-[9px] font-extrabold text-center py-0.5 border-t border-aurora-border">
                            {match.score}%
                          </div>
                        </div>

                        {/* Text Information */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getConfidenceBadge(match.confidence, match.score)}
                            <Badge variant={item.type === 'LOST' ? 'lost' : 'found'} size="sm">
                              {item.type}
                            </Badge>
                            <span className="text-[11px] font-semibold text-aurora-muted uppercase tracking-wide">
                              {item.category}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-aurora-text truncate">
                            {item.title}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-aurora-muted flex-wrap">
                            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-aurora-muted" />
                              <span>{formatDate(item.date)}</span>
                            </span>
                          </div>

                          {/* Brand / Color / Storage highlights */}
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-aurora-muted flex-wrap">
                            {item.brand && (
                              <span className="bg-aurora-chip px-2 py-0.5 rounded-md font-medium text-aurora-text border border-aurora-border">
                                Brand: <strong>{item.brand}</strong>
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-aurora-chip px-2 py-0.5 rounded-md font-medium text-aurora-text border border-aurora-border">
                                Color: <strong>{item.color}</strong>
                              </span>
                            )}
                            {item.storage_location && (
                              <span className="bg-aurora-success-bg text-aurora-success px-2 py-0.5 rounded-md font-semibold border border-aurora-success/20">
                                Safekeeping: {item.storage_location}
                              </span>
                            )}
                            {item.reward && (
                              <span className="bg-aurora-warning-bg text-aurora-warning px-2 py-0.5 rounded-md font-bold border border-aurora-warning/20 inline-flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {item.reward}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Inspect Matched Item Button */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          id={`inspect-match-btn-${item.id}`}
                          variant="primary"
                          size="sm"
                          icon={ExternalLink}
                          onClick={() => {
                            onClose();
                            if (onSelectItem) onSelectItem(item);
                          }}
                          className="text-xs"
                        >
                          Inspect Item
                        </Button>
                      </div>
                    </div>

                    {/* AI Evidence Reasons Chips: chip background, #1B1F3B text, small accent icon */}
                    {match.reasons && match.reasons.length > 0 && (
                      <div className="px-4 py-2 bg-aurora-chip border-t border-aurora-border flex flex-wrap gap-1.5 text-xs">
                        {match.reasons.slice(0, 3).map((reason, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-aurora-chip border border-aurora-border text-aurora-text font-medium"
                          >
                            <Sparkles className="w-3 h-3 text-aurora-accent shrink-0" />
                            <span>{reason}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Toggle Explainability Breakdown Button */}
                    <div className="px-4 py-2 bg-aurora-card border-t border-aurora-border flex items-center justify-between">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-aurora-muted hover:text-aurora-accent transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-aurora-accent" />
                        <span>{isExpanded ? 'Hide scoring factors' : 'Explain match score (5 factors)'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-2">
                        {b?.is_fallback && (
                          <span className="text-[10px] text-aurora-warning font-semibold bg-aurora-warning-bg px-2 py-0.5 rounded-md border border-aurora-warning/20">
                            Fallback weights
                          </span>
                        )}
                        <span className="text-xs font-bold text-aurora-text">
                          Score: <span className="text-aurora-accent">{match.score}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Expanded 5-Factor Score Breakdown */}
                    {isExpanded && b && (
                      <div className="p-4 bg-aurora-chip border-t border-aurora-border space-y-3.5 animate-fade-in text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                          {/* 1. Vector Embedding */}
                          <div className="p-2.5 rounded-xl bg-aurora-card border border-aurora-border space-y-1">
                            <p className="text-[10px] uppercase font-semibold text-aurora-muted">Embedding</p>
                            <p className="text-sm font-bold text-aurora-accent">
                              {b.embedding_similarity !== null ? `${Math.round(b.embedding_similarity * 100)}%` : 'N/A'}
                            </p>
                            <div className="w-full bg-aurora-chip h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-aurora-accent h-full rounded-full"
                                style={{ width: `${b.embedding_similarity !== null ? Math.round(b.embedding_similarity * 100) : 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-aurora-muted">50% wt</p>
                          </div>

                          {/* 2. Category */}
                          <div className="p-2.5 rounded-xl bg-aurora-card border border-aurora-border space-y-1">
                            <p className="text-[10px] uppercase font-semibold text-aurora-muted">Category</p>
                            <p className="text-sm font-bold text-aurora-success">
                              {Math.round(b.category_score * 100)}%
                            </p>
                            <div className="w-full bg-aurora-chip h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-aurora-success h-full rounded-full"
                                style={{ width: `${Math.round(b.category_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-aurora-muted">
                              {b.is_fallback ? '40% wt' : '20% wt'}
                            </p>
                          </div>

                          {/* 3. Location */}
                          <div className="p-2.5 rounded-xl bg-aurora-card border border-aurora-border space-y-1">
                            <p className="text-[10px] uppercase font-semibold text-aurora-muted">Location</p>
                            <p className="text-sm font-bold text-aurora-accent">
                              {Math.round(b.location_score * 100)}%
                            </p>
                            <div className="w-full bg-aurora-chip h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-aurora-accent h-full rounded-full"
                                style={{ width: `${Math.round(b.location_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-aurora-muted">
                              {b.is_fallback ? '30% wt' : '15% wt'}
                            </p>
                          </div>

                          {/* 4. Brand + Color */}
                          <div className="p-2.5 rounded-xl bg-aurora-card border border-aurora-border space-y-1">
                            <p className="text-[10px] uppercase font-semibold text-aurora-muted">Brand/Color</p>
                            <p className="text-sm font-bold text-aurora-warning">
                              {Math.round(b.brand_color_score * 100)}%
                            </p>
                            <div className="w-full bg-aurora-chip h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-aurora-warning h-full rounded-full"
                                style={{ width: `${Math.round(b.brand_color_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-aurora-muted">
                              {b.is_fallback ? '20% wt' : '10% wt'}
                            </p>
                          </div>

                          {/* 5. Temporal */}
                          <div className="p-2.5 rounded-xl bg-aurora-card border border-aurora-border space-y-1 col-span-2 sm:col-span-1">
                            <p className="text-[10px] uppercase font-semibold text-aurora-muted">Temporal</p>
                            <p className="text-sm font-bold text-aurora-accent">
                              {Math.round(b.temporal_score * 100)}%
                            </p>
                            <div className="w-full bg-aurora-chip h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-aurora-accent h-full rounded-full"
                                style={{ width: `${Math.round(b.temporal_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-aurora-muted">
                              {b.is_fallback ? '10% wt' : '5% wt'}
                            </p>
                          </div>
                        </div>

                        {/* All match reasons list */}
                        <div className="p-3 bg-aurora-card rounded-xl border border-aurora-border space-y-1.5">
                          <p className="text-[10px] font-bold text-aurora-muted uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-aurora-accent" />
                            Comprehensive Scoring Factors & Reasons
                          </p>
                          <ul className="space-y-1 text-xs text-aurora-text">
                            {match.reasons.map((r, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-aurora-accent shrink-0" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
