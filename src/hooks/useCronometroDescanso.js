import { useCallback, useEffect, useRef, useState } from "react";

/* Cronômetro de descanso. Conta a partir do relógio, não somando ticks: o
   navegador do celular congela `setInterval` quando a tela apaga, e um
   contador somado perderia todo o tempo de bolso. */
export function useCronometroDescanso({ vibrar = true } = {}) {
  const [alvoEm, setAlvoEm] = useState(null);
  const [restante, setRestante] = useState(0);
  const [pausadoEm, setPausadoEm] = useState(null);
  const [total, setTotal] = useState(0);
  const jaVibrou = useRef(false);

  useEffect(() => {
    if (alvoEm === null || pausadoEm !== null) return undefined;
    const tick = () => {
      const falta = Math.max(0, Math.round((alvoEm - Date.now()) / 1000));
      setRestante(falta);
      if (falta === 0 && !jaVibrou.current) {
        jaVibrou.current = true;
        if (vibrar && typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate([120, 60, 120]);
          } catch {
            /* aparelho sem suporte: seguir sem barulho */
          }
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [alvoEm, pausadoEm, vibrar]);

  const iniciar = useCallback((segundos) => {
    const s = Math.max(0, Math.round(segundos || 0));
    jaVibrou.current = false;
    setTotal(s);
    setRestante(s);
    setPausadoEm(null);
    setAlvoEm(Date.now() + s * 1000);
  }, []);

  const pausar = useCallback(() => {
    setPausadoEm((p) => (p === null ? Date.now() : p));
  }, []);

  const retomar = useCallback(() => {
    setPausadoEm((p) => {
      if (p === null) return null;
      setAlvoEm((a) => (a === null ? null : a + (Date.now() - p)));
      return null;
    });
  }, []);

  const acrescentar = useCallback((segundos) => {
    setTotal((t) => t + segundos);
    setAlvoEm((a) => (a === null ? null : a + segundos * 1000));
    jaVibrou.current = false;
  }, []);

  const dispensar = useCallback(() => {
    setAlvoEm(null);
    setPausadoEm(null);
    setRestante(0);
    setTotal(0);
  }, []);

  return {
    ativo: alvoEm !== null,
    pausado: pausadoEm !== null,
    restante,
    total,
    iniciar,
    pausar,
    retomar,
    acrescentar,
    dispensar,
  };
}
