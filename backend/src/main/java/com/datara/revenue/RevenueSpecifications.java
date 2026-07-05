package com.datara.revenue;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Builds the Revenue Data table query as a JPA Specification instead of a
 * single JPQL string with "(:param is null or ...)" clauses.
 *
 * That pattern used to cause real PostgreSQL failures: every optional filter
 * (search, status, startDate, endDate) is only sometimes present, and
 * Postgres has to determine each bind parameter's type at prepare time,
 * before it knows the runtime value. An isolated "$n is null" check gives it
 * no type to infer from, so it either falls back to a bytea guess (the
 * earlier "operator does not exist: text ~~ bytea" error) or gives up
 * entirely ("could not determine data type of parameter $n"). Building the
 * predicate list in Java and only adding a clause when a filter is actually
 * present avoids ever emitting an ambiguous parameter in the first place.
 */
final class RevenueSpecifications {

    private RevenueSpecifications() {
    }

    static Specification<RevenueRecord> tableRecords(
        Long userId,
        String normalizedSearch,
        RevenueStatus status,
        LocalDate startDate,
        LocalDate endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (normalizedSearch != null) {
                predicates.add(cb.like(cb.lower(root.get("customerName")), normalizedSearch));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
