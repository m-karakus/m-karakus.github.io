---
title: What Is a Linter, Why Should It Run Automatically, and What Does a Pre-commit Hook Do?
description: "A short guide to what linters actually check, why manual linting inevitably fails as a discipline, and how a pre-commit hook moves that discipline from people to the workflow."
slug: linter-pre-commit-hook
authors: [metin]
tags: [devtools, vibe-coding]
---

# What Is a Linter, Why Should It Run Automatically, and What Does a Pre-commit Hook Do?

Everyone knows linting is useful. But in most teams, lint either doesn't run at all, or only runs when someone happens to ask themselves "should I lint before committing?" This post clarifies three things: what a linter does, why manual linting cannot survive as a matter of discipline, and how a **pre-commit hook** — the standard way to hand that discipline to the machine — works.

<!-- truncate -->

## What Is a Linter?

A linter is a static analysis tool: it reads your code **without running it** and flags problems. The name comes from `lint`, the early Unix tool for C; today every language has de facto standard tools:

- **Python:** `ruff` (today's de facto standard; replaces the old `flake8` + `isort` combo and more), `mypy`/`pyright` (type checking)
- **JavaScript/TypeScript:** `eslint` + `prettier` (formatting)
- **Go:** `golangci-lint`
- **Shell:** `shellcheck`
- **YAML/CI:** `yamllint`, `actionlint`

A linter finds two kinds of things:

1. **Likely real bugs:** undefined variables, unused imports, unreachable code, classic pitfalls like exception swallowing.
2. **Consistency violations:** line length, quote style, import order, naming. These aren't bugs — but every one of them is a wasted review comment like "there's a trailing space on this line."

The key distinction: a linter doesn't repeat what the compiler does. The compiler asks "does this code compile?"; the linter asks "is this code correct *and* readable *and* consistent with team rules?"

## Why Use One?

Short answer: because it stops human review time from being wasted on things machines can check.

- **Early bug catching:** a swallowed exception, a misspelled variable name, a mutable default argument — all caught by lint rules in minutes, even before you write tests.
- **Less arguing in review:** style debates belong to the machine. Code review shifts from "add a space here" to "is this logic wrong?" That alone is the biggest win.
- **Team consistency:** code written by different people in different editors comes out in one style. Newcomers don't have to reverse-engineer the codebase's unwritten conventions.
- **Refactoring safety:** you can't refactor around dead code, unused branches, and unreachable lines until they're gone. Lint keeps them visible continuously.

## Why Automatic? The Inevitable Fate of Manual Linting

Manual linting has three failure modes, and they all spring from the same root: **humans forget**.

1. **It gets forgotten.** "Run lint before committing" is not a *rule* — it's a *reminder*. Everyone complies the first week; by week three it's gone. Stress, a rushed PR — rules break exactly when they matter most.
2. **It runs inconsistently.** When person A lints and person B doesn't, B is always the one breaking CI, and the process gets perceived as "the obstacle in Bişey's way" — even though the fault is the process's, not B's.
3. **Catching it in CI is too late.** Running lint in CI is good, but it happens *after* the push. The bad code is already pushed, CI is red, and someone has to open a fix PR. The right place is *before* the commit.

The logic is simple: **if a rule can't live in human memory, embed it in the workflow.** You stop assigning the "remember to lint" task to human willpower and assign it to the commit command itself. When `git commit` runs, lint runs; if lint fails, no commit is created. Nobody has to remember anything — the system remembers.

In the AI era there's a second meaning: vibe coding. The most common output from an LLM is code that's 90% right and stylistically messy. If you don't pass that code through a linting hook before accepting it, the style-and-simple-bugs layer belongs to the machine and you focus on logic. The hook routes human-written and AI-written code through the same gate — same standard, regardless of author.

## What Is a Pre-commit Hook?

Git runs **hooks** — scripts — at specific stages of the commit process. They live under `.git/hooks/`. The most used one is **pre-commit**: the moment you run `git commit`, it fires *before* the commit object is created.

- Hook **succeeds** (exit 0) → the commit proceeds.
- Hook **fails** (exit ≠ 0) → the commit is **rejected**; files stay staged, you fix and retry.

So the "remember to lint" problem ends with four lines:

```bash
# .git/hooks/pre-commit  (chmod +x)
#!/bin/sh
ruff check .
if [ $? -ne 0 ]; then
  echo "Lint errors: commit rejected."
  exit 1
fi
```

But hand-writing this per repo is a 2015-era solution. Today's standard tool is **[pre-commit](https://pre-commit.com)** (a Python-written hook manager). Its idea: define hooks in a versioned YAML at the repo root and install them with one command:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.12.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

```bash
pip install pre-commit
pre-commit install   # writes .git/hooks/pre-commit — once, after each clone
```

From then on, every `git commit` automatically: takes the changed files, runs the hooks, fixes what `--fix` can fix and **re-stages the corrected files**, and lists what it couldn't fix before rejecting the commit. You either fix it or bypass with `git commit --no-verify` (deliberately, rarely).

A few practical notes:

- Hooks run only on **staged** files — an unstaged file you just wrote isn't checked. That's by design: what will become part of the commit is exactly what gets audited.
- Hooks grow beyond linting: large-file checks, secret scanning (`detect-secrets`), notebook output stripping. It becomes a "commit quality gate."
- If the team resists installing hooks: add a CI step running `pre-commit run --all-files`. PRs that bypass the hook fail CI. Two layers: prevention (hook) + backstop (CI).
- Don't overdo it: the moment rule-count pushes people toward `--no-verify`, you've lost the process.

## Summary

- Linter: static analysis that reads code without running it. Likely bugs + consistency violations.
- Why: it reserves review time for real logic and catches errors before the commit.
- Why automatic: a rule that relies on human memory is a dead rule by week three. Move the discipline from people to the process.
- Pre-commit hook: a gate that runs inside `git commit`. No lint pass, no commit. The `pre-commit` tool makes it versioned in one YAML and installable in one command.

:::info 📌 Related posts on this blog:
- **[Türkçe versiyon: Linter Nedir, Neden Otomatik Çalıştırmalısın?](/blog/linter-nedir-pre-commit-hook)**
- **[MrRobot — a 7/24 Self-Improving AI Agent](/blog/mrrobot-7x24-otonom-agent)** — the large-scale version of automatic quality gates in an AI-driven workflow.
:::