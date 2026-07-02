package com.example.ras.api;

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

    @Value("${gemini.api.key:}")
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
            // Retrieve key from environment variable fallback if not injected by Spring config
            apiKey = System.getenv("GEMINI_API_KEY");
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY configuration is missing!");
        }

        // Endpoint for Gemini 3.5 Flash or Gemini 1.5 Flash Content Generation
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        // Build request payload conforming to Google GenAI structure
        String payloadJson = "{"
            + "\"contents\": [{"
            + "  \"parts\": [{\"text\": \"" + escapeJsonString(prompt) + "\"}]"
            + "}],"
            + "\"generationConfig\": {"
            + "  \"responseMimeType\": \"application/json\""
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

    /**
     * Parse the raw nested Google GenAI API response to extract the structured recommendations array.
     */
    private List<RecommendationResponse> parseGeminiResponse(String rawBody) throws Exception {
        JsonNode rootNode = objectMapper.readTree(rawBody);
        
        // Google GenAI path: candidates[0].content.parts[0].text
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
        
        // Deserialize the embedded JSON list into a list of RecommendationResponse objects
        return objectMapper.readValue(jsonText, new TypeReference<List<RecommendationResponse>>() {});
    }

    private String escapeJsonString(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\b", "\\b")
                   .replace("\f", "\\f")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
