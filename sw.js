// sw.js

const CACHE_NAME = 'controle-abastecimento-cache-v1.1'; // Mude a versão se fizer alterações significativas

// Lista de arquivos para cachear
// IMPORTANTE: Adicione os caminhos para seus ícones reais aqui
const URLS_TO_CACHE = [
  './', // Cacheia a raiz, que geralmente serve index.html
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',

  // ADICIONE OS CAMINHOS PARA SEUS ÍCONES REAIS AQUI
  // Exemplo (substitua pelos seus arquivos e nomes corretos):
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-192x192.png',
  './icon-maskable-512x512.png',

  // Bibliotecas externas (CDN)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2', // Exemplo, verifique os nomes corretos
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// Evento de instalação: Cacheia os assets principais
self.addEventListener('install', event => {
  console.log('[Service Worker] Evento de Instalação');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto:', CACHE_NAME);
        // Tenta cachear todas as URLs. Falhas em recursos externos não devem impedir a instalação.
        const cachePromises = URLS_TO_CACHE.map(urlToCache => {
          return cache.add(urlToCache).catch(err => {
            console.warn(`[Service Worker] Falha ao cachear ${urlToCache}: ${err}`);
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] Todos os assets especificados foram pré-cacheados (ou tentados).');
        return self.skipWaiting(); // Ativa o novo Service Worker imediatamente
      })
      .catch(error => {
        console.error('[Service Worker] Falha no pré-cache:', error);
      })
  );
});

// Evento de ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  console.log('[Service Worker] Evento de Ativação');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Ativado e caches antigos limpos.');
        return self.clients.claim(); // Assume o controle de clientes não controlados
    })
  );
});

// Evento de fetch: Serve do cache se disponível, senão busca na rede
self.addEventListener('fetch', event => {
  // Para requisições de navegação (geralmente páginas HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request) // Tenta a rede primeiro
        .then(response => {
          // Se a requisição de rede for bem-sucedida, clona, cacheia e retorna
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Se a rede falhar, tenta servir a página principal do cache
          console.log('[Service Worker] Fetch de navegação falhou, tentando cache para:', event.request.url);
          return caches.match(event.request) // Tenta encontrar a requisição exata no cache
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback para o index.html principal se a requisição específica não estiver em cache
              return caches.match('./index.html');
            });
        })
    );
    return;
  }

  // Para outras requisições (CSS, JS, imagens, fontes), usa estratégia cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Serve do cache
        }
        // Não está no cache, busca na rede
        return fetch(event.request).then(
          networkResponse => {
            // Se a requisição for bem-sucedida, clona, cacheia e retorna
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('[Service Worker] Fetch falhou para requisição não-navegação:', event.request.url, error);
          // Opcionalmente, fornecer um fallback para tipos específicos de assets
        });
      })
  );
});