import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, MapPin, GitCommit, X, Check } from 'lucide-react';
import type { HistoricalTimeline, HistoricalEvent } from '../types/timeline';
import { useScrollReveal } from '../hooks';

interface ComparisonEngineProps {
  timelineA: HistoricalTimeline;
  timelineB: HistoricalTimeline;
  onSelectEvent: (event: HistoricalEvent) => void;
  onBack: () => void;
  onChangeComparison: () => void;
}

interface ComparisonPair {
  primaryEvent: HistoricalEvent;
  comparativeEvents: HistoricalEvent[];
}

interface ComparisonRowProps {
  pair: ComparisonPair;
  index: number;
  cleanTitlePrimary: string;
  cleanTitleSecondary: string;
  onSelectEvent: (event: HistoricalEvent) => void;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  pair,
  index,
  cleanTitlePrimary,
  cleanTitleSecondary,
  onSelectEvent,
}) => {
  const { ref, isRevealed } = useScrollReveal({
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
    triggerOnce: false,
  });

  const isLeft = index % 2 === 0;
  const primary = pair.primaryEvent;
  const comparatives = pair.comparativeEvents;

  const cardRevealStyle = {
    '--reveal-x': isLeft ? '-20px' : '20px',
  } as React.CSSProperties;

  const compRevealStyle = {
    '--reveal-x': isLeft ? '-20px' : '20px',
    transitionDelay: '80ms',
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      className="w-full relative flex flex-col pl-8 md:pl-0"
    >
      {/* 1. Primary Milestone Row (Year Badge and dashed line are locked to this card's center) */}
      <div className="relative flex items-center w-full">
        {/* Desktop Central Year Badge */}
        <div
          className={`hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none node-reveal ${
            isRevealed ? 'is-revealed' : ''
          }`}
        >
          <div className="px-3.5 py-1 rounded-full bg-[#0e0e14] border border-[#3b3b4f] text-xs font-mono font-semibold text-[#f4f4f6] shadow-lg shadow-black ring-4 ring-black whitespace-nowrap">
            {primary.displayDate || (primary.startYear ? `${primary.startYear} CE` : '')}
          </div>
        </div>

        {/* Connecting Line: Card to Central Spine (High visibility dashed line) */}
        {isLeft ? (
          <div
            className={`hidden md:block absolute left-[44%] lg:left-[42%] right-1/2 top-1/2 -translate-y-1/2 h-0 border-t-2 border-dashed border-[#47475c] pointer-events-none z-10 transition-opacity duration-500 ${
              isRevealed ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div
            className={`hidden md:block absolute left-1/2 right-[44%] lg:right-[42%] top-1/2 -translate-y-1/2 h-0 border-t-2 border-dashed border-[#47475c] pointer-events-none z-10 transition-opacity duration-500 ${
              isRevealed ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Mobile Spine Node & Connector */}
        <div
          className={`md:hidden absolute -left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#f4f4f6] ring-4 ring-black border border-[#525268] node-reveal ${
            isRevealed ? 'is-revealed' : ''
          }`}
        />
        <div
          className={`md:hidden absolute -left-2 top-1/2 w-3 border-t-2 border-dashed border-[#47475c] pointer-events-none transition-opacity duration-500 ${
            isRevealed ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Primary Event Card */}
        <div
          style={cardRevealStyle}
          className={`w-full md:w-[44%] lg:w-[42%] ${
            isLeft ? 'md:mr-auto' : 'md:ml-auto'
          } timeline-reveal ${isRevealed ? 'is-revealed' : ''}`}
        >
          <article
            onClick={() => onSelectEvent(primary)}
            className="w-full bg-[#0b0b0f] hover:bg-[#111118] border border-[#222230] hover:border-[#38384e] rounded-xl p-4 transition-all duration-200 cursor-pointer text-left shadow-md shadow-black/70 group select-none hover:-translate-y-0.5"
          >
            {/* Topic Pill & Category */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border bg-[#14141e] text-[#f4f4f6] border-[#2c2c3c]">
                {cleanTitlePrimary}
              </span>
              <span className="text-[10px] uppercase font-mono text-[#717182] tracking-wider truncate">
                {primary.category}
              </span>
            </div>

            {/* Title: Serif Editorial */}
            <h3 className="font-serif-editorial text-base sm:text-lg font-normal text-[#f4f4f6] group-hover:text-white transition-colors leading-snug">
              {primary.title}
            </h3>

            {/* Summary */}
            <p className="mt-1.5 text-xs text-[#8e8e9c] leading-relaxed line-clamp-2">
              {primary.shortSummary}
            </p>

            {/* Footer: Location & View CTA */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#5e5e6e] pt-2 border-t border-[#181822]">
              <span className="truncate max-w-[150px] flex items-center gap-1 font-sans text-[#717182]">
                {primary.location && <MapPin className="w-3 h-3 shrink-0" />}
                {primary.location || primary.era}
              </span>
              <span className="text-[#5e5e6e] group-hover:text-[#a1a1b4] transition-colors font-mono text-xs">
                view details →
              </span>
            </div>
          </article>
        </div>
      </div>

      {/* 2. Comparative Event Cards (Connected via visible branch stem directly beneath primary card) */}
      {comparatives.length > 0 && (
        <div
          style={compRevealStyle}
          className={`w-full md:w-[44%] lg:w-[42%] ${
            isLeft ? 'md:mr-auto' : 'md:ml-auto'
          } mt-2 flex flex-col timeline-reveal ${isRevealed ? 'is-revealed' : ''}`}
        >
          {/* Visual Connector Stem from Primary to Contemporary Cards */}
          <div className="flex items-center gap-2 pl-5 py-1">
            <div className="w-[2px] h-3.5 bg-[#47475c]" />
            <div className="h-[1px] w-2.5 bg-[#47475c]" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#717182] font-medium flex items-center gap-1">
              <span>Contemporary in</span>
              <span className="text-[#a1a1aa] font-medium">{cleanTitleSecondary}</span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {comparatives.map((comp) => (
              <article
                key={comp.id || comp.title}
                onClick={() => onSelectEvent(comp)}
                className="w-full bg-[#0b0b0f] hover:bg-[#111118] border border-[#222230] hover:border-[#38384e] rounded-xl p-4 transition-all duration-200 cursor-pointer text-left shadow-md shadow-black/70 group select-none hover:-translate-y-0.5"
              >
                {/* Comparative Topic Banner & Date */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#1c1c2c]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border bg-[#14141e] border-[#2c2c3c] flex items-center gap-1.5">
                      <GitCommit className="w-3 h-3 text-[#717182] shrink-0" />
                      <span className="text-[#d4d4d8] font-medium">{cleanTitleSecondary}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#a1a1aa]">
                    {comp.displayDate || (comp.startYear ? `${comp.startYear} CE` : '')}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-serif-editorial text-sm sm:text-base font-normal text-[#f4f4f6] group-hover:text-white transition-colors leading-snug">
                  {comp.title}
                </h4>

                {/* Summary */}
                <p className="mt-1.5 text-xs text-[#8e8e9c] leading-relaxed line-clamp-2">
                  {comp.shortSummary}
                </p>

                {/* Footer */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#5e5e6e] pt-2 border-t border-[#181822]">
                  <span className="truncate max-w-[150px] flex items-center gap-1 font-sans text-[#717182]">
                    {comp.location && <MapPin className="w-3 h-3 shrink-0" />}
                    {comp.location || comp.era}
                  </span>
                  <span className="text-[#5e5e6e] group-hover:text-[#a1a1b4] transition-colors font-mono text-xs">
                    view details →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ComparisonEngine: React.FC<ComparisonEngineProps> = ({
  timelineA,
  timelineB,
  onSelectEvent,
  onBack,
  onChangeComparison,
}) => {
  // Allow toggling which timeline acts as the primary baseline
  const [swapped, setSwapped] = useState(false);

  const primaryTimeline = swapped ? timelineB : timelineA;
  const secondaryTimeline = swapped ? timelineA : timelineB;

  const cleanTitlePrimary = primaryTimeline.title.split(':')[0].replace(/\([^)]*\)/g, '').trim();
  const cleanTitleSecondary = secondaryTimeline.title.split(':')[0].replace(/\([^)]*\)/g, '').trim();

  // Helper to extract numeric year
  const getEventYear = (e: HistoricalEvent): number => {
    return e.startYear ?? e.year ?? 0;
  };

  // Build Chronological Comparison Pairs:
  // Sort primary timeline events chronologically.
  // For every event in the secondary timeline, find the closest primary event in year,
  // and attach it directly beneath that primary event!
  const comparisonPairs: ComparisonPair[] = useMemo(() => {
    const primarySorted = [...(primaryTimeline.events || [])].sort((a, b) => {
      const yA = getEventYear(a);
      const yB = getEventYear(b);
      if (yA !== yB) return yA - yB;
      return (a.startMonth ?? 0) - (b.startMonth ?? 0);
    });

    const secondaryEvents = [...(secondaryTimeline.events || [])].sort((a, b) => {
      const yA = getEventYear(a);
      const yB = getEventYear(b);
      if (yA !== yB) return yA - yB;
      return (a.startMonth ?? 0) - (b.startMonth ?? 0);
    });

    if (primarySorted.length === 0) {
      return secondaryEvents.map((sec) => ({
        primaryEvent: sec,
        comparativeEvents: [],
      }));
    }

    // Map each secondary event to its closest primary event
    const secondaryMap = new Map<string, HistoricalEvent[]>();
    for (const p of primarySorted) {
      secondaryMap.set(p.id || p.title, []);
    }

    for (const sec of secondaryEvents) {
      const secYear = getEventYear(sec);
      let closestPrimary = primarySorted[0];
      let minDiff = Math.abs(secYear - getEventYear(closestPrimary));

      for (let i = 1; i < primarySorted.length; i++) {
        const diff = Math.abs(secYear - getEventYear(primarySorted[i]));
        if (diff < minDiff) {
          minDiff = diff;
          closestPrimary = primarySorted[i];
        }
      }

      const key = closestPrimary.id || closestPrimary.title;
      secondaryMap.get(key)?.push(sec);
    }

    // Ensure secondary events within each pair are sorted chronologically
    return primarySorted.map((prim) => {
      const key = prim.id || prim.title;
      const comps = secondaryMap.get(key) || [];
      comps.sort((a, b) => getEventYear(a) - getEventYear(b));
      return {
        primaryEvent: prim,
        comparativeEvents: comps,
      };
    });
  }, [primaryTimeline, secondaryTimeline]);

  return (
    <div className="w-full min-h-screen bg-black text-[#8e8e98] flex flex-col items-center">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-black/90 backdrop-blur-md border-b border-[#16161e] px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-medium text-[#71717a] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-[#14141a] border border-transparent hover:border-[#22222a]"
            title="Back to timeline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="text-white">{cleanTitlePrimary}</span>
            <span className="text-[#52525c] font-mono text-[11px]">vs</span>
            <span className="text-[#a1a1aa]">{cleanTitleSecondary}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Swap baseline primary topic */}
          <button
            onClick={() => setSwapped(!swapped)}
            className="flex items-center gap-1.5 text-xs text-[#8e8e98] hover:text-white px-3 py-1.5 rounded-full bg-[#0d0d12] hover:bg-[#16161f] border border-[#1e1e28] transition-all cursor-pointer"
            title="Swap baseline timeline"
          >
            <ArrowLeftRight className="w-3 h-3 text-[#71717a]" />
            <span className="hidden sm:inline">Swap Baseline</span>
          </button>

          {/* Change Comparison Action */}
          <button
            onClick={onChangeComparison}
            className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-white px-3 py-1.5 rounded-full bg-[#111116] hover:bg-[#181820] border border-[#20202a] transition-all cursor-pointer"
          >
            <span>Switch Topics</span>
          </button>
        </div>
      </header>

      {/* Comparison Title & Minimal Monochromatic Legend */}
      <div className="w-full max-w-4xl px-4 pt-8 pb-4 flex flex-col items-center text-center">
        <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl text-[#f4f4f6] font-normal tracking-tight">
          {cleanTitlePrimary} <span className="text-[#52525c] font-sans font-light">&</span> {cleanTitleSecondary}
        </h1>

        {/* Minimal Monochromatic Legend */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#71717a]">
          {/* Primary Topic */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#12121a] border border-[#323244]" />
            <span className="text-[#f4f4f6] font-medium">{cleanTitlePrimary}</span>
            <span className="text-[11px] text-[#71717a]">({primaryTimeline.events?.length || 0})</span>
          </div>

          <span className="text-[#3f3f50]">•</span>

          {/* Secondary Comparative Topic */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#16161f] border border-[#2e2e3e]" />
            <span className="text-[#a1a1aa] font-medium">{cleanTitleSecondary}</span>
            <span className="text-[11px] text-[#52525c]">({secondaryTimeline.events?.length || 0})</span>
          </div>
        </div>

        <p className="mt-2 text-[11px] font-mono text-[#52525c]">
          Contemporary events from <span className="text-[#a1a1aa] font-medium">{cleanTitleSecondary}</span> appear linked underneath their parallel <span className="text-[#d4d4d8] font-medium">{cleanTitlePrimary}</span> milestones
        </p>
      </div>

      {/* The Unified Central Timeline Rail */}
      <main className="w-full max-w-5xl px-4 py-8 relative flex flex-col items-center">
        {/* Milestone Cards Container with Continuous Central Spine */}
        <div className="w-full flex flex-col gap-9 md:gap-11 relative">
          {/* Continuous Central Spine (Runs seamlessly through all milestones and extends directly into the center of the terminal dot) */}
          <div
            className="absolute top-2 left-6 md:left-1/2 -translate-x-1/2 w-[2px] bg-[#323244] pointer-events-none"
            style={{ bottom: '-61px' }}
            aria-hidden="true"
          />

          {comparisonPairs.map((pair, index) => (
            <ComparisonRow
              key={pair.primaryEvent.id || `${pair.primaryEvent.title}-${index}`}
              pair={pair}
              index={index}
              cleanTitlePrimary={cleanTitlePrimary}
              cleanTitleSecondary={cleanTitleSecondary}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>

        {/* Bottom Historical Resolution Marker */}
        <div className="relative w-full mt-14 mb-8 flex flex-col items-center">
          {/* Terminal Dot: Exact same X-axis anchor as central spine (desktop & mobile) */}
          <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-0 w-2.5 h-2.5 rounded-full border border-[#3f3f4c] bg-black ring-4 ring-black z-20" />

          {/* Resolution Summary Text */}
          <div className="mt-6 flex items-center justify-center w-full px-4">
            <span className="font-mono text-xs tracking-wider text-[#52525c] bg-black px-3 z-10 text-center">
              {primaryTimeline.events?.length || 0} {cleanTitlePrimary} milestones • {secondaryTimeline.events?.length || 0} {cleanTitleSecondary} contemporaries
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export interface ComparisonPickerProps {
  currentTimeline: HistoricalTimeline;
  allTimelines: HistoricalTimeline[];
  onCompare: (timelineA: HistoricalTimeline, timelineB: HistoricalTimeline) => void;
  onClose: () => void;
}

export const ComparisonPicker: React.FC<ComparisonPickerProps> = ({
  currentTimeline,
  allTimelines,
  onCompare,
  onClose,
}) => {
  const isWorldTimeline = (t: HistoricalTimeline) =>
    Boolean(t.category?.toLowerCase().includes('world'));

  const indianTimelines = useMemo(
    () => allTimelines.filter((t) => !isWorldTimeline(t)),
    [allTimelines]
  );

  const worldTimelines = useMemo(
    () => allTimelines.filter((t) => isWorldTimeline(t)),
    [allTimelines]
  );

  const [selectedSlugA, setSelectedSlugA] = useState<string>(() => {
    if (!isWorldTimeline(currentTimeline)) {
      return currentTimeline.slug || currentTimeline.id;
    }
    return indianTimelines[0]?.slug || indianTimelines[0]?.id || '';
  });

  const findTimeline = (slugOrId: string) => {
    return (
      allTimelines.find((t) => (t.slug || t.id) === slugOrId) ||
      allTimelines.find((t) => {
        if (slugOrId === 'post-independence-india') return t.slug === 'post-independence-and-republic' || t.id === 'post-independence-and-republic';
        if (slugOrId === 'post-independence-and-republic') return t.slug === 'post-independence-india' || t.id === 'post-independence-india';
        if (slugOrId === 'modern-indian-history') return t.slug === 'indian-national-movement' || t.id === 'indian-national-movement';
        if (slugOrId === 'indian-national-movement') return t.slug === 'modern-indian-history' || t.id === 'modern-indian-history';
        return false;
      })
    );
  };

  const getSmartWorldSlug = (indianSlug: string): string => {
    const indianT = findTimeline(indianSlug);
    if (indianT?.contemporaries && indianT.contemporaries.length > 0) {
      for (const contemp of indianT.contemporaries) {
        const matched = worldTimelines.find((w) => (w.slug || w.id) === contemp);
        if (matched) return matched.slug || matched.id;
      }
    }
    const fallbacks: Record<string, string> = {
      'indus-valley-civilization': 'mesopotamia',
      'vedic-period-and-mahajanapadas': 'ancient-china',
      'buddhism-and-jainism': 'ancient-china',
      'mauryan-empire': 'ancient-greece',
      'gupta-empire': 'ancient-rome',
      'chola-dynasty': 'tang-and-song-china',
      'delhi-sultanate': 'mongol-empire',
      'mughal-empire': 'european-renaissance',
      'maratha-empire': 'french-revolution',
      'modern-indian-history': 'world-wars-era',
      'indian-national-movement': 'world-wars-era',
      'post-independence-india': 'cold-war-space-race',
      'post-independence-and-republic': 'cold-war-space-race',
    };
    if (fallbacks[indianSlug]) {
      const fallbackMatch = worldTimelines.find((w) => (w.slug || w.id) === fallbacks[indianSlug]);
      if (fallbackMatch) return fallbackMatch.slug || fallbackMatch.id;
    }
    return worldTimelines[0]?.slug || worldTimelines[0]?.id || '';
  };

  const [selectedSlugB, setSelectedSlugB] = useState<string>(() =>
    getSmartWorldSlug(selectedSlugA)
  );

  const chipsScrollRef = React.useRef<HTMLDivElement>(null);

  const handleSelectIndianEra = (newSlugA: string) => {
    setSelectedSlugA(newSlugA);
    const recommendedWorld = getSmartWorldSlug(newSlugA);
    if (recommendedWorld) {
      setSelectedSlugB(recommendedWorld);
    }
  };

  const timelineA = findTimeline(selectedSlugA) || currentTimeline;
  const timelineB = findTimeline(selectedSlugB);

  const handleLaunch = () => {
    if (timelineA && timelineB) {
      onCompare(timelineA, timelineB);
    }
  };

  const curatedPairs = [
    { title: 'Indus Valley ↔ Mesopotamia', slugA: 'indus-valley-civilization', slugB: 'mesopotamia' },
    { title: 'Indus Valley ↔ Ancient Egypt', slugA: 'indus-valley-civilization', slugB: 'ancient-egypt' },
    { title: 'Buddha Era ↔ Ancient China', slugA: 'buddhism-and-jainism', slugB: 'ancient-china' },
    { title: 'Maurya Empire ↔ Ancient Greece', slugA: 'mauryan-empire', slugB: 'ancient-greece' },
    { title: 'Gupta Empire ↔ Ancient Rome', slugA: 'gupta-empire', slugB: 'ancient-rome' },
    { title: 'Chola Dynasty ↔ Song Dynasty China', slugA: 'chola-dynasty', slugB: 'tang-and-song-china' },
    { title: 'Delhi Sultanate ↔ The Mongol Empire', slugA: 'delhi-sultanate', slugB: 'mongol-empire' },
    { title: 'Mughal Empire ↔ European Renaissance', slugA: 'mughal-empire', slugB: 'european-renaissance' },
    { title: 'Maratha Empire ↔ French Revolution', slugA: 'maratha-empire', slugB: 'french-revolution' },
    { title: 'Freedom Struggle ↔ World Wars', slugA: 'indian-national-movement', slugB: 'world-wars-era' },
    { title: 'Post-Independence ↔ Cold War & Space Race', slugA: 'post-independence-india', slugB: 'cold-war-space-race' },
    { title: 'Post-Independence ↔ AI Revolution', slugA: 'post-independence-india', slugB: 'llm-history-generative-ai-revolution' },
  ];

  const handleSelectPair = (pair: { slugA: string; slugB: string }) => {
    const tA = findTimeline(pair.slugA);
    const tB = findTimeline(pair.slugB);
    if (tA) setSelectedSlugA(tA.slug || tA.id);
    if (tB) setSelectedSlugB(tB.slug || tB.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0d0d12] border border-[#22222d] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#71717a] hover:text-white hover:bg-[#16161f] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-medium text-white tracking-tight">Compare Timelines</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#a1a1aa] mb-1.5">
              Indian Events
            </label>
            <select
              value={selectedSlugA}
              onChange={(e) => handleSelectIndianEra(e.target.value)}
              className="w-full appearance-none bg-[#121218] hover:bg-[#161620] border border-[#22222e] focus:border-[#3a3a4c] text-sm text-[#f4f4f6] rounded-xl px-3.5 py-2.5 outline-none transition-all cursor-pointer"
            >
              {indianTimelines.map((t) => (
                <option key={t.id || t.slug} value={t.slug || t.id} className="bg-[#121218] text-white">
                  {t.title.split(':')[0]} ({t.timeSpan || `${t.events?.length || 0} events`})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[#52525c] font-mono text-xs sm:mt-5">vs</div>

          <div className="w-full sm:flex-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#a1a1aa] mb-1.5">
              World Events
            </label>
            <select
              value={selectedSlugB}
              onChange={(e) => setSelectedSlugB(e.target.value)}
              className="w-full appearance-none bg-[#121218] hover:bg-[#161620] border border-[#22222e] focus:border-[#3a3a4c] text-sm text-[#f4f4f6] rounded-xl px-3.5 py-2.5 outline-none transition-all cursor-pointer"
            >
              {worldTimelines.map((t) => (
                <option key={t.id || t.slug} value={t.slug || t.id} className="bg-[#121218] text-white">
                  {t.title.split(':')[0]} ({t.timeSpan || `${t.events?.length || 0} events`})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative mt-4 w-full">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0d0d12] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0d0d12] to-transparent z-10" />

          <div
            ref={chipsScrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0 && chipsScrollRef.current) {
                chipsScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="w-full flex items-center gap-2 overflow-x-auto py-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth select-none"
          >
            {curatedPairs.map((pair) => {
              const isSelected =
                (selectedSlugA === pair.slugA ||
                  (pair.slugA === 'indian-national-movement' && selectedSlugA === 'modern-indian-history') ||
                  (pair.slugA === 'post-independence-india' && selectedSlugA === 'post-independence-and-republic')) &&
                (selectedSlugB === pair.slugB ||
                  (pair.slugB === 'post-independence-india' && selectedSlugB === 'post-independence-and-republic'));
              return (
                <button
                  key={pair.title}
                  type="button"
                  onClick={() => handleSelectPair(pair)}
                  className={`whitespace-nowrap shrink-0 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-white font-medium shadow-sm'
                      : 'bg-[#121217] hover:bg-[#181820] text-[#a1a1aa] hover:text-white border-[#22222e]'
                  }`}
                >
                  {pair.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1a1a24]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#71717a] hover:text-white hover:bg-[#14141c] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            disabled={!timelineB || selectedSlugA === selectedSlugB}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-white hover:bg-[#e4e4e7] text-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-white/5 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Launch Comparison</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonEngine;
