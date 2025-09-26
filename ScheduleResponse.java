package com.example.ganttapi.dto;

import java.util.List;

public class ScheduleResponse {
    private List<ItemData> chartItems;
    private List<LinkData> links;
    private List<String> equipment;

    // Getters & Setters
    public List<ItemData> getChartItems() { return chartItems; }
    public void setChartItems(List<ItemData> chartItems) { this.chartItems = chartItems; }
    public List<LinkData> getLinks() { return links; }
    public void setLinks(List<LinkData> links) { this.links = links; }
    public List<String> getEquipment() { return equipment; }
    public void setEquipment(List<String> equipment) { this.equipment = equipment; }
}
