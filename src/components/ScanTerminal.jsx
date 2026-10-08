import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Award,
  AlertTriangle,
  Info,
  Radio,
  FileSearch,
  CheckCircle2,
} from 'lucide-react';
import { itemsApi } from '../services/itemsApi';
import { formatDate } from '../utils/formatters';

/**
 * ScanTerminal Component — Aurora Light Theme
 *
 * Clean, modern AI Radar matching interface with:
 * - Clean white card frame with #E3E6F8 border and 16px rounded corners (no dark/terminal window frame)
 * - Muted informational status strip with plain readable wording
 * - Clean radar with #C9CCF5 rings & crosshairs, #5B5BF0 accent center pin (no heavy glow/blur)
 * - Accent color sweep line at low opacity
 * - Result card with big accent-colored percentage, chip badges, and accent CTA button
 * - AI evidence chips with chip background and text primary
 */
export function ScanTerminal({
  reports = [],
  selectedItem = null,
  onSelectItem,
  onOpenReportLost,
  onOpenReportFound,
  mode = 'live',
  title = 'AI Matching Radar',
  subtitle = 'Real-time 5-factor scoring engine scanning community listings',
  className = '',
}) {
  const [activeReportOverride, setActiveReportOverride] = useState(null);
  const activeReport = selectedItem || activeReportOverride || reports[0] || null;

  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'SCANNING' | 'SUCCESS' | 'NO_MATCH' | 'ERROR'
  const [statusText, setStatusText] = useState('Radar standby: select an item and run AI match');
  const [matchData, setMatchData] = useState(null);
  const [topMatch, setTopMatch] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [error, setError] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const animFrameRef = useRef(null);

  // Smooth score counter animation from 0 up to actual score
  const animateScore = useCallback((targetScore) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const duration = 750;
    const startTime = performance.now();
    const startVal = 0;
    const endVal = Math.round(targetScore);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayScore(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Execute real backend AI match scan
  const handleRunScan = async () => {
    if (!activeReport?.id || isScanning) return;

    setIsScanning(true);
    setStatus('SCANNING');
    setStatusText('Scanning community reports with multimodal AI...');
    setError(null);
    setMatchData(null);
    setTopMatch(null);
    setDisplayScore(0);
    setShowBreakdown(false);

    const startTime = Date.now();

    try {
      const data = await itemsApi.getItemMatches(activeReport.id, activeReport.type, 10);

      // Enforce minimum visible scan animation of 800ms
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 800 - elapsed);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setMatchData(data);

      if (data.matches && data.matches.length > 0) {
        const best = data.matches[0];
        setTopMatch(best);
        setStatus('SUCCESS');
        setStatusText(
          `Match confirmed, ${best.score.toFixed(1)}% confidence, ${data.matches_count} candidate(s) meet the threshold`
        );
        animateScore(best.score);
      } else {
        setStatus('NO_MATCH');
        setStatusText(
          `Scan complete: 0 of ${data.total_candidates_analyzed || 0} reports meet the 35% threshold`
        );
      }
    } catch (err) {
      console.error('ScanTerminal query error:', err);
      setStatus('ERROR');
      const msg = err.message || 'Matching engine query timed out or failed.';
      setError(msg);
      setStatusText(`Notice: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'SCANNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-warning-bg text-aurora-warning border border-aurora-warning/20">
            <span className="w-1.5 h-1.5 rounded-full bg-aurora-warning animate-ping" />
            Scanning listings
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-success-bg text-aurora-success border border-aurora-success/20">
            <CheckCircle2 className="w-3 h-3" />
            Match detected
          </span>
        );
      case 'NO_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-chip text-aurora-muted border border-aurora-border">
            <Info className="w-3 h-3" />
            No matches yet
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-error-bg text-aurora-error border border-aurora-error/20">
            <AlertTriangle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-chip text-aurora-muted border border-aurora-border">
            <span className="w-1.5 h-1.5 rounded-full bg-aurora-muted" />
            Standby
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-aurora-card rounded-2xl border border-aurora-border shadow-card overflow-hidden transition-colors ${className}`}
    >
      {/* Clean Header Bar with small muted pills */}
      <div className="px-6 py-4 border-b border-aurora-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-aurora-chip flex items-center justify-center text-aurora-accent">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-aurora-text tracking-tight">
            FindNest AI Radar
          </span>
        </div>

        {/* Muted header pills (no purple neon) */}
        <div className="flex items-center gap-2">
          {mode === 'demo' && (
            <span className="text-[11px] font-medium text-aurora-muted bg-aurora-chip px-2.5 py-0.5 rounded-full border border-aurora-border">
              Sample demo mode
            </span>
          )}
          <span className="text-[11px] font-medium text-aurora-muted bg-aurora-chip px-2.5 py-0.5 rounded-full border border-aurora-border flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-aurora-accent" />
            <span>Gemini Multimodal</span>
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-5">
        {/* Title & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-bold text-aurora-text tracking-tight">
                {title}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs sm:text-sm text-aurora-muted">
              {subtitle}
            </p>
          </div>

          {/* Report Dropdown & Single-line Run AI Match Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {reports.length > 0 ? (
              <div className="relative min-w-[240px]">
                <label htmlFor="scan-report-select" className="sr-only">Select report to scan</label>
                <select
                  id="scan-report-select"
                  value={activeReport?.id ? `${activeReport.type}-${activeReport.id}` : ''}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split('-');
                    const found = reports.find((r) => String(r.id) === id && r.type === type);
                    if (found) {
                      setActiveReportOverride(found);
                      setStatus('IDLE');
                      setStatusText(`Report selected: ready to run AI match for "${found.title}"`);
                      setMatchData(null);
                      setTopMatch(null);
                      setError(null);
                    }
                  }}
                  disabled={isScanning}
                  className="w-full bg-aurora-card border border-aurora-border rounded-xl px-3.5 py-2.5 text-xs text-aurora-text font-medium appearance-none focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20 pr-9 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {reports.map((r) => (
                    <option key={`${r.type}-${r.id}`} value={`${r.type}-${r.id}`}>
                      [{r.type}] {r.title} ({r.category})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-aurora-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="text-xs text-aurora-muted flex items-center gap-2 px-3 py-2 bg-aurora-chip rounded-xl border border-aurora-border">
                <Info className="w-4 h-4 text-aurora-accent shrink-0" />
                <span>No active reports available yet.</span>
              </div>
            )}

            {/* Run AI Match Button: accent background, white text, single line */}
            {activeReport ? (
              <button
                id="run-ai-match-btn"
                onClick={handleRunScan}
                disabled={isScanning}
                className="whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-semibold bg-aurora-accent hover:bg-aurora-accent-hover text-aurora-accent-text transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" />
                    <span>Run AI match</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {onOpenReportLost && (
                  <button
                    onClick={onOpenReportLost}
                    className="px-3.5 py-2 text-xs font-semibold bg-aurora-error-bg text-aurora-error rounded-xl border border-aurora-error/20 hover:opacity-90 cursor-pointer"
                  >
                    Report Lost
                  </button>
                )}
                {onOpenReportFound && (
                  <button
                    onClick={onOpenReportFound}
                    className="px-3.5 py-2 text-xs font-semibold bg-aurora-success-bg text-aurora-success rounded-xl border border-aurora-success/20 hover:opacity-90 cursor-pointer"
                  >
                    Report Found
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Light Rounded Info Bar with muted text and plain readable wording */}
        <div className="px-4 py-2.5 rounded-xl bg-aurora-chip border border-aurora-border flex items-center justify-between gap-3 text-xs text-aurora-muted">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
            <span className="truncate">{statusText}</span>
          </div>
          {isScanning && (
            <span className="text-[11px] font-semibold text-aurora-accent uppercase tracking-wider shrink-0 animate-pulse">
              Live scan running
            </span>
          )}
        </div>

        {/* Radar & Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          {/* Radar Dial Section (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-3">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-aurora-chip/60 border-2 border-aurora-radar flex items-center justify-center overflow-hidden select-none">
              {/* Concentric Radar Rings (#C9CCF5) */}
              <div className="absolute w-3/4 h-3/4 rounded-full border border-aurora-radar" />
              <div className="absolute w-1/2 h-1/2 rounded-full border border-aurora-radar" />
              <div className="absolute w-1/4 h-1/4 rounded-full border border-aurora-radar" />

              {/* Crosshair lines (#C9CCF5) */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-aurora-radar" />
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-aurora-radar" />

              {/* Angle Tick Marks in monospace */}
              <span className="absolute top-1.5 text-[8px] font-mono text-aurora-muted">000°</span>
              <span className="absolute right-2 text-[8px] font-mono text-aurora-muted">090°</span>
              <span className="absolute bottom-1.5 text-[8px] font-mono text-aurora-muted">180°</span>
              <span className="absolute left-2 text-[8px] font-mono text-aurora-muted">270°</span>

              {/* Sweep Line in accent color at low opacity */}
              {isScanning && (
                <div className="absolute inset-0 animate-radar-sweep pointer-events-none">
                  <div className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left bg-gradient-to-tr from-transparent via-aurora-accent/10 to-aurora-accent/25 rounded-tr-full" />
                  <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent via-aurora-accent/70 to-aurora-accent absolute top-1/2 right-0 origin-left" />
                </div>
              )}

              {/* Pulse Ring */}
              {isScanning && (
                <div className="absolute inset-0 rounded-full border border-aurora-accent/40 animate-radar-pulse pointer-events-none" />
              )}

              {/* Center Pin: #5B5BF0 accent, no glow/blur effects */}
              <div className="relative z-10 w-9 h-9 rounded-full bg-aurora-accent text-white flex items-center justify-center transition-transform duration-200">
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            {/* Coordinates in small monospace font */}
            <div className="mt-3.5 text-center text-xs text-aurora-muted space-y-0.5">
              <p className="font-mono text-[11px]">37.7749° N, 122.4194° W</p>
              <p className="text-aurora-text font-medium truncate max-w-[220px]">
                {activeReport?.title || 'No report selected'}
              </p>
            </div>
          </div>

          {/* Results / Status Card Section (7 cols) */}
          <div className="md:col-span-7">
            {/* 1. MATCH FOUND STATE */}
            {status === 'SUCCESS' && topMatch && (
              <div className="p-5 sm:p-6 rounded-2xl bg-aurora-card border border-aurora-border shadow-subtle space-y-4 animate-slide-up">
                {/* Result Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-aurora-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Top Match Detected badge using chip background */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurora-chip text-aurora-accent border border-aurora-border">
                        <CheckCircle2 className="w-3.5 h-3.5 text-aurora-accent" />
                        Top Match Detected
                      </span>
                      {/* Found badge using success / chip style */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-aurora-success-bg text-aurora-success border border-aurora-success/20">
                        {topMatch.matched_item?.type || 'FOUND'}
                      </span>
                      <span className="text-[11px] font-medium text-aurora-muted uppercase">
                        {topMatch.matched_item?.category}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-aurora-text tracking-tight">
                      {topMatch.matched_item?.title}
                    </h4>
                  </div>

                  {/* Confidence Percentage with accent color & monospace confidence label */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-2.5 sm:p-0 rounded-xl bg-aurora-chip sm:bg-transparent border border-aurora-border sm:border-0 shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-aurora-muted font-medium">
                      Match Confidence
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-aurora-accent tracking-tight">
                      {displayScore}%
                    </span>
                  </div>
                </div>

                {/* Match Metadata Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-aurora-muted">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
                    <span className="truncate">
                      Location: <strong className="text-aurora-text font-semibold">{topMatch.matched_item?.location}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
                    <span>
                      Date: <strong className="text-aurora-text font-semibold">{formatDate(topMatch.matched_item?.date)}</strong>
                    </span>
                  </div>
                  {topMatch.matched_item?.brand && (
                    <div className="flex items-center gap-2">
                      <span>Brand:</span>
                      <strong className="text-aurora-text font-semibold">{topMatch.matched_item.brand}</strong>
                    </div>
                  )}
                  {topMatch.matched_item?.color && (
                    <div className="flex items-center gap-2">
                      <span>Color:</span>
                      <strong className="text-aurora-text font-semibold">{topMatch.matched_item.color}</strong>
                    </div>
                  )}
                  {topMatch.matched_item?.storage_location && (
                    <div className="col-span-full flex items-center gap-1.5 text-aurora-success font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Safekeeping: <strong className="font-semibold">{topMatch.matched_item.storage_location}</strong></span>
                    </div>
                  )}
                  {topMatch.matched_item?.reward && (
                    <div className="col-span-full flex items-center gap-1.5 text-aurora-warning font-semibold">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>Reward offered: {topMatch.matched_item.reward}</span>
                    </div>
                  )}
                </div>

                {/* AI Evidence Chips: chip background, #1B1F3B text, small accent icon */}
                {topMatch.reasons && topMatch.reasons.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-semibold text-aurora-muted uppercase tracking-wider">
                      AI Evidence & Correlation Reasons:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topMatch.reasons.slice(0, 3).map((reason, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aurora-chip border border-aurora-border text-xs text-aurora-text font-medium"
                        >
                          <Sparkles className="w-3 h-3 text-aurora-accent shrink-0" />
                          <span>{reason}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5-Factor Score Breakdown */}
                {topMatch.breakdown && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-aurora-muted hover:text-aurora-accent transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-aurora-accent" />
                      <span>{showBreakdown ? 'Hide 5-Factor score breakdown' : 'View 5-Factor score breakdown'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          showBreakdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showBreakdown && (
                      <div className="mt-3 p-3 rounded-xl bg-aurora-chip border border-aurora-border grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs animate-fade-in">
                        <div className="p-2 rounded-lg bg-aurora-card border border-aurora-border space-y-0.5">
                          <p className="text-[10px] text-aurora-muted uppercase font-medium">Embedding</p>
                          <p className="text-sm font-bold text-aurora-accent">
                            {topMatch.breakdown.embedding_similarity !== null
                              ? `${Math.round(topMatch.breakdown.embedding_similarity * 100)}%`
                              : 'N/A'}
                          </p>
                          <p className="text-[9px] text-aurora-muted">50% wt</p>
                        </div>
                        <div className="p-2 rounded-lg bg-aurora-card border border-aurora-border space-y-0.5">
                          <p className="text-[10px] text-aurora-muted uppercase font-medium">Category</p>
                          <p className="text-sm font-bold text-aurora-success">
                            {Math.round(topMatch.breakdown.category_score * 100)}%
                          </p>
                          <p className="text-[9px] text-aurora-muted">20% wt</p>
                        </div>
                        <div className="p-2 rounded-lg bg-aurora-card border border-aurora-border space-y-0.5">
                          <p className="text-[10px] text-aurora-muted uppercase font-medium">Location</p>
                          <p className="text-sm font-bold text-aurora-accent">
                            {Math.round(topMatch.breakdown.location_score * 100)}%
                          </p>
                          <p className="text-[9px] text-aurora-muted">15% wt</p>
                        </div>
                        <div className="p-2 rounded-lg bg-aurora-card border border-aurora-border space-y-0.5">
                          <p className="text-[10px] text-aurora-muted uppercase font-medium">Brand/Color</p>
                          <p className="text-sm font-bold text-aurora-warning">
                            {Math.round(topMatch.breakdown.brand_color_score * 100)}%
                          </p>
                          <p className="text-[9px] text-aurora-muted">10% wt</p>
                        </div>
                        <div className="p-2 rounded-lg bg-aurora-card border border-aurora-border space-y-0.5 col-span-2 sm:col-span-1">
                          <p className="text-[10px] text-aurora-muted uppercase font-medium">Temporal</p>
                          <p className="text-sm font-bold text-aurora-accent">
                            {Math.round(topMatch.breakdown.temporal_score * 100)}%
                          </p>
                          <p className="text-[9px] text-aurora-muted">5% wt</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inspect Matched Item Button: accent background with white text */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-aurora-border">
                  <span className="text-xs text-aurora-muted">
                    {matchData?.matches_count} total match candidate(s)
                  </span>

                  <button
                    id="terminal-inspect-item-btn"
                    onClick={() => onSelectItem && onSelectItem(topMatch.matched_item)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-aurora-accent hover:bg-aurora-accent-hover text-aurora-accent-text transition-colors flex items-center gap-1.5 cursor-pointer shadow-subtle"
                  >
                    <span>Inspect Matched Item</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. SCANNING IN FLIGHT STATE */}
            {status === 'SCANNING' && (
              <div className="p-8 rounded-2xl bg-aurora-card border border-aurora-border text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full border-2 border-aurora-border border-t-aurora-accent animate-spin" />
                <h4 className="text-sm font-semibold text-aurora-text">
                  Evaluating Community Reports
                </h4>
                <p className="text-xs text-aurora-muted max-w-sm mx-auto">
                  Comparing multimodal Gemini embeddings, category rules, and location proximity...
                </p>
              </div>
            )}

            {/* 3. NO MATCHES FOUND STATE */}
            {status === 'NO_MATCH' && (
              <div className="p-6 sm:p-7 rounded-2xl bg-aurora-card border border-aurora-border text-center space-y-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-aurora-chip flex items-center justify-center mx-auto text-aurora-muted">
                  <FileSearch className="w-5 h-5" />
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-aurora-text">
                  No Confident Matches Found Yet
                </h4>
                <p className="text-xs text-aurora-muted max-w-md mx-auto">
                  Analyzed {matchData?.total_candidates_analyzed || 0} active community reports. None currently meet the 35% threshold.
                </p>
              </div>
            )}

            {/* 4. ERROR STATE */}
            {status === 'ERROR' && (
              <div className="p-6 rounded-2xl bg-aurora-error-bg border border-aurora-error/20 text-center space-y-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-aurora-error/10 text-aurora-error flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-aurora-error">
                  Matching Engine Unavailable
                </h4>
                <p className="text-xs text-aurora-error/80 max-w-md mx-auto">
                  {error}
                </p>
                <button
                  onClick={handleRunScan}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-aurora-error text-white hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Scan</span>
                </button>
              </div>
            )}

            {/* 5. IDLE / READY STATE */}
            {status === 'IDLE' && (
              <div className="p-6 sm:p-7 rounded-2xl bg-aurora-card border border-aurora-border space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-aurora-accent">
                    Standby Mode
                  </span>
                  <h4 className="text-base font-bold text-aurora-text tracking-tight">
                    Ready to evaluate community listings
                  </h4>
                  <p className="text-xs sm:text-sm text-aurora-muted">
                    Click <strong>"Run AI match"</strong> to scan active opposite listings. The engine evaluates semantic embeddings, category compatibility, and location proximity.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-aurora-chip border border-aurora-border">
                    <span className="text-[10px] text-aurora-muted uppercase font-medium block">Vectors</span>
                    <span className="text-xs font-bold text-aurora-text">768-Dim</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-aurora-chip border border-aurora-border">
                    <span className="text-[10px] text-aurora-muted uppercase font-medium block">Cutoff</span>
                    <span className="text-xs font-bold text-aurora-text">35% Min</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-aurora-chip border border-aurora-border">
                    <span className="text-[10px] text-aurora-muted uppercase font-medium block">Factors</span>
                    <span className="text-xs font-bold text-aurora-text">5 Weights</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-aurora-chip border border-aurora-border">
                    <span className="text-[10px] text-aurora-muted uppercase font-medium block">Privacy</span>
                    <span className="text-xs font-bold text-aurora-success">Protected</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
