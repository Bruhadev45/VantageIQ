import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load from project root using ES module compatible approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
config({ path: resolve(projectRoot, ".env") });
config({ path: resolve(projectRoot, ".env.local"), override: true });
