---
title: "MrRobot — A 24/7 AI Agent That Gets Better With Every Task"
description: "The architecture behind the autonomous agent we built for our Data Analytics department: layered memory, a self-improvement loop, measurable evals, and code-level safety gates."
slug: mrrobot-24-7-autonomous-agent
authors: [metin]
tags: [ai, agent, hermes, data-engineering]
---

# MrRobot — A 24/7 AI Agent That Gets Better With Every Task

It's 3:07 AM. The team is asleep. The nightly data pipeline just broke. Today, that error gets noticed at 9:00 AM, diagnosed by noon, and fixed by evening. The system we built instead catches the error on its own, finds the root cause, writes the fix, passes the tests, and greets the team in the morning with a single message: *"The fix is ready, all checks are green. If you approve, I will deploy."*

This post explains the logic behind that system — **MrRobot**, an agent built to handle our Data Analytics department's work end to end (analysis, report discovery, DWH/dbt/ETL development, incident triage, deployment) — how it works, what it aims for, and what it buys us.

<!-- truncate -->

## The Problem: Every Conversation Starts From Zero

Today, whenever we brief an AI on a task, we repeat ourselves:

- AI can already see our code, our tasks, and our databases; it performs many operations faster than we do.
- But every conversation starts from scratch; **experience is lost when the chat closes**.
- The system only works when someone calls it; it doesn't catch events on its own.
- Knowledge like "this report comes from the join of these three tables" or "we fixed this error this way last month" lives in someone's head, or in a buried chat history.

Our answer: not a smart-but-forgetful assistant, but a **digital teammate that learns from every task and persists what it learns**. Just as a new hire gains seniority over time, so does this system.

## The Core Idea: Intelligence Is the Model, Wisdom Is Ours

