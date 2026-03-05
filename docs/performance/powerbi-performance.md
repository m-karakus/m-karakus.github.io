---
id: powerbi-performance
title: Power BI Performance Tuning
displayText: Diagnosing and fixing slow Power BI reports
tags: [performance,powerbi,analytics]
---

# Power BI Performance Tuning

Slow Power BI reports are almost always caused by model design problems, not hardware. This document covers diagnostic tools and fixes for common performance issues.

---

## Performance Layers

Power BI performance issues occur at three layers:

| Layer | Problem Examples |
| ----- | ---------------- |
| **Data model** | Flat tables, bidirectional relationships, high-cardinality columns |
| **DAX measures** | Inefficient calculations, missing CALCULATE context |
| **Visual / report** | Too many visuals per page, high-cardinality slicers |

Diagnose before fixing. Most issues are in the data model.

---

## Diagnostic Tools

### Performance Analyzer

Built into Power BI Desktop:

1. View → Performance Analyzer → Start Recording
2. Interact with the report
3. Expand each visual to see:
   - **DAX query duration**: time spent in the formula engine
   - **Visual display**: time spent rendering
   - **Other**: everything else

High DAX query times → optimize DAX or model.
High visual display times → reduce visual complexity.

---

### DAX Studio

Free external tool for DAX analysis.

Key features:

- Run and profile arbitrary DAX queries
- View query plans
- Measure `Storage Engine` vs `Formula Engine` time
- Server timings for every query

Install from: [daxstudio.org](https://daxstudio.org)

---

### VertiPaq Analyzer

Shows column-by-column storage statistics.

Useful for:

- Finding oversized columns
- Identifying high-cardinality text columns
- Measuring total model size

---

## Data Model Optimizations

### Remove Unused Columns

Every imported column consumes memory.

Before publishing:

- Remove columns not used in any measure, filter, or visual
- Use Power Query to drop unnecessary columns at source

---

### Use Integer Keys for Relationships

```
-- Slow: string relationship
dim_customer[customer_id] (String) → fct_orders[customer_id] (String)

-- Fast: integer relationship
dim_customer[customer_sk] (Int64) → fct_orders[customer_sk] (Int64)
```

Integer comparisons are significantly faster than string comparisons in VertiPaq.

---

### Disable Auto Date/Time

Power BI creates hidden date tables for every date column when auto date/time is enabled.

This inflates model size and creates ambiguity.

Disable globally:

```
File → Options → Data Load → Disable Auto date/time for new files
```

Use an explicit `dim_date` table instead.

---

### Avoid Bidirectional Relationships

Bidirectional cross-filtering:

- Creates ambiguous filter propagation
- Degrades query performance
- Causes unpredictable results

Fix: use `CROSSFILTER` in specific measures instead of enabling it on the relationship.

---

### Replace Calculated Columns with Measures

Calculated columns:

- Stored in memory
- Inflate model size
- Cannot be optimized away

Measures:

- Computed on demand
- Respect filter context
- No storage cost

Replace calculated column aggregations with measures.

---

## DAX Optimizations

### Avoid Row Context Iteration in Large Tables

```dax
-- Slow: iterates every row of a large table
Slow Measure = SUMX(fct_orders, fct_orders[revenue] * fct_orders[quantity])

-- Fast: use pre-computed column or simpler aggregation
Fast Measure = SUM(fct_orders[revenue_total])
```

Use `SUMX` and `AVERAGEX` only when iteration is genuinely necessary.

---

### Use Variables to Avoid Recalculation

```dax
-- Slow: [Total Revenue] calculated twice
Margin % = DIVIDE([Revenue Net], [Total Revenue]) * DIVIDE(1, [Total Revenue])

-- Fast: calculate once with VAR
Margin % =
VAR rev = [Total Revenue]
RETURN DIVIDE([Revenue Net], rev)
```

---

### Avoid Using ALL on Large Tables

```dax
-- Expensive: removes all filters from a large fact table
Market Share = DIVIDE([Revenue], CALCULATE([Revenue], ALL(fct_orders)))

-- Better: remove filter only from specific column
Market Share = DIVIDE([Revenue], CALCULATE([Revenue], ALL(dim_product[category])))
```

Minimize the scope of `ALL` and `ALLEXCEPT`.

---

### Prefer SELECTEDVALUE over VALUES

```dax
-- Risky: throws error when multiple values selected
Wrong = VALUES(dim_date[year])

-- Safe: returns blank when multiple values selected
Correct = SELECTEDVALUE(dim_date[year])
```

---

## Report-Level Optimizations

### Reduce Visuals Per Page

Each visual generates one or more DAX queries at render time.

Guideline:

- Fewer than 8–10 visuals per page for interactive dashboards
- Use bookmarks and page navigation to hide unused visuals

---

### Avoid High-Cardinality Slicers

Slicers with many values (e.g., individual order IDs, emails) cause:

- Slow slicer rendering
- Full model scan on interaction

Replace with search slicers or pre-defined filter groups.

---

### Use Aggregation Tables for Large DirectQuery Models

For DirectQuery models with billions of rows:

- Create pre-aggregated import tables
- Define aggregations in Power BI Desktop
- Power BI routes queries to aggregations automatically

---

## Model Size Targets

| Model Size | Assessment |
| ---------- | ---------- |
| < 300 MB | Good |
| 300 MB – 1 GB | Review unused columns |
| > 1 GB | Significant optimization needed |
| > 3 GB | Consider Premium capacity or architecture change |

---

## Summary

Power BI performance checklist:

- [ ] Performance Analyzer used to identify slow visuals
- [ ] DAX Studio used to profile expensive measures
- [ ] Unused columns removed from model
- [ ] Integer keys used for all relationships
- [ ] Auto date/time disabled
- [ ] No bidirectional relationships
- [ ] Calculated columns replaced with measures where possible
- [ ] `VAR` used in complex DAX to avoid recalculation
- [ ] Visuals per page minimized
- [ ] High-cardinality slicers removed or replaced

---

## Related Docs

- [Power BI Semantic Model](../data-modeling/powerbi-semantic-model.md) — star schema design, DAX measure patterns
- [Power BI Architecture](../analytics/powerbi-architecture.md) — dataset modes, workspace topology, shared datasets
- [Power BI Incremental Refresh](../tooling/powerbi/incremental-refresh.md) — reducing refresh time for large models
- [Case Study: Scaling Power BI for Large Datasets](../case-studies/powerbi-large-dataset.md) — real-world 500M row optimization
