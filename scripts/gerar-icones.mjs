/* Gera os ícones do PWA: fundo #141917 com um T claro.
   PNG escrito na mão (zlib do próprio Node), sem dependência externa.
   Uso: node scripts/gerar-icones.mjs */

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FUNDO = [0x14, 0x19, 0x17]
const LETRA = [0xe9, 0xe7, 0xe1]

const crcTabela = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTabela[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function bloco(tipo, dados) {
  const cabeca = Buffer.alloc(4)
  cabeca.writeUInt32BE(dados.length, 0)
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados])
  const fim = Buffer.alloc(4)
  fim.writeUInt32BE(crc32(corpo), 0)
  return Buffer.concat([cabeca, corpo, fim])
}

function png(lado, pixel) {
  // Uma linha por scanline, cada uma com o byte de filtro 0 na frente.
  const linha = 1 + lado * 3
  const cru = Buffer.alloc(linha * lado)
  for (let y = 0; y < lado; y++) {
    const base = y * linha
    cru[base] = 0
    for (let x = 0; x < lado; x++) {
      const cor = pixel(x, y)
      const p = base + 1 + x * 3
      cru[p] = cor[0]
      cru[p + 1] = cor[1]
      cru[p + 2] = cor[2]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 2 // cor verdadeira, sem alfa
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(cru, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ])
}

/* Um T de barras retas: a travessa em cima, o tronco no meio.
   `caixa` é o quanto do lado a letra ocupa — menor no ícone maskable,
   que o Android recorta em círculo. */
function letraT(lado, caixa) {
  const alturaT = lado * caixa
  const largura = alturaT * 0.86
  const traco = Math.max(2, Math.round(alturaT * 0.23))
  const x0 = Math.round((lado - largura) / 2)
  const y0 = Math.round((lado - alturaT) / 2)
  const x1 = x0 + Math.round(largura)
  const y1 = y0 + Math.round(alturaT)
  const meio = Math.round((x0 + x1) / 2)
  const tronco0 = meio - Math.round(traco / 2)
  const tronco1 = tronco0 + traco

  return (x, y) => {
    const travessa = y >= y0 && y < y0 + traco && x >= x0 && x < x1
    const tronco = x >= tronco0 && x < tronco1 && y >= y0 && y < y1
    return travessa || tronco ? LETRA : FUNDO
  }
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const destino = join(raiz, 'public', 'icons')
mkdirSync(destino, { recursive: true })

const icones = [
  ['icone-192.png', 192, 0.52],
  ['icone-512.png', 512, 0.52],
  ['icone-maskable-512.png', 512, 0.36],
  ['apple-touch-icon.png', 180, 0.52],
]

for (const [nome, lado, caixa] of icones) {
  writeFileSync(join(destino, nome), png(lado, letraT(lado, caixa)))
  console.log(`${nome} — ${lado}x${lado}`)
}
