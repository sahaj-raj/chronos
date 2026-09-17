import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowLeftRight, Loader2 } from 'lucide-react';
import type { HistoricalTimeline } from '../types/timeline';

interface MasterRoadmapProps {
  timelines: HistoricalTimeline[];
  onSelectTimeline: (slugOrId: string) => void;
  onOpenComparisonPicker?: () => void;
  onSynthesize?: (query: string) => void;
  isSynthesizing?: boolean;
}

export const MasterRoadmap: React.FC<MasterRoadmapProps> = ({
  timelines,
  onSelectTimeline,
  onOpenComparisonPicker,
  onSynthesize,
  isSynthesizing = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ANCIENT' | 'MEDIEVAL' | 'MODERN' | 'WORLD'>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatYear = (yr: number | undefined | null) => {
    if (yr === undefined || yr === null) return '—';
    return yr < 0 ? `${Math.abs(yr)} BCE` : `${yr} CE`;
  };

  const getBadgeYear = (t: HistoricalTimeline): string => {
    // 1. Explicit startYear on timeline
    if (t.startYear !== undefined && t.startYear !== null && t.startYear !== 0) {
      return formatYear(t.startYear);
    }
    // 2. From first event's startYear, year, displayDate, or date
    const firstEvt = t.events?.[0];
    if (firstEvt) {
      const evtYr = firstEvt.startYear ?? firstEvt.year;
      if (evtYr !== undefined && evtYr !== null && evtYr !== 0) {
        return formatYear(evtYr);
      }
      const dateStr = firstEvt.displayDate || (firstEvt as any).date;
      if (dateStr) {
        const match = String(dateStr).match(/(-?\d{1,4})\s*(BCE|CE|BC|AD)?/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const era = match[2] ? match[2].toUpperCase() : (num < 0 ? 'BCE' : 'CE');
          return `${Math.abs(num)} ${era === 'BC' ? 'BCE' : era === 'AD' ? 'CE' : era}`;
        }
      }
    }
    // 3. From timeSpan string
    if (t.timeSpan) {
      const match = t.timeSpan.match(/(-?\d{1,4})\s*(BCE|CE|BC|AD)?/i);
      if (match) {
        const num = parseInt(match[1], 10);
        const era = match[2] ? match[2].toUpperCase() : (num < 0 ? 'BCE' : 'CE');
        return `${Math.abs(num)} ${era === 'BC' ? 'BCE' : era === 'AD' ? 'CE' : era}`;
      }
      return t.timeSpan.split('–')[0].trim();
    }
    return '—';
  };

  const getTimelineStartYear = (t: HistoricalTimeline): number => {
    if (t.startYear !== undefined && t.startYear !== null) return t.startYear;
    if (t.events && t.events.length > 0) {
      const sorted = [...t.events].sort((a, b) => (a.startYear ?? a.year ?? 0) - (b.startYear ?? b.year ?? 0));
      const yr = sorted[0]?.startYear ?? sorted[0]?.year;
      if (yr !== undefined && yr !== null) return yr;
    }
    if (t.timeSpan) {
      const match = t.timeSpan.match(/(-?\d{1,4})/);
      if (match) {
        const val = parseInt(match[1], 10);
        return t.timeSpan.toLowerCase().includes('bce') || t.timeSpan.toLowerCase().includes('bc') ? -Math.abs(val) : val;
      }
    }
    return 0;
  };

  const getGroupDisplaySpan = (groupTimelines: HistoricalTimeline[], fallback: string): string => {
    if (groupTimelines.length === 0) return fallback;
    const startYears = groupTimelines.map(getTimelineStartYear).filter((y) => y !== 0);
    const endYears = groupTimelines
      .map((t) => {
        if (t.endYear !== undefined && t.endYear !== null) return t.endYear;
        if (t.events && t.events.length > 0) {
          const sorted = [...t.events].sort((a, b) => (a.startYear ?? a.year ?? 0) - (b.startYear ?? b.year ?? 0));
          return sorted[sorted.length - 1]?.endYear ?? sorted[sorted.length - 1]?.startYear ?? 0;
        }
        return 0;
      })
      .filter((y) => y !== 0);

    if (startYears.length > 0 && endYears.length > 0) {
      const minStart = Math.min(...startYears);
      const maxEnd = Math.max(...endYears);
      const startStr = formatYear(minStart);
      const endStr = maxEnd >= 2020 ? 'Present' : formatYear(maxEnd);
      return `${startStr} – ${endStr}`;
    }
    return fallback;
  };

  // Group definitions
  const eraGroups = [
    {
      id: 'ANCIENT',
      name: 'Ancient India',
      span: '3300 BCE – 550 CE',
      matchCategory: (cat?: string) => {
        const c = (cat || '').toLowerCase();
        return (c.includes('ancient') || c.includes('indus') || c.includes('vedic') || c.includes('maurya') || c.includes('gupta')) && !c.includes('world');
      },
    },
    {
      id: 'MEDIEVAL',
      name: 'Medieval India',
      span: '848 CE – 1818 CE',
      matchCategory: (cat?: string) => {
        const c = (cat || '').toLowerCase();
        return c.includes('medieval') || c.includes('mughal') || c.includes('chola') || c.includes('maratha') || c.includes('sultanate') || c.includes('vijayanagara');
      },
    },
    {
      id: 'MODERN',
      name: 'Modern & Independent India',
      span: '1757 CE – Present',
      matchCategory: (cat?: string) => {
        const c = (cat || '').toLowerCase();
        return c.includes('modern') || c.includes('british') || c.includes('freedom') || c.includes('independence') || c.includes('republic') || c.includes('struggle');
      },
    },
    {
      id: 'WORLD',
      name: 'World Civilizations & Contemporaries',
      span: '3500 BCE – Present',
      matchCategory: (cat?: string) => {
        const c = (cat || '').toLowerCase();
        return c.includes('world') || (!c.includes('ancient') && !c.includes('medieval') && !c.includes('modern') && !c.includes('india'));
      },
    },
  ];

  // Helper to filter out synthetic placeholder/umbrella mock records
  const isPlaceholderTimeline = (t: HistoricalTimeline) => {
    const slug = (t.slug || t.id || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return (
      slug === 'ancient-india' ||
      slug === 'medieval-india' ||
      slug === 'modern-india' ||
      slug === 'general-history' ||
      title === 'ancient india' ||
      title === 'medieval india' ||
      title === 'modern india' ||
      title.startsWith('chronology of ancient india') ||
      title.startsWith('chronology of medieval india') ||
      title.startsWith('chronology of modern india') ||
      title.startsWith('historical chronology for ancient india') ||
      title.startsWith('historical chronology for medieval india') ||
      title.startsWith('historical chronology for modern india') ||
      desc.includes('foundational origins & formative period')
    );
  };

  // Quick filter
  const filteredTimelines = timelines.filter((t) => {
    if (isPlaceholderTimeline(t)) return false;

    const q = filterQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.subtitle && t.subtitle.toLowerCase().includes(q)) ||
      t.description.toLowerCase().includes(q) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    const cat = (t.category || (t as any).topic || t.title || '').toLowerCase();
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'ANCIENT') return (cat.includes('ancient') || cat.includes('indus') || cat.includes('vedic') || cat.includes('maurya') || cat.includes('gupta')) && !cat.includes('world');
    if (selectedCategory === 'MEDIEVAL') return cat.includes('medieval') || cat.includes('mughal') || cat.includes('chola') || cat.includes('maratha') || cat.includes('sultanate') || cat.includes('vijayanagara');
    if (selectedCategory === 'MODERN') return cat.includes('modern') || cat.includes('british') || cat.includes('freedom') || cat.includes('independence') || cat.includes('republic') || cat.includes('struggle');
    if (selectedCategory === 'WORLD') return cat.includes('world') || (!cat.includes('ancient') && !cat.includes('medieval') && !cat.includes('modern') && !cat.includes('india'));
    return true;
  });

  const searchMatches = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return [];
    return timelines
      .filter((t) => {
        if (isPlaceholderTimeline(t)) return false;
        const title = t.title.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const topic = ((t as any).topic || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const tags = (t.tags || []).map((tag) => tag.toLowerCase());
        return (
          title.includes(q) ||
          topic.includes(q) ||
          cat.includes(q) ||
          desc.includes(q) ||
          tags.some((tag) => tag.includes(q))
        );
      })
      .slice(0, 8);
  }, [filterQuery, timelines]);

  const handleSearchSubmit = () => {
    const q = filterQuery.trim();
    if (!q || isSynthesizing) return;
    setIsDropdownOpen(false);
    if (searchMatches.length > 0) {
      onSelectTimeline(searchMatches[0].slug || searchMatches[0].id);
    } else if (onSynthesize) {
      onSynthesize(q);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-black text-[#8e8e98] px-4 select-none">
      {/* Top-Right Corner Action: Compare Timelines pinned to the actual right top corner */}
      {onOpenComparisonPicker && (
        <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-30">
          <button
            onClick={onOpenComparisonPicker}
            className="px-4 py-2 rounded-full bg-[#111116] hover:bg-[#181822] border border-[#20202c] hover:border-[#38384a] text-xs font-medium text-[#d4d4d8] hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-black/70 shrink-0"
            title="Compare timelines"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Compare Timelines</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        {/* ChatGPT-style Centered Hero Section */}
        <div className="w-full flex flex-col items-center justify-center min-h-[58vh] sm:min-h-[64vh] py-8 sm:py-12">
          {/* Brand Heading: Just the heading Chronos on top of search box */}
          <h1 className="font-serif-editorial text-5xl sm:text-6xl md:text-7xl text-[#f4f4f6] font-normal tracking-tight mb-8 text-center select-none">
            Chronos
          </h1>

          {/* Bigger Centered Search Box */}
          <div ref={searchContainerRef} className="relative w-full max-w-2xl">
            <div className="relative w-full flex items-center shadow-2xl shadow-black/80">
              <Search className="absolute left-4 sm:left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#52525c] pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onFocus={() => {
                  if (filterQuery.trim()) setIsDropdownOpen(true);
                }}
                onChange={(e) => {
                  setFilterQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setIsDropdownOpen(true);
                  } else {
                    setIsDropdownOpen(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  } else if (e.key === 'Escape') {
                    setIsDropdownOpen(false);
                  }
                }}
                placeholder="Search eras, rulers, or dynasties..."
                className="w-full bg-[#0d0d12] hover:bg-[#111116] focus:bg-[#111116] border border-[#1e1e28] focus:border-[#38384a] rounded-full pl-11 sm:pl-12 pr-11 sm:pr-12 py-3.5 sm:py-4 text-sm sm:text-base text-[#f4f4f6] placeholder-[#52525c] outline-none transition-all shadow-inner"
              />
              {isSynthesizing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-[#a1a1aa]" />
                </div>
              )}
              {!isSynthesizing && filterQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525c] hover:text-[#d4d4d8] text-sm p-1 cursor-pointer transition-colors"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Real-time Search Dropdown Menu */}
            {isDropdownOpen && filterQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-[#0d0d12]/95 backdrop-blur-xl border border-[#22222e] rounded-2xl shadow-2xl shadow-black/95 overflow-hidden py-1.5 animate-in fade-in duration-100">
                {searchMatches.length > 0 ? (
                  <>
                    <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#52525c] border-b border-[#161622] mb-1 flex items-center justify-between">
                      <span>Matching Timelines</span>
                      <span>{searchMatches.length} found</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-[#14141d]/60">
                      {searchMatches.map((t) => {
                        const cleanTitle = t.title.split(':')[0].replace(/\([^)]*\)/g, '').trim();
                        const badgeYear = getBadgeYear(t);
                        return (
                          <div
                            key={t.id || t.slug}
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onSelectTimeline(t.slug || t.id);
                            }}
                            className="px-4 py-2.5 flex items-center justify-between hover:bg-[#15151f] cursor-pointer transition-colors group"
                          >
                            <div className="flex flex-col min-w-0 pr-3">
                              <span className="text-sm font-medium text-[#e4e4e7] group-hover:text-white truncate">
                                {cleanTitle}
                              </span>
                              <span className="text-[11px] text-[#71717a] group-hover:text-[#a1a1aa] truncate">
                                {t.category || 'Historical Era'}
                              </span>
                            </div>
                            {badgeYear && (
                              <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#13131b] border border-[#20202d] text-[#8e8e98] group-hover:text-[#d4d4d8] group-hover:border-[#38384a] transition-all">
                                {badgeYear}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div
                    onClick={handleSearchSubmit}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#15151f] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSynthesizing ? (
                        <Loader2 className="w-4 h-4 text-[#a1a1aa] animate-spin shrink-0" />
                      ) : (
                        <Search className="w-4 h-4 text-[#71717a] group-hover:text-white shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-[#f4f4f6] group-hover:text-white font-medium truncate">
                          {isSynthesizing ? `Generating "${filterQuery.trim()}"...` : `Create timeline: "${filterQuery.trim()}"`}
                        </span>
                        <span className="text-[11px] text-[#71717a]">
                          Historical Timeline Engine
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-[#71717a] group-hover:text-white px-2 py-0.5 rounded bg-[#13131b] border border-[#222230]">
                      <span>Enter</span>
                      <span>↵</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Tab Pills: Aligned directly under Search Box */}
          <div className="w-full max-w-2xl flex items-center justify-center flex-wrap gap-2 mt-5 overflow-x-auto pb-1">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'ANCIENT', label: 'Ancient India' },
                { id: 'MEDIEVAL', label: 'Medieval India' },
                { id: 'MODERN', label: 'Modern India' },
                { id: 'WORLD', label: 'World History' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-[#0f0f14] hover:bg-[#15151c] text-[#8e8e98] hover:text-[#f4f4f6] border border-[#1a1a24]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div className="w-full space-y-12 pb-16">
          {eraGroups.map((group) => {
            const groupTimelines = filteredTimelines
              .filter((t) => group.matchCategory(t.category || (t as any).topic || t.title))
              .sort((a, b) => getTimelineStartYear(a) - getTimelineStartYear(b));

            if (groupTimelines.length === 0) return null;

            const groupSpan = getGroupDisplaySpan(groupTimelines, group.span);

            return (
              <section key={group.id} className="w-full">
                {/* Era Header: Cleanly Separated from Timeline Rail */}
                <div className="flex items-baseline justify-between pb-2.5 mb-8 border-b border-[#161620]">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-serif-editorial text-lg sm:text-xl text-[#f4f4f6] font-normal tracking-tight">
                      {group.name}
                    </h2>
                    <span className="text-xs text-[#52525c] font-mono hidden sm:inline">
                      {groupSpan}
                    </span>
                  </div>
                  <span className="text-xs text-[#52525c] font-mono">
                    {groupTimelines.length} {groupTimelines.length === 1 ? 'topic' : 'topics'}
                  </span>
                </div>

                {/* Refined Minimal Timeline Rail */}
                <div className="relative w-full py-2">
                  {/* Central Spine: Desktop */}
                  <div
                    className="hidden md:block absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[1px] bg-[#1a1a24] pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Spine: Mobile */}
                  <div
                    className="md:hidden absolute top-4 bottom-4 left-[50px] -translate-x-1/2 w-[1px] bg-[#1a1a24] pointer-events-none"
                    aria-hidden="true"
                  />

                  <div className="flex flex-col gap-6 sm:gap-7 relative">
                    {groupTimelines.map((timeline, index) => {
                      const isLeft = index % 2 === 0;
                      const badgeYear = getBadgeYear(timeline);
                      const cleanTitle = timeline.title.split(':')[0].replace(/\([^)]*\)/g, '').trim();
                      const eventCount = timeline.events?.length || timeline.eventCount || 0;

                      return (
                        <div
                          key={timeline.id || timeline.slug}
                          className="relative flex items-center w-full"
                        >
                          {/* DESKTOP LAYOUT (md: and up) */}
                          <div className="hidden md:flex items-center justify-between w-full relative">
                            {/* Left Side: Topic text OR Empty */}
                            <div className="w-[43%] flex items-center justify-end">
                              {isLeft ? (
                                <div
                                  onClick={() => onSelectTimeline(timeline.slug || timeline.id)}
                                  className="group cursor-pointer text-right flex flex-col items-end select-none pr-1"
                                >
                                  <h3 className="font-serif-editorial text-base sm:text-lg text-[#f4f4f6] group-hover:text-white transition-colors leading-snug">
                                    {cleanTitle}
                                  </h3>
                                  <span className="text-[11px] font-mono text-[#52525c] group-hover:text-[#888898] transition-colors mt-0.5">
                                    {eventCount} key milestones
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            {/* Center: Year Node on Central Spine */}
                            <div className="w-[14%] flex items-center justify-center relative z-10">
                              <div
                                onClick={() => onSelectTimeline(timeline.slug || timeline.id)}
                                className="w-[88px] h-[28px] shrink-0 flex items-center justify-center rounded-full bg-[#0d0d12] hover:bg-[#15151c] border border-[#22222d] hover:border-[#444458] text-[11px] font-mono font-medium text-[#d4d4d8] hover:text-white shadow-md shadow-black/80 cursor-pointer transition-all whitespace-nowrap select-none text-center tabular-nums"
                              >
                                {badgeYear}
                              </div>
                            </div>

                            {/* Right Side: Topic text OR Empty */}
                            <div className="w-[43%] flex items-center justify-start">
                              {!isLeft ? (
                                <div
                                  onClick={() => onSelectTimeline(timeline.slug || timeline.id)}
                                  className="group cursor-pointer text-left flex flex-col items-start select-none pl-1"
                                >
                                  <h3 className="font-serif-editorial text-base sm:text-lg text-[#f4f4f6] group-hover:text-white transition-colors leading-snug">
                                    {cleanTitle}
                                  </h3>
                                  <span className="text-[11px] font-mono text-[#52525c] group-hover:text-[#888898] transition-colors mt-0.5">
                                    {eventCount} key milestones
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* MOBILE LAYOUT (< md) */}
                          <div className="md:hidden flex items-center w-full pl-3 pr-2">
                            {/* Node on mobile spine */}
                            <div className="w-[76px] flex justify-center shrink-0 z-10">
                              <div
                                onClick={() => onSelectTimeline(timeline.slug || timeline.id)}
                                className="w-[76px] h-[24px] shrink-0 flex items-center justify-center rounded-full bg-[#0d0d12] border border-[#22222d] text-[10px] font-mono font-medium text-[#d4d4d8] whitespace-nowrap cursor-pointer text-center tabular-nums"
                              >
                                {badgeYear}
                              </div>
                            </div>

                            {/* Dotted Connector */}
                            <div className="w-3 border-t border-dotted border-[#2a2a38] shrink-0" />

                            {/* Topic Text */}
                            <div
                              onClick={() => onSelectTimeline(timeline.slug || timeline.id)}
                              className="flex-1 text-left pl-2 group cursor-pointer"
                            >
                              <h3 className="font-serif-editorial text-sm sm:text-base text-[#f4f4f6] group-hover:text-white transition-colors leading-snug">
                                {cleanTitle}
                              </h3>
                              <span className="text-[10px] font-mono text-[#52525c] block mt-0.5">
                                {eventCount} milestones
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}

        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-4xl flex items-center justify-center text-[11px] text-[#444452] pt-16 pb-6 mt-auto border-t border-[#121218] font-mono tracking-widest uppercase">
        HISTORICAL TIMELINE ENGINE
      </footer>
    </div>
  );
};
