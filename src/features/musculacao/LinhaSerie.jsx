import { Check } from "lucide-react";

import { formataNumero } from "../../lib/numbers.js";
import { CampoNumerico } from "../../components/Campo.jsx";

/* A linha de série segue o que Strong, Hevy e JEFIT consolidaram: número da
   série, o que foi feito nela da última vez, os campos e a marcação de feita.
   Cabeçalho e linhas dividem a mesma grade — sem isso, as colunas desalinham
   assim que um número fica mais largo. */
export const GRADE_SERIE = "1.5rem minmax(0, 2.75rem) minmax(0, 1fr) minmax(0, 1fr) 2.25rem";

const estiloCampo = {
  background: "var(--sup2)",
  color: "var(--txt)",
  border: "1px solid var(--linha)",
  borderRadius: 3,
  minWidth: 0,
  width: "100%",
  padding: "9px 6px",
  textAlign: "center",
  minHeight: 40,
};

export function CabecalhoSeries({ mostraCarga = true }) {
  return (
    <div
      className="grid mb-1 text-xs"
      style={{ gridTemplateColumns: GRADE_SERIE, gap: 5, color: "var(--txt-fraco)" }}
    >
      <div aria-hidden="true" />
      <div>Anterior</div>
      <div className="text-center">{mostraCarga ? "Carga" : "Tempo"}</div>
      <div className="text-center">Reps</div>
      <div aria-hidden="true" />
    </div>
  );
}

export default function LinhaSerie({
  serie,
  indice,
  anterior,
  sugestaoCarga,
  repsAlvo,
  nomeExercicio,
  mostraCarga = true,
  exibirRpe,
  exibirRir,
  aoMudar,
  aoAlternarConcluida,
}) {
  const textoAnterior =
    anterior && (anterior.cargaKg !== null || anterior.repeticoes !== null)
      ? `${anterior.cargaKg !== null ? formataNumero(anterior.cargaKg) : "—"}×${anterior.repeticoes ?? "—"}`
      : "—";

  const rotuloSerie = `${indice + 1}ª série de ${nomeExercicio}`;

  return (
    <div className="mb-2">
      <div className="grid items-center" style={{ gridTemplateColumns: GRADE_SERIE, gap: 5 }}>
        <div className="text-xs" style={{ color: serie.tipo === "aquecimento" ? "var(--aviso)" : "var(--txt-fraco)" }}>
          {serie.tipo === "aquecimento" ? "aq" : `${indice + 1}ª`}
        </div>

        <button
          type="button"
          onClick={() => {
            if (!anterior) return;
            aoMudar({ cargaKg: anterior.cargaKg, repeticoes: anterior.repeticoes });
          }}
          disabled={!anterior}
          aria-label={anterior ? `Copiar ${textoAnterior} da última vez para a ${rotuloSerie}` : "Sem registro anterior"}
          className="text-xs text-left truncate"
          style={{
            color: "var(--txt-fraco)",
            minHeight: 40,
            background: "transparent",
            cursor: anterior ? "pointer" : "default",
          }}
        >
          {textoAnterior}
        </button>

        <CampoNumerico
          rotulo={mostraCarga ? `Carga da ${rotuloSerie}` : `Tempo da ${rotuloSerie}`}
          rotuloOculto
          valor={serie.cargaKg}
          placeholder={sugestaoCarga !== null && sugestaoCarga !== undefined ? formataNumero(sugestaoCarga) : "—"}
          aoMudar={(v) => aoMudar({ cargaKg: v })}
          style={estiloCampo}
        />

        <CampoNumerico
          rotulo={`Repetições da ${rotuloSerie}`}
          rotuloOculto
          inteiro
          valor={serie.repeticoes}
          placeholder={repsAlvo ? String(repsAlvo) : "—"}
          aoMudar={(v) => aoMudar({ repeticoes: v })}
          style={estiloCampo}
        />

        <button
          type="button"
          onClick={() => aoAlternarConcluida(!serie.concluida)}
          aria-pressed={serie.concluida}
          aria-label={serie.concluida ? `Desmarcar ${rotuloSerie}` : `Marcar ${rotuloSerie} como feita`}
          className="flex items-center justify-center"
          style={{
            minHeight: 40,
            minWidth: 34,
            borderRadius: 3,
            background: serie.concluida ? "var(--ok)" : "var(--sup2)",
            border: `1px solid ${serie.concluida ? "var(--ok)" : "var(--linha)"}`,
            color: serie.concluida ? "#0d1a12" : "var(--txt-apagado)",
          }}
        >
          <Check size={16} />
        </button>
      </div>

      {(exibirRpe || exibirRir) && (
        <div className="flex gap-2 mt-1" style={{ paddingLeft: "calc(1.5rem + 2.75rem + 10px)" }}>
          {exibirRir && (
            <label className="text-xs flex items-center gap-1" style={{ color: "var(--txt-apagado)" }}>
              RIR
              <CampoNumerico
                rotulo={`Repetições na reserva da ${rotuloSerie}`}
                rotuloOculto
                inteiro
                valor={serie.rir}
                aoMudar={(v) => aoMudar({ rir: v })}
                style={{ ...estiloCampo, width: 52, minHeight: 34, padding: "4px" }}
              />
            </label>
          )}
          {exibirRpe && (
            <label className="text-xs flex items-center gap-1" style={{ color: "var(--txt-apagado)" }}>
              RPE
              <CampoNumerico
                rotulo={`Esforço percebido da ${rotuloSerie}`}
                rotuloOculto
                inteiro
                valor={serie.rpe}
                aoMudar={(v) => aoMudar({ rpe: v })}
                style={{ ...estiloCampo, width: 52, minHeight: 34, padding: "4px" }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
