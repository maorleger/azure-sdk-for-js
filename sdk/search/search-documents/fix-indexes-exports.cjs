const fs = require('fs');

// Read the index.ts file
let content = fs.readFileSync('src/index.ts', 'utf8');

// Indexes type mappings (short name -> full name)
const INDEXES_MAPPINGS = {
  'AIFoundryModelCatalogName': 'AzureSearchDocumentsIndexesAIFoundryModelCatalogName',
  'AIServicesAccountKey': 'AzureSearchDocumentsIndexesAIServicesAccountKey',
  'AnalyzedTokenInfo': 'AzureSearchDocumentsIndexesAnalyzedTokenInfo',
  'AnalyzeResult': 'AzureSearchDocumentsIndexesAnalyzeResult',
  'AsciiFoldingTokenFilter': 'AzureSearchDocumentsIndexesAsciiFoldingTokenFilter',
  'AzureActiveDirectoryApplicationCredentials': 'AzureSearchDocumentsIndexesAzureActiveDirectoryApplicationCredentials',
  'AzureMachineLearningSkill': 'AzureSearchDocumentsIndexesAzureMachineLearningSkill',
  'AzureOpenAIModelName': 'AzureSearchDocumentsIndexesAzureOpenAIModelName',
  'AzureOpenAITokenizerParameters': 'AzureSearchDocumentsIndexesAzureOpenAITokenizerParameters',
  'BinaryQuantizationCompression': 'AzureSearchDocumentsIndexesBinaryQuantizationCompression',
  'BM25Similarity': 'AzureSearchDocumentsIndexesBM25SimilarityAlgorithm',
  'CharFilter': 'AzureSearchDocumentsIndexesCharFilter',
  'CharFilterName': 'AzureSearchDocumentsIndexesCharFilterName',
  'ChatCompletionExtraParametersBehavior': 'AzureSearchDocumentsIndexesChatCompletionExtraParametersBehavior',
  'ChatCompletionResponseFormat': 'AzureSearchDocumentsIndexesChatCompletionResponseFormat',
  'ChatCompletionSchema': 'AzureSearchDocumentsIndexesChatCompletionSchema',
  'CjkBigramTokenFilter': 'AzureSearchDocumentsIndexesCjkBigramTokenFilter',
  'ClassicSimilarity': 'AzureSearchDocumentsIndexesClassicSimilarityAlgorithm',
  'ClassicTokenizer': 'AzureSearchDocumentsIndexesClassicTokenizer',
  'CognitiveServicesAccount': 'AzureSearchDocumentsIndexesCognitiveServicesAccount',
  'CognitiveServicesAccountKey': 'AzureSearchDocumentsIndexesCognitiveServicesAccountKey',
  'CommonGramTokenFilter': 'AzureSearchDocumentsIndexesCommonGramTokenFilter',
  'ConditionalSkill': 'AzureSearchDocumentsIndexesConditionalSkill',
  'CorsOptions': 'AzureSearchDocumentsIndexesCorsOptions',
  'CustomAnalyzer': 'AzureSearchDocumentsIndexesCustomAnalyzer',
  'CustomEntity': 'AzureSearchDocumentsIndexesCustomEntity',
  'CustomNormalizer': 'AzureSearchDocumentsIndexesCustomNormalizer',
  'DefaultCognitiveServicesAccount': 'AzureSearchDocumentsIndexesDefaultCognitiveServicesAccount',
  'DistanceScoringFunction': 'AzureSearchDocumentsIndexesDistanceScoringFunction',
  'EdgeNGramTokenizer': 'AzureSearchDocumentsIndexesEdgeNGramTokenizer',
  'FieldMapping': 'AzureSearchDocumentsIndexesFieldMapping',
  'FreshnessScoringFunction': 'AzureSearchDocumentsIndexesFreshnessScoringFunction',
  'HighWaterMarkChangeDetectionPolicy': 'AzureSearchDocumentsIndexesHighWaterMarkChangeDetectionPolicy',
  'IndexingSchedule': 'AzureSearchDocumentsIndexesIndexingSchedule',
  'KeywordTokenizer': 'AzureSearchDocumentsIndexesKeywordTokenizer',
  'LexicalAnalyzer': 'AzureSearchDocumentsIndexesLexicalAnalyzer',
  'LexicalTokenizer': 'AzureSearchDocumentsIndexesLexicalTokenizer',
  'LuceneStandardAnalyzer': 'AzureSearchDocumentsIndexesLuceneStandardAnalyzer',
  'MagnitudeScoringFunction': 'AzureSearchDocumentsIndexesMagnitudeScoringFunction',
  'MappingCharFilter': 'AzureSearchDocumentsIndexesMappingCharFilter',
  'NGramTokenizer': 'AzureSearchDocumentsIndexesNGramTokenizer',
  'PatternAnalyzer': 'AzureSearchDocumentsIndexesPatternAnalyzer',
  'PatternTokenizer': 'AzureSearchDocumentsIndexesPatternTokenizer',
  'ScalarQuantizationCompression': 'AzureSearchDocumentsIndexesScalarQuantizationCompression',
  'ScoringProfile': 'AzureSearchDocumentsIndexesScoringProfile',
  'SearchField': 'AzureSearchDocumentsIndexesSearchField',
  'SearchIndex': 'AzureSearchDocumentsIndexesSearchIndex',
  'SearchIndexer': 'AzureSearchDocumentsIndexesSearchIndexer',
  'SearchIndexerDataSource': 'AzureSearchDocumentsIndexesSearchIndexerDataSource',
  'SearchIndexerSkillset': 'AzureSearchDocumentsIndexesSearchIndexerSkillset',
  'SearchResourceEncryptionKey': 'AzureSearchDocumentsIndexesSearchResourceEncryptionKey',
  'SemanticConfiguration': 'AzureSearchDocumentsIndexesSemanticConfiguration',
  'SimilarityAlgorithm': 'AzureSearchDocumentsIndexesSimilarityAlgorithm',
  'StopAnalyzer': 'AzureSearchDocumentsIndexesStopAnalyzer',
  'Suggester': 'AzureSearchDocumentsIndexesSearchSuggester',
  'SynonymMap': 'AzureSearchDocumentsIndexesSynonymMap',
  'TagScoringFunction': 'AzureSearchDocumentsIndexesTagScoringFunction',
  'TextWeights': 'AzureSearchDocumentsIndexesTextWeights',
  'TokenFilter': 'AzureSearchDocumentsIndexesTokenFilter',
  'UaxUrlEmailTokenizer': 'AzureSearchDocumentsIndexesUaxUrlEmailTokenizer',
  'VectorEncodingFormat': 'AzureSearchDocumentsIndexesVectorEncodingFormat',
  'VectorSearchCompression': 'AzureSearchDocumentsIndexesVectorSearchCompression',
  'VectorSearchProfile': 'AzureSearchDocumentsIndexesVectorSearchProfile',
  'WordDelimiterTokenFilter': 'AzureSearchDocumentsIndexesWordDelimiterTokenFilter',
};

