import { useId } from "react";

/* Campos de formulário. Todo campo tem `label` de verdade associado — o
   placeholder some quando a pessoa digita e não serve de rótulo. */

/* Impede que a rolagem do mouse altere o valor de um campo numérico. */
const travaScroll = (e) => {
  if (document.activeElement === e.currentTarget) e.currentTarget.blur();
};

const estiloBase = {
  background: "var(--sup2)",
  color: "var(--txt)",
  border: "1px solid var(--linha)",
  borderRadius: "var(--raio)",
  /* Sem isto o input não encolhe abaixo da largura intrínseca dele e estoura
     a linha no celular. O tamanho da fonte vem do index.css, em 16px, porque
     abaixo disso o Safari do iPhone dá zoom ao focar. */
  minWidth: 0,
  width: "100%",
  padding: "10px",
  minHeight: "var(--toque)",
};

export default function Campo({
  rotulo,
  ajuda,
  erro,
  rotuloOculto = false,
  className = "",
  style = {},
  id,
  ...props
}) {
  const gerado = useId();
  const idCampo = id || gerado;
  const idAjuda = ajuda ? `${idCampo}-ajuda` : undefined;
  const idErro = erro ? `${idCampo}-erro` : undefined;

  return (
    <div className={className}>
      {rotulo && (
        <label
          htmlFor={idCampo}
          className="block text-xs mb-1"
          style={{ color: "var(--txt-fraco)", ...(rotuloOculto ? oculto : null) }}
        >
          {rotulo}
        </label>
      )}
      <input
        id={idCampo}
        onWheel={travaScroll}
        aria-describedby={[idAjuda, idErro].filter(Boolean).join(" ") || undefined}
        aria-invalid={erro ? "true" : undefined}
        {...props}
        style={{ ...estiloBase, ...(erro ? { borderColor: "var(--perigo)" } : null), ...style }}
      />
      {ajuda && !erro && (
        <div id={idAjuda} className="text-xs mt-1" style={{ color: "var(--txt-apagado)" }}>
          {ajuda}
        </div>
      )}
      {erro && (
        <div id={idErro} className="text-xs mt-1" style={{ color: "var(--perigo)" }}>
          {erro}
        </div>
      )}
    </div>
  );
}

export function CampoTexto({ rotulo, className = "", style = {}, id, linhas = 3, ...props }) {
  const gerado = useId();
  const idCampo = id || gerado;
  return (
    <div className={className}>
      {rotulo && (
        <label htmlFor={idCampo} className="block text-xs mb-1" style={{ color: "var(--txt-fraco)" }}>
          {rotulo}
        </label>
      )}
      <textarea
        id={idCampo}
        rows={linhas}
        {...props}
        style={{ ...estiloBase, minHeight: 0, resize: "vertical", ...style }}
      />
    </div>
  );
}

export function Selecao({ rotulo, opcoes = [], className = "", style = {}, id, children, ...props }) {
  const gerado = useId();
  const idCampo = id || gerado;
  return (
    <div className={className}>
      {rotulo && (
        <label htmlFor={idCampo} className="block text-xs mb-1" style={{ color: "var(--txt-fraco)" }}>
          {rotulo}
        </label>
      )}
      <select id={idCampo} onWheel={travaScroll} {...props} style={{ ...estiloBase, ...style }}>
        {children ||
          opcoes.map((o) => (
            <option key={o.valor} value={o.valor} style={{ background: "var(--sup)" }}>
              {o.rotulo}
            </option>
          ))}
      </select>
    </div>
  );
}

const oculto = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};
