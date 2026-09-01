import { describe, it, expect } from "vitest";
import { carregaEstado, salvaEstado, estadoSemeado } from "./persistencia.js";
import { criaRepositorio, criaBackendMemoria, CHAVE_V1, CHAVE_V2, CHAVE_BACKUP_V1 } from "../lib/storage.js";
import { NIVEL1, NIVEL2 } from "../data/legadoV1.js";

const repoCom = (dados) => criaRepositorio(criaBackendMemoria(dados));

const v1 = {
  nivel: 1,
  nivelCorrida: 1,
  fichas: { 1: NIVEL1, 2: NIVEL2 },
  logs: [{ data: "2026-08-01", dia: "A", exId: "a1", exNome: "Supino", series: [{ kg: "20", reps: "10" }] }],
  corridas: {},
  pesos: [{ data: "2026-08-01", valor: 80 }],
  rascunho: {},
};

describe("primeira abertura", () => {
  it("semeia fichas e planos em vez de abrir vazio", () => {
    const { estado, origem } = carregaEstado(repoCom({}));
    expect(origem).toBe("novo");
    expect(estado.fichas.length).toBeGreaterThan(0);
    expect(estado.planosCorrida.length).toBe(2);
    expect(estado.sessoesMusculacao).toEqual([]);
  });
});

describe("migração no carregamento", () => {
  it("migra a v1 e guarda uma cópia de segurança", () => {
    const repo = repoCom({ [CHAVE_V1]: JSON.stringify(v1) });
    const { estado, origem } = carregaEstado(repo);
    expect(origem).toBe("v1");
    expect(estado.sessoesMusculacao).toHaveLength(1);
    expect(repo.lerJson(CHAVE_BACKUP_V1)).toBeTruthy();
  });

  it("não apaga a chave da v1", () => {
    const repo = repoCom({ [CHAVE_V1]: JSON.stringify(v1) });
    carregaEstado(repo);
    expect(repo.lerBruto(CHAVE_V1)).toBeTruthy();
  });

  it("na segunda abertura lê o v2 e não migra de novo", () => {
    const repo = repoCom({ [CHAVE_V1]: JSON.stringify(v1) });
    const primeira = carregaEstado(repo);
    const segunda = carregaEstado(repo);
    expect(segunda.origem).toBe("v2");
    expect(segunda.estado.sessoesMusculacao).toHaveLength(primeira.estado.sessoesMusculacao.length);
    expect(segunda.estado.pesagens).toHaveLength(1);
  });
});

describe("conteúdo corrompido", () => {
  it("não sobrescreve o v2 ilegível: guarda o cru e recupera pela v1", () => {
    const repo = repoCom({ [CHAVE_V2]: "{isto não é json", [CHAVE_V1]: JSON.stringify(v1) });
    const { origem, estado } = carregaEstado(repo);
    expect(origem).toBe("recuperado");
    expect(estado.sessoesMusculacao).toHaveLength(1);
    /* o v2 ilegível foi preservado sob outra chave, não descartado */
    expect(repo.lerBruto(CHAVE_V2)).toBeTruthy();
  });
});

describe("falha ao salvar", () => {
  it("devolve mensagem em vez de estourar quando falta espaço", () => {
    const backend = criaBackendMemoria({});
    backend.escrever = () => {
      const erro = new Error("cheio");
      erro.name = "QuotaExceededError";
      throw erro;
    };
    const msg = salvaEstado(estadoSemeado(), criaRepositorio(backend));
    expect(msg).toMatch(/espaço/i);
  });

  it("salva normalmente quando há espaço", () => {
    const repo = repoCom({});
    expect(salvaEstado(estadoSemeado(), repo)).toBeNull();
    expect(repo.lerJson(CHAVE_V2).versao).toBe(2);
  });
});