// Find the indexes export block (from line 85 to line 317)
const lines = content.split('\n');
let modified = false;

for (let i = 84; i < 317 && i < lines.length; i++) {
  const line = lines[i];
  
  // Skip export { line
  if (line.trim() === 'export {' || line.trim().startsWith('//')) {
    continue;
  }
  
  // Check each mapping
  for (const [shortName, fullName] of Object.entries(INDEXES_MAPPINGS)) {
    // Match patterns like "  ShortName," or "  ShortName as Alias,"
    const simplePattern = new RegExp(`^(\\s+)${shortName}(,?)\\s*$`);
    const aliasPattern = new RegExp(`^(\\s+)${shortName}(\\s+as\\s+\\w+)(,?)\\s*$`);
    
    if (simplePattern.test(line)) {
      lines[i] = line.replace(simplePattern, `$1${fullName} as ${shortName}$2`);
      modified = true;
      break;
    } else if (aliasPattern.test(line)) {
      lines[i] = line.replace(aliasPattern, `$1${fullName}$2$3`);
      modified = true;
      break;
    }
  }
}

if (modified) {
  fs.writeFileSync('src/index.ts', lines.join('\n'), 'utf8');
  console.log('✅ Fixed indexes exports');
} else {
  console.log('⚠️  No changes made');
}
