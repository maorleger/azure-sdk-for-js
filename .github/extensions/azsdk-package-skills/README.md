# azsdk-package-skills (proof of concept)

A Copilot CLI extension that auto-discovers SKILL.md files under
`sdk/<service>/<package>/.github/skills/*` and makes them available to the
agent. Lets package teams own skills next to their code instead of
maintaining a central registry.

## How a package skill actually gets used

The extension only declares "these dirs contain skills". The CLI owns
everything after that. The agent invokes skills via a built-in `skill`
tool that the CLI exposes — there is no extension code on the invocation
path.

```
extension.mjs              Copilot CLI                      Agent
─────────────              ───────────                      ─────
joinSession({              ── reads SKILL.md frontmatter ──▶
  skillDirectories: [...]  ── renders <available_skills> ──▶ sees skill,
})                            in system prompt                calls
                              + exposes built-in `skill` tool  skill({skill:
                                                                "name"})
                           ◀───────────────────────────────────
                           reads SKILL.md body from disk
                           returns:
                             textResultForLlm: "Skill loaded…"
                             newMessages: [{
                               content: <SKILL.md body>,
                               source: "skill-<name>"
                             }]                            ───▶ acts on
                                                                instructions
```

Verified end-to-end against `sdk/ai/ai-projects/.github/skills/update-changelog`
(extension fires → agent calls `skill({skill:"update-changelog"})` → CLI
returns the SKILL.md body as `newMessages`).

## Three loading paths

| Path | What this extension does | When it fires |
|---|---|---|
| A. **Eager registration** | `joinSession({ skillDirectories })` at startup | Always — every discovered skill appears in `<available_skills>` |
| B. **`onPreToolUse` nudge** | Injects `additionalContext` listing the package's skills | First time a tool arg references `sdk/<svc>/<pkg>/` |
| C. **`load_package_skill` tool** | Extension-owned tool that inlines a SKILL.md body as a tool result | Agent or user invokes it explicitly. Escape hatch for surfaces that ignore extension-registered skill dirs (e.g. cloud agent). |

A + B let the CLI's built-in `skill` tool do the loading. C bypasses the
CLI registry entirely and returns the SKILL.md body as a tool result.

## copilot-sdk integration points

All from `@github/copilot-sdk/extension` — the runtime resolves this
import; no `npm install` needed.

| API | Used for | Reference |
|---|---|---|
| `joinSession(config)` | Attaches to the foreground session. `config.skillDirectories` is the eager-registration channel. | `copilot-sdk/extension.d.ts`, `types.d.ts:1312` |
| `config.hooks.onSessionStart` | One-shot startup nudge / collision warnings via `session.log`. | `copilot-sdk/docs/agent-author.md` |
| `config.hooks.onPreToolUse` | Returns `{ additionalContext }` to inject hidden context into the agent's next turn. | `copilot-sdk/docs/agent-author.md` |
| `config.tools` | Registers `load_package_skill`. Tool names must be globally unique across all extensions. | `copilot-sdk/docs/agent-author.md` |
| `session.log(msg, { ephemeral, level })` | Surfaces messages in the CLI timeline. **Required instead of `console.log`** — stdout is reserved for JSON-RPC. | `copilot-sdk/session.d.ts:479` |

## Try it locally

```bash
cd path/to/azure-sdk-for-js
copilot                                  # interactive — loads extensions
# or
GITHUB_COPILOT_PROMPT_MODE_EXTENSIONS=true copilot -p '/skills'
```

To verify what skills actually reach the agent (vs. what the agent claims
to see):

```bash
LATEST=$(ls -t ~/.copilot/logs/process-*.log | head -1)
python3 -c "
import re
c = open('$LATEST').read()
b = max(re.findall(r'<available_skills>.*?</available_skills>', c, re.DOTALL), key=len)
for n in re.findall(r'<name>([^<]+)', b): print(n)
"
```

## Limitations and future work

This is a proof of concept. Known gaps to address before broad rollout:

### Eager registration (scaling concern)

Every discovered skill is registered via `joinSession({ skillDirectories })`
at session start and appears in the system prompt's `<available_skills>`
block for the whole session. At today's scale (a handful of skills across
2 packages) the cost is trivial, but the system prompt grows with every
new package skill and the agent pays the token cost on **every turn**.

True lazy loading (only register a skill dir when the agent touches its
package) needs an `addSkillDirectory` RPC the CLI SDK does not expose
today. An intermediate "register-all-then-disable-most" pattern is
achievable via `session.rpc.skills.{enable,disable}` but is not
implemented in this POC.

### Skill name collisions

The CLI's built-in `skill` tool looks up by name, so two packages that
ship a SKILL.md with the same frontmatter `name` will silently shadow.
The extension detects collisions on load and emits a `warning`-level
`session.log`, but there's no CI lint and no naming convention enforced
yet (e.g. `<package>-<purpose>`).

### Security review

SKILL.md content is loaded verbatim into the agent's context. A
malicious or compromised SKILL.md could embed prompt-injection
instructions, instruct the agent to disable safety checks, or point at
exfiltration URLs. Mitigations not yet implemented: CODEOWNERS rules on
`sdk/**/.github/skills/`, content lint (forbid bypass instructions,
unsafe shell snippets, off-allowlist URLs), size caps, an origin badge
on injected content, and CODEOWNERS on this extension itself
(`.github/extensions/azsdk-package-skills/`) since it runs Node.js code
in every contributor's session.

### CI smoke test

A prior version of this extension silently broke on a CLI upgrade by
triggering a JSON-RPC stdout corruption that hung the extension until
SIGTERM. The root cause was structural (combinations of hooks + tools +
parser code that worked in isolation) and not caught by linting. A CI
smoke test that diffs `/skills list` output with and without the
extension is needed to catch this regression class.

### Cloud-agent / non-extension surfaces

Not every Copilot surface supports CLI extensions (e.g. the cloud coding
agent, web Copilot). On those surfaces the eager-registration path is
unavailable; only the `load_package_skill` tool — or an auto-generated
markdown registry committed to the repo — can surface package skills.

## Disabling

Delete this dir, rename `extension.mjs`, or per-user disable via
`/skills` UI.

## Files

```
extension.mjs   # auto-discovery + 3 loading paths
README.md       # this file
```
