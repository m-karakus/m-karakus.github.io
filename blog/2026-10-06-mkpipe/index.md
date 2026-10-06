---
title: "mkpipe — A Modular, Spark-Based ETL Framework You Can pip install"
description: "I built mkpipe: a Python-first, plugin-based ETL framework on PySpark. Single YAML config, tag-based execution, incremental replication, inline transforms, and orchestrator-agnostic by design."
slug: mkpipe-modular-spark-etl
authors: [metin]
tags: [data-engineering, etl, spark, open-source, python]
---

# mkpipe — A Modular, Spark-Based ETL Framework You Can pip install

Every data team eventually faces the same decision: how do we move data from operational databases into our warehouse? Off-the-shelf ELT tools are great — until you need something they don't support: a custom query on extraction, a transform between extract and load, running against an existing Spark cluster, or a source nobody has a plugin for yet.

So I built [mkpipe](https://github.com/mkpipe-etl/mkpipe): a **Spark-based, modular ETL framework**, available on [PyPI](https://pypi.org/project/mkpipe/) (`pip install mkpipe`). It's a Python-first framework with pluggable extractors, loaders, and inline transformations.

<!-- truncate -->

## The Design Idea: Small Core, Pluggable Everything

mkpipe follows one rule: **the core knows nothing about data sources or destinations.** PostgreSQL, MongoDB, ClickHouse, Snowflake — each is a separate pip package:

```bash
pip install mkpipe mkpipe-extractor-postgres mkpipe-loader-postgres
```

Add a source, install a plugin. Add a destination, install a plugin. The core only orchestrates: read the config, run the pipeline, delegate the I/O to plugins. This keeps the dependency surface small — you install exactly the connectors you use, nothing else.

## One YAML, Whole Pipelines

Everything — connections, pipelines, and tables — lives in a single `mkpipe_project.yaml`:

```yaml
pipelines:
  my_pipeline:
    source:
      type: postgres
      host: db.example.com
      database: app
      user: reader
      password: ${DB_PASS}
    target:
      type: postgres
      host: dwh.example.com
      database: warehouse
      user: writer
      password: ${DWH_PASS}
    tables:
      - name: public.users
        target_name: stg_users
        replication_method: incremental
        iterate_column: updated_at
        write_strategy: upsert
        write_key: [id]
        tags: [api, user-domain, critical]

      - name: public.orders
        target_name: stg_orders
        replication_method: full
        tags: [api, order-domain]
```

No code to write for a standard replication job. Run it:

```bash
mkpipe run                    # run everything
mkpipe run -p my_pipeline     # one pipeline
mkpipe run -t stg_users       # one table
mkpipe run --tags api         # every table tagged "api", across ALL pipelines
```

## What Makes It Useful in Practice

### Tag-based execution
Tags are my favorite feature. Group tables by business domain, team, or priority — then run exactly what you need across **all pipelines** with OR logic:

```python
import mkpipe

mkpipe.run(config="mkpipe_project.yaml", tags=["critical"])
```

When a downstream consumer breaks at 8 AM, you don't rerun the world — you rerun the tagged tables that feed it.

### Incremental replication done idempotently
mkpipe's incremental strategy is **append-only**: extract rows where `iterate_column >= last_point` (inclusive, so no boundary loss), append to the target, never overwrite. If you set `dedup_columns`, each row gets a `mkpipe_id` (xxhash64 hash) so downstream dedup is one `ROW_NUMBER()` window away:

```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY mkpipe_id
                               ORDER BY _ingested_at DESC) AS rn
  FROM stg_users
) WHERE rn = 1
```

Crash mid-run? Rerun. Nothing is lost, nothing is double-loaded after dedup.

### Inline transformations
Need a light transform between extract and load? Point at a Python function:

```yaml
- name: public.products
  target_name: stg_products
  replication_method: full
  transform: transforms/clean_products.py::transform
```

The function receives and returns a PySpark DataFrame — `df → df` — with the full Spark API available. No intermediate layer, no separate tool to deploy.

### Parallel JDBC reads/writes
Being Spark-based, mkpipe reads and writes through **partitioned JDBC**: configurable `partitions_count` (default 10), `fetchsize` 100k rows per round trip, partition bounds computed automatically or pinned statically for large tables. On big tables, this is the difference between hours and minutes.

### Orchestrator-agnostic by design
mkpipe doesn't own scheduling. Use it with **Dagster, Airflow, cron, or plain Python** — it's a library and a CLI, not a platform. Your orchestrator stays the source of truth for orchestration; mkpipe does the data movement. And if you already run a Spark cluster (Glue, EMR, Dataproc), pass your own SparkSession via dependency injection:

```python
mkpipe.run(config="mkpipe_project.yaml", spark=my_glue_session)
```

### Write strategies per table
`append`, `replace` (drop+create or truncate+insert), `upsert` (MERGE / ON CONFLICT by key), and full `merge` — chosen per table in YAML, not per project in code.

## Plugin Ecosystem

The catalog lives in [mkpipe-hub](https://github.com/mkpipe-etl/mkpipe-hub). Extractors today include PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite, Redshift, ClickHouse, MongoDB, Snowflake, BigQuery, Cassandra, TimescaleDB, DynamoDB, Elasticsearch, InfluxDB, Redis, and file-based sources (S3/GCS/local/Iceberg/Delta). Loaders cover the usual warehouse and database targets.

JDBC drivers and Spark connector JARs are handled automatically: Maven dependencies resolve lazily on first run, and for offline/Docker builds `mkpipe install-jars` pre-downloads everything:

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y default-jdk && rm -rf /var/lib/apt/lists/*
RUN pip install mkpipe mkpipe-extractor-postgres mkpipe-loader-clickhouse
RUN mkpipe install-jars
COPY mkpipe_project.yaml .
CMD ["mkpipe", "run"]
```

## When mkpipe Fits

- You want **config-driven replication** without the weight of a full ELT platform
- You need **custom SQL or transforms in the middle** of extract→load
- You already have **Spark** and want pipelines that use it natively
- You want **your orchestrator to stay in charge** of scheduling and monitoring

And when it doesn't: if you need CDC with log-based decoding, real-time streaming, or a hosted SaaS UI, heavier tools may serve you better.

## Try It

```bash
pip install mkpipe mkpipe-extractor-postgres mkpipe-loader-postgres
mkpipe run
```

- GitHub: [github.com/mkpipe-etl/mkpipe](https://github.com/mkpipe-etl/mkpipe)
- PyPI: [pypi.org/project/mkpipe](https://pypi.org/project/mkpipe/)
- Plugins: [mkpipe-hub](https://github.com/mkpipe-etl/mkpipe-hub)

Issues and PRs are open — if a connector you need is missing, an extractor or loader plugin is a small, well-scoped contribution. Feedback welcome.
