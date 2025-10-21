// src/emit/templates/queryKeys.tpl.ts
import { camelCase } from "change-case";
import type { SpecModel } from "../../model.js";

export const renderQueryKeys = (byTag: Map<string, SpecModel["ops"]>) => `
// GENERATED FILE
export const queryKeys = {
${[...byTag.entries()].map(([tag, ops]) => {
  const root = camelCase(tag);
  const lines = ops.map(op => {
    const name = op.operationId;
    const keyName = camelCase(name);
    // minimal: encode params object into key
    return `    ${keyName}: (params?: any) => ['${root}','${keyName}', params ?? {}] as const`;
  }).join(",\n");
  return `  ${root}: {\n    root: ['${root}'] as const,\n${lines}\n  }`;
}).join(",\n")}
} as const;
`;
