---
id: clickhouse-optimizations
title: ClickHouse Performance Optimizations
displayText: Tuning ClickHouse for analytical workloads
tags: [performance,clickhouse,data]
---

# ClickHouse Performance Optimizations

ClickHouse is a columnar OLAP database designed for high-throughput analytical queries. Performance problems are almost always caused by incorrect table design, not by hardware limitations.

---

## Core Performance Principles

1. **Primary key and sorting key** design is the single most impactful decision
2. **Partition pruning** eliminates unnecessary data scans
3. **Projection and materialized views** pre-compute expensive aggregations
4. **Data skipping indexes** accelerate point lookups on non-key columns

---

## Table Engine Selection

| Scenario | Recommended Engine |
| -------- | ------------------ |
| Primary OLAP workloads | `MergeTree` family |
| Deduplication required | `ReplacingMergeTree` |
| Pre-aggregation | `AggregatingMergeTree` |
| Time-series, partitioned | `MergeTree` with date partitioning |
| Distributed cluster | `Distributed` over `ReplicatedMergeTree` |

---

## Primary Key and Sorting Key Design

### How ClickHouse Uses the Primary Key

ClickHouse stores data in **granules** (default 8192 rows). The primary key index stores the first row of each granule.

A query using the primary key prefix can skip entire granules. A query that does not use the primary key prefix performs a full table scan.

---

### Choosing the Right Primary Key

Rules:

- Put the **most frequently filtered column first**
- Put **high-cardinality columns second**
- Keep the primary key short (3–5 columns maximum)

```sql
-- Good: filters by date first, then user_id
ORDER BY (event_date, user_id, event_type)

-- Bad: random UUID first destroys locality
ORDER BY (uuid, event_date)
```

---

### Primary Key vs Sorting Key

In ClickHouse, `PRIMARY KEY` and `ORDER BY` (sorting key) are separate concepts:

```sql
CREATE TABLE events (
    event_date   Date,
    user_id      UInt64,
    event_type   LowCardinality(String),
    revenue      Decimal(10,2)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id)
PRIMARY KEY (event_date, user_id);
```

The `ORDER BY` defines physical sort order. `PRIMARY KEY` can be a prefix of `ORDER BY`.

---

## Partitioning

Partitioning separates data into physical directories.

### Recommended Partition Keys

| Data Volume | Recommended Partition |
| ----------- | --------------------- |
| < 1 TB/year | `toYYYYMM(event_date)` |
| > 1 TB/year | `toYYYYMMDD(event_date)` |
| Time-series IoT | `toStartOfHour(event_time)` |

Rules:

- Always filter by the partition key in queries
- Partition count should stay below 1000 per table
- Avoid over-partitioning (e.g., partitioning by user_id)

```sql
-- Partition pruning: ClickHouse reads only matching partitions
SELECT sum(revenue)
FROM events
WHERE event_date >= '2024-01-01'  -- partition filter applied
  AND user_id = 12345
```

---

## Data Type Optimization

Choosing correct types significantly reduces storage and query time:

| Column Type | Recommendation |
| ----------- | -------------- |
| Low-cardinality strings | `LowCardinality(String)` |
| Status flags | `Enum8` or `UInt8` |
| Timestamps | `DateTime` (not String) |
| IDs | `UInt64` (not String UUIDs when possible) |
| Decimals | `Decimal(18,4)` (not Float64 for money) |

```sql
-- Bad: wastes memory and disables dictionary compression
status String

-- Good: automatic dictionary encoding
status LowCardinality(String)
```

---

## Materialized Views

Pre-aggregate data at insert time for common query patterns:

```sql
CREATE MATERIALIZED VIEW mv_daily_revenue
ENGINE = SummingMergeTree()
PARTITION BY event_date
ORDER BY (event_date, product_id)
AS
SELECT
    event_date,
    product_id,
    sum(revenue) as revenue_total,
    count() as order_count
FROM fct_orders
GROUP BY event_date, product_id;
```

Query the materialized view instead of the base table for aggregated reports.

---

## Data Skipping Indexes

Add secondary indexes for non-key column filters:

```sql
-- Bloom filter for point lookups on email
ALTER TABLE users ADD INDEX idx_email email TYPE bloom_filter GRANULARITY 4;

-- minmax index for range queries
ALTER TABLE events ADD INDEX idx_revenue revenue TYPE minmax GRANULARITY 8;
```

Best for:

- Low-selectivity secondary filters
- `IN` and equality checks on non-key columns

---

## Query Optimization Rules

### Use PREWHERE Instead of WHERE

`PREWHERE` applies a filter before reading other columns, reducing I/O:

```sql
-- Standard WHERE reads all columns first
SELECT user_id, revenue FROM events WHERE status = 'completed'

-- PREWHERE is applied during column reading
SELECT user_id, revenue FROM events PREWHERE status = 'completed'
```

ClickHouse automatically promotes some `WHERE` conditions to `PREWHERE` but being explicit helps.

---

### Avoid SELECT *

Always name columns explicitly:

```sql
-- Bad: reads all columns
SELECT * FROM fct_orders WHERE event_date = today()

-- Good: reads only needed columns
SELECT order_id, revenue, user_id FROM fct_orders WHERE event_date = today()
```

ClickHouse is columnar — reading fewer columns directly reduces I/O.

---

### Prefer `toYYYYMM()` over String Dates

```sql
-- Bad: no partition pruning
WHERE toString(event_date) LIKE '2024-01%'

-- Good: enables partition pruning
WHERE toYYYYMM(event_date) = 202401
```

---

## Compression Settings

ClickHouse compresses columns by default. Improve compression with:

```sql
-- ZSTD for better compression on text/log data
event_payload String CODEC(ZSTD(3)),

-- Delta + ZSTD for monotonically increasing values (timestamps, IDs)
event_time DateTime CODEC(Delta, ZSTD),

-- DoubleDelta for slowly changing counters
counter UInt64 CODEC(DoubleDelta, ZSTD)
```

---

## Monitoring Query Performance

Use `system.query_log` to analyze slow queries:

```sql
SELECT
    query_duration_ms,
    read_rows,
    read_bytes,
    result_rows,
    query
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_date = today()
ORDER BY query_duration_ms DESC
LIMIT 20;
```

Key metrics:

- `read_rows`: rows scanned (lower is better)
- `read_bytes`: bytes read (lower is better)
- High `read_rows / result_rows` ratio indicates missing partition or primary key filter

---

## Summary

ClickHouse performance optimization checklist:

- [ ] Primary key matches most common query filters
- [ ] Partition key enables partition pruning
- [ ] `LowCardinality` used for string columns with < 10k distinct values
- [ ] Correct numeric types (not String for IDs or dates)
- [ ] Materialized views for common aggregations
- [ ] `PREWHERE` for selective secondary filters
- [ ] `SELECT *` eliminated from production queries
- [ ] Slow queries monitored via `system.query_log`

---

## Related Docs

- [ClickHouse Platform Overview](../platforms/clickhouse.md) — MergeTree engines, compression, deployment options
- [Getting Started with ClickHouse](../tooling/clickhouse/init.md) — installation, configuration, first table
- [Case Study: Migrating to ClickHouse](../case-studies/clickhouse-migration.md) — real-world schema design and migration results
