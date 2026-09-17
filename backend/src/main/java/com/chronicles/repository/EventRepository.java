package com.chronicles.repository;

import com.chronicles.model.TimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<TimelineEvent, String> {
    List<TimelineEvent> findByTopicIgnoreCase(String topic);
}