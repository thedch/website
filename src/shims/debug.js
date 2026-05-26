// ESM-safe replacement for the CJS `debug` package, aliased in astro.config.mjs.
// `debug` references the CommonJS `module` global at load time, which doesn't
// exist in the workerd runtime used by @astrojs/cloudflare for dev/SSR/prerender.
// `obug` is a drop-in ESM fork. See the alias comment in astro.config.mjs.
import { createDebug, disable, enable, enabled, namespaces } from "obug";

export default createDebug;
export { createDebug, disable, enable, enabled, namespaces };
