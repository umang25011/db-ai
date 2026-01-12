# db-ai

A package to allow AI to access databases with ease using Prisma.

## Installation

```bash
npm install db-ai
```

Make sure to install the required database driver for your database provider:

- **PostgreSQL**: `npm install pg`
- **MySQL**: `npm install mysql2`
- **SQLite**: `npm install better-sqlite3`
- **SQL Server**: `npm install @prisma/adapter-sqlserver`

Note: `@prisma/client` is already included as a dependency and works with all database providers.

## Quick Start

### 1. Initialize

Run the init command to create the configuration folder:

```bash
db-ai init
```

This creates a `.db-ai` folder with:
- `prisma.config.ts` - Database configuration file (Prisma 7 format)
- `instructions.md` - Reference guide for AI
- `Script1.ts` - Template script for running queries

### 2. Configure Database

Edit `.db-ai/prisma.config.ts` with your database credentials:

```typescript
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
```

**Configuration Fields:**

**Prisma Config (default export):**
- `datasource.url`: Database connection URL (required by Prisma 7)

**db-ai Config (dbAiConfig export):**
- `OPERATIONS_ALLOWED`: Array of allowed SQL operations (default: `["SELECT"]`)
- `outputFileName`: Optional file name for logging query results with timestamps

**Note**: Make sure to install the required database driver package for your database provider (e.g., `pg` for PostgreSQL, `mysql2` for MySQL, `better-sqlite3` for SQLite, `@prisma/adapter-sqlserver` for SQL Server).

### 3. Pull Database Schema

Run the start command to introspect your database and generate the schema:

```bash
db-ai start
```

This will:
- Create `schema.prisma` file in `.db-ai/` folder
- Pull the database schema using Prisma introspection
- Generate Prisma Client

### 4. Run Queries

You can run SQL queries in two ways:

#### Direct SQL Query

```bash
db-ai run --sql "SELECT * FROM users LIMIT 10"
```

#### TypeScript File

```bash
db-ai run --file Script1.ts
```

Or with a relative path:

```bash
db-ai run --file .db-ai/Script1.ts
```

## Usage in TypeScript Files

You can create TypeScript files to run SQL queries. Import the query functions:

```typescript
import { executeQuery, executeAndPrint } from 'db-ai/dist/core/queryExecutor';

async function main() {
  // Execute query and get result
  const result = await executeQuery("SELECT * FROM users LIMIT 10");
  console.log(result.data);

  // Execute query and print result
  await executeAndPrint("SELECT COUNT(*) FROM users");
}

main();
```

## Available Functions

### `executeQuery(sql: string)`

Executes a SQL query and returns the result.

- **Parameters**: `sql` - SQL query string
- **Returns**: `QueryResult` object with `data`, `timestamp`, and `query` fields

### `executeAndPrint(sql: string)`

Executes a SQL query, returns the result, and prints it to the console.

- **Parameters**: `sql` - SQL query string
- **Returns**: `QueryResult` object with `data`, `timestamp`, and `query` fields

## Security

The package validates SQL operations against the `OPERATIONS_ALLOWED` array in the configuration. By default, only `SELECT` operations are allowed. To allow other operations, update `OPERATIONS_ALLOWED` in `prisma.config.ts`:

```typescript
OPERATIONS_ALLOWED: ["SELECT", "INSERT", "UPDATE"]
```

## Output Logging

If `outputFileName` is specified in `prisma.config.ts`, all query results are automatically appended to that file with timestamps. The file is created in the `.db-ai/` folder.

## Schema File

The database schema is stored in `.db-ai/schema.prisma`. This file contains the up-to-date database structure and is updated when you run `db-ai start`.

## License

MIT

