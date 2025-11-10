const fs = require('fs');

// Read the indexes exports
const indexesContent = fs.readFileSync('src/models/azure/search/documents/indexes/index.ts', 'utf8');
const documentsContent = fs.readFileSync('src/models/azure/search/documents/index.ts', 'utf8');
const knowledgeBaseContent = fs.readFileSync('src/models/azure/search/documents/knowledgeBase/index.ts', 'utf8');

// Extract exports
const exportPattern = /^\s*([A-Z][a-zA-Z0-9_]+),?\s*$/gm;

const indexesExports = [];
let match;
while ((match = exportPattern.exec(indexesContent)) !== null) {
  indexesExports.push(match[1]);
}

const documentsExports = [];
exportPattern.lastIndex = 0;
while ((match = exportPattern.exec(documentsContent)) !== null) {
  documentsExports.push(match[1]);
}

const knowledgeBaseExports = [];
exportPattern.lastIndex = 0;
while ((match = exportPattern.exec(knowledgeBaseContent)) !== null) {
  knowledgeBaseExports.push(match[1]);
}

console.log('// Documents exports mappings:');
documentsExports.forEach(exp => {
  const short = exp.replace(/^AzureSearchDocuments/, '');
  if (short !== exp) {
    console.log(`  '${short}': '${exp}',`);
  }
});

console.log('\n// Indexes exports mappings:');
indexesExports.forEach(exp => {
  const short = exp.replace(/^AzureSearchDocumentsIndexes/, '');
  if (short !== exp && !exp.includes('Union')) {
    console.log(`  '${short}': '${exp}',`);
  }
});

console.log('\n// KnowledgeBase exports (Agent -> Base rename):');
knowledgeBaseExports.forEach(exp => {
  const withAgent = exp.replace(/KnowledgeBase/g, 'KnowledgeAgent');
  if (withAgent !== exp) {
    console.log(`  '${withAgent}': '${exp}',`);
  }
});
