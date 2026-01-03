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

    // Create dbConfig.json
    const configPath = path.join(configDir, 'dbConfig.json');
    if (!fs.existsSync(configPath)) {
      const configTemplate = {
        provider: "postgresql",
        host: "localhost",
        port: 5432,
        user: "your_username",
        password: "your_password",
        database: "your_database",
        schema: "public",
        OPERATIONS_ALLOWED: ["SELECT"],
        outputFileName: "output.txt"
      };

      const configContent = JSON.stringify(configTemplate, null, 2);
      
      // Since JSON doesn't support comments, we'll write a note file instead
      fs.writeFileSync(configPath, configContent, 'utf-8');
      
      // Create a note file about provider
      const notePath = path.join(configDir, 'CONFIG_NOTES.md');
      const noteContent = `# Configuration Notes

## Database Provider

The \`provider\` field in dbConfig.json specifies your database type:
- \`postgresql\` - PostgreSQL
- \`mysql\` - MySQL
- \`sqlite\` - SQLite
- \`sqlserver\` - SQL Server

**Important**: Make sure to install the required database driver package for your database provider:
- PostgreSQL: \`npm install pg\`
- MySQL: \`npm install mysql2\`
- SQLite: \`npm install better-sqlite3\`
- SQL Server: \`npm install @prisma/adapter-sqlserver\`

Note: \`@prisma/client\` is already included and works with all database providers.

## Schema

The \`schema\` field (optional) specifies the database schema to use. This is particularly useful for PostgreSQL and SQL Server:
- **PostgreSQL**: Default is \`public\`. You can specify other schemas like \`myschema\`.
- **SQL Server**: Specify the schema name (e.g., \`dbo\`, \`sales\`).
- **MySQL/SQLite**: Schema is typically not used, but can be left empty or omitted.

If not specified, the default schema for your database provider will be used.

## OPERATIONS_ALLOWED

This array specifies which SQL operations are allowed:
- \`SELECT\` - Read queries
- \`INSERT\` - Insert operations
- \`UPDATE\` - Update operations
- \`DELETE\` - Delete operations
- \`CREATE\` - Create table/index operations
- \`DROP\` - Drop operations
- \`ALTER\` - Alter table operations

Default is \`["SELECT"]\` for safety.

## outputFileName

If specified, all query results will be appended to this file with timestamps.
Leave empty or remove this field to disable file logging.
`;
      fs.writeFileSync(notePath, noteContent, 'utf-8');
      
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
    console.log(chalk.cyan('1. Update .db-ai/dbConfig.json with your database credentials'));
    console.log(chalk.cyan('2. Run "db-ai start" to pull your database schema'));

  } catch (error: any) {
    console.error(chalk.red('Error during initialization:'), error.message);
    process.exit(1);
  }
}

