package com.chronicles.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "timeline_events")
public class TimelineEvent {

    @Id
    private String id;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String title;

    @Column(name = "event_date", nullable = false)
    private String date;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_sources", joinColumns = @JoinColumn(name = "event_id"))
    private List<Source> sources = new ArrayList<>();

    public TimelineEvent() {
        this.id = UUID.randomUUID().toString();
    }

    public TimelineEvent(String id, String topic, String title, String date, String description, List<Source> sources) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.topic = topic;
        this.title = title;
        this.date = date;
        this.description = description;
        this.sources = sources != null ? sources : new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Source> getSources() {
        return sources;
    }

    public void setSources(List<Source> sources) {
        this.sources = sources;
    }
}
