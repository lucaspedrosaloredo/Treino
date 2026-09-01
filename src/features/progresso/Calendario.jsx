import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  matrizDoMes, iniciaisDosDias, indexaAtividades, mesVizinho, descreveDia, NOMES_MES,
} from "../../lib/calendario.js";
import { formataData, hoje, deChaveData } from "../../lib/dates.js";
import { volumeSessao, formataDuracao } from "../../lib/calculos.js";
import { formataNumero } from "../../lib/numbers.js";

import { BotaoIcone } from "../../components/Botao.jsx";
import { Cartao } from "../../components/Basicos.jsx";

/* Calendário do mês. O objetivo é responder "como foi meu mês" de relance:
   onde teve treino, onde teve corrida, e onde não teve nada. */
export default function Calendario({ estado }) {
  const agora = deChaveData(hoje());
  const [{ ano, mes }, setMes] = useState({ ano: agora.getFullYear(), mes: agora.getMonth() });
  const [diaAberto, setDiaAberto] = useState(null);

  const primeiroDia = estado.configuracoes.inicioSemana ?? 1;
  const semanas = useMemo(() => matrizDoMes(ano, mes, primeiroDia), [ano, mes, primeiroDia]);
  const porDia = useMemo(() => indexaAtividades(estado), [estado]);
  const iniciais = iniciaisDosDias(primeiroDia);

  const noMes = semanas.flat().filter((c) => c.doMes);
  const comTreino = noMes.filter((c) => porDia.get(c.chave)?.treinos.length).length;
  const comCorrida = noMes.filter((c) => porDia.get(c.chave)?.corridas.length).length;

  const detalhe = diaAberto ? porDia.get(diaAberto) : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <BotaoIcone rotulo="Mês anterior" onClick={() => setMes(mesVizinho(ano, mes, -1))}>
          <ChevronLeft size={18} />
        </BotaoIcone>
        <div className="text-sm text-center" style={{ fontWeight: 600 }}>
          {NOMES_MES[mes]} de {ano}
        </div>
        <BotaoIcone rotulo="Próximo mês" onClick={() => setMes(mesVizinho(ano, mes, 1))}>
          <ChevronRight size={18} />
        </BotaoIcone>
      </div>

      <div className="grid mb-1" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {iniciais.map((i, k) => (
          <div key={k} className="text-xs text-center" style={{ color: "var(--txt-apagado)" }} aria-hidden="true">
            {i}
          </div>
        ))}
      </div>

      <div role="grid" aria-label={`Atividades de ${NOMES_MES[mes]} de ${ano}`}>
        {semanas.map((semana, s) => (
          <div key={s} role="row" className="grid mb-1" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {semana.map((celula) => {
              const atividades = porDia.get(celula.chave);
              const temTreino = Boolean(atividades?.treinos.length);
              const temCorrida = Boolean(atividades?.corridas.length);
              const ehHoje = celula.chave === hoje();
              const selecionado = celula.chave === diaAberto;

              return (
                <button
                  key={celula.chave}
                  type="button"
                  role="gridcell"
                  onClick={() => setDiaAberto(selecionado ? null : celula.chave)}
                  aria-label={`${formataData(celula.chave)}: ${descreveDia(celula.chave, atividades)}`}
                  aria-pressed={selecionado}
                  className="flex flex-col items-center justify-center"
                  style={{
                    minHeight: 42,
                    borderRadius: 3,
                    background: selecionado ? "var(--sup3)" : celula.doMes ? "var(--sup)" : "transparent",
                    border: ehHoje ? "1px solid var(--acento)" : "1px solid transparent",
                    color: celula.doMes ? "var(--txt)" : "var(--txt-apagado)",
                    opacity: celula.doMes ? 1 : 0.4,
                  }}
                >
                  <span className="text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {celula.diaDoMes}
                  </span>
                  {/* Marcas com forma diferente, não só cor: bolinha cheia é
                      treino, anel é corrida. */}
                  <span className="flex gap-1 mt-1" style={{ height: 6 }} aria-hidden="true">
                    {temTreino && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--div-b)" }} />
                    )}
                    {temCorrida && (
                      <span
                        style={{ width: 6, height: 6, borderRadius: "50%", border: "1.5px solid var(--acento)" }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--txt-fraco)" }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--div-b)" }} /> treino
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 7, height: 7, borderRadius: "50%", border: "1.5px solid var(--acento)" }} /> corrida
        </span>
        <span>· {comTreino} dias com treino, {comCorrida} com corrida</span>
      </div>

      {diaAberto && (
        <Cartao className="mt-3">
          <div className="text-sm mb-2" style={{ fontWeight: 600 }}>{formataData(diaAberto)}</div>
          {!detalhe && (
            <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Nada registrado neste dia.</div>
          )}
          {detalhe?.treinos.map((t) => (
            <div key={t.id} className="text-xs mb-1">
              <span style={{ color: "var(--div-b)" }}>Musculação</span> · {t.divisaoSnapshot} {t.fichaNomeSnapshot} ·{" "}
              {formataNumero(volumeSessao(t), 0)} kg
            </div>
          ))}
          {detalhe?.corridas.map((c) => (
            <div key={c.id} className="text-xs mb-1">
              <span style={{ color: "var(--acento)" }}>Corrida</span> ·{" "}
              {c.distanciaKm ? `${formataNumero(c.distanciaKm)} km` : "sem distância"}
              {c.duracaoSegundos ? ` · ${formataDuracao(c.duracaoSegundos)}` : ""}
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
}
