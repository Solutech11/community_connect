import fs from 'node:fs';
const document = JSON.parse(fs.readFileSync('.tmp-openapi.json', 'utf8').replace(/^\uFEFF/, ''));
console.log(Object.keys(document.components?.schemas ?? {}).join('\n'));
