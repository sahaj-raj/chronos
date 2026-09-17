package com.chronicles.controller;

import com.chronicles.dto.TimelineDtos.*;
import com.chronicles.service.TimelineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class TimelineController {

    private final TimelineService timelineService;

    public TimelineController(TimelineService timelineService) {
        this.timelineService = timelineService;
    }

    /**
     * Pure read-only catalog endpoint.
     * Queries database only and never calls Gemini.
     */
    @GetMapping("/api/v1/timelines")
    public ResponseEntity<List<TimelineResponse>> getAllTimelines() {
        try {
            return ResponseEntity.ok(timelineService.getAllTimelines());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Pure read-only single timeline lookup.
     * Queries database only and returns 404 if not found. Never calls Gemini.
     */
    @GetMapping("/api/v1/timelines/{idOrSlug}")
    public ResponseEntity<?> getTimelineDetail(@PathVariable String idOrSlug) {
        try {
            Optional<TimelineResponse> timelineOpt = timelineService.getTimelineFromDb(idOrSlug);
            if (timelineOpt.isPresent()) {
                return ResponseEntity.ok(timelineOpt.get());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "Not Found",
                "message", "Timeline not found for: " + idOrSlug
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Server Error",
                "message", e.getMessage() != null ? e.getMessage() : "Unexpected error"
            ));
        }
    }

    /**
     * Synthesis endpoint: Only this endpoint triggers Gemini discovery & generation
     * when the database has fewer than 6 events for the topic.
     */
    @PostMapping(value = {"/api/v1/timelines/generate", "/api/timeline"})
    public ResponseEntity<?> generateTimeline(@RequestBody(required = false) TimelineRequest request) {
        try {
            String topic = (request != null && request.topic() != null && !request.topic().isBlank())
                    ? request.topic()
                    : "general-history";

            TimelineResponse response = timelineService.generateTimeline(topic);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Synthesis Failed",
                "message", e.getMessage() != null ? e.getMessage() : "Failed to synthesize timeline"
            ));
        }
    }
}
