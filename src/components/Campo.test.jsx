import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { CampoNumerico } from "./Campo.jsx";

/* Regressão: o campo de carga usava `<input type="number">`, que recusa a
   vírgula. Digitar "22,5" devolvia string vazia e o valor sumia sem aviso —
   justo o formato que todo teclado brasileiro entrega. */
describe("CampoNumerico", () => {
  it("aceita vírgula decimal e entrega número", () => {
    const aoMudar = vi.fn();
    render(<CampoNumerico rotulo="Carga" valor={null} aoMudar={aoMudar} />);
    fireEvent.change(screen.getByLabelText("Carga"), { target: { value: "22,5" } });
    expect(aoMudar).toHaveBeenLastCalledWith(22.5);
  });

  it("aceita ponto decimal também", () => {
    const aoMudar = vi.fn();
    render(<CampoNumerico rotulo="Carga" valor={null} aoMudar={aoMudar} />);
    fireEvent.change(screen.getByLabelText("Carga"), { target: { value: "22.5" } });
    expect(aoMudar).toHaveBeenLastCalledWith(22.5);
  });

  it("não perde a vírgula no meio da digitação", () => {
    const aoMudar = vi.fn();
    render(<CampoNumerico rotulo="Carga" valor={null} aoMudar={aoMudar} />);
    const campo = screen.getByLabelText("Carga");
    fireEvent.change(campo, { target: { value: "22," } });
    /* O texto continua "22," na tela, mesmo que o número já valha 22. */
    expect(campo.value).toBe("22,");
  });

  it("campo vazio vira null, não zero nem NaN", () => {
    const aoMudar = vi.fn();
    render(<CampoNumerico rotulo="Carga" valor={60} aoMudar={aoMudar} />);
    fireEvent.change(screen.getByLabelText("Carga"), { target: { value: "" } });
    expect(aoMudar).toHaveBeenLastCalledWith(null);
  });

  it("recusa letras em vez de aceitá-las e virar NaN", () => {
    const aoMudar = vi.fn();
    render(<CampoNumerico rotulo="Carga" valor={null} aoMudar={aoMudar} />);
    const campo = screen.getByLabelText("Carga");
    fireEvent.change(campo, { target: { value: "abc" } });
    expect(campo.value).toBe("");
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it("arredonda quando o campo é de inteiro", () => {
    const aoMudar = vi.fn();
    render(<CampoNumerico rotulo="Reps" inteiro valor={null} aoMudar={aoMudar} />);
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "10,4" } });
    expect(aoMudar).toHaveBeenLastCalledWith(10);
  });

  it("usa teclado decimal no celular, sem virar type=number", () => {
    render(<CampoNumerico rotulo="Carga" valor={null} aoMudar={() => {}} />);
    const campo = screen.getByLabelText("Carga");
    expect(campo.getAttribute("type")).toBe("text");
    expect(campo.getAttribute("inputmode")).toBe("decimal");
  });

  it("mostra o valor que chega de fora, com vírgula", () => {
    const { rerender } = render(<CampoNumerico rotulo="Carga" valor={null} aoMudar={() => {}} />);
    rerender(<CampoNumerico rotulo="Carga" valor={62.5} aoMudar={() => {}} />);
    expect(screen.getByLabelText("Carga").value).toBe("62,5");
  });
});
