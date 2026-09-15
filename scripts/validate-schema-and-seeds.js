import fs from 'node:fs';
import path from 'node:path';

const schemaPath = path.resolve('agent/schemas/topic.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const seedDir = path.resolve('data/topics/seed');
const seedFiles = fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'));

console.log(`Validating ${seedFiles.length} seed fixtures against topic.schema.json...`);

let allValid = true;

for (const file of seedFiles) {
  const filePath = path.join(seedDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Check required root fields
  for (const req of schema.required) {
    if (data[req] === undefined) {
      console.error(`[${file}] Missing required field: ${req}`);
      allValid = false;
    }
  }

  // Check enums
  if (!schema.properties.territory.enum.includes(data.territory)) {
    console.error(`[${file}] Invalid territory: ${data.territory}`);
    allValid = false;
  }
  if (!schema.properties.status.enum.includes(data.status)) {
    console.error(`[${file}] Invalid status: ${data.status}`);
    allValid = false;
  }
  if (data.editorialRole && !schema.properties.editorialRole.enum.includes(data.editorialRole)) {
    console.error(`[${file}] Invalid editorialRole: ${data.editorialRole}`);
    allValid = false;
  }
  if (!schema.properties.recommendedArticleType.enum.includes(data.recommendedArticleType)) {
    console.error(`[${file}] Invalid recommendedArticleType: ${data.recommendedArticleType}`);
    allValid = false;
  }

  // Check audience
  if (!data.audience || !data.audience.segment) {
    console.error(`[${file}] Invalid audience: missing segment`);
    allValid = false;
  }

  // Check informationGain
  if (!data.informationGain || !data.informationGain.expectedContribution) {
    console.error(`[${file}] Invalid informationGain`);
    allValid = false;
  }

  // Check no extra unexpected root properties if additionalProperties: false
  for (const key of Object.keys(data)) {
    if (!schema.properties[key]) {
      console.error(`[${file}] Disallowed property: ${key}`);
      allValid = false;
    }
  }

  console.log(`[PASS] ${file} (status: ${data.status}, territory: ${data.territory})`);
}

if (allValid) {
  console.log('SUCCESS: All seed fixtures strictly conform to topic.schema.json!');
  process.exit(0);
} else {
  console.error('FAILURE: Schema validation failed.');
  process.exit(1);
}
