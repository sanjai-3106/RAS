export interface JavaFile {
  name: string;
  path: string;
  description: string;
  code: string;
}

export const JAVA_SOURCE_FILES: JavaFile[] = [
  {
    name: "RasController.java",
    path: "src/main/java/com/example/ras/controller/RasController.java",
    description: "Spring Boot RestController mapping endpoints and routing incoming user request parameters.",
    code: `package com.example.ras.controller;

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
}`
  },
  {
    name: "RecommendationService.java",
    path: "src/main/java/com/example/ras/service/RecommendationService.java",
    description: "Spring Service executing coordinate logic and formatting instruction prompts for the LLM client.",
    code: `package com.example.ras.service;

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
        String languageInstruction = "";
        if ("movies".equalsIgnoreCase(request.getCategory()) || "music".equalsIgnoreCase(request.getCategory())) {
            languageInstruction = "CRITICAL: Unless explicitly requested otherwise, prioritize and heavily feature Tamil movies and Tamil music suggestions!\\n";
        }

        return String.format(
            "You are My RAS (Recommendation and Advice/Suggestion System).\\n" +
            "Generate 5 highly customized suggestions for the category: \\\"%s\\\".\\n" +
            "User Preferences: %s\\n" +
            "User Profile: %s\\n" +
            languageInstruction +
            "Format the response strictly as a JSON array where each element contains: \\n" +
            "id, title, description, tags (array), rating (1.0 to 5.0 score), matchReason (sentence explaining alignment), " +
            "and metadata (key-value text pairs).",
            request.getCategory(),
            request.getPreferences() != null ? request.getPreferences().toString() : "{}",
            request.getProfile() != null ? request.getProfile().toString() : "{}"
        );
    }
}`
  },
  {
    name: "GeminiApiClient.java",
    path: "src/main/java/com/example/ras/api/GeminiApiClient.java",
    description: "Java Client invoking Google Generative Language endpoints via HTTP POST with JSON structures.",
    code: `package com.example.ras.api;

import com.example.ras.model.RecommendationResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

/**
 * API client responsible for executing actual HTTP calls to Google Gemini AI API.
 * Uses Java 11 HttpClient and Jackson to format requests and extract recommendations.
 * Maps to Step 2 and Step 3 of the System Architecture.
 */
@Component
public class GeminiApiClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("\${gemini.api.key:}")
    private String apiKey;

    public GeminiApiClient() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Executes POST request to Google Gemini API and parses the returned JSON list of recommendations.
     *
     * @param prompt The system and user preference instruction set
     * @return List of parsed RecommendationResponse items
     */
    public List<RecommendationResponse> fetchRecommendationsFromAI(String prompt) throws Exception {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = System.getenv("GEMINI_API_KEY");
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY configuration is missing!");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String payloadJson = "{"
            + "\\\"contents\\\": [{"
            + "  \\\"parts\\\": [{\\\"text\\\": \\\"" + escapeJsonString(prompt) + "\\\"}]"
            + "}],"
            + "\\\"generationConfig\\\": {"
            + "  \\\"responseMimeType\\\": \\\"application/json\\\""
            + "}"
            + "}";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() != 200) {
            throw new RuntimeException("Gemini API call failed with status: " + httpResponse.statusCode() + ". Body: " + httpResponse.body());
        }

        return parseGeminiResponse(httpResponse.body());
    }

    private List<RecommendationResponse> parseGeminiResponse(String rawBody) throws Exception {
        JsonNode rootNode = objectMapper.readTree(rawBody);
        JsonNode textNode = rootNode.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text");

        if (textNode.isMissingNode()) {
            throw new IllegalArgumentException("No text candidate found in Gemini response");
        }

        String jsonText = textNode.asText().trim();
        return objectMapper.readValue(jsonText, new TypeReference<List<RecommendationResponse>>() {});
    }

    private String escapeJsonString(String text) {
        if (text == null) return "";
        return text.replace("\\\\", "\\\\\\\\")
                   .replace("\\\"", "\\\\\\\"")
                   .replace("\\b", "\\\\b")
                   .replace("\\f", "\\\\f")
                   .replace("\\n", "\\\\n")
                   .replace("\\r", "\\\\r")
                   .replace("\\t", "\\\\t");
    }
}`
  },
  {
    name: "RecommendationRequest.java",
    path: "src/main/java/com/example/ras/model/RecommendationRequest.java",
    description: "Input Request Payload structure matching Controller's JSON parameters.",
    code: `package com.example.ras.model;

import java.util.Map;

/**
 * Data Transfer Object (DTO) for client recommendation requests.
 */
public class RecommendationRequest {

    private String category;
    private Map<String, Object> preferences;
    private Map<String, Object> profile;

    public RecommendationRequest() {}

    public RecommendationRequest(String category, Map<String, Object> preferences, Map<String, Object> profile) {
        this.category = category;
        this.preferences = preferences;
        this.profile = profile;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Map<String, Object> getPreferences() { return preferences; }
    public void setPreferences(Map<String, Object> preferences) { this.preferences = preferences; }

    public Map<String, Object> getProfile() { return profile; }
    public void setProfile(Map<String, Object> profile) { this.profile = profile; }
}`
  },
  {
    name: "RecommendationResponse.java",
    path: "src/main/java/com/example/ras/model/RecommendationResponse.java",
    description: "Output Response DTO structure containing title, tags, rating and dynamic metadata.",
    code: `package com.example.ras.model;

import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object (DTO) representing a single structured recommendation.
 */
public class RecommendationResponse {

    private String id;
    private String title;
    private String description;
    private List<String> tags;
    private double rating;
    private String matchReason;
    private Map<String, String> metadata;

    public RecommendationResponse() {}

    public RecommendationResponse(String id, String title, String description, List<String> tags, 
                                  double rating, String matchReason, Map<String, String> metadata) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.tags = tags;
        this.rating = rating;
        this.matchReason = matchReason;
        this.metadata = metadata;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getMatchReason() { return matchReason; }
    public void setMatchReason(String matchReason) { this.matchReason = matchReason; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
}`
  }
];
