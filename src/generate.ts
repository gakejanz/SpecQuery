// src/generate.ts
import kleur from "kleur";
import { loadSpec } from "./loaders/openapi.js";
import {
  loadOpenApiTsConfig,
  generateOpenApiTsIntegration,
} from "./loaders/openapi-ts.js";
import { writeFiles } from "./emit/writeFiles.js";
import { renderClient } from "./emit/templates/client.tpl.js";
import { renderQueryKeys } from "./emit/templates/queryKeys.tpl.js";
import {
  renderHooksByTag,
  renderHooksCombined,
} from "./emit/templates/hooks.tpl.js";
import { renderInvalidate } from "./emit/templates/invalidate.tpl.js";
import type { SpecModel } from "./model.js";

const { bold, cyan, green, magenta, yellow } = kleur;

export interface GenerateOptions {
  schema: string;
  outDir: string;
  baseUrl: string;
  groupByTag: boolean;
  openApiTsConfig?: string | undefined;
  generateTypes?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

export async function generate(opts: GenerateOptions) {
  const spec: SpecModel = await loadSpec(opts.schema);

  // Load openapi-ts configuration if provided
  const openApiTsConfig = opts.openApiTsConfig 
    ? loadOpenApiTsConfig(opts.openApiTsConfig)
    : null;

  const openApiTsIntegration = openApiTsConfig
    ? generateOpenApiTsIntegration(opts.schema, opts.outDir, openApiTsConfig)
    : undefined;

  // group ops by tag
  const byTag = new Map<string, SpecModel["ops"]>();
  for (const op of spec.ops) {
    const list = byTag.get(op.tag) ?? [];
    list.push(op);
    byTag.set(op.tag, list);
  }

  if (opts.verbose) {
    console.log(
      cyan(
        `${bold("Parsed operations")} (${spec.ops.length}):\n` +
          spec.ops
            .map(
              (op) =>
                `  • [${op.method.toUpperCase()}] ${op.path}  (${op.operationId})`,
            )
            .join("\n"),
      ),
    );
  }

  // plan core files
  const plannedFiles: { path: string; contents: string }[] = [
    {
      path: `${opts.outDir}/client.ts`,
      contents: renderClient(opts.baseUrl, openApiTsIntegration),
    },
    { path: `${opts.outDir}/queryKeys.ts`, contents: renderQueryKeys(byTag) },
    { path: `${opts.outDir}/invalidate.ts`, contents: renderInvalidate(byTag) },
  ];

  // Generate types if requested
  if (opts.generateTypes) {
    plannedFiles.push({
      path: `${opts.outDir}/types.ts`,
      contents: generateTypesFile(spec),
    });
  }

  // plan hooks per tag
  if (opts.groupByTag) {
    const hooks = Array.from(byTag.entries()).map(([tag, ops]) => ({
      path: `${opts.outDir}/hooks/${tag}.generated.ts`,
      contents: renderHooksByTag(tag, ops),
    }));
    plannedFiles.push(...hooks);
  } else {
    plannedFiles.push({
      path: `${opts.outDir}/hooks.generated.ts`,
      contents: renderHooksCombined(byTag),
    });
  }

  // plan openapi-ts integration files if configured
  if (openApiTsIntegration) {
    plannedFiles.push({
      path: `${opts.outDir}/openapi-ts.config.ts`,
      contents: generateOpenApiTsConfigFile(openApiTsIntegration),
    });
  }

  if (opts.dryRun) {
    console.log(
      yellow(
        `${bold("Dry run")}: ${plannedFiles.length} files would be written:\n` +
          plannedFiles.map((file) => `  • ${file.path}`).join("\n"),
      ),
    );
  } else {
    await writeFiles(plannedFiles);
  }

  const resultEmoji = opts.dryRun ? "📝" : "✨";
  const message = `${resultEmoji} ${
    opts.dryRun ? "Planned" : "Generated"
  } ${spec.ops.length} operations → ${opts.outDir}`;
  console.log(green(message));

  if (openApiTsIntegration) {
    console.log(
      magenta(
        `🔗 openapi-typescript integration ${
          opts.dryRun ? "would be configured" : "configured"
        }`,
      ),
    );
  }
}

function generateTypesFile(spec: SpecModel): string {
  return `// GENERATED TYPES
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  body?: any;
}

// Operation types
${spec.ops.map(op => {
  const operationName = op.operationId;
  const pathParams = op.pathParams || [];
  const queryParams = op.queryParams || [];
  
  return `
export interface ${operationName}Params {
  ${pathParams.map(p => `${p.name}: ${getTypeScriptType(p)}`).join('\n  ')}
  ${queryParams.map(p => `${p.name}${p.required ? '' : '?'}: ${getTypeScriptType(p)}`).join('\n  ')}
}`;
}).join('\n')}
`;
}

function getTypeScriptType(param: any): string {
  const schema = param.schema;
  if (!schema) return 'string';
  
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return 'any[]';
  if (schema.type === 'object') return 'Record<string, any>';
  
  return 'string';
}

function generateOpenApiTsConfigFile(integration: any): string {
  return `// OpenAPI-TS Configuration
export const openApiTsConfig = {
  typesPath: "${integration.typesPath}",
  baseUrl: "${integration.baseUrl || ""}",
  headers: ${JSON.stringify(integration.headers || {}, null, 2)}
} as const;

export type OpenApiTsConfig = typeof openApiTsConfig;
`;
}
