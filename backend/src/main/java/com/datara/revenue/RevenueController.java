package com.datara.revenue;

import com.datara.revenue.dto.RevenueRecordPageResponse;
import com.datara.security.UserPrincipal;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/revenue-records")
@RequiredArgsConstructor
public class RevenueController {

    private final RevenueService revenueService;

    @GetMapping
    public RevenueRecordPageResponse listRevenueRecords(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int size,
        @RequestParam(defaultValue = "date") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDirection,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) RevenueStatus status,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate startDate,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate endDate,
        @RequestParam(required = false) String range
    ) {
        return revenueService.findTableRecords(
            principal.getId(),
            page,
            size,
            sortBy,
            sortDirection,
            search,
            status,
            startDate,
            endDate,
            range
        );
    }
}
