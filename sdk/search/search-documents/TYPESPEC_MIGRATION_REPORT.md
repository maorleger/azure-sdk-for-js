# TypeSpec Migration Report - Azure Search Documents SDK (TypeScript)

**Date**: November 10, 2025  
**Status**: Basic Proof of concept complete, production readiness requires additional work  
**Migration Type**: Swagger → TypeSpec

## Summary

This report documents the requirements and scope for migrating the `@azure/search-documents` package from Swagger/autorest.typescript to TypeSpec code generation. The migration follows the new Azure SDK TypeScript customization workflow where generated code lives in `./generated` and is copied/customized into `./src`.

### Key Metrics (AI generated based on proof-of-concept analysis)

- **Breaking Changes**: Minimal if managed carefully; primary risk is naming convention changes
- **Generated Code**: ~60K lines added to support modular client structure
- **Custom Code Maintained**: ~15K lines requiring updates and mappings

---

## 1. Code Generation & Project Structure Changes

### 1.1 Adopt TypeSpec Customization Flow

**Current State**: Generated code is directly in `./src/generated`, modified in place

**Required Changes**:

- Generated code outputs to `./generated` directory
- Custom code in `./src` imports from generated models
- Generated code is treated as read-only, never modified directly

The customization flow is described in the [RLC Customization](https://github.com/Azure/azure-sdk-for-js/blob/main/documentation/RLC-customization.md) document. The document refers to RLC; however, the same principles apply to all TypeSpec-generated SDKs.

### 1.2 Module Structure Changes

**Current State**: Single monolithic generated client with nested operational interfaces

**TypeSpec Generated Structure**:

```text
generated/
├── search/                          # SearchClient operations
│   ├── searchClient.ts
│   └── api/
│       ├── operations.ts
│       ├── options.ts
│       └── searchContext.ts
├── searchIndex/                     # SearchIndexClient operations
│   ├── searchIndexClient.ts
│   └── api/
├── searchIndexer/                   # SearchIndexerClient operations  
│   ├── searchIndexerClient.ts
│   └── api/
├── knowledgeBaseRetrieval/         # KnowledgeRetrievalClient operations
│   ├── knowledgeBaseRetrievalClient.ts
│   └── api/
├── models/                         # Model definitions
│   └── azure/
│       └── search/
│           └── documents/
│               ├── models.ts       # Search document models
│               ├── indexes/
│               │   └── models.ts   # ~13K lines of index definitions
│               └── knowledgeBase/
│                   └── models.ts   # Knowledge base models
└── static-helpers/                 # Generated helper utilities
    ├── pagingHelpers.ts
    ├── urlTemplate.ts
    └── serialization/
```

**Required Changes**:

- Update wrapper clients (`SearchClient`, `SearchIndexClient`, `SearchIndexerClient`) to instantiate new modular generated clients
- Update all internal imports to reference new module paths
- Maintain single public export surface in `src/index.ts`

---

## 2. Naming Convention Updates

### 2.1 Type Name Prefixing

**Issue**: TypeSpec generator adds namespace prefixes to all exported types to avoid collisions

**Pattern**:

- Documents API: `AzureSearchDocuments*` prefix
- Indexes API: `AzureSearchDocumentsIndexes*` prefix  
- Knowledge Base API: `AzureSearchDocumentsKnowledgeBase*` prefix

**Examples**:

```typescript
// Before (Swagger)
import { SearchIndex, SearchField } from "./generated/service/models";

// After (TypeSpec)
import { 
  AzureSearchDocumentsIndexesSearchIndex,
  AzureSearchDocumentsIndexesSearchField 
} from "./models/azure/search/documents/indexes";
```

**Required Changes**:

1. **Create type aliases for backward compatibility** (~376 types identified)
   - Maintain existing public API names
   - Example: `export type SearchIndex = AzureSearchDocumentsIndexesSearchIndex;`

2. **Update internal code** to use prefixed names or aliases consistently

> Alternatively, there may be ways to configure TypeSpec to avoid prefixing, but this has not been explored in depth.

### 2.2 Known Type Name Changes

Several types have semantic renames beyond simple prefixing:

| Before (Swagger) | After (TypeSpec) | Notes |
|------------------|------------------|-------|
| `BM25Similarity` | `BM25SimilarityAlgorithm` | More descriptive |
| `ClassicSimilarity` | `ClassicSimilarityAlgorithm` | More descriptive |
| `PathHierarchyTokenizerV2` | `PathHierarchyTokenizer` | Version removed |
| `KnowledgeAgent*` | `KnowledgeBase*` | API terminology change |

**Required Changes**: Create type aliases for all renames to maintain backward compatibility

---

## 3. Client API Adjustments

### 3.1 Constructor Parameter Reordering

**Issue**: Generated client constructors have different parameter orders

**Before**:

```typescript
new GeneratedClient(endpoint, indexName, apiVersion, options)
```

**After**:

```typescript
new GeneratedClient(endpoint, credential, indexName, options)
```

**Required Changes**:

- Update wrapper client instantiation in `SearchClient` constructor
- Verify credential is passed correctly (may have been in pipeline before)
- Update `SearchIndexClient`, `SearchIndexerClient` constructors similarly

### 3.2 Response Handling Changes

**Issue**: TypeSpec clients return `Response<BinaryData>` for `*WithResponse` methods instead of `Response<T>`

**Current Workaround**: Not needed for this SDK as we primarily use regular (non-`WithResponse`) methods

**If needed**: Create wrapper methods that deserialize BinaryData to proper types

### 3.3 Method Signature Changes

Several wrapper methods require updates:

#### `getDocumentsCount()`

- Before: Used `onResponse` callback to extract count from response body
- After: Generated method returns count directly
- **Change**: Simplify implementation, remove callback pattern

#### `autocomplete()` and `suggest()`

- Before: Single options object with all parameters
- After: Separate positional parameters + options
- **Change**: Update wrappers to extract and pass parameters correctly

#### List operations with pagination

- Before: Returns custom iterators with `byPage()` method
- After: TypeSpec may generate different pagination patterns
- **Change**: Verify pagination still works or wrap generated paged operations

---

## 4. Custom Functionality to Preserve

The following custom features must be maintained through wrapper code:

### 4.1 Document Operation Conveniences

**Custom methods** on `SearchClient`:

- `uploadDocuments(documents)` - convenience wrapper for indexing with "upload" action
- `mergeDocuments(documents)` - convenience wrapper for "merge" action  
- `mergeOrUploadDocuments(documents)` - convenience wrapper for "mergeOrUpload" action
- `deleteDocuments(keyName, keyValues)` or `deleteDocuments(documents)` - overloaded delete with key-based and document-based variants

**Status**: Already implemented in wrapper, should continue to work

### 4.2 IndexDocumentsBatch

**Custom class**: `IndexDocumentsBatch<T>`

- Provides fluent API for building batches: `batch.upload(doc).merge(doc).delete(doc)`
- Methods: `upload()`, `merge()`, `mergeOrUpload()`, `delete()`
- Tracks operations and generates proper request payloads

**Status**: Independent of generated code, should continue to work

### 4.3 SearchIndexingBufferedSender

**Custom class**: High-level bulk indexing client

- Auto-batching with configurable batch size and flush intervals
- Automatic retries with exponential backoff
- Event-driven progress tracking
- Error handling and recovery

**Status**: Wraps SearchClient operations, should continue to work with minimal changes

### 4.4 Field Builder Utilities

**Custom functions** for creating index fields with proper type configurations:

- `SimpleField(name, type, options)` - creates a basic searchable field
- `SearchableField(name, options)` - creates a full-text searchable field
- `ComplexField(name, options)` - creates a complex type field

**Note**: These were commented out in the PoC but should be restored

**Status**: Need to be updated to use new type names

### 4.5 SearchFieldDataType.Collection

**Custom helper**: `SearchFieldDataType.Collection(type)`

- Utility to create collection field types
- Example: `SearchFieldDataType.Collection(SearchFieldDataType.String)` → `"Collection(Edm.String)"`

**Status**: Need to verify if TypeSpec generates equivalent or restore custom implementation

### 4.6 List Operations with Name-Only Results

**Custom methods** on `SearchIndexClient`:

- `listIndexesNames()` - returns iterator of string names instead of full index objects
- `listSynonymMapNames()` - returns iterator of synonym map names
- Similar methods for other resource types

**Pattern**:

```typescript
public listIndexesNames(): PagedAsyncIterableIterator<string> {
  // Transform full objects to just names
}
```

**Status**: Need to implement as wrappers over generated list operations using the mapPagedAsyncIterator utility function.

### 4.7 Delete Operations with Object Acceptance

**Custom overloads**: Delete methods accept either name string or full object

**Before**:

```typescript
deleteIndex(nameOrIndex: string | SearchIndex)
deleteSynonymMap(nameOrMap: string | SynonymMap)
```

**Pattern**: Extract name from object if object is provided, pass name to generated method

**Status**: Continue to maintain in wrappers

### 4.8 Create/Update Operations Without Required Name

**Custom behavior**: `createOrUpdate*` methods can infer name from object

**Before**:

```typescript
createOrUpdateIndex(index: SearchIndex, options?) // name optional
```

**Generated**: May require explicit name parameter

**Required Change**: Wrapper extracts name from object if not provided separately

---

## 5. Backward Compatibility Strategies

### 5.1 Export Aliasing

**Primary Strategy**: Use type aliases and re-exports to maintain existing public API

**Implementation** in `src/index.ts`:

```typescript
// Documents API
export {
  AzureSearchDocumentsAutocompleteItem as AutocompleteItem,
  AzureSearchDocumentsAutocompleteMode as AutocompleteMode,
  AzureSearchDocumentsAutocompleteResult as AutocompleteResult,
  // ... ~100 more
} from "./models/azure/search/documents/index.js";

// Indexes API  
export {
  AzureSearchDocumentsIndexesSearchIndex as SearchIndex,
  AzureSearchDocumentsIndexesSearchField as SearchField,
  // ... ~250 more
} from "./models/azure/search/documents/indexes/index.js";
```

### 5.2 Union Type Re-exports

**Issue**: TypeSpec generates discriminated unions with `Union` suffix

- Example: `LexicalAnalyzerUnion`, `TokenFilterUnion`, `CharFilterUnion`

**Pattern**: Export union types with their base names for compatibility

```typescript
export type { 
  LexicalAnalyzerUnion as LexicalAnalyzer,
  TokenFilterUnion as TokenFilter 
} from "./models/azure/search/documents/indexes/index.js";
```

### 5.3 Wrapper Method Signatures

**Strategy**: Keep all public method signatures unchanged

- Adapt generated client calls inside wrapper implementations
- Transform parameters and responses as needed
- Maintain overloads and optional parameters

### 5.4 Deprecation Path (if needed)

For any unavoidable breaking changes:

1. Mark old names as `@deprecated` with clear migration guidance
2. Maintain for at least 2 major versions
3. Provide codemod or migration script if feasible

---

## 6. Model Transformation Requirements

### 6.1 Request/Response Transformations

**Current Pattern**: Custom wrapper types that map to generated types

**Example - Search Results**:

```typescript
// Public type
export interface SearchResult<T> {
  score: number;
  highlights?: { [field: string]: string[] };
  document: T;
  // ... semantic search properties
}

// Internal: Transform generated result to public type
function convertSearchResult<T>(
  generated: AzureSearchDocumentsSearchResult
): SearchResult<T> {
  return {
    score: generated["@search.score"],
    highlights: generated["@search.highlights"],
    document: generated as T,
    // ...
  };
}
```

**Required Changes**:

- Verify generated types still have same structure (e.g., `@search.*` properties)
- Update transformation utilities in `serviceUtils.ts` (already done in PoC)
- Ensure backward compatibility of public result types

### 6.2 Index Definition Mappings

**Complex mappings** in `serviceUtils.ts`:

1. **Public → Generated** (`publicIndexToGeneratedIndex`):
   - Maps user-friendly field definitions to service schema
   - Handles `hidden` property mapping to `retrievable`
   - Transforms scoring profiles, CORS options, etc.

2. **Generated → Public** (`generatedIndexToPublicIndex`):
   - Converts service schema to user-friendly types
   - Reverse mapping of field properties

**Status**: Implement mappings using new generated type names.

### 6.3 Indexer Configuration Mappings

**Pattern**: Similar bidirectional mappings for:

- `SearchIndexer` definitions
- `SearchIndexerDataSourceConnection`
- `SearchIndexerSkillset`

**Change Required**: Update type imports and ensure mappings still work with new generated structures

---

## 7. Known TypeSpec Codegen Considerations

### 7.1 Union Type Serialization Pattern

**Note**: Initial investigation revealed what appeared to be a codegen bug where union serializers called non-existent short-name functions. This was manually fixed by adding proper prefixes throughout generated files.

This is tracked in [Azure/autorest.typescript/issues/3588](https://github.com/Azure/autorest.typescript/issues/3588)

### 7.2 Enum Consistency

**Observation**: Enums like `SearchFieldDataType` gained additional values in TypeSpec generation:

- New: `HALF`, `INT16`, `S_BYTE`, `BYTE`

**Required Change**:

- Verify these are valid service-side types
- Update documentation if new types are now supported
- Ensure no breaking changes to existing enum usage

### 7.3 Versioned Types

**Issue**: Some skills and components had version-specific types in old SDK:

- `EntityRecognitionSkillV3`
- `SentimentSkillV3`

**TypeSpec Behavior**: May only generate latest version, or consolidate versions

**Required Change**:

- Identify if old version-specific types are still needed for backward compat
- Create aliases if necessary
- Update documentation about supported versions

---

## 8. Testing & Validation Requirements

### 8.1 Unit Tests

**Impact**: Minimal changes expected

- Update imports to use new type names (via aliases)
- Verify mocks still work with new generated types
- Update any tests that explicitly check type names

### 8.2 Integration Tests

**Critical Validation**:

1. All CRUD operations on indexes
2. Document indexing (single and batch)
3. Search with all query types (simple, full, semantic)
4. Autocomplete and suggest
5. Skillsets and indexers (if supported)
6. Knowledge base operations

**Test Areas**:

- Constructor variations (key vs token credential)
- Error handling and service errors
- Pagination for list operations
- Batch error handling in `SearchIndexingBufferedSender`

### 8.3 Backward Compatibility Testing

**Required**:

> Note: I notice that most of the tests are being skipped. Make sure to re-enable them and ensure they pass before starting the migration.

1. Run existing test suite without changes (via aliases)
2. Verify all public types resolve correctly
3. Check API Review files for breaking changes
4. Test upgrade path with sample applications

---

## 9. Documentation Updates

### 9.1 API Reference

**Changes**:

- Update generated API reference (should be automatic)
- Verify type links resolve correctly with new names
- Update examples if any API signatures changed

### 9.2 README Updates

**Minimal Changes Expected**:

- Update package version
- Note TypeSpec migration (if relevant to users)
- Update "Generated from" information

### 9.3 Code Samples

**Review All Samples**:

- Verify they still compile and run
- Update any that reference changed APIs
- Add samples for new features (if applicable)

---

## 10. API Review Requirements

### 10.1 API Surface Changes

**Review Files**:

- `review/search-documents-node.api.md`
- `review/search-documents-browser.api.md`

**Expected Changes**:

- Internal type references (should not affect public API)
- Generated client structure (hidden from public API)
- Potentially new overloads or options

### 10.2 Breaking Change Assessment

**Review Process**:

1. Generate new API review files
2. Compare with current approved files using API Extractor
3. Document all breaking changes
4. Get architectural board approval for any breaking changes
5. Update version number accordingly (major if breaking)

### 10.3 Knowledge Base API (Special Case)

**Issue**: Generated code renamed `KnowledgeAgent` → `KnowledgeBase`

**Questions for Review**:

1. Is this an intentional service-side rename?
2. Should SDK maintain `KnowledgeAgent` names for compatibility?
3. Are all previously exposed types still available?

**Decision Required**: Accept breaking change or create aliases

---

## 14. Comparison with Other Language SDKs

### Python SDK Findings

**From Python report**:

1. **Breaking Changes**:
   - `SearchFieldDataType` enum value names changed (similar to TypeScript)
   - `serialize`/`deserialize` helpers removed (not applicable to TypeScript)
   - Version-specific skill types consolidated (same issue)

2. **Custom Features Maintained**:
   - Helper field builders (`SimpleField`, `SearchableField`) - TypeScript has same
   - Batch convenience methods - TypeScript has same
   - Parameter reordering in constructors - TypeScript has same issue
   - `SearchIndexingBufferedSender` - TypeScript equivalent exists

3. **Differences**:
   - Python SDK returns inner results for some operations (unwrapping) - TypeScript may need similar
   - Python has explicit serialization concerns - less relevant for TypeScript

### Java SDK Findings

**From Java report**:

1. **Custom Features** (TypeScript equivalents):
   - `SearchDocument` wrapper (Map<String, Object>) - TypeScript uses generic `TModel`
   - `SearchFilter` OData utility - TypeScript has OData helpers
   - `SearchIndexingBufferedSender` - TypeScript has equivalent
   - Custom serializer support - TypeScript uses generic types
   - Field builders with annotations - TypeScript has runtime helpers

2. **Custom Model Wrappings**:
   - `SearchResult<T>` with custom type conversion - TypeScript has similar
   - Separate semantic and vector options models - TypeScript may benefit from similar
   - Range and value facet result wrappers - TypeScript should review

3. **API Differences**:
   - Many varargs overloads (Java pattern) - less relevant for TypeScript
   - Custom handling for `RegexFlags` - TypeScript should check similar cases

### Key Takeaways

**Common Patterns Across SDKs**:

1. Type name prefixing requires aliasing for backward compatibility
2. Parameter reordering in constructors is a common issue
3. Version-specific types may be consolidated

---

## 17. Conclusion

The TypeSpec migration for `@azure/search-documents` is feasible and the proof-of-concept demonstrates that the generated code can be successfully integrated. The primary work involves:

1. **Type mapping and aliasing** to maintain backward compatibility (largest effort)
2. **Wrapper client updates** to work with new generated structure
3. **Thorough testing** to ensure no regressions
4. **Documentation updates** for clarity

With proper planning and execution, this migration can be completed with **minimal to no breaking changes** for end users; however, you can expect to incur a significant cost in terms of development time and effort and continued maintenance.

**Recommended Approach**:

I recommend seriously considering a major version bump and taking this opportunity to move to a fully generated SDK with minimal custom code. The benefits of maintainability and alignment with modern Azure SDK practices outweigh the migration effort. A backwards-compatible migration _is_ possible; however, it will require extensive type aliasing and careful testing due to the large hand-authored convenience layer.

---

## Appendix A: Type Mapping Statistics

- **Documents API types**: ~86 types with `AzureSearchDocuments*` prefix
- **Indexes API types**: ~358 types with `AzureSearchDocumentsIndexes*` prefix
- **Knowledge Base API types**: ~54 types with `AzureSearchDocumentsKnowledgeBase*` prefix
- **Total mappings required**: ~376+ type aliases
- **Union types**: ~20+ discriminated unions requiring re-export
- **Enum types**: ~50+ enums requiring name mapping

## Appendix B: Generated Code Size

- **Documents models**: ~2,190 lines
- **Indexes models**: ~13,539 lines (largest file)
- **Knowledge Base models**: ~1,259 lines
- **Operation files**: ~761 lines (search) + ~1,782 (index) + ~1,269 (indexer)
- **Total new generated code**: ~60,000+ lines
- **Existing custom code**: ~15,000+ lines requiring updates

## Appendix C: Reference Documents

- Python Migration Report: https://gist.github.com/xiangyan99/44333124fc86d0d2621fabbc20901c40
- Java Migration Report: https://gist.github.com/alzimmermsft/ee56ed3c53faf8e0e9495ec0f71dc7f5
- TypeSpec Documentation: https://microsoft.github.io/typespec/
- Azure SDK TypeScript Guidelines: https://azure.github.io/azure-sdk/typescript_introduction.html
- Proof-of-concept: https://github.com/maorleger/azure-sdk-for-js/tree/search-documents-typespec-eval
