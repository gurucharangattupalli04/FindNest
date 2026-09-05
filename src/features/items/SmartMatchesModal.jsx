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
import { formatDate, formatTimeAgo } from '../../utils/formatters';
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
  const [confidenceFilter, setConfidenceFilter] = useState('ALL'); // 'ALL' | 'high' | 'medium' | 'low'
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'date'

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

    // Filter by confidence
    if (confidenceFilter !== 'ALL') {
      result = result.filter(
        (m) => m.confidence?.toLowerCase() === confidenceFilter.toLowerCase()
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.matched_item?.date || a.matched_item?.created_at || 0).getTime();
        const dateB = new Date(b.matched_item?.date || b.matched_item?.created_at || 0).getTime();
        return dateB - dateA;
      }
      // Default: sort by score descending, then ID descending for determinism
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          High Match ({score}%)
        </span>
      );
    }
    if (conf === 'medium' || score >= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          Medium Match ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        Possible Match ({score}%)
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'from-emerald-500 to-teal-600 text-emerald-700';
    if (score >= 50) return 'from-amber-500 to-orange-500 text-amber-700';
    return 'from-slate-500 to-zinc-600 text-slate-700';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart AI Matches"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Futuristic AI Header Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-purple-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/30">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  Gemini Multimodal 2 Engine
                </span>
                <span className="text-xs text-purple-200/80 font-medium">
                  5-Factor Hybrid AI Matching
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Scanning Active {oppositeType} Reports
              </h3>
              <p className="text-xs text-purple-200/90">
                Source: <span className="font-semibold text-white">"{sourceItem.title}"</span>{' '}
                <span className="text-purple-300">({sourceItem.category})</span>
              </p>
            </div>

            <button
              id="ai-matches-rescan-btn"
              onClick={fetchMatches}
              disabled={loading}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-xs font-semibold text-white transition-all border border-white/15 disabled:opacity-50 shrink-0 shadow-sm"
              title="Re-run AI Matching Engine"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-scan
            </button>
          </div>

          {/* 5-Factor Weights Bar */}
          <div className="mt-3.5 pt-3 border-t border-purple-700/40 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-purple-200/90 font-semibold">
            <span className="bg-purple-800/60 px-2 py-0.5 rounded-md border border-purple-600/40">Embedding 50%</span>
            <span className="bg-purple-800/60 px-2 py-0.5 rounded-md border border-purple-600/40">Category 20%</span>
            <span className="bg-purple-800/60 px-2 py-0.5 rounded-md border border-purple-600/40">Location 15%</span>
            <span className="bg-purple-800/60 px-2 py-0.5 rounded-md border border-purple-600/40">Brand+Color 10%</span>
            <span className="bg-purple-800/60 px-2 py-0.5 rounded-md border border-purple-600/40">Temporal 5%</span>
          </div>
        </div>

        {/* Filters & Sorting Toolbar */}
        {!loading && !error && rawMatches.length > 0 && (
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            {/* Confidence Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                <SlidersHorizontal className="w-3 h-3 text-slate-500" />
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    confidenceFilter === pill.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="score">Highest Score</option>
                <option value="date">Most Recent</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading State: Radar Scan & Skeletons */}
        {loading && (
          <div className="py-10 space-y-4">
            <div className="flex flex-col items-center justify-center gap-2.5 text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-3 border-purple-500/20 border-t-purple-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">
                  Computing 5-Factor Hybrid AI Matches...
                </p>
                <p className="text-xs text-slate-500">
                  Analyzing multimodal Gemini embeddings, geo coordinates, and metadata
                </p>
              </div>
            </div>

            {/* Shimmer Skeletons */}
            <div className="space-y-3 pt-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white border border-slate-200 animate-pulse space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 bg-slate-200 rounded-full" />
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-200 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-full bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-2 flex-1">
              <div>
                <p className="font-extrabold text-rose-900 text-sm">Matching Engine Notice</p>
                <p className="text-rose-700 leading-relaxed">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchMatches}
                className="text-xs border-rose-300 text-rose-800 hover:bg-rose-100/70"
              >
                Retry AI Scan
              </Button>
            </div>
          </div>
        )}

        {/* Empty State (0 matches >= 35%) */}
        {!loading && !error && rawMatches.length === 0 && (
          <div className="py-12 px-6 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h4 className="text-base font-bold text-slate-800">
                No Confident Matches Found Yet
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our AI evaluated <strong className="text-slate-700">{analyzedCount} active {oppositeType.toLowerCase()} items</strong> across multimodal embeddings and metadata. None currently cross the <strong className="text-slate-700">35% confidence threshold</strong>.
              </p>
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-purple-700 font-semibold bg-purple-50/80 px-3 py-1.5 rounded-xl border border-purple-200">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>As new community reports arrive, matches will automatically appear here.</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Empty State (matches exist, but none in selected confidence tier) */}
        {!loading && !error && rawMatches.length > 0 && filteredAndSortedMatches.length === 0 && (
          <div className="py-8 px-4 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-600">
              No matches found in the <strong className="uppercase">{confidenceFilter}</strong> confidence tier.
            </p>
            <button
              onClick={() => setConfidenceFilter('ALL')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer"
            >
              Reset filter to show all {rawMatches.length} matches
            </button>
          </div>
        )}

        {/* Matches List */}
        {!loading && !error && filteredAndSortedMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
              <span>
                Showing <strong className="text-slate-800">{filteredAndSortedMatches.length}</strong> of {rawMatches.length} candidates
              </span>
              <span>{analyzedCount} opposite reports evaluated</span>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {filteredAndSortedMatches.map((match) => {
                const item = match.matched_item;
                const isExpanded = expandedId === item.id;
                const b = match.breakdown;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    {/* Top Row: Thumbnail, Title, Badge, Action */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Thumbnail with Graceful Error Fallback */}
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center relative">
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
                            className={`w-full h-full flex items-center justify-center text-slate-400 ${
                              (item.imageUrl || item.image_url) ? 'hidden' : 'flex'
                            }`}
                          >
                            <Tag className="w-6 h-6" />
                          </div>

                          {/* Mini Match Score Chip */}
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold text-center py-0.5">
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
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              {item.category}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(item.date)}</span>
                              <span className="text-slate-400 text-[10px]">({formatTimeAgo(item.date)})</span>
                            </span>
                          </div>

                          {/* Brand / Color / Storage highlights */}
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-600 flex-wrap">
                            {item.brand && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                                Brand: <strong>{item.brand}</strong>
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                                Color: <strong>{item.color}</strong>
                              </span>
                            )}
                            {item.storage_location && (
                              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                                Safekeeping: {item.storage_location}
                              </span>
                            )}
                            {item.reward && (
                              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold border border-amber-200 inline-flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-600" />
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
                          className="text-xs bg-purple-600 hover:bg-purple-500 font-bold shadow-sm"
                        >
                          Inspect Item
                        </Button>
                      </div>
                    </div>

                    {/* Reasons Highlights Bar */}
                    {match.reasons && match.reasons.length > 0 && (
                      <div className="px-4 py-2.5 bg-purple-50/60 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                        {match.reasons.slice(0, 3).map((reason, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-purple-200 text-purple-900 font-semibold shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{reason}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Toggle Explainability Breakdown Button */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        <span>{isExpanded ? 'Hide AI Scoring Factors' : 'Explain Match Score (5 Factors)'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-2">
                        {b?.is_fallback && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Fallback Weights
                          </span>
                        )}
                        <span className="text-[11px] font-extrabold text-slate-800">
                          Score: <span className={getScoreColor(match.score)}>{match.score}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Expanded 5-Factor Score Breakdown */}
                    {isExpanded && b && (
                      <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3.5 animate-fade-in text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                          {/* 1. Vector Embedding */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Embedding</p>
                            <p className="text-sm font-extrabold text-purple-700">
                              {b.embedding_similarity !== null ? `${Math.round(b.embedding_similarity * 100)}%` : 'N/A'}
                            </p>
                            {/* Mini Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full"
                                style={{ width: `${b.embedding_similarity !== null ? Math.round(b.embedding_similarity * 100) : 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">Weight: 50%</p>
                          </div>

                          {/* 2. Category */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Category</p>
                            <p className="text-sm font-extrabold text-slate-800">
                              {Math.round(b.category_score * 100)}%
                            </p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${Math.round(b.category_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Weight: {b.is_fallback ? '40%' : '20%'}
                            </p>
                          </div>

                          {/* 3. Location */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                            <p className="text-sm font-extrabold text-slate-800">
                              {Math.round(b.location_score * 100)}%
                            </p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full"
                                style={{ width: `${Math.round(b.location_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Weight: {b.is_fallback ? '30%' : '15%'}
                            </p>
                          </div>

                          {/* 4. Brand + Color */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Brand/Color</p>
                            <p className="text-sm font-extrabold text-slate-800">
                              {Math.round(b.brand_color_score * 100)}%
                            </p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-600 h-full rounded-full"
                                style={{ width: `${Math.round(b.brand_color_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Weight: {b.is_fallback ? '20%' : '10%'}
                            </p>
                          </div>

                          {/* 5. Temporal */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Temporal</p>
                            <p className="text-sm font-extrabold text-slate-800">
                              {Math.round(b.temporal_score * 100)}%
                            </p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.round(b.temporal_score * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Weight: {b.is_fallback ? '10%' : '5%'}
                            </p>
                          </div>
                        </div>

                        {/* All match reasons list */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                            Comprehensive Scoring Factors & Reasons
                          </p>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {match.reasons.map((r, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
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
