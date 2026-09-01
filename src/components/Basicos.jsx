/* Peças pequenas e repetidas da interface. */

export function Cartao({ children, cor, className = "", style = {}, ...props }) {
  return (
    <div
      {...props}
      className={`p-3 ${className}`}
      style={{
        background: "var(--sup)",
        borderRadius: "var(--raio)",
        ...(cor ? { borderLeft: `3px solid ${cor}` } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Metrica({ rotulo, valor, detalhe, cor }) {
  return (
    <div className="p-3" style={{ background: "var(--sup)", borderRadius: "var(--raio)" }}>
      <div
        className="text-lg"
        style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: cor || "var(--txt)" }}
      >
        {valor}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)", lineHeight: 1.3 }}>
        {rotulo}
      </div>
      {detalhe && (
        <div className="text-xs mt-1" style={{ color: "var(--txt-apagado)", lineHeight: 1.3 }}>
          {detalhe}
        </div>
      )}
    </div>
  );
}

export function Titulo({ children, acao }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2 mt-4">
      <h2 className="text-sm" style={{ fontWeight: 600 }}>
        {children}
      </h2>
      {acao}
    </div>
  );
}

/* Controle segmentado: as subtelas de cada aba. É `radiogroup` porque é
   exatamente isso — uma escolha entre opções mutuamente exclusivas. */
export function Segmentado({ valor, aoMudar, opcoes, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex gap-1 mb-4" style={{ background: "var(--sup)", borderRadius: "var(--raio)", padding: 3 }}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(o.valor)}
            className="flex-1 text-sm"
            style={{
              minHeight: 38,
              borderRadius: 3,
              background: ativo ? "var(--sup3)" : "transparent",
              color: ativo ? "var(--txt)" : "var(--txt-fraco)",
              fontWeight: ativo ? 600 : 400,
            }}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

export function EstadoVazio({ titulo, texto, acao, icone: Icone }) {
  return (
    <div
      className="p-6 text-center"
      style={{ background: "var(--sup)", borderRadius: "var(--raio)", border: "1px dashed var(--linha)" }}
    >
      {Icone && <Icone size={26} style={{ color: "var(--txt-apagado)", margin: "0 auto 10px" }} />}
      <div className="text-sm" style={{ fontWeight: 600 }}>
        {titulo}
      </div>
      <p className="text-xs mt-2 mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.6 }}>
        {texto}
      </p>
      {acao}
    </div>
  );
}

/* Mensagens curtas de resultado. `aria-live` para o leitor de tela anunciar
   sem que o foco precise ir até lá. */
export function Aviso({ tipo = "info", children }) {
  const cores = {
    info: { background: "var(--sup2)", color: "var(--txt)", borda: "var(--linha)" },
    ok: { background: "var(--aviso-ok-fundo)", color: "var(--aviso-ok-txt)", borda: "var(--aviso-ok-borda)" },
    erro: { background: "var(--perigo-fundo)", color: "var(--aviso-erro-txt)", borda: "var(--perigo-borda)" },
    atencao: { background: "var(--aviso-atencao-fundo)", color: "var(--aviso-atencao-txt)", borda: "var(--aviso-atencao-borda)" },
  }[tipo];

  return (
    <div
      role="status"
      aria-live="polite"
      className="text-xs p-2 mb-2"
      style={{ background: cores.background, color: cores.color, border: `1px solid ${cores.borda}`, borderRadius: 3, lineHeight: 1.5 }}
    >
      {children}
    </div>
  );
}

export function Etiqueta({ children, cor }) {
  return (
    <span
      className="text-xs px-2 py-1 inline-block"
      style={{
        color: cor || "var(--txt-fraco)",
        border: `1px solid ${cor ? cor : "var(--linha)"}`,
        borderRadius: 3,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}

/* Barra de progresso com número junto: cor sozinha não comunica estado. */
export function Progresso({ percentual, rotulo }) {
  const p = Math.max(0, Math.min(100, percentual || 0));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--txt-fraco)" }}>
        <span>{rotulo}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(p)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--sup2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", background: "var(--acento)" }} />
      </div>
    </div>
  );
}
