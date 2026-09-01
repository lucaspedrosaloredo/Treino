/* Service worker do Treino.
   Este arquivo é um modelo: no build, `vite.config.js` troca a versão pelo
   hash do conteúdo gerado e a lista abaixo pelos arquivos reais do bundle,
   e escreve o resultado em `dist/sw.js`. Em desenvolvimento ele não roda. */

const CACHE = 'treino-__VERSAO__'
const ARQUIVOS = ['__ARQUIVOS__']

/* Baixa tudo de uma vez. Sem `skipWaiting`: enquanto houver aba do build
   anterior aberta, este worker espera para ativar. */
self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS)))
})

/* Cada build tem seu cache; os das versões antigas saem daqui — e a essa
   altura não há mais página aberta usando os arquivos deles, porque a
   ativação esperou. O `claim` vale na primeira instalação, que não tem
   worker anterior e assume a página já aberta. */
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((c) => c.startsWith('treino-') && c !== CACHE).map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/* O app pergunta antes de atualizar: uma troca de worker recarrega a página, e
   fazer isso no meio de uma série seria hostil. Quem decide a hora é quem está
   treinando — a tela de Ajustes manda esta mensagem. */
self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.tipo === 'ASSUMIR_AGORA') self.skipWaiting()
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return
  if (new URL(req.url).origin !== self.location.origin) return

  // O Vite marca os assets como crossorigin, então o navegador manda `Origin` e
  // servidor nenhum precisa responder o mesmo para todos: `Vary` no cabeçalho
  // faria o cache não casar. Aqui dentro só há arquivo nosso, então ignoramos.
  const busca = { ignoreVary: true }

  // Abrir o app é sempre a mesma página; sem rede, ela vem do cache.
  if (req.mode === 'navigate') {
    evento.respondWith(caches.match('/index.html', busca).then((r) => r || fetch(req)))
    return
  }

  evento.respondWith(
    caches.match(req, busca).then((guardado) => {
      if (guardado) return guardado
      return fetch(req).then((resposta) => {
        if (resposta.ok && resposta.type === 'basic') {
          const copia = resposta.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copia))
        }
        return resposta
      })
    }),
  )
})
