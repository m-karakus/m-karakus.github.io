---
id: clickhouse-platform
title: ClickHouse
displayText: ClickHouse as an analytical data platform
tags: [platforms,clickhouse,data]
---

# ClickHouse

ClickHouse is an **open-source columnar OLAP database** built for real-time analytical queries on large datasets. It is the primary platform for high-throughput analytics workloads where query latency and storage efficiency are critical.

---

## When to Use ClickHouse

ClickHouse is the right choice when:

- Analytical queries need to run in milliseconds on billions of rows
- Storage costs matter (ClickHouse achieves 5–10× compression vs row-oriented databases)
- The workload is predominantly read-heavy with append-only writes
- You need to serve dashboards with sub-second response times at scale

It is **not** the right choice for:

- OLTP workloads (frequent point updates, transactions)
- Datasets smaller than ~100M rows where PostgreSQL or DuckDB suffice
- Complex multi-table joins that are unavoidable (ClickHouse favors denormalized wide tables)

---

## Core Architecture

### Columnar Storage

ClickHouse stores each column in a separate file on disk. This means:

- Queries that select 5 columns from a 200-column table read only 2.5% of the data
- Column-level compression is highly effective (similar values stored together)
- Vectorized CPU operations process entire column arrays at once

### MergeTree Engine Family

All production tables use the `MergeTree` engine family:

| Engine | Use Case |
| ------ | -------- |
| `MergeTree` | Standard append-only analytical tables |
| `ReplacingMergeTree` | Deduplication — keeps latest row per key |
| `AggregatingMergeTree` | Pre-aggregation patterns |
| `SummingMergeTree` | Automatic sum aggregation on merge |
| `ReplicatedMergeTree` | Multi-node replication |

### Compression

ClickHouse applies compression per column using LZ4 by default.

Custom codecs can be applied per column:

```sql
event_time DateTime CODEC(Delta, ZSTD),
status     LowCardinality(String),
revenue    Decimal(10,2) CODEC(ZSTD(3))
```

---

## Key Design Principles

### Denormalization is Preferred

Unlike traditional data warehouses where star schemas are normalized:

- ClickHouse performs best on **wide, flat tables** with pre-joined dimensions
- JOIN operations exist but are expensive at scale
- Embed dimension attributes directly in fact rows when possible

---

### Primary Key Drives Everything

The `ORDER BY` clause defines the sorting key, which powers the sparse primary index.

- Queries using the primary key prefix skip granules → fast
- Queries not using the primary key → full scan

Design the primary key around your most frequent query filters:

```sql
ORDER BY (event_date, customer_id)   -- if you always filter by date + customer
```

---

### Partitioning for Pruning

Monthly partitioning is the standard for time-series data:

```sql
PARTITION BY toYYYYMM(event_date)
```

ClickHouse skips entire partitions that don't match the query filter, reducing I/O dramatically.

---

## Integration Points

| Tool | Integration Method |
| ---- | ------------------ |
| Power BI | ODBC driver |
| Grafana | Native ClickHouse plugin |
| dbt | `dbt-clickhouse` adapter |
| Python | `clickhouse-driver` or `clickhouse-connect` |
| PySpark | JDBC driver or HTTP connector |
| Kafka | ClickHouse Kafka engine (native) |
| Airflow | HTTP operator or Python operator |

---

## Deployment Options

### Self-Hosted

- Deploy on bare metal or VM
- Full control over configuration and resources
- Requires operational expertise

### ClickHouse Cloud

- Managed service by ClickHouse Inc.
- Automatic scaling and backups
- Consumption-based pricing
- Recommended for teams without dedicated infrastructure engineering

### Kubernetes

- Deploy via official Helm chart
- Integrates with existing Kubernetes data stacks
- See [Kubernetes for Data Platforms](../architecture/kubernetes-for-data.md)

---

## Operational Considerations

### Monitoring

Key metrics to monitor:

- Query duration via `system.query_log`
- Merge backlog via `system.merges`
- Disk usage via `system.parts`
- Replication lag (if replicated) via `system.replication_queue`

### Backups

ClickHouse supports native backup to S3:

```sql
BACKUP TABLE analytics.fct_orders TO S3('s3://my-bucket/backups/', 'key', 'secret');
```

### Access Control

- Use dedicated users per application (ETL, BI, admin)
- Apply row-level policies for multi-tenant scenarios
- Enable TLS for all client connections in production

---

## Further Reading

- [Getting Started with ClickHouse](../tooling/clickhouse/init.md)
- [ClickHouse Performance Optimizations](../performance/clickhouse-optimizations.md)
- [Case Study: Migrating to ClickHouse from PostgreSQL](../case-studies/clickhouse-migration.md)