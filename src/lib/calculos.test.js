import { describe, it, expect } from "vitest";
import {
  volumeSerie, volumeSessao, ehSerieDeTrabalho, estimativa1RM, ritmoSegundosPorKm,
  formataRitmo, interpretaDuracao, formataDuracao, sugereProgressao, consistenciaPorSemana,
  pesoAtual, variacaoPeso, recordesPorExercicio, intervaloDoPeriodo, dentroDoPeriodo,
  volumePorGrupo, resumoCorridas, saltoDeVolumeCorrida, ultimaExecucao,
} from "./calculos.js";
import { paraNumero, paraNumeroPositivo } from "./numbers.js";

const serie = (o) => ({ id: "s", numero: 1, tipo: "trabalho", concluida: true, cargaKg: null, repeticoes: null, ...o });
const sessao = (o) => ({ id: "x", status: "concluida", data: "2026-08-01", exercicios: [], ...o });

describe("decimal com vírgula", () => {
  it("lê o que o teclado brasileiro entrega", () => {
    expect(paraNumero("22,5")).toBe(22.5);
    expect(paraNumero("22.5")).toBe(22.5);
    expect(paraNumero(" 100 ")).toBe(100);
  });
  it("não devolve NaN para lixo", () => {
    expect(paraNumero("abc")).toBeNull();
    expect(paraNumero("")).toBeNull();
    expect(paraNumero(",")).toBeNull();
    expect(paraNumero(undefined)).toBeNull();
    expect(paraNumero(Infinity)).toBeNull();
  });
  it("recusa negativo onde não faz sentido", () => {
    expect(paraNumeroPositivo("-5")).toBeNull();
    expect(paraNumeroPositivo("0")).toBe(0);
  });
});

describe("volume", () => {
  it("multiplica carga por repetições", () => {
    expect(volumeSerie(serie({ cargaKg: 60, repeticoes: 10 }))).toBe(600);
  });
  it("ignora série não concluída", () => {
    expect(volumeSerie(serie({ cargaKg: 60, repeticoes: 10, concluida: false }))).toBe(0);
  });
  it("ignora série sem dado, sem virar NaN", () => {
    expect(volumeSerie(serie({ cargaKg: null, repeticoes: 10 }))).toBe(0);
  });
  it("aquecimento não conta como série de trabalho", () => {
    expect(ehSerieDeTrabalho(serie({ tipo: "aquecimento" }))).toBe(false);
    expect(ehSerieDeTrabalho(serie({ tipo: "trabalho" }))).toBe(true);
  });
  it("soma só o trabalho na sessão", () => {
    const s = sessao({
      exercicios: [{ exercicioId: "a", series: [
        serie({ cargaKg: 20, repeticoes: 10, tipo: "aquecimento" }),
        serie({ cargaKg: 60, repeticoes: 10 }),
        serie({ cargaKg: 60, repeticoes: 8 }),
      ] }],
    });
    expect(volumeSessao(s)).toBe(600 + 480);
  });
});

describe("1RM estimado", () => {
  it("aplica Epley", () => {
    expect(estimativa1RM(100, 5)).toBeCloseTo(116.67, 1);
  });
  it("com 1 repetição devolve a própria carga", () => {
    expect(estimativa1RM(120, 1)).toBe(120);
  });
  it("sem dado devolve null", () => {
    expect(estimativa1RM(null, 5)).toBeNull();
    expect(estimativa1RM(100, 0)).toBeNull();
  });
});

