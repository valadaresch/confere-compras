// Guarda o app no celular para abrir sem internet.
const VERSAO = 'confere-v3';
const FOTOS = 'confere-fotos';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'zxing.min.js',
  'icon-192.png', 'icon-512.png', 'icon-192-maskable.png', 'icon-512-maskable.png',
  'fonts/manrope-latin-500-normal.woff2', 'fonts/manrope-latin-600-normal.woff2',
  'fonts/manrope-latin-700-normal.woff2', 'fonts/manrope-latin-800-normal.woff2',
  'fonts/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO && k !== FOTOS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Fotos dos produtos: guarda no celular para aparecerem sem internet.
  if (e.request.destination === 'image' && url.origin !== location.origin) {
    e.respondWith(caches.open(FOTOS).then(async c => {
      const salvo = await c.match(e.request);
      if (salvo) return salvo;
      try { const r = await fetch(e.request); c.put(e.request, r.clone()); return r; }
      catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Página: tenta a versão nova na internet; sem sinal, usa a guardada.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
