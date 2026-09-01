import { useMemo, useState } from "react";
import { Pencil, Trash2, ChevronDown } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { formataData } from "../../lib/dates.js";
import { volumeSessao, seriesConcluidas, formataDuracao } from "../../lib/calculos.js";
import { formataNumero } from "../../lib/numbers.js";

import Botao, { BotaoIcone } from "../../components/Botao.jsx";
import Campo, { CampoTexto, CampoNumerico } from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import { Cartao, EstadoVazio, Aviso } from "../../components/Basicos.jsx";

export default function Historico() {
  const estado = useEstado();
  const despacha = useAcao();
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [expandida, setExpandida] = useState(null);

  const sessoes = useMemo(
    () =>
      [...estado.sessoesMusculacao]
        .filter((s) => s.status === "concluida")
        .sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? ""))),
    [estado.sessoesMusculacao],
  );

  const semData = sessoes.filter((s) => !s.data).length;

  if (!sessoes.length) {
    return (
      <EstadoVazio
        titulo="Nenhum treino registrado"
        texto="Assim que você finalizar um treino na aba Executar, ele aparece aqui e pode ser corrigido ou apagado."
      />
    );
  }

  return (
    <div>
      {semData > 0 && (
        <Aviso tipo="atencao">
          {semData} treino(s) vieram da versão anterior sem data. Abra e corrija para eles entrarem nos gráficos.
        </Aviso>
      )}

      {sessoes.map((s) => {
        const aberto = expandida === s.id;
        return (
          <Cartao key={s.id} className="mb-2">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => setExpandida(aberto ? null : s.id)}
                aria-expanded={aberto}
                className="text-left min-w-0 flex-1"
              >
                <div className="text-sm" style={{ fontWeight: 600 }}>
                  {s.divisaoSnapshot} · {s.fichaNomeSnapshot}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
                  {s.data ? formataData(s.data) : "sem data"} · {seriesConcluidas(s)} séries ·{" "}
                  {formataNumero(volumeSessao(s), 0)} kg de volume
                  {s.duracaoSegundos ? ` · ${formataDuracao(s.duracaoSegundos)}` : ""}
                </div>
              </button>
              <div className="flex shrink-0">
                <BotaoIcone rotulo={`Editar treino de ${s.data ? formataData(s.data) : "sem data"}`} onClick={() => setEditando(s.id)}>
                  <Pencil size={16} />
                </BotaoIcone>
                <BotaoIcone
                  rotulo={`Excluir treino de ${s.data ? formataData(s.data) : "sem data"}`}
                  onClick={() =>
                    setConfirmacao({
                      titulo: "Excluir este treino?",
                      texto: `${s.divisaoSnapshot} de ${s.data ? formataData(s.data) : "sem data"} sai do histórico e dos gráficos. Não dá para desfazer.`,
                      acao: "Excluir treino",
                      aoConfirmar: () => despacha({ tipo: "SESSAO_HISTORICO_REMOVIDA", sessaoId: s.id }),
                    })
                  }
                >
                  <Trash2 size={16} />
                </BotaoIcone>
                <BotaoIcone rotulo={aberto ? "Recolher" : "Ver séries"} onClick={() => setExpandida(aberto ? null : s.id)}>
                  <ChevronDown size={16} style={{ transform: aberto ? "rotate(180deg)" : "none" }} />
                </BotaoIcone>
              </div>
            </div>

            {aberto && (
              <div className="mt-3">
                {s.exercicios.map((ex, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-xs" style={{ fontWeight: 600 }}>{ex.nomeSnapshot}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)", fontVariantNumeric: "tabular-nums" }}>
                      {ex.series
                        .map((serie) => `${serie.cargaKg !== null ? formataNumero(serie.cargaKg) : "—"}×${serie.repeticoes ?? "—"}`)
                        .join("   ")}
                    </div>
                    {ex.observacao && (
                      <div className="text-xs mt-1" style={{ color: "var(--txt-apagado)" }}>{ex.observacao}</div>
                    )}
                  </div>
                ))}
                {s.observacao && (
                  <div className="text-xs mt-2 p-2" style={{ background: "var(--sup2)", borderRadius: 3, color: "var(--txt-fraco)" }}>
                    {s.observacao}
                  </div>
                )}
              </div>
            )}
          </Cartao>
        );
      })}

      {editando && <EditorSessao sessaoId={editando} aoFechar={() => setEditando(null)} />}
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </div>
  );
}

/* --------------------------------------------------- editar uma sessão */

function EditorSessao({ sessaoId, aoFechar }) {
  const estado = useEstado();
  const despacha = useAcao();
  const sessao = estado.sessoesMusculacao.find((s) => s.id === sessaoId);
  if (!sessao) return null;

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo="Corrigir treino"
      descricao="Editar aqui muda só este registro. As fichas continuam como estão."
      larguraMax={560}
      rodape={<Botao variante="primario" larguraTotal onClick={aoFechar}>Pronto</Botao>}
    >
      <Campo
        rotulo="Data"
        type="date"
        className="mb-3"
        value={sessao.data ?? ""}
        onChange={(e) => despacha({ tipo: "SESSAO_HISTORICO_ATUALIZADA", sessaoId, mudancas: { data: e.target.value || null } })}
      />

      {sessao.exercicios.map((ex, i) => (
        <div key={i} className="mb-3 p-2" style={{ background: "var(--sup2)", borderRadius: 3 }}>
          <div className="text-sm mb-2" style={{ fontWeight: 600 }}>{ex.nomeSnapshot}</div>
          {ex.series.map((serie, j) => (
            <div key={serie.id} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: "1.5rem 1fr 1fr" }}>
              <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>{j + 1}ª</div>
              <CampoNumerico
                rotulo="Carga (kg)"
                rotuloOculto
                valor={serie.cargaKg}
                aoMudar={(v) =>
                  despacha({
                    tipo: "SESSAO_HISTORICO_SERIE_ATUALIZADA",
                    sessaoId, indiceExercicio: i, indiceSerie: j, mudancas: { cargaKg: v },
                  })
                }
              />
              <CampoNumerico
                rotulo="Repetições"
                rotuloOculto
                inteiro
                valor={serie.repeticoes}
                aoMudar={(v) =>
                  despacha({
                    tipo: "SESSAO_HISTORICO_SERIE_ATUALIZADA",
                    sessaoId, indiceExercicio: i, indiceSerie: j, mudancas: { repeticoes: v },
                  })
                }
              />
            </div>
          ))}
        </div>
      ))}

      <CampoTexto
        rotulo="Observação do treino"
        value={sessao.observacao}
        onChange={(e) => despacha({ tipo: "SESSAO_HISTORICO_ATUALIZADA", sessaoId, mudancas: { observacao: e.target.value } })}
      />
    </Modal>
  );
}
