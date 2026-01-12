import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { getConfigDir } from '../core/config';

const TEMPLATES_DIR = path.join(__dirname, '../templates');

export async function initCommand() {
  const configDir = getConfigDir();
  
  try {
    // Create .db-ai directory
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(chalk.green(`✓ Created directory: ${configDir}`));
    } else {
      console.log(chalk.yellow(`⚠ Directory already exists: ${configDir}`));
    }

    // Create prisma.config.ts
    const configPath = path.join(configDir, 'prisma.config.ts');
    if (!fs.existsSync(configPath)) {
      const configContent = `// Prisma 7 configuration file for db-ai
// Update this file with your database credentials

import { defineConfig } from 'prisma/config';

// Prisma configuration (for Prisma 7)
export default defineConfig({
  datasource: {
    url: "postgresql://your_username:your_password@localhost:5432/your_database?schema=public",
  },
});

// db-ai specific configuration
export const dbAiConfig = {
  OPERATIONS_ALLOWED: ["SELECT"],  // Allowed SQL operations: SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER
  outputFileName: "output.txt",  // Optional: file to log query results
};
`;
      
      fs.writeFileSync(configPath, configContent, 'utf-8');
      
      console.log(chalk.green(`✓ Created configuration file: ${configPath}`));
      console.log(chalk.yellow(`⚠ Please update ${configPath} with your database credentials`));
    } else {
      console.log(chalk.yellow(`⚠ Configuration file already exists: ${configPath}`));
    }

    // Copy instructions.md
    const instructionsSource = path.join(TEMPLATES_DIR, 'instructions.md');
    const instructionsDest = path.join(configDir, 'instructions.md');
    if (fs.existsSync(instructionsSource)) {
      fs.copyFileSync(instructionsSource, instructionsDest);
      console.log(chalk.green(`✓ Created instructions.md`));
    }

    // Copy Script1.ts
    const scriptSource = path.join(TEMPLATES_DIR, 'Script1.ts');
    const scriptDest = path.join(configDir, 'Script1.ts');
    if (fs.existsSync(scriptSource)) {
      fs.copyFileSync(scriptSource, scriptDest);
      console.log(chalk.green(`✓ Created Script1.ts`));
    }

    console.log(chalk.green('\n✓ Initialization complete!'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.cyan('1. Update .db-ai/prisma.config.ts with your database credentials'));
    console.log(chalk.cyan('2. Run "db-ai start" to pull your database schema'));

  } catch (error: any) {
    console.error(chalk.red('Error during initialization:'), error.message);
    process.exit(1);
  }
}

