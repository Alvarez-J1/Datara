package com.datara.revenue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.datara.revenue.dto.RevenueRecordPageResponse;
import com.datara.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class RevenueServiceTest {

    @Mock
    private RevenueRepository revenueRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RevenueService revenueService;

    @Test
    void findTableRecordsReturnsDataGridCompatiblePage() {
        Long userId = 42L;
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 31);
        RevenueRecord record = RevenueRecord.builder()
            .id(100L)
            .customerName("Acme Co")
            .amount(new BigDecimal("1200.00"))
            .status(RevenueStatus.WON)
            .date(LocalDate.of(2026, 1, 15))
            .build();

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(revenueRepository.findTableRecordsByUserId(
            eq(userId),
            eq("acme"),
            eq(RevenueStatus.WON),
            eq(startDate),
            eq(endDate),
            pageableCaptor.capture()
        )).thenReturn(new PageImpl<>(
            List.of(record),
            PageRequest.of(1, 10),
            26
        ));

        RevenueRecordPageResponse response = revenueService.findTableRecords(
            userId,
            1,
            10,
            "amount",
            "asc",
            " acme ",
            RevenueStatus.WON,
            startDate,
            endDate,
            null
        );

        assertThat(response.rows()).hasSize(1);
        assertThat(response.rows().getFirst().id()).isEqualTo(100L);
        assertThat(response.rows().getFirst().customerName()).isEqualTo("Acme Co");
        assertThat(response.rows().getFirst().amount()).isEqualByComparingTo("1200.00");
        assertThat(response.rows().getFirst().status()).isEqualTo(RevenueStatus.WON);
        assertThat(response.rows().getFirst().date()).isEqualTo(LocalDate.of(2026, 1, 15));
        assertThat(response.rows().getFirst().region()).isEqualTo("APAC");
        assertThat(response.rows().getFirst().customerSegment()).isEqualTo("Startup");
        assertThat(response.rows().getFirst().accountOwner()).isEqualTo("Jordan Kim");
        assertThat(response.rowCount()).isEqualTo(26);
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(10);
        assertThat(response.totalPages()).isEqualTo(3);

        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(10);
        assertThat(pageable.getSort().getOrderFor("amount")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("amount").isAscending()).isTrue();
    }

    @Test
    void findTableRecordsDefaultsUnsafePagingAndSorting() {
        Long userId = 42L;
        // No explicit startDate/endDate and no range -> falls back to the
        // default range (LAST_12_MONTHS) as computed date bounds.
        LocalDate today = LocalDate.now();
        LocalDate expectedStart = today.minusMonths(12);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(revenueRepository.findTableRecordsByUserId(
            eq(userId),
            eq(null),
            eq(null),
            eq(expectedStart),
            eq(today),
            pageableCaptor.capture()
        )).thenReturn(new PageImpl<>(List.of()));

        revenueService.findTableRecords(
            userId,
            -4,
            1000,
            "customerName",
            "sideways",
            "",
            null,
            null,
            null,
            null
        );

        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(100);
        assertThat(pageable.getSort().getOrderFor("date")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("date").isDescending()).isTrue();
    }
}
