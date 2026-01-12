import * as fs from 'fs';
import * as path from 'path';

// PrismaClient type - loaded dynamically at runtime
type PrismaClient = any;

export interface DatabaseConfig {
  provider: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  schema?: string;
  OPERATIONS_ALLOWED: string[];
  outputFileName?: string;
}

const CONFIG_DIR = '.db-ai';
const CONFIG_FILE = 'prisma.config.ts';

export function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
}

export function loadConfig(): DatabaseConfig {
  const configPath = getConfigPath();
  
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration file not found at ${configPath}. Please run 'db-ai init' first.`
    );
  }

  // Dynamically require the prisma.config.ts file
  // Delete from cache to ensure fresh load
  delete require.cache[require.resolve(configPath)];
  const configModule = require(configPath);
  
  // Get Prisma config (default export) and db-ai config (named export)
  const prismaConfig = configModule.default || configModule;
  const dbAiConfig = configModule.dbAiConfig || {};
  
  // Extract database config from prisma.config.ts
  // datasource.url is handled by Prisma 7 automatically
  const config: DatabaseConfig = {
    provider: extractProviderFromUrl(prismaConfig.datasource?.url),
    host: '', // Not needed - Prisma reads from datasource.url
    port: 0, // Not needed - Prisma reads from datasource.url
    user: '', // Not needed - Prisma reads from datasource.url
    password: '', // Not needed - Prisma reads from datasource.url
    database: '', // Not needed - Prisma reads from datasource.url
    schema: undefined, // Not needed - Prisma reads from datasource.url
    OPERATIONS_ALLOWED: dbAiConfig.OPERATIONS_ALLOWED || ['SELECT'],
    outputFileName: dbAiConfig.outputFileName,
  };

  validateConfig(config);
  return config;
}

function extractProviderFromUrl(url?: string): string {
  if (!url) return 'postgresql';
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) return 'postgresql';
  if (url.startsWith('mysql://')) return 'mysql';
  if (url.startsWith('sqlite://') || url.startsWith('file:')) return 'sqlite';
  if (url.startsWith('sqlserver://') || url.startsWith('mssql://')) return 'sqlserver';
  return 'postgresql';
}

export function validateConfig(config: DatabaseConfig): void {
  // Only validate fields that are actually needed
  if (!config.provider) {
    throw new Error('Missing required field in config: provider');
  }

  if (!Array.isArray(config.OPERATIONS_ALLOWED)) {
    throw new Error('OPERATIONS_ALLOWED must be an array');
  }
}


let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  // Try to load Prisma Client from the user's project directory
  // This allows the generated client to be used
  const projectRoot = process.cwd();
  let PrismaClientClass: any;
  
  try {
    // Try to load from user's project node_modules first
    const userPrismaPath = path.join(projectRoot, 'node_modules', '@prisma', 'client');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    PrismaClientClass = require(userPrismaPath).PrismaClient;
  } catch {
    // Fall back to package's Prisma Client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    PrismaClientClass = require('@prisma/client').PrismaClient;
  }

  // Prisma 7: Reads datasource.url from prisma.config.ts automatically
  // No need to pass it explicitly
  prismaClient = new PrismaClientClass();

  return prismaClient;
}

export function getConfigDir(): string {
  return path.join(process.cwd(), CONFIG_DIR);
}

