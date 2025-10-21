// src/loaders/openapi.ts
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import { camelCase } from "change-case";
import type { Op, Param, SpecModel } from "../model.js";

export async function loadSpec(pathOrUrl: string): Promise<SpecModel> {
  // Support both JSON and YAML OpenAPI specs
  const api = (await SwaggerParser.bundle(pathOrUrl)) as OpenAPI.Document;

  const ops: Op[] = [];
  const paths = api.paths ?? {};
  
  for (const [p, item] of Object.entries(paths)) {
    if (!item) continue;
    
    for (const method of ["get","post","put","patch","delete","head"] as const) {
      const opObj = (item as any)[method];
      if (!opObj) continue;

      const tag = (opObj.tags?.[0] ?? "default").toString();
      const operationId = (opObj.operationId ?? camelCase(`${method}_${p}`)).replace(/[{}]/g, "");
      
      // Enhanced parameter handling
      const allParams: Param[] = [...(item.parameters ?? []), ...(opObj.parameters ?? [])] as any;
      const params = allParams.map(param => ({
        name: param.name,
        in: param.in,
        required: param.required ?? false,
        schema: param.schema,
        type: param.schema?.type,
        format: param.schema?.format,
      }));

      // Categorize parameters
      const pathParams = params.filter(p => p.in === "path");
      const queryParams = params.filter(p => p.in === "query");
      const headerParams = params.filter(p => p.in === "header");
      const cookieParams = params.filter(p => p.in === "cookie");

      // Enhanced response handling
      const responses: Op["responses"] = {};
      for (const [code, res] of Object.entries(opObj.responses ?? {})) {
        const content = (res as any).content;
        const description = typeof (res as any).description === "string" ? (res as any).description : undefined;
        if (content) {
          const [ct, media] = Object.entries<any>(content)[0] ?? [];
          const entry: Op["responses"][string] = {};
          if (typeof ct === "string" && ct.length > 0) {
            entry.contentType = ct;
          }
          if (media?.schema) {
            entry.schema = media.schema;
          }
          if (description) {
            entry.description = description;
          }
          responses[code] = entry;
        } else {
          responses[code] = description ? { description } : {};
        }
      }

      // Enhanced request body handling
      let requestBody: Op["requestBody"];
      if (opObj.requestBody?.content) {
        const [ct, media] = Object.entries<any>(opObj.requestBody.content)[0] ?? [];
        if (typeof ct === "string" && ct.length > 0) {
          requestBody = {
            contentType: ct,
            schema: media?.schema,
            required: opObj.requestBody.required ?? false,
          };
        }
      }

      const opEntry: Op = {
        tag,
        operationId,
        method,
        path: p,
        summary: opObj.summary,
        description: opObj.description,
        params,
        responses,
        pathParams,
        queryParams,
        headerParams,
        cookieParams,
      };

      if (requestBody) {
        opEntry.requestBody = requestBody;
      }

      ops.push(opEntry);
    }
  }

  const info = (api.info ?? {}) as any;
  const serverUrl = Array.isArray((api as any).servers) ? (api as any).servers[0]?.url : undefined;
  const result: SpecModel = {
    ops,
    title: info.title,
    version: info.version,
  };

  if (typeof serverUrl === "string") {
    result.openapiTsConfig = { baseUrl: serverUrl };
  }

  return result;
}
