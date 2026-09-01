/* Identificadores estáveis. `crypto.randomUUID` existe em todo navegador que
   roda este app, mas exige contexto seguro — em http:// puro ele some, e o
   app não pode quebrar por isso. */

export function novoId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      /* segue para o plano B */
    }
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* Para a migração: o id antigo precisa sobreviver, senão o histórico perde o
   vínculo com o exercício. Prefixamos para não colidir com um uuid novo. */
export function idDerivado(prefixo, original) {
  return `${prefixo}:${String(original)}`;
}
