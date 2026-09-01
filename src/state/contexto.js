import { createContext, useContext } from "react";

/* Os contextos e os hooks vivem fora do arquivo do provider: um módulo que
   exporta componente e função ao mesmo tempo quebra o fast refresh do Vite. */

export const ContextoEstado = createContext(null);
export const ContextoDespacho = createContext(null);

export function useEstado() {
  const ctx = useContext(ContextoEstado);
  if (ctx === null) throw new Error("useEstado precisa estar dentro de ProvedorApp");
  return ctx;
}

export function useDespacho() {
  const ctx = useContext(ContextoDespacho);
  if (ctx === null) throw new Error("useDespacho precisa estar dentro de ProvedorApp");
  return ctx;
}

/** Atalho para quem só precisa despachar uma ação. */
export function useAcao() {
  return useDespacho().despacha;
}
