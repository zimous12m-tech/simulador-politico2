/**
 * SERVICE WORKER — Teoria das Sociedades
 * Cache offline: guarda todos os ficheiros na primeira visita.
 *
 * IMPORTANTE: sempre que alterares ficheiros, MUDA O NOME DA CACHE
 * (ex: v2 → v3). Senão o browser serve a versão antiga para sempre.
 */

const CACHE = "teoria-sociedades-v4";   // ← nome único, mudar a cada alteração grande

const FICHEIROS = [
  "./",
  "./index.html",
  "./app.js",
  "./estilo.css",
  "./chart.umd.min.js",
  "./manifest.json",
  "./icone.svg",
  "./dados/paises.js",
  "./dados/portugal.json",
  "./motor/simulacao.js",
  "./motor/utils.js",
  "./motor/sistemas/demografia.js",
  "./motor/sistemas/educacao.js",
  "./motor/sistemas/trabalho.js",
  "./motor/sistemas/economia.js",
  "./motor/sistemas/estado.js",
  "./motor/sistemas/financas.js",
  "./motor/sistemas/habitacao.js",
  "./motor/sistemas/sociedade.js",
  "./motor/sistemas/crises.js",
  "./motor/sistemas/clima.js",
];

// Instalação: guarda tudo em cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(FICHEIROS).catch((err) => {
        console.warn("Service Worker: falha a guardar alguns ficheiros:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activação: limpa caches antigas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first com fallback à rede
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ficheiros de países individuais: sempre à rede (são carregados sob demanda)
  // Se falhar, tenta a cache
  if (url.pathname.startsWith("/dados/paises/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Restantes: cache-first
  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) {
        // Actualizar em background (stale-while-revalidate)
        fetch(event.request).then((respostaRede) => {
          if (respostaRede && respostaRede.status === 200) {
            caches.open(CACHE).then((cache) => {
              cache.put(event.request, respostaRede.clone());
            });
          }
        }).catch(() => {});
        return respostaCache;
      }

      // Não está em cache: vai à rede
      return fetch(event.request).then((respostaRede) => {
        if (!respostaRede || respostaRede.status !== 200) return respostaRede;
        const clone = respostaRede.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return respostaRede;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});