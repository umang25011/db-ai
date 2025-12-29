# db-ai Instructions for AI

This document outlines the available functions and resources for interacting with the database.

## Quick Start - Running SQL Queries

The easiest way to run SQL queries is using the CLI command:

```bash
db-ai run --sql "SELECT * FROM users LIMIT 10"
```

This will:
- Execute the SQL query against the database
- Return and display the output
- Automatically log the query and results to the output file (if `outputFileName` is configured in `dbConfig.json`)

**Important**: All SQL queries that run (whether via CLI or programmatically) are automatically logged to the output file specified in `dbConfig.json` (e.g., `output.txt`) with timestamps, if that configuration exists.

## Available Functions

### 1. `executeQuery(sql: string)`
Executes a SQL query and returns the result.
- **Parameters**: `sql` - SQL query string
- **Returns**: `QueryResult` object with `data`, `timestamp`, and `query` fields
- **Example**:
  ```typescript
  const result = await executeQuery("SELECT * FROM users LIMIT 10");
  console.log(result.data);
  ```

### 2. `executeAndPrint(sql: string)`
Executes a SQL query, returns the result, and prints it to the console.
- **Parameters**: `sql` - SQL query string
- **Returns**: `QueryResult` object with `data`, `timestamp`, and `query` fields
- **Example**:
  ```typescript
  await executeAndPrint("SELECT COUNT(*) FROM users");
  ```

## Schema File

The database schema is stored in `.db-ai/schema.prisma`. This file contains the up-to-date database structure including:
- Tables and their columns
- Data types
- Relationships
- Constraints

Refer to this file to understand the database structure before writing queries.

## Configuration

The configuration file `.db-ai/dbConfig.json` contains:
- Database connection details
- `OPERATIONS_ALLOWED`: Array of allowed SQL operations (default: `["SELECT"]`)
- `outputFileName`: Optional file name for logging query results with timestamps

## Usage in Scripts

You can create TypeScript files (like `Script1.ts`) to run SQL queries. Import the functions from the query executor:

```typescript
import { executeQuery, executeAndPrint } from 'db-ai/dist/core/queryExecutor';

// Your queries here
const result = await executeQuery("SELECT * FROM table_name");
```

**Note**: Make sure db-ai is installed in your project: `npm install db-ai`

## Important Notes

- **CLI Usage**: You can use `db-ai run --sql "your SQL query"` to execute SQL directly from the command line
- **Output Logging**: All SQL queries that run (via CLI or programmatically) are automatically logged to the output file specified in `dbConfig.json` (e.g., `output.txt`) with timestamps, if `outputFileName` is configured
- **Security**: Only operations listed in `OPERATIONS_ALLOWED` can be executed
- **Schema Reference**: Always check the schema file (`.db-ai/schema.prisma`) before writing queries to ensure table and column names are correct

