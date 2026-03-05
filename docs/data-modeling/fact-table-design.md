---
id: fact-table-design
title: Fact Table Design
displayText: Designing robust and performant fact tables
tags: [data-modeling,fact-table,dwh]
---

# Fact Table Design

Fact tables are the **core of any dimensional model**. Their design directly impacts query performance, storage efficiency, and analytical flexibility.

---

## Fact Table Types

### Transaction Fact Tables

One row per discrete event at the moment it occurs.

- Most common type
- Highest granularity
- Append-only

Example:

```
fct_orders — one row per order line item placed
fct_clicks — one row per ad click event
```

---

### Periodic Snapshot Fact Tables

One row per entity per time period, capturing state at regular intervals.

- Rows accumulate over time
- Enables trend analysis
- Does not replace transaction facts

Example:

```
fct_daily_account_balance — one row per account per day
fct_monthly_inventory — one row per SKU per month
```

---

### Accumulating Snapshot Fact Tables

One row per entity tracking progress through a pipeline or workflow.

- Row is **updated** as stages complete
- Contains multiple date foreign keys
- Used for process time analysis

Example:

```
fct_order_pipeline — one row per order
  order_date_key
  payment_date_key
  shipment_date_key
  delivery_date_key
```

---

## Grain Definition

The grain must be established before any column is added.

Ask:

> What real-world event or state does one row represent?

Wrong approach:

- "A row is a sale" (vague)

Correct approach:

- "One row per order line item, per day" (precise)

Once the grain is set, **every column must be consistent with that grain**.

---

## Mandatory Columns

### Surrogate Key

Every fact table should have a surrogate key for deduplication and incremental merge operations.

```sql
{{ dbt_utils.generate_surrogate_key(['order_id', 'line_item_id']) }} as order_line_sk
```

---

### Foreign Keys to Dimensions

All foreign keys reference dimension surrogate keys:

```sql
customer_sk    BIGINT,    -- FK to dim_customer
product_sk     BIGINT,    -- FK to dim_product
date_key       INT,       -- FK to dim_date
store_sk       BIGINT     -- FK to dim_store
```

---

### Measures

Additive measures are preferred:

| Type | Description | Example |
| ---- | ----------- | ------- |
| **Additive** | Can be summed across all dimensions | `revenue`, `quantity` |
| **Semi-additive** | Can be summed across some dimensions | `account_balance` (not across time) |
| **Non-additive** | Cannot be meaningfully summed | `unit_price`, `ratio` |

Store additive components, not derived ratios:

```sql
-- Preferred: store components
revenue_gross,
discount_amount,
revenue_net

-- Avoid: storing derived ratio in fact
gross_margin_pct  -- compute this in BI
```

---

### Technical Columns

| Column | Type | Description |
| ------ | ---- | ----------- |
| `etl_date` | DATE | Partition key for incremental processing |
| `etl_time` | TIMESTAMP | Load timestamp |
| `row_hash` | BIGINT | Change detection and merge key |

---

## Null Handling in Fact Tables

Foreign key NULLs should reference a **"Not Applicable" or "Unknown" dimension row**, not be left as NULL.

```sql
-- In dim_customer, add a special row:
customer_sk = -1, customer_name = 'Unknown'

-- In fct_orders:
coalesce(customer_sk, -1) as customer_sk
```

This avoids filtering problems in BI tools.

Measure NULLs:

- Use `0` where a null measure is meaningfully zero
- Preserve NULL where the absence of data is meaningful

---

## Partitioning Strategy

Partition fact tables by the primary time dimension:

```sql
PARTITION BY etl_date
```

Rules:

- Daily partitioning is the default
- Match partition key to the most common filter in queries
- Avoid high-cardinality partition keys (e.g., `timestamp` instead of `date`)

---

## Incremental Loading Pattern

Fact tables are loaded incrementally using a sliding window:

```sql
{% if is_incremental() %}
where etl_date >= (
  select dateadd(day, -2, max(etl_date)) from {{ this }}
)
{% endif %}
```

The 2-day buffer handles:

- Late-arriving events
- Reprocessed batches
- Source system corrections

---

## Additive vs Non-Additive Design

Example: Avoid storing percentages in fact tables.

```sql
-- Wrong: stores non-additive ratio
discount_pct DECIMAL(5,2)

-- Correct: store additive components
discount_amount DECIMAL(10,2),
original_price  DECIMAL(10,2)
-- Then compute discount_pct = discount_amount / original_price in BI
```

---

## Fact Table Checklist

Before finalizing a fact table design:

- [ ] Grain is defined and documented
- [ ] All measures are additive or semi-additive
- [ ] No derived ratios or percentages stored
- [ ] All foreign keys reference dimension tables
- [ ] NULL foreign keys use -1 / unknown dimension row
- [ ] `row_hash` or surrogate key defined for merging
- [ ] Partitioned by date
- [ ] Incremental strategy with buffer defined

---

## Summary

Well-designed fact tables are:

- **Narrow and deep** — few columns, many rows
- **Additive** — measures sum correctly across all dimensions
- **Grain-consistent** — every column belongs to the declared grain
- **Incrementally loaded** — with a buffer for late-arriving data

The quality of fact table design determines the reliability of every downstream report.

---

## Related Docs

- [Dimensional Modeling](./dimensional-modeling.md) — star schema fundamentals, surrogate keys, conformed dimensions
- [Slowly Changing Dimensions](./slowly-changing-dimensions.md) — handling historical changes in dimension tables
- [dbt Testing Strategy](../tooling/dbt/dbt-testing-strategy.md) — testing surrogate keys, foreign keys, and measure ranges
- [Warehouse Standards](../architecture/warehouse-standards.md) — incremental strategy and layer materialization rules
