import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/* Lista os arquivos gerados, com caminho relativo à raiz do site. */
function listar(dir, raiz) {
  const saida = []
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue
    const caminho = join(dir, item.name)
    if (item.isDirectory()) saida.push(...listar(caminho, raiz))
    else saida.push(relative(raiz, caminho).split(sep).join(posix.sep))
  }
  return saida
}

/* Escreve o service worker depois do build, com a lista dos arquivos que
   saíram do bundle — inclusive os nomes com hash, que só existem aqui. */
function serviceWorker() {
  return {
    name: 'treino-service-worker',
    apply: 'build',
    writeBundle(opcoes) {
      const destino = opcoes.dir
      const arquivos = listar(destino, destino).filter((f) => f !== 'sw.js')

      // A versão sai do conteúdo: build igual mantém o cache, build novo troca.
      const soma = createHash('sha256')
      for (const f of arquivos.sort()) soma.update(f).update(readFileSync(join(destino, f)))
      const versao = soma.digest('hex').slice(0, 12)

      const lista = ['/', ...arquivos.map((f) => '/' + f)]
      const modelo = readFileSync(join(import.meta.dirname, 'src', 'sw.js'), 'utf8')
        .replaceAll('__VERSAO__', versao)
        .replaceAll("['__ARQUIVOS__']", JSON.stringify(lista, null, 2))

      writeFileSync(join(destino, 'sw.js'), modelo)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
  /* Sem isto o JSX dos testes sai no formato antigo, que exige `React` no
     escopo, e todo teste de componente quebra com "React is not defined". */
  esbuild: { jsx: 'automatic' },
})
