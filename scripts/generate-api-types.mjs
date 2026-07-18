import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync('.tmp-openapi.json', 'utf8').replace(/^\uFEFF/, ''));

const quote = (value) => JSON.stringify(value);

function schemaType(schema, depth = 0) {
  if (!schema) return 'never';
  if (schema.enum) return schema.enum.map(quote).join(' | ');
  if (schema.oneOf) return schema.oneOf.map((item) => schemaType(item, depth)).join(' | ');
  if (schema.anyOf) return schema.anyOf.map((item) => schemaType(item, depth)).join(' | ');
  if (schema.allOf) return schema.allOf.map((item) => schemaType(item, depth)).join(' & ');
  if (schema.nullable) return `${schemaType({ ...schema, nullable: false }, depth)} | null`;
  if (schema.type === 'string') return 'string';
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return `Array<${schemaType(schema.items, depth + 1)}>`;
  if (schema.type === 'object' || schema.properties) {
    const required = new Set(schema.required ?? []);
    const pad = '  '.repeat(depth + 1);
    const closePad = '  '.repeat(depth);
    const fields = Object.entries(schema.properties ?? {}).map(([name, value]) =>
      `${pad}${quote(name)}${required.has(name) ? '' : '?'}: ${schemaType(value, depth + 1)};`,
    );
    if (schema.additionalProperties && schema.additionalProperties !== false) {
      fields.push(`${pad}[key: string]: ${schema.additionalProperties === true ? 'unknown' : schemaType(schema.additionalProperties, depth + 1)};`);
    }
    return `{\n${fields.join('\n')}\n${closePad}}`;
  }
  return 'unknown';
}

function exampleType(value, depth = 0) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return value.length ? `Array<${exampleType(value[0], depth + 1)}>` : 'Array<unknown>';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    const pad = '  '.repeat(depth + 1);
    const closePad = '  '.repeat(depth);
    const fields = Object.entries(value).map(([name, item]) => `${pad}${quote(name)}: ${exampleType(item, depth + 1)};`);
    return `{\n${fields.join('\n')}\n${closePad}}`;
  }
  return 'unknown';
}

function typeName(operationId) {
  return operationId
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const operations = [];
for (const [path, pathItem] of Object.entries(input.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    if (!operation.operationId) continue;
    const parameters = operation.parameters ?? [];
    const queryProperties = {};
    const queryRequired = [];
    const pathProperties = {};
    const pathRequired = [];
    const headerProperties = {};
    const headerRequired = [];
    for (const parameter of parameters) {
      const target = parameter.in === 'query' ? queryProperties : parameter.in === 'path' ? pathProperties : parameter.in === 'header' ? headerProperties : undefined;
      const requiredTarget = parameter.in === 'query' ? queryRequired : parameter.in === 'path' ? pathRequired : parameter.in === 'header' ? headerRequired : undefined;
      if (!target || !requiredTarget) continue;
      target[parameter.name] = parameter.schema ?? { type: 'string' };
      if (parameter.required) requiredTarget.push(parameter.name);
    }
    const content = operation.requestBody?.content ?? {};
    const requestMedia = content['application/json'] ?? content['multipart/form-data'];
    const success = Object.entries(operation.responses ?? {}).find(([status]) => /^2/.test(status))?.[1];
    const successJson = success?.content?.['application/json'];
    operations.push({
      id: operation.operationId,
      name: typeName(operation.operationId),
      method: method.toUpperCase(),
      path,
      authenticated: Boolean(operation.security?.length),
      body: requestMedia?.schema,
      response: successJson?.example,
      query: { type: 'object', properties: queryProperties, required: queryRequired, additionalProperties: false },
      pathParams: { type: 'object', properties: pathProperties, required: pathRequired, additionalProperties: false },
      headers: { type: 'object', properties: headerProperties, required: headerRequired, additionalProperties: false },
    });
  }
}

const lines = [
  '// Generated from the running Community Connect OpenAPI document. Do not edit manually.',
  '',
];

for (const operation of operations) {
  lines.push(`export type ${operation.name}Body = ${operation.body ? schemaType(operation.body) : 'never'};`);
  lines.push(`export type ${operation.name}Query = ${schemaType(operation.query)};`);
  lines.push(`export type ${operation.name}Path = ${schemaType(operation.pathParams)};`);
  lines.push(`export type ${operation.name}Headers = ${schemaType(operation.headers)};`);
  lines.push(`export type ${operation.name}Response = ${operation.response ? exampleType(operation.response) : '{ success: true; message: string; data?: never }'};`);
  lines.push('');
}

lines.push('export interface ApiOperationMap {');
for (const operation of operations) {
  lines.push(`  ${quote(operation.id)}: {`);
  lines.push(`    method: ${quote(operation.method)};`);
  lines.push(`    path: ${quote(operation.path)};`);
  lines.push(`    authenticated: ${operation.authenticated};`);
  lines.push(`    body: ${operation.name}Body;`);
  lines.push(`    query: ${operation.name}Query;`);
  lines.push(`    pathParams: ${operation.name}Path;`);
  lines.push(`    headers: ${operation.name}Headers;`);
  lines.push(`    response: ${operation.name}Response;`);
  lines.push('  };');
}
lines.push('}');
lines.push('');
lines.push('export type ApiOperationId = keyof ApiOperationMap;');

fs.mkdirSync('Screens/types', { recursive: true });
fs.writeFileSync('Screens/types/api.generated.ts', `${lines.join('\n')}\n`);
console.log(`Generated ${operations.length} operation contracts.`);
