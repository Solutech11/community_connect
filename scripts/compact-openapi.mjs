import fs from 'node:fs';

const document = JSON.parse(fs.readFileSync('.tmp-openapi.json', 'utf8').replace(/^\uFEFF/, ''));

for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    const successResponse = Object.entries(operation.responses ?? {}).find(([status]) => /^2/.test(status))?.[1];
    const successContent = successResponse?.content?.['application/json'];
    const bodyContent = operation.requestBody?.content ?? {};
    const jsonBody = bodyContent['application/json'];
    const multipartBody = bodyContent['multipart/form-data'];
    console.log(JSON.stringify({
      method: method.toUpperCase(),
      path,
      tag: operation.tags?.[0],
      summary: operation.summary,
      security: Boolean(operation.security?.length),
      parameters: operation.parameters ?? [],
      requestSchema: jsonBody?.schema ?? multipartBody?.schema,
      requestExample: jsonBody?.example ?? multipartBody?.example,
      responseExample: successContent?.example,
    }));
  }
}