The runtime is [Hermes Agent](https://hermes-agent.nousresearch.com) — an AI harness. **Harness = the skeleton wrapping the LLM**: system prompt, memory injection, skills, tools, task delegation, cron, and a feedback loop.

```
        ┌──────────────── HARNESS (Hermes) ────────────────┐
        │  SOUL · AGENTS.md · MEMORY.md · skills · tools    │
        │                 ┌───────┐                          │
  input │ ──────────────► │  LLM  │ ──────────────►          │ output
        │                 └───────┘  delegate · cron · FTS   │
        └──────────────────────────────────────────────────┘
```

The critical distinction:

- **Intelligence = the LLM.** Interchangeable. When the model is updated or the provider changes, the system is unaffected.
- **Wisdom = harness + brain.** "This report is built from this join", "in this Sentry trace, check the worker logs first" — this lived experience **exists in no model**; it is the department's own accumulated knowledge. In our system it lives in a git-versioned repository.

Model-agnosticism is a free win: if a stronger model ships tomorrow, it does better work with the same brain, and nothing learned so far is lost.

## The Brain: Layered Memory

One giant memory file doesn't work — it bloats, becomes unreadable, and unreadable means unused. So the brain has four layers:

| Layer | When loaded | Content |
|-------|-------------|---------|
| Identity + Rules | Every session | Character, priorities, security rules |
| Summary card (MEMORY.md) | Every session, **≤ 2,200 chars** | Index of what's known + file pointers |
| Knowledge files (knowledge/) | On demand | Report recipes, table relationships, KPI glossary, project notes |
| Methods (skills/) | On demand | Workflows and runbooks from solved tasks — **written by the agent itself** |

There is also **no journal file**: past sessions are stored and full-text searchable automatically. That's how we avoid handwritten logs turning into an unreadable graveyard.

The discipline is simple: anything needed "every session" goes on the summary card; everything else goes to knowledge/skills with a one-line pointer on the card. No secrets in any layer.

## The Self-Improvement Loop

This loop is the heart of the system:

1. **A task arrives** — a Teams message, a Sentry webhook, or a scheduled cron job.
2. **It consults its memory** — its own accumulation first; if something is missing, it asks the live sources (OpenMetadata, Jira, the DWH, Sentry). The memory holds *references*, not copies — schema and lineage are queried live every time to avoid stale data.
3. **It does the work** — analysis, code, verification gate.
4. **It saves what it learned** — the working method is written automatically into `skills/`; new knowledge into `knowledge/`. Every learning is a git commit.
5. **It gets measured** — a weekly eval run; if the score drops, the latest skill diffs are the suspects → `git revert`.

The compounding effect of this loop is our core claim: by the 100th task of the same kind, resolution time drops from hours to minutes. A memoryless tool takes the same time on every job; ours speeds up after each one. And the accumulation belongs to our repository, not to the model.

## How Do You Prove "It Improved"? Measurement

Automatic learning has a serious risk: **learning the wrong thing**. Without measurement, any improvement claim is just marketing. So:

- **Golden eval set:** fixed tasks (find the report's join, triage a Sentry error, interpret a dbt test…). Each task has an input, an expected output, and a grader.
- **Grader types:** code-based (deterministic — are the expected table names in the output, does the SQL parse), model-based (rubric), and human (👍/👎 in Teams).
- **Metrics:** `pass@1`, `pass@3`, and `pass^3` for regression (three consecutive successes).
- A weekly cron runs the evals, writes the score to memory and Teams. **If the score drops, the latest learnings are reverted.** Every new skill ships with a capability eval; the existing set is kept as regression.

## Safety: Trust the Code, Not the Prompt

For an autonomous system, hoping it "doesn't break things" is not a strategy. Three layers:

1. **Verification gate (verify):** A code change doesn't even reach the approval message unless it passes lint → types → tests → secret scan. If a phase is red, it's fixed first — or reported as "I couldn't solve it, here's where I'm stuck." Unresolved work is never sent for approval.
2. **Deterministic guardrails:** A prompt rule can be forgotten; a hook/wrapper cannot. Patterns like `rm -rf /`, `DELETE` without `WHERE`, `DROP TABLE`, `terraform destroy`, or force-pushing to main are **blocked at the code level**. Anything touching production is routed to approval.
3. **Approval gate:** Production deploys and AWS access run only with human approval. Everything is logged, everything is reversible.

## Infrastructure: Zero-Trust and 24/7

The system runs as a systemd service on a central EC2 instance:

```
Teams / Sentry Webhook / Bitbucket-Jira
                 │
                 ▼
┌────────────────────────────────────────────────┐
│ CENTRAL EC2 — hermes-gateway (systemd)          │
│  brain + skills + cron + delegation             │
└───────┬────────────────────────────────────────┘
        │ sts:AssumeRole → SSM (no SSH, no static keys)
        ▼
  AWS Accounts 1..4 — EC2/Docker · S3 Data Lake · Glue
```

Key principles:

- **No static AWS keys on disk.** Access is STS AssumeRole (15–60 min temporary credentials) + SSM Session Manager tunnels. On target machines, no inbound port is open — including port 22.
- **Sentry runs on a separate VPS** with a read-only token — the event source and the diagnosing system are not the same machine.
- The central machine accepts no inbound connections (egress-only). If the server dies, the brain survives in git.
- Large jobs are split via `delegate_task` into per-task subagents; what persists is the skill, not the subagent.

## Concrete Scenarios

One pattern repeats: **the routine goes away, the decision stays.**

- 🌙 **Operations (night failure):** Today, half a day; in the target state, the system catches, diagnoses, and verifies the fix in staging — the human's contribution is one word. Incident response goes from hours to minutes.
- 📊 **Report requests:** Today, finding the right tables and definitions takes 1–2 days; in the target state, the system assembles it from the catalog and past solutions. On the second similar request, research time is zero.
- ⚙️ **Development:** Team standards (code, tests, documentation) are applied automatically; what's left for us is the review.
- 🧠 **Institutional memory:** The answer to "why is this table calculated this way?" moves from one person's head to the repository. A new hire and the system learn from the same source.

## Why This Approach?

The market is full of "AI agent" products. Three things set this one apart:

1. **The memory is ours.** Intelligence can be bought by anyone; the department's lived experience exists only in our team. The system makes it structured, searchable, and git-versioned.
2. **Learning is measured.** Automatic skill authoring + weekly evals + git revert = there is an audit trail for learning, and bad learning can be rolled back.
3. **The human sits at the decision point.** The system runs autonomously but passes through an approval gate at critical steps (production deploys, AWS access). There is a deliberate balance between autonomy and control.

## Closing

We are not reinventing the wheel: about 80% of the agent harness is off-the-shelf (Hermes). Our contribution is the brain itself — memory discipline, domain knowledge, safety gates, and measurement. The hard part is not the technology; it's the discipline: keeping memory small, measuring learning, and embedding safety in code rather than prompts.

The system is early in its journey. But the goal is clear: a teammate that takes over the routine entirely, gains a bit more seniority with every task, and stays on call overnight. The process moves step by step, and every phase has a measurable output.

Curious for more? Check the [Turkish post](/blog/mrrobot-7x24-otonom-agent) or the executive one-pagers ([EN](/blog/mrrobot-onepager-en), [TR](/blog/mrrobot-onepager-tr)).
