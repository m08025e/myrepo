package com.example.ganttapi.controller;

import com.example.ganttapi.dto.ItemData;
import com.example.ganttapi.dto.LinkData;
import com.example.ganttapi.dto.ScheduleResponse;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.List;

@RestController
public class ScheduleController {

    // @CrossOrigin はローカル開発でHTMLからAPIを呼び出す際にCORSエラーを防ぐために付与します
    @CrossOrigin(origins = "*") 
    @GetMapping("/api/schedule")
    public ScheduleResponse getScheduleData() {
        // 本来はここでデータベース等からデータを取得します
        List<String> equipment = List.of("設備A", "設備B", "設備C");

        List<ItemData> items = List.of(
            new ItemData("J1-main", "Job1", "main", "設備A", LocalDateTime.parse("2025-09-26T09:20:00"), LocalDateTime.parse("2025-09-26T10:00:00"), new String[]{"A"}),
            new ItemData("J1-in", "Job1", "port-in", "設備A", LocalDateTime.parse("2025-09-26T09:00:00"), LocalDateTime.parse("2025-09-26T09:05:00")),
            new ItemData("J1-pre", "Job1", "pre", "設備A", LocalDateTime.parse("2025-09-26T09:05:00"), LocalDateTime.parse("2025-09-26T09:20:00")),
            new ItemData("J1-post", "Job1", "post", "設備A", LocalDateTime.parse("2025-09-26T10:00:00"), LocalDateTime.parse("2025-09-26T10:10:00")),
            new ItemData("J1-out", "Job1", "port-out", "設備A", LocalDateTime.parse("2025-09-26T10:10:00"), LocalDateTime.parse("2025-09-26T10:15:00")),
            new ItemData("J2-main", "Job2", "main", "設備B", LocalDateTime.parse("2025-09-26T10:45:00"), LocalDateTime.parse("2025-09-26T11:45:00"), new String[]{"B"}),
            new ItemData("J2-in", "Job2", "port-in", "設備B", LocalDateTime.parse("2025-09-26T10:30:00"), LocalDateTime.parse("2025-09-26T10:35:00")),
            new ItemData("J2-pre", "Job2", "pre", "設備B", LocalDateTime.parse("2025-09-26T10:35:00"), LocalDateTime.parse("2025-09-26T10:45:00")),
            new ItemData("J2-post", "Job2", "post", "設備B", LocalDateTime.parse("2025-09-26T11:45:00"), LocalDateTime.parse("2025-09-26T11:55:00")),
            new ItemData("J2-out", "Job2", "port-out", "設備B", LocalDateTime.parse("2025-09-26T11:55:00"), LocalDateTime.parse("2025-09-26T12:00:00")),
            new ItemData("J3-main", "Job3", "main", "設備C", LocalDateTime.parse("2025-09-26T11:15:00"), LocalDateTime.parse("2025-09-26T12:30:00")),
            new ItemData("J3-in", "Job3", "port-in", "設備C", LocalDateTime.parse("2025-09-26T11:00:00"), LocalDateTime.parse("2025-09-26T11:05:00")),
            new ItemData("J3-pre", "Job3", "pre", "設備C", LocalDateTime.parse("2025-09-26T11:05:00"), LocalDateTime.parse("2025-09-26T11:15:00")),
            new ItemData("J3-post", "Job3", "post", "設備C", LocalDateTime.parse("2025-09-26T12:30:00"), LocalDateTime.parse("2025-09-26T12:40:00")),
            new ItemData("J3-out", "Job3", "port-out", "設備C", LocalDateTime.parse("2025-09-26T12:40:00"), LocalDateTime.parse("2025-09-26T12:45:00"))
        );

        List<LinkData> links = List.of(
            new LinkData("J1-out", "J2-in"),
            new LinkData("J2-out", "J3-in")
        );

        ScheduleResponse response = new ScheduleResponse();
        response.setEquipment(equipment);
        response.setChartItems(items);
        response.setLinks(links);

        return response;
    }
}
