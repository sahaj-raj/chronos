import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { MasterRoadmap } from './components/MasterRoadmap';
import { ComparisonEngine, ComparisonPicker } from './components/ComparisonEngine';
import { VerticalTimeline } from './components/VerticalTimeline';
import { EventDetailDrawer } from './components/EventDetailDrawer';
import { fetchTimelines, fetchTimelineDetail } from './services/api';
import { DEFAULT_TIMELINES } from './data/defaultTimelines';
import type { HistoricalTimeline, HistoricalEvent } from './types/timeline';

export function App() {
  const [timelines, setTimelines] = useState<HistoricalTimeline[]>(DEFAULT_TIMELINES);
  const [activeTimeline, setActiveTimeline] = useState<HistoricalTimeline | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [activeComparison, setActiveComparison] = useState<{
    timelineA: HistoricalTimeline;
    timelineB: HistoricalTimeline;
  } | null>(null);

  // Sync with backend on startup
  useEffect(() => {
    fetchTimelines().then((data) => {
      if (data && data.length > 0) {
        setTimelines((prev) => {
          const backendIds = new Set(data.map((d) => d.slug || d.id));
          return [...data, ...prev.filter((p) => !backendIds.has(p.slug || p.id))];
        });

        // If URL has ?t=slug, load that timeline immediately
        const params = new URLSearchParams(window.location.search);
        const targetSlug = params.get('t');
        if (targetSlug) {
          const matched = data.find((t) => t.slug === targetSlug || t.id === targetSlug);
          if (matched) {
            handleSelectTimeline(targetSlug);
          }
        }
      }
    });
  }, []);

  // Switch to a timeline (by slug or id)
  const handleSelectTimeline = async (slugOrId: string) => {
    setActiveComparison(null); // Exit comparison if switching to single timeline
    // Check in local timelines array first
    let target = timelines.find((t) => t.slug === slugOrId || t.id === slugOrId);

    // If missing, shallow, or carrying obsolete boilerplate summary, fetch/upgrade via backend
    const isShallow = !target || !target.events || target.events.length <= 5;
    const isBoilerplate = !!target?.description && (
      target.description.startsWith('A synthesis') ||
      target.description.startsWith('Synthesized historical') ||
      target.description.startsWith('This timeline') ||
      target.description.endsWith('...') ||
      target.description.length > 220
    );

    if (isShallow || isBoilerplate) {
      const full = await fetchTimelineDetail(slugOrId);
      if (full) {
        target = full;
        setTimelines((prev) => {
          const exists = prev.some((p) => p.slug === full.slug || p.id === full.id);
          return exists
            ? prev.map((p) => (p.slug === full.slug || p.id === full.id ? full : p))
            : [...prev, full];
        });
      }
    }

    if (target) {
      setActiveTimeline(target);

      // Sync URL
      const url = new URL(window.location.href);
      url.searchParams.set('t', target.slug || target.id);
      window.history.replaceState({}, '', url.toString());

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Return to Home Hero search screen
  const handleGoHome = () => {
    setActiveTimeline(null);
    setActiveComparison(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('t');
    window.history.replaceState({}, '', url.toString());
  };

  // Handle launch of comparison
  const handleLaunchComparison = (timelineA: HistoricalTimeline, timelineB: HistoricalTimeline) => {
    setActiveComparison({ timelineA, timelineB });
    setIsCompareOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-[#8e8e98] flex flex-col font-sans overflow-x-hidden">
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {activeComparison !== null ? (
          /* Dual-Timeline Comparison Engine */
          <ComparisonEngine
            timelineA={activeComparison.timelineA}
            timelineB={activeComparison.timelineB}
            onSelectEvent={setSelectedEvent}
            onBack={() => setActiveComparison(null)}
            onChangeComparison={() => setIsCompareOpen(true)}
          />
        ) : activeTimeline === null ? (
          /* Master Chronological Roadmap of Indian History */
          <MasterRoadmap
            timelines={timelines}
            onSelectTimeline={handleSelectTimeline}
            onOpenComparisonPicker={() => setIsCompareOpen(true)}
          />
        ) : (
          /* Single Timeline Detailed View */
          <div className="flex-1 flex flex-col items-center w-full">
            {/* Minimal Clean Sticky Top Navigation Bar */}
            <header className="sticky top-0 z-30 w-full bg-black/85 backdrop-blur-md border-b border-[#141418] px-4 md:px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-2 text-xs text-[#71717a] hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-full hover:bg-[#121216]"
                  title="Back to Master Roadmap"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="font-serif-editorial text-base font-normal text-white">Chronos</span>
                </button>
              </div>

              {/* Right: Compare Timeline Action */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="flex items-center gap-2 text-xs font-medium text-[#d4d4d8] hover:text-white px-3.5 py-1.5 rounded-full bg-[#121218] hover:bg-[#1a1a22] border border-[#22222e] hover:border-[#38384a] transition-all cursor-pointer shadow-sm"
                  title="Compare timelines"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#71717a]" />
                  <span>Compare Timelines</span>
                </button>
              </div>
            </header>

            {/* Central Content: Interactive Vertical Timeline */}
            <main className="w-full flex-1 flex flex-col items-center">
              <VerticalTimeline
                events={activeTimeline.events || []}
                timelineTitle={activeTimeline.title}
                timelineDescription={activeTimeline.description}
                onSelectEvent={setSelectedEvent}
              />
            </main>
          </div>
        )}
      </div>

      {/* Comparison Picker Modal (Battle Monitor Style) */}
      {isCompareOpen && (
        <ComparisonPicker
          currentTimeline={activeTimeline || timelines[0]}
          allTimelines={timelines}
          onCompare={handleLaunchComparison}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* Slide-out Event Detail Drawer */}
      <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default App;
