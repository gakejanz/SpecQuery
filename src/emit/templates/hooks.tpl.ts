// src/emit/templates/hooks.tpl.ts
import { camelCase } from "change-case";
import type { Op } from "../../model.js";

const isQuery = (m: Op["method"]) => m === "get" || m === "head";

const serializeQueryHelper = `
const serializeQuery = (input?: Record<string, unknown>) => {
  if (!input) return "";

  const searchParams = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.append(key, String(value));
  });

  const qs = searchParams.toString();
  return qs ? \`?\${qs}\` : "";
};
`;

const buildHooksHeader = (importBase: string) => `// GENERATED FILE
import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient } from '${importBase}client.js';
import { queryKeys } from '${importBase}queryKeys.js';
import type { ApiError } from '${importBase}client.js';

const client = createClient();
${serializeQueryHelper}
`;

const getTypeScriptType = (param: any): string => {
  const schema = param?.schema;
  if (!schema) return "string";

  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return "any[]";
  if (schema.type === "object") return "Record<string, any>";

  return "string";
};

const generateRequestBodyType = (op: Op): string => {
  if (!op.requestBody?.schema) return "any";
  return "any";
};

const generateResponseType = (op: Op): string => {
  const successResponse = Object.entries(op.responses).find(
    ([code]) => code.startsWith("2") && op.responses[code].schema,
  );

  if (!successResponse) return "any";

  const schema = successResponse[1].schema;
  if (schema?.type === "array" && schema.items) return "any[]";
  if (schema?.type === "object") return "Record<string, any>";

  return "any";
};

const generateParamsType = (op: Op, includeBody: boolean, bodyType: string): string => {
  const pathParams = op.pathParams || [];
  const queryParams = op.queryParams || [];
  const headerParams = op.headerParams || [];

  const pathType =
    pathParams.length > 0
      ? `{ ${pathParams.map((p) => `${p.name}: ${getTypeScriptType(p)}`).join("; ")} }`
      : "Record<string, never>";

  const queryType =
    queryParams.length > 0
      ? `{ ${queryParams
          .map((p) => `${p.name}${p.required ? "" : "?"}: ${getTypeScriptType(p)}`)
          .join("; ")} }`
      : "Record<string, never>";

  const headerType =
    headerParams.length > 0
      ? `{ ${headerParams
          .map((p) => `${p.name}${p.required ? "" : "?"}: ${getTypeScriptType(p)}`)
          .join("; ")} }`
      : "Record<string, string>";

  const lines = [
    `  path?: ${pathType};`,
    `  query?: ${queryType};`,
    `  headers?: ${headerType};`,
  ];

  if (includeBody) {
    lines.push(`  body?: ${bodyType};`);
  }

  return `{
${lines.join("\n")}
}`;
};

const buildParamAccessor = (base: string, property: string): string => {
  const optionalBase = base.endsWith("?");
  const cleanBase = optionalBase ? base.slice(0, -1) : base;

  if (cleanBase.includes("?.") || optionalBase) {
    return `${cleanBase}?.${property}`;
  }

  return `${cleanBase}.${property}`;
};

const buildPathWithParams = (path: string, pathParams: any[], accessorBase: string): string => {
  if (pathParams.length === 0) return `'${path}'`;

  const pathWithParams = path.replace(/{(\w+)}/g, (_match, paramName) => {
    const param = pathParams.find((p) => p.name === paramName);
    const accessor = buildParamAccessor(accessorBase, paramName);

    if (param?.required) {
      return `\${${accessor}}`;
    }

    return `\${${accessor} ?? ''}`;
  });

  return `\`${pathWithParams}\``;
};

const renderQueryHook = (tag: string, op: Op) => {
  const fn = camelCase(op.operationId);
  const key = `queryKeys.${camelCase(tag)}.${fn}`;
  const pathParams = op.pathParams || [];
  const paramTypes = generateParamsType(op, false, "never");
  const responseType = generateResponseType(op);

  return `
export const use${fn[0].toUpperCase() + fn.slice(1)} = <TData = ${responseType}>(
  params?: ${paramTypes},
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    retry?: boolean | number;
    retryDelay?: number | ((retryCount: number) => number);
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
  }
) =>
  useQuery<TData, ApiError>({
    queryKey: ${key}(params?.query),
    queryFn: async () => {
      const requestPath = ${buildPathWithParams(op.path, pathParams, "params?.path")};
      const search = serializeQuery(params?.query);
      return client.request<TData>('${op.method.toUpperCase()}', requestPath + search, {
        headers: params?.headers ?? undefined,
      });
    },
    ...options,
  });
`;
};

const renderMutationHook = (tag: string, op: Op) => {
  const fn = camelCase(op.operationId);
  const key = `queryKeys.${camelCase(tag)}.${fn}`;
  const pathParams = op.pathParams || [];
  const responseType = generateResponseType(op);
  const requestBodyType = generateRequestBodyType(op);
  const hasBody = Boolean(op.requestBody);
  const variablesType = generateParamsType(op, hasBody, requestBodyType);
  const destructured = hasBody ? "{ path, query, headers, body }" : "{ path, query, headers }";
  const bodyLine = hasBody
    ? "        body: body === undefined ? undefined : JSON.stringify(body),\n"
    : "";

  return `
export const use${fn[0].toUpperCase() + fn.slice(1)} = <TData = ${responseType}>(
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    retry?: boolean | number;
    retryDelay?: number | ((retryCount: number) => number);
  }
) =>
  useMutation<TData, ApiError, ${variablesType}>({
    mutationFn: async (${destructured}) => {
      const requestPath = ${buildPathWithParams(op.path, pathParams, "path?")};
      const search = serializeQuery(query);
      return client.request<TData>('${op.method.toUpperCase()}', requestPath + search, {
${bodyLine}        headers: headers ? { ...headers } : undefined,
      });
    },
    ...options,
  });
`;
};

const renderTagHooks = (tag: string, ops: Op[]) =>
  ops
    .map((op) => (isQuery(op.method) ? renderQueryHook(tag, op) : renderMutationHook(tag, op)))
    .join("\n");

const renderHooksTemplate = (entries: Array<{ tag: string; ops: Op[] }>, importBase: string) => {
  const hooksContent = entries
    .map(({ tag, ops }) => renderTagHooks(tag, ops))
    .filter(Boolean)
    .join("\n");

  return `${buildHooksHeader(importBase)}${hooksContent}`;
};

export const renderHooksByTag = (tag: string, ops: Op[]) =>
  renderHooksTemplate([{ tag, ops }], "../");

export const renderHooksCombined = (byTag: Map<string, Op[]>) =>
  renderHooksTemplate(
    Array.from(byTag.entries()).map(([tag, ops]) => ({ tag, ops })),
    "./",
  );
