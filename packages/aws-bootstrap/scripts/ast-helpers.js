#!/usr/bin/env node
/**
 * AST-based helpers for modifying TypeScript files
 * This replaces fragile regex manipulation with proper AST parsing
 */

const ts = require('typescript');
const fs = require('fs');

/**
 * Add an entry to a TypeScript enum
 */
function addToEnum(filePath, enumName, entryName, entryValue) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let enumNode = null;

  function visit(node) {
    if (ts.isEnumDeclaration(node) && node.name.text === enumName) {
      enumNode = node;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!enumNode) return false;

  // Check if entry already exists
  const exists = enumNode.members.some(
    member => ts.isEnumMember(member) && member.name.text === entryName
  );

  if (exists) return false;

  // Find the closing brace of the enum
  const lastMember = enumNode.members[enumNode.members.length - 1];
  const lastMemberEnd = lastMember.getEnd();

  // Find the position of the closing brace
  let closingBracePos = enumNode.getEnd() - 1;
  while (closingBracePos > lastMemberEnd && sourceText[closingBracePos] !== '}') {
    closingBracePos--;
  }

  // Check if there's already a comma immediately after the last member
  let checkPos = lastMemberEnd;
  while (checkPos < closingBracePos && /\s/.test(sourceText[checkPos])) {
    checkPos++;
  }
  const needsComma = sourceText[checkPos] !== ',';

  // Build the new member with proper indentation
  const indent = getIndentation(sourceText, lastMember.getStart());
  const newMember = `${needsComma ? ',' : ''}\n${indent}${entryName} = "${entryValue}",`;

  // Insert before the closing brace
  const newText =
    sourceText.slice(0, lastMemberEnd) +
    newMember +
    sourceText.slice(lastMemberEnd, closingBracePos) +
    '\n' + sourceText.slice(closingBracePos);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Add an entry to a TypeScript array constant
 */
function addToArray(filePath, arrayName, newEntry) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let arrayNode = null;

  function visit(node) {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0
    ) {
      const decl = node.declarationList.declarations[0];

      if (
        ts.isVariableDeclaration(decl) &&
        decl.name.text === arrayName &&
        decl.initializer &&
        ts.isArrayLiteralExpression(decl.initializer)
      ) {
        arrayNode = decl.initializer;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!arrayNode) return false;

  // Check if entry already exists
  const exists = arrayNode.elements.some(
    elem => sourceText.substring(elem.getStart(), elem.getEnd()).includes(newEntry)
  );

  if (exists) return false;

  // Find the closing bracket
  const lastElement = arrayNode.elements[arrayNode.elements.length - 1];
  const lastElementEnd = lastElement.getEnd();

  let closingBracketPos = arrayNode.getEnd() - 1;
  while (closingBracketPos > lastElementEnd && sourceText[closingBracketPos] !== ']') {
    closingBracketPos--;
  }

  // Check if there's already a comma immediately after the last element
  let checkPos = lastElementEnd;
  while (checkPos < closingBracketPos && /\s/.test(sourceText[checkPos])) {
    checkPos++;
  }
  const needsComma = sourceText[checkPos] !== ',';

  // Build the new element with proper indentation
  const indent = getIndentation(sourceText, lastElement.getStart());
  const newElement = `${needsComma ? ',' : ''}\n${indent}${newEntry},`;

  // Insert before the closing bracket
  const newText =
    sourceText.slice(0, lastElementEnd) +
    newElement +
    sourceText.slice(lastElementEnd, closingBracketPos) +
    '\n' + sourceText.slice(closingBracketPos);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Add an entry to a TypeScript Record/object literal
 */
function addToRecord(filePath, recordName, key, value) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let objNode = null;

  function visit(node) {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0
    ) {
      const decl = node.declarationList.declarations[0];

      if (
        ts.isVariableDeclaration(decl) &&
        decl.name.text === recordName &&
        decl.initializer &&
        ts.isObjectLiteralExpression(decl.initializer)
      ) {
        objNode = decl.initializer;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!objNode) return false;

  // Check if key already exists
  const exists = objNode.properties.some(
    prop => sourceText.substring(prop.getStart(), prop.getEnd()).includes(key)
  );

  if (exists) return false;

  // Find the closing brace
  const lastProp = objNode.properties[objNode.properties.length - 1];
  const lastPropEnd = lastProp.getEnd();

  let closingBracePos = objNode.getEnd() - 1;
  while (closingBracePos > lastPropEnd && sourceText[closingBracePos] !== '}') {
    closingBracePos--;
  }

  // Check if there's already a comma immediately after the last property
  let checkPos = lastPropEnd;
  while (checkPos < closingBracePos && /\s/.test(sourceText[checkPos])) {
    checkPos++;
  }
  const needsComma = sourceText[checkPos] !== ',';

  // Build the new property with proper indentation
  const indent = getIndentation(sourceText, lastProp.getStart());
  const newProp = `${needsComma ? ',' : ''}\n${indent}${key}: ${value},`;

  // Insert before the closing brace
  const newText =
    sourceText.slice(0, lastPropEnd) +
    newProp +
    sourceText.slice(lastPropEnd, closingBracePos) +
    '\n' + sourceText.slice(closingBracePos);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Add an else-if block to the deployStack method
 */
function addDeployHandler(filePath, stackTypeName, handlerFunctionName) {
  const sourceText = fs.readFileSync(filePath, 'utf8');

  // Check if handler call already exists
  if (sourceText.includes(`deploy${handlerFunctionName}(deploymentOptionsWithRegion)`)) {
    return false;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let lastElseIf = null;

  function visit(node) {
    // Find the deployStack method
    if (
      ts.isMethodDeclaration(node) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'deployStack' &&
      node.body
    ) {
      // Find the last "else if (stackType === StackType.XXX)" block
      function findLastElseIf(stmt) {
        if (ts.isIfStatement(stmt)) {
          // Check if this is an else-if for stackType
          if (
            stmt.expression &&
            ts.isBinaryExpression(stmt.expression) &&
            sourceText.substring(stmt.expression.getStart(), stmt.expression.getEnd()).includes('stackType === StackType.')
          ) {
            lastElseIf = stmt;
          }

          // Check the else clause
          if (stmt.elseStatement) {
            findLastElseIf(stmt.elseStatement);
          }
        }

        // Also traverse try-catch blocks
        if (ts.isTryStatement(stmt) && stmt.tryBlock) {
          stmt.tryBlock.statements.forEach(findLastElseIf);
        }

        // Recursively check nested blocks
        if (ts.isBlock(stmt)) {
          stmt.statements.forEach(findLastElseIf);
        }
      }

      node.body.statements.forEach(findLastElseIf);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!lastElseIf || !lastElseIf.thenStatement) return false;

  // Find the end of the then statement (closing brace)
  const thenEnd = lastElseIf.thenStatement.getEnd();

  // Insert new else-if block
  const indent = '      ';
  const newBlock = ` else if (stackType === StackType.${stackTypeName}) {
        // Deploy ${stackTypeName} stack
        await deploy${handlerFunctionName}(deploymentOptionsWithRegion);
      }`;

  const newText = sourceText.slice(0, thenEnd) + newBlock + sourceText.slice(thenEnd);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Add an import statement
 */
/**
 * Adds an import statement to a TypeScript file
 * @param {string} filePath - Path to the file
 * @param {string} importName - What to import (e.g., "COGNITO_GROUPS")
 * @param {string} importPath - Where to import from
 * @param {string} alias - Optional alias (e.g., "TSH_COGNITO_GROUPS")
 * @returns {boolean} - True if added, false if already exists
 */
function addImport(filePath, importName, importPath, alias = null) {
  const sourceText = fs.readFileSync(filePath, 'utf8');

  // Check if import already exists
  if (sourceText.includes(`from "${importPath}"`)) {
    return false;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let lastImportEnd = 0;

  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      lastImportEnd = Math.max(lastImportEnd, node.getEnd());
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (lastImportEnd > 0) {
    const importSpec = alias
      ? `${importName} as ${alias}`
      : importName;
    const newImport = `\nimport { ${importSpec} } from "${importPath}";`;
    const newText = sourceText.slice(0, lastImportEnd) + newImport + sourceText.slice(lastImportEnd);
    fs.writeFileSync(filePath, newText, 'utf8');
    return true;
  }

  return false;
}

/**
 * Get indentation of a line
 */
function getIndentation(text, pos) {
  let lineStart = pos;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') {
    lineStart--;
  }

  let indent = '';
  for (let i = lineStart; i < text.length && (text[i] === ' ' || text[i] === '\t'); i++) {
    indent += text[i];
  }

  return indent;
}

/**
 * Remove an entry from a TypeScript enum
 */
function removeFromEnum(filePath, enumName, entryName) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let enumNode = null;
  let targetMember = null;

  function visit(node) {
    if (ts.isEnumDeclaration(node) && node.name.text === enumName) {
      enumNode = node;
      targetMember = node.members.find(
        member => ts.isEnumMember(member) && member.name.text === entryName
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!enumNode || !targetMember) return false;

  // Find the start and end of the member line (including trailing comma and newline)
  const memberStart = targetMember.getStart();
  const memberEnd = targetMember.getEnd();

  // Find line start
  let lineStart = memberStart;
  while (lineStart > 0 && sourceText[lineStart - 1] !== '\n') {
    lineStart--;
  }

  // Find line end (including comma and newline)
  let lineEnd = memberEnd;
  while (lineEnd < sourceText.length && sourceText[lineEnd] !== '\n') {
    lineEnd++;
  }
  if (lineEnd < sourceText.length && sourceText[lineEnd] === '\n') {
    lineEnd++; // Include the newline
  }

  const newText = sourceText.slice(0, lineStart) + sourceText.slice(lineEnd);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Remove an entry from a TypeScript array
 */
function removeFromArray(filePath, arrayName, entryPattern) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let arrayNode = null;
  let targetElement = null;

  function visit(node) {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0
    ) {
      const decl = node.declarationList.declarations[0];

      if (
        ts.isVariableDeclaration(decl) &&
        decl.name.text === arrayName &&
        decl.initializer &&
        ts.isArrayLiteralExpression(decl.initializer)
      ) {
        arrayNode = decl.initializer;
        targetElement = arrayNode.elements.find(
          elem => sourceText.substring(elem.getStart(), elem.getEnd()).includes(entryPattern)
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!arrayNode || !targetElement) return false;

  // Find the start and end of the element line
  const elemStart = targetElement.getStart();
  const elemEnd = targetElement.getEnd();

  let lineStart = elemStart;
  while (lineStart > 0 && sourceText[lineStart - 1] !== '\n') {
    lineStart--;
  }

  let lineEnd = elemEnd;
  while (lineEnd < sourceText.length && sourceText[lineEnd] !== '\n') {
    lineEnd++;
  }
  if (lineEnd < sourceText.length && sourceText[lineEnd] === '\n') {
    lineEnd++;
  }

  const newText = sourceText.slice(0, lineStart) + sourceText.slice(lineEnd);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Remove an entry from a TypeScript Record/object literal
 */
function removeFromRecord(filePath, recordName, keyPattern) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let objNode = null;
  let targetProp = null;

  function visit(node) {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0
    ) {
      const decl = node.declarationList.declarations[0];

      if (
        ts.isVariableDeclaration(decl) &&
        decl.name.text === recordName &&
        decl.initializer &&
        ts.isObjectLiteralExpression(decl.initializer)
      ) {
        objNode = decl.initializer;
        targetProp = objNode.properties.find(
          prop => sourceText.substring(prop.getStart(), prop.getEnd()).includes(keyPattern)
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!objNode || !targetProp) return false;

  // For multi-line properties (like join() calls), we need to find the full extent
  const propStart = targetProp.getStart();
  const propEnd = targetProp.getEnd();

  // Find line start
  let lineStart = propStart;
  while (lineStart > 0 && sourceText[lineStart - 1] !== '\n') {
    lineStart--;
  }

  // Find the end - need to consume the trailing comma and all whitespace/newlines
  let lineEnd = propEnd;
  // Skip past any trailing comma
  while (lineEnd < sourceText.length && /[,\s]/.test(sourceText[lineEnd])) {
    if (sourceText[lineEnd] === '\n') {
      lineEnd++;
      break; // Stop after the first newline after the comma
    }
    lineEnd++;
  }

  const newText = sourceText.slice(0, lineStart) + sourceText.slice(lineEnd);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Add a string literal to a union type (e.g., "tsh" to "cwl" | "awse")
 */
function addToUnionType(filePath, typeName, newLiteral) {
  const sourceText = fs.readFileSync(filePath, 'utf8');

  // Check if literal already exists in the type
  const literalPattern = `"${newLiteral}"`;
  if (sourceText.includes(literalPattern)) {
    return false;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let typeNode = null;

  function visit(node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      typeNode = node;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!typeNode || !typeNode.type || !ts.isUnionTypeNode(typeNode.type)) {
    return false;
  }

  // Find the last literal type in the union
  const lastType = typeNode.type.types[typeNode.type.types.length - 1];
  const lastTypeEnd = lastType.getEnd();

  // Insert the new literal after the last one
  const literalToAdd = ` | "${newLiteral}"`;
  const newText = sourceText.slice(0, lastTypeEnd) + literalToAdd + sourceText.slice(lastTypeEnd);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Remove a string literal from a union type
 */
function removeFromUnionType(filePath, typeName, literalToRemove) {
  const sourceText = fs.readFileSync(filePath, 'utf8');

  // Check if literal exists
  const literalPattern = `"${literalToRemove}"`;
  if (!sourceText.includes(literalPattern)) {
    return false;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let typeNode = null;

  function visit(node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      typeNode = node;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!typeNode || !typeNode.type || !ts.isUnionTypeNode(typeNode.type)) {
    return false;
  }

  // Find the literal type to remove
  const targetType = typeNode.type.types.find(t => {
    const typeText = sourceText.substring(t.getStart(), t.getEnd());
    return typeText.includes(literalToRemove);
  });

  if (!targetType) return false;

  // Remove the literal and the preceding " | " or following " | "
  const targetStart = targetType.getStart();
  const targetEnd = targetType.getEnd();

  // Look for " | " before the target
  let removeStart = targetStart;
  let checkPos = targetStart - 1;
  while (checkPos >= 0 && /\s/.test(sourceText[checkPos])) {
    checkPos--;
  }
  if (checkPos >= 0 && sourceText[checkPos] === '|') {
    // Remove the " | " before
    removeStart = checkPos;
    checkPos--;
    while (checkPos >= 0 && /\s/.test(sourceText[checkPos])) {
      removeStart = checkPos;
      checkPos--;
    }
  } else {
    // Remove the " | " after
    let afterPos = targetEnd;
    while (afterPos < sourceText.length && /\s/.test(sourceText[afterPos])) {
      afterPos++;
    }
    if (afterPos < sourceText.length && sourceText[afterPos] === '|') {
      afterPos++;
      while (afterPos < sourceText.length && /\s/.test(sourceText[afterPos])) {
        afterPos++;
      }
      const newText = sourceText.slice(0, targetStart) + sourceText.slice(afterPos);
      fs.writeFileSync(filePath, newText, 'utf8');
      return true;
    }
  }

  const newText = sourceText.slice(0, removeStart) + sourceText.slice(targetEnd);
  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Add a StackType condition to the admin email if statement
 * Looks for pattern: if (stack === "all" || stack === StackType.X || ...)
 */
function addToAdminEmailCondition(filePath, stackTypeName) {
  const sourceText = fs.readFileSync(filePath, 'utf8');

  // Check if already exists
  if (sourceText.includes(`stack === StackType.${stackTypeName}`)) {
    return false;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let targetIfStatement = null;

  function visit(node) {
    // Find if statement with the pattern checking for admin email
    if (ts.isIfStatement(node)) {
      const ifText = sourceText.substring(node.getStart(), node.getEnd());
      // Look for the specific pattern with "adminEmail" variable declaration nearby
      if (ifText.includes('stack === "all"') && ifText.includes('stack === StackType.')) {
        // Verify this is the right if statement by checking context
        const beforeText = sourceText.substring(Math.max(0, node.getStart() - 200), node.getStart());
        if (beforeText.includes('adminEmail')) {
          targetIfStatement = node;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!targetIfStatement || !targetIfStatement.expression) return false;

  // Find the last binary expression in the condition (last || clause)
  let lastCondition = targetIfStatement.expression;
  while (ts.isBinaryExpression(lastCondition) && lastCondition.right) {
    if (lastCondition.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
      // This is an || operator, check if there's more
      if (ts.isBinaryExpression(lastCondition.right) &&
          lastCondition.right.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        lastCondition = lastCondition.right;
      } else {
        // This is the last ||, add after the right side
        break;
      }
    } else {
      break;
    }
  }

  const insertPos = lastCondition.getEnd();
  const newCondition = ` ||\n            stack === StackType.${stackTypeName}`;
  const newText = sourceText.slice(0, insertPos) + newCondition + sourceText.slice(insertPos);

  fs.writeFileSync(filePath, newText, 'utf8');
  return true;
}

/**
 * Remove a StackType condition from the admin email if statement
 */
function removeFromAdminEmailCondition(filePath, stackTypeName) {
  const sourceText = fs.readFileSync(filePath, 'utf8');

  // Check if exists
  if (!sourceText.includes(`stack === StackType.${stackTypeName}`)) {
    return false;
  }

  // Use regex to remove the condition and the preceding ||
  const patterns = [
    // Pattern: || stack === StackType.TheStoryHub (with possible newlines and whitespace)
    new RegExp(`\\s*\\|\\|\\s*\\n?\\s*stack === StackType\\.${stackTypeName}`, 'g'),
    // Pattern: stack === StackType.TheStoryHub || (if it's not the last one)
    new RegExp(`stack === StackType\\.${stackTypeName}\\s*\\|\\|\\s*\\n?\\s*`, 'g'),
  ];

  let newText = sourceText;
  for (const pattern of patterns) {
    newText = newText.replace(pattern, '');
  }

  if (newText !== sourceText) {
    fs.writeFileSync(filePath, newText, 'utf8');
    return true;
  }

  return false;
}

/**
 * Adds a new property to an object literal (for STACK_TYPE_CONFIG)
 * @param {string} filePath - Path to the TypeScript file
 * @param {string} objectName - Name of the object variable (e.g., "STACK_TYPE_CONFIG")
 * @param {string} propertyKey - Key to add (e.g., "tsh")
 * @param {object} propertyValue - Object with the property values
 * @returns {boolean} - True if added, false if already exists or error
 */
function addToObjectLiteral(filePath, objectName, propertyKey, propertyValue) {
  try {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
    );

    // Find the object literal assignment
    let objectLiteral = null;
    let found = false;

    function visit(node) {
      if (found) return;

      // Look for: const STACK_TYPE_CONFIG: ... = { ... }
      if (
        ts.isVariableStatement(node) &&
        node.declarationList.declarations.length > 0
      ) {
        const decl = node.declarationList.declarations[0];
        if (
          ts.isVariableDeclaration(decl) &&
          decl.name.getText(sourceFile) === objectName &&
          decl.initializer &&
          ts.isObjectLiteralExpression(decl.initializer)
        ) {
          objectLiteral = decl.initializer;
          found = true;
          return;
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (!objectLiteral) {
      console.error(`Could not find object literal: ${objectName}`);
      return false;
    }

    // Check if property already exists
    const existingProp = objectLiteral.properties.find(
      (prop) =>
        ts.isPropertyAssignment(prop) &&
        prop.name.getText(sourceFile) === propertyKey,
    );

    if (existingProp) {
      console.log(`Property "${propertyKey}" already exists in ${objectName}`);
      return false;
    }

    // Build the new property text
    const newPropertyText = `  ${propertyKey}: {
    stackTypeEnum: StackType.${propertyValue.stackTypeEnum},
    cognitoGroups: ${propertyValue.cognitoGroupsImport},
    outputKey: "${propertyValue.outputKey}",
    adminGroup: "${propertyValue.adminGroup}",
    usesSimpleSchema: ${propertyValue.usesSimpleSchema},
  }`;

    // Find insertion point (after last property, before closing brace)
    const lastProperty =
      objectLiteral.properties[objectLiteral.properties.length - 1];
    const insertPos = lastProperty.getEnd();

    // Insert with comma before the new property
    const newText =
      sourceText.slice(0, insertPos) +
      ",\n" +
      newPropertyText +
      sourceText.slice(insertPos);

    fs.writeFileSync(filePath, newText, "utf8");
    return true;
  } catch (error) {
    console.error(`Error adding to object literal: ${error.message}`);
    return false;
  }
}

/**
 * Removes a property from an object literal
 * @param {string} filePath - Path to the TypeScript file
 * @param {string} objectName - Name of the object variable
 * @param {string} propertyKey - Key to remove
 * @returns {boolean} - True if removed, false if not found
 */
function removeFromObjectLiteral(filePath, objectName, propertyKey) {
  try {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
    );

    // Find the object literal
    let objectLiteral = null;
    let found = false;

    function visit(node) {
      if (found) return;

      if (
        ts.isVariableStatement(node) &&
        node.declarationList.declarations.length > 0
      ) {
        const decl = node.declarationList.declarations[0];
        if (
          ts.isVariableDeclaration(decl) &&
          decl.name.getText(sourceFile) === objectName &&
          decl.initializer &&
          ts.isObjectLiteralExpression(decl.initializer)
        ) {
          objectLiteral = decl.initializer;
          found = true;
          return;
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (!objectLiteral) {
      console.error(`Could not find object literal: ${objectName}`);
      return false;
    }

    // Find the property to remove
    const propertyToRemove = objectLiteral.properties.find(
      (prop) =>
        ts.isPropertyAssignment(prop) &&
        prop.name.getText(sourceFile) === propertyKey,
    );

    if (!propertyToRemove) {
      console.log(`Property "${propertyKey}" not found in ${objectName}`);
      return false;
    }

    // Get the start position (including leading comma/whitespace)
    let startPos = propertyToRemove.getFullStart();
    let endPos = propertyToRemove.getEnd();

    // Check for trailing comma and include it
    const textAfter = sourceText.slice(endPos, endPos + 10);
    if (textAfter.trimStart().startsWith(",")) {
      endPos = endPos + textAfter.indexOf(",") + 1;
    }

    // Remove property (including surrounding whitespace/newlines)
    const before = sourceText.slice(0, startPos).replace(/,?\s*$/, "");
    const after = sourceText.slice(endPos).replace(/^\s*\n/, "");

    fs.writeFileSync(filePath, before + "\n" + after, "utf8");
    return true;
  } catch (error) {
    console.error(`Error removing from object literal: ${error.message}`);
    return false;
  }
}

/**
 * Adds a case to a switch statement
 * @param {string} filePath - Path to the TypeScript file
 * @param {string} functionName - Name of the function containing the switch
 * @param {string} caseValue - The case value (e.g., "StackType.TheStoryHub")
 * @param {string} returnValue - The return value (e.g., '"tsh"')
 * @returns {boolean} - True if added, false if already exists
 */
function addToSwitchStatement(filePath, functionName, caseValue, returnValue) {
  try {
    const sourceText = fs.readFileSync(filePath, 'utf8');

    // Check if case already exists
    if (sourceText.includes(`case ${caseValue}:`)) {
      return false;
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    let switchStatement = null;
    let found = false;

    function visit(node) {
      if (found) return;

      // Find the function declaration
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        node.name.getText(sourceFile) === functionName
      ) {
        // Find switch statement inside this function
        function findSwitch(n) {
          if (ts.isSwitchStatement(n)) {
            switchStatement = n;
            found = true;
            return;
          }
          ts.forEachChild(n, findSwitch);
        }
        ts.forEachChild(node, findSwitch);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (!switchStatement) {
      console.error(`Could not find switch statement in function: ${functionName}`);
      return false;
    }

    // Find the default case
    const defaultClause = switchStatement.caseBlock.clauses.find(c =>
      ts.isDefaultClause(c)
    );

    if (!defaultClause) {
      console.error('Could not find default clause in switch statement');
      return false;
    }

    // Insert new case before default
    const insertPos = defaultClause.getFullStart();
    const indent = '    '; // 4 spaces
    const newCase = `${indent}case ${caseValue}:\n${indent}  return ${returnValue};\n`;

    const newText = sourceText.slice(0, insertPos) + newCase + sourceText.slice(insertPos);

    fs.writeFileSync(filePath, newText, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error adding to switch statement: ${error.message}`);
    return false;
  }
}

/**
 * Removes a case from a switch statement
 * @param {string} filePath - Path to the TypeScript file
 * @param {string} functionName - Name of the function containing the switch
 * @param {string} caseValue - The case value to remove
 * @returns {boolean} - True if removed, false if not found
 */
function removeFromSwitchStatement(filePath, functionName, caseValue) {
  try {
    const sourceText = fs.readFileSync(filePath, 'utf8');

    // Check if case exists
    if (!sourceText.includes(`case ${caseValue}:`)) {
      return false;
    }

    // Use regex to remove the case (including the return statement)
    const casePattern = new RegExp(
      `\\s*case ${caseValue.replace(/\./g, '\\.')}:\\s*\\n\\s*return [^;]+;\\s*\\n`,
      'g'
    );

    const newText = sourceText.replace(casePattern, '');

    if (newText === sourceText) {
      return false;
    }

    fs.writeFileSync(filePath, newText, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error removing from switch statement: ${error.message}`);
    return false;
  }
}

/**
 * Adds an entry to the DEPLOY_HANDLERS registry in deploy-registry.ts
 * @param {string} filePath - Path to deploy-registry.ts
 * @param {string} stackTypeName - StackType enum value (e.g., "TheStoryHub")
 * @param {string} handlerName - Name of the deploy function (e.g., "deployTheStoryHub")
 * @returns {boolean} - True if added, false if already exists
 */
function addToDeployRegistry(filePath, stackTypeName, handlerName) {
  try {
    const sourceText = fs.readFileSync(filePath, 'utf8');

    // Check if already registered
    if (sourceText.includes(`[StackType.${stackTypeName}]:`)) {
      return false;
    }

    // Find the DEPLOY_HANDLERS object
    const registryPattern = /const DEPLOY_HANDLERS[^{]*\{([^}]+)\};/s;
    const match = sourceText.match(registryPattern);

    if (!match) {
      console.error('Could not find DEPLOY_HANDLERS object');
      return false;
    }

    // Find the last entry before the closing brace
    const lastCommaIndex = match[0].lastIndexOf(',');
    if (lastCommaIndex === -1) {
      console.error('Could not find insertion point in DEPLOY_HANDLERS');
      return false;
    }

    // Insert new entry
    const insertPos = match.index + lastCommaIndex + 1;
    const newEntry = `\n  [StackType.${stackTypeName}]: ${handlerName},`;

    const newText = sourceText.slice(0, insertPos) + newEntry + sourceText.slice(insertPos);

    fs.writeFileSync(filePath, newText, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error adding to deploy registry: ${error.message}`);
    return false;
  }
}

/**
 * Removes an entry from the DEPLOY_HANDLERS registry
 * @param {string} filePath - Path to deploy-registry.ts
 * @param {string} stackTypeName - StackType enum value to remove
 * @returns {boolean} - True if removed, false if not found
 */
function removeFromDeployRegistry(filePath, stackTypeName) {
  try {
    const sourceText = fs.readFileSync(filePath, 'utf8');

    // Check if exists
    if (!sourceText.includes(`[StackType.${stackTypeName}]:`)) {
      return false;
    }

    // Remove the line
    const pattern = new RegExp(`\\s*\\[StackType\\.${stackTypeName}\\]:[^,]+,?\\s*\\n`, 'g');
    const newText = sourceText.replace(pattern, '');

    if (newText === sourceText) {
      return false;
    }

    fs.writeFileSync(filePath, newText, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error removing from deploy registry: ${error.message}`);
    return false;
  }
}

module.exports = {
  addToEnum,
  addToArray,
  addToRecord,
  addDeployHandler,
  addImport,
  removeFromEnum,
  removeFromArray,
  removeFromRecord,
  addToUnionType,
  removeFromUnionType,
  addToAdminEmailCondition,
  removeFromAdminEmailCondition,
  addToObjectLiteral,
  removeFromObjectLiteral,
  addToSwitchStatement,
  removeFromSwitchStatement,
  addToDeployRegistry,
  removeFromDeployRegistry,
};
