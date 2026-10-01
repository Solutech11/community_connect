import fs from "node:fs";

type Schema = { type?: string | string[]; enum?: unknown[]; const?: unknown; nullable?: boolean;
  oneOf?: Schema[]; anyOf?: Schema[]; allOf?: Schema[]; properties?: Record<string, Schema>;
  required?: string[]; items?: Schema; additionalProperties?: boolean | Schema };
type Parameter = { name: string; in: string; required?: boolean; schema?: Schema };
type Operation = { operationId: string; parameters?: Parameter[]; security?: unknown[];
  requestBody?: { content?: Record<string, { schema?: Schema }> };
  responses: Record<string, { content?: Record<string, { schema?: Schema }> }> };

const schemaType = (schema: Schema | undefined): string => {
  if (!schema) return "never";
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (schema.nullable) return `(${schemaType({ ...schema, nullable: false })}) | null`;
  if (schema.oneOf || schema.anyOf) return (schema.oneOf || schema.anyOf)!.map(schemaType).join(" | ");
  if (schema.allOf) return schema.allOf.map(schemaType).join(" & ");
  if (Array.isArray(schema.type)) return schema.type.map((type) => schemaType({ ...schema, type })).join(" | ");
  if (schema.type === "null") return "null";
  if (schema.type === "string") return "string";
  if (schema.type === "number" || schema.type === "integer") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return `Array<${schemaType(schema.items)}>`;
  if (schema.type === "object" || schema.properties) {
    const required = new Set(schema.required || []);
    return "{\n" + Object.entries(schema.properties || {}).map(([key, value]) =>
      `  ${JSON.stringify(key)}${required.has(key) ? "" : "?"}: ${schemaType(value)};`).join("\n") + "\n}";
  }
  return "unknown";
};
const nameFor = (id: string) => id.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/)
  .map((word) => word[0]!.toUpperCase() + word.slice(1)).join("");
const input = JSON.parse(fs.readFileSync(".tmp-openapi.json", "utf8").replace(/^\uFEFF/, "")) as {
  paths: Record<string, Record<string, Operation>>;
};
const output = "Screens/types/api.generated.ts";
let source = fs.readFileSync(output, "utf8").replace(/\r\n/g, "\n");
const split = source.indexOf("export interface ApiOperationMap {");
if (split < 0) throw new Error("Existing API operation map was not found");
let declarations = source.slice(0, split);
let map = source.slice(split);
let count = 0;
for (const [path, methods] of Object.entries(input.paths)) {
  if (!path.startsWith("/roommates/") && !path.startsWith("/users/me/blocks")) continue;
  for (const [method, operation] of Object.entries(methods)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    const id = operation.operationId;
    const name = nameFor(id);
    const parts: Record<string, Schema | undefined> = {
      Body: operation.requestBody?.content?.["application/json"]?.schema,
      Query: { type: "object", properties: {}, required: [] },
      Path: { type: "object", properties: {}, required: [] },
      Headers: { type: "object", properties: {}, required: [] },
      Response: Object.entries(operation.responses).find(([status]) => /^2\d\d$/.test(status))?.[1].content?.["application/json"]?.schema,
    };
    for (const parameter of operation.parameters || []) {
      const section = parameter.in === "query" ? parts.Query : parameter.in === "path" ? parts.Path : parameter.in === "header" ? parts.Headers : undefined;
      if (!section) continue;
      section.properties![parameter.name] = parameter.schema || { type: "string" };
      if (parameter.required) section.required!.push(parameter.name);
    }
    for (const [suffix, schema] of Object.entries(parts)) {
      const pattern = new RegExp(`export type ${name}${suffix} = [\\s\\S]*?(?=\\nexport |$)`);
      declarations = declarations.replace(pattern, "");
      declarations += `export type ${name}${suffix} = ${schemaType(schema)};\n\n`;
    }
    map = map.replace(new RegExp(`  "${id}": \\{[\\s\\S]*?\\n  \\};\\n`), "");
    const entry = `  "${id}": {
    method: "${method.toUpperCase()}";
    path: "${path}";
    authenticated: true;
    body: ${name}Body;
    query: ${name}Query;
    pathParams: ${name}Path;
    headers: ${name}Headers;
    response: ${name}Response;
  };\n`;
    map = map.replace("export interface ApiOperationMap {\n", "export interface ApiOperationMap {\n" + entry);
    count += 1;
  }
}
fs.writeFileSync(output, declarations + map);
process.stdout.write(`Generated ${count} roommate/block contracts from schemas; retained other API contracts.\n`);
