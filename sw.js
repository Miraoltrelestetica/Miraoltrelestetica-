/* Mira – service worker. Cambia VERSIONE a ogni aggiornamento per far arrivare la nuova versione a tutte le clienti. */
const VERSIONE = 'mira-v46';
const FILE = ['./', 'index.html', 'manifest.webmanifest', 'logo.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return; // Firebase e font: sempre dalla rete
  if (r.mode === 'navigate') { // pagine: prima la rete, poi la copia salvata (funziona anche offline)
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSIONE).then(x => x.put('index.html', c)); return res; })
      .catch(() => caches.match('index.html')));
    return;
  }
  if (u.pathname.endsWith('.js')) { // il codice: prima la rete, così gli aggiornamenti arrivano subito
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSIONE).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r)));
    return;
  }
  e.respondWith(caches.match(r).then(h => h || fetch(r).then(res => { const c = res.clone(); caches.open(VERSIONE).then(x => x.put(r, c)); return res; })));
});
