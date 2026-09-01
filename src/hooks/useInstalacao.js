import { useEffect, useState } from "react";

/* Instalação como PWA. No Android/Chromium dá para chamar o prompt nativo; no
   iPhone não existe API nenhuma, então o que resta é explicar o caminho. */
export function useInstalacao() {
  const [eventoInstalar, setEventoInstalar] = useState(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const confere = () =>
      setInstalado(
        window.matchMedia("(display-mode: standalone)").matches ||
          window.navigator.standalone === true,
      );
    confere();

    const aoPoderInstalar = (e) => {
      e.preventDefault();
      setEventoInstalar(e);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setEventoInstalar(null);
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", confere);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
      mq.removeEventListener?.("change", confere);
    };
  }, []);

  const ehIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  return {
    instalado,
    podeChamarPrompt: Boolean(eventoInstalar),
    ehIOS,
    async instalar() {
      if (!eventoInstalar) return false;
      eventoInstalar.prompt();
      const { outcome } = await eventoInstalar.userChoice;
      setEventoInstalar(null);
      return outcome === "accepted";
    },
  };
}
