// src/emit/templates/client.tpl.ts
import type { OpenApiTsIntegration } from "../../model.js";

export const renderClient = (baseUrl: string, openApiTsIntegration?: OpenApiTsIntegration) => `
// GENERATED FILE
${openApiTsIntegration ? `import type { paths } from '${openApiTsIntegration.typesPath}';` : ''}

export type ClientConfig = {
  baseUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  retry?: {
    attempts?: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
  };
};

export class ApiError<T = unknown> extends Error {
  status: number;
  body?: T | undefined;
  code?: string | undefined;
  
  constructor(msg: string, status: number, body?: T | undefined, code?: string | undefined) { 
    super(msg); 
    this.status = status; 
    this.body = body;
    this.code = code;
  }
  
  static fromOpenApiTsError(error: any): ApiError {
    return new ApiError(
      error.message || 'API Error',
      error.status || 500,
      error.body,
      error.code
    );
  }
}

export const createClient = (cfg: ClientConfig = {}) => {
  const f = cfg.fetch ?? fetch;
  const base = (cfg.baseUrl ?? "${baseUrl}").replace(/\\/$/, "");
  
  const defaultHeaders = {
    "content-type": "application/json",
    ...(cfg.headers ?? {})
  };

  async function request<T>(
    method: string, 
    path: string, 
    init?: RequestInit & { 
      retry?: boolean;
      timeout?: number;
    }
  ): Promise<T> {
    const { retry = true, timeout = 30000, ...requestInit } = init || {};
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const res = await f(base + path, { 
        method, 
        headers: { ...defaultHeaders, ...requestInit.headers }, 
        signal: controller.signal,
        ...requestInit
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        let errorBody: any;
        try {
          const text = await res.text();
          errorBody = text ? JSON.parse(text) : undefined;
        } catch {
          errorBody = undefined;
        }
        
        throw new ApiError(
          res.statusText || \`HTTP \${res.status}\`,
          res.status,
          errorBody,
          res.status.toString()
        );
      }
      
      const text = await res.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        undefined,
        'NETWORK_ERROR'
      );
    }
  }
  
  return { request };
}

${openApiTsIntegration ? `
// OpenAPI-TS Integration
// Import types from your openapi-typescript generated file
export type { paths, components } from '${openApiTsIntegration.typesPath}';
` : ''}
`;
