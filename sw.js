// zaico (在庫管理システム) 用のService Worker。
// - 同一オリジンの静的ファイルをキャッシュし、オフラインでもアプリの起動を可能にする(stale-while-revalidate)。
// - Firebase等の外部オリジンへのリクエストはキャッシュ対象外とし、常にネットワークから取得する。
// - index.html側の window.__kpApplyUpdate() からの SKIP_WAITING メッセージを受けて即時更新する。

const CACHE_VERSION = "zaico-cache-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./icon-16.png",
  "./icon-32.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((err) => {
        console.warn("[sw] core assets のキャッシュに失敗しました:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// index.html側の __kpApplyUpdate() から postMessage({ type: "SKIP_WAITING" }) を受け取る。
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // 別オリジン(Firebase / CDN 等)は素通しし、キャッシュしない。
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
