import { lazy, Suspense, useMemo, useState } from "react";

import { useEstado } from "../../state/contexto.js";
import { PERIODOS, intervaloDoPeriodo } from "../../lib/calculos.js";
import Campo from "../../components/Campo.jsx";
import { Segmentado } from "../../components/Basicos.jsx";

import Resumo from "./Resumo.jsx";
import ProgressoForca from "./ProgressoForca.jsx";
import ProgressoCorrida from "./ProgressoCorrida.jsx";

/* Os gráficos entram por `lazy`: quem só quer ver os números do resumo não
   paga o download da biblioteca de gráficos. */
const Grafico = lazy(() => import("./Graficos.jsx"));

export function GraficoTardio(props) {
  return (
    <Suspense
      fallback={
        <div className="text-xs p-3" style={{ color: "var(--txt-apagado)" }}>
          Carregando gráfico…
        </div>
      }
    >
      <Grafico {...props} />
    </Suspense>
  );
}

export default function ProgressoTela() {
  const estado = useEstado();
  const [sub, setSub] = useState("resumo");
  const [periodo, setPeriodo] = useState("8s");
  const [personalizado, setPersonalizado] = useState({ de: "", ate: "" });

  const intervalo = useMemo(
    () => intervaloDoPeriodo(periodo, periodo === "personalizado" ? personalizado : null),
    [periodo, personalizado],
  );

  return (
    <div>
      {/* Sete períodos não cabem numa linha a 320px. Quebrar em duas linhas
          mostra todos de uma vez; uma faixa rolável esconderia opção atrás de
          um gesto que ninguém adivinha. */}
      <div role="group" aria-label="Período" className="flex flex-wrap gap-2 mb-3">
        {[...Object.entries(PERIODOS), ["personalizado", { rotulo: "Escolher" }]].map(([chave, p]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setPeriodo(chave)}
            aria-pressed={periodo === chave}
            className="text-xs px-3 shrink-0"
            style={{
              minHeight: 36,
              borderRadius: 3,
              background: periodo === chave ? "var(--sup3)" : "var(--sup)",
              color: periodo === chave ? "var(--txt)" : "var(--txt-fraco)",
              border: `1px solid ${periodo === chave ? "var(--linha-forte)" : "transparent"}`,
            }}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {periodo === "personalizado" && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Campo rotulo="De" type="date" value={personalizado.de} onChange={(e) => setPersonalizado({ ...personalizado, de: e.target.value })} />
          <Campo rotulo="Até" type="date" value={personalizado.ate} onChange={(e) => setPersonalizado({ ...personalizado, ate: e.target.value })} />
        </div>
      )}

      <Segmentado
        rotulo="Seção do progresso"
        valor={sub}
        aoMudar={setSub}
        opcoes={[
          { valor: "resumo", rotulo: "Resumo" },
          { valor: "forca", rotulo: "Musculação" },
          { valor: "corrida", rotulo: "Corrida" },
        ]}
      />

      {sub === "resumo" && <Resumo estado={estado} intervalo={intervalo} />}
      {sub === "forca" && <ProgressoForca estado={estado} intervalo={intervalo} />}
      {sub === "corrida" && <ProgressoCorrida estado={estado} intervalo={intervalo} />}
    </div>
  );
}
