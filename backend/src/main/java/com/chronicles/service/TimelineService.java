package com.chronicles.service;

import com.chronicles.dto.TimelineDtos.*;
import com.chronicles.model.Source;
import com.chronicles.model.TimelineEvent;
import com.chronicles.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TimelineService {

    private static final Logger log = LoggerFactory.getLogger(TimelineService.class);
    private static final int MIN_EVENTS = 6;
    private static final int MAX_EVENTS = 10;
    /** Used only for isValidDate() — checks whether any digit sequence exists. */
    private static final Pattern YEAR_PATTERN     = Pattern.compile("(-?\\d{1,4})");
    /** Matches a 4-digit year (e.g. 2017, 1789) — preferred in extractYear. */
    private static final Pattern FOUR_DIGIT_YEAR  = Pattern.compile("(\\d{4})");
    /** Matches 1-3 digit numbers for short ancient years (250 BCE, 44 BCE). */
    private static final Pattern SHORT_YEAR       = Pattern.compile("(\\d{1,3})");
    /** Month name → ordinal mapping (1-based, uppercase). */
    private static final String[] MONTH_NAMES = {
        "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
        "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"
    };
    /** Matches ISO-style date prefix: 2017-03-15 or 2017/03/15. */
    private static final Pattern ISO_DATE = Pattern.compile("\\d{4}[\\-/](\\d{1,2})(?:[\\-/](\\d{1,2}))?");

    private final EventRepository eventRepository;
    private final GeminiService geminiService;

    public TimelineService(EventRepository eventRepository, GeminiService geminiService) {
        this.eventRepository = eventRepository;
        this.geminiService = geminiService;
    }

    public boolean isGenericFallback(TimelineEvent event) {
        if (event == null) return false;
        String title = event.getTitle() != null ? event.getTitle().toLowerCase() : "";
        String desc = event.getDescription() != null ? event.getDescription().toLowerCase() : "";
        return title.startsWith("foundational origins") || desc.startsWith("early structural catalysts");
    }

    /**
     * Pure read-only path: returns all stored timelines grouped by topic from DB.
     * Never calls Gemini.
     */
    public List<TimelineResponse> getAllTimelines() {
        List<TimelineEvent> allEvents = eventRepository.findAll();
        if (allEvents.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<TimelineEvent>> grouped = new LinkedHashMap<>();
        for (TimelineEvent event : allEvents) {
            if (isGenericFallback(event)) {
                continue;
            }
            grouped.computeIfAbsent(event.getTopic(), k -> new ArrayList<>()).add(event);
        }

        List<TimelineResponse> responses = new ArrayList<>();
        for (Map.Entry<String, List<TimelineEvent>> entry : grouped.entrySet()) {
            List<TimelineEventDto> dtos = entry.getValue().stream()
                    .map(TimelineEventDto::fromModel)
                    .toList();
            responses.add(new TimelineResponse(
                    entry.getKey(),
                    "Chronology of " + entry.getKey().replace("-", " "),
                    sortChronologically(dtos)
            ));
        }
        return responses;
    }

    /**
     * Pure read-only path: retrieves cached/stored timeline for topic or slug from DB.
     * Never calls Gemini.
     */
    public Optional<TimelineResponse> getTimelineFromDb(String idOrSlug) {
        String normalized = normalizeTopic(idOrSlug);
        List<TimelineEvent> events = eventRepository.findByTopicIgnoreCase(normalized);
        if (events == null || events.isEmpty()) {
            return Optional.empty();
        }
        List<TimelineEventDto> dtos = events.stream()
                .filter(e -> !isGenericFallback(e))
                .map(TimelineEventDto::fromModel)
                .toList();
        if (dtos.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new TimelineResponse(
                normalized,
                "Historical chronology for " + idOrSlug,
                sortChronologically(dtos)
        ));
    }

    /**
     * Synthesis and discovery path:
     * Gemini HTTP call is purposefully OUTSIDE of any database transaction.
     */
    public TimelineResponse generateTimeline(String rawTopic) {
        // 1. Normalize the query string
        String normalizedTopic = normalizeTopic(rawTopic);

        // 2. Query EventRepository for existing events matching this topic
        List<TimelineEvent> existingEntities = eventRepository.findByTopicIgnoreCase(normalizedTopic);

        // 3. If 6+ good events exist, return them directly (sorted chronologically) — skip Gemini
        if (existingEntities != null && existingEntities.size() >= MIN_EVENTS) {
            log.info("Read-through cache hit: {} existing events found for '{}'", existingEntities.size(), normalizedTopic);
            List<TimelineEventDto> dtos = existingEntities.stream()
                    .map(TimelineEventDto::fromModel)
                    .toList();
            return new TimelineResponse(
                    normalizedTopic,
                    "Historical chronology for " + rawTopic,
                    sortChronologically(dtos)
            );
        }

        // 4. If fewer than 6, call GeminiService once (OUTSIDE any DB transaction)
        log.info("Insufficient cached events for topic '{}' (found {}). Calling GeminiService...",
                normalizedTopic, existingEntities != null ? existingEntities.size() : 0);

        Optional<TimelineResponse> geminiResponseOpt = geminiService.fetchDiscoveredAndRankedEvents(normalizedTopic);
        if (geminiResponseOpt.isEmpty() || geminiResponseOpt.get().events() == null) {
            throw new IllegalStateException("Failed to discover historical events from Gemini for topic: " + rawTopic);
        }

        TimelineResponse geminiResponse = geminiResponseOpt.get();
        List<TimelineEventDto> rawGeminiEvents = geminiResponse.events();

        // 5. Validate in Java: non-null title/date/description, valid date, no duplicate titles.
        // Discard invalid entries individually — don't discard the whole batch for one bad entry.
        List<TimelineEventDto> validated = validateEvents(rawGeminiEvents);
        if (validated.isEmpty()) {
            throw new IllegalStateException("All candidate events returned by Gemini failed validation for topic: " + rawTopic);
        }

        // 7. Sort chronologically in Java, never trust LLM ordering
        List<TimelineEventDto> sorted = sortChronologically(validated);

        // 8. Soft bounds: cap to MAX_EVENTS (10) if more were returned, never pad
        if (sorted.size() > MAX_EVENTS) {
            sorted = sorted.subList(0, MAX_EVENTS);
        }

        // 6. Save validated new events to the DB (read-through cache) in a dedicated transaction
        saveValidatedEvents(normalizedTopic, sorted, existingEntities);

        return new TimelineResponse(
                normalizedTopic,
                geminiResponse.description() != null ? geminiResponse.description() : "Historical thesis for " + rawTopic,
                sorted
        );
    }

    /**
     * Scoped DB transaction: only active during database persistence.
     */
    @Transactional
    public void saveValidatedEvents(String topic, List<TimelineEventDto> candidates, List<TimelineEvent> existing) {
        for (TimelineEventDto dto : candidates) {
            boolean alreadyInDb = existing != null && existing.stream()
                    .anyMatch(e -> e.getTitle().equalsIgnoreCase(dto.title()));
            if (!alreadyInDb) {
                TimelineEvent entity = new TimelineEvent(
                        UUID.randomUUID().toString(),
                        topic,
                        dto.title(),
                        dto.date(),
                        dto.description(),
                        dto.sources() != null ? dto.sources().stream().map(SourceDto::toModel).toList() : List.of()
                );
                eventRepository.save(entity);
            }
        }
    }

    /**
     * Startup database seeder: runs only via CommandLineRunner on server boot if database is empty.
     */
    public void seedInitialTimelines() {
        log.info("Database startup check completed. Skipping synthetic generic topics.");
    }

    public List<TimelineEventDto> validateEvents(List<TimelineEventDto> rawEvents) {
        if (rawEvents == null || rawEvents.isEmpty()) {
            return Collections.emptyList();
        }

        List<TimelineEventDto> validEvents = new ArrayList<>();
        Set<String> seenTitles = new HashSet<>();

        for (TimelineEventDto event : rawEvents) {
            if (event == null) continue;

            if (event.title() == null || event.title().trim().isEmpty()) {
                log.warn("Discarding event missing title");
                continue;
            }
            if (event.date() == null || event.date().trim().isEmpty()) {
                log.warn("Discarding event '{}' missing date", event.title());
                continue;
            }
            if (event.description() == null || event.description().trim().isEmpty()) {
                log.warn("Discarding event '{}' missing description", event.title());
                continue;
            }
            if (!isValidDate(event.date())) {
                log.warn("Discarding event '{}' with invalid date format: '{}'", event.title(), event.date());
                continue;
            }

            String canonicalTitle = event.title().trim().toLowerCase();
            if (seenTitles.contains(canonicalTitle)) {
                log.warn("Discarding duplicate event title: '{}'", event.title());
                continue;
            }
            seenTitles.add(canonicalTitle);

            validEvents.add(new TimelineEventDto(
                    event.id() != null ? event.id() : UUID.randomUUID().toString(),
                    event.title().trim(),
                    event.date().trim(),
                    event.description().trim(),
                    event.sources() != null ? event.sources() : List.of()
            ));
        }

        return validEvents;
    }

    public List<TimelineEventDto> sortChronologically(List<TimelineEventDto> events) {
        if (events == null || events.isEmpty()) return Collections.emptyList();
        List<TimelineEventDto> copy = new ArrayList<>(events);
        copy.sort((a, b) -> {
            int ya = extractYear(a.date());
            int yb = extractYear(b.date());
            if (ya != yb) return Integer.compare(ya, yb);
            // Same year: sort by month+day for intra-year ordering
            int mda = extractMonthDay(a.date());
            int mdb = extractMonthDay(b.date());
            if (mda != mdb) return Integer.compare(mda, mdb);
            // Final deterministic tiebreaker
            return a.title().compareToIgnoreCase(b.title());
        });
        return copy;
    }

    /**
     * Returns a sortable integer encoding month*100+day for intra-year ordering.
     * Handles named months ("November 3, 2017") and ISO dates ("2017-11-03").
     * Returns 0 when month/day cannot be determined.
     */
    int extractMonthDay(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return 0;
        String upper = dateStr.toUpperCase();
        // 1. Try ISO-style prefix: 2017-03-15 or 2017/03/15
        Matcher iso = ISO_DATE.matcher(dateStr);
        if (iso.find()) {
            int mo = Integer.parseInt(iso.group(1));
            int dy = iso.group(2) != null ? Integer.parseInt(iso.group(2)) : 0;
            return mo * 100 + dy;
        }
        // 2. Try named month (January…December)
        int month = 0;
        for (int i = 0; i < MONTH_NAMES.length; i++) {
            if (upper.contains(MONTH_NAMES[i])) { month = i + 1; break; }
        }
        if (month == 0) return 0;
        // Extract day: strip the 4-digit year so we don't re-match it
        String withoutYear = dateStr.replaceAll("\\d{4}", "");
        Matcher dm = Pattern.compile("\\b(\\d{1,2})\\b").matcher(withoutYear);
        int day = 0;
        if (dm.find()) {
            try { day = Integer.parseInt(dm.group(1)); } catch (Exception ignored) {}
        }
        return month * 100 + day;
    }

    public String normalizeTopic(String query) {
        if (query == null || query.isBlank()) return "general-history";
        return query.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    public boolean isValidDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return false;
        return YEAR_PATTERN.matcher(dateStr).find();
    }

    /**
     * Extracts a signed chronological year from a date string.
     * Negative = BCE/BC, Positive = CE/AD.
     *
     * Strategy:
     *  1. Prefer 4-digit match (e.g. 2017, 1789, 3300) to avoid picking up
     *     the day-of-month from strings like "November 3, 2017" (→ 2017, not 3).
     *  2. Fall back to 1-3 digit match for ancient short years (250 BCE, 44 BCE).
     */
    public int extractYear(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return 0;
        try {
            String upper = dateStr.toUpperCase();
            boolean isBce = upper.contains("BCE") || upper.contains("BC");
            Matcher m4 = FOUR_DIGIT_YEAR.matcher(dateStr);
            if (m4.find()) {
                int y = Integer.parseInt(m4.group(1));
                return isBce ? -Math.abs(y) : y;
            }
            Matcher m = SHORT_YEAR.matcher(dateStr);
            if (m.find()) {
                int y = Integer.parseInt(m.group(1));
                return isBce ? -Math.abs(y) : y;
            }
        } catch (Exception ignored) {}
        return 0;
    }
}
