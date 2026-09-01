# Treino

App pessoal de musculação e corrida. Roda no navegador, instala na tela de
início e funciona sem rede.

Publicado em https://treino-pi-ten.vercel.app

**Seus dados ficam neste aparelho.** Não há servidor, conta, assinatura nem
sincronização: tudo vive no `localStorage`, sob a chave `treino:estado:v2`.
Em compensação, limpar os dados do navegador ou trocar de celular apaga o que
não tiver sido exportado — veja [Backup](#backup).

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção em dist/
npm run test       # testes (Vitest)
npm run test:watch # testes em modo contínuo
npm run lint       # oxlint
```

## Instalar no celular

**iPhone/iPad:** abra o site no Safari, toque em Compartilhar e escolha
*Adicionar à Tela de Início*. O iOS não permite que uma página peça instalação
sozinha, por isso o passo a passo — ele também está dentro do app, em
Ajustes › Instalação.

**Android:** o Chrome oferece a instalação sozinho; o botão também aparece em
Ajustes › Instalação.

Instalado, o app abre em tela cheia, sem a barra do navegador, e continua
abrindo com o celular sem rede.

## As cinco abas

- **Hoje** — próximo treino da sequência, corrida prevista, aviso quando as duas
  caem no mesmo dia, ações rápidas, últimos sete dias e atividades recentes.
- **Treino** — *Executar* (a sessão em si), *Fichas* (criar, editar, duplicar,
  reordenar, arquivar, excluir) e *Histórico* (consultar, corrigir, apagar).
- **Corrida** — *Plano* da semana atual, *Histórico* de corridas e *Meus planos*
  para editar a periodização semana a semana.
- **Progresso** — filtros de período e três subtelas: Resumo, Musculação e
  Corrida, mais o peso corporal.
- **Ajustes** — perfil, agenda, fichas, planos, aparência, dados e instalação.

## Como o app decide o próximo treino

Três modos, em Ajustes › Treinos e agenda:

- **Sequência livre** (padrão) — concluiu A, a próxima é B, não importa quantos
  dias passaram. É o modo que sobrevive a plantão, folga e viagem.
- **Dias fixos** — cada ficha presa a um dia da semana.
- **Escala 12x36** — você informa uma data que sabe de cor e se naquele dia
  trabalhou ou folgou; o app deduz o resto do ciclo e sugere treinar nas folgas.

Em qualquer modo, começar outra ficha fora da ordem continua valendo: o que o
app faz é sugerir, não mandar.

## Progressão de carga

Progressão dupla: se todas as séries de trabalho chegaram ao topo da faixa de
repetições, o app sugere somar o incremento daquele exercício; se não chegaram,
sugere repetir a carga e buscar a faixa cheia. A sugestão sempre aparece
acompanhada da razão, séries de aquecimento não entram na conta, e **nada é
aplicado sozinho** — o campo continua vazio até você digitar.

## Backup

Em Ajustes › Dados e privacidade:

- **Exportar** gera `treino-backup-AAAA-MM-DD.json`, com a versão do esquema e a
  data. Dá para compartilhar direto pelo aparelho quando ele suporta.
- **Importar** valida o arquivo antes de qualquer coisa e mostra uma prévia
  comparando o conteúdo dele com o que está no app. Ao substituir, o estado
  atual é baixado automaticamente, então sempre existe caminho de volta.
- **CSV** separados de musculação, corridas e peso, com cabeçalho em português.
  Servem para análise, não para restaurar.
- **Apagar tudo** exige digitar a palavra `APAGAR`.

Um backup da versão anterior do app também é aceito: ele é migrado na
importação.

**A aba Hoje cobra o backup** quando você nunca exportou ou quando o último tem
mais de duas semanas, com um botão para exportar ali mesmo. Não é zelo
excessivo: enquanto a cópia não sai do aparelho, qualquer limpeza do navegador
leva tudo, e não existe desfazer.

## Migração da versão 1

Quem já usava a versão anterior não precisa fazer nada: na primeira abertura o
app lê `treino:estado:v1`, converte para o modelo novo e guarda uma cópia
intacta em `treino:backup-v1`. **A chave original não é apagada.**

Três garantias regem a conversão:

1. Os ids antigos dos exercícios viram os ids do catálogo, e é isso que mantém
   cada treino registrado ligado ao exercício certo.
2. Os ids das sessões saem da data mais a divisão, então rodar a migração de
   novo produz o mesmo registro em vez de uma segunda cópia.
3. O que não cabe no modelo novo — data inválida, pesagem sem valor, rascunho em
   mais de uma divisão — vira aviso visível na primeira abertura, nunca sumiço
   silencioso.

Os dois níveis de ficha da versão anterior viram dez fichas: as cinco do nível
ativo ficam ativas, as outras cinco entram arquivadas e podem ser reativadas.

## Estrutura

```
src/
  app/          shell, navegação e as cinco abas
  components/   botão, campo, modal, confirmação, peças básicas
  data/         conteúdo curado da v1 e sementes de quem instala agora
  features/     uma pasta por aba: hoje, musculacao, corrida, progresso, ajustes
  hooks/        cronômetro de descanso, instalação, atualização
  lib/          esquema, armazenamento, migração, cálculos, agenda, backup
  state/        reducer, contexto e persistência
  styles/       tokens de cor, raio e alvo de toque
  sw.js         service worker (modelo; o build preenche versão e arquivos)
```

Regras que a estrutura sustenta:

- Componente nenhum fala com o `localStorage`. Ele despacha uma ação, o reducer
  decide e o provider persiste. Trocar por IndexedDB depois é substituir
  `lib/storage.js`, não a interface.
- O que é cálculo é função pura em `lib/`, testável sem montar tela.
- Cada sessão salva guarda o próprio snapshot de nome, grupo e prescrição.
  Editar ou apagar uma ficha **não reescreve o que já aconteceu**.

## Detalhes que não são óbvios

- **Campo numérico.** `<input type="number">` recusa vírgula: digitar `22,5`
  devolve string vazia e o valor some sem aviso. Por isso os campos decimais são
  `type="text"` com `inputMode="decimal"` — o teclado numérico continua
  aparecendo e a vírgula passa.
- **Zoom do iOS.** Campo com menos de 16px faz o Safari ampliar a página ao
  receber o foco, e ele não desfaz sozinho. A regra de 16px em `index.css` fica
  fora das camadas do Tailwind para vencer as utilitárias.
- **Safe area.** `viewport-fit=cover` junto com
  `apple-mobile-web-app-status-bar-style: black-translucent`. Sem o segundo, o
  iOS desenha o PWA abaixo da barra de status e todo `env(safe-area-inset-top)`
  vale zero. Os insets laterais entram na raiz, na barra de abas e no modal.
- **Cronômetro de descanso.** Conta pelo relógio, não somando ticks: o navegador
  do celular congela `setInterval` com a tela apagada, e um contador somado
  perderia todo o tempo de bolso.
- **Gráficos.** O Recharts fica num chunk separado, carregado só ao abrir o
  Progresso. O bundle inicial é cerca de 360 kB em vez de 580 kB.
- **Service worker e atualização.** Precache por build, com versão tirada do
  hash do conteúdo. A versão nova assume **sozinha na abertura seguinte**,
  desde que não haja treino em andamento — trocar de versão recarrega a página,
  e no meio de uma série isso seria hostil. Com treino aberto, o app avisa que
  a nova entra ao finalizar.
  Já foi diferente, e o resultado foi ruim: o worker esperava *todas* as abas
  fecharem, o que num celular quase nunca acontece. A versão nova ficava presa
  indefinidamente e a única saída era limpar os dados do site — levando o
  histórico junto. Se a troca automática falhar, aparece um botão em vez de
  tentar de novo em laço.
- **Raiz do domínio.** Nada define `base` no `vite.config.js`, então o
  `start_url` e o `scope` do manifest, o escopo do service worker e a lista de
  precache assumem `/`. Servido de um subcaminho, os três quebram de uma vez.

## Deploy

Na Vercel, sem `vercel.json`: ela reconhece o Vite sozinha, roda `vite build` e
serve `dist/`. Não há reescrita de SPA a configurar, porque não existe rota — as
abas são estado do React, sem History API.

## Testes

`npm run test` cobre o que quebra em silêncio: migração da v1 (estado vazio,
parcial, tipos errados, número como string, registro incompleto,
idempotência), backup e importação, decimal com vírgula, ritmo, volume,
progressão de carga, consistência semanal, peso, filtros por período no fuso
local, os três modos de agenda, e — o mais importante do modelo v2 — que editar
ou excluir uma ficha não altera o histórico já salvo.

## O que falta

- **Sem tema claro.** O app é escuro por opção. Um tema claro pela metade fica
  pior que tema nenhum.
- **Sem GPS.** O modelo de dados de corrida está preparado, mas não há
  rastreamento — e meio rastreamento é pior que nenhum.
- **Só kg e km.** Libra e milha entram quando houver conversão em todos os
  cálculos, gráficos e exportações.
- **Supersérie é só um rótulo.** Dá para marcar exercícios com o mesmo código,
  mas a execução ainda não os agrupa numa tela só.
- **Sem calendário mensal.** O histórico é lista com filtro de período; a grade
  de calendário ainda não existe.
