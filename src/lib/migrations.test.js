import { describe, it, expect } from "vitest";
import {
  migra, migraV1paraV2, ehEstadoV1, interpretaFaixaReps, converteLogsV1,
  converteFichasV1, converteRascunhoV1, interpretaDuracaoTextual, nomeDiaParaNumero,
} from "./migrations.js";
import { NIVEL1, NIVEL2 } from "../data/legadoV1.js";

const v1Completo = () => ({
  nivel: 1,
  nivelCorrida: 2,
  fichas: { 1: NIVEL1, 2: NIVEL2 },
  logs: [
    { data: "2026-08-01", dia: "A", exId: "a1", exNome: "Supino reto com halteres", series: [{ kg: "20", reps: "12" }, { kg: "20", reps: "12" }] },
    { data: "2026-08-01", dia: "A", exId: "a2", exNome: "Supino inclinado na máquina", series: [{ kg: "40", reps: "10" }] },
    { data: "2026-08-03", dia: "B", exId: "b1", exNome: "Agachamento livre ou no Smith", series: [{ kg: "60", reps: "8" }] },
  ],
  corridas: { s1t1: { feito: true, data: "2026-08-02", km: "5,2", tempo: "31" } },
  pesos: [{ data: "2026-08-01", valor: 80 }, { data: "2026-08-08", valor: 79.4 }],
  rascunho: {},
});

describe("detecção de versão", () => {
  it("reconhece um estado v1", () => {
    expect(ehEstadoV1(v1Completo())).toBe(true);
  });
  it("não confunde um estado v2 com v1", () => {
    expect(ehEstadoV1({ versao: 2, fichas: [] })).toBe(false);
  });
});

describe("estado vazio e parcial", () => {
  it("aceita null e devolve um v2 utilizável", () => {
    const { estado } = migra(null);
    expect(estado.versao).toBe(2);
    expect(estado.fichas).toEqual([]);
    expect(estado.sessoesMusculacao).toEqual([]);
  });

  it("migra um v1 sem fichas usando as fichas padrão e avisa", () => {
    const { estado, avisos } = migraV1paraV2({ logs: [], nivel: 1 });
    expect(estado.fichas.length).toBeGreaterThan(0);
    expect(avisos.join(" ")).toMatch(/incompletas/i);
  });

  it("sobrevive a um v1 com campos de tipo errado", () => {
    const { estado } = migraV1paraV2({ logs: "nada", pesos: null, corridas: 42, rascunho: 7, nivel: "2" });
    expect(estado.sessoesMusculacao).toEqual([]);
    expect(estado.pesagens).toEqual([]);
    expect(estado.corridas).toEqual([]);
  });
});

describe("migração completa v1 -> v2", () => {
  it("preserva fichas dos dois níveis, arquivando o inativo", () => {
    const { estado } = migraV1paraV2(v1Completo());
    const ativas = estado.fichas.filter((f) => !f.arquivada);
    const arquivadas = estado.fichas.filter((f) => f.arquivada);
    expect(ativas).toHaveLength(5);
    expect(arquivadas).toHaveLength(5);
    expect(ativas.map((f) => f.divisao)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("agrupa os logs por data e divisão em sessões", () => {
    const { estado } = migraV1paraV2(v1Completo());
    expect(estado.sessoesMusculacao).toHaveLength(2);
    const primeira = estado.sessoesMusculacao.find((s) => s.data === "2026-08-01");
    expect(primeira.exercicios).toHaveLength(2);
    expect(primeira.divisaoSnapshot).toBe("A");
  });

  it("converte números escritos como string, inclusive com vírgula", () => {
    const { estado } = migraV1paraV2(v1Completo());
    const serie = estado.sessoesMusculacao[0].exercicios[0].series[0];
    expect(serie.cargaKg).toBe(20);
    expect(serie.repeticoes).toBe(12);
    expect(estado.corridas[0].distanciaKm).toBeCloseTo(5.2);
  });

  it("mantém o id antigo do exercício para o histórico não se desligar", () => {
    const { estado } = migraV1paraV2(v1Completo());
    expect(estado.exercicios.some((e) => e.id === "a1")).toBe(true);
    expect(estado.sessoesMusculacao[0].exercicios[0].exercicioId).toBe("a1");
  });

  it("migra pesagens e ignora as inválidas com aviso", () => {
    const v1 = v1Completo();
    v1.pesos.push({ data: "data-ruim", valor: 70 }, { data: "2026-08-09", valor: null });
    const { estado, avisos } = migraV1paraV2(v1);
    expect(estado.pesagens).toHaveLength(2);
    expect(avisos.join(" ")).toMatch(/pesagem/i);
  });

  it("marca como concluída a sessão de corrida que estava feita", () => {
    const { estado } = migraV1paraV2(v1Completo());
    const plano = estado.planosCorrida.find((p) => p.semanas.some((s) => s.sessoes.some((x) => x.id === "s1t1")));
    const sessao = plano.semanas.flatMap((s) => s.sessoes).find((x) => x.id === "s1t1");
    expect(sessao.status).toBe("concluida");
    expect(estado.corridas[0].duracaoSegundos).toBe(31 * 60);
  });

  it("ativa o plano de corrida que estava selecionado", () => {
    const { estado } = migraV1paraV2(v1Completo());
    const ativo = estado.planosCorrida.find((p) => p.ativo);
    expect(ativo.nome).toMatch(/10 km/i);
  });

  it("registra data de migração nos metadados", () => {
    const { estado } = migraV1paraV2(v1Completo());
    expect(estado.metadados.migradoDeV1Em).toBeTruthy();
  });
});

describe("idempotência", () => {
  it("rodar duas vezes não duplica sessões, corridas nem pesagens", () => {
    const primeira = migra(v1Completo()).estado;
    const segunda = migra(primeira).estado;
    expect(segunda.sessoesMusculacao).toHaveLength(primeira.sessoesMusculacao.length);
    expect(segunda.corridas).toHaveLength(primeira.corridas.length);
    expect(segunda.pesagens).toHaveLength(primeira.pesagens.length);
    expect(segunda.fichas).toHaveLength(primeira.fichas.length);
  });

  it("gera ids determinísticos para o mesmo v1", () => {
    const a = migraV1paraV2(v1Completo()).estado;
    const b = migraV1paraV2(v1Completo()).estado;
    expect(a.sessoesMusculacao.map((s) => s.id)).toEqual(b.sessoesMusculacao.map((s) => s.id));
  });
});

describe("registros incompletos", () => {
  it("mantém o log com data inválida, mas avisa em vez de silenciar", () => {
    const { sessoes, avisos } = converteLogsV1(
      [{ data: "31/08/2026", dia: "A", exId: "a1", exNome: "X", series: [{ kg: "10", reps: "10" }] }],
      [],
    );
    expect(sessoes).toHaveLength(1);
    expect(sessoes[0].data).toBeNull();
    expect(avisos).toHaveLength(1);
  });

  it("aceita série sem carga sem produzir NaN", () => {
    const { sessoes } = converteLogsV1(
      [{ data: "2026-08-01", dia: "A", exId: "a1", exNome: "X", series: [{ kg: "", reps: "" }] }],
      [],
    );
    const serie = sessoes[0].exercicios[0].series[0];
    expect(serie.cargaKg).toBeNull();
    expect(serie.repeticoes).toBeNull();
  });
});

describe("faixa de repetições da v1", () => {
  it.each([
    ["10-12", 10, 12, "peso_reps"],
    ["15", 15, 15, "peso_reps"],
    ["30-45s", 30, 45, "tempo"],
    ["8-10 (cada perna)", 8, 10, "peso_reps"],
  ])("interpreta %s", (texto, min, max, tipo) => {
    const r = interpretaFaixaReps(texto);
    expect(r.repsMin).toBe(min);
    expect(r.repsMax).toBe(max);
    expect(r.tipoRegistro).toBe(tipo);
  });

  it("guarda o parêntese como observação em vez de descartar", () => {
    expect(interpretaFaixaReps("10 (cada perna)").observacao).toBe("cada perna");
  });
});

describe("rascunho em andamento", () => {
  it("retoma o rascunho como sessão em andamento", () => {
    const { fichas } = converteFichasV1({ 1: NIVEL1 }, 1);
    const { sessao } = converteRascunhoV1({ A: { a1: { 0: { kg: "22,5", reps: "10" } } } }, fichas);
    expect(sessao.status).toBe("andamento");
    expect(sessao.exercicios[0].series[0].cargaKg).toBe(22.5);
    expect(sessao.exercicios[0].series[0].concluida).toBe(true);
  });

  it("avisa quando havia rascunho em mais de uma divisão", () => {
    const { fichas } = converteFichasV1({ 1: NIVEL1 }, 1);
    const { avisos } = converteRascunhoV1(
      { A: { a1: { 0: { kg: "20" } } }, B: { b1: { 0: { kg: "60" } } } },
      fichas,
    );
    expect(avisos.join(" ")).toMatch(/mais de uma divis/i);
  });

  it("ignora rascunho totalmente vazio", () => {
    const { fichas } = converteFichasV1({ 1: NIVEL1 }, 1);
    expect(converteRascunhoV1({ A: { a1: { 0: {} } } }, fichas).sessao).toBeNull();
  });
});

describe("auxiliares do plano de corrida", () => {
  it("lê a duração textual dos planos antigos", () => {
    expect(interpretaDuracaoTextual("40 min")).toBe(2400);
    expect(interpretaDuracaoTextual("~35 min")).toBe(2100);
    expect(interpretaDuracaoTextual("—")).toBeNull();
  });
  it("converte nome de dia em número", () => {
    expect(nomeDiaParaNumero("Segunda")).toBe(1);
    expect(nomeDiaParaNumero("Sábado")).toBe(6);
    expect(nomeDiaParaNumero("qualquer")).toBeNull();
  });
});

describe("nomes de dia — casos que já quebraram", () => {
  it("não confunde palavra qualquer com dia da semana", () => {
    expect(nomeDiaParaNumero("qualquer")).toBeNull();
    expect(nomeDiaParaNumero("quinta-feira")).toBe(4);
    expect(nomeDiaParaNumero("sab")).toBe(6);
    expect(nomeDiaParaNumero("")).toBeNull();
  });
});
