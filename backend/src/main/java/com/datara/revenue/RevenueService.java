package com.datara.revenue;

import com.datara.common.DashboardTimeRange;
import com.datara.user.User;
import com.datara.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import com.datara.revenue.dto.RevenueRecordPageResponse;
import com.datara.revenue.dto.RevenueRecordTableResponse;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RevenueService {

    private static final int DEFAULT_PAGE_SIZE = 25;
    private static final int MAX_PAGE_SIZE = 100;

    private final RevenueRepository revenueRepository;
    private final UserRepository userRepository;

    @Transactional
    public RevenueRecord createForUser(Long userId, RevenueRecord revenueRecord) {
        User user = getUser(userId);
        revenueRecord.setUser(user);
        return revenueRepository.save(revenueRecord);
    }

    @Transactional(readOnly = true)
    public RevenueRecord findById(Long revenueRecordId) {
        return revenueRepository.findById(revenueRecordId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Revenue record not found: " + revenueRecordId
            ));
    }

    @Transactional(readOnly = true)
    public List<RevenueRecord> findByUserId(Long userId) {
        return revenueRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public RevenueRecordPageResponse findTableRecords(
        Long userId,
        int page,
        int size,
        String sortBy,
        String sortDirection,
        String search,
        RevenueStatus status,
        LocalDate startDate,
        LocalDate endDate,
        String range
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = normalizePageSize(size);
        String sortProperty = normalizeSortProperty(sortBy);
        String normalizedSearch = normalizeSearch(search);
        Sort.Direction direction = normalizeSortDirection(sortDirection);
        Sort sort = Sort.by(direction, sortProperty).and(Sort.by(Sort.Direction.DESC, "id"));

        // An explicit date-column filter from the grid always wins. Only fall
        // back to the saved dashboard range when the person hasn't set their
        // own date filter, so "Last 30 Days" acts as a default, not an
        // override of an active column filter.
        LocalDate effectiveStartDate = startDate;
        LocalDate effectiveEndDate = endDate;

        if (effectiveStartDate == null && effectiveEndDate == null) {
            DashboardTimeRange resolvedRange = DashboardTimeRange.fromParam(range);
            LocalDate today = LocalDate.now();
            effectiveStartDate = resolvedRange.startDate(today);
            effectiveEndDate = today;
        }

        Page<RevenueRecord> records = revenueRepository.findTableRecordsByUserId(
            userId,
            normalizedSearch,
            status,
            effectiveStartDate,
            effectiveEndDate,
            PageRequest.of(safePage, safeSize, sort)
        );

        return new RevenueRecordPageResponse(
            records.getContent().stream()
                .map(RevenueRecordTableResponse::from)
                .toList(),
            records.getTotalElements(),
            records.getNumber(),
            records.getSize(),
            records.getTotalPages()
        );
    }

    @Transactional
    public RevenueRecord update(Long revenueRecordId, RevenueRecord updates) {
        RevenueRecord existing = findById(revenueRecordId);
        existing.setCustomerName(updates.getCustomerName());
        existing.setAmount(updates.getAmount());
        existing.setStatus(updates.getStatus());
        existing.setDate(updates.getDate());
        return revenueRepository.save(existing);
    }

    @Transactional
    public void delete(Long revenueRecordId) {
        RevenueRecord existing = findById(revenueRecordId);
        revenueRepository.delete(existing);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
    }

    private int normalizePageSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String normalizeSortProperty(String sortBy) {
        if ("amount".equalsIgnoreCase(sortBy)) {
            return "amount";
        }
        if ("status".equalsIgnoreCase(sortBy)) {
            return "status";
        }
        return "date";
    }

    /**
     * Builds the full "%term%" LIKE pattern here in Java rather than via
     * concat() in the JPQL query. Real PostgreSQL can reject the query-side
     * concat(:search) form when :search is null - Hibernate sends the null
     * parameter as bytea instead of text in that context ("operator does not
     * exist: text ~~ bytea"), a mismatch H2 (used in dev) doesn't catch.
     * Passing the finished pattern (or null) avoids concat() entirely.
     */
    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return "%" + search.trim().toLowerCase() + "%";
    }

    private Sort.Direction normalizeSortDirection(String sortDirection) {
        return "asc".equalsIgnoreCase(sortDirection)
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
    }
}
