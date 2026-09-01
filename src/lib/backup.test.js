import { describe, it, expect } from "vitest";
import {
  interpretaBackup, montaBackup, resumoDoEstado, csvSessoes, csvCorridas, csvPesagens,
  nomeDoArquivo, precisaLembrarBackup,
} from "./backup.js";
import { estadoSemeado } from "../state/persistencia.js";
import { NIVEL1 } from "../data/legadoV1.js";

describe("nome do arquivo", () => {
  it("usa a data no nome", () => {
    expect(nomeDoArquivo("2026-09-01")).toBe("treino-backup-2026-09-01.json");
  });
});

describe("ida e volta", () => {
  it("exporta e reimporta sem perder nada", () => {
    const original = estadoSemeado();
    const texto = JSON.stringify(montaBackup(original));
    const r = interpretaBackup(texto);
    expect(r.ok).toBe(true);
    expect(r.resumo).toEqual(resumoDoEstado(original));
  });

  it("aceita um estado v2 solto, sem envelope", () => {
    const r = interpretaBackup(JSON.stringify(estadoSemeado()));
    expect(r.ok).toBe(true);
    expect(r.origem).toBe("v2");
  });

  it("aceita e migra um backup da versão 1", () => {
    const v1 = { nivel: 1, fichas: { 1: NIVEL1 }, logs: [], corridas: {}, pesos: [], rascunho: {} };
    const r = interpretaBackup(JSON.stringify(v1));
    expect(r.ok).toBe(true);
    expect(r.origem).toBe("v1");
    expect(r.estado.versao).toBe(2);
  });
});

describe("validação de entrada", () => {
  it.each([
    ["", "vazio"],
    ["não é json", "JSON"],
    ["[1,2,3]", "formato"],
    ['{"qualquer":"coisa"}', "versão"],
  ])("recusa %s com mensagem útil", (texto, trecho) => {
    const r = interpretaBackup(texto);
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(new RegExp(trecho, "i"));
  });

  it("nunca lança, mesmo com entrada estranha", () => {
    expect(() => interpretaBackup(null)).not.toThrow();
    expect(() => interpretaBackup(undefined)).not.toThrow();
    expect(interpretaBackup(null).ok).toBe(false);
  });

  it("não executa nada do conteúdo importado", () => {
    /* Um backup malicioso é só texto: `JSON.parse` não roda função nenhuma. */
    const r = interpretaBackup('{"versao":2,"fichas":[],"nome":"<script>alert(1)</script>"}');
    expect(r.ok).toBe(true);
    expect(typeof r.estado.fichas).toBe("object");
  });
});

describe("CSV", () => {
  const estado = {
    sessoesMusculacao: [
      {
        id: "1", status: "concluida", data: "2026-08-01", divisaoSnapshot: "A", fichaNomeSnapshot: "Peito",
        duracaoSegundos: 3600, observacao: 'disse "pesado"',
        exercicios: [{ nomeSnapshot: "Supino", grupoPrincipalSnapshot: "Peito",
          series: [{ numero: 1, tipo: "trabalho", cargaKg: 60, repeticoes: 10, rir: 2, rpe: null, concluida: true }] }],
      },
    ],
    corridas: [{ id: "c", data: "2026-08-02", distanciaKm: 5, duracaoSegundos: 1800, rpe: 6, terreno: "rua", observacao: "" }],
    pesagens: [{ id: "p", data: "2026-08-01", pesoKg: 80 }],
  };

  it("gera cabeçalho em português e uma linha por série", () => {
    const csv = csvSessoes(estado);
    const linhas = csv.split("\n");
    expect(linhas[0]).toMatch(/^Data;Divisão;Ficha;Exercício/);
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toContain("Supino");
  });

  it("escapa aspas em vez de quebrar as colunas", () => {
    expect(csvSessoes(estado)).toContain('"disse ""pesado"""');
  });

  it("calcula o ritmo na exportação de corridas", () => {
    expect(csvCorridas(estado)).toContain("6:00/km");
  });

  it("exporta pesagens", () => {
    expect(csvPesagens(estado)).toContain("01/08/2026;80");
  });
});

describe("lembrete de backup", () => {
  const comDados = (config = {}) => ({
    sessoesMusculacao: [{ id: "1" }, { id: "2" }],
    corridas: [{ id: "c" }],
    pesagens: [],
    configuracoes: config,
  });

  it("não cobra quem ainda não tem nada a perder", () => {
    expect(precisaLembrarBackup({ sessoesMusculacao: [], corridas: [], pesagens: [], configuracoes: {} }, "2026-09-01")).toBeNull();
  });

  it("cobra quem nunca exportou, contando os registros em risco", () => {
    const r = precisaLembrarBackup(comDados(), "2026-09-01");
    expect(r.motivo).toBe("nunca");
    expect(r.registros).toBe(3);
  });

  it("fica quieto logo depois de um backup", () => {
    expect(precisaLembrarBackup(comDados({ ultimaDataBackup: "2026-08-31" }), "2026-09-01")).toBeNull();
  });

  it("volta a cobrar quando o backup envelhece", () => {
    const r = precisaLembrarBackup(comDados({ ultimaDataBackup: "2026-08-12" }), "2026-09-01");
    expect(r.motivo).toBe("antigo");
    expect(r.dias).toBe(20);
  });

  it("respeita o limite que receber", () => {
    expect(precisaLembrarBackup(comDados({ ultimaDataBackup: "2026-08-29" }), "2026-09-01", 3).motivo).toBe("antigo");
    expect(precisaLembrarBackup(comDados({ ultimaDataBackup: "2026-08-29" }), "2026-09-01", 30)).toBeNull();
  });

  it("não quebra com data de backup inválida", () => {
    expect(() => precisaLembrarBackup(comDados({ ultimaDataBackup: "ontem" }), "2026-09-01")).not.toThrow();
    expect(precisaLembrarBackup(comDados({ ultimaDataBackup: "ontem" }), "2026-09-01")).toBeNull();
  });
});
