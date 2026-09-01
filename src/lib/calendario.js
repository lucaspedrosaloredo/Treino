/* Montagem do calendário mensal. Puro e sem Date fora do fuso local — todo o
   resto do app usa chaves YYYY-MM-DD e aqui não é diferente. */

import { paraChaveData, deChaveData } from "./dates.js";

export const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Semanas do mês, cada uma com sete células.
 * As bordas trazem os dias do mês vizinho em vez de buracos: uma grade com
 * lacunas é mais difícil de ler do que uma cheia com os vizinhos apagados.
 */
export function matrizDoMes(ano, mes, primeiroDia = 1) {
  const primeiroDoMes = new Date(ano, mes, 1);
  const deslocamento = (primeiroDoMes.getDay() - primeiroDia + 7) % 7;

  const inicio = new Date(ano, mes, 1 - deslocamento);
  const semanas = [];

  for (let s = 0; s < 6; s += 1) {
    const semana = [];
    for (let d = 0; d < 7; d += 1) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + s * 7 + d);
      semana.push({
        chave: paraChaveData(dia),
        diaDoMes: dia.getDate(),
        doMes: dia.getMonth() === mes,
      });
    }
    semanas.push(semana);
    /* Seis linhas só quando o mês realmente precisa. */
    const ultima = semana[6];
    if (deChaveData(ultima.chave).getMonth() !== mes && s >= 4) break;
  }
  return semanas;
}

/** Cabeçalho da grade: iniciais dos dias, começando pelo dia escolhido. */
export function iniciaisDosDias(primeiroDia = 1) {
  const iniciais = ["D", "S", "T", "Q", "Q", "S", "S"];
  return Array.from({ length: 7 }, (_, i) => iniciais[(primeiroDia + i) % 7]);
}

/** Índice data -> atividades daquele dia, para a grade não varrer as listas
 *  inteiras em cada célula. */
export function indexaAtividades(estado) {
  const mapa = new Map();
  const garante = (chave) => {
    if (!mapa.has(chave)) mapa.set(chave, { treinos: [], corridas: [] });
    return mapa.get(chave);
  };

  (estado.sessoesMusculacao || [])
    .filter((s) => s.status === "concluida" && s.data)
    .forEach((s) => garante(s.data).treinos.push(s));

  (estado.corridas || []).filter((c) => c.data).forEach((c) => garante(c.data).corridas.push(c));

  return mapa;
}

/** Mês anterior/seguinte sem estourar dezembro nem janeiro. */
export function mesVizinho(ano, mes, passo) {
  const d = new Date(ano, mes + passo, 1);
  return { ano: d.getFullYear(), mes: d.getMonth() };
}

/** Texto para leitor de tela: o que aconteceu naquele dia. */
export function descreveDia(chave, atividades) {
  if (!atividades) return "sem atividade";
  const partes = [];
  if (atividades.treinos.length) partes.push(`${atividades.treinos.length} treino(s)`);
  if (atividades.corridas.length) partes.push(`${atividades.corridas.length} corrida(s)`);
  return partes.length ? partes.join(" e ") : "sem atividade";
}
