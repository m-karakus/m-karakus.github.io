---
id: powerbi-large-dataset
title: Scaling Power BI for Large Datasets
displayText: How we scaled a Power BI model from 50M to 500M rows
tags: [case-study,powerbi,performance,analytics]
---

# Case Study: Scaling Power BI for Large Datasets

## Background

A retail analytics team managed a Power BI model that started at ~50M rows. Over 18 months, the dataset grew to 500M rows as new data sources and historical backfill were added. Import refresh times grew from 45 minutes to over 8 hours, and the model frequently exceeded the 10 GB Premium capacity limit.

---

## Problem Statement

### Symptoms

- Dataset refresh failing after 8+ hours
- Model size exceeding 10 GB (Premium P1 limit)
- Report render times degraded from 3 seconds to 25+ seconds
- Scheduled refresh conflicts due to long refresh windows

### Root Cause Analysis

Using the VertiPaq Analyzer:

1. Three string columns had cardinality > 5M distinct values
2. A flat, denormalized table contained 80+ columns — most unused in reports
3. Import mode was used for a fact table that had over 30 daily refresh updates
4. Auto date/time was enabled, creating 12 hidden date tables

---

## Architecture Before

```
Snowflake Warehouse
    ↓ Full Import (all 500M rows)
Power BI Dataset (flat table, 80 columns)
    ↓
Reports (12 pages, 120+ visuals)
```

---

## Architecture After

```
Snowflake Warehouse
    ├── Aggregation layer (pre-computed daily summaries)
    │       ↓ Full Import (5M rows)
    └── Fact table (500M rows)
            ↓ Incremental Refresh (rolling 2-year window)
Power BI Dataset (star schema, 22 columns in fact)
    ↓
Reports (8 pages, optimized visuals)
```

---

## Changes Made

### 1. Implemented Incremental Refresh

Incremental refresh loads only new or modified rows based on a date filter, replacing full imports.

Configuration in Power BI:

```
Store rows in the last: 2 Years
Refresh rows in the last: 7 Days
```

Power Query required `RangeStart` and `RangeEnd` parameters:

```powerquery
= Table.SelectRows(Source, each [order_date] >= RangeStart and [order_date] < RangeEnd)
```

Result: refresh time dropped from 8+ hours to 35 minutes.

---

### 2. Removed Unused Columns

A column audit was performed by cross-referencing all columns in the model against all DAX measures, report visuals, slicers, and filters.

Before: 80 columns in the fact table
After: 22 columns in the fact table

VertiPaq Analyzer showed that 58 removed columns accounted for 3.1 GB of model storage.

---

### 3. Replaced Flat Table with Star Schema

The flat denormalized import table was replaced with a proper star schema sourced from a Snowflake mart layer:

```
dim_customer (200K rows, Import)
dim_product  (80K rows, Import)
dim_date     (3650 rows, Import)
fct_orders   (500M rows, Incremental Refresh)
```

Relationships use integer surrogate keys.

---

### 4. Created Aggregation Tables

A pre-aggregated daily summary table was added in Snowflake and imported into Power BI as an aggregation:

```sql
-- Snowflake aggregation view
CREATE VIEW agg_daily_orders AS
SELECT
    order_date,
    product_id,
    customer_segment,
    sum(revenue)     as revenue_total,
    count(order_id)  as order_count
FROM fct_orders
GROUP BY order_date, product_id, customer_segment;
```

In Power BI, the aggregation was configured to route high-level queries to `agg_daily_orders` and only drill-through queries to the full `fct_orders` table.

Result: 95% of dashboard queries hit the 5M-row aggregation instead of the 500M-row fact table.

---

### 5. Disabled Auto Date/Time

12 hidden date tables were discovered via VertiPaq Analyzer, consuming 800 MB.

Steps:

1. File → Options → Current File → Data Load → Disable auto date/time
2. Added a proper `dim_date` table
3. Reconnected all date relationships

---

### 6. Replaced High-Cardinality Calculated Columns

Three calculated columns with millions of distinct string values were removed:

| Column | Before | After |
| ------ | ------ | ----- |
| `full_address` | Calculated column (5M distinct) | Removed (not used in any filter) |
| `order_reference` | Calculated column (500M distinct) | Moved to drill-through only (degenerate dim) |
| `customer_label` | Calculated column | Replaced with DAX measure using `SELECTEDVALUE` |

---

## Results

| Metric | Before | After |
| ------ | ------ | ----- |
| Model size | 11.2 GB | 3.4 GB |
| Refresh duration | 8+ hours | 35 minutes |
| Dashboard render time | 25+ seconds | 2–4 seconds |
| Daily refresh failures | 3–4 per week | 0 |
| Hidden date tables | 12 | 0 |

---

## Lessons Learned

### Most Impactful Changes (in order)

1. **Incremental refresh** — eliminated the longest part of refresh time
2. **Aggregation tables** — eliminated most full fact table scans
3. **Removing unused columns** — single biggest model size reduction
4. **Star schema** — improved query efficiency and relationship clarity

---

### What to Do Differently from the Start

- Never import a flat table with more than 20 columns into Power BI
- Enable incremental refresh before the dataset reaches 50M rows
- Build aggregation tables in the warehouse, not in Power BI DAX
- Disable auto date/time on every new model, immediately

---

## Checklist for Large Dataset Models

- [ ] Incremental refresh configured with `RangeStart` / `RangeEnd`
- [ ] Unused columns removed before publishing
- [ ] Star schema sourced from warehouse mart layer
- [ ] Aggregation tables defined for high-level queries
- [ ] Auto date/time disabled
- [ ] Integer surrogate keys used for all relationships
- [ ] Model size validated in VertiPaq Analyzer before each publish
- [ ] Refresh scheduled outside business hours

---

## Summary

Scaling Power BI to 500M rows is achievable with the right architecture. The key insight was that the problem was never the row count — it was the missing star schema, unnecessary columns, and absence of incremental refresh and aggregation.

Model design quality determines whether Power BI can scale. Hardware and capacity are secondary.
