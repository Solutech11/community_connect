import fs from "node:fs";

const document = JSON.parse(fs.readFileSync(".tmp-openapi.json", "utf8"));
const operations = [];
for (const [path, pathItem] of Object.entries(document.paths)) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operation = pathItem[method];
    if (operation?.operationId)
      operations.push({
        method: method.toUpperCase(),
        path,
        id: operation.operationId,
      });
  }
}

const client = fs.readFileSync("Screens/services/api/client.ts", "utf8");
const serviceFiles = fs
  .readdirSync("Screens/services/api")
  .filter((name) => name.endsWith(".api.ts"));
const services = serviceFiles
  .map((name) => fs.readFileSync(`Screens/services/api/${name}`, "utf8"))
  .join("\n");
const mobileOperations = operations.filter(
  ({ path }) => path !== "/webhooks/paystack" && path !== "/health",
);

const containsOperationId = (source, id) =>
  source.includes(`${id}:`) ||
  source.includes(`'${id}'`) || source.includes(`"${id}"`);

const missingClient = mobileOperations.filter(
  ({ id }) => !containsOperationId(client, id),
);
const infrastructureHandled = new Set([
  "post__auth_refresh",
  "patch__users_me_avatar",
  "post__uploads_images",
  "post__uploads_files",
]);
const missingServices = mobileOperations.filter(
  ({ id }) =>
    !infrastructureHandled.has(id) && !containsOperationId(services, id),
);

console.log(
  JSON.stringify(
    {
      documentedOperations: operations.length,
      mobileOperations: mobileOperations.length,
      missingClient,
      missingServices,
      intentionallyExcluded: operations.filter(
        ({ path }) => path === "/webhooks/paystack" || path === "/health",
      ),
    },
    null,
    2,
  ),
);

if (missingClient.length || missingServices.length) process.exitCode = 1;
