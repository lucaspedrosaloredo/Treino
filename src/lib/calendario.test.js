import { describe, it, expect } from "vitest";
import { matrizDoMes, iniciaisDosDias, indexaAtividades, mesVizinho, descreveDia } from "./calendario.js";

describe("matriz do mês", () => {
  it("começa na segunda quando a semana começa na segunda", () => {
    /* setembro de 2026 começa numa terça */
    const m = matrizDoMes(2026, 8, 1);
    expect(m[0][0].chave).toBe("2026-08-31");
    expect(m[0][1].chave).toBe("2026-09-01");
    expect(m[0][0].doMes).toBe(false);
    expect(m[0][1].doMes).toBe(true);
  });

  it("respeita semana começando no domingo", () => {
    const m = matrizDoMes(2026, 8, 0);
    expect(m[0][0].chave).toBe("2026-08-30");
    expect(m[0][2].chave).toBe("2026-09-01");
  });

  it("toda semana tem sete dias e nenhum buraco", () => {
    const m = matrizDoMes(2026, 8, 1);
    expect(m.every((s) => s.length === 7)).toBe(true);
    expect(m.flat().every((c) => typeof c.chave === "string")).toBe(true);
  });

  it("cobre o mês inteiro", () => {
    const m = matrizDoMes(2026, 8, 1).flat().filter((c) => c.doMes);
    expect(m).toHaveLength(30);
    expect(m[0].chave).toBe("2026-09-01");
    expect(m[29].chave).toBe("2026-09-30");
  });

  it("dá conta de fevereiro bissexto", () => {
    const m = matrizDoMes(2028, 1, 1).flat().filter((c) => c.doMes);
    expect(m).toHaveLength(29);
  });

  it("não perde um dia por causa do fuso", () => {
    const m = matrizDoMes(2026, 2, 1).flat().filter((c) => c.doMes);
    expect(m[0].chave).toBe("2026-03-01");
    expect(m[0].diaDoMes).toBe(1);
  });
});

describe("cabeçalho", () => {
  it("começa no dia escolhido", () => {
    expect(iniciaisDosDias(1)).toEqual(["S", "T", "Q", "Q", "S", "S", "D"]);
    expect(iniciaisDosDias(0)).toEqual(["D", "S", "T", "Q", "Q", "S", "S"]);
  });
});

describe("índice de atividades", () => {
  const estado = {
    sessoesMusculacao: [
      { id: "1", status: "concluida", data: "2026-09-01" },
      { id: "2", status: "concluida", data: "2026-09-01" },
      { id: "3", status: "andamento", data: "2026-09-02" },
      { id: "4", status: "concluida", data: null },
    ],
    corridas: [{ id: "c1", data: "2026-09-01" }, { id: "c2", data: null }],
  };

  it("agrupa treinos e corridas por dia", () => {
    const m = indexaAtividades(estado);
    expect(m.get("2026-09-01").treinos).toHaveLength(2);
    expect(m.get("2026-09-01").corridas).toHaveLength(1);
  });

  it("ignora sessão em andamento e registro sem data", () => {
    const m = indexaAtividades(estado);
    expect(m.has("2026-09-02")).toBe(false);
    expect([...m.keys()]).toEqual(["2026-09-01"]);
  });

  it("descreve o dia em texto, para quem usa leitor de tela", () => {
    const m = indexaAtividades(estado);
    expect(descreveDia("2026-09-01", m.get("2026-09-01"))).toBe("2 treino(s) e 1 corrida(s)");
    expect(descreveDia("2026-09-05", undefined)).toBe("sem atividade");
  });
});

describe("navegação entre meses", () => {
  it("atravessa a virada do ano nos dois sentidos", () => {
    expect(mesVizinho(2026, 11, 1)).toEqual({ ano: 2027, mes: 0 });
    expect(mesVizinho(2026, 0, -1)).toEqual({ ano: 2025, mes: 11 });
  });
});
