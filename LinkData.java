package com.example.ganttapi.dto;

public class LinkData {
    private String source;
    private String target;

    public LinkData(String source, String target) {
        this.source = source;
        this.target = target;
    }

    // Getters & Setters
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
}
