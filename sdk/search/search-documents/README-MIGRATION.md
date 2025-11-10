# Migration Tooling

This directory contains scripts to assist with the Swagger → TypeSpec migration.

## Files

### `type-mappings.txt`
Complete mapping of short type names to full prefixed names extracted from generated code.
- 376 total mappings
- Format: `'ShortName': 'AzureSearchDocumentsIndexesFullName'`
- Used by fix scripts

### `generate-mappings.cjs`
Extracts type mappings from generated index.ts files.

**Usage:**
```bash
node generate-mappings.cjs > type-mappings.txt
```

### `fix-indexes-exports.cjs`
Applies type mappings to src/index.ts exports for backward compatibility.

**Current status**: Partially complete (80 of 230 types mapped)

**To extend**:
1. Add more mappings from `type-mappings.txt` to the `INDEXES_MAPPINGS` object
2. Run: `node fix-indexes-exports.cjs`

**Example mapping**:
```javascript
const INDEXES_MAPPINGS = {
  'SearchIndex': 'AzureSearchDocumentsIndexesSearchIndex',
  'SearchField': 'AzureSearchDocumentsIndexesSearchField',
  // Add more from type-mappings.txt
};
```

## Next Steps

1. Extend `fix-indexes-exports.cjs` with remaining mappings
2. Run the script to fix all type exports
3. See `MIGRATION_STATUS.md` for complete action plan
