package com.example.ras.service;

import com.example.ras.api.GeminiApiClient;
import com.example.ras.model.RecommendationRequest;
import com.example.ras.model.RecommendationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

/**
 * Service Implementation managing the orchestration of recommendation requests.
 * Acts as the business logic coordinator between the REST Controller and the Gemini AI Client.
 */
@Service
public class RecommendationService {

    private static final Logger LOGGER = Logger.getLogger(RecommendationService.class.getName());
    private final GeminiApiClient geminiApiClient;

    @Autowired
    public RecommendationService(GeminiApiClient geminiApiClient) {
        this.geminiApiClient = geminiApiClient;
    }

    /**
     * Orchestrates recommendations by formatting user parameters and passing them to the Gemini model.
     * Maps to Step 2 & Step 3 of the System Architecture.
     *
     * @param request The requested category and filter conditions
     * @return Formatted list of suggestions parsed from the AI output
     */
    public List<RecommendationResponse> generateRecommendations(RecommendationRequest request) {
        LOGGER.info("Generating recommendations for category: " + request.getCategory());
        
        // Build a highly tailored prompt string matching the React layout
        String prompt = buildPrompt(request);
        
        try {
            // Forward formatted query to our external Gemini AI client
            return geminiApiClient.fetchRecommendationsFromAI(prompt);
        } catch (Exception e) {
            LOGGER.severe("Failed to retrieve suggestions from external API: " + e.getMessage());
            throw new RuntimeException("Error fetching AI suggestions", e);
        }
    }

    /**
     * Construct an exact prompt matching the structured JSON structure.
     */
    private String buildPrompt(RecommendationRequest request) {
        return String.format(
            "You are My RAS (Recommendation and Advice/Suggestion System).\n" +
            "Generate 5 highly customized suggestions for the category: \"%s\".\n" +
            "User Preferences: %s\n" +
            "User Profile: %s\n" +
            "Format the response strictly as a JSON array where each element contains: \n" +
            "id, title, description, tags (array), rating (1.0 to 5.0 score), matchReason (sentence explaining alignment), " +
            "and metadata (key-value text pairs).",
            request.getCategory(),
            request.getPreferences() != null ? request.getPreferences().toString() : "{}",
            request.getProfile() != null ? request.getProfile().toString() : "{}"
        );
    }
}
