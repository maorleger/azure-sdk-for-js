# Modular SDK Customization Guide

This guide describes customization for modular TypeScript SDKs from `@azure-tools/typespec-ts`.
New customization layouts separate generated source from handwritten source.
Existing packages with a root-level `generated/` directory retain the legacy three-way merge workflow.

## Before You Customize

Before customizing generated code, consider whether your change should be made in TypeSpec (`client.tsp`) instead. TypeSpec customizations are cleaner and survive regeneration. See the [TypeSpec Client Customizations Reference](https://github.com/Azure/azure-sdk-tools/blob/main/eng/common/knowledge/customizing-client-tsp.md) for available decorators like `@@clientName`, `@@access`, etc.

## Setting Up for Customization

Use this command only when `src/` contains generated source without handwritten customizations.
The package must use Warp with explicit public source entry points.
Existing handwritten clients do not need this setup.

Run the command from the package directory:

```bash
npx dev-tool customization init
```

The command moves the source into `src/generated/`.
It creates a public barrel at each original entry point, including each public subpath.
A barrel re-exports the corresponding generated entry point.
The command preserves the public `package.json` exports and the Warp source mappings.

The command also updates private references:

- Relative imports to files outside the moved source.
- Direct imports of private source from tests and other package files.
- Private `package.json` imports, including platform-specific paths.
- Supported compiler paths, including `$internal` aliases.
- Paths for version constants in `//metadata.constantPaths`.

Each Warp target explicitly includes all public barrels as compiler roots.
This prevents a root-only compiler configuration from omitting public subpath files.
Broad `src/` includes and public package aliases keep their original paths.

If the package has no `customize` script, the command adds `"customize": "echo skipped"`.
An existing script, including an empty script, keeps its value.
The separate source layout does not need a three-way merge.

If `src/generated/` already exists as a directory, the command makes no changes.
The command rejects legacy root-level `generated/` layouts and unsupported source mappings.
Symbolic links and target compiler configurations outside the package require manual migration.
The command stages the new layout before it changes the original files.
If installation fails, it attempts to restore the original files.

## Folder Structure

The new layout has this structure:

```text
my-sdk-package/
  src/
    index.ts               # Public root barrel
    api/
      index.ts             # Public subpath barrel
    models/
      index.ts             # Public subpath barrel
    generated/
      index.ts
      api/
        index.ts
        ...
      models/
        index.ts
        ...
      ...
  test/
  package.json
  warp.config.yml
```

For example, `src/index.ts` contains:

```typescript
export * from "./generated/index.js";
```

The `src/api/index.ts` barrel contains:

```typescript
export * from "../generated/api/index.js";
```

Generated files keep their relative layout.
Imports between those files usually need no changes.
The generated source remains part of the compiled package.

## Customization Workflow

Put handwritten subclasses, adapters, and helpers outside `src/generated/`.
Use the public barrels to export your custom API.
Keep the package's public subpath exports consistent with those barrels.

Do not edit files under `src/generated/`.
The emitter replaces those files on regeneration.
Use `client.tsp` when it can express the required change.

## Regeneration Workflow

The modular emitter detects `src/generated/` and writes generated source there.
The normal metadata update path preserves the outer package setup.
No emitter change is necessary for this layout.

After regeneration, run the package's normal build and test checks.
If the generated API changes, update the handwritten layer where necessary.
Compile errors identify incompatible adapters or subclasses without a merge conflict.

Use `generate-metadata=true` only for new-package setup.
That option can replace metadata that the package author owns.

## Legacy Merge-Based Customization

Existing packages can have this layout:

```
my-sdk-package/
  generated/
    <generated source files (NO src/ underneath this path!)>
  src/
    <generated code with hand-applied customizations>
  test/
    <tests run against code in src/>
  README.md
  package.json
  (etc...)
```

The original generated code and the customized code live side-by-side in the package. The modified source code in the `src/` directory is the source of truth and is what is ultimately built and shipped to customers. The root-level `generated/` directory is not compiled or included in the published package; it is retained as the regeneration baseline used to calculate and merge customizations.

### Customization Workflow

Making customizations is straightforward. Directly edit the code in the `src/` folder with the customizations you need (rename/add/remove/modify functions, methods, exports, files...). Just treat it as if you're refactoring any other code.

> **Tip:** You can make any customization you want, but it's a good idea to minimize and consolidate the changes that you do make: no reformatting, reordering, etc., outside of the customizations you are making. This will make your life easier when it comes time to regenerate.

If you are making a large number of additions (e.g. helper functions and types), it may be worth separating these to a different file and re-exporting them in the customized file instead of making the additions inline.

Once you are happy with your customizations, check everything in as normal (both the `generated/` folder and the `src/` folder). You are done!

### Regeneration Workflow

As the service specification changes, it will become necessary to update your library. Because the root-level `generated/` directory exists, the TypeScript emitter regenerates the source code into that directory instead of `src/`. **DO NOT** commit the regenerated changes before applying the customizations.

> **Note:** The customization tool relies on the committed version of `generated/` as the previous generated baseline.

Once you've done this, you can now run:

```bash
npx dev-tool customization apply
```

This command will:

- Determine the diff between the customized version of your code (in `src/`) and the **previous version** of the generated code (what was in `generated/` before you ran the command to regenerate)
- Attempt a three way merge of the customized code into the new version of the generated code, with the previous version of the generated code as the common parent. The result of the merge attempt will be output into the `src/` folder (including any merge conflict markers)

If the merge was successful, review the merged changes and run the package's normal formatting, build, and test checks before committing. If merge conflicts are present, this means that the changes in the generated code conflicted with your customizations. Resolve the conflicts as you would do for any other merge, taking parts from the new generated code and parts from the customized code as makes sense to you. After resolving the conflicts, the `src/` folder should be the result of applying your customizations to the new version of the generated code.

When an SDK is generated through the SDK generation pipeline, the pipeline automatically runs the package's `customize` script (via `npm run --if-present customize`) after the emitter updates the root-level `generated/` directory and before the package is built. Packages without a `customize` script are skipped. You only need to run the command yourself when regenerating locally.
