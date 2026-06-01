# template-add-feature — the realistic SDK feature workflow

## What this is for

This eval represents the **eventual goal** of the POC: can an agent, given the
same docs and skills a human contributor has, add a real feature to a real
Azure SDK client library?

The target is `@azure/template` (`sdk/template/template`) because it is a
deliberately tiny package — small enough that an end-to-end run is feasible
in a few minutes, but real enough that the grader signal is meaningful.

## The setup

- **Stimulus:** "Add a public `getWidgetCount()` method to
  `WidgetAnalyticsClient`, with TSDoc, a test, and a changelog entry."
- **Environment:** isolated git worktree of `HEAD`, with `sdk-workflow` and
  `find-package-skill` skills loaded (these are the same skills agents use in
  the real repo).
- **Graders span all four tiers:**
  - **Static structure:** `file-exists`, `file-matches`, `file-contains`
    — quick smoke checks.
  - **Behavioral:** two `run-command` graders that actually build the package
    and run its tests. If the agent's code doesn't compile or tests fail,
    these graders fail. This is the highest-signal layer.
  - **Subjective:** a `prompt` LLM judge for code quality and adherence to the
    Azure SDK for JS design guidelines.

## Why it's a stub (`config.runs: 0`)

A real run of this eval involves:

- A full git worktree of the repo (large)
- `pnpm install` in the worktree (slow + bandwidth)
- An agent making real edits to real source files
- Two real builds + a real test run
- An LLM judge call at the end

That's expensive in time, bandwidth, and LLM credits — not appropriate as a
default for the demo. Flip `config.runs: 1` in `eval.yaml` and run it
explicitly when you want to:

```sh
pnpm exec vally eval --eval-spec evals/template-add-feature/eval.yaml --verbose
```

## What it's meant to communicate

If we can make this work, we can:

- **Gate skill / AGENTS.md changes on it** before they ship to contributors.
- **Compare models** on a realistic SDK task (`--model gpt-4o,o3,claude-opus-4`).
- **Discover failure modes** that we are missing today (e.g. agent skips
  the changelog, agent forgets to export the new method, agent mis-uses
  `OperationOptions`).
