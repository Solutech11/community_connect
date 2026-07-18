import fs from 'node:fs';

const document = JSON.parse(fs.readFileSync('.tmp-openapi.json', 'utf8').replace(/^\uFEFF/, ''));
const requestedTag = process.argv[2];

for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    if (requestedTag && !(operation.tags ?? []).includes(requestedTag)) continue;
    console.log(`\n### ${method.toUpperCase()} ${path}`);
    console.log(JSON.stringify(operation, null, 2));
  }
}
