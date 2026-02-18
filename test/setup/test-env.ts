/**
 * Per-file test setup.
 * Loads environment variables from .env.test.local (or .env.test).
 */

import { config } from 'dotenv';
import path from 'node:path';

// Load test env vars (prefer .env.test.local over .env.test)
config({ path: path.resolve(process.cwd(), '.env.test.local') });
config({ path: path.resolve(process.cwd(), '.env.test') });
