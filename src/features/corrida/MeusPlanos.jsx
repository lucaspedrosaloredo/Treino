import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, Pencil, CheckCircle2 } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { TIPOS_SESSAO_CORRIDA, STATUS_SESSAO_PLANEJADA } from "../../lib/schema.js";
import { interpretaDuracao, formataDuracao } from "../../lib/calculos.js";

import { DIAS_SEMANA } from "../../lib/dates.js";

import Botao, { BotaoIcone } from "../../components/Botao.jsx";
import Campo, { CampoTexto, Selecao, CampoNumerico } from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import { Cartao, EstadoVazio, Etiqueta } from "../../components/Basicos.jsx";

export default function MeusPlanos() {
  const estado = useEstado();
  const despacha = useAcao();
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Botao
          larguraTotal
          variante="primario"
          onClick={() =>
            despacha({
              tipo: "PLANO_CRIADO",
              plano: { nome: "Nova periodização", objetivo: "", semanas: [] },
            })
          }
        >
          <Plus size={16} /> Criar do zero
        </Botao>
      </div>

      {estado.modelosCorrida.length > 0 && (
        <>
          <div className="text-sm mb-2 mt-4" style={{ fontWeight: 600 }}>Modelos prontos</div>
          <p className="text-xs mb-2" style={{ color: "var(--txt-fraco)" }}>
            Duplicar cria uma cópia sua, editável, sem mexer no modelo.
          </p>
          {estado.modelosCorrida.map((m) => (
            <Cartao key={m.id} className="mb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm" style={{ fontWeight: 600 }}>{m.nome}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
                    {m.semanas.length} semanas · {m.semanas.reduce((s, w) => s + w.sessoes.length, 0)} sessões
                  </div>
                </div>
                <Botao compacto onClick={() => despacha({ tipo: "PLANO_DUPLICADO", planoId: m.id })}>
                  <Copy size={14} /> Usar
                </Botao>
              </div>
            </Cartao>
          ))}
        </>
      )}

      <div className="text-sm mb-2 mt-4" style={{ fontWeight: 600 }}>Meus planos</div>
      {estado.planosCorrida.length === 0 ? (
        <EstadoVazio titulo="Nenhum plano seu ainda" texto="Duplique um modelo acima ou crie uma periodização do zero." />
      ) : (
        estado.planosCorrida.map((p) => (
          <Cartao key={p.id} className="mb-2" cor={p.ativo ? "var(--acento)" : undefined}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm flex items-center gap-2" style={{ fontWeight: 600 }}>
                  {p.nome}
                  {p.ativo && <Etiqueta cor="var(--acento)">ativo</Etiqueta>}
                  {p.arquivado && <Etiqueta>arquivado</Etiqueta>}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
                  {p.semanas.length} semanas · {p.semanas.reduce((s, w) => s + w.sessoes.length, 0)} sessões
                  {p.objetivo ? ` · ${p.objetivo}` : ""}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {!p.ativo && (
                <Botao compacto onClick={() => despacha({ tipo: "PLANO_ATIVADO", planoId: p.id })}>
                  <CheckCircle2 size={14} /> Ativar
                </Botao>
              )}
              <Botao compacto onClick={() => setEditando(p.id)}>
                <Pencil size={14} /> Editar
              </Botao>
              <Botao compacto onClick={() => despacha({ tipo: "PLANO_DUPLICADO", planoId: p.id })}>
                <Copy size={14} /> Duplicar
              </Botao>
              <Botao
                compacto
                onClick={() => despacha({ tipo: "PLANO_ATUALIZADO", planoId: p.id, mudancas: { arquivado: !p.arquivado } })}
              >
                {p.arquivado ? "Reativar" : "Arquivar"}
              </Botao>
              <Botao
                compacto
                variante="perigo"
                onClick={() =>
                  setConfirmacao({
                    titulo: "Excluir este plano?",
                    texto: "As corridas já registradas continuam no histórico — elas guardam os próprios dados.",
                    acao: "Excluir plano",
                    aoConfirmar: () => despacha({ tipo: "PLANO_REMOVIDO", planoId: p.id }),
                  })
                }
              >
                <Trash2 size={14} /> Excluir
              </Botao>
            </div>
          </Cartao>
        ))
      )}

      {editando && <EditorPlano planoId={editando} aoFechar={() => setEditando(null)} />}
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </div>
  );
}

