import React, { useState } from 'react';
import { Search, ArrowLeftRight } from 'lucide-react';
import type { HistoricalTimeline } from '../types/timeline';

interface MasterRoadmapProps {
  timelines: HistoricalTimeline[];
  onSelectTimeline: (slugOrId: string) => void;
  onOpenComparisonPicker?: () => void;
}

export const MasterRoadmap: React.FC<MasterRoadmapProps> = ({
  timelines,
  onSelectTimeline,
  onOpenComparisonPicker,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ANCIENT' | 'MEDIEVAL' | 'MODERN' | 'WORLD'>('ALL');

  const formatYear = (yr: number | undefined | null) => {
    if (yr === undefined || yr === null) return '';
    return yr < 0 ? `${Math.abs(yr)} BCE` : `${yr} CE`;
  };

  const getBadgeYear = (t: HistoricalTimeline) => {
    const yr = t.startYear ?? t.events?.[0]?.startYear;
    if (yr !== undefined && yr !== null) {
      return formatYear(yr);
    }
    if (t.timeSpan) {
      return t.timeSpan.split('–')[0].trim();
    }
    return '';
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

  // Quick filter
  const filteredTimelines = timelines.filter((t) => {
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

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-black text-[#8e8e98] px-4 py-8 select-none">
      {/* Main Container */}
      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mt-4 mb-8">
          <h1 className="font-serif-editorial text-4xl sm:text-5xl text-[#f4f4f6] font-normal tracking-tight">
            Chronos
          </h1>
        </div>

        {/* Quick Search & Compare Controls */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-2.5 mb-8">
          {/* Filter Input */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525c]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search eras, rulers, or dynasties..."
              className="w-full bg-[#0d0d12] hover:bg-[#111116] focus:bg-[#111116] border border-[#1a1a24] focus:border-[#333344] rounded-full pl-9 pr-4 py-2.5 text-sm text-[#f4f4f6] placeholder-[#52525c] outline-none transition-all"
            />
          </div>

          {/* Compare Launcher Button */}
          {onOpenComparisonPicker && (
            <button
              onClick={onOpenComparisonPicker}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#111116] hover:bg-[#181822] border border-[#20202c] hover:border-[#38384a] text-xs font-medium text-[#d4d4d8] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              title="Compare timelines"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#71717a]" />
              <span>Compare Timelines</span>
            </button>
          )}
        </div>

        {/* Category Tab Pills */}
        <div className="w-full flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-1">
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

        {/* Groups */}
        <div className="w-full space-y-12">
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
                    className="md:hidden absolute top-4 bottom-4 left-12 -translate-x-1/2 w-[1px] bg-[#1a1a24] pointer-events-none"
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
                                className="px-3 py-1 rounded-full bg-[#0d0d12] hover:bg-[#15151c] border border-[#22222d] hover:border-[#444458] text-[11px] font-mono font-medium text-[#d4d4d8] hover:text-white shadow-md cursor-pointer transition-all whitespace-nowrap select-none"
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
                          <div className="md:hidden flex items-center w-full pl-6 pr-2">
                            {/* Node on mobile spine */}
                            <div className="w-12 flex justify-center shrink-0 z-10">
                              <div
                                onClick={() => onSelectTimeline(timeline.slug || timeline.id)}
                                className="px-2 py-0.5 rounded-full bg-[#0d0d12] border border-[#22222d] text-[10px] font-mono text-[#d4d4d8] whitespace-nowrap cursor-pointer"
                              >
                                {badgeYear}
                              </div>
                            </div>

                            {/* Dotted Connector */}
                            <div className="w-4 border-t border-dotted border-[#2a2a38] shrink-0" />

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

          {/* Empty or Searching State */}
          {eraGroups.every((g) => filteredTimelines.filter((t) => g.matchCategory(t.category || (t as any).topic || t.title)).length === 0) && (
            <div className="text-center py-16 px-4">
              <p className="text-[#a1a1aa] text-sm mb-2">
                {filterQuery ? `No historical timelines found for "${filterQuery}".` : 'Loading historical timelines...'}
              </p>
              <p className="text-xs text-[#52525c]">
                Connecting to Chronos Timeline Engine...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-4xl flex items-center justify-center text-[11px] text-[#444452] pt-16 pb-6 mt-auto border-t border-[#121218] font-mono tracking-widest uppercase">
        HISTORICAL TIMELINE ENGINE
      </footer>
    </div>
  );
};
