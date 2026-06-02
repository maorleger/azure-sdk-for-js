# Vally evals — presenter cheat-sheet

> Throwaway POC on the `vally` branch. Not intended for merge. Used to
> demonstrate [vally](https://microsoft.github.io/vally-docs/) to the team.

## The one-paragraph pitch

Vally treats "did the agent do the right thing?" as a testable question.
You write **stimuli** (prompts + setup), an **executor** (here: Copilot CLI)
runs the agent and captures a **trajectory** (every tool call, message,
token), and **graders** (static checks, command runs, or LLM judges) produce
a **score** with human-readable evidence. Same eval file, same pipeline,
inner-loop or CI.

```
stimulus → executor → trajectory → graders → score
```

## What's in this POC

| File / dir | Concept it demonstrates |
|---|---|
| `.vally.yaml` | Project config: where to discover skills, evals, and results; named suites. |
| `skills/hello-writer/SKILL.md` | A minimal self-contained skill, authored just for the smoke eval. |
| `.github/skills/*` | Real repo skills — `.vally.yaml` discovers them too, no duplication. |
| `evals/hello-world/eval.yaml` | **Runnable smoke eval.** Exercises all four grader styles: `file-exists`, `file-contains`, `output-contains`, `prompt` (LLM judge). |
| `evals/agents-md-build/eval.yaml` | **The pitch eval for our team.** Regression test for `AGENTS.md` / `sdk-workflow` skill guidance. `runs: 0` by default — see its README. |
| `evals/template-add-feature/eval.yaml` | **The end-state.** Actually add a feature to `@azure/template`. `runs: 0` by default — see its README. |
| `vally-results/` | Where trajectory JSON lands. Gitignored. |

## Live demo commands

```sh
# 0. (First time only) Install. The vally CLI is fetched on-demand via npx
#    from the public npm registry — no repo-level install needed, no
#    Azure DevOps feed auth required.
pnpm install

# 1. CLI works?
npx --registry=https://registry.npmjs.org/ --yes @microsoft/vally-cli@0.5.0 --version

# 2. Lint every eval spec + every SKILL.md.
#    Validates schema, file references, frontmatter — nothing runs.
pnpm eval:lint

# 3. Run the smoke eval end-to-end.
#    Spawns Copilot CLI, captures a trajectory, runs graders, prints a verdict.
#    Uses claude-sonnet-4.5 by default — override with --model if needed.
pnpm eval

# 4. Open the trajectory JSON (path printed at the end of the run, e.g.
#    `vally-results/<timestamp>/results.jsonl`). Walk through:
#      - events: typed timeline (user_message, turn_start, token_usage,
#        assistant_message, tool_call, tool_result, ...)
#      - metrics: aggregates (tokens, turns, tool calls, wall time)
#      - grader results: pass/fail with human-readable evidence

# 5. (Optional) Re-grade the saved trajectory without re-running the agent.
npx --registry=https://registry.npmjs.org/ --yes @microsoft/vally-cli@0.5.0 grade \
  --eval-spec evals/hello-world/eval.yaml \
  < vally-results/<timestamp>/results.jsonl

# 6. (Optional) Validate the future-direction suite without running it.
pnpm eval:future
```

### Verified smoke-eval output (reference)

A successful run looks like:

```
━━━ greet-function ━━━
  Metrics
  ─────────────────────────────────────────
  Tokens        45,554
  Turns         2
  Tool calls    2
  Wall time     13.6s
  Errors        0
  Skills used   0           ← skill loaded but not needed for this trivial task
  Model         claude-sonnet-4.5

  Graders (4/4)
  ─────────────────────────────────────────
  ✔ file-exists       Files matching 'hello.ts' found: hello.ts
  ✔ file-contains     'export function greet' found in hello.ts
  ✔ output-contains   'greet' found in output
  ✔ prompt            <LLM judge reasoning>

  ✔ hello-world [claude-sonnet-4.5]  score: 100.0% (threshold: 70.0%)
```

### Path conventions (gotchas)

- `environment.skills` entries are **directory paths** (the dir containing
  `SKILL.md`), not paths to `SKILL.md` itself. They are resolved **relative to
  the eval.yaml file**, not the repo root. From `evals/hello-world/eval.yaml`,
  the demo skill is at `../../skills/hello-writer`.
- `environment.git.source` is also resolved relative to `eval.yaml`. From the
  stub evals it points at `../..` (the repo root).
- Models flow through Copilot CLI's model registry. Copilot CLI's own default
  is `gpt-5.2`. **Names are case-sensitive** — use `gpt-5.5`, not `GPT-5.5`
  (the latter errors with "Model not available"). All three evals currently
  pin `claude-sonnet-4.5` (verified working). Override per-run with
  `pnpm exec ... eval --model <name>` to A/B compare models.

> **Why `npx` instead of a `devDependency`?** `@microsoft/vally-cli` is not
> yet cached in the repo's Azure DevOps npm feed (anonymous access only
> serves cached packages). Pinning it as a `devDependency` would break
> `pnpm install` for anyone who hasn't run `npx artifacts-npm-credprovider`
> to authenticate to the upstream proxy. Using `npx` with an explicit
> `--registry=https://registry.npmjs.org/` flag sidesteps that entirely
> while keeping the version pinned in `package.json`'s scripts. If/when
> vally lands in the feed, this can switch to a normal devDep.

## Talking points

- **Stimulus vs unit test:** stimuli are prompts; unit tests are functions.
  Same testing rigor, different surface area.
- **Trajectory is the source of truth.** Once captured, you can re-grade
  with new graders for free (no LLM/agent cost).
- **Graders form a spectrum** — fast static checks for inner loop, expensive
  LLM judges for outer loop. Same `Grader` interface.
- **AGENTS.md eval is the killer use case.** We change those docs constantly
  with no way to verify the change helps. This makes it testable.
- **Cost / auth:** the agent run and the LLM judge both need credentials —
  surface this as the main prerequisite for adopting vally.

## Out of scope (intentionally)

Custom executors and graders, CI integration, multi-trial `pass@k` metrics,
dashboards, and the `pairwise` A/B comparison of doc revisions — all natural
next steps after the team buys in.
