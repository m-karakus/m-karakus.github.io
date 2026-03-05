---
id: powerbi-semantic-model
title: Power BI Semantic Model Design
displayText: Building a robust semantic model in Power BI
tags: [data-modeling,powerbi,semantic-layer]
---

# Power BI Semantic Model Design

The **Power BI semantic model** (formerly called a dataset) is the layer between raw data and reports. A well-designed semantic model determines report performance, metric consistency, and maintainability.

---

## What Is a Semantic Model?

A Power BI semantic model contains:

- Imported or connected tables
- Relationships between tables
- Measures (DAX calculations)
- Hierarchies
- Row-Level Security (RLS) definitions

It is the single source of truth for all reports built on top of it.

---

## Model Architecture

### Star Schema Is Mandatory

Power BI's VertiPaq engine is optimized for star schemas.

```
dim_customer ──┐
dim_product  ──┤── fct_orders
dim_date     ──┤
dim_store    ──┘
```

Rules:

- Fact tables are wide and contain measures
- Dimension tables are narrow and contain attributes
- Never use flat, denormalized mega-tables
- Avoid many-to-many relationships whenever possible

---

### Relationship Direction

| Pattern | Recommendation |
| ------- | -------------- |
| Dimension → Fact | Single direction (default) |
| Bidirectional | Avoid unless absolutely necessary |
| Many-to-many | Resolve with a bridge table |

Bidirectional cross-filtering creates ambiguous filter propagation and degrades performance.

---

## Measures vs Calculated Columns

This is the most important design decision in DAX modeling.

### Measures

- Calculated at query time
- Respect filter context
- Do not consume storage
- **Preferred for aggregations**

```dax
Total Revenue = SUM(fct_orders[revenue_gross])
```

---

### Calculated Columns

- Calculated at refresh time
- Stored in the model (increase model size)
- Do not respect filter context
- **Use only for row-level attributes**

```dax
-- Acceptable: row-level classification
order_size_bucket = IF(fct_orders[quantity] > 10, "Large", "Small")

-- Wrong: aggregation as calculated column
-- total_revenue_column = SUM(fct_orders[revenue_gross]) -- never do this
```

---

## Date Table Requirements

Power BI requires a proper date table for time intelligence functions.

Requirements:

- Contiguous date range covering all fact table dates
- Mark the table as a **date table** in Power BI
- Relate to fact tables using the date key column

Minimum columns:

```
date_key, full_date, year, quarter, month_num, month_name,
week_of_year, day_of_week, day_name, is_weekend
```

Disable auto date/time in Power BI settings to prevent hidden date tables from inflating model size.

---

## Measure Organization

### Measure Tables

Organize all measures in a dedicated empty measure table:

```
[_Measures]        -- empty table, contains all measures
  ├── Revenue Measures
  ├── Order Measures
  └── Customer Measures
```

Benefits:

- Measures are easy to find and maintain
- Keeps fact tables clean
- Enables display folder organization

---

### Display Folders

Group related measures with display folders:

```dax
Total Revenue = SUM(fct_orders[revenue_gross])
-- Display Folder: "Revenue"

YoY Revenue Growth % = DIVIDE([Total Revenue], [Total Revenue LY]) - 1
-- Display Folder: "Revenue\Growth"
```

---

## DAX Patterns

### Time Intelligence

Always use the `CALCULATE` + time intelligence function pattern:

```dax
Total Revenue LY =
CALCULATE(
    [Total Revenue],
    SAMEPERIODLASTYEAR(dim_date[full_date])
)

Revenue MTD =
CALCULATE(
    [Total Revenue],
    DATESMTD(dim_date[full_date])
)
```

---

### Safe Division

Always use `DIVIDE` to avoid division-by-zero errors:

```dax
-- Wrong
Margin % = [Revenue Net] / [Revenue Gross]

-- Correct
Margin % = DIVIDE([Revenue Net], [Revenue Gross], 0)
```

---

### Filter Context Awareness

Use `HASONEVALUE` or `SELECTEDVALUE` for conditional measures:

```dax
Dynamic Label =
IF(
    HASONEVALUE(dim_date[year]),
    SELECTEDVALUE(dim_date[year]),
    "Multiple Years Selected"
)
```

---

## Performance Rules

- Import mode is preferred over DirectQuery for non-real-time models
- Remove unused columns before import
- Avoid high-cardinality text columns (e.g., free-text fields)
- Use integer keys for relationships, not string keys
- Disable auto date/time globally
- Use `SUMMARIZECOLUMNS` pattern in complex measures instead of `ADDCOLUMNS`

---

## Model Documentation Standards

Every measure must be documented with:

- **Description**: What the measure calculates
- **Formula**: The DAX logic
- **Dependencies**: Which measures it relies on
- **Owner**: Who owns the definition

Use Power BI's description field for each measure.

---

## Checklist Before Publishing

- [ ] Star schema structure verified
- [ ] All relationships are single-direction
- [ ] No bidirectional relationships without justification
- [ ] Proper date table created and marked
- [ ] Auto date/time disabled
- [ ] All measures in dedicated measure table
- [ ] `DIVIDE` used for all divisions
- [ ] Unused columns removed
- [ ] RLS roles tested
- [ ] Model size reviewed

---

## Summary

A well-designed Power BI semantic model is:

- **Star-schema based** — optimized for VertiPaq
- **Measure-driven** — business logic lives in DAX measures
- **Documented** — every metric has a clear definition
- **Governed** — RLS and certification applied

The semantic model is not just a data connection. It is the business logic layer that every report depends on.
