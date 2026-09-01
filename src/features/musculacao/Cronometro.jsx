import { Pause, Play, Plus, X } from "lucide-react";

import { formataDuracao } from "../../lib/calculos.js";
import { BotaoIcone } from "../../components/Botao.jsx";

/* Barra de descanso. Fica acima da barra de abas, presa embaixo, porque é lá
   que o polegar está entre uma série e outra. */
export default function Cronometro({ cronometro }) {
  if (!cronometro.ativo) return null;
  const acabou = cronometro.restante === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 flex items-center gap-2 px-3 py-2"
      style={{
        bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
        background: acabou ? "var(--ok)" : "var(--sup3)",
        color: acabou ? "#0d1a12" : "var(--txt)",
        borderTop: "1px solid var(--linha)",
        paddingLeft: "calc(0.75rem + env(safe-area-inset-left, 0px))",
        paddingRight: "calc(0.75rem + env(safe-area-inset-right, 0px))",
        zIndex: 39,
      }}
    >
      <div className="text-sm" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: 58 }}>
        {formataDuracao(cronometro.restante)}
      </div>
      <div className="text-xs flex-1 truncate">
        {acabou ? "Descanso terminado" : cronometro.pausado ? "Descanso pausado" : "Descansando"}
      </div>

      {!acabou && (
        <BotaoIcone
          rotulo={cronometro.pausado ? "Retomar descanso" : "Pausar descanso"}
          onClick={cronometro.pausado ? cronometro.retomar : cronometro.pausar}
          style={{ color: "inherit", minWidth: 38, minHeight: 38 }}
        >
          {cronometro.pausado ? <Play size={16} /> : <Pause size={16} />}
        </BotaoIcone>
      )}
      <BotaoIcone
        rotulo="Acrescentar 30 segundos"
        onClick={() => cronometro.acrescentar(30)}
        style={{ color: "inherit", minWidth: 38, minHeight: 38 }}
      >
        <span className="flex items-center text-xs">
          <Plus size={13} />
          30
        </span>
      </BotaoIcone>
      <BotaoIcone
        rotulo="Dispensar descanso"
        onClick={cronometro.dispensar}
        style={{ color: "inherit", minWidth: 38, minHeight: 38 }}
      >
        <X size={16} />
      </BotaoIcone>
    </div>
  );
}
