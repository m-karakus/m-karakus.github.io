---
id: powerbi-architecture
title: Power BI Architecture Patterns
displayText: Structuring Power BI for scale and maintainability
tags: [analytics,powerbi,architecture]
---

# Power BI Architecture Patterns

This document covers **architectural patterns for enterprise Power BI deployments**, including workspace organization, dataset strategy, and gateway configuration.

---

## Core Architecture Decisions

Every Power BI deployment requires decisions on:

- Import vs DirectQuery vs Composite mode
- Single vs multi-workspace topology
- Shared dataset strategy
- Gateway architecture for on-premise sources

---

## Dataset Modes

### Import Mode

Data is loaded into Power BI's in-memory engine (VertiPaq).

Best for:

- Tables under 1 GB compressed
- High query performance requirements
- Aggregated or pre-modeled data from a warehouse

Limitations:

- Refresh latency (not real-time)
- Storage limits per dataset
- Full or incremental refresh required

---

### DirectQuery Mode

Queries are sent directly to the source database at report render time.

Best for:

- Real-time or near-real-time requirements
- Very large datasets that cannot be imported
- When data residency restrictions apply

Limitations:

- Slower query performance
- Limited DAX functionality
- Source database must handle concurrent load

---

### Composite Mode

Combines Import and DirectQuery tables in one model.

Best for:

- Large fact tables in DirectQuery + small dimensions in Import
- Hybrid latency requirements

Recommended pattern:

```
dim_* tables → Import (fast slicing)
fct_* tables → DirectQuery (freshness)
```

---

## Workspace Topology

### Single Workspace (Small Teams)

Suitable for:

- Teams under 10 report consumers
- Single domain or department
- Simple access control requirements

---

### Multi-Workspace (Enterprise)

Recommended pattern:

```
[Dev Workspace]   → Development and testing
[UAT Workspace]   → Stakeholder validation
[Prod Workspace]  → Published reports
[Shared Datasets] → Certified shared semantic models
```

Benefits:

- Promotes separation of concerns
- Enables dataset reuse across reports
- Supports proper promotion lifecycle

---

## Shared Dataset Strategy

### Why Shared Datasets

Without shared datasets:

- Each report reimplements the same business logic
- Metric definitions diverge over time
- Governance becomes impossible at scale

With shared datasets:

- One certified dataset per domain
- Reports connect via Live Connection
- Business logic is centralized and versioned

---

### Certification Workflow

```
Developer creates dataset
  → Data owner reviews definitions
  → Admin certifies dataset
  → Consumers connect reports via Live Connection
```

Only **certified** datasets should be used in production reports.

---

## Gateway Architecture

### On-Premise Data Gateway

Required when:

- Source data is behind a corporate firewall
- DirectQuery is used against on-prem databases
- Scheduled refresh pulls from on-prem sources

Deployment recommendations:

- Run gateway on a **dedicated machine**, not a developer workstation
- Use a **service account**, not a personal account
- Monitor gateway health via Power BI admin portal

---

### Gateway Cluster

For high availability:

- Deploy 2+ gateway nodes in a cluster
- Enables load balancing and failover
- Required for production enterprise deployments

---

## Deployment Pipeline

Power BI Deployment Pipelines automate promotion across environments:

```
Development → Test → Production
```

Key rules:

- Never edit production datasets directly
- All changes flow through the pipeline
- Use parameter substitution for environment-specific connections

---

## Row-Level Security (RLS)

RLS restricts data access within a dataset based on user identity.

Static RLS example:

```dax
[country] = "TR"
```

Dynamic RLS example:

```dax
[email] = USERPRINCIPALNAME()
```

Rules:

- RLS must be tested before publishing
- Never rely on report-level filtering as a security mechanism
- Document RLS roles in the dataset metadata

---

## Performance Design Rules

- Avoid calculated columns when measures suffice
- Use star schema, not flat tables
- Disable auto date/time tables
- Limit visuals per page to reduce render load
- Use aggregation tables for large DirectQuery models

---

## Summary

Enterprise Power BI architecture requires:

- Deliberate dataset mode selection based on size and latency
- Multi-workspace topology for proper lifecycle management
- Shared, certified datasets to enforce consistent business logic
- Gateway clusters for reliable on-premise connectivity
- Deployment pipelines to automate environment promotion
