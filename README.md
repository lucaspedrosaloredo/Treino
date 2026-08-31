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
- `index.html` em `pt-BR`, com `viewport-fit=cover` para o app ocupar a tela
  inteira no celular.

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

Build compila sem erro e o lint está zerado.

### O que falta

- **Safe area do iOS.** A barra de abas é `fixed bottom-0` e não reserva
  `env(safe-area-inset-bottom)`. Com `viewport-fit=cover`, num iPhone com
  indicador de home ela fica parcialmente coberta.
- **Não é PWA.** Sem manifest nem service worker, o app não instala na tela de
  início e não abre sem rede.
- **Sem deploy.** Só roda em `localhost` — ainda não dá para usar na academia.
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

Fazer o app rodar no celular de verdade: corrigir a safe area e publicar em
algum lugar com HTTPS. São as duas coisas entre o app funcionando na tela do
computador e ele sendo usado numa academia. O PWA vem logo depois, para instalar
na tela de início e abrir sem rede — o que também deixa o `localStorage` menos
frágil no dia a dia.
