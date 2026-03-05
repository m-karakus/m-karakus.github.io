---
id: clickhouse-init
title: Getting Started with ClickHouse
displayText: Setting up ClickHouse for analytical workloads
tags: [tooling,clickhouse,data]
---

# Getting Started with ClickHouse

This document covers ClickHouse installation, initial configuration, and the first steps for setting up an analytical environment.

---

## What Is ClickHouse?

ClickHouse is an **open-source columnar OLAP database** designed for high-throughput analytical queries. It is the fastest open-source analytical database for aggregation queries over large datasets.

Key characteristics:

- Column-oriented storage (each column stored separately)
- Vectorized query execution
- Built-in compression per column
- Linear horizontal scalability
- SQL-compatible query language

---

## Installation Options

### Docker (Development)

```bash
docker run -d \
  --name clickhouse \
  -p 8123:8123 \
  -p 9000:9000 \
  -v clickhouse_data:/var/lib/clickhouse \
  clickhouse/clickhouse-server:latest
```

Connect via HTTP:

```bash
curl http://localhost:8123/?query=SELECT+version()
```

Connect via CLI:

```bash
docker exec -it clickhouse clickhouse-client
```

---

### Linux Package Install

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -fsSL 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/clickhouse-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/clickhouse-keyring.gpg] https://packages.clickhouse.com/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/clickhouse.list

sudo apt-get update
sudo apt-get install -y clickhouse-server clickhouse-client

sudo systemctl start clickhouse-server
```

---

## Initial Configuration

Key configuration file: `/etc/clickhouse-server/config.xml`

### Listen Address

By default ClickHouse listens on `localhost` only. To allow remote connections:

```xml
<!-- /etc/clickhouse-server/config.d/network.xml -->
<clickhouse>
    <listen_host>0.0.0.0</listen_host>
</clickhouse>
```

---

### Memory Limits

```xml
<!-- /etc/clickhouse-server/users.d/limits.xml -->
<clickhouse>
    <profiles>
        <default>
            <max_memory_usage>10000000000</max_memory_usage>  <!-- 10 GB -->
            <max_bytes_before_external_group_by>5000000000</max_bytes_before_external_group_by>
        </default>
    </profiles>
</clickhouse>
```

---

### User Configuration

Create a dedicated user for ETL pipelines:

```sql
CREATE USER etl_user IDENTIFIED WITH sha256_password BY 'strong_password';

GRANT CREATE TABLE, INSERT, SELECT ON analytics.* TO etl_user;
```

Create a read-only user for BI tools:

```sql
CREATE USER bi_user IDENTIFIED WITH sha256_password BY 'strong_password';

GRANT SELECT ON analytics.* TO bi_user;
```

---

## Creating Your First Table

```sql
CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE analytics.fct_orders (
    order_date          Date,
    order_id            UInt64,
    customer_id         UInt64,
    product_id          UInt64,
    product_name        LowCardinality(String),
    category_name       LowCardinality(String),
    quantity            UInt16,
    revenue             Decimal(10,2),
    order_status        LowCardinality(String),
    etl_time            DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, customer_id, order_id)
SETTINGS index_granularity = 8192;
```

---

## Loading Data

### Insert via VALUES

```sql
INSERT INTO analytics.fct_orders
    (order_date, order_id, customer_id, product_id, product_name,
     category_name, quantity, revenue, order_status)
VALUES
    ('2024-01-15', 1001, 5001, 200, 'Widget A', 'Electronics', 2, 49.99, 'delivered'),
    ('2024-01-15', 1002, 5002, 201, 'Widget B', 'Electronics', 1, 29.99, 'shipped');
```

---

### Insert from CSV File

```bash
clickhouse-client \
  --query="INSERT INTO analytics.fct_orders FORMAT CSVWithNames" \
  < /data/orders.csv
```

---

### Insert via HTTP API

```bash
curl -X POST \
  'http://localhost:8123/?query=INSERT+INTO+analytics.fct_orders+FORMAT+JSONEachRow' \
  -d '{"order_date":"2024-01-15","order_id":1003,"customer_id":5003,"product_id":202,"product_name":"Widget C","category_name":"Electronics","quantity":3,"revenue":89.97,"order_status":"pending"}'
```

---

## Verifying the Setup

```sql
-- Check ClickHouse version
SELECT version();

-- Check running merges
SELECT * FROM system.merges;

-- Check table sizes
SELECT
    table,
    formatReadableSize(sum(bytes_on_disk)) AS size_on_disk,
    sum(rows) AS total_rows
FROM system.parts
WHERE active = 1
  AND database = 'analytics'
GROUP BY table
ORDER BY sum(bytes_on_disk) DESC;
```

---

## Connecting BI Tools

### JDBC / ODBC

ClickHouse provides official JDBC and ODBC drivers:

- JDBC: `com.clickhouse.jdbc.ClickHouseDriver`
- Connection string: `jdbc:clickhouse://localhost:8123/analytics`

### Power BI

Use the ClickHouse ODBC driver:

1. Download from [clickhouse.com/docs/en/integrations/odbc](https://clickhouse.com/docs/en/integrations/odbc)
2. Create a DSN pointing to the ClickHouse server
3. Connect via Power BI's ODBC connector

---

## Key System Tables

| Table | Purpose |
| ----- | ------- |
| `system.query_log` | All executed queries with timing |
| `system.parts` | Table partition details and sizes |
| `system.merges` | Active background merge operations |
| `system.metrics` | Live server metrics |
| `system.errors` | Recent error log |

---

## Summary

ClickHouse is ready for production when:

- Server configured with memory limits per query
- Dedicated users created for ETL and BI access
- Tables designed with proper `ORDER BY` and `PARTITION BY`
- `LowCardinality` applied to string columns with limited cardinality
- Monitoring via `system.query_log` is active
