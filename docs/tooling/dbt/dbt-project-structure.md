---
id: dbt-project-structure
title: dbt Project Structure
displayText: Organizing a scalable dbt project
tags: [tooling,dbt,data]
---

# dbt Project Structure

A well-organized dbt project enables team collaboration, consistent conventions, and maintainable transformation pipelines. This document defines the standard folder structure and configuration patterns.

---

## Recommended Folder Structure

```bash
dbt_project/
├── models/
│   ├── raw/              # Source definitions only (no .sql files)
│   ├── stg/              # Staging: technical cleanup, one model per source table
│   │   ├── source_a/
│   │   └── source_b/
│   ├── base/             # Business-ready entities
│   ├── int/              # Joins, enrichments, reusable intermediate models
│   └── mart/
│       ├── fct/          # Fact tables
│       └── dim/          # Dimension tables
├── macros/               # Reusable Jinja macros
├── tests/                # Custom generic tests
├── snapshots/            # SCD Type 2 snapshots
├── seeds/                # Static reference data (small CSV files)
├── analyses/             # Ad-hoc SQL analyses (not materialized)
├── docs/                 # Custom documentation blocks
├── dbt_project.yml       # Project configuration
└── packages.yml          # External package dependencies
```

---

## dbt_project.yml Standards

```yaml
name: my_project
version: '1.0.0'
config-version: 2

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets: ["target", "dbt_packages"]

models:
  my_project:
    stg:
      +materialized: incremental
      +incremental_strategy: merge
    base:
      +materialized: view
    int:
      +materialized: view
    mart:
      fct:
        +materialized: table
      dim:
        +materialized: table

vars:
  raw_incremental_days: 2
  default_timezone: 'UTC'
```

---

## Source Definitions

All source tables are defined in `models/raw/` using `_sources.yml` files.

```yaml
version: 2

sources:
  - name: crm
    database: raw_db
    schema: crm
    tables:
      - name: customers
        description: Raw customer records from CRM system
        loaded_at_field: etl_time
        freshness:
          warn_after: {count: 12, period: hour}
          error_after: {count: 24, period: hour}
      - name: orders
        description: Raw order records
```

Rules:

- One `_sources.yml` per source system
- Always define `loaded_at_field` for freshness checks
- Define freshness thresholds for all production sources

---

## Model File Conventions

### Staging Models

```sql
-- models/stg/crm/stg_crm__customers.sql
{{
    config(
        materialized='incremental',
        incremental_strategy='merge',
        unique_key='row_hash',
        tags=['layer:stg']
    )
}}

with source as (
    select * from {{ source('crm', 'customers') }}
    {% if is_incremental() %}
    where etl_date >= (
        select dateadd(day, -{{ var('raw_incremental_days') }}, max(etl_date))
        from {{ this }}
    )
    {% endif %}
),

deduped as (
    select *,
        row_number() over (
            partition by customer_id
            order by etl_time desc
        ) as rn
    from source
),

final as (
    select
        customer_id,
        cast(customer_name as varchar) as customer_name,
        cast(email as varchar)         as email,
        cast(country as varchar)       as country,
        etl_date,
        etl_time,
        row_hash
    from deduped
    where rn = 1
)

select * from final
```

---

### Mart Models

```sql
-- models/mart/fct/fct_orders.sql
{{
    config(
        materialized='incremental',
        incremental_strategy='merge',
        unique_key='order_line_sk',
        tags=['layer:mart', 'incremental']
    )
}}

with orders as (
    select * from {{ ref('stg_crm__orders') }}
    {% if is_incremental() %}
    where etl_date >= (
        select dateadd(day, -{{ var('raw_incremental_days') }}, max(etl_date))
        from {{ this }}
    )
    {% endif %}
),

customers as (
    select * from {{ ref('dim_customer') }}
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['o.order_id', 'o.line_item_id']) }} as order_line_sk,
        o.order_id,
        o.line_item_id,
        c.customer_sk,
        o.revenue_gross,
        o.order_date,
        o.etl_date
    from orders o
    left join customers c on o.customer_id = c.customer_id
)

select * from final
```

---

## Schema and Documentation YAML

Every model folder should have a `_schema.yml` file:

```yaml
version: 2

models:
  - name: stg_crm__customers
    description: Deduplicated, type-cast staging view of raw CRM customers
    columns:
      - name: customer_id
        description: Natural key from CRM source system
        tests:
          - not_null
          - unique
      - name: email
        description: Customer email address
        tests:
          - not_null
      - name: row_hash
        description: xxhash64 of business key columns
        tests:
          - not_null
          - unique
```

---

## packages.yml

Standard packages to include in most projects:

```yaml
packages:
  - package: dbt-labs/dbt_utils
    version: [">=1.0.0", "<2.0.0"]
  - package: calogica/dbt_expectations
    version: [">=0.9.0", "<1.0.0"]
  - package: dbt-labs/audit_helper
    version: [">=0.9.0", "<1.0.0"]
```

---

## profiles.yml (Development)

```yaml
my_project:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      password: "{{ env_var('SNOWFLAKE_PASSWORD') }}"
      role: transformer
      database: dev_db
      warehouse: wh_dev
      schema: "dbt_{{ env_var('DBT_USER', 'dev') }}"
      threads: 4
    prod:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      password: "{{ env_var('SNOWFLAKE_PASSWORD') }}"
      role: transformer_prod
      database: prod_db
      warehouse: wh_etl
      schema: analytics
      threads: 8
```

Rules:

- Never hardcode credentials in profiles
- Use personal schemas in development (`dbt_yourname`)
- Use environment variables for all secrets

---

## Golden Rules

- One model per source table in `stg/`
- No business logic in `stg/` — only technical cleanup
- `ref()` and `source()` always — never hardcode table names
- Every model has a corresponding `_schema.yml` entry with at least one test
- Tags are applied at model level, not only at folder level
- Secrets never in version control

---

## Summary

A well-structured dbt project provides:

- **Predictable layer boundaries**: each layer has a single responsibility
- **Consistent naming**: file names communicate layer, source, and entity
- **Documented models**: `_schema.yml` files accompany every model folder
- **Testable transformations**: tests defined alongside model definitions
