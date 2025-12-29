import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getConfigDir } from '../core/config';
import { executeAndPrint } from '../core/queryExecutor';

interface RunOptions {
  sql?: string;
  file?: string;
}

export async function runCommand(options: RunOptions) {
  try {
    if (!options.sql && !options.file) {
      console.error(chalk.red('Error: Either --sql or --file option must be provided'));
      console.log(chalk.yellow('Usage:'));
      console.log(chalk.yellow('  db-ai run --sql "SELECT * FROM users"'));
      console.log(chalk.yellow('  db-ai run --file Script1.ts'));
      process.exit(1);
    }

    if (options.sql && options.file) {
      console.error(chalk.red('Error: Cannot use both --sql and --file options at the same time'));
      process.exit(1);
    }

    if (options.sql) {
      // Execute SQL directly
      console.log(chalk.blue('Executing SQL query...'));
      const result = await executeAndPrint(options.sql);
      console.log(chalk.green('✓ Query executed successfully'));
    } else if (options.file) {
      // Execute TypeScript file
      const filePath = path.isAbsolute(options.file) 
        ? options.file 
        : path.join(process.cwd(), options.file);

      if (!fs.existsSync(filePath)) {
        // Try relative to config dir
        const configDir = getConfigDir();
        const altPath = path.join(configDir, options.file);
        if (fs.existsSync(altPath)) {
          await executeTypeScriptFile(altPath);
        } else {
          console.error(chalk.red(`Error: File not found: ${filePath}`));
          process.exit(1);
        }
      } else {
        await executeTypeScriptFile(filePath);
      }
    }

  } catch (error: any) {
    console.error(chalk.red('Error executing query:'), error.message);
    process.exit(1);
  }
}

async function executeTypeScriptFile(filePath: string) {
  console.log(chalk.blue(`Executing TypeScript file: ${filePath}`));
  
  try {
    // Use ts-node to execute the TypeScript file
    const configDir = getConfigDir();
    const fileDir = path.dirname(filePath);
    const projectRoot = process.cwd();
    const packageDistPath = path.join(projectRoot, 'dist');
    
    // Set up NODE_PATH to include the dist folder and project root so imports work
    // Also add node_modules so 'db-ai' package can be resolved
    const nodePath = [
      packageDistPath,
      projectRoot,
      path.join(projectRoot, 'node_modules'),
      process.env.NODE_PATH || '',
    ].filter(Boolean).join(path.delimiter);
    
    // Also set up module resolution by creating a symlink or using the dist folder
    // For local development, we'll make db-ai resolve to the dist folder
    const dbAiModulePath = path.join(projectRoot, 'node_modules', 'db-ai');
    if (!fs.existsSync(dbAiModulePath)) {
      // Create a symlink to dist for local development
      try {
        fs.symlinkSync(path.join(projectRoot, 'dist'), dbAiModulePath, 'dir');
      } catch (error: any) {
        // Symlink might already exist or fail, that's okay
      }
    }
    
    // Execute with ts-node, using tsconfig that allows the imports
    // Run from project root so config paths resolve correctly
    execSync(`npx --yes ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' "${filePath}"`, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_PATH: nodePath,
      },
    });
    
    console.log(chalk.green('✓ File executed successfully'));
  } catch (error: any) {
    console.error(chalk.red('Error executing TypeScript file:'), error.message);
    throw error;
  }
}

