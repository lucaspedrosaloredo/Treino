/* Números vindos da interface. O teclado brasileiro entrega vírgula decimal e
   os dados antigos guardaram tudo como string — as duas coisas passam por aqui
   antes de virar número. */

/** Converte para número finito, aceitando vírgula decimal. Devolve null quando
 *  não há número válido — nunca NaN, que envenena qualquer soma adiante. */
export function paraNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  const limpo = valor.trim().replace(/\s/g, "").replace(",", ".");
  if (limpo === "" || limpo === "." || limpo === "-") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** Igual a `paraNumero`, mas recusa negativo — carga, reps, distância e peso
 *  não têm significado abaixo de zero. */
export function paraNumeroPositivo(valor) {
  const n = paraNumero(valor);
  return n === null || n < 0 ? null : n;
}

export function paraInteiroPositivo(valor) {
  const n = paraNumeroPositivo(valor);
  return n === null ? null : Math.round(n);
}

/** Apresentação: 62.5 -> "62,5"; 62 -> "62". */
export function formataNumero(n, casas = 1) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const arredondado = Number(n.toFixed(casas));
  return String(arredondado).replace(".", ",");
}

export function limita(n, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, n));
}
