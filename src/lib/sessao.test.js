import { describe, it, expect } from "vitest";
import { agrupaSuperseries, letraDoMembro, voltasDoBloco, descansoDoBloco } from "./sessao.js";

const ex = (nome, supersetIdSnapshot = null, series = 3, descansoSegundosSnapshot = 90) => ({
  nomeSnapshot: nome,
  supersetIdSnapshot,
  descansoSegundosSnapshot,
  series: Array.from({ length: series }).map((_, i) => ({ numero: i + 1 })),
});

describe("agrupamento de superséries", () => {
  it("sem código, cada exercício é um bloco só dele", () => {
    const b = agrupaSuperseries([ex("Supino"), ex("Remada")]);
    expect(b).toHaveLength(2);
    expect(b.every((x) => !x.ehSuperserie)).toBe(true);
  });

  it("vizinhos com o mesmo código viram um bloco", () => {
    const b = agrupaSuperseries([ex("Supino", "A"), ex("Remada", "A"), ex("Rosca")]);
    expect(b).toHaveLength(2);
    expect(b[0].ehSuperserie).toBe(true);
    expect(b[0].itens.map((i) => i.ex.nomeSnapshot)).toEqual(["Supino", "Remada"]);
    expect(b[1].ehSuperserie).toBe(false);
  });

  it("um código sozinho não é supersérie", () => {
    const b = agrupaSuperseries([ex("Supino", "A"), ex("Remada", "B")]);
    expect(b.every((x) => !x.ehSuperserie)).toBe(true);
  });

  it("mesmo código longe não junta, para não reordenar o treino sozinho", () => {
    const b = agrupaSuperseries([ex("Supino", "A"), ex("Rosca"), ex("Remada", "A")]);
    expect(b).toHaveLength(3);
    expect(b.every((x) => !x.ehSuperserie)).toBe(true);
  });

  it("três membros seguidos formam um bloco só", () => {
    const b = agrupaSuperseries([ex("A1", "X"), ex("A2", "X"), ex("A3", "X")]);
    expect(b).toHaveLength(1);
    expect(b[0].itens).toHaveLength(3);
  });

  it("guarda o índice original de cada exercício, para o despacho continuar certo", () => {
    const b = agrupaSuperseries([ex("Supino"), ex("Remada", "A"), ex("Rosca", "A")]);
    expect(b[1].itens.map((i) => i.indice)).toEqual([1, 2]);
  });

  it("ignora espaço em volta do código", () => {
    const b = agrupaSuperseries([ex("Supino", " A "), ex("Remada", "A")]);
    expect(b[0].ehSuperserie).toBe(true);
  });

  it("aceita lista vazia ou ausente", () => {
    expect(agrupaSuperseries([])).toEqual([]);
    expect(agrupaSuperseries(undefined)).toEqual([]);
  });
});

describe("detalhes do bloco", () => {
  it("nomeia os membros por letra", () => {
    expect(letraDoMembro(0)).toBe("A");
    expect(letraDoMembro(2)).toBe("C");
  });

  it("voltas é a maior contagem de séries do bloco", () => {
    const [b] = agrupaSuperseries([ex("Supino", "A", 3), ex("Remada", "A", 4)]);
    expect(voltasDoBloco(b)).toBe(4);
  });

  it("descanso é o maior do bloco, porque a volta acaba no mais pesado", () => {
    const [b] = agrupaSuperseries([ex("Supino", "A", 3, 60), ex("Remada", "A", 3, 120)]);
    expect(descansoDoBloco(b, 90)).toBe(120);
  });

  it("sem descanso definido, cai no padrão das configurações", () => {
    const [b] = agrupaSuperseries([ex("Supino", "A", 3, 0), ex("Remada", "A", 3, 0)]);
    expect(descansoDoBloco(b, 75)).toBe(75);
  });
});
