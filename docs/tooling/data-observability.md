---
id: data-observability
title: Data Observability
displayText: Monitoring data health across the pipeline
tags: [tooling,data,testing]
---

# Data Observability

Data observability is the ability to understand the health of data flowing through your pipeline at any point in time. Without it, data issues are discovered by business users rather than engineers.

---

## The Five Pillars

| Pillar | Question |
| ------ | -------- |
| **Freshness** | Is the data up to date? |
| **Volume** | Does the data have the expected number of rows? |
| **Distribution** | Are column values within expected ranges? |
| **Schema** | Have column names or types changed unexpectedly? |
| **Lineage** | If something is wrong, what does it affect? |

Most data incidents are caused by failures in freshness or volume. Start there.

---

## Freshness Monitoring

### dbt Source Freshness

dbt has built-in source freshness checking:

```yaml
sources:
  - name: crm
    tables:
      - name: orders
        loaded_at_field: etl_time
        freshness:
          warn_after: {count: 6, period: hour}
          error_after: {count: 24, period: hour}
```

Run from CI or a scheduled job:

```bash
dbt source freshness
```

Failures are surfaced as warnings or errors in the run output.

---

### Freshness in the Mart Layer

For mart tables, track freshness with a monitoring query:

```sql
SELECT
    table_name,
    max(etl_date)                                           AS last_etl_date,
    current_date - max(etl_date)                           AS days_since_refresh,
    CASE
        WHEN current_date - max(etl_date) > 1 THEN 'STALE'
        ELSE 'OK'
    END                                                     AS status
FROM (
    SELECT 'fct_orders'   AS table_name, max(etl_date) AS etl_date FROM mart.fct_orders
    UNION ALL
    SELECT 'fct_sessions' AS table_name, max(etl_date) AS etl_date FROM mart.fct_sessions
)
GROUP BY table_name, etl_date
ORDER BY days_since_refresh DESC;
```

---

## Volume Monitoring

### Row Count Thresholds

Track daily row counts and alert on anomalies:

```sql
-- Store daily row counts
INSERT INTO monitoring.table_row_counts
SELECT
    current_date                               AS check_date,
    'fct_orders'                               AS table_name,
    count(*)                                   AS row_count
FROM mart.fct_orders
WHERE etl_date = current_date;

-- Alert on count outside expected range
SELECT
    check_date,
    table_name,
    row_count,
    avg(row_count) OVER (
        ORDER BY check_date
        ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
    )                                          AS avg_7d,
    CASE
        WHEN row_count < avg_7d * 0.7 THEN 'LOW — possible drop'
        WHEN row_count > avg_7d * 1.5 THEN 'HIGH — possible duplicate'
        ELSE 'OK'
    END                                        AS volume_status
FROM monitoring.table_row_counts
WHERE check_date = current_date;
```

### dbt Volume Test

Using `dbt_expectations`:

```yaml
- name: fct_orders
  tests:
    - dbt_expectations.expect_table_row_count_to_be_between:
        min_value: 500
        max_value: 100000
        config:
          where: "etl_date = current_date"
```

---

## Distribution Monitoring

Track null rates and value distribution shifts:

```sql
-- Null rate per column
SELECT
    count_if(customer_id IS NULL) * 100.0 / count(*) AS customer_id_null_pct,
    count_if(revenue IS NULL)     * 100.0 / count(*) AS revenue_null_pct,
    count_if(order_status IS NULL)* 100.0 / count(*) AS status_null_pct
FROM mart.fct_orders
WHERE etl_date = current_date;
```

Alert when null rate exceeds baseline by more than 5%.

---

### Value Distribution Checks

```sql
-- Distribution shift: compare today's status breakdown to last week's
SELECT
    order_status,
    count(*) * 100.0 / sum(count(*)) OVER ()  AS pct_today
FROM mart.fct_orders
WHERE etl_date = current_date
GROUP BY order_status
ORDER BY pct_today DESC;
```

A sudden spike in `cancelled` or disappearance of `delivered` status indicates an upstream issue.

---

## Schema Monitoring

Schema changes (column renames, type changes, dropped columns) silently break downstream models.

### dbt `audit_helper` for Schema Diff

The `dbt-labs/audit_helper` package provides column-level comparison:

```sql
{% set old_relation = ref('fct_orders__v1') %}
{% set new_relation = ref('fct_orders') %}

{{ audit_helper.compare_column_values(
    a_relation=old_relation,
    b_relation=new_relation,
    primary_key='order_line_sk',
    column_name='revenue_gross'
) }}
```

### Source Schema Alerts

In modern data stacks, use the data catalog or ingestion platform to detect source schema changes before they break the pipeline.

---

## Lineage

Lineage answers: **if this table is broken, what downstream assets are affected?**

### dbt Lineage

dbt generates lineage automatically from `ref()` and `source()` calls.

View in dbt docs:

```bash
dbt docs generate
dbt docs serve
```

Navigate the lineage DAG to trace impact from broken sources to affected marts.

---

### Impact Analysis Before Changes

Before changing a model, check what depends on it:

```bash
# List all models downstream of fct_orders
dbt ls --select fct_orders+
```

---

## Alerting

Observability without alerting is just logging.

### dbt On-Run-End Hooks

Send alerts when runs fail:

```yaml
# dbt_project.yml
on-run-end:
  - "{{ notify_on_failure(results) }}"
```

### Slack / PagerDuty Integration

Route alerts based on severity:

| Alert Type | Channel | Severity |
| ---------- | ------- | -------- |
| Source freshness error | `#data-oncall` | High |
| Mart row count anomaly | `#data-quality` | Medium |
| dbt test failure (error) | `#data-oncall` | High |
| dbt test failure (warn) | `#data-quality` | Low |

---

## Minimum Observability Stack

For teams without dedicated observability tooling:

1. **dbt source freshness** — scheduled every 30 minutes
2. **dbt test run** — scheduled after every pipeline run
3. **Row count monitoring table** — populated by a post-run dbt macro
4. **Slack webhook** — receives dbt run failure notifications

This covers freshness, volume, and correctness with zero additional tools.

---

## Commercial Tools

| Tool | Strengths |
| ---- | --------- |
| Monte Carlo | Full five-pillar coverage, ML anomaly detection |
| Soda | SQL-based checks, integrates with dbt |
| Great Expectations | Highly configurable, open-source |
| Metaplane | dbt-native, lightweight |

For most teams, dbt's built-in tests combined with a monitoring table cover 80% of needs.

---

## Summary

Observability checklist:

- [ ] Source freshness checks defined for all production sources
- [ ] dbt tests run after every pipeline completion
- [ ] Daily row counts stored and compared to rolling average
- [ ] Null rate monitoring on critical columns
- [ ] Lineage documented via dbt DAG
- [ ] Alerts routed to appropriate channels by severity
- [ ] On-call rotation defined for high-severity data incidents
