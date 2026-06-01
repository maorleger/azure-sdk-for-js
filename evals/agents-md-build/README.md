# agents-md-build — the central-docs regression eval

## What this is for

`AGENTS.md`, the skills under `.github/skills/` (especially `sdk-workflow`),
and `CONTRIBUTING.md` are effectively **prompts** for any agent that works in
this repo. We edit them constantly — to add new guidance, to clarify a wording,
to update a command after a build-system change. Today we have **no way to know
whether those edits help or hurt agent behavior**.

This eval is the smallest concrete example of how vally lets us catch that.

## The setup

- **Stimulus:** "Build the `@azure/template` package."
- **Why this stimulus:** AGENTS.md and the `sdk-workflow` skill both teach
  agents that the correct command is
  `pnpm turbo build --filter=@azure/template... --token 1`, and explicitly warn
  against `npm run build` (which fails in our turborepo workspace setup).
- **Environment:** the eval runs in a git worktree of `HEAD`, so the live
  `AGENTS.md` and skill files are exactly what the agent sees.
- **Graders:**
  - `tool-calls` — the agent must have invoked a shell command starting with
    `pnpm turbo build --filter=@azure/template`.
  - `output-not-contains` — the agent's final output must not claim success
    based on `npm run build`.
  - `prompt` — LLM judge confirms the agent followed the documented command and
    didn't invent its own.

## The demo talking point

> Delete the build-command guidance from AGENTS.md (or change `pnpm turbo` to
> something subtly wrong). Re-run this eval. Watch a grader flip.

That is the value proposition: regressions in prompt engineering become
**testable**, with the same rigor we apply to unit tests.

## Why it's a stub (`config.runs: 0`)

This POC ships with the eval defined but not executed by default — `vally lint`
validates the spec but no agent is invoked, so it costs nothing. To actually
run it, edit `eval.yaml` and set `config.runs: 1`, then:

```sh
pnpm exec vally eval --eval-spec evals/agents-md-build/eval.yaml --verbose
```

You will need credentials for whichever `model` and `judge_model` you choose.

## Natural next step (not implemented here)

Use vally's `pairwise` grader to A/B compare two revisions of `AGENTS.md`
side-by-side — feed the same stimulus, capture two trajectories, let an LLM
judge which one produced the better behavior. That's the "outer loop" use
case for prompt-engineering changes.
