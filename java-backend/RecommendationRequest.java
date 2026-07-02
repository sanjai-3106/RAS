package com.example.ras.model;

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Map<String, Object> getPreferences() {
        return preferences;
    }

    public void setPreferences(Map<String, Object> preferences) {
        this.preferences = preferences;
    }

    public Map<String, Object> getProfile() {
        return profile;
    }

    public void setProfile(Map<String, Object> profile) {
        this.profile = profile;
    }
}
