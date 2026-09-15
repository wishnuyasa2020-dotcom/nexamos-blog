import fs from 'node:fs';
import path from 'node:path';

const projectSchemaPath = path.resolve('agent/schemas/research-project.schema.json');
const sourceSchemaPath = path.resolve('agent/schemas/research-source.schema.json');
const claimSchemaPath = path.resolve('agent/schemas/research-claim.schema.json');
const evidenceSchemaPath = path.resolve('agent/schemas/research-evidence.schema.json');

const projectSchema = JSON.parse(fs.readFileSync(projectSchemaPath, 'utf-8'));
const sourceSchema = JSON.parse(fs.readFileSync(sourceSchemaPath, 'utf-8'));
const claimSchema = JSON.parse(fs.readFileSync(claimSchemaPath, 'utf-8'));
const evidenceSchema = JSON.parse(fs.readFileSync(evidenceSchemaPath, 'utf-8'));

const fixtureDir = path.resolve('data/research/examples/blog-ai-relevance');

console.log('Validating research fixtures against canonical JSON schemas...');

function validateObject(obj, schema, label) {
  for (const req of schema.required) {
    if (obj[req] === undefined) {
      throw new Error(`[${label}] Missing required field: ${req}`);
    }
  }
  for (const key of Object.keys(obj)) {
    if (!schema.properties[key]) {
      throw new Error(`[${label}] Disallowed property: ${key}`);
    }
  }
}

// 1. Validate project.json
const projectData = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'project.json'), 'utf-8'));
validateObject(projectData, projectSchema, 'project.json');
console.log('[PASS] project.json matches research-project.schema.json');

// 2. Validate sources.json
const sourcesData = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'sources.json'), 'utf-8'));
for (const src of sourcesData) {
  validateObject(src, sourceSchema, `sources.json:${src.id}`);
}
console.log(`[PASS] sources.json (${sourcesData.length} items) matches research-source.schema.json`);

// 3. Validate claims.json
const claimsData = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'claims.json'), 'utf-8'));
for (const clm of claimsData) {
  validateObject(clm, claimSchema, `claims.json:${clm.id}`);
}
console.log(`[PASS] claims.json (${claimsData.length} items) matches research-claim.schema.json`);

// 4. Validate evidence.json
const evidenceData = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'evidence.json'), 'utf-8'));
for (const evi of evidenceData) {
  validateObject(evi, evidenceSchema, `evidence.json:${evi.id}`);
}
console.log(`[PASS] evidence.json (${evidenceData.length} items) matches research-evidence.schema.json`);

console.log('SUCCESS: All research fixtures strictly conform to JSON schemas!');
