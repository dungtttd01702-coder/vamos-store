/**
 * State-Aware T-SQL Batch Parser, Checksum Helper & Migration File Discovery
 * Avoids naive regex splitting inside strings, identifiers, or comments.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MAX_GO_REPEAT = 100;
const MIGRATION_FILE_PATTERN = /^(\d+)_([a-zA-Z0-9_.-]+)\.sql$/;

/**
 * Strip UTF-8 BOM if present and normalize CRLF to LF for line scanning.
 * @param {string} rawSql
 * @returns {string}
 */
function normalizeSqlInput(rawSql) {
  if (typeof rawSql !== 'string') {
    throw new TypeError('SQL content must be a string.');
  }
  const withoutBom = rawSql.charCodeAt(0) === 0xFEFF ? rawSql.slice(1) : rawSql;
  return withoutBom.replace(/\r\n/g, '\n');
}

/**
 * Parse a standalone GO directive line (e.g. GO, GO 3, GO -- comment).
 * Returns repeat count (integer >= 1) or null if line is NOT a GO directive.
 * Throws explicit Error on malformed GO directive syntax.
 * @param {string} line
 * @param {number} lineNumber
 * @returns {number|null}
 */
function parseGoDirectiveLine(line, lineNumber) {
  const match = /^\s*GO(?=$|\s|--|\/\*)(.*)$/i.exec(line);
  if (!match) {
    return null;
  }

  let rest = match[1].trim();
  let repeatCount = 1;

  if (rest.length > 0 && !rest.startsWith('--') && !rest.startsWith('/*')) {
    const tokenMatch = /^(\S+)(.*)$/.exec(rest);
    const token = tokenMatch[1];
    if (!/^[1-9]\d*$/.test(token)) {
      throw new Error(`Invalid GO batch directive token "${token}" at line ${lineNumber}. Expected positive integer repeat count.`);
    }
    repeatCount = Number.parseInt(token, 10);
    if (!Number.isSafeInteger(repeatCount) || repeatCount > MAX_GO_REPEAT) {
      throw new Error(`Unsupported GO repeat count ${repeatCount} at line ${lineNumber} (max allowed: ${MAX_GO_REPEAT}).`);
    }
    rest = tokenMatch[2].trim();
  }

  // Remaining text on a GO line may only consist of single-line block comments and/or `--` line comment
  while (rest.length > 0) {
    if (rest.startsWith('--')) {
      break;
    }
    if (rest.startsWith('/*')) {
      const closeIdx = rest.indexOf('*/', 2);
      if (closeIdx === -1) {
        throw new Error(`Unsupported multiline block comment on GO directive at line ${lineNumber}.`);
      }
      rest = rest.slice(closeIdx + 2).trim();
      continue;
    }
    throw new Error(`Unexpected trailing SQL token on GO directive line ${lineNumber}: "${rest}".`);
  }

  return repeatCount;
}

const DELIMITED_END_CHARS = {
  SINGLE_QUOTE: '\'',
  DOUBLE_QUOTE: '"',
  BRACKET: ']'
};

/**
 * Advance T-SQL lexical state across one line (never inside GO directive check).
 * @param {string} line
 * @param {{ mode: string, blockDepth: number }} state
 */
function advanceLexicalState(line, state) {
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];

    const endChar = DELIMITED_END_CHARS[state.mode];
    if (endChar) {
      if (ch === endChar && next === endChar) {
        i += 2;
      } else {
        if (ch === endChar) state.mode = 'NORMAL';
        i += 1;
      }
      continue;
    }

    if (state.mode === 'BLOCK_COMMENT') {
      if (ch === '/' && next === '*') {
        state.blockDepth += 1;
        i += 2;
      } else if (ch === '*' && next === '/') {
        state.blockDepth -= 1;
        if (state.blockDepth === 0) state.mode = 'NORMAL';
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    if (ch === '-' && next === '-') break;
    if (ch === '/' && next === '*') {
      state.mode = 'BLOCK_COMMENT';
      state.blockDepth = 1;
      i += 2;
      continue;
    }
    if (ch === '\'') state.mode = 'SINGLE_QUOTE';
    else if (ch === '"') state.mode = 'DOUBLE_QUOTE';
    else if (ch === '[') state.mode = 'BRACKET';
    i += 1;
  }
}

