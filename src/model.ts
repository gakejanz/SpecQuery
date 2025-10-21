// src/model.ts

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head";

export type Param = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema?: any;
  type?: string;
  format?: string;
};

export type Op = {
  tag: string;
  operationId: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  params: Param[];
  requestBody?: {
    contentType: string;
    schema?: any;
    required?: boolean;
  };
  responses: Record<
    string,
    {
      contentType?: string;
      schema?: any;
      description?: string;
    }
  >;
  // Enhanced type information
  pathParams?: Param[];
  queryParams?: Param[];
  headerParams?: Param[];
  cookieParams?: Param[];
  // OpenAPI-ts integration
  openapiTsPath?: string;
  openapiTsTypes?: string;
};

export type SpecModel = {
  ops: Op[];
  title?: string;
  version?: string;
  // OpenAPI-ts integration
  openapiTsConfig?: {
    clientPath?: string;
    typesPath?: string;
    baseUrl?: string;
  };
};

export type OpenApiTsIntegration = {
  typesPath: string;
  baseUrl?: string;
  headers?: Record<string, string>;
};