describe("ritmo e duração", () => {
  it("calcula ritmo em min/km", () => {
    expect(formataRitmo(ritmoSegundosPorKm(10, 3000))).toBe("5:00/km");
    expect(formataRitmo(ritmoSegundosPorKm(5.2, 1860))).toBe("5:58/km");
  });
  it("não divide por zero", () => {
    expect(ritmoSegundosPorKm(0, 1800)).toBeNull();
    expect(ritmoSegundosPorKm(5, null)).toBeNull();
  });
  it("aceita hh:mm:ss, mm:ss e minutos soltos", () => {
    expect(interpretaDuracao("1:02:15")).toBe(3735);
    expect(interpretaDuracao("48:30")).toBe(2910);
    expect(interpretaDuracao("45")).toBe(2700);
    expect(interpretaDuracao("45min")).toBe(2700);
    expect(interpretaDuracao("32,5")).toBe(1950);
  });
  it("recusa entrada inválida", () => {
    expect(interpretaDuracao("abc")).toBeNull();
    expect(interpretaDuracao("")).toBeNull();
    expect(interpretaDuracao("1:2:3:4")).toBeNull();
  });
  it("formata de volta", () => {
    expect(formataDuracao(3735)).toBe("1:02:15");
    expect(formataDuracao(2910)).toBe("48:30");
  });
});

describe("progressão de carga", () => {
  const fe = { repsMin: 8, repsMax: 10, incrementoKg: 2.5 };

  it("sugere subir quando bateu o topo em todas as séries de trabalho", () => {
    const r = sugereProgressao(fe, { series: [
      serie({ cargaKg: 60, repeticoes: 10 }),
      serie({ cargaKg: 60, repeticoes: 10 }),
    ] });
    expect(r.tipo).toBe("subir");
    expect(r.cargaSugerida).toBe(62.5);
    expect(r.motivo).toMatch(/10 ou mais/);
  });

  it("sugere manter quando faltou repetição", () => {
    const r = sugereProgressao(fe, { series: [
      serie({ cargaKg: 60, repeticoes: 10 }),
      serie({ cargaKg: 60, repeticoes: 8 }),
    ] });
    expect(r.tipo).toBe("manter");
    expect(r.cargaSugerida).toBe(60);
  });

  it("ignora aquecimento na decisão", () => {
    const r = sugereProgressao(fe, { series: [
      serie({ cargaKg: 20, repeticoes: 5, tipo: "aquecimento" }),
      serie({ cargaKg: 60, repeticoes: 10 }),
    ] });
    expect(r.tipo).toBe("subir");
  });

  it("não sugere nada sem histórico", () => {
    expect(sugereProgressao(fe, null).tipo).toBe("sem_dados");
  });

  it("não sugere quando faltam repetições registradas", () => {
    const r = sugereProgressao(fe, { series: [serie({ cargaKg: 60, repeticoes: null })] });
    expect(r.tipo).toBe("sem_dados");
  });

  it("com incremento zero explica por que não sobe", () => {
    const r = sugereProgressao({ ...fe, incrementoKg: 0 }, { series: [serie({ cargaKg: 60, repeticoes: 10 })] });
    expect(r.tipo).toBe("manter");
    expect(r.motivo).toMatch(/incremento/i);
  });
});

describe("períodos e fuso local", () => {
  it("monta intervalo fechado", () => {
    const i = intervaloDoPeriodo("4s");
    expect(i.de).toBeTruthy();
    expect(i.ate).toBeTruthy();
    expect(i.de < i.ate).toBe(true);
  });
  it("todo o período não tem início", () => {
    expect(intervaloDoPeriodo("tudo").de).toBeNull();
  });
  it("filtra por data local sem estourar a borda", () => {
    const i = { de: "2026-08-01", ate: "2026-08-31" };
    expect(dentroDoPeriodo("2026-08-01", i)).toBe(true);
    expect(dentroDoPeriodo("2026-08-31", i)).toBe(true);
    expect(dentroDoPeriodo("2026-07-31", i)).toBe(false);
    expect(dentroDoPeriodo("2026-09-01", i)).toBe(false);
    expect(dentroDoPeriodo(null, i)).toBe(false);
  });
});

