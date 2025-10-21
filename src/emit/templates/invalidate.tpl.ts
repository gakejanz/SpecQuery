// src/emit/templates/invalidate.tpl.ts
import { camelCase } from "change-case";
import type { SpecModel } from "../../model.js";

export const renderInvalidate = (byTag: Map<string, SpecModel["ops"]>) => `
// GENERATED FILE
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys.js';

export const invalidate = (qc: QueryClient) => ({
${[...byTag.entries()].map(([tag, ops]) => {
  const t = camelCase(tag);
  const entries = ops
    .filter(op => op.method === "get" || op.method === "head")
    .map(op => {
      const name = camelCase(op.operationId);
      return `    ${name}: (params?: any) => qc.invalidateQueries({ queryKey: queryKeys.${t}.${name}(params) })`;
    })
    .join(",\n");
  return `  ${t}: {\n${entries}\n  }`;
}).join(",\n")}
});
`;
