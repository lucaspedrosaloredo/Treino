import { describe, it, expect } from "vitest";
import {
  fichasAtivas, proximaFichaPorSequencia, fichaDoDiaSemanal, ehDiaDeTrabalho,
  proximasFolgas, planoDoDia, semanaAtualDoPlano, progressoDoPlano, planoCorridaAtivo,
} from "./agenda.js";
import { configuracoesPadrao } from "./schema.js";

const ficha = (id, divisao, ordem, arquivada = false) => ({ id, divisao, nome: divisao, ordem, arquivada, exercicios: [] });

const base = (over = {}) => ({
  fichas: [ficha("f1", "A", 0), ficha("f2", "B", 1), ficha("f3", "C", 2), ficha("fx", "X", 9, true)],
  sessoesMusculacao: [],
  planosCorrida: [],
  agenda: [],
  configuracoes: configuracoesPadrao(),
  ...over,
});

describe("fichas ativas", () => {
  it("exclui arquivada e respeita a ordem", () => {
    expect(fichasAtivas(base()).map((f) => f.divisao)).toEqual(["A", "B", "C"]);
  });
});

describe("modo sequência", () => {
  it("sem histórico começa pela primeira", () => {
    expect(proximaFichaPorSequencia(base()).divisao).toBe("A");
  });
  it("depois de A vem B", () => {
    const e = base({ sessoesMusculacao: [{ id: "s", status: "concluida", data: "2026-08-01", fichaId: "f1" }] });
    expect(proximaFichaPorSequencia(e).divisao).toBe("B");
  });
  it("depois da última volta para a primeira", () => {
    const e = base({ sessoesMusculacao: [{ id: "s", status: "concluida", data: "2026-08-01", fichaId: "f3" }] });
    expect(proximaFichaPorSequencia(e).divisao).toBe("A");
  });
  it("pular dias não muda a sequência", () => {
    const e = base({ sessoesMusculacao: [
      { id: "s1", status: "concluida", data: "2026-07-01", fichaId: "f1" },
      { id: "s2", status: "concluida", data: "2026-08-20", fichaId: "f2" },
    ] });
    expect(proximaFichaPorSequencia(e).divisao).toBe("C");
  });
  it("se a ficha da última sessão sumiu, recomeça em vez de travar", () => {
    const e = base({ sessoesMusculacao: [{ id: "s", status: "concluida", data: "2026-08-01", fichaId: "apagada" }] });
    expect(proximaFichaPorSequencia(e).divisao).toBe("A");
  });
  it("sem ficha ativa devolve null", () => {
    expect(proximaFichaPorSequencia(base({ fichas: [] }))).toBeNull();
  });
});

describe("modo semanal", () => {
  it("acha a ficha marcada para o dia", () => {
    /* 2026-08-03 é uma segunda-feira. */
    const e = base({ configuracoes: { ...configuracoesPadrao(), modoAgenda: "semanal", agendaSemanal: { 1: "f2" } } });
    expect(fichaDoDiaSemanal(e, "2026-08-03").divisao).toBe("B");
  });
  it("dia sem ficha marcada é dia livre", () => {
    const e = base({ configuracoes: { ...configuracoesPadrao(), modoAgenda: "semanal", agendaSemanal: { 1: "f2" } } });
    expect(fichaDoDiaSemanal(e, "2026-08-04")).toBeNull();
    expect(planoDoDia(e, "2026-08-04").motivo).toMatch(/livre/i);
  });
});

describe("escala 12x36", () => {
  const config = {
    ...configuracoesPadrao(),
    modoAgenda: "escala12x36",
    escala12x36: { dataReferencia: "2026-08-01", referenciaEhTrabalho: true, priorizarCombinadoNaFolga: true },
  };

  it("alterna a cada dois dias a partir da referência", () => {
    expect(ehDiaDeTrabalho("2026-08-01", config)).toBe(true);
    expect(ehDiaDeTrabalho("2026-08-02", config)).toBe(false);
    expect(ehDiaDeTrabalho("2026-08-03", config)).toBe(true);
    expect(ehDiaDeTrabalho("2026-08-04", config)).toBe(false);
  });

  it("funciona para trás da data de referência", () => {
    expect(ehDiaDeTrabalho("2026-07-31", config)).toBe(false);
    expect(ehDiaDeTrabalho("2026-07-30", config)).toBe(true);
  });

  it("respeita a referência invertida", () => {
    const folga = { ...config, escala12x36: { ...config.escala12x36, referenciaEhTrabalho: false } };
    expect(ehDiaDeTrabalho("2026-08-01", folga)).toBe(false);
    expect(ehDiaDeTrabalho("2026-08-02", folga)).toBe(true);
  });

  it("sem data de referência não inventa escala", () => {
    expect(ehDiaDeTrabalho("2026-08-01", configuracoesPadrao())).toBeNull();
  });

  it("lista as próximas folgas", () => {
    expect(proximasFolgas(config, "2026-08-01", 3)).toEqual(["2026-08-02", "2026-08-04", "2026-08-06"]);
  });

  it("em dia de trabalho ainda oferece a ficha, só sinaliza", () => {
    const e = base({ configuracoes: config });
    const r = planoDoDia(e, "2026-08-03");
    expect(r.ficha.divisao).toBe("A");
    expect(r.sugereAdiar).toBe(true);
    expect(r.diaDeTrabalho).toBe(true);
  });

  it("em folga sugere treinar", () => {
    const e = base({ configuracoes: config });
    expect(planoDoDia(e, "2026-08-02").motivo).toMatch(/folga/i);
  });
});

describe("reagendamento", () => {
  it("reagendar muda o planejado sem apagar a atividade", () => {
    const e = base({ agenda: [{ id: "r1", tipo: "musculacao", refId: "f3", dataPlanejada: "2026-08-05", status: "reagendada" }] });
    const r = planoDoDia(e, "2026-08-05");
    expect(r.ficha.divisao).toBe("C");
    expect(r.motivo).toMatch(/reagendado/i);
    /* fora da data reagendada, a sequência normal continua valendo */
    expect(planoDoDia(e, "2026-08-06").ficha.divisao).toBe("A");
  });
});

describe("plano de corrida", () => {
  const plano = {
    id: "p1", ativo: true, arquivado: false, dataInicio: "2026-08-03", semanaAtualManual: null,
    semanas: [
      { id: "w1", numero: 1, sessoes: [{ id: "a", status: "concluida" }, { id: "b", status: "planejada" }] },
      { id: "w2", numero: 2, sessoes: [{ id: "c", status: "planejada" }] },
    ],
  };

  it("acha o plano ativo", () => {
    expect(planoCorridaAtivo({ planosCorrida: [plano] }).id).toBe("p1");
  });
  it("deduz a semana pela data de início", () => {
    expect(semanaAtualDoPlano(plano, "2026-08-05").numero).toBe(1);
    expect(semanaAtualDoPlano(plano, "2026-08-11").numero).toBe(2);
  });
  it("a semana marcada à mão vence a data", () => {
    expect(semanaAtualDoPlano({ ...plano, semanaAtualManual: "w2" }, "2026-08-05").numero).toBe(2);
  });
  it("não passa da última semana", () => {
    expect(semanaAtualDoPlano(plano, "2027-01-01").numero).toBe(2);
  });
  it("calcula progresso", () => {
    const p = progressoDoPlano(plano);
    expect(p.total).toBe(3);
    expect(p.concluidas).toBe(1);
  });
});
