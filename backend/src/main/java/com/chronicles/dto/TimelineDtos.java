package com.chronicles.dto;

import com.chronicles.model.Source;
import com.chronicles.model.TimelineEvent;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TimelineDtos {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TimelineRequest(
        @JsonAlias({"query", "q"})
        String topic
    ) {}

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

        public static int extractYear(String dateStr) {
            if (dateStr == null || dateStr.isBlank()) return 0;
            try {
                Matcher m = Pattern.compile("(-?\\d{1,4})").matcher(dateStr);
                if (m.find()) {
                    int y = Integer.parseInt(m.group(1));
                    if (dateStr.toUpperCase().contains("BCE") || dateStr.toUpperCase().contains("BC")) {
                        return -Math.abs(y);
                    }
                    return y;
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
