import { describe, it, expect } from "vitest";
import {
  paraChaveData, deChaveData, ehChaveDataValida, formataData, formataDataCurta,
  somaDias, diferencaEmDias, inicioDaSemana, segundosEntre, dataDeIso, nomeDoDia,
} from "./dates.js";

describe("datas no fuso local", () => {
  it("não perde um dia por conversão UTC", () => {
    /* `new Date("2026-03-01")` seria 28/02 em qualquer fuso a oeste. */
    const d = deChaveData("2026-03-01");
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(2);
    expect(paraChaveData(d)).toBe("2026-03-01");
  });

  it("valida chave de data", () => {
    expect(ehChaveDataValida("2026-08-01")).toBe(true);
    expect(ehChaveDataValida("2026-02-30")).toBe(false);
    expect(ehChaveDataValida("01/08/2026")).toBe(false);
    expect(ehChaveDataValida(null)).toBe(false);
  });

  it("formata em dd/mm/aaaa", () => {
    expect(formataData("2026-08-05")).toBe("05/08/2026");
    expect(formataDataCurta("2026-08-05")).toBe("05/08");
    expect(formataData("lixo")).toBe("—");
  });

  it("soma dias atravessando o mês", () => {
    expect(somaDias("2026-08-30", 3)).toBe("2026-09-02");
    expect(somaDias("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("conta diferença de dias", () => {
    expect(diferencaEmDias("2026-08-01", "2026-08-08")).toBe(7);
    expect(diferencaEmDias("2026-08-08", "2026-08-01")).toBe(-7);
    expect(diferencaEmDias("2026-08-01", "2026-08-01")).toBe(0);
  });

  it("acha o início da semana", () => {
    /* 2026-08-05 é quarta; a segunda é 03. */
    expect(inicioDaSemana("2026-08-05", 1)).toBe("2026-08-03");
    expect(inicioDaSemana("2026-08-03", 1)).toBe("2026-08-03");
    expect(inicioDaSemana("2026-08-05", 0)).toBe("2026-08-02");
  });

  it("mede segundos entre carimbos", () => {
    expect(segundosEntre("2026-08-01T10:00:00.000Z", "2026-08-01T11:30:00.000Z")).toBe(5400);
    expect(segundosEntre("ruim", "2026-08-01T11:00:00.000Z")).toBeNull();
  });

  it("extrai a data local de um carimbo", () => {
    const agora = new Date();
    expect(dataDeIso(agora.toISOString())).toBe(paraChaveData(agora));
  });

  it("nomeia o dia", () => {
    expect(nomeDoDia("2026-08-03")).toBe("Segunda");
  });
});
