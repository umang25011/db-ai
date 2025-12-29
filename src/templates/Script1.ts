/**
 * Script1.ts - Template for running SQL queries
 * 
 * This file can be updated by AI to run SQL queries against the database.
 * Import the query functions and use them to execute queries.
 * 
 * Note: This file imports from the installed db-ai package.
 * Make sure db-ai is installed in your project: npm install db-ai
 */

import { executeAndPrint, executeQuery } from 'db-ai';

async function main() {
  try {
    // Example: Execute a query and get the result
    const result = await executeQuery("SELECT * FROM users LIMIT 10");
    console.log('Query result:', result.data);

    // Example: Execute a query and print the result
    await executeAndPrint("SELECT COUNT(*) as total FROM users");

    // Add your queries here
    // const customResult = await executeQuery("YOUR SQL QUERY HERE");
    // console.log(customResult.data);

  } catch (error) {
    console.error('Error executing query:', error);
    process.exit(1);
  } finally {
    // Close Prisma connection
    const { getPrismaClient } = require('db-ai');
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  }
}

main();

