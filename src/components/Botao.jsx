/* Botão do app. Alvo de toque de 44px por padrão — é o mínimo confortável com
   a mão suada no meio da série. */

const VARIANTES = {
  primario: { background: "var(--acento)", color: "var(--sobre-acento)", border: "none", fontWeight: 600 },
  secundario: { background: "var(--sup2)", color: "var(--txt)", border: "1px solid var(--linha)" },
  fantasma: { background: "transparent", color: "var(--txt-fraco)", border: "1px solid var(--linha)" },
  perigo: { background: "transparent", color: "var(--perigo)", border: "1px solid var(--perigo-borda)" },
  perigoSolido: { background: "var(--perigo-solido)", color: "var(--sobre-perigo)", border: "none", fontWeight: 600 },
};

export default function Botao({
  variante = "secundario",
  larguraTotal = false,
  compacto = false,
  cor,
  children,
  style = {},
  className = "",
  ...props
}) {
  const base = VARIANTES[variante] || VARIANTES.secundario;
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-3 ${larguraTotal ? "w-full" : ""} ${className}`}
      style={{
        ...base,
        ...(cor ? { background: cor, color: "var(--sobre-acento)", border: "none", fontWeight: 600 } : null),
        minHeight: compacto ? 36 : "var(--toque)",
        borderRadius: "var(--raio)",
        fontSize: 14,
        opacity: props.disabled ? 0.45 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Botão só com ícone. O nome acessível é obrigatório: sem ele, quem usa
 *  leitor de tela ouve "botão" e nada mais. */
export function BotaoIcone({ rotulo, children, style = {}, ...props }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      {...props}
      className="inline-flex items-center justify-center"
      style={{
        minWidth: "var(--toque)",
        minHeight: "var(--toque)",
        borderRadius: "var(--raio)",
        color: "var(--txt-fraco)",
        background: "transparent",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
