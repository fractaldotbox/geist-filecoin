import * as __MIDDLEWARE_0__ from "/home/vincentlaucy/workspaces/geist/geist-filecoin/node_modules/.pnpm/wrangler@4.20.5/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts";
import * as __MIDDLEWARE_1__ from "/home/vincentlaucy/workspaces/geist/geist-filecoin/node_modules/.pnpm/wrangler@4.20.5/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts";
import worker, * as OTHER_EXPORTS from "/home/vincentlaucy/workspaces/geist/geist-filecoin/packages/web/src/worker/index.ts";

export * from "/home/vincentlaucy/workspaces/geist/geist-filecoin/packages/web/src/worker/index.ts";
const MIDDLEWARE_TEST_INJECT = "__INJECT_FOR_TESTING_WRANGLER_MIDDLEWARE__";
export const __INTERNAL_WRANGLER_MIDDLEWARE__ = [
	__MIDDLEWARE_0__.default,
	__MIDDLEWARE_1__.default,
];
export default worker;
