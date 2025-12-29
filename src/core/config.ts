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
  OPERATIONS_ALLOWED: string[];
  outputFileName?: string;
}

const CONFIG_DIR = '.db-ai';
const CONFIG_FILE = 'dbConfig.json';

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

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent) as DatabaseConfig;

  validateConfig(config);
  return config;
}

export function validateConfig(config: DatabaseConfig): void {
  const requiredFields: (keyof DatabaseConfig)[] = [
    'provider',
    'host',
    'port',
    'user',
    'password',
    'database',
    'OPERATIONS_ALLOWED',
  ];

  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null || config[field] === '') {
      throw new Error(`Missing required field in config: ${field}`);
    }
  }

  if (!Array.isArray(config.OPERATIONS_ALLOWED)) {
    throw new Error('OPERATIONS_ALLOWED must be an array');
  }
}

export function getConnectionString(config: DatabaseConfig): string {
  const { provider, host, port, user, password, database } = config;
  
  switch (provider.toLowerCase()) {
    case 'postgresql':
    case 'postgres':
      return `postgresql://${user}:${password}@${host}:${port}/${database}`;
    case 'mysql':
      return `mysql://${user}:${password}@${host}:${port}/${database}`;
    case 'sqlite':
      return `file:${database}`;
    case 'sqlserver':
    case 'mssql':
      return `sqlserver://${host}:${port};database=${database};user=${user};password=${password}`;
    default:
      return `${provider}://${user}:${password}@${host}:${port}/${database}`;
  }
}

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  const config = loadConfig();
  const connectionString = getConnectionString(config);

  // Set DATABASE_URL for Prisma
  process.env.DATABASE_URL = connectionString;

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

  prismaClient = new PrismaClientClass({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  return prismaClient;
}

export function getConfigDir(): string {
  return path.join(process.cwd(), CONFIG_DIR);
}

