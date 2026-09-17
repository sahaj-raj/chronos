import React from 'react';
import type { HistoricalEvent } from '../types/timeline';
import { useScrollReveal } from '../hooks';

interface TimelineCardProps {
  event: HistoricalEvent;
  onSelect: (event: HistoricalEvent) => void;
  position?: 'left' | 'right';
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  event,
  onSelect,
}) => {
  return (
    <article
      onClick={() => onSelect(event)}
      className="w-full bg-[#0b0b0e] hover:bg-[#111116] border border-[#181820] hover:border-[#2e2e3e] rounded-xl p-4 md:p-4.5 transition-all duration-200 cursor-pointer group relative text-left shadow-md shadow-black/50 hover:shadow-black/80 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] tracking-wider text-[#636370] uppercase font-medium">
          {event.category}
        </span>
        <span className="md:hidden font-mono text-[11px] text-[#9ca3af] font-medium">
          {event.displayDate}
        </span>
      </div>

      <h3 className="font-serif-editorial text-lg md:text-[19px] leading-snug text-[#f4f4f6] font-normal mb-1.5 group-hover:text-white transition-colors">
        {event.title}
      </h3>

      <p className="text-[#888894] text-xs md:text-[13px] leading-relaxed line-clamp-2 mb-2.5">
        {event.shortSummary}
      </p>

      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#14141a]">
        <span className="text-[#555562] truncate max-w-[70%] font-sans">
          {event.era}
        </span>
        <span className="text-[#454552] group-hover:text-[#9e9eb0] transition-colors text-xs font-mono">
          view →
        </span>
      </div>
    </article>
  );
};

export function formatSpineYear(event: HistoricalEvent): string {
  if (event.startYear != null) {
    if (event.startYear < 0) {
      return `${Math.abs(event.startYear)} BCE`;
    }
    if (event.endYear != null && event.endYear !== event.startYear) {
      const endStr = event.endYear < 0 ? `${Math.abs(event.endYear)} BCE` : `${event.endYear}`;
      return `${event.startYear}–${endStr}`;
    }
    return `${event.startYear}`;
  }
  if (event.year != null) {
    return event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year}`;
  }
  const match = event.displayDate.match(/(-?\d{1,4}(\s*(BCE|BC|CE|AD))?)/i);
  return match ? match[0] : event.displayDate;
}

export const TimelineNode: React.FC<{ event: HistoricalEvent }> = ({ event }) => {
  const yearText = formatSpineYear(event);
  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <span className="px-3.5 py-1.5 md:px-4 md:py-1.5 rounded-full bg-[#0d0d12] border border-[#2b2b3a] text-[#f4f4f8] text-xs md:text-[13px] font-mono font-semibold shadow-xl shadow-black/80 ring-4 ring-black whitespace-nowrap tracking-wide">
        {yearText}
      </span>
    </div>
  );
};

interface VerticalTimelineProps {
  events: HistoricalEvent[];
  timelineTitle: string;
  timelineDescription?: string;
  onSelectEvent: (event: HistoricalEvent) => void;
}

interface TimelineRowProps {
  event: HistoricalEvent;
  index: number;
  onSelect: (event: HistoricalEvent) => void;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ event, index, onSelect }) => {
  const { ref, isRevealed } = useScrollReveal({
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
    triggerOnce: false,
  });
  const position: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';

  const cardRevealStyle = {
    '--reveal-x': position === 'left' ? '-20px' : '20px',
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      className="relative flex items-center w-full pl-8 md:pl-0"
    >
      {/* Central Year Badge (Desktop) */}
      <div
        className={`hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-20 pointer-events-none node-reveal ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        <TimelineNode event={event} />
      </div>

      {/* Mobile Spine Node & Connector */}
      <div className="md:hidden absolute left-6 top-6 -translate-x-1/2 w-2 h-2 rounded-full bg-[#e4e4e7] ring-4 ring-black border border-[#3f3f4c]" />
      <div className="md:hidden absolute left-6 top-6 w-3 border-t border-dashed border-[#2f2f40] pointer-events-none" />

      {position === 'left' ? (
        <>
          {/* Card on Left */}
          <div
            style={cardRevealStyle}
            className={`w-full md:w-[42%] lg:w-[40%] md:mr-auto timeline-reveal ${
              isRevealed ? 'is-revealed' : ''
            }`}
          >
            <TimelineCard event={event} onSelect={onSelect} position="left" />
          </div>

          {/* Connecting Line: Left Card Right-Edge to Center Year Badge */}
          <div
            className={`hidden md:block absolute left-[42%] lg:left-[40%] right-1/2 top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-[#343446] pointer-events-none z-10 transition-opacity duration-500 ${
              isRevealed ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        <>
          {/* Connecting Line: Center Year Badge to Right Card Left-Edge */}
          <div
            className={`hidden md:block absolute left-1/2 right-[42%] lg:right-[40%] top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-[#343446] pointer-events-none z-10 transition-opacity duration-500 ${
              isRevealed ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Card on Right */}
          <div
            style={cardRevealStyle}
            className={`w-full md:w-[42%] lg:w-[40%] md:ml-auto timeline-reveal ${
              isRevealed ? 'is-revealed' : ''
            }`}
          >
            <TimelineCard event={event} onSelect={onSelect} position="right" />
          </div>
        </>
      )}
    </div>
  );
};

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  events,
  timelineTitle,
  timelineDescription,
  onSelectEvent,
}) => {
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const yA = a.startYear ?? a.year ?? 0;
      const yB = b.startYear ?? b.year ?? 0;
      if (yA !== yB) return yA - yB;
      const mA = a.startMonth ?? 0;
      const mB = b.startMonth ?? 0;
      if (mA !== mB) return mA - mB;
      return (a.startDay ?? 0) - (b.startDay ?? 0);
    });
  }, [events]);

  return (
    <div className="relative w-full min-h-screen pb-20 text-center bg-black select-none">
      {/* Header Area */}
      <header className="pt-8 pb-10 px-4 max-w-3xl mx-auto">
        <h1 className="font-serif-editorial text-3xl md:text-4xl lg:text-5xl text-white font-normal tracking-tight mb-3">
          {timelineTitle}
        </h1>
        {timelineDescription && (
          <p className="text-[#9898a4] text-xs md:text-sm max-w-2xl mx-auto leading-relaxed font-sans">
            {timelineDescription}
          </p>
        )}
      </header>

      {/* Main Timeline Rail */}
      <div className="relative max-w-5xl mx-auto px-4 md:px-6">
        {/* Continuous Central Vertical Line */}
        <div
          className="absolute top-2 bottom-10 left-6 md:left-1/2 -translate-x-1/2 w-[1px] bg-[#1a1a20] pointer-events-none"
          aria-hidden="true"
        />

        {/* Milestone Cards Container */}
        <div className="flex flex-col gap-6 md:gap-7 relative">
          {sortedEvents.map((event, index) => (
            <TimelineRow
              key={event.id || index}
              event={event}
              index={index}
              onSelect={onSelectEvent}
            />
          ))}
        </div>

        {/* Bottom Historical Resolution Marker */}
        <div className="mt-16 mb-10 flex flex-col items-center justify-center relative z-20 gap-2">
          <div className="w-2.5 h-2.5 rounded-full border border-[#3f3f4c] bg-black" />
          <span className="font-mono text-xs tracking-wider text-[#52525c]">
            {events.length} Milestones
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerticalTimeline;