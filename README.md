# Treino
App pessoal de treino e corrida

Roda no navegador, guarda tudo no próprio aparelho. Não há servidor, conta nem
sincronização: os dados vivem no `localStorage`, sob a chave `treino:estado:v1`.

## Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run lint     # oxlint
```

## Estado do projeto

### O que já foi feito

**Base**

- Vite + React em JavaScript, na raiz do repositório.
- Tailwind CSS v4 pelo plugin oficial `@tailwindcss/vite`.
- `recharts` para os gráficos e `lucide-react` para os ícones.
- `index.html` em `pt-BR`, com `viewport-fit=cover` e
  `apple-mobile-web-app-status-bar-style: black-translucent` para o app ocupar a
  tela inteira no celular — os dois juntos, porque sem o segundo o iOS desenha o
  PWA abaixo da barra de status e todo `env(safe-area-inset-top)` vale zero.
  A barra de abas reserva `env(safe-area-inset-bottom)` para não ficar sob o
  indicador de home do iPhone, e o cabeçalho reserva `env(safe-area-inset-top)`
  para não encostar na barra de status — essa regra mora em `src/index.css`,
  fora das camadas do Tailwind, e por isso vence o `pt-4` do `<header>`. Os
  insets laterais entram no container raiz, na barra de abas e no modal, para o
  conteúdo não sumir sob o notch com o aparelho deitado.

**PWA** — instala na tela de início e abre sem rede:

- `public/manifest.webmanifest` com nome "Treino", `display: standalone`,
  `orientation: portrait` e as duas cores em `#141917`, a mesma do fundo do
  app — senão a splash do Android abre numa cor que o app nunca mostra.
- Ícones de 192 e 512, um 512 `maskable`, o `apple-touch-icon` de 180 e o
  `favicon-32.png` — PNGs na raiz de `public`, apontados pelo manifest e pelo
  `index.html`.
- Service worker em `src/sw.js`, que é um modelo: no build, o plugin em
  `vite.config.js` troca os marcadores pela lista real dos arquivos gerados
  (os nomes com hash só existem depois do bundle) e por uma versão tirada do
  hash do conteúdo, e escreve `dist/sw.js`. Cada build tem seu cache e apaga o
  da versão anterior — só quando ativa, e ele não chama `skipWaiting`, então
  espera as abas do build antigo fecharem em vez de puxar o cache debaixo de
  uma página aberta. Serve do cache primeiro; nas navegações devolve o
  `index.html` guardado, que é o que faz o app abrir sem rede. A busca no cache
  usa `ignoreVary`, senão o `Vary: Origin` da resposta não casa com o pedido dos
  assets, que o Vite marca como `crossorigin`. Registrado em `src/main.jsx` só
  no build de produção.

**App** — quatro abas, em `src/App.jsx`:

- **Treino** — fichas A a E, registro de carga e repetições por série. Sugere a
  próxima carga a partir do último registro: se bateu o topo da faixa de reps em
  todas as séries, sobe o incremento do exercício; senão, repete a carga e pede o
  topo da faixa. Dois níveis, do recomeço à hipertrofia.
- **Corrida** — planos de 5 km (4 semanas) e 10 km (8 semanas), com marcação de
  treino feito e campos de km e tempo.
- **Progresso** — contadores do período, peso corporal e evolução por exercício
  (maior carga e volume) em gráficos.
- **Ficha** — edição dos exercícios de cada dia, troca de nível, backup por
  exportar/importar e apagar tudo.

Build compila sem erro e o lint está zerado. O app foi conferido sem rede num
Chromium: com a rede cortada, ele recarrega do cache e abre normal.

### O que falta

- **Sem deploy.** Só roda em `localhost` — ainda não dá para usar na academia.
  Enquanto isso, o PWA não instala de verdade: fora de `localhost` o service
  worker exige HTTPS, e a safe area do topo só dá para conferir num iPhone real.
- **Backup é manual.** Exportar gera um texto para colar em outro lugar. Limpar
  o navegador ou trocar de celular sem exportar antes apaga tudo.
- **Histórico não é editável.** Os treinos salvos entram em `logs` e alimentam os
  gráficos, mas não há tela para listar, corrigir ou apagar um registro errado.
- **O incremento não é editável.** Na aba Ficha dá para mudar nome, séries e
  faixa de reps, mas não o `inc` de cada exercício — que é o passo de carga que a
  sugestão usa. Exercício novo nasce com 2,5 kg fixos.
- **Bundle grande.** 580 kB (173 kB comprimido), quase tudo Recharts, sem code
  splitting.

### Próximo passo

Publicar em algum lugar com HTTPS. Continua sendo o que separa o app de funcionar
na tela do computador e ser usado numa academia — e agora é também o que falta
para o PWA valer: o manifest e o service worker já estão prontos, mas fora de
`localhost` o navegador só instala e guarda os arquivos em HTTPS.