describe("consistência", () => {
  it("conta sessões, não exercícios", () => {
    const sessoes = [
      sessao({ id: "1", data: "2026-08-03", exercicios: [{ series: [] }, { series: [] }] }),
      sessao({ id: "2", data: "2026-08-05" }),
      sessao({ id: "3", data: "2026-08-12" }),
    ];
    const r = consistenciaPorSemana(sessoes, { de: null, ate: "2026-12-31" });
    expect(r).toHaveLength(2);
    expect(r[0].total).toBe(2);
    expect(r[1].total).toBe(1);
  });
  it("não conta rascunho nem sessão excluída", () => {
    const sessoes = [sessao({ id: "1", data: "2026-08-03", status: "andamento" })];
    expect(consistenciaPorSemana(sessoes, { de: null, ate: "2026-12-31" })).toHaveLength(0);
  });
});

describe("peso corporal", () => {
  const pesagens = [
    { id: "1", data: "2026-08-01", pesoKg: 80 },
    { id: "2", data: "2026-08-15", pesoKg: 79 },
    { id: "3", data: "2026-08-08", pesoKg: 79.5 },
  ];
  it("peso atual é a pesagem válida mais recente", () => {
    expect(pesoAtual(pesagens).pesoKg).toBe(79);
  });
  it("variação usa primeiro e último do período", () => {
    const v = variacaoPeso(pesagens, { de: "2026-08-01", ate: "2026-08-31" });
    expect(v.absoluta).toBe(-1);
    expect(v.percentual).toBeCloseTo(-1.25);
  });
  it("sem dado suficiente devolve null", () => {
    expect(variacaoPeso([pesagens[0]], { de: null, ate: "2026-12-31" })).toBeNull();
    expect(pesoAtual([])).toBeNull();
  });
});

describe("recordes e grupos", () => {
  const sessoes = [
    sessao({ id: "1", data: "2026-08-01", exercicios: [
      { exercicioId: "a1", nomeSnapshot: "Supino", grupoPrincipalSnapshot: "Peito",
        series: [serie({ cargaKg: 60, repeticoes: 10 }), serie({ cargaKg: 20, repeticoes: 15, tipo: "aquecimento" })] },
    ] }),
    sessao({ id: "2", data: "2026-08-08", exercicios: [
      { exercicioId: "a1", nomeSnapshot: "Supino", grupoPrincipalSnapshot: "Peito",
        series: [serie({ cargaKg: 65, repeticoes: 8 })] },
    ] }),
  ];
  it("acha a maior carga e a data dela", () => {
    const r = recordesPorExercicio(sessoes);
    expect(r[0].maiorCarga).toBe(65);
    expect(r[0].dataMaiorCarga).toBe("2026-08-08");
  });
  it("não conta aquecimento no volume por grupo", () => {
    const g = volumePorGrupo(sessoes, { de: null, ate: "2026-12-31" });
    expect(g[0].grupo).toBe("Peito");
    expect(g[0].series).toBe(2);
  });
  it("acha a última execução de um exercício", () => {
    const u = ultimaExecucao(sessoes, "a1");
    expect(u.sessao.data).toBe("2026-08-08");
    expect(u.exercicio.series[0].cargaKg).toBe(65);
  });
});

describe("resumo de corrida", () => {
  const corridas = [
    { id: "1", data: "2026-08-01", distanciaKm: 5, duracaoSegundos: 1800 },
    { id: "2", data: "2026-08-08", distanciaKm: 10, duracaoSegundos: 3300 },
  ];
  it("soma distância e acha a mais longa", () => {
    const r = resumoCorridas(corridas, { de: null, ate: "2026-12-31" });
    expect(r.distancia).toBe(15);
    expect(r.maisLonga.distanciaKm).toBe(10);
  });
  it("melhor ritmo é o menor tempo por km", () => {
    const r = resumoCorridas(corridas, { de: null, ate: "2026-12-31" });
    expect(r.melhorRitmo.corrida.id).toBe("2");
  });
  it("avisa salto grande de volume, sem bloquear", () => {
    const salto = saltoDeVolumeCorrida([{ distancia: 10 }, { distancia: 20 }]);
    expect(salto.aumento).toBe(100);
    expect(saltoDeVolumeCorrida([{ distancia: 10 }, { distancia: 11 }])).toBeNull();
  });
});
