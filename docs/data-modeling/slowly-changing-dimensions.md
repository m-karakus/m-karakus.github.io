---
id: slowly-changing-dimensions
title: Slowly Changing Dimensions (SCD)
displayText: Tracking historical changes in dimension attributes
tags: [data-modeling,scd,dimensional,dwh]
---

# Slowly Changing Dimensions (SCD)

**Slowly Changing Dimensions (SCD)** handle the problem of dimension attributes that change over time. The chosen SCD type determines how historical values are preserved or overwritten.

---

## Why SCD Matters

Dimension attributes are not static.

Examples of changing attributes:

- Customer changes their address
- Product is reassigned to a different category
- Employee changes department

Without an SCD strategy, historical analysis is inaccurate because past fact rows reflect current dimension values instead of values at the time of the event.

---

## SCD Type 0 — Retain Original

The dimension attribute **never changes** after initial load.

Use when:

- The attribute is immutable by definition (e.g., date of birth, original signup channel)
- Historical preservation is not needed

---

## SCD Type 1 — Overwrite

The old value is **overwritten with the new value**. No history is retained.

| Before | After |
| ------ | ----- |
| customer_city = "Istanbul" | customer_city = "Ankara" |

Use when:

- The old value is incorrect (data quality fix)
- Historical accuracy of this attribute is not required
- Simplicity is more important than history

Drawback:

- Past fact rows now reflect the updated attribute value, not the value at event time

---

## SCD Type 2 — Add New Row

A **new row is added** for every change. The old row is marked as expired.

| customer_sk | customer_id | city | is_current | valid_from | valid_to |
| ----------- | ----------- | ---- | ---------- | ---------- | -------- |
| 1 | 100 | Istanbul | false | 2020-01-01 | 2023-06-14 |
| 2 | 100 | Ankara | true | 2023-06-15 | 9999-12-31 |

Characteristics:

- Fact rows retain the surrogate key valid at the time of the event
- Full history is preserved
- Requires surrogate key on the dimension table

Use when:

- Historical accuracy is required
- Reports must reflect "what was true at the time"

This is the **most common SCD type** in data warehouses.

---

### SCD Type 2 in dbt with Snapshots

```yaml
{% snapshot dim_customer_snapshot %}

{{
  config(
    target_schema='snapshots',
    unique_key='customer_id',
    strategy='check',
    check_cols=['city', 'segment', 'email'],
    invalidate_hard_deletes=True
  )
}}

select * from {{ source('crm', 'customers') }}

{% endsnapshot %}
```

dbt's `snapshot` block handles:

- Row versioning with `dbt_valid_from` and `dbt_valid_to`
- Surrogate key generation per version
- Current row flagging via `dbt_valid_to IS NULL`

---

## SCD Type 3 — Add New Column

A **new column is added** to track the previous value alongside the current value.

| customer_id | current_city | previous_city |
| ----------- | ------------ | ------------- |
| 100 | Ankara | Istanbul |

Use when:

- Only one level of history is needed
- The transition itself is analytically relevant

Limitation:

- Only one historical value is preserved
- Does not support full history

---

## SCD Type Comparison

| Type | History Retained | Storage Impact | Complexity | Common Use |
| ---- | ---------------- | -------------- | ---------- | ---------- |
| Type 0 | None (immutable) | Minimal | Low | Immutable attributes |
| Type 1 | None (overwrite) | Minimal | Low | Data corrections |
| Type 2 | Full history | High | High | Most dimension changes |
| Type 3 | One previous value | Low | Medium | Limited history needed |

---

## Choosing the Right SCD Type

Ask these questions:

1. **Does this attribute need historical accuracy in reports?** → Yes → Type 2
2. **Is this a data correction, not a real change?** → Yes → Type 1
3. **Is the attribute immutable by definition?** → Yes → Type 0
4. **Is one level of history sufficient?** → Yes → Type 3

Most dimension attributes in a production warehouse use Type 2.

---

## Handling SCD Type 2 in Fact Tables

When loading facts, join to the dimension using the surrogate key valid at event time:

```sql
select
    f.order_id,
    d.customer_sk
from fct_orders_raw f
join dim_customer_snapshot d
    on f.customer_id = d.customer_id
    and f.order_date between d.dbt_valid_from and coalesce(d.dbt_valid_to, current_date)
```

This ensures each fact row captures the dimension state at the moment of the event.

---

## Hard Deletes

When a dimension record is deleted from the source:

- **Without handling**: the dimension row remains as current forever
- **With `invalidate_hard_deletes=True`** (dbt snapshots): the row is closed out with a `dbt_valid_to` timestamp

Always enable hard delete handling in SCD Type 2 snapshots.

---

## Golden Rules

- SCD Type 2 is the default for dimension history
- Always use surrogate keys — never join facts on natural keys in Type 2
- Document which SCD type is applied per dimension
- Separate snapshot models from mart dimension models
- Test `is_current` and date range validity after each load

---

## Summary

SCD strategies ensure that historical analysis reflects the state of the world at the time events occurred.

Without proper SCD handling, every historical report is potentially inaccurate.

Type 2 provides the most complete historical record and is the standard for production data warehouses.

---

## Related Docs

- [Dimensional Modeling](./dimensional-modeling.md) — star schema, surrogate keys, conformed dimensions
- [Fact Table Design](./fact-table-design.md) — joining facts to Type 2 dimensions correctly
- [dbt Project Structure](../tooling/dbt/dbt-project-structure.md) — where snapshots live in the project layout
- [dbt Testing Strategy](../tooling/dbt/dbt-testing-strategy.md) — testing `is_current` and date range validity
