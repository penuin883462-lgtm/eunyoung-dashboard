const CACHE = 'eunyoung-v3';
const ASSETS = [
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => {
       // 모든 열린 탭/앱에 새로고침 신호 전송
       return self.clients.matchAll({ type: 'window' }).then(clients => {
         clients.forEach(client => client.navigate(client.url));
       });
     })
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // PDF 파일: 서비스 워커 건너뜀
  if (url.match(/\.pdf(\?|$)/i)) return;

  // HTML 파일: 항상 네트워크 우선 (최신 버전 보장)
  if (e.request.mode === 'navigate' || url.match(/\.html(\?|$)/i)) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // 나머지: 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
