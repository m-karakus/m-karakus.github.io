---
sidebar_position: 1
---

# Data Engineering Docs

A personal knowledge base on data engineering — covering warehouse architecture, data modeling, analytics design, performance tuning, and tooling.

These docs reflect real-world patterns and decisions, not vendor documentation.

---

## Sections

### Architecture
Standards and patterns for building data warehouse and lakehouse systems.

- [Warehouse Standards & Layer Definitions](./architecture/warehouse-standards.md) — dbt layer norms, naming conventions, materialization rules
- [Cloud vs On-Premise](./architecture/cloud-vs-onprem.md) — decision framework for platform selection
- [Kubernetes for Data Platforms](./architecture/kubernetes-for-data.md) — running data workloads on Kubernetes

---

### Data Modeling
Techniques for structuring analytics-ready data.

- [Dimensional Modeling](./data-modeling/dimensional-modeling.md) — star schema, grain, surrogate keys
- [Fact Table Design](./data-modeling/fact-table-design.md) — fact types, mandatory columns, incremental patterns
- [Slowly Changing Dimensions](./data-modeling/slowly-changing-dimensions.md) — SCD types, dbt snapshots
- [Power BI Semantic Model](./data-modeling/powerbi-semantic-model.md) — VertiPaq-optimized star schema, DAX patterns

---

### Analytics
Designing metrics and BI systems that business teams can trust.

- [Metrics Design Principles](./analytics/metrics-design.md) — grain, naming, anti-patterns, validation checklist
- [Power BI Architecture](./analytics/powerbi-architecture.md) — dataset modes, workspace topology, RLS
- [Semantic Layer](./analytics/semantic-layer.md) — responsibilities, dbt metrics, governance

---

### Performance
Query and platform optimization techniques.

- [ClickHouse Optimizations](./performance/clickhouse-optimizations.md) — primary key, partitioning, materialized views
- [Power BI Performance Tuning](./performance/powerbi-performance.md) — DAX Studio, model size, DAX patterns
- [Snowflake Cost & Performance](./performance/snowflake-cost-performance.md) — warehouse isolation, clustering keys, resource monitors

---

### Platforms
Deep-dives on specific data platforms.

- [ClickHouse](./platforms/clickhouse.md) — architecture overview, MergeTree engines, integrations, deployment

---

### Tooling
Setup and configuration guides for common data tools.

- [dbt Project Structure](./tooling/dbt/dbt-project-structure.md) — folder layout, source definitions, model templates
- [dbt Testing Strategy](./tooling/dbt/dbt-testing-strategy.md) — generic tests, singular tests, CI/CD integration
- [Getting Started with ClickHouse](./tooling/clickhouse/init.md) — installation, configuration, first table
- [Power BI Incremental Refresh](./tooling/powerbi/incremental-refresh.md) — RangeStart/RangeEnd, query folding, rolling windows
- [Data Observability](./tooling/data-observability.md) — freshness, volume, distribution, lineage, alerting

---

### Case Studies
Real-world implementations and lessons learned.

- [Migrating to ClickHouse from PostgreSQL](./case-studies/clickhouse-migration.md) — CDC pipeline, schema redesign, 20–30× query speedup
- [Scaling Power BI for Large Datasets](./case-studies/powerbi-large-dataset.md) — incremental refresh, aggregation tables, 500M row model
