#!/usr/bin/env node
/**
 * Simple, reliable types.ts manager
 * Instead of trying to surgically modify the file, we parse it and regenerate the sections
 */

const fs = require('fs');

/**
 * Get all stack types from types.ts
 */
function getStackTypes(typesPath) {
  const content = fs.readFileSync(typesPath, 'utf8');
  const enumMatch = content.match(/export enum StackType \{([^}]+)\}/);
  if (!enumMatch) return [];

  const entries = enumMatch[1].trim().split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => {
      const match = line.match(/(\w+)\s*=\s*"(\w+)"/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  return entries;
}

/**
 * Add a stack type to types.ts
 */
function addStackType(typesPath, stackName) {
  const content = fs.readFileSync(typesPath, 'utf8');
  const stackTypes = getStackTypes(typesPath);

  // Check if already exists
  if (stackTypes.includes(stackName)) {
    return false;
  }

  // Add to list
  stackTypes.push(stackName);

  // Regenerate the file sections
  return regenerateTypesFile(typesPath, stackTypes);
}

/**
 * Remove a stack type from types.ts
 */
function removeStackType(typesPath, stackName) {
  const stackTypes = getStackTypes(typesPath);
  const filtered = stackTypes.filter(s => s !== stackName);

  if (filtered.length === stackTypes.length) {
    return false; // Wasn't there
  }

  return regenerateTypesFile(typesPath, filtered);
}

/**
 * Regenerate the types.ts file with the given stack types
 */
function regenerateTypesFile(typesPath, stackTypes) {
  // Read the original file
  const content = fs.readFileSync(typesPath, 'utf8');

  // Find the sections to replace
  const beforeEnum = content.substring(0, content.indexOf('export enum StackType'));
  const afterResources = content.substring(content.indexOf('export const getStackName'));

  // Generate enum
  const enumLines = stackTypes.map(st => `  ${st} = "${st}",`).join('\n');
  const enumSection = `export enum StackType {\n${enumLines}\n}\n`;

  // Generate STACK_ORDER
  const orderLines = stackTypes.map(st => `  StackType.${st},`).join('\n');
  const orderSection = `\nexport const STACK_ORDER: StackType[] = [\n${orderLines}\n];\n`;

  // Generate TEMPLATE_PATHS
  const templateLines = stackTypes.map(st => {
    const templateDir = stackTypeToTemplateDir(st);
    return `  [StackType.${st}]: join(\n    __dirname,\n    "templates/${templateDir}/cfn-template.yaml",\n  ),`;
  }).join('\n');
  const templateSection = `\nexport const TEMPLATE_PATHS: Record<StackType, string> = {\n${templateLines}\n};\n`;

  // Generate TEMPLATE_RESOURCES_PATHS
  const resourcesLines = stackTypes.map(st => {
    const templateDir = stackTypeToTemplateDir(st);
    return `  [StackType.${st}]: join(__dirname, "templates/${templateDir}/"),`;
  }).join('\n');
  const resourcesSection = `\nexport const TEMPLATE_RESOURCES_PATHS: Record<StackType, string> = {\n${resourcesLines}\n};\n`;

  // Combine all sections
  const newContent = beforeEnum + enumSection + orderSection + templateSection + resourcesSection + '\n' + afterResources;

  fs.writeFileSync(typesPath, newContent, 'utf8');
  return true;
}

/**
 * Convert StackType name to template directory name
 */
function stackTypeToTemplateDir(stackType) {
  // Known mappings
  const knownMappings = {
    'WAF': 'waf',
    'Shared': 'shared',
    'CWL': 'cwl',
    'AwsExample': 'aws-example',
    'TheStoryForge': 'the-story-forge',
    'TheStoryHub': 'the-story-hub',
  };

  if (knownMappings[stackType]) {
    return knownMappings[stackType];
  }

  // Fallback: Convert PascalCase to kebab-case
  return stackType
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

module.exports = {
  getStackTypes,
  addStackType,
  removeStackType,
  regenerateTypesFile,
};
