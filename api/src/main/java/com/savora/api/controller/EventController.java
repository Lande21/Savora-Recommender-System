package com.savora.api.controller;

import com.savora.api.model.Event;
import com.savora.api.service.KafkaProducerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EventController {

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @PostMapping
    public ResponseEntity<?> trackEvent(@RequestBody Event event) {
        try {
            System.out.println("Received event: " + event);
            kafkaProducerService.sendEvent(event);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error processing event: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to process event: " + e.getMessage());
        }
    }
}