/* Ajudantes de forma da sessão de treino. Puros, para poderem ser testados
   sem montar tela. */

/**
 * Agrupa os exercícios da sessão em blocos de execução.
 *
 * Exercícios vizinhos que compartilham o mesmo código de supersérie viram um
 * bloco só — é assim que eles são feitos na academia: alternando, sem descanso
 * entre um e outro. Exercícios sem código, ou sozinhos com o próprio código,
 * viram blocos de um item.
 *
 * A vizinhança importa: dois exercícios com o mesmo código em pontos distantes
 * da ficha não são uma supersérie, são um engano de digitação, e juntá-los
 * mudaria a ordem do treino sem a pessoa ter pedido.
 */
export function agrupaSuperseries(exercicios) {
  const blocos = [];

  (exercicios || []).forEach((ex, indice) => {
    const codigo = ex.supersetIdSnapshot ? String(ex.supersetIdSnapshot).trim() : "";
    const ultimo = blocos[blocos.length - 1];

    if (codigo && ultimo && ultimo.codigo === codigo) {
      ultimo.itens.push({ ex, indice });
      return;
    }
    blocos.push({ codigo, itens: [{ ex, indice }] });
  });

  return blocos.map((bloco, i) => ({
    id: bloco.codigo || `solo-${bloco.itens[0].indice}`,
    codigo: bloco.codigo,
    /* Um código sozinho não forma supersérie. */
    ehSuperserie: bloco.itens.length > 1,
    numero: i + 1,
    itens: bloco.itens,
  }));
}

/** Letra de cada membro da supersérie: A, B, C… — como as fichas de academia. */
export function letraDoMembro(posicao) {
  return String.fromCharCode(65 + posicao);
}

/** Quantas voltas o bloco tem: a maior contagem de séries entre os membros. */
export function voltasDoBloco(bloco) {
  return bloco.itens.reduce((maior, { ex }) => Math.max(maior, ex.series.length), 0);
}

/** Descanso de uma supersérie: o maior entre os membros, porque a volta só
 *  termina depois do exercício mais pesado dela. */
export function descansoDoBloco(bloco, padrao) {
  const valores = bloco.itens
    .map(({ ex }) => ex.descansoSegundosSnapshot)
    .filter((n) => typeof n === "number" && n > 0);
  return valores.length ? Math.max(...valores) : padrao;
}
