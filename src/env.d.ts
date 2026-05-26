/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

// Cloudflare binding types (`Env`, `KVNamespace`, etc.) are generated into
// worker-configuration.d.ts by `wrangler types`. Access bindings via
// `import { env } from "cloudflare:workers"`.
