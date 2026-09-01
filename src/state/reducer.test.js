import { describe, it, expect } from "vitest";

import { reducer, montaSessaoDaFicha, proximaDivisao } from "./reducer.js";
import { estadoSemeado } from "./persistencia.js";
import { fichasAtivas } from "../lib/agenda.js";
import { volumeSessao } from "../lib/calculos.js";

const inicial = () => estadoSemeado();
const roda = (estado, ...acoes) => acoes.reduce(reducer, estado);

describe("fichas", () => {
  it("cria divisão além das cinco, sem limite", () => {
    let e = inicial();
    const antes = e.fichas.length;
    e = roda(e, { tipo: "FICHA_CRIADA" }, { tipo: "FICHA_CRIADA" });
    expect(e.fichas).toHaveLength(antes + 2);
  });

  it("escolhe a próxima letra livre", () => {
    expect(proximaDivisao([{ divisao: "A" }, { divisao: "B" }])).toBe("C");
    expect(proximaDivisao([])).toBe("A");
  });

  it("duplicar dá ids próprios aos exercícios, para editar a cópia não mexer na origem", () => {
    let e = inicial();
    const origem = fichasAtivas(e)[0];
    e = reducer(e, { tipo: "FICHA_DUPLICADA", fichaId: origem.id });
    const copia = e.fichas[e.fichas.length - 1];
    expect(copia.exercicios).toHaveLength(origem.exercicios.length);
    expect(copia.exercicios[0].id).not.toBe(origem.exercicios[0].id);

    e = reducer(e, {
      tipo: "FICHA_EXERCICIO_ATUALIZADO",
      fichaId: copia.id, fichaExercicioId: copia.exercicios[0].id,
      exercicioId: copia.exercicios[0].exercicioId,
      mudancas: { series: 99 },
    });
    const origemDepois = e.fichas.find((f) => f.id === origem.id);
    expect(origemDepois.exercicios[0].series).toBe(origem.exercicios[0].series);
  });

  it("reordenar não é atrapalhado por fichas arquivadas na mesma lista", () => {
    /* Regressão: ativas e arquivadas convivem na mesma lista e podem repetir a
       `ordem`. Mover uma ativa chegou a trocá-la com uma arquivada invisível. */
    let e = inicial();
    expect(e.fichas.filter((f) => f.arquivada).length).toBeGreaterThan(0);
    const antesArquivadas = e.fichas.filter((f) => f.arquivada).map((f) => f.id);
    e = reducer(e, { tipo: "FICHA_MOVIDA", fichaId: fichasAtivas(e)[0].id, direcao: 1 });
    expect(e.fichas.filter((f) => f.arquivada).map((f) => f.id)).toEqual(antesArquivadas);
  });

  it("reordenar reescreve a ordem de todas", () => {
    let e = inicial();
    const antes = fichasAtivas(e).map((f) => f.divisao);
    e = reducer(e, { tipo: "FICHA_MOVIDA", fichaId: fichasAtivas(e)[0].id, direcao: 1 });
    const depois = fichasAtivas(e).map((f) => f.divisao);
    expect(depois[0]).toBe(antes[1]);
    expect(depois[1]).toBe(antes[0]);
  });

  it("arquivar tira da rotina sem apagar", () => {
    let e = inicial();
    const f = fichasAtivas(e)[0];
    e = reducer(e, { tipo: "FICHA_ATUALIZADA", fichaId: f.id, mudancas: { arquivada: true } });
    expect(fichasAtivas(e).find((x) => x.id === f.id)).toBeUndefined();
    expect(e.fichas.find((x) => x.id === f.id)).toBeTruthy();
  });
});

describe("histórico é imutável frente a mudanças na ficha", () => {
  /* O requisito central do modelo v2: editar ou apagar uma ficha não pode
     reescrever o que já aconteceu. */
  function comSessaoSalva() {
    let e = inicial();
    const ficha = fichasAtivas(e)[0];
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: ficha.id });
    e = roda(e,
      { tipo: "SESSAO_SERIE_ATUALIZADA", indiceExercicio: 0, indiceSerie: 0, mudancas: { cargaKg: 60, repeticoes: 10, concluida: true } },
      { tipo: "SESSAO_FINALIZADA" },
    );
    return { estado: e, fichaId: ficha.id, sessao: e.sessoesMusculacao[0] };
  }

  it("renomear o exercício na ficha não muda o nome no histórico", () => {
    const { estado, fichaId, sessao } = comSessaoSalva();
    const nomeSalvo = sessao.exercicios[0].nomeSnapshot;
    const fe = estado.fichas.find((f) => f.id === fichaId).exercicios[0];
    const depois = reducer(estado, {
      tipo: "FICHA_EXERCICIO_ATUALIZADO",
      fichaId, fichaExercicioId: fe.id, exercicioId: fe.exercicioId,
      mudancas: { nomeSnapshot: "Nome completamente novo" },
    });
    expect(depois.sessoesMusculacao[0].exercicios[0].nomeSnapshot).toBe(nomeSalvo);
  });

  it("excluir a ficha não apaga nem esvazia a sessão", () => {
    const { estado, fichaId } = comSessaoSalva();
    const depois = reducer(estado, { tipo: "FICHA_REMOVIDA", fichaId });
    expect(depois.fichas.find((f) => f.id === fichaId)).toBeUndefined();
    expect(depois.sessoesMusculacao).toHaveLength(1);
    expect(depois.sessoesMusculacao[0].fichaNomeSnapshot).toBeTruthy();
    expect(volumeSessao(depois.sessoesMusculacao[0])).toBe(600);
  });

  it("mudar o número de séries na ficha não altera as séries já salvas", () => {
    const { estado, fichaId } = comSessaoSalva();
    const fe = estado.fichas.find((f) => f.id === fichaId).exercicios[0];
    const depois = reducer(estado, {
      tipo: "FICHA_EXERCICIO_ATUALIZADO",
      fichaId, fichaExercicioId: fe.id, exercicioId: fe.exercicioId, mudancas: { series: 99 },
    });
    expect(depois.sessoesMusculacao[0].exercicios[0].series).toHaveLength(1);
  });
});

describe("sessão em andamento", () => {
  it("monta a sessão a partir da ficha com snapshot da prescrição", () => {
    const e = inicial();
    const ficha = fichasAtivas(e)[0];
    const sessao = montaSessaoDaFicha(e, ficha);
    expect(sessao.status).toBe("andamento");
    expect(sessao.exercicios).toHaveLength(ficha.exercicios.length);
    expect(sessao.exercicios[0].series).toHaveLength(ficha.exercicios[0].series);
    expect(sessao.exercicios[0].repsMaxSnapshot).toBe(ficha.exercicios[0].repsMax);
    expect(sessao.exercicios[0].series.every((s) => !s.concluida)).toBe(true);
  });

  it("a sessão em andamento fica no estado, que é o que a faz sobreviver a um reload", () => {
    let e = inicial();
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: fichasAtivas(e)[0].id });
    expect(e.sessaoEmAndamento).toBeTruthy();
    e = reducer(e, { tipo: "SESSAO_SERIE_ATUALIZADA", indiceExercicio: 0, indiceSerie: 0, mudancas: { cargaKg: 22.5 } });
    /* Serializar e voltar imita exatamente o que o localStorage faz. */
    const revivido = JSON.parse(JSON.stringify(e));
    expect(revivido.sessaoEmAndamento.exercicios[0].series[0].cargaKg).toBe(22.5);
  });

  it("acrescenta e remove série durante o treino", () => {
    let e = inicial();
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: fichasAtivas(e)[0].id });
    const antes = e.sessaoEmAndamento.exercicios[0].series.length;
    e = reducer(e, { tipo: "SESSAO_SERIE_ADICIONADA", indiceExercicio: 0 });
    expect(e.sessaoEmAndamento.exercicios[0].series).toHaveLength(antes + 1);
    e = reducer(e, { tipo: "SESSAO_SERIE_REMOVIDA", indiceExercicio: 0, indiceSerie: antes });
    expect(e.sessaoEmAndamento.exercicios[0].series).toHaveLength(antes);
    expect(e.sessaoEmAndamento.exercicios[0].series.map((s) => s.numero)).toEqual(
      Array.from({ length: antes }, (_, i) => i + 1),
    );
  });

  it("finalizar guarda só o que foi marcado como feito", () => {
    let e = inicial();
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: fichasAtivas(e)[0].id });
    e = roda(e,
      { tipo: "SESSAO_SERIE_ATUALIZADA", indiceExercicio: 0, indiceSerie: 0, mudancas: { cargaKg: 60, repeticoes: 10, concluida: true } },
      { tipo: "SESSAO_SERIE_ATUALIZADA", indiceExercicio: 0, indiceSerie: 1, mudancas: { cargaKg: 60, repeticoes: 8, concluida: false } },
      { tipo: "SESSAO_FINALIZADA" },
    );
    expect(e.sessaoEmAndamento).toBeNull();
    expect(e.sessoesMusculacao[0].exercicios[0].series).toHaveLength(1);
    expect(e.sessoesMusculacao[0].data).toBeTruthy();
    expect(e.sessoesMusculacao[0].duracaoSegundos).toBeGreaterThanOrEqual(0);
  });

  it("finalizar sem nada marcado não cria sessão vazia no histórico", () => {
    let e = inicial();
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: fichasAtivas(e)[0].id });
    e = reducer(e, { tipo: "SESSAO_FINALIZADA" });
    expect(e.sessoesMusculacao).toHaveLength(0);
    expect(e.sessaoEmAndamento).toBeNull();
  });

  it("descartar não deixa resto no histórico", () => {
    let e = inicial();
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: fichasAtivas(e)[0].id });
    e = reducer(e, { tipo: "SESSAO_DESCARTADA" });
    expect(e.sessaoEmAndamento).toBeNull();
    expect(e.sessoesMusculacao).toHaveLength(0);
  });
});

describe("histórico editável", () => {
  it("corrige a carga de uma série salva", () => {
    let e = inicial();
    e = reducer(e, { tipo: "SESSAO_INICIADA", fichaId: fichasAtivas(e)[0].id });
    e = roda(e,
      { tipo: "SESSAO_SERIE_ATUALIZADA", indiceExercicio: 0, indiceSerie: 0, mudancas: { cargaKg: 60, repeticoes: 10, concluida: true } },
      { tipo: "SESSAO_FINALIZADA" },
    );
    const id = e.sessoesMusculacao[0].id;
    e = reducer(e, { tipo: "SESSAO_HISTORICO_SERIE_ATUALIZADA", sessaoId: id, indiceExercicio: 0, indiceSerie: 0, mudancas: { cargaKg: 65 } });
    expect(volumeSessao(e.sessoesMusculacao[0])).toBe(650);
    e = reducer(e, { tipo: "SESSAO_HISTORICO_REMOVIDA", sessaoId: id });
    expect(e.sessoesMusculacao).toHaveLength(0);
  });
});

describe("pesagens", () => {
  it("uma entrada por data: registrar de novo substitui", () => {
    let e = inicial();
    e = roda(e,
      { tipo: "PESAGEM_REGISTRADA", data: "2026-08-01", pesoKg: 80 },
      { tipo: "PESAGEM_REGISTRADA", data: "2026-08-01", pesoKg: 79 },
    );
    expect(e.pesagens).toHaveLength(1);
    expect(e.pesagens[0].pesoKg).toBe(79);
  });

  it("mantém ordenado por data e permite excluir", () => {
    let e = inicial();
    e = roda(e,
      { tipo: "PESAGEM_REGISTRADA", data: "2026-08-15", pesoKg: 79 },
      { tipo: "PESAGEM_REGISTRADA", data: "2026-08-01", pesoKg: 80 },
    );
    expect(e.pesagens.map((p) => p.data)).toEqual(["2026-08-01", "2026-08-15"]);
    e = reducer(e, { tipo: "PESAGEM_REMOVIDA", pesagemId: e.pesagens[0].id });
    expect(e.pesagens).toHaveLength(1);
  });
});

describe("corrida", () => {
  it("registrar vinculada conclui a sessão do plano", () => {
    let e = inicial();
    const plano = e.planosCorrida[0];
    const sessao = plano.semanas[0].sessoes[0];
    e = reducer(e, {
      tipo: "CORRIDA_REGISTRADA",
      corrida: { data: "2026-08-02", distanciaKm: 5, duracaoSegundos: 1800, planoId: plano.id, sessaoPlanejadaId: sessao.id },
    });
    const depois = e.planosCorrida[0].semanas[0].sessoes[0];
    expect(depois.status).toBe("concluida");
    expect(e.corridas).toHaveLength(1);
  });

  it("corrida avulsa não precisa de plano", () => {
    let e = inicial();
    e = reducer(e, { tipo: "CORRIDA_REGISTRADA", corrida: { data: "2026-08-02", distanciaKm: 7 } });
    expect(e.corridas[0].planoId).toBeNull();
  });

  it("reagendar muda a data planejada sem apagar a sessão", () => {
    let e = inicial();
    const plano = e.planosCorrida[0];
    const sessao = plano.semanas[0].sessoes[0];
    e = reducer(e, {
      tipo: "SESSAO_PLANEJADA_ATUALIZADA", planoId: plano.id, sessaoId: sessao.id,
      mudancas: { dataPlanejada: "2026-09-10" },
    });
    const depois = e.planosCorrida[0].semanas[0].sessoes[0];
    expect(depois.dataPlanejada).toBe("2026-09-10");
    expect(depois.nome).toBe(sessao.nome);
  });

  it("duplicar semana renumera e zera o status das sessões copiadas", () => {
    let e = inicial();
    const plano = e.planosCorrida[0];
    const total = plano.semanas.length;
    e = reducer(e, { tipo: "SEMANA_DUPLICADA", planoId: plano.id, semanaId: plano.semanas[0].id });
    const p = e.planosCorrida[0];
    expect(p.semanas).toHaveLength(total + 1);
    expect(p.semanas.map((s) => s.numero)).toEqual(Array.from({ length: total + 1 }, (_, i) => i + 1));
    expect(p.semanas[1].sessoes.every((s) => s.status === "planejada")).toBe(true);
    expect(p.semanas[1].sessoes[0].id).not.toBe(p.semanas[0].sessoes[0].id);
  });

  it("ativar um plano desativa os outros", () => {
    let e = inicial();
    e = reducer(e, { tipo: "PLANO_ATIVADO", planoId: e.planosCorrida[1].id });
    expect(e.planosCorrida.filter((p) => p.ativo)).toHaveLength(1);
    expect(e.planosCorrida[1].ativo).toBe(true);
  });
});

describe("ação desconhecida", () => {
  it("devolve o mesmo estado, sem estragar nada", () => {
    const e = inicial();
    expect(reducer(e, { tipo: "NAO_EXISTE" })).toBe(e);
  });
});
