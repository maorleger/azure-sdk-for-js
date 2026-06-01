---
name: hello-writer
description: Writes tiny standalone TypeScript files (one function per file) into the current workspace. Used by the vally smoke eval to prove the pipeline is wired up.
---

# hello-writer

A deliberately minimal skill. Its only job is to anchor the smoke eval so the
demo has something self-contained to run.

## Usage

When asked to create a small TypeScript file:

1. Create exactly the file path the user requested (no extra files, no folders).
2. Export a single named function. No default exports.
3. Use TypeScript syntax (`.ts` file, explicit parameter types when obvious).
4. Keep the function body to one line when possible.
5. Do not add tests, documentation comments, or unrelated files.

## Examples

- "Create `hello.ts` that exports `greet(name)` returning `` `Hello, ${name}!` ``."
- "Create `add.ts` that exports `add(a, b)` returning `a + b`."
