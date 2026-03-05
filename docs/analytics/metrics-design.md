---
id: metrics-design
title: Metrics Design Principles
displayText: How to design reliable and consistent business metrics
tags: [analytics,metrics,data]
---

# Metrics Design Principles

Well-designed metrics are the foundation of reliable analytics. This document defines principles and patterns for creating **consistent, trustworthy, and maintainable** business metrics.

---

## Why Metrics Design Matters

Poorly defined metrics lead to:

- Conflicting numbers across reports
- Loss of stakeholder trust
- Wasted engineering time on reconciliation
- Incorrect business decisions

Good metrics design provides:

- Single source of truth
- Consistent definitions across tools
- Reproducible and auditable results

---

## Core Principles

### 1. Define Before You Build

Every metric must have a documented definition before implementation:

- **Business question**: What decision does this metric support?
- **Formula**: Exact calculation logic
- **Grain**: What does one row represent?
- **Filters**: What data is included or excluded?
- **Owner**: Who is responsible for this metric?

---

### 2. Agree on Grain

The grain defines what a single row in the metric represents.

| Metric | Grain |
| ------ | ----- |
| Daily Active Users | One row per user per day |
| Monthly Revenue | One row per month |
| Order Count | One row per order |

Mismatched grain is the most common source of incorrect numbers.

---

### 3. Distinguish Measures from Dimensions

| Concept | Description | Example |
| ------- | ----------- | ------- |
| **Measure** | Numeric, aggregatable value | Revenue, Order Count |
| **Dimension** | Categorical attribute for slicing | Country, Product, Channel |

Measures must be clearly defined with their aggregation function (`SUM`, `COUNT DISTINCT`, `AVG`).

---

### 4. Avoid Derived Metrics in Source Layers

Derived metrics (ratios, rates, percentages) should be computed at the reporting layer, not stored in mart tables.

Preferred pattern:

```sql
-- Mart table: store numerator and denominator
revenue_gross,
revenue_net,
order_count

-- BI tool: compute ratio
revenue_net / revenue_gross AS net_margin
```

This allows flexible aggregation without incorrect ratio averaging.

---

### 5. Define Time Dimensions Explicitly

Every metric must specify which timestamp drives its time dimension:

- `event_time`: When the event occurred
- `created_at`: When the record was created
- `processed_at`: When the ETL loaded it

Mixing these is a leading cause of reporting discrepancies.

---

## Metric Lifecycle

```
Define → Implement → Validate → Publish → Monitor → Deprecate
```

- **Define**: Write definition document, get stakeholder sign-off
- **Implement**: Build in dbt mart layer
- **Validate**: Compare against known source of truth
- **Publish**: Register in semantic layer or BI tool
- **Monitor**: Set up freshness and volume checks
- **Deprecate**: Remove with migration plan, never silently delete

---

## Naming Conventions

| Pattern | Example |
| ------- | ------- |
| `{entity}_{measure}` | `order_revenue`, `user_count` |
| `{entity}_{measure}_{modifier}` | `order_revenue_gross`, `user_count_active` |
| `{entity}_{measure}_{period}` | `user_count_daily`, `revenue_monthly` |

- Use snake_case
- Be explicit over brief
- Avoid abbreviations unless universally understood

---

## Common Anti-Patterns

### Soft-Deleted Records Not Filtered

```sql
-- Wrong: includes cancelled orders
select count(*) from fct_orders

-- Correct: filter explicitly
select count(*) from fct_orders where status != 'cancelled'
```

---

### NULL Handling

Always handle NULLs explicitly:

```sql
-- Risky: NULLs silently excluded from COUNT
count(revenue)

-- Explicit: document the intent
count(revenue) as revenue_non_null_count,
count(*) as total_row_count
```

---

### Ambiguous Date Filters

```sql
-- Wrong: unclear which date column
where date = current_date

-- Correct: explicit column
where event_date = current_date
```

---

## Validation Checklist

Before publishing a metric:

- [ ] Definition is written and approved
- [ ] Grain is documented
- [ ] Tested against at least one known-good reference
- [ ] NULL handling is explicit
- [ ] Time dimension is specified
- [ ] Freshness check exists
- [ ] Owner is assigned

---

## Summary

Reliable metrics require:

- Clear definitions agreed upon before implementation
- Consistent grain across the data pipeline
- Explicit handling of time, NULLs, and filters
- Separation of storage from calculation

Metrics built on these principles become durable assets rather than sources of constant debate.

---

## Related Docs

- [Semantic Layer](./semantic-layer.md) — where metric definitions are centralized and governed
- [Power BI Architecture](./powerbi-architecture.md) — connecting metrics to BI consumption layer
- [Dimensional Modeling](../data-modeling/dimensional-modeling.md) — grain and measure design in the warehouse
- [dbt Testing Strategy](../tooling/dbt/dbt-testing-strategy.md) — validating metric columns with automated tests
