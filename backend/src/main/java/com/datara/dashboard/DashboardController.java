package com.datara.dashboard;

import com.datara.common.DashboardTimeRange;
import com.datara.dashboard.dto.DashboardPanelsResponse;
import com.datara.dashboard.dto.DashboardSummaryResponse;
import com.datara.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return dashboardService.getSummary(principal.getId(), DashboardTimeRange.fromParam(range));
    }

    @GetMapping("/panels")
    public DashboardPanelsResponse panels(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return dashboardService.getPanels(principal.getId(), DashboardTimeRange.fromParam(range));
    }
}
