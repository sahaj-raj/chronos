import type { HistoricalTimeline, UserNote } from '../types/timeline';

const CLIENT_STORAGE_KEY = 'chronos_client_id';

/**
 * Retrieves or generates an anonymous persistent UUID for the client.
 */
export function getClientId(): string {
  if (typeof window === 'undefined') {
    return 'guest_user';
  }

  let id = localStorage.getItem(CLIENT_STORAGE_KEY) || localStorage.getItem('chronicles_client_id');
  if (!id || id.trim() === '') {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'client_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(CLIENT_STORAGE_KEY, id);
  }
  return id;
}

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : 'http://localhost:8080/api/v1';

function normalizeTimeline(t: any): HistoricalTimeline {
  const topic = (t.topic || t.slug || t.title || '').toLowerCase();
  let category = t.category;
  if (!category) {
    if (topic.includes('ancient') || topic.includes('indus') || topic.includes('vedic') || topic.includes('maurya') || topic.includes('gupta')) {
      category = 'Ancient India';
    } else if (topic.includes('medieval') || topic.includes('mughal') || topic.includes('chola') || topic.includes('delhi') || topic.includes('maratha') || topic.includes('sultanate')) {
      category = 'Medieval India';
    } else if (topic.includes('modern') || topic.includes('british') || topic.includes('freedom') || topic.includes('gandhi') || topic.includes('independence')) {
      category = 'Modern India';
    } else {
      category = 'World History';
    }
  }

  const events = (t.events || []).map((e: any) => {
    const rawDate = e.date || e.displayDate || (e.year ? `${e.year}` : '');
    let year = e.year;
    if (year === undefined || year === null) {
      const m = String(rawDate).match(/(-?\d{1,4})/);
      if (m) {
        const parsed = parseInt(m[1], 10);
        year = String(rawDate).toUpperCase().includes('BCE') || String(rawDate).toUpperCase().includes('BC') ? -Math.abs(parsed) : parsed;
      } else {
        year = 0;
      }
    }
    return {
      ...e,
      category: e.category || category,
      displayDate: e.displayDate || e.date || (year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`),
      year,
      shortSummary: e.shortSummary || e.description || '',
    };
  });

  return {
    id: t.id || t.slug || 'timeline',
    slug: t.slug || (t.topic ? t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'timeline'),
    title: t.title || (t.topic ? t.topic.replace(/-/g, ' ') : 'Historical Timeline'),
    description: t.description || '',
    category,
    isCurated: t.isCurated ?? true,
    events,
    timeSpan: t.timeSpan,
    startYear: t.startYear,
    endYear: t.endYear,
  };
}

/**
 * Fetches all timelines from Spring Boot backend.
 */
export async function fetchTimelines(): Promise<HistoricalTimeline[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/timelines`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (!data || data.length === 0) return [];

    // If backend returned summaries without events array, load the full detail for each
    const fullTimelines: HistoricalTimeline[] = await Promise.all(
      data.map(async (t: any) => {
        let target = t;
        if (!t.events || !Array.isArray(t.events) || t.events.length === 0) {
          const detail = await fetchTimelineDetail(t.slug || t.id);
          if (detail) target = detail;
        }
        return normalizeTimeline(target);
      })
    );

    return fullTimelines;
  } catch (err) {
    console.warn('Backend timelines unavailable or offline:', err);
    return [];
  }
}

/**
 * Fetches full detail of a specific timeline including all chronologically ordered events.
 */
export async function fetchTimelineDetail(idOrSlug: string): Promise<HistoricalTimeline | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/timelines/${idOrSlug}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return normalizeTimeline(data);
  } catch (err) {
    console.warn(`Could not fetch timeline detail for ${idOrSlug}`, err);
    return null;
  }
}

/**
 * Synthesizes a new timeline from a user query via the backend.
 */
export async function generateTimelineApi(query: string): Promise<HistoricalTimeline | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/timelines/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: query, query }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return normalizeTimeline(data);
  } catch (err) {
    console.warn('Backend generation API offline', err);
    return null;
  }
}

/**
 * Retrieves a user's private note for a historical event using the client's UUID.
 */
export async function getEventNoteApi(eventId: string): Promise<UserNote | null> {
  try {
    const userId = getClientId();
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/notes?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 204 || res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Saves or updates a user note in the backend H2 database.
 */
export async function saveNoteApi(eventId: string, content: string): Promise<void> {
  const userId = getClientId();
  try {
    await fetch(`${API_BASE_URL}/events/${eventId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId }),
    });
  } catch (err) {
    console.info('Note stored locally (backend sync failed or offline)');
  }
}
