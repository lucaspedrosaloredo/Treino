import { useMemo, useState } from "react";
import { Pencil, Trash2, Copy } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { formataData } from "../../lib/dates.js";
import { ritmoSegundosPorKm, formataRitmo, formataDuracao } from "../../lib/calculos.js";
import { formataNumero } from "../../lib/numbers.js";

import Botao, { BotaoIcone } from "../../components/Botao.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import { Cartao, EstadoVazio, Aviso, Metrica } from "../../components/Basicos.jsx";
import RegistrarCorrida from "./RegistrarCorrida.jsx";

export default function HistoricoCorridas() {
  const estado = useEstado();
  const despacha = useAcao();
  const [editando, setEditando] = useState(null);
  const [novo, setNovo] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  const corridas = useMemo(
    () => [...estado.corridas].sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? ""))),
    [estado.corridas],
  );
  const semData = corridas.filter((c) => !c.data).length;

  const total = corridas.reduce((s, c) => s + (c.distanciaKm || 0), 0);
  const tempo = corridas.reduce((s, c) => s + (c.duracaoSegundos || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Metrica rotulo="Corridas" valor={corridas.length} />
        <Metrica rotulo="Km no total" valor={formataNumero(total)} />
        <Metrica rotulo="Tempo" valor={tempo ? formataDuracao(tempo) : "—"} />
      </div>

      <Botao variante="primario" larguraTotal className="mb-3" onClick={() => setNovo(true)}>
        Registrar corrida
      </Botao>

      {semData > 0 && (
        <Aviso tipo="atencao">
          {semData} corrida(s) vieram da versão anterior sem data. Edite para elas entrarem nos gráficos.
        </Aviso>
      )}

      {corridas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma corrida registrada"
          texto="Registre uma corrida — com ou sem plano — e ela aparece aqui, com o ritmo já calculado."
        />
      ) : (
        corridas.map((c) => {
          const ritmo = ritmoSegundosPorKm(c.distanciaKm, c.duracaoSegundos);
          return (
            <Cartao key={c.id} className="mb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {c.distanciaKm ? `${formataNumero(c.distanciaKm)} km` : "Sem distância"}
                    {c.duracaoSegundos ? ` · ${formataDuracao(c.duracaoSegundos)}` : ""}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
                    {c.data ? formataData(c.data) : "sem data"}
                    {ritmo ? ` · ${formataRitmo(ritmo)}` : ""}
                    {c.terreno ? ` · ${c.terreno}` : ""}
                    {c.rpe ? ` · esforço ${c.rpe}/10` : ""}
                  </div>
                  {c.observacao && (
                    <div className="text-xs mt-1" style={{ color: "var(--txt-apagado)" }}>{c.observacao}</div>
                  )}
                </div>
                <div className="flex shrink-0">
                  <BotaoIcone rotulo="Editar corrida" onClick={() => setEditando(c)}>
                    <Pencil size={16} />
                  </BotaoIcone>
                  <BotaoIcone rotulo="Duplicar corrida" onClick={() => despacha({ tipo: "CORRIDA_DUPLICADA", corridaId: c.id })}>
                    <Copy size={16} />
                  </BotaoIcone>
                  <BotaoIcone
                    rotulo="Excluir corrida"
                    onClick={() =>
                      setConfirmacao({
                        titulo: "Excluir esta corrida?",
                        texto: `${c.distanciaKm ? formataNumero(c.distanciaKm) + " km" : "Corrida"} de ${c.data ? formataData(c.data) : "sem data"}. Não dá para desfazer.`,
                        acao: "Excluir",
                        aoConfirmar: () => despacha({ tipo: "CORRIDA_REMOVIDA", corridaId: c.id }),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </BotaoIcone>
                </div>
              </div>
            </Cartao>
          );
        })
      )}

      <RegistrarCorrida aberto={novo} aoFechar={() => setNovo(false)} />
      <RegistrarCorrida aberto={Boolean(editando)} aoFechar={() => setEditando(null)} corrida={editando} />
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </div>
  );
}
