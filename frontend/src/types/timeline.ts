export interface EventSource {
  title: string;
  type: 'ACADEMIC' | 'OFFICIAL' | 'ARCHIVE' | 'ENCYCLOPEDIA' | string;
  citation?: string;
  url?: string;
}

/**
 * Returns the source's direct link if present (e.g. Wikipedia/archive/JSTOR/official URL),
 * or generates an authoritative Google Scholar search URL for the monograph/article.
 */
export function getSourceUrl(source: EventSource): string {
  if (source.url && source.url.trim().startsWith('http')) {
    return source.url.trim();
  }
  const cleanTitle = source.title.trim();
  const cleanCitation = source.citation ? source.citation.trim() : '';
  const query = cleanCitation && !cleanTitle.includes(cleanCitation) 
    ? `${cleanTitle} ${cleanCitation}`
    : cleanTitle;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
}

export type DatePrecision = 
  | 'EXACT_DAY' 
  | 'MONTH_YEAR' 
  | 'YEAR_ONLY' 
  | 'APPROXIMATE' 
  | 'CENTURY' 
  | 'UNKNOWN';

export interface HistoricalEvent {
  id: string;
  title: string;
  category: string;
  year: number; // Retained for display compatibility (signed integer: negative = BCE, positive = CE)
  startYear?: number | null;
  endYear?: number | null;
  startMonth?: number | null;
  startDay?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  datePrecision?: DatePrecision | string;
  displayDate: string;
  location?: string;
  shortSummary: string;
  detailedDescription?: string;
  era?: string;
  keyFigures?: string[];
  causes?: string[];
  consequences?: string[];
  significance?: string;
  sources?: EventSource[];
  displayOrder?: number;
  wikiUrl?: string;
  mainPhase?: string;
  subPhase?: string;
  materialCulture?: string;
  synchronismType?: 'DIRECT_CONTACT' | 'PARALLEL_EPOCH' | 'GEOPOLITICAL_RIPPLE' | 'CIVILIZATIONAL_CONTRAST' | string;
  globalNexus?: string;
}

/**
 * Returns a direct Wikipedia URL if present, or constructs a Wikipedia search URL for the event title.
 */
export function getEventWikiUrl(event: HistoricalEvent): string {
  if (event.wikiUrl && event.wikiUrl.trim() !== '') {
    return event.wikiUrl.trim();
  }
  const cleanTitle = event.title.replace(/\s*\([^)]*\)/g, '').trim();
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanTitle || event.title)}`;
}

export interface HistoricalTimeline {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  isCurated: boolean;
  eventCount?: number;
  timeSpan?: string;
  startYear?: number;
  endYear?: number;
  region?: string;
  contemporaries?: string[];
  tags?: string[];
  createdAt?: string;
  events: HistoricalEvent[];
}

export interface UserNote {
  id?: string;
  userId?: string;
  eventId: string;
  content: string;
  updatedAt: string;
}
