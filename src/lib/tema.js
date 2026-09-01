/* Resolução do tema. A preferência pode ser "sistema", e o CSS não sabe lidar
   com isso sem duplicar a paleta inteira dentro de uma media query — então a
   tradução acontece aqui e o `data-tema` do documento recebe sempre um valor
   concreto. */

export const TEMAS = {
  escuro: "Escuro",
  claro: "Claro",
  sistema: "Seguir o sistema",
};

/* Cor da barra do navegador em cada tema. Precisa bater com `--fundo`, senão
   no iPhone aparece uma faixa de cor errada acima do app. */
export const COR_DA_BARRA = { escuro: "#141917", claro: "#f4f5f3" };

export function resolveTema(preferencia, sistemaEhClaro) {
  if (preferencia === "claro") return "claro";
  if (preferencia === "escuro") return "escuro";
  return sistemaEhClaro ? "claro" : "escuro";
}

/** Aplica o tema ao documento. Devolve o tema resolvido. */
export function aplicaTema(preferencia, sistemaEhClaro) {
  const tema = resolveTema(preferencia, sistemaEhClaro);
  if (typeof document === "undefined") return tema;

  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", COR_DA_BARRA[tema]);
  return tema;
}
