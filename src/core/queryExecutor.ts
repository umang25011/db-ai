import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - json-stringify-safe doesn't have TypeScript types
import stringify from 'json-stringify-safe';
import { getConfigDir, getPrismaClient, loadConfig } from './config';

export interface QueryResult {
  data: any;
  timestamp: string;
  query: string;
}

function detectOperationType(sql: string): string {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (trimmed.startsWith('CREATE')) return 'CREATE';
  if (trimmed.startsWith('DROP')) return 'DROP';
  if (trimmed.startsWith('ALTER')) return 'ALTER';
  return 'UNKNOWN';
}

function validateOperation(sql: string): void {
  const config = loadConfig();
  const operation = detectOperationType(sql);
  
  if (!config.OPERATIONS_ALLOWED.includes(operation)) {
    throw new Error(
      `Operation '${operation}' is not allowed. Allowed operations: ${config.OPERATIONS_ALLOWED.join(', ')}`
    );
  }
}

// Helper function to handle special types during JSON serialization
function createReplacer(): (key: string, value: any) => any {
  return (key: string, value: any) => {
    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    // Handle Date objects - convert to ISO string
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle undefined - JSON.stringify omits it, but we can show it explicitly
    if (value === undefined) {
      return '[undefined]';
    }
    
    // Handle functions
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    
    // Handle Symbol
    if (typeof value === 'symbol') {
      return value.toString();
    }
    
    // Handle Map
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }
    
    // Handle Set
    if (value instanceof Set) {
      return Array.from(value);
    }
    
    // Handle RegExp
    if (value instanceof RegExp) {
      return value.toString();
    }
    
    // Handle Error objects
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    
    // Handle NaN and Infinity
    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return '[NaN]';
      }
      if (!Number.isFinite(value)) {
        return value > 0 ? '[Infinity]' : '[-Infinity]';
      }
    }
    
    // Handle Buffer (Node.js)
    if (Buffer.isBuffer(value)) {
      return value.toString('base64');
    }
    
    return value;
  };
}

// Helper function to safely stringify JSON with comprehensive error handling
// Uses json-stringify-safe for circular references and custom replacer for special types
function safeStringify(obj: any, space?: number): string {
  const replacer = createReplacer();
  
  try {
    // First apply our replacer to handle special types, then use json-stringify-safe for circular refs
    // json-stringify-safe handles circular references automatically
    return stringify(obj, replacer, space);
  } catch (error) {
    // If that fails, try to create a more useful representation
    try {
      // Try to manually process arrays and objects
      if (Array.isArray(obj)) {
        return stringify(
          obj.map(item => replacer('', item)),
          null,
          space
        );
      }
      if (typeof obj === 'object' && obj !== null) {
        const processed: any = {};
        for (const [k, v] of Object.entries(obj)) {
          processed[k] = replacer(k, v);
        }
        return stringify(processed, null, space);
      }
      return String(obj);
    } catch {
      // Last resort: return a placeholder string
      return '[Unable to serialize result]';
    }
  }
}

function appendToOutputFile(result: QueryResult): void {
  const config = loadConfig();
  
  if (!config.outputFileName) {
    return;
  }

  const outputPath = path.join(getConfigDir(), config.outputFileName);
  const logEntry = `
=== Query Execution ===
Timestamp: ${result.timestamp}
Query: ${result.query}
Result: ${safeStringify(result.data, 2)}
===========================================
`;

  fs.appendFileSync(outputPath, logEntry, 'utf-8');
}

export async function executeQuery(sql: string): Promise<QueryResult> {
  validateOperation(sql);
  
  const prisma = getPrismaClient();
  const timestamp = new Date().toISOString();
  
  try {
    const operation = detectOperationType(sql);
    let data: any;

    if (operation === 'SELECT') {
      // Use $queryRawUnsafe for SELECT queries
      data = await prisma.$queryRawUnsafe(sql);
    } else {
      // For non-SELECT operations, use $executeRawUnsafe
      const result = await prisma.$executeRawUnsafe(sql);
      data = { affectedRows: result };
    }

    const result: QueryResult = {
      data,
      timestamp,
      query: sql,
    };

    appendToOutputFile(result);
    return result;
  } catch (error: any) {
    const errorResult: QueryResult = {
      data: { error: error.message },
      timestamp,
      query: sql,
    };
    
    appendToOutputFile(errorResult);
    throw error;
  }
}

export async function executeAndPrint(sql: string): Promise<QueryResult> {
  const result = await executeQuery(sql);
  
  console.log('\n=== Query Result ===');
  console.log(`Timestamp: ${result.timestamp}`);
  console.log(`Query: ${result.query}`);
  console.log('Result:');
  console.log(safeStringify(result.data, 2));
  console.log('===================\n');
  
  return result;
}

