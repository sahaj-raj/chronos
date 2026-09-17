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
    @DisplayName("Validation: Discards entries missing title, date, or description, and discards duplicate titles")
    void testEventValidationRules() {
        List<TimelineEventDto> rawEvents = List.of(
            new TimelineEventDto("1", "Valid Milestone One",   "1789", "A valid milestone.",            List.of()),
            new TimelineEventDto("2", null,                    "1790", "Missing title.",                List.of()),
            new TimelineEventDto("3", "Missing Date",          "",     "Missing date.",                 List.of()),
            new TimelineEventDto("4", "Missing Desc",          "1792", null,                            List.of()),
            new TimelineEventDto("5", "Valid Milestone One",   "1793", "Duplicate title.",              List.of()),
            new TimelineEventDto("6", "Valid Milestone Two",   "1794", "A second valid entry.",         List.of()),
            new TimelineEventDto("7", "Valid Milestone Three", "1799", "A third valid entry.",          List.of())
        );

        List<TimelineEventDto> validated = timelineService.validateEvents(rawEvents);

        assertEquals(3, validated.size(), "Should keep only the 3 valid non-duplicate entries");
        assertEquals("Valid Milestone One",   validated.get(0).title());
        assertEquals("Valid Milestone Two",   validated.get(1).title());
        assertEquals("Valid Milestone Three", validated.get(2).title());
    }

    @Test
    @DisplayName("Chronological sorting: BCE events sort before CE, earlier years before later years")
    void testChronologicalSorting() {
        List<TimelineEventDto> events = new ArrayList<>(List.of(
            new TimelineEventDto("1", "Independence of India",  "1947",     "CE event",         List.of()),
            new TimelineEventDto("2", "Battle of Hydaspes",     "326 BCE",  "BCE event",        List.of()),
            new TimelineEventDto("3", "Mature Harappan Zenith", "2600 BCE", "Earlier BCE event",List.of()),
            new TimelineEventDto("4", "Panipat First Battle",   "1526",     "Medieval CE event",List.of())
        ));

        List<TimelineEventDto> sorted = timelineService.sortChronologically(events);

        assertEquals("Mature Harappan Zenith", sorted.get(0).title(), "2600 BCE must come first");
        assertEquals("Battle of Hydaspes",     sorted.get(1).title(), "326 BCE must come second");
        assertEquals("Panipat First Battle",   sorted.get(2).title(), "1526 CE must come third");
        assertEquals("Independence of India",  sorted.get(3).title(), "1947 CE must come fourth");
    }

    // =========================================================================
    // NEW: Chronological ordering invariant tests
    // =========================================================================

    @Test
    @DisplayName("extractYear: 'Month Day, Year' format returns the YEAR, not the day-of-month")
    void testExtractYearMonthDayYearFormat() {
        // THE CORE BUG: old regex (-?\d{1,4}) matched '3' from "November 3, 2017" instead of 2017
        assertEquals(2017, timelineService.extractYear("November 3, 2017"),  "must return 2017, not 3");
        assertEquals(2011, timelineService.extractYear("October 4, 2011"),   "must return 2011, not 4");
        assertEquals(2007, timelineService.extractYear("January 9, 2007"),   "must return 2007, not 9");
        assertEquals(2008, timelineService.extractYear("July 10, 2008"),     "must return 2008, not 10");
        assertEquals(2013, timelineService.extractYear("September 20, 2013"),"must return 2013, not 20");
        assertEquals(2010, timelineService.extractYear("June 24, 2010"),     "must return 2010, not 24");
    }

    @Test
    @DisplayName("extractYear: Plain 4-digit CE years parse correctly")
    void testExtractYearPlainCe() {
        assertEquals(1789, timelineService.extractYear("1789"));
        assertEquals(1945, timelineService.extractYear("1945"));
        assertEquals(2024, timelineService.extractYear("2024"));
    }

    @Test
    @DisplayName("extractYear: BCE dates return negative values")
    void testExtractYearBce() {
        assertEquals(-3300, timelineService.extractYear("3300 BCE"));
        assertEquals(-2600, timelineService.extractYear("2600 BCE"));
        assertEquals(-326,  timelineService.extractYear("326 BCE"));
        assertEquals(-44,   timelineService.extractYear("44 BCE"));
        assertEquals(-250,  timelineService.extractYear("c. 250 BCE"));
    }

    @Test
    @DisplayName("extractYear: Date ranges return the START year")
    void testExtractYearDateRange() {
        assertEquals(1914, timelineService.extractYear("1914-1918"),  "range must use start year");
        assertEquals(1939, timelineService.extractYear("1939–1945"),  "range must use start year");
    }

    @Test
    @DisplayName("extractYear: ISO-style dates (YYYY-MM-DD) return the year correctly")
    void testExtractYearIsoDates() {
        assertEquals(2017, timelineService.extractYear("2017-11-03"));
        assertEquals(2008, timelineService.extractYear("2008-07-10"));
    }

    @Test
    @DisplayName("Sort: 'Month Day, Year' events ordered oldest→newest by year, not by day-of-month")
    void testChronologicalSortMonthDayYearFormat() {
        // Reproduces the exact bug from the screenshot: sorted by day (3,4,9,10,20,24) not year
        List<TimelineEventDto> events = new ArrayList<>(List.of(
            new TimelineEventDto("1", "iPhone X",              "November 3, 2017",    "iPhoneX.",    List.of()),
            new TimelineEventDto("2", "Introduction of Siri",  "October 4, 2011",     "Siri.",       List.of()),
            new TimelineEventDto("3", "First iPhone",          "January 9, 2007",     "1st iPhone.", List.of()),
            new TimelineEventDto("4", "App Store Launch",      "July 10, 2008",       "AppStore.",   List.of()),
            new TimelineEventDto("5", "iPhone 5s Touch ID",    "September 20, 2013",  "5s.",         List.of()),
            new TimelineEventDto("6", "iPhone 4",              "June 24, 2010",       "iPhone 4.",   List.of())
        ));

        List<TimelineEventDto> sorted = timelineService.sortChronologically(events);

        assertEquals("First iPhone",          sorted.get(0).title(), "2007 must be first");
        assertEquals("App Store Launch",      sorted.get(1).title(), "2008 must be second");
        assertEquals("iPhone 4",              sorted.get(2).title(), "2010 must be third");
        assertEquals("Introduction of Siri",  sorted.get(3).title(), "2011 must be fourth");
        assertEquals("iPhone 5s Touch ID",    sorted.get(4).title(), "2013 must be fifth");
        assertEquals("iPhone X",              sorted.get(5).title(), "2017 must be last");
    }

    @Test
    @DisplayName("Sort: BCE → CE ordering across era boundary")
    void testChronologicalSortBceToCe() {
        List<TimelineEventDto> events = new ArrayList<>(List.of(
            new TimelineEventDto("1", "Roman Empire Founded", "27 BCE", "Augustus.", List.of()),
            new TimelineEventDto("2", "Fall of Western Rome", "476",    "476 CE.",   List.of()),
            new TimelineEventDto("3", "Alexander's Conquests","326 BCE","Alexander.",List.of()),
            new TimelineEventDto("4", "Birth of Christ",      "1 BCE",  "Year 1.",   List.of())
        ));

        List<TimelineEventDto> sorted = timelineService.sortChronologically(events);

        assertEquals("Alexander's Conquests", sorted.get(0).title(), "326 BCE first");
        assertEquals("Roman Empire Founded",  sorted.get(1).title(), "27 BCE second");
        assertEquals("Birth of Christ",       sorted.get(2).title(), "1 BCE third");
        assertEquals("Fall of Western Rome",  sorted.get(3).title(), "476 CE last");
    }

    @Test
    @DisplayName("Sort: same-year events ordered by month, then by day")
    void testChronologicalSortSameYearByMonthDay() {
        List<TimelineEventDto> events = new ArrayList<>(List.of(
            new TimelineEventDto("1", "November Event", "November 10, 1918", "End WW1.",  List.of()),
            new TimelineEventDto("2", "July Event",     "July 4, 1918",      "Mid year.", List.of()),
            new TimelineEventDto("3", "January Event",  "January 1, 1918",   "New Year.", List.of()),
            new TimelineEventDto("4", "March Event",    "March 21, 1918",    "Spring.",   List.of())
        ));

        List<TimelineEventDto> sorted = timelineService.sortChronologically(events);

        assertEquals("January Event",  sorted.get(0).title(), "January must be first");
        assertEquals("March Event",    sorted.get(1).title(), "March must be second");
        assertEquals("July Event",     sorted.get(2).title(), "July must be third");
        assertEquals("November Event", sorted.get(3).title(), "November must be last");
    }

    @Test
    @DisplayName("Read-through cache: If 6+ events exist in DB, returns them directly without calling Gemini")
    void testReadThroughCacheHit() {
        List<TimelineEvent> dbEvents = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            dbEvents.add(new TimelineEvent(
                "id-" + i, "french-revolution", "Event " + i,
                String.valueOf(1789 + i), "Description for event " + i,
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
    @DisplayName("Cache miss (<6 events): Calls Gemini, validates, persists, and returns chronologically sorted")
    void testCacheMissCallsGeminiAndPersists() {
        when(eventRepository.findByTopicIgnoreCase("space-race")).thenReturn(List.of());

        List<TimelineEventDto> geminiGenerated = List.of(
            new TimelineEventDto("g1", "Apollo 11 Landing",   "1969", "Landed on moon.",           List.of()),
            new TimelineEventDto("g2", "Sputnik 1 Launch",    "1957", "First artificial satellite.",List.of()),
            new TimelineEventDto("g3", "Vostok 1 Flight",     "1961", "First human in orbit.",     List.of()),
            new TimelineEventDto("g4", "Mercury Friendship 7","1962", "John Glenn orbit.",         List.of()),
            new TimelineEventDto("g5", "Gemini 4 Spacewalk",  "1965", "First US spacewalk.",       List.of()),
            new TimelineEventDto("g6", "Apollo 8 Orbit",      "1968", "Lunar orbit mission.",      List.of())
        );

        when(geminiService.fetchDiscoveredAndRankedEvents("space-race"))
            .thenReturn(Optional.of(new TimelineResponse("space-race",
                "Chronology of the Cold War Space Race.", geminiGenerated)));
        when(eventRepository.save(any(TimelineEvent.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        TimelineResponse result = timelineService.generateTimeline("Space Race");

        assertNotNull(result);
        assertEquals(6, result.events().size());
        assertEquals("Sputnik 1 Launch",   result.events().get(0).title(), "1957 must be first");
        assertEquals("Apollo 11 Landing",  result.events().get(5).title(), "1969 must be last");
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
