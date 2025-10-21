import { Command } from "commander";
import { createRequire } from "node:module";
import { generate } from "./generate.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as {
  name?: string;
  version?: string;
  description?: string;
};

const program = new Command();

program
  .name(pkg.name ?? "spec-query")
  .description(pkg.description ?? "Generate TanStack Query hooks from an OpenAPI spec")
  .version(pkg.version ?? "0.0.0");

program
  .requiredOption("-s, --schema <pathOrUrl>", "OpenAPI schema path or URL (JSON or YAML)")
  .option("-o, --out <dir>", "Output directory for generated files", "examples/out")
  .option("--base-url <url>", "Base URL used by the generated client", "/api")
  .option("--openapi-ts-config <path>", "Path to openapi-typescript configuration file")
  .option("--generate-types", "Emit a lightweight helper types file")
  .option("--group-by-tag", "Generate one hooks file per OpenAPI tag", true)
  .option("--no-group-by-tag", "Write all hooks into a single file");

program.parse();

const opts = program.opts<{
  schema: string;
  out: string;
  baseUrl: string;
  groupByTag: boolean;
  openapiTsConfig?: string;
  generateTypes?: boolean;
}>();

generate({
  schema: opts.schema,
  outDir: opts.out,
  baseUrl: opts.baseUrl,
  groupByTag: opts.groupByTag,
  openApiTsConfig: opts.openapiTsConfig || undefined,
  generateTypes: Boolean(opts.generateTypes),
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
