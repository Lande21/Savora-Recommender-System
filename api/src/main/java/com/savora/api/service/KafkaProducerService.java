package com.savora.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.savora.api.model.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    private static final String TOPIC = "user-events";

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;

    public void sendEvent(Event event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            System.out.println("Sending event to Kafka: " + eventJson);
            
            // Use eventType as key for partitioning
            String key = event.getEventType();
            kafkaTemplate.send(TOPIC, key, eventJson)
                .addCallback(
                    result -> System.out.println("Event sent successfully to " + TOPIC + ": " + eventJson),
                    ex -> System.err.println("Failed to send event to Kafka: " + ex.getMessage())
                );
        } catch (Exception e) {
            System.err.println("Error serializing event: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send event to Kafka", e);
        }
    }
}