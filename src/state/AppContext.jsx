import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { reducer } from "./reducer.js";
import { carregaEstado, salvaEstado } from "./persistencia.js";
import { ContextoEstado, ContextoDespacho } from "./contexto.js";

export function ProvedorApp({ children }) {
  /* Carregar e migrar acontece uma vez só, antes do primeiro render, para a
     tela não piscar um estado vazio antes dos dados aparecerem. */
  const [inicial] = useState(carregaEstado);

  const [estado, despacha] = useReducer(reducer, inicial.estado);
  const [erroAoSalvar, setErroAoSalvar] = useState(null);
  const [avisosMigracao, setAvisosMigracao] = useState(inicial.avisos);
  const primeiraGravacao = useRef(true);

  useEffect(() => {
    /* O carregamento já gravou o estado migrado; não regravar no primeiro render. */
    if (primeiraGravacao.current) {
      primeiraGravacao.current = false;
      return;
    }
    setErroAoSalvar(salvaEstado(estado));
  }, [estado]);

  /* Preferências que valem para o documento inteiro. */
  useEffect(() => {
    document.documentElement.dataset.animacoes = estado.configuracoes.reduzirAnimacoes ? "reduzidas" : "normais";
  }, [estado.configuracoes.reduzirAnimacoes]);

  const valorDespacho = useMemo(
    () => ({
      despacha,
      erroAoSalvar,
      avisosMigracao,
      origemDosDados: inicial.origem,
      dispensaAvisos: () => setAvisosMigracao([]),
    }),
    [erroAoSalvar, avisosMigracao, inicial.origem],
  );

  return (
    <ContextoEstado.Provider value={estado}>
      <ContextoDespacho.Provider value={valorDespacho}>{children}</ContextoDespacho.Provider>
    </ContextoEstado.Provider>
  );
}
