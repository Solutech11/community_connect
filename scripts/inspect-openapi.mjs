import fs from 'node:fs';

const document = JSON.parse(fs.readFileSync('.tmp-openapi.json', 'utf8').replace(/^\uFEFF/, ''));

for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    console.log(
      method.toUpperCase(),
      path,
      '|',
      operation.operationId ?? '',
      '|',
      (operation.tags ?? []).join(','),
    );
  }
}
