/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { CacheFirst, ExpirationPlugin, RangeRequestsPlugin, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const bibleDataCache = {
  matcher: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
    sameOrigin &&
    (url.pathname.startsWith("/data/bible-") ||
      url.pathname === "/data/bible-db-version.json" ||
      url.pathname.startsWith("/sql-wasm/")),
  handler: new CacheFirst({
    cacheName: "bible-static-assets",
    plugins: [
      new RangeRequestsPlugin(),
      new ExpirationPlugin({
        maxEntries: 16,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [bibleDataCache, ...defaultCache],
});

serwist.addEventListeners();
