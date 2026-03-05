---
id: powerbi-incremental-refresh
title: Power BI Incremental Refresh
displayText: Configuring incremental refresh for large Power BI datasets
tags: [tooling,powerbi,performance]
---

# Power BI Incremental Refresh

Incremental refresh replaces full dataset imports with targeted refreshes of recent data only. It is the most impactful optimization for large Power BI datasets.

---

## Why Incremental Refresh

Without incremental refresh:

- Every refresh imports the entire dataset from scratch
- Refresh time grows proportionally with data volume
- Historical data that never changes is re-imported repeatedly
- Premium capacity memory pressure increases with dataset size

With incremental refresh:

- Only new or modified rows are refreshed
- Historical partitions are preserved without re-processing
- Refresh times remain constant as the dataset grows
- Enables datasets larger than the normal import limit

---

## How It Works

Power BI divides the data into **partitions** based on a date column.

```
2022-H1  [archived — never refreshed]
2022-H2  [archived — never refreshed]
2023     [historical — never refreshed]
2024-Q1  [historical — never refreshed]
2024-Q2  [historical — never refreshed]
2024-Q3  [historical — never refreshed]
2024-Oct [recent — refreshed on schedule]
2024-Nov [recent — refreshed on schedule]
2024-Dec [current — refreshed on schedule]
```

Each refresh only processes the "recent" window, not the full history.

---

## Prerequisites

- Power BI Premium, Premium Per User (PPU), or Pro license with Premium workspace
- Data source must support query folding (Snowflake, Synapse, BigQuery, ClickHouse via ODBC, etc.)
- Date column available with consistent, reliable values

---

## Step-by-Step Configuration

### Step 1: Create RangeStart and RangeEnd Parameters

In Power Query Editor, create two parameters:

| Parameter | Type | Suggested Value |
| --------- | ---- | --------------- |
| `RangeStart` | Date/Time | `1/1/2020 12:00:00 AM` |
| `RangeEnd` | Date/Time | `1/1/2025 12:00:00 AM` |

These are replaced automatically by Power BI during refresh. The initial values are only used during development.

---

### Step 2: Filter the Date Column in Power Query

Apply a filter using `RangeStart` and `RangeEnd` to the date column:

```powerquery
= Table.SelectRows(
    Source,
    each [order_date] >= RangeStart and [order_date] < RangeEnd
)
```

**Critical**: This filter must fold to the data source query. If it does not fold, incremental refresh will not work correctly — Power BI will pull all data and filter locally.

Verify query folding by right-clicking the step in Power Query and checking if "View Native Query" is available.

---

### Step 3: Configure Incremental Refresh Policy

Right-click the table in the Fields pane → Incremental Refresh:

```
Store rows in the last: [2 Years]
Refresh rows in the last: [7 Days]
```

Optional settings:

- **Get the latest data in real time with DirectQuery**: enables hybrid mode (Import + DirectQuery for the most recent partition)
- **Detect data changes**: uses a timestamp column to only refresh partitions where data has changed

---

### Step 4: Publish to Premium Workspace

Incremental refresh partitions are only created when the dataset is published to a Premium or PPU workspace.

After publishing:

1. Perform a full refresh — this creates all historical partitions
2. Subsequent scheduled refreshes will only process the rolling window

---

## Verifying Partitions

After publishing, use XMLA endpoint to inspect partitions in SSMS or Tabular Editor:

Alternatively, check the refresh history in the Power BI service — incremental refreshes show much shorter durations than the initial full refresh.

---

## Rolling Window Examples

### Daily Reporting Dataset

```
Store rows in the last: 3 Years
Refresh rows in the last: 3 Days
```

Keeps 3 years of data. Only the last 3 days are refreshed on each run.

---

### Near-Real-Time with Hybrid Mode

```
Store rows in the last: 2 Years
Refresh rows in the last: 1 Day
Enable real-time with DirectQuery: ON
```

Historical data served from Import (fast). Today's data served from DirectQuery (live).

---

## Common Issues

### Query Folding Not Working

Symptom: Refresh is as slow as a full import despite incremental refresh being configured.

Cause: The `RangeStart`/`RangeEnd` filter does not fold to the source query.

Fix:
- Ensure the date column type in Power Query matches the parameter type (both `DateTime`)
- Place the date filter step immediately after the source step
- Avoid transformations between the source and the filter that break folding

---

### Type Mismatch

Symptom: Refresh error mentioning type conversion.

Fix: Ensure `RangeStart` and `RangeEnd` parameter types match the date column type in the source table.

```powerquery
-- If the source column is Date (not DateTime), cast the parameters:
= Table.SelectRows(
    Source,
    each [order_date] >= Date.From(RangeStart) and [order_date] < Date.From(RangeEnd)
)
```

---

### Full Refresh Overrides Incremental Refresh

A manual full refresh from the Power BI service will re-create all partitions from scratch. This is expected behavior.

Scheduled refreshes will use incremental logic. Manual refreshes with the "full refresh" option selected will not.

---

## Detect Data Changes

To avoid refreshing partitions that have not changed, enable **Detect data changes**:

- Requires a `last_modified` or `updated_at` column in the source table
- Power BI checks this column to determine which partitions contain new data
- Only modified partitions are refreshed

```powerquery
-- The polling expression in Power Query:
= List.Max(fct_orders[updated_at])
```

---

## Summary

Incremental refresh configuration checklist:

- [ ] `RangeStart` and `RangeEnd` parameters created (type: `Date/Time`)
- [ ] Date filter applied using these parameters in Power Query
- [ ] Query folding verified (Native Query available)
- [ ] Retention and refresh window configured appropriately
- [ ] Dataset published to Premium or PPU workspace
- [ ] Initial full refresh completed
- [ ] Subsequent refresh durations significantly shorter than full refresh

---

## Related Docs

- [Power BI Performance Tuning](../../performance/powerbi-performance.md) — model size, DAX optimization, visual-level fixes
- [Power BI Semantic Model](../../data-modeling/powerbi-semantic-model.md) — star schema and relationship design
- [Power BI Architecture](../../analytics/powerbi-architecture.md) — dataset modes, Premium capacity, workspace topology
- [Case Study: Scaling Power BI for Large Datasets](../../case-studies/powerbi-large-dataset.md) — real-world incremental refresh implementation