/**
 * Split T-SQL script into executable batches respecting strings, identifiers, comments, BOM, CRLF/LF, and GO count.
 * @param {string} rawSql
 * @returns {string[]}
 */
function splitSqlBatches(rawSql) {
  const normalized = normalizeSqlInput(rawSql);
  const lines = normalized.split('\n');
  const batches = [];
  let bufferLines = [];
  const lexState = { mode: 'NORMAL', blockDepth: 0 };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const canBeGo = lexState.mode === 'NORMAL' && lexState.blockDepth === 0;
    const goCount = canBeGo ? parseGoDirectiveLine(line, idx + 1) : null;

    if (goCount !== null) {
      const batchSql = bufferLines.join('\n').trim();
      if (batchSql.length > 0) {
        for (let r = 0; r < goCount; r++) {
          batches.push(batchSql);
        }
      }
      bufferLines = [];
      continue;
    }

    bufferLines.push(line);
    advanceLexicalState(line, lexState);
  }

  const trailingSql = bufferLines.join('\n').trim();
  if (trailingSql.length > 0) {
    batches.push(trailingSql);
  }

  return batches;
}

/**
 * Compute raw SHA-256 hex digest over exact file bytes/string.
 * @param {Buffer|string} content
 * @returns {string}
 */
function computeSha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Discover, validate, check duplicates/sequence gaps, and sort migration SQL files numerically.
 * @param {string} migrationsDir
 * @returns {{ files: Array<{ file: string, version: string, versionNum: number, fullPath: string, checksum: string }>, sequenceGaps: number[] }}
 */
function discoverMigrationFiles(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) {
    return { files: [], sequenceGaps: [] };
  }

  const rawEntries = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const parsed = [];
  const seenNumbers = new Map();

  for (const file of rawEntries) {
    const match = MIGRATION_FILE_PATTERN.exec(file);
    if (!match) {
      throw new Error(`Invalid migration filename "${file}". Expected numeric prefix format "<NNN>_<name>.sql".`);
    }

    const versionNum = Number.parseInt(match[1], 10);
    if (!Number.isSafeInteger(versionNum) || versionNum <= 0) {
      throw new Error(`Invalid migration version number in "${file}". Version must be a positive integer.`);
    }

    if (seenNumbers.has(versionNum)) {
      throw new Error(
        `Duplicate migration version number ${versionNum}: "${seenNumbers.get(versionNum)}" and "${file}".`
      );
    }
    seenNumbers.set(versionNum, file);

    const fullPath = path.join(migrationsDir, file);
    const rawBuffer = fs.readFileSync(fullPath);
    parsed.push({
      file,
      version: file.replace(/\.sql$/, ''),
      versionNum,
      fullPath,
      checksum: computeSha256(rawBuffer)
    });
  }

  parsed.sort((a, b) => a.versionNum - b.versionNum);

  const sequenceGaps = [];
  for (let i = 0; i < parsed.length; i++) {
    const expectedNum = i + 1;
    if (i === 0 && parsed[i].versionNum > 1) {
      for (let missing = 1; missing < parsed[i].versionNum; missing++) {
        sequenceGaps.push(missing);
      }
    } else if (i > 0 && parsed[i].versionNum !== parsed[i - 1].versionNum + 1) {
      for (let missing = parsed[i - 1].versionNum + 1; missing < parsed[i].versionNum; missing++) {
        sequenceGaps.push(missing);
      }
    } else if (parsed[i].versionNum !== expectedNum && sequenceGaps.length === 0) {
      sequenceGaps.push(expectedNum);
    }
  }

  return { files: parsed, sequenceGaps };
}

module.exports = {
  MAX_GO_REPEAT,
  splitSqlBatches,
  computeSha256,
  discoverMigrationFiles,
  parseGoDirectiveLine
};
