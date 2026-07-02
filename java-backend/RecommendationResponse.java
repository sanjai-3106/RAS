package com.example.ras.model;

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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public String getMatchReason() {
        return matchReason;
    }

    public void setMatchReason(String matchReason) {
        this.matchReason = matchReason;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }
}
