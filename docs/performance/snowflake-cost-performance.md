---
id: snowflake-cost-performance
title: Snowflake Cost & Performance
displayText: Controlling costs while maximizing Snowflake performance
tags: [performance,snowflake,cloud,data]
---

# Snowflake Cost & Performance

Snowflake separates compute and storage, which gives fine-grained cost control — but also introduces new ways to overspend. This document covers performance optimization and cost governance strategies.

---

## How Snowflake Charges

| Resource | Billing Unit |
| -------- | ------------ |
| Compute (Virtual Warehouses) | Credits per second (minimum 60s) |
| Storage | Per TB per month |
| Data Transfer | Per GB (cross-region / cloud) |
| Serverless features (Snowpipe, Tasks, Search) | Credits based on usage |

**Compute is the dominant cost driver.** Warehouses bill even when idle if not suspended.

---

## Virtual Warehouse Configuration

### Auto-Suspend

Always configure auto-suspend. The default is 600 seconds (10 minutes) of idle time.

For interactive BI workloads:

```sql
ALTER WAREHOUSE my_warehouse SET AUTO_SUSPEND = 60;
```

For batch ETL warehouses:

```sql
ALTER WAREHOUSE etl_warehouse SET AUTO_SUSPEND = 120;
```

A warehouse that runs 5 minutes and idles for 10 minutes before suspending wastes 2× the compute cost.

---

### Auto-Resume

Enable auto-resume so warehouses start automatically on query:

```sql
ALTER WAREHOUSE my_warehouse SET AUTO_RESUME = TRUE;
```

---

### Warehouse Sizing

Scaling up (larger warehouse size) helps with:

- Complex joins on large tables
- Large `GROUP BY` operations
- High-memory transformations

Scaling up does **not** help with:

- High concurrency (many simultaneous small queries)
- Simple filtered reads

For concurrency, use **multi-cluster warehouses** or separate dedicated warehouses per workload.

---

### Warehouse Isolation

Separate warehouses by workload type:

| Warehouse | Purpose | Size |
| --------- | ------- | ---- |
| `wh_etl` | dbt and batch transforms | M–XL |
| `wh_bi` | BI tool queries (Power BI, Tableau) | S–M |
| `wh_adhoc` | Analyst ad-hoc queries | S |
| `wh_ingest` | Snowpipe / loading | XS–S |

This prevents BI slowdowns caused by heavy ETL jobs.

---

## Query Optimization

### Clustering Keys

Snowflake uses micro-partitions (typically 50–500 MB each). Queries that filter on a well-clustered column skip most partitions.

Add a clustering key when:

- The table is large (> 1 TB)
- Queries consistently filter by the same column(s)
- Partition overlap is high (visible in `SYSTEM$CLUSTERING_INFORMATION`)

```sql
ALTER TABLE fct_orders CLUSTER BY (order_date);
```

Check clustering depth:

```sql
SELECT SYSTEM$CLUSTERING_INFORMATION('fct_orders', '(order_date)');
```

---

### Avoid Full Table Scans

```sql
-- Bad: no filter on a large table
SELECT count(*) FROM fct_orders;

-- Good: partition-filtered scan
SELECT count(*) FROM fct_orders WHERE order_date >= '2024-01-01';
```

Always include a date or clustering column filter on large tables.

---

### Use `LIMIT` During Development

```sql
-- Expensive: full scan during testing
SELECT * FROM fct_orders;

-- Cheap: development sample
SELECT * FROM fct_orders LIMIT 1000;
```

---

### Result Cache

Snowflake caches query results for 24 hours. Identical queries return instantly from cache.

Conditions for cache hit:

- Exact same SQL text
- Underlying data has not changed
- Same warehouse is not required

Do not artificially bypass the cache (e.g., adding random comments to queries).

---

### Query Profile

Always check the Query Profile for slow queries:

1. Run the query in Snowsight
2. Click the query → Query Profile
3. Look for:
   - **TableScan** with high bytes scanned → missing clustering
   - **HashJoin** with large build side → large dimension causing broadcast issue
   - **Spill to local/remote disk** → warehouse undersized for this query

---

## Cost Monitoring

### Resource Monitors

Set spending limits at the account or warehouse level:

```sql
CREATE RESOURCE MONITOR bi_monitor
    WITH CREDIT_QUOTA = 100
    TRIGGERS ON 80 PERCENT DO NOTIFY
             ON 100 PERCENT DO SUSPEND;

ALTER WAREHOUSE wh_bi SET RESOURCE_MONITOR = bi_monitor;
```

---

### Query Cost Estimation

Before running expensive queries in production:

```sql
-- Check the estimated bytes scanned with EXPLAIN
EXPLAIN SELECT sum(revenue) FROM fct_orders WHERE order_date >= '2024-01-01';
```

---

### Monitor Spend with `SNOWFLAKE.ACCOUNT_USAGE`

```sql
-- Top credit-consuming warehouses last 30 days
SELECT
    warehouse_name,
    sum(credits_used) as total_credits
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= dateadd(day, -30, current_timestamp)
GROUP BY warehouse_name
ORDER BY total_credits DESC;
```

---

## dbt + Snowflake Cost Rules

- Use `incremental` materialization for large tables (never `table` for multi-billion row models)
- Set `+snowflake_warehouse` per model to route expensive models to larger warehouses
- Use `post-hook` to suspend warehouses after heavy batch jobs
- Enable `copy_grants` to avoid permission re-grants on full refreshes

```yaml
models:
  my_project:
    mart:
      +snowflake_warehouse: wh_etl_xl
    stg:
      +snowflake_warehouse: wh_etl
```

---

## Golden Rules

- Auto-suspend within 60–120 seconds for all warehouses
- Never run BI and ETL workloads on the same warehouse
- Clustering keys for tables > 1 TB queried by date
- Resource monitors on every production warehouse
- Monitor `WAREHOUSE_METERING_HISTORY` weekly
- Avoid `SELECT *` on large tables in production

---

## Summary

Snowflake cost control requires:

- **Warehouse discipline**: right-sized, auto-suspended, isolated by workload
- **Query hygiene**: partition filters, result cache awareness, avoid full scans
- **Spend visibility**: resource monitors and metering history dashboards
- **Incremental loading**: avoid full table rebuilds for large models

Compute waste is always the first problem. Fix warehouse configuration before optimizing queries.

---

## Related Docs

- [Warehouse Standards](../architecture/warehouse-standards.md) — dbt layer definitions and incremental materialization rules
- [dbt Project Structure](../tooling/dbt/dbt-project-structure.md) — setting `+snowflake_warehouse` per model layer
- [dbt Testing Strategy](../tooling/dbt/dbt-testing-strategy.md) — data quality testing patterns for Snowflake models
- [Cloud vs On-Premise](../architecture/cloud-vs-onprem.md) — decision framework for platform selection
