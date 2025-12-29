#!/usr/bin/env node

// Export query executor functions for use in scripts
// These exports are available when the package is imported
export { getConfigDir, getPrismaClient, loadConfig } from './core/config';
export { executeAndPrint, executeQuery, QueryResult } from './core/queryExecutor';

// Only run CLI if this is the main module (not when imported)
if (require.main === module) {
  const { Command } = require('commander');
  const { initCommand } = require('./commands/init');
  const { runCommand } = require('./commands/run');
  const { startCommand } = require('./commands/start');

  const program = new Command();

program
  .name('db-ai')
  .description('A package to allow AI to access databases with ease using Prisma')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize db-ai configuration folder')
  .action(initCommand);

program
  .command('start')
  .description('Pull database schema using Prisma introspection')
  .action(startCommand);

program
  .command('run')
  .description('Execute SQL query or run a TypeScript file')
  .option('--sql <query>', 'SQL query to execute')
  .option('--file <path>', 'Path to TypeScript file to execute')
  .action(runCommand);

  program.parse();
}

