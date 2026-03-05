---
id: dbt-testing-strategy
title: dbt Testing Strategy
displayText: Building a comprehensive test suite for dbt transformations
tags: [tooling,dbt,testing,data]
---

# dbt Testing Strategy

Data tests are the primary mechanism for ensuring correctness and catching regressions in a dbt project. This document defines a tiered testing strategy across all model layers.

---

## Why Data Tests Matter

Without tests:

- Silent data quality failures go undetected
- Downstream dashboards show incorrect numbers
- Trust in data erodes over time

With tests:

- Failures surface before data reaches consumers
- Schema changes are caught early
- Data contracts between layers are enforced

---

## Test Types in dbt

### Generic Tests (Built-in)

Four built-in generic tests available out of the box:

| Test | Description |
| ---- | ----------- |
| `unique` | No duplicate values in the column |
| `not_null` | No NULL values in the column |
| `accepted_values` | Column values are within an allowed set |
| `relationships` | Foreign key integrity check |

These are defined in `_schema.yml` files.

---

### Singular Tests

Custom SQL tests placed in the `tests/` directory.

Each file is a SQL query that returns failing rows. If the query returns 0 rows, the test passes.

```sql
-- tests/stg/test_stg_orders_no_future_dates.sql
select order_id
from {{ ref('stg_crm__orders') }}
where order_date > current_date
```

Use singular tests for business rule validations that cannot be expressed as generic tests.

---

### dbt_expectations Package

The `calogica/dbt_expectations` package provides advanced test types:

```yaml
- dbt_expectations.expect_column_values_to_be_between:
    min_value: 0
    max_value: 1000000
- dbt_expectations.expect_table_row_count_to_be_between:
    min_value: 1000
    max_value: 100000000
- dbt_expectations.expect_column_proportion_of_unique_values_to_be_between:
    min_value: 0.95
```

---

## Mandatory Tests by Layer

### RAW / Source Layer

```yaml
sources:
  - name: crm
    tables:
      - name: orders
        columns:
          - name: id
            tests:
              - not_null
          - name: etl_date
            tests:
              - not_null
        freshness:
          warn_after: {count: 12, period: hour}
          error_after: {count: 24, period: hour}
```

Mandatory:

- `not_null` on primary key
- `not_null` on `etl_date`
- Freshness check on all production sources

---

### STG Layer

```yaml
models:
  - name: stg_crm__orders
    columns:
      - name: row_hash
        tests:
          - not_null
          - unique
      - name: order_id
        tests:
          - not_null
      - name: customer_id
        tests:
          - not_null
      - name: order_status
        tests:
          - accepted_values:
              values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
```

Mandatory:

- `row_hash` → `unique` + `not_null`
- Business key → `not_null`
- Status/type columns → `accepted_values`

---

### MART Layer

```yaml
models:
  - name: fct_orders
    columns:
      - name: order_line_sk
        tests:
          - not_null
          - unique
      - name: customer_sk
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_sk
      - name: revenue_gross
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
```

Mandatory:

- Surrogate key → `unique` + `not_null`
- All foreign keys → `relationships` + `not_null`
- Revenue/measure columns → range checks

---

## Test Severity Levels

Not every test failure should block deployment. Configure severity:

```yaml
- name: revenue_gross
  tests:
    - not_null:
        severity: error        # blocks run, fails CI
    - dbt_expectations.expect_column_values_to_be_between:
        min_value: 0
        severity: warn         # logs warning, does not fail run
```

Use:

- `error` for correctness tests (nulls, uniqueness, foreign keys)
- `warn` for statistical anomalies (row count thresholds, value ranges)

---

## Volume and Freshness Tests

### Row Count Regression Test

```sql
-- tests/mart/test_fct_orders_row_count.sql
-- Fails if today's order count is less than 100 or greater than 1,000,000
select
    count(*) as row_count
from {{ ref('fct_orders') }}
where etl_date = current_date
having count(*) < 100 or count(*) > 1000000
```

---

### Cross-Layer Reconciliation Test

```sql
-- tests/mart/test_revenue_reconciliation.sql
-- Fails if mart revenue deviates more than 1% from staging revenue for the same date range
with stg_total as (
    select sum(revenue_gross) as revenue from {{ ref('stg_crm__orders') }}
    where etl_date >= dateadd(day, -7, current_date)
),
mart_total as (
    select sum(revenue_gross) as revenue from {{ ref('fct_orders') }}
    where etl_date >= dateadd(day, -7, current_date)
)
select
    stg_total.revenue as stg_revenue,
    mart_total.revenue as mart_revenue,
    abs(stg_total.revenue - mart_total.revenue) / nullif(stg_total.revenue, 0) as deviation_pct
from stg_total, mart_total
where deviation_pct > 0.01
```

---

## Running Tests

```bash
# Run all tests
dbt test

# Run tests for a specific model
dbt test --select stg_crm__orders

# Run tests for a layer
dbt test --select tag:layer:mart

# Run only freshness checks
dbt source freshness
```

---

## CI/CD Integration

In CI pipelines, run tests after build:

```yaml
# GitHub Actions example
- name: dbt build + test
  run: |
    dbt deps
    dbt build --target ci --select state:modified+
    dbt test --select state:modified+
```

`state:modified+` runs only models and their downstream dependencies that changed in the PR, not the entire project.

---

## Test Coverage Targets

| Layer | Minimum Coverage |
| ----- | ---------------- |
| stg | All primary keys + all type/status columns |
| mart (fct) | Surrogate key + all foreign keys + all measures |
| mart (dim) | Surrogate key + natural key + current flag |

---

## Golden Rules

- Every model has at least one test
- Surrogate keys and primary keys are always `unique` + `not_null`
- Foreign key `relationships` tests are mandatory in mart layer
- Use `warn` severity for statistical tests, `error` for correctness tests
- Cross-layer reconciliation tests run nightly in production
- Source freshness checks are mandatory for all production sources

---

## Summary

A complete dbt test suite provides:

- **Correctness guarantees**: uniqueness and null checks on all keys
- **Domain validation**: accepted values, range checks
- **Referential integrity**: foreign key relationships across layers
- **Volume monitoring**: row count and freshness anomaly detection
- **Regression detection**: cross-layer reconciliation on critical metrics

---

## Related Docs

- [dbt Project Structure](./dbt-project-structure.md) — where test files live and how `_schema.yml` is organized
- [Warehouse Standards](../../architecture/warehouse-standards.md) — mandatory test requirements per layer
- [Fact Table Design](../../data-modeling/fact-table-design.md) — what needs to be tested in mart fact tables
- [Metrics Design Principles](../../analytics/metrics-design.md) — validation checklist for metric correctness
