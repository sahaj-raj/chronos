package com.chronicles.dto;

import com.chronicles.model.Source;
import com.chronicles.model.TimelineEvent;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Shared compiled patterns for chronological year extraction
final class DatePatterns {
    /** Matches a 4-digit year (e.g. 2017, 1789, 3300). Used first to avoid
     *  matching day-of-month in strings like "November 3, 2017". */
    static final Pattern FOUR_DIGIT_YEAR = Pattern.compile("(\\d{4})");
    /** Matches 1-3 digit numbers for ancient short years (250 BCE, 44 BCE). */
    static final Pattern SHORT_YEAR      = Pattern.compile("(\\d{1,3})");
    private DatePatterns() {}
}

public class TimelineDtos {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TimelineRequest(
        @JsonProperty("topic") String topic,
        @JsonProperty("query") String query
    ) {
        public String effectiveTopic() {
            if (topic != null && !topic.isBlank()) return topic.trim();
            if (query != null && !query.isBlank()) return query.trim();
            return "general-history";
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SourceDto(
        String title,
        String url,
        String publisher
    ) {
        public static SourceDto fromModel(Source source) {
            if (source == null) return null;
            return new SourceDto(source.getTitle(), source.getUrl(), source.getPublisher());
        }

        public Source toModel() {
            return new Source(title, url, publisher);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TimelineEventDto(
        String id,
        String title,
        String date,
        String description,
        List<SourceDto> sources,
        String displayDate,
        Integer year
    ) {
        public TimelineEventDto(String id, String title, String date, String description, List<SourceDto> sources) {
            this(
                id != null ? id : UUID.randomUUID().toString(),
                title,
                date,
                description,
                sources != null ? sources : List.of(),
                date,
                extractYear(date)
            );
        }

        /**
         * Extracts a signed chronological year from a date string.
         * Negative = BCE/BC, Positive = CE/AD.
         *
         * Strategy:
         *  1. Look for a 4-digit year first (e.g. 2017, 1789, 3300).
         *     This prevents matching day-of-month from dates like
         *     "November 3, 2017" (should return 2017, not 3).
         *  2. Fall back to 1-3 digit numbers for ancient short years
         *     such as "250 BCE", "c. 44 BCE", "9 AD".
         */
        public static int extractYear(String dateStr) {
            if (dateStr == null || dateStr.isBlank()) return 0;
            try {
                String upper = dateStr.toUpperCase();
                boolean isBce = upper.contains("BCE") || upper.contains("BC");
                // Prefer 4-digit year: avoids matching day from "November 3, 2017"
                Matcher m4 = DatePatterns.FOUR_DIGIT_YEAR.matcher(dateStr);
                if (m4.find()) {
                    int y = Integer.parseInt(m4.group(1));
                    return isBce ? -Math.abs(y) : y;
                }
                // Short ancient years: "250 BCE", "c. 44 BCE"
                Matcher m = DatePatterns.SHORT_YEAR.matcher(dateStr);
                if (m.find()) {
                    int y = Integer.parseInt(m.group(1));
                    return isBce ? -Math.abs(y) : y;
                }
            } catch (Exception ignored) {}
            return 0;
        }

        public static TimelineEventDto fromModel(TimelineEvent entity) {
            if (entity == null) return null;
            List<SourceDto> srcDtos = entity.getSources() != null
                    ? entity.getSources().stream().map(SourceDto::fromModel).toList()
                    : List.of();
            return new TimelineEventDto(
                    entity.getId(),
                    entity.getTitle(),
                    entity.getDate(),
                    entity.getDescription(),
                    srcDtos
            );
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TimelineResponse(
        String id,
        String slug,
        String title,
        String topic,
        String description,
        List<TimelineEventDto> events
    ) {
        public TimelineResponse(String topic, String description, List<TimelineEventDto> events) {
            this(
                UUID.randomUUID().toString(),
                topic != null ? topic.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "") : "timeline",
                topic != null ? formatTitle(topic) : "Historical Timeline",
                topic,
                description,
                events != null ? events : List.of()
            );
        }

        private static String formatTitle(String raw) {
            if (raw == null || raw.isBlank()) return "Historical Timeline";
            String[] words = raw.replace("-", " ").trim().split("\\s+");
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty()) {
                    sb.append(Character.toUpperCase(w.charAt(0)));
                    if (w.length() > 1) {
                        sb.append(w.substring(1).toLowerCase());
                    }
                    sb.append(" ");
                }
            }
            return sb.toString().trim();
        }
    }
}
