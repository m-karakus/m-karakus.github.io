---
id: clickhouse-migration
title: Migrating to ClickHouse from PostgreSQL
displayText: A real-world migration from PostgreSQL to ClickHouse for analytical workloads
tags: [case-study,clickhouse,migration,performance]
---

# Case Study: Migrating to ClickHouse from PostgreSQL

## Background

A mid-size e-commerce platform was running analytical queries against a PostgreSQL database that had grown to approximately 800 GB of event and order data. Dashboard queries were taking 30–90 seconds, and the database was under constant CPU pressure during business hours.

The decision was made to migrate the analytical workload to ClickHouse while keeping PostgreSQL as the operational transactional database.

---

## Problem Statement

### Symptoms

- Dashboard load times: 30–90 seconds
- PostgreSQL CPU at 80–100% during peak hours
- Long-running analytical queries blocking transactional writes
- Reporting layer querying normalized OLTP tables directly

### Root Cause

The reporting layer was issuing complex multi-join queries against:

- A normalized OLTP schema (not optimized for analytics)
- A single PostgreSQL instance with no read replicas
- No pre-aggregation or caching layer

---

## Architecture Before Migration

```
Transactional App
       ↓
   PostgreSQL (OLTP + Analytics)
       ↓
   Power BI (DirectQuery)
```

All reads and writes competed on the same database.

---

## Architecture After Migration

```
Transactional App
       ↓
   PostgreSQL (OLTP only)
       ↓ CDC via Debezium
   Kafka
       ↓ PySpark consumer
   ClickHouse (Analytics)
       ↓
   Power BI (DirectQuery)
```

---

## Migration Steps

### Step 1: Identify Analytical Tables

Not all PostgreSQL tables were migrated. The migration focused on:

- Event tables (clicks, impressions, sessions)
- Order and order line tables
- Customer activity tables

Transactional tables (inventory, payment processing) remained in PostgreSQL.

---

### Step 2: Schema Design in ClickHouse

The normalized OLTP schema was redesigned as a flat, denormalized ClickHouse schema.

PostgreSQL (normalized):

```sql
orders (id, customer_id, created_at, status)
order_lines (id, order_id, product_id, quantity, unit_price)
products (id, name, category_id)
categories (id, name)
```

ClickHouse (denormalized):

```sql
CREATE TABLE fct_orders (
    order_date          Date,
    order_id            UInt64,
    customer_id         UInt64,
    product_id          UInt64,
    product_name        LowCardinality(String),
    category_name       LowCardinality(String),
    quantity            UInt16,
    unit_price          Decimal(10,2),
    revenue             Decimal(10,2),
    order_status        LowCardinality(String),
    etl_time            DateTime
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, customer_id, order_id);
```

Key decisions:

- Monthly partitioning by `order_date`
- Primary key starts with `order_date` (most common filter)
- `LowCardinality` for string columns with limited distinct values
- Denormalized category and product names to eliminate joins

---

### Step 3: Historical Data Load

Historical data was loaded via a bulk CSV export from PostgreSQL:

```bash
# Export from PostgreSQL
psql -c "\COPY (SELECT ...) TO '/tmp/orders.csv' CSV HEADER"

# Load into ClickHouse
clickhouse-client --query="INSERT INTO fct_orders FORMAT CSVWithNames" < /tmp/orders.csv
```

The initial load of 800 GB PostgreSQL data resulted in approximately 120 GB in ClickHouse due to columnar compression.

---

### Step 4: Incremental CDC Pipeline

After the historical load, a CDC pipeline was established using Debezium → Kafka → PySpark consumer writing to ClickHouse.

The ClickHouse table was switched to `ReplacingMergeTree` to handle update events:

```sql
ENGINE = ReplacingMergeTree(etl_time)
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, order_id);
```

`ReplacingMergeTree` keeps the latest version of each row based on `ORDER BY` key, using `etl_time` as the version column.

---

### Step 5: Power BI Reconnection

Power BI was reconfigured to use ClickHouse via the ODBC driver.

Key changes:

- Queries rewritten to use ClickHouse SQL syntax
- `toYYYYMM()` used in date filters instead of `DATE_TRUNC`
- `PREWHERE` added to selective filters
- Report refresh changed from DirectQuery to scheduled Import for most dashboards

---

## Results

| Metric | Before (PostgreSQL) | After (ClickHouse) |
| ------ | ------------------- | ------------------ |
| Dashboard load time | 30–90 seconds | 0.5–3 seconds |
| Storage (analytical data) | 800 GB | 120 GB |
| PostgreSQL CPU (peak) | 80–100% | 15–25% |
| Query parallelism | Limited | High (columnar scans) |

---

## Lessons Learned

### What Worked Well

- Denormalizing the schema upfront eliminated all join-related slowness
- `LowCardinality` columns dramatically reduced storage and improved string filtering
- Monthly partitioning matched the most common date filter pattern

---

### What Was Harder Than Expected

- Power BI ODBC connectivity required driver configuration on each gateway machine
- `ReplacingMergeTree` deduplication is eventual — `FINAL` keyword is sometimes needed in queries:

```sql
SELECT * FROM fct_orders FINAL WHERE order_date = today();
```

- Some DAX time intelligence functions assumed specific SQL dialects and needed rewrites

---

## Recommendations for Similar Migrations

1. **Denormalize early** — Do not try to replicate the OLTP schema in ClickHouse
2. **Choose partition key based on query patterns**, not data volume alone
3. **Test `LowCardinality` on all string columns** before finalizing the schema
4. **Run both systems in parallel** for at least 2 weeks to validate query results
5. **Document ClickHouse-specific SQL differences** for the BI/analytics team

---

## Summary

The migration reduced dashboard load times by 20–30× and freed the PostgreSQL database from analytical query pressure. The 85% storage reduction was a secondary benefit that reduced infrastructure costs.

The most impactful change was the schema redesign from normalized OLTP to denormalized ClickHouse tables — not the database switch itself.
