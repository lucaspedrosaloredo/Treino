import { useCallback, useEffect, useState } from "react";

/* Detecta um service worker novo esperando para assumir. O worker não chama
   `skipWaiting` sozinho — quem decide a hora é quem está usando o app, porque
   atualizar no meio de uma série recarrega a página. */
export function useAtualizacao() {
  const [emEspera, setEmEspera] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    let cancelado = false;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelado) return;
      if (reg.waiting) setEmEspera(reg.waiting);

      reg.addEventListener("updatefound", () => {
        const novo = reg.installing;
        if (!novo) return;
        novo.addEventListener("statechange", () => {
          /* "installed" com um controller ativo significa: existe versão nova
             pronta e uma versão antiga rodando agora. */
          if (novo.state === "installed" && navigator.serviceWorker.controller) setEmEspera(novo);
        });
      });
    });

    return () => {
      cancelado = true;
    };
  }, []);

  const atualizar = useCallback(() => {
    if (!emEspera) return;
    /* O worker novo assume e a página recarrega já servida por ele. Os dados
       ficam no localStorage e não são tocados por troca de cache. */
    emEspera.postMessage({ tipo: "ASSUMIR_AGORA" });
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  }, [emEspera]);

  return { temAtualizacao: Boolean(emEspera), atualizar };
}
