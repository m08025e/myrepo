package com.example.ganttapi.dto;

import java.time.LocalDateTime;

// Getters, Setters, コンストラクタを Lombok @Data などで代替してもOK
public class ItemData {
    private String id;
    private String jobId;
    private String type;
    private String equipment;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String[] options; // オプション用の配列

    // 全フィールドを持つコンストラクタ
    public ItemData(String id, String jobId, String type, String equipment, LocalDateTime startTime, LocalDateTime endTime, String[] options) {
        this.id = id;
        this.jobId = jobId;
        this.type = type;
        this.equipment = equipment;
        this.startTime = startTime;
        this.endTime = endTime;
        this.options = options;
    }
    // optionsがない場合のコンストラクタ
    public ItemData(String id, String jobId, String type, String equipment, LocalDateTime startTime, LocalDateTime endTime) {
        this(id, jobId, type, equipment, startTime, endTime, null);
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getEquipment() { return equipment; }
    public void setEquipment(String equipment) { this.equipment = equipment; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String[] getOptions() { return options; }
    public void setOptions(String[] options) { this.options = options; }
}
