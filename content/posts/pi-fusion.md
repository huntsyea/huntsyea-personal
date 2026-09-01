---
title: Why I Built Pi-Fusion
summary: See where AI models disagree before trusting an answer.
time:
  created: 2026-08-31T00:00:00.000Z
  updated: 2026-08-31T00:00:00.000Z
share: true
---

Ask several models the same question and the useful part is often where they disagree. Their split exposes assumptions, blind spots, and claims that need evidence. I built Pi-Fusion to put those weak points in front of a coding agent before it acts.

## How Pi-Fusion works

Pi-Fusion is an extension for Pi, a coding agent. Say I ask Pi whether a growing product should replace its REST API with GraphQL. The active model would normally reason through the trade-off and give me one answer. With Fusion, the same question goes to a panel of models I am already authenticated with. They answer independently and in parallel. One may focus on client flexibility, another on caching and operations, and another on migration cost.

A judge model compares those responses and sorts the result into consensus, contradictions, partial coverage, unique insights, and blind spots. The active model gets that analysis and the panel's responses, then writes the final answer. When the panel splits over client needs or operational complexity, the active model can see which assumptions to verify before it recommends a direction.

<Image src="/assets/posts/pi-fusion-flow.svg" alt="How Pi-Fusion sends a question through independent models, judge analysis, and the active model's final answer." width="760" height="560" />

## Models fail differently

Models from different providers are trained, tuned, and constrained differently. They can reach the same conclusion for different reasons or diverge where an assumption gets shaky. Independent agreement is a stronger signal than one model repeating its own confidence, but it is not proof.

A split gives the active model a claim to investigate. The outlier may be wrong. The majority may share a blind spot. Either way, the agent knows what evidence it needs before it commits.

<Image src="/assets/posts/pi-fusion-signals.svg" alt="How agreement, disagreement, and missing coverage guide the agent's next step." width="760" height="470" />

## When I run Fusion

Each Fusion run makes several model calls and, when enough panelists answer, a separate judge call. It takes more time and more tokens than asking one model, so the extra work should earn its place. I use it when another opinion could change the result: architecture decisions, difficult debugging, unfamiliar codebases, consequential refactors, research, and critiques.

For routine edits, formatting, or straightforward implementation, one capable model is usually enough. When a wrong assumption would cost more than another opinion, I run Fusion.

## You choose the panel, tools, and budget

Fusion reaches several models and can spend more time, tokens, and provider budget. In available mode, the active model decides when to request it. I still choose the panel, judge, reasoning levels, token budgets, and tool access. The invoking model supplies the task but cannot override those settings. Panel tools start off, and Fusion includes recent conversation context only when requested.

I can leave Fusion available, guarantee it for one prompt, force it for a session, or turn it off. When I want fixed cost and quality trade-offs, I can define named panels.

## Try Pi-Fusion

If you already use Pi, install [Pi-Fusion](https://github.com/synthetic-recon/pi-fusion) from npm:

```bash
pi install npm:pi-fusion
```

Run `/reload` if Pi is already open. No configuration is required. Pi-Fusion selects a diverse panel from the models you are already authenticated with. Ask Pi to use Fusion when you want another perspective, or guarantee one run directly:

```text
/fusion Review this architecture and identify assumptions that may be wrong.
```

`/fusion-setup` lets you choose the panel, judge, reasoning, and tool access later. Start with a decision where disagreement would change your next step.
