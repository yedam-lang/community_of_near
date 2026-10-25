// 설치 가능 조건용 최소 서비스워커: 항상 네트워크 사용(오프라인 캐시 없음, 오래된 화면이 남지 않게)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
