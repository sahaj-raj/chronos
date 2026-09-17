package com.chronicles;

import com.chronicles.dto.TimelineDtos.*;
import com.chronicles.model.Source;
import com.chronicles.model.TimelineEvent;
import com.chronicles.repository.EventRepository;
import com.chronicles.service.GeminiService;
import com.chronicles.service.TimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ChroniclesApplicationTests {

    private EventRepository eventRepository;
    private GeminiService geminiService;
    private TimelineService timelineService;

    @BeforeEach
    void setUp() {
        eventRepository = Mockito.mock(EventRepository.class);
        geminiService = Mockito.mock(GeminiService.class);
        timelineService = new TimelineService(eventRepository, geminiService);
    }

    @Test
    @DisplayName("Topic query normalization: strips punctuation, trims, and converts to canonical lowercase slug")
    void testTopicNormalization() {
        assertEquals("french-revolution", timelineService.normalizeTopic("  French Revolution!  "));
        assertEquals("indus-valley-civilization", timelineService.normalizeTopic("Indus Valley Civilization:"));
        assertEquals("mughal-empire", timelineService.normalizeTopic("Mughal   Empire"));
    }

    @Test
    @DisplayName("Validation: Discards entries missing title, date, or description, and discards duplicate titles individually")
    void testEventValidationRules() {
        List<TimelineEventDto> rawEvents = List.of(
            new TimelineEventDto("1", "Valid Milestone One", "1789", "A valid milestone.", List.of()),
            new TimelineEventDto("2", null, "1790", "Missing title should be discarded.", List.of()),
            new TimelineEventDto("3", "Missing Date Milestone", "", "Missing date should be discarded.", List.of()),
            new TimelineEventDto("4", "Missing Desc Milestone", "1792", null, List.of()),
            new TimelineEventDto("5", "Valid Milestone One", "1793", "Duplicate title should be discarded.", List.of()),
            new TimelineEventDto("6", "Valid Milestone Two", "1794", "A second valid entry.", List.of()),
            new TimelineEventDto("7", "Valid Milestone Three", "1799", "A third valid entry.", List.of())
        );

        List<TimelineEventDto> validated = timelineService.validateEvents(rawEvents);

        assertEquals(3, validated.size(), "Should keep only the 3 valid non-duplicate entries");
        assertEquals("Valid Milestone One", validated.get(0).title());
        assertEquals("Valid Milestone Two", validated.get(1).title());
        assertEquals("Valid Milestone Three", validated.get(2).title());
    }

    @Test
    @DisplayName("Chronological sorting: Correctly sorts BCE (negative) before CE, and earlier years before later years")
    void testChronologicalSorting() {
        List<TimelineEventDto> events = new ArrayList<>(List.of(
            new TimelineEventDto("1", "Independence of India", "1947", "CE event", List.of()),
            new TimelineEventDto("2", "Battle of Hydaspes", "326 BCE", "BCE event", List.of()),
            new TimelineEventDto("3", "Mature Harappan Zenith", "2600 BCE", "Earlier BCE event", List.of()),
            new TimelineEventDto("4", "Panipat First Battle", "1526", "Medieval CE event", List.of())
        ));

        List<TimelineEventDto> sorted = timelineService.sortChronologically(events);

        assertEquals("Mature Harappan Zenith", sorted.get(0).title(), "2600 BCE must come first");
        assertEquals("Battle of Hydaspes", sorted.get(1).title(), "326 BCE must come second");
        assertEquals("Panipat First Battle", sorted.get(2).title(), "1526 CE must come third");
        assertEquals("Independence of India", sorted.get(3).title(), "1947 CE must come fourth");
    }

    @Test
    @DisplayName("Read-through cache: If 6+ events exist in DB, returns them directly without calling Gemini")
    void testReadThroughCacheHit() {
        List<TimelineEvent> dbEvents = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            dbEvents.add(new TimelineEvent(
                "id-" + i,
                "french-revolution",
                "Event " + i,
                String.valueOf(1789 + i),
                "Description for event " + i,
                List.of(new Source("Title", "url", "publisher"))
            ));
        }

        when(eventRepository.findByTopicIgnoreCase("french-revolution")).thenReturn(dbEvents);

        TimelineResponse response = timelineService.generateTimeline("French Revolution");

        assertNotNull(response);
        assertEquals(6, response.events().size());
        verify(eventRepository, times(1)).findByTopicIgnoreCase("french-revolution");
        verifyNoInteractions(geminiService);
    }

    @Test
    @DisplayName("Cache miss (<6 events in DB): Calls GeminiService outside transaction, validates, persists to DB, and returns sorted")
    void testCacheMissCallsGeminiAndPersists() {
        when(eventRepository.findByTopicIgnoreCase("space-race")).thenReturn(List.of());

        List<TimelineEventDto> geminiGenerated = List.of(
            new TimelineEventDto("g1", "Apollo 11 Landing", "1969", "Landed on moon.", List.of()),
            new TimelineEventDto("g2", "Sputnik 1 Launch", "1957", "First artificial satellite.", List.of()),
            new TimelineEventDto("g3", "Vostok 1 Flight", "1961", "First human in orbit.", List.of()),
            new TimelineEventDto("g4", "Mercury Friendship 7", "1962", "John Glenn orbit.", List.of()),
            new TimelineEventDto("g5", "Gemini 4 Spacewalk", "1965", "First US spacewalk.", List.of()),
            new TimelineEventDto("g6", "Apollo 8 Orbit", "1968", "Lunar orbit mission.", List.of())
        );

        TimelineResponse geminiResponse = new TimelineResponse(
            "space-race",
            "Chronology of the Cold War Space Race.",
            geminiGenerated
        );

        when(geminiService.fetchDiscoveredAndRankedEvents("space-race"))
            .thenReturn(Optional.of(geminiResponse));
        when(eventRepository.save(any(TimelineEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TimelineResponse result = timelineService.generateTimeline("Space Race");

        assertNotNull(result);
        assertEquals(6, result.events().size());
        assertEquals("Sputnik 1 Launch", result.events().get(0).title(), "1957 must be first");
        assertEquals("Apollo 11 Landing", result.events().get(5).title(), "1969 must be last");

        verify(eventRepository, atLeast(6)).save(any(TimelineEvent.class));
    }

    @Test
    @DisplayName("Read-only paths: getAllTimelines and getTimelineFromDb never interact with GeminiService")
    void testReadOnlyPathsNeverCallGemini() {
        when(eventRepository.findAll()).thenReturn(List.of(
            new TimelineEvent("id-1", "ancient-india", "Indus Valley", "2600 BCE", "Urban genesis", List.of())
        ));
        when(eventRepository.findByTopicIgnoreCase("ancient-india")).thenReturn(List.of(
            new TimelineEvent("id-1", "ancient-india", "Indus Valley", "2600 BCE", "Urban genesis", List.of())
        ));
        when(eventRepository.findByTopicIgnoreCase("non-existent-topic")).thenReturn(List.of());

        List<TimelineResponse> all = timelineService.getAllTimelines();
        assertEquals(1, all.size());

        Optional<TimelineResponse> found = timelineService.getTimelineFromDb("Ancient India");
        assertTrue(found.isPresent());

        Optional<TimelineResponse> notFound = timelineService.getTimelineFromDb("non-existent-topic");
        assertTrue(notFound.isEmpty());

        verifyNoInteractions(geminiService);
    }
}
