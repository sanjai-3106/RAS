package com.example.ras.controller;

import com.example.ras.model.RecommendationRequest;
import com.example.ras.model.RecommendationResponse;
import com.example.ras.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for My RAS (Recommendation and Advice/Suggestion System).
 * Maps incoming HTTP requests from the React Frontend to the Recommendation Service.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allows communication from Vite Frontend in local dev
public class RasController {

    private final RecommendationService recommendationService;

    @Autowired
    public RasController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    /**
     * Get tailored recommendations based on category and preferences.
     * Maps to Step 1 & Step 4 of the System Architecture.
     * 
     * @param request Payload containing category, preferences, and profile context
     * @return List of suggestions tailored to the user's inputs
     */
    @PostMapping("/recommendations")
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(
            @RequestBody RecommendationRequest request) {
        
        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            List<RecommendationResponse> recommendations = recommendationService.generateRecommendations(request);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