/* --------------------------------------------------------- editor do plano */

function EditorPlano({ planoId, aoFechar }) {
  const estado = useEstado();
  const despacha = useAcao();
  const [editandoSessao, setEditandoSessao] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  const plano = estado.planosCorrida.find((p) => p.id === planoId);
  if (!plano) return null;
  const muda = (mudancas) => despacha({ tipo: "PLANO_ATUALIZADO", planoId, mudancas });

  return (
    <>
      <Modal
        aberto
        aoFechar={aoFechar}
        titulo="Editar periodização"
        larguraMax={580}
        rodape={<Botao variante="primario" larguraTotal onClick={aoFechar}>Pronto</Botao>}
      >
        <Campo rotulo="Nome" className="mb-3" value={plano.nome} onChange={(e) => muda({ nome: e.target.value })} />
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Campo rotulo="Objetivo" value={plano.objetivo} placeholder="10 km" onChange={(e) => muda({ objetivo: e.target.value })} />
          <Campo rotulo="Data de início" type="date" value={plano.dataInicio ?? ""}
            onChange={(e) => muda({ dataInicio: e.target.value || null })} />
        </div>
        <CampoTexto rotulo="Descrição" className="mb-4" value={plano.descricao} onChange={(e) => muda({ descricao: e.target.value })} />

        <div className="text-sm mb-2" style={{ fontWeight: 600 }}>Semanas</div>
        {plano.semanas.map((s, i) => (
          <div key={s.id} className="mb-3 p-2" style={{ background: "var(--sup2)", borderRadius: 3 }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm" style={{ fontWeight: 600 }}>Semana {s.numero}</div>
                <Campo
                  rotulo="Foco da semana"
                  rotuloOculto
                  className="mt-1"
                  value={s.foco}
                  placeholder="Foco da semana"
                  onChange={(e) => despacha({ tipo: "SEMANA_ATUALIZADA", planoId, semanaId: s.id, mudancas: { foco: e.target.value } })}
                />
                <label className="flex items-center gap-2 text-xs mt-2" style={{ color: "var(--txt-fraco)", minHeight: 36 }}>
                  <input
                    type="checkbox"
                    checked={s.reducao}
                    onChange={(e) => despacha({ tipo: "SEMANA_ATUALIZADA", planoId, semanaId: s.id, mudancas: { reducao: e.target.checked } })}
                    style={{ width: 17, height: 17 }}
                  />
                  Semana de redução / recuperação
                </label>
              </div>
              <div className="flex shrink-0 flex-col">
                <div className="flex">
                  <BotaoIcone rotulo={`Mover semana ${s.numero} para cima`} disabled={i === 0}
                    onClick={() => despacha({ tipo: "SEMANA_MOVIDA", planoId, semanaId: s.id, direcao: -1 })}
                    style={{ opacity: i === 0 ? 0.3 : 1, minWidth: 36 }}>
                    <ArrowUp size={15} />
                  </BotaoIcone>
                  <BotaoIcone rotulo={`Mover semana ${s.numero} para baixo`} disabled={i === plano.semanas.length - 1}
                    onClick={() => despacha({ tipo: "SEMANA_MOVIDA", planoId, semanaId: s.id, direcao: 1 })}
                    style={{ opacity: i === plano.semanas.length - 1 ? 0.3 : 1, minWidth: 36 }}>
                    <ArrowDown size={15} />
                  </BotaoIcone>
                </div>
                <div className="flex">
                  <BotaoIcone rotulo={`Duplicar semana ${s.numero}`}
                    onClick={() => despacha({ tipo: "SEMANA_DUPLICADA", planoId, semanaId: s.id })} style={{ minWidth: 36 }}>
                    <Copy size={15} />
                  </BotaoIcone>
                  <BotaoIcone
                    rotulo={`Excluir semana ${s.numero}`}
                    onClick={() =>
                      setConfirmacao({
                        titulo: `Excluir a semana ${s.numero}?`,
                        texto: "As sessões dela saem do plano. Corridas já registradas continuam no histórico.",
                        acao: "Excluir semana",
                        aoConfirmar: () => despacha({ tipo: "SEMANA_REMOVIDA", planoId, semanaId: s.id }),
                      })
                    }
                    style={{ minWidth: 36 }}
                  >
                    <Trash2 size={15} />
                  </BotaoIcone>
                </div>
              </div>
            </div>

            {s.sessoes.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-2 mt-2 p-2"
                style={{ background: "var(--sup)", borderRadius: 3 }}>
                <div className="min-w-0">
                  <div className="text-xs truncate">{x.nome}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--txt-apagado)" }}>
                    {TIPOS_SESSAO_CORRIDA[x.tipo]}
                    {x.duracaoSegundos ? ` · ${formataDuracao(x.duracaoSegundos)}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0">
                  <BotaoIcone rotulo={`Editar ${x.nome}`} onClick={() => setEditandoSessao({ semanaId: s.id, sessao: x })} style={{ minWidth: 36 }}>
                    <Pencil size={14} />
                  </BotaoIcone>
                  <BotaoIcone rotulo={`Excluir ${x.nome}`}
                    onClick={() => despacha({ tipo: "SESSAO_PLANEJADA_REMOVIDA", planoId, sessaoId: x.id })} style={{ minWidth: 36 }}>
                    <Trash2 size={14} />
                  </BotaoIcone>
                </div>
              </div>
            ))}

            <Botao compacto className="mt-2"
              onClick={() => despacha({ tipo: "SESSAO_PLANEJADA_ADICIONADA", planoId, semanaId: s.id, sessao: { nome: "Nova sessão" } })}>
              <Plus size={14} /> Sessão
            </Botao>
          </div>
        ))}

        <Botao larguraTotal onClick={() => despacha({ tipo: "SEMANA_ADICIONADA", planoId })}>
          <Plus size={16} /> Adicionar semana
        </Botao>
      </Modal>

      {editandoSessao && (
        <EditorSessaoPlanejada
          planoId={planoId}
          sessao={editandoSessao.sessao}
          aoFechar={() => setEditandoSessao(null)}
        />
      )}
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </>
  );
}

function EditorSessaoPlanejada({ planoId, sessao, aoFechar }) {
  const despacha = useAcao();
  const [duracao, setDuracao] = useState(sessao.duracaoSegundos ? String(Math.round(sessao.duracaoSegundos / 60)) : "");
  const muda = (mudancas) => despacha({ tipo: "SESSAO_PLANEJADA_ATUALIZADA", planoId, sessaoId: sessao.id, mudancas });

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo="Sessão planejada"
      rodape={<Botao variante="primario" larguraTotal onClick={aoFechar}>Pronto</Botao>}
    >
      <Campo rotulo="Nome" className="mb-3" value={sessao.nome} onChange={(e) => muda({ nome: e.target.value })} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Selecao rotulo="Tipo" value={sessao.tipo} onChange={(e) => muda({ tipo: e.target.value })}
          opcoes={Object.entries(TIPOS_SESSAO_CORRIDA).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <Selecao rotulo="Situação" value={sessao.status} onChange={(e) => muda({ status: e.target.value })}
          opcoes={Object.entries(STATUS_SESSAO_PLANEJADA).map(([valor, rotulo]) => ({ valor, rotulo }))} />
      </div>

      <CampoTexto rotulo="Objetivo em uma frase" className="mb-3" linhas={2} value={sessao.objetivo}
        onChange={(e) => muda({ objetivo: e.target.value })} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <CampoNumerico rotulo="Distância prevista (km)" valor={sessao.distanciaKm}
          aoMudar={(v) => muda({ distanciaKm: v })} />
        <Campo rotulo="Duração prevista" type="text" value={duracao} ajuda="minutos ou mm:ss"
          onChange={(e) => { setDuracao(e.target.value); muda({ duracaoSegundos: interpretaDuracao(e.target.value) }); }} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Selecao rotulo="Dia da semana" value={sessao.diaSemana ?? ""}
          onChange={(e) => muda({ diaSemana: e.target.value === "" ? null : Number(e.target.value) })}>
          <option value="" style={{ background: "var(--sup)" }}>Sem dia fixo</option>
          {DIAS_SEMANA.map((d, i) => (
            <option key={d} value={i} style={{ background: "var(--sup)" }}>{d}</option>
          ))}
        </Selecao>
        <Campo rotulo="Data planejada" type="date" value={sessao.dataPlanejada ?? ""}
          onChange={(e) => muda({ dataPlanejada: e.target.value || null })} />
      </div>

      <CampoTexto rotulo="Observações" value={sessao.observacao} onChange={(e) => muda({ observacao: e.target.value })} />
    </Modal>
  );
}
