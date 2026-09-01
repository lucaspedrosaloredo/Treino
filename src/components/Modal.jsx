import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

import { BotaoIcone } from "./Botao.jsx";

/* Modal acessível: prende o foco enquanto está aberto, fecha no Escape e
   devolve o foco a quem o abriu. Sem isso, quem navega por teclado ou leitor
   de tela cai atrás do modal e não sabe voltar. */

const FOCAVEIS =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ aberto, aoFechar, titulo, descricao, children, rodape, larguraMax = 460 }) {
  const caixa = useRef(null);
  const focoAnterior = useRef(null);

  const aoTeclar = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFechar();
        return;
      }
      if (e.key !== "Tab" || !caixa.current) return;
      const focaveis = [...caixa.current.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    },
    [aoFechar],
  );

  useEffect(() => {
    if (!aberto) return undefined;
    focoAnterior.current = document.activeElement;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Foco no primeiro elemento útil, não no fundo escuro. */
    const t = setTimeout(() => {
      const alvo = caixa.current?.querySelector(FOCAVEIS) || caixa.current;
      alvo?.focus?.();
    }, 0);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = anterior;
      if (focoAnterior.current && focoAnterior.current.focus) focoAnterior.current.focus();
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.75)",
        zIndex: 60,
        padding:
          "calc(1rem + env(safe-area-inset-top, 0px)) calc(1rem + env(safe-area-inset-right, 0px)) calc(1rem + env(safe-area-inset-bottom, 0px)) calc(1rem + env(safe-area-inset-left, 0px))",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onKeyDown={aoTeclar}
        className="w-full"
        style={{
          maxWidth: larguraMax,
          maxHeight: "100%",
          overflowY: "auto",
          background: "var(--sup)",
          border: "1px solid var(--linha)",
          borderRadius: "var(--raio-g)",
          boxShadow: "var(--sombra)",
        }}
      >
        <div
          className="flex items-start justify-between gap-3 p-4 pb-2 sticky top-0"
          style={{ background: "var(--sup)" }}
        >
          <div className="min-w-0">
            <h2 className="text-base" style={{ fontWeight: 600 }}>
              {titulo}
            </h2>
            {descricao && (
              <p className="text-xs mt-1" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
                {descricao}
              </p>
            )}
          </div>
          <BotaoIcone rotulo="Fechar" onClick={aoFechar}>
            <X size={18} />
          </BotaoIcone>
        </div>

        <div className="px-4 pb-4">{children}</div>

        {rodape && (
          <div
            className="flex gap-2 p-4 pt-3 sticky bottom-0"
            style={{ background: "var(--sup)", borderTop: "1px solid var(--linha)" }}
          >
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}
