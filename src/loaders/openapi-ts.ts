// src/loaders/openapi-ts.ts
import { readFileSync } from "fs";
import { join } from "path";
import type { OpenApiTsIntegration } from "../model.js";

export interface OpenApiTsConfig {
  typesPath: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export function loadOpenApiTsConfig(configPath?: string): OpenApiTsConfig | null {
  if (!configPath) return null;
  
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const result: OpenApiTsConfig = {
      typesPath: config.typesPath || "./src/api/types.ts",
    };

    if (typeof config.baseUrl === "string") {
      result.baseUrl = config.baseUrl;
    }

    if (config.headers && typeof config.headers === "object") {
      result.headers = config.headers;
    }

    return result;
  } catch {
    return null;
  }
}

export function generateOpenApiTsIntegration(
  specPath: string, 
  outputDir: string,
  config?: OpenApiTsConfig
): OpenApiTsIntegration {
  const integration: OpenApiTsIntegration = {
    typesPath: config?.typesPath || join(outputDir, "types.ts"),
  };

  if (config?.baseUrl) {
    integration.baseUrl = config.baseUrl;
  }

  if (config?.headers) {
    integration.headers = config.headers;
  }

  return integration;
}

export function createOpenApiTsConfigFile(
  outputPath: string,
  config: OpenApiTsIntegration
): void {
  const configContent = `// OpenAPI-TS Integration Configuration
export const openApiTsConfig = {
  typesPath: "${config.typesPath}",
  baseUrl: "${config.baseUrl || ""}",
  headers: ${JSON.stringify(config.headers || {}, null, 2)}
} as const;

export type OpenApiTsConfig = typeof openApiTsConfig;
`;
  
  require("fs").writeFileSync(outputPath, configContent);
}
