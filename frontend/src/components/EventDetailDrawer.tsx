import React from 'react';
import type { HistoricalEvent } from '../types/timeline';
import { getEventWikiUrl, getSourceUrl } from '../types/timeline';
import { useEscapeKey } from '../hooks';
import { X, ExternalLink } from 'lucide-react';

interface EventDetailDrawerProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  onClose,
}) => {
  // Reusable Escape key handler
  useEscapeKey(onClose, !!event);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs">
      {/* Backdrop */}
      <div 
        className="flex-1 cursor-pointer" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div 
        className="relative w-full max-w-lg bg-[#070709] border-l border-[#16161a] h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl shadow-black select-none"
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
      >
        <div>
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#141418]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#52525c]">
              {event.era || 'HISTORICAL RECORD'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[#15151c] text-[#71717a] hover:text-white transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <h2 className="font-serif-editorial text-2xl md:text-3xl font-normal text-white leading-snug mb-3">
            {event.title}
          </h2>

          {/* Date & Location Badges & Wikipedia Link */}
          <div className="flex items-center justify-between gap-3 text-xs text-[#71717a] mb-8 font-mono flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-[#121216] border border-[#1f1f26] px-2.5 py-0.5 rounded-full text-[#d4d4d8]">
                {event.displayDate}
              </span>
              {event.datePrecision && event.datePrecision !== 'YEAR_ONLY' && (
                <span className="text-[10px] text-[#71717a] border border-[#1a1a20] px-2 py-0.5 rounded-full">
                  {event.datePrecision.replace('_', ' ')}
                </span>
              )}
              {event.location && (
                <>
                  <span>•</span>
                  <span>{event.location}</span>
                </>
              )}
            </div>
            <a
              href={getEventWikiUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#121216] hover:bg-[#1a1a22] border border-[#1f1f28] hover:border-[#383848] text-[#d4d4d8] hover:text-white rounded-full text-[11px] transition-colors"
              title={`Read about "${event.title}" on Wikipedia`}
            >
              <span>Wikipedia</span>
              <ExternalLink className="w-3 h-3 text-[#9ca3af]" />
            </a>
          </div>

          {/* Narrative & Details */}
          <div className="space-y-7 text-[#9ca3af] text-sm leading-relaxed mb-6">
            {/* Overview */}
            <section>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#71717a] mb-2.5 block">
                Overview
              </h4>
              <p className="text-[#d4d4d8] leading-relaxed text-sm">
                {event.detailedDescription || event.shortSummary}
              </p>
            </section>

            {/* Causes & Catalysts */}
            {event.causes && event.causes.length > 0 && (
              <section>
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#71717a] mb-2.5 block">
                  Causes & Catalysts
                </h4>
                <div className="bg-[#0c0c0f] border border-[#17171d] rounded-xl p-4">
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-[#a1a1aa]">
                    {event.causes.map((cause, idx) => (
                      <li key={idx}>{cause}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Key Figures */}
            {event.keyFigures && event.keyFigures.length > 0 && (
              <section>
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#71717a] mb-2.5 block">
                  Key Figures
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.keyFigures.map((figure, idx) => (
                    <span 
                      key={idx}
                      className="bg-[#0f0f13] border border-[#1a1a22] text-[#d4d4d8] text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      {figure}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Consequences & Outcomes */}
            {event.consequences && event.consequences.length > 0 && (
              <section>
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#71717a] mb-2.5 block">
                  Consequences & Outcomes
                </h4>
                <div className="bg-[#0c0c0f] border border-[#17171d] rounded-xl p-4">
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-[#a1a1aa]">
                    {event.consequences.map((consequence, idx) => (
                      <li key={idx}>{consequence}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Historical Significance */}
            {event.significance && (
              <section>
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#71717a] mb-2.5 block">
                  Historical Significance
                </h4>
                <div className="border-l-2 border-[#2b2b36] pl-3.5 py-1">
                  <p className="text-xs text-[#d4d4d8] italic leading-relaxed">
                    "{event.significance}"
                  </p>
                </div>
              </section>
            )}

            {/* Sources & Reliability — Actual Clickable Links */}
            {event.sources && event.sources.length > 0 && (
              <section>
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#71717a] mb-2.5 block">
                  Sources & Reliability
                </h4>
                <div className="space-y-2">
                  {event.sources.map((source, idx) => {
                    const sourceUrl = getSourceUrl(source);
                    return (
                      <a 
                        key={idx}
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-xs bg-[#0c0c0f] hover:bg-[#13131a] border border-[#17171d] hover:border-[#282834] p-3 rounded-xl text-[#9ca3af] hover:text-white transition-all group cursor-pointer"
                        title={`Open source: ${source.title}`}
                      >
                        <div className="flex flex-col pr-3">
                          <span className="font-medium text-[#e4e4e7] group-hover:text-white transition-colors">
                            {source.title}
                          </span>
                          {source.citation && source.citation !== source.title && (
                            <span className="text-[11px] text-[#71717a] mt-0.5">
                              {source.citation}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[9px] text-[#52525c] border border-[#1d1d26] px-1.5 py-0.5 rounded uppercase">
                            {source.type}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#52525c] group-hover:text-[#d4d4d8] transition-colors" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-6 border-t border-[#141418] flex items-center justify-between text-[11px] text-[#52525c]">
          <span className="font-serif-editorial text-xs text-[#71717a]">Chronos Historiography</span>
          <span className="font-mono text-[10px]">Historical Milestone</span>
        </div>
      </div>
    </div>
  );
};

export default EventDetailDrawer;
