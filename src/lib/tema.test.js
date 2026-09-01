import { describe, it, expect } from "vitest";
import { resolveTema, aplicaTema, COR_DA_BARRA, TEMAS } from "./tema.js";

describe("resolução do tema", () => {
  it("respeita a escolha explícita, contra o sistema", () => {
    expect(resolveTema("claro", false)).toBe("claro");
    expect(resolveTema("escuro", true)).toBe("escuro");
  });

  it("segue o sistema quando pedido", () => {
    expect(resolveTema("sistema", true)).toBe("claro");
    expect(resolveTema("sistema", false)).toBe("escuro");
  });

  it("cai no escuro diante de valor desconhecido", () => {
    expect(resolveTema(undefined, false)).toBe("escuro");
    expect(resolveTema("roxo", false)).toBe("escuro");
  });

  it("oferece as três opções", () => {
    expect(Object.keys(TEMAS)).toEqual(["escuro", "claro", "sistema"]);
  });
});

describe("aplicação no documento", () => {
  it("marca o documento e acerta a cor da barra do navegador", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);

    aplicaTema("claro", false);
    expect(document.documentElement.dataset.tema).toBe("claro");
    expect(meta.getAttribute("content")).toBe(COR_DA_BARRA.claro);

    aplicaTema("sistema", false);
    expect(document.documentElement.dataset.tema).toBe("escuro");
    expect(meta.getAttribute("content")).toBe(COR_DA_BARRA.escuro);

    meta.remove();
  });

  it("não quebra se a meta não existir", () => {
    expect(() => aplicaTema("claro", false)).not.toThrow();
  });
});
