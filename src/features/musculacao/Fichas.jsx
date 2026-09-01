import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, Archive, ArchiveRestore, Pencil } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { CORES_DIVISAO, GRUPOS_MUSCULARES, EQUIPAMENTOS, TIPOS_REGISTRO, criaExercicio } from "../../lib/schema.js";
import { paraNumeroPositivo, paraInteiroPositivo } from "../../lib/numbers.js";

import Botao, { BotaoIcone } from "../../components/Botao.jsx";
import Campo, { CampoTexto, Selecao } from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import { Cartao, EstadoVazio, Segmentado, Etiqueta } from "../../components/Basicos.jsx";

const INCREMENTOS = [0, 0.5, 1, 2, 2.5, 5, 10];

export default function Fichas() {
  const estado = useEstado();
  const despacha = useAcao();
  const [mostrando, setMostrando] = useState("ativas");
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  const lista = [...estado.fichas]
    .filter((f) => (mostrando === "ativas" ? !f.arquivada : f.arquivada))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <div>
      <Segmentado
        rotulo="Fichas mostradas"
        valor={mostrando}
        aoMudar={setMostrando}
        opcoes={[
          { valor: "ativas", rotulo: `Ativas (${estado.fichas.filter((f) => !f.arquivada).length})` },
          { valor: "arquivadas", rotulo: `Arquivadas (${estado.fichas.filter((f) => f.arquivada).length})` },
        ]}
      />

      {lista.length === 0 ? (
        <EstadoVazio
          titulo={mostrando === "ativas" ? "Nenhuma ficha ativa" : "Nenhuma ficha arquivada"}
          texto={
            mostrando === "ativas"
              ? "Crie sua primeira divisão. Não há limite de cinco: use quantas letras quiser."
              : "Fichas arquivadas somem da rotina mas continuam aqui, com o histórico intacto."
          }
          acao={
            mostrando === "ativas" ? (
              <Botao variante="primario" onClick={() => despacha({ tipo: "FICHA_CRIADA" })}>
                <Plus size={16} /> Criar ficha
              </Botao>
            ) : null
          }
        />
      ) : (
        lista.map((f, i) => (
          <Cartao key={f.id} cor={f.cor} className="mb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm" style={{ fontWeight: 600 }}>
                  {f.divisao} · {f.nome}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
                  {f.exercicios.length} exercícios · {f.exercicios.reduce((s, e) => s + (e.series || 0), 0)} séries
                </div>
                {f.descricao && (
                  <div className="text-xs mt-1" style={{ color: "var(--txt-apagado)" }}>{f.descricao}</div>
                )}
              </div>
              <div className="flex shrink-0">
                <BotaoIcone
                  rotulo={`Mover ${f.nome} para cima`}
                  disabled={i === 0}
                  onClick={() => despacha({ tipo: "FICHA_MOVIDA", fichaId: f.id, direcao: -1 })}
                  style={{ opacity: i === 0 ? 0.3 : 1 }}
                >
                  <ArrowUp size={16} />
                </BotaoIcone>
                <BotaoIcone
                  rotulo={`Mover ${f.nome} para baixo`}
                  disabled={i === lista.length - 1}
                  onClick={() => despacha({ tipo: "FICHA_MOVIDA", fichaId: f.id, direcao: 1 })}
                  style={{ opacity: i === lista.length - 1 ? 0.3 : 1 }}
                >
                  <ArrowDown size={16} />
                </BotaoIcone>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Botao compacto onClick={() => setEditando(f.id)}>
                <Pencil size={14} /> Editar
              </Botao>
              <Botao compacto onClick={() => despacha({ tipo: "FICHA_DUPLICADA", fichaId: f.id })}>
                <Copy size={14} /> Duplicar
              </Botao>
              <Botao
                compacto
                onClick={() => despacha({ tipo: "FICHA_ATUALIZADA", fichaId: f.id, mudancas: { arquivada: !f.arquivada } })}
              >
                {f.arquivada ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                {f.arquivada ? "Reativar" : "Arquivar"}
              </Botao>
              <Botao
                compacto
                variante="perigo"
                onClick={() =>
                  setConfirmacao({
                    titulo: `Excluir a ficha ${f.divisao}?`,
                    texto: "Os treinos já registrados com ela continuam no histórico — cada sessão guarda a própria cópia dos dados. Só a ficha some.",
                    acao: "Excluir ficha",
                    aoConfirmar: () => despacha({ tipo: "FICHA_REMOVIDA", fichaId: f.id }),
                  })
                }
              >
                <Trash2 size={14} /> Excluir
              </Botao>
            </div>
          </Cartao>
        ))
      )}

      {mostrando === "ativas" && lista.length > 0 && (
        <Botao larguraTotal className="mt-2 mb-4" onClick={() => despacha({ tipo: "FICHA_CRIADA" })}>
          <Plus size={16} /> Nova ficha
        </Botao>
      )}

      <EditorFicha fichaId={editando} aoFechar={() => setEditando(null)} />
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </div>
  );
}

/* -------------------------------------------------------- editor da ficha */

function EditorFicha({ fichaId, aoFechar }) {
  const estado = useEstado();
  const despacha = useAcao();
  const [editandoExercicio, setEditandoExercicio] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  const ficha = estado.fichas.find((f) => f.id === fichaId);
  if (!ficha) return null;

  const muda = (mudancas) => despacha({ tipo: "FICHA_ATUALIZADA", fichaId, mudancas });
  const exercicios = [...ficha.exercicios].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <>
      <Modal
        aberto
        aoFechar={aoFechar}
        titulo="Editar ficha"
        larguraMax={560}
        rodape={<Botao variante="primario" larguraTotal onClick={aoFechar}>Pronto</Botao>}
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Campo rotulo="Divisão" value={ficha.divisao} maxLength={3} onChange={(e) => muda({ divisao: e.target.value.toUpperCase() })} />
          <Selecao rotulo="Cor" value={ficha.cor} onChange={(e) => muda({ cor: e.target.value })}>
            {CORES_DIVISAO.map((c) => (
              <option key={c} value={c} style={{ background: "var(--sup)" }}>{c}</option>
            ))}
          </Selecao>
        </div>
        <Campo rotulo="Nome" className="mb-3" value={ficha.nome} onChange={(e) => muda({ nome: e.target.value })} />
        <Campo rotulo="Descrição" className="mb-3" value={ficha.descricao} onChange={(e) => muda({ descricao: e.target.value })} />
        <CampoTexto rotulo="Observações" className="mb-4" value={ficha.observacao} onChange={(e) => muda({ observacao: e.target.value })} />

        <div className="text-sm mb-2" style={{ fontWeight: 600 }}>Exercícios</div>
        {exercicios.length === 0 && (
          <p className="text-xs mb-2" style={{ color: "var(--txt-fraco)" }}>
            Nenhum exercício ainda. Adicione o primeiro abaixo.
          </p>
        )}

        {exercicios.map((fe, i) => (
          <div key={fe.id} className="mb-2 p-2" style={{ background: "var(--sup2)", borderRadius: 3 }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm truncate">{fe.nomeSnapshot}</div>
                <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
                  {fe.series} × {fe.repsMin ?? "?"}
                  {fe.repsMax && fe.repsMax !== fe.repsMin ? `-${fe.repsMax}` : ""} · +{fe.incrementoKg} kg · {fe.descansoSegundos}s
                </div>
              </div>
              <div className="flex shrink-0">
                <BotaoIcone rotulo={`Mover ${fe.nomeSnapshot} para cima`} disabled={i === 0}
                  onClick={() => despacha({ tipo: "FICHA_EXERCICIO_MOVIDO", fichaId, fichaExercicioId: fe.id, direcao: -1 })}
                  style={{ opacity: i === 0 ? 0.3 : 1, minWidth: 36 }}>
                  <ArrowUp size={15} />
                </BotaoIcone>
                <BotaoIcone rotulo={`Mover ${fe.nomeSnapshot} para baixo`} disabled={i === exercicios.length - 1}
                  onClick={() => despacha({ tipo: "FICHA_EXERCICIO_MOVIDO", fichaId, fichaExercicioId: fe.id, direcao: 1 })}
                  style={{ opacity: i === exercicios.length - 1 ? 0.3 : 1, minWidth: 36 }}>
                  <ArrowDown size={15} />
                </BotaoIcone>
                <BotaoIcone rotulo={`Editar ${fe.nomeSnapshot}`} onClick={() => setEditandoExercicio(fe.id)} style={{ minWidth: 36 }}>
                  <Pencil size={15} />
                </BotaoIcone>
                <BotaoIcone
                  rotulo={`Remover ${fe.nomeSnapshot}`}
                  onClick={() =>
                    setConfirmacao({
                      titulo: "Remover exercício da ficha?",
                      texto: `${fe.nomeSnapshot} sai desta ficha. O histórico dele continua no Progresso.`,
                      acao: "Remover",
                      aoConfirmar: () => despacha({ tipo: "FICHA_EXERCICIO_REMOVIDO", fichaId, fichaExercicioId: fe.id }),
                    })
                  }
                  style={{ minWidth: 36 }}
                >
                  <Trash2 size={15} />
                </BotaoIcone>
              </div>
            </div>
          </div>
        ))}

        <Botao larguraTotal className="mt-2" onClick={() => setAdicionando(true)}>
          <Plus size={16} /> Adicionar exercício
        </Botao>
      </Modal>

      {editandoExercicio && (
        <EditorExercicio
          fichaId={fichaId}
          fichaExercicioId={editandoExercicio}
          aoFechar={() => setEditandoExercicio(null)}
        />
      )}
      {adicionando && <AdicionarExercicio fichaId={fichaId} aoFechar={() => setAdicionando(false)} />}
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </>
  );
}

/* --------------------------------------------------- adicionar exercício */

function AdicionarExercicio({ fichaId, aoFechar }) {
  const estado = useEstado();
  const despacha = useAcao();
  const [modo, setModo] = useState("catalogo");
  const [escolhido, setEscolhido] = useState("");
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState({ nome: "", grupoPrincipal: "Peito", equipamento: "Halter", tipoRegistro: "peso_reps" });

  const catalogo = estado.exercicios
    .filter((e) => !e.arquivado && e.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const adiciona = () => {
    if (modo === "catalogo") {
      const base = estado.exercicios.find((e) => e.id === escolhido);
      if (!base) return;
      despacha({ tipo: "FICHA_EXERCICIO_ADICIONADO", fichaId, exercicio: base });
    } else {
      if (!novo.nome.trim()) return;
      despacha({ tipo: "FICHA_EXERCICIO_ADICIONADO", fichaId, exercicio: criaExercicio(novo) });
    }
    aoFechar();
  };

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo="Adicionar exercício"
      rodape={
        <>
          <Botao variante="fantasma" larguraTotal onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" larguraTotal onClick={adiciona} disabled={modo === "catalogo" ? !escolhido : !novo.nome.trim()}>
            Adicionar
          </Botao>
        </>
      }
    >
      <Segmentado
        rotulo="Origem do exercício"
        valor={modo}
        aoMudar={setModo}
        opcoes={[{ valor: "catalogo", rotulo: "Da lista" }, { valor: "novo", rotulo: "Criar novo" }]}
      />

      {modo === "catalogo" ? (
        <>
          <Campo rotulo="Buscar" className="mb-2" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="supino, remada…" />
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {catalogo.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEscolhido(e.id)}
                className="w-full text-left p-2 mb-1 flex items-center justify-between gap-2"
                style={{
                  background: escolhido === e.id ? "var(--sup3)" : "var(--sup2)",
                  borderRadius: 3,
                  minHeight: "var(--toque)",
                  border: `1px solid ${escolhido === e.id ? "var(--acento)" : "transparent"}`,
                }}
              >
                <span className="text-sm truncate">{e.nome}</span>
                <Etiqueta>{e.grupoPrincipal}</Etiqueta>
              </button>
            ))}
            {catalogo.length === 0 && (
              <p className="text-xs" style={{ color: "var(--txt-fraco)" }}>Nada encontrado. Crie um novo na outra aba.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <Campo rotulo="Nome" className="mb-2" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <Selecao rotulo="Grupo principal" className="mb-2" value={novo.grupoPrincipal}
            onChange={(e) => setNovo({ ...novo, grupoPrincipal: e.target.value })}
            opcoes={GRUPOS_MUSCULARES.map((g) => ({ valor: g, rotulo: g }))} />
          <Selecao rotulo="Equipamento" className="mb-2" value={novo.equipamento}
            onChange={(e) => setNovo({ ...novo, equipamento: e.target.value })}
            opcoes={EQUIPAMENTOS.map((g) => ({ valor: g, rotulo: g }))} />
          <Selecao rotulo="Tipo de registro" value={novo.tipoRegistro}
            onChange={(e) => setNovo({ ...novo, tipoRegistro: e.target.value })}
            opcoes={Object.entries(TIPOS_REGISTRO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        </>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------- editor do exercício */

function EditorExercicio({ fichaId, fichaExercicioId, aoFechar }) {
  const estado = useEstado();
  const despacha = useAcao();

  const ficha = estado.fichas.find((f) => f.id === fichaId);
  const fe = ficha?.exercicios.find((x) => x.id === fichaExercicioId);
  const base = estado.exercicios.find((e) => e.id === fe?.exercicioId);
  if (!fe) return null;

  const muda = (mudancas) =>
    despacha({ tipo: "FICHA_EXERCICIO_ATUALIZADO", fichaId, fichaExercicioId, exercicioId: fe.exercicioId, mudancas });
  const mudaBase = (mudancas) => despacha({ tipo: "EXERCICIO_ATUALIZADO", exercicioId: fe.exercicioId, mudancas });

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo="Exercício"
      larguraMax={520}
      rodape={<Botao variante="primario" larguraTotal onClick={aoFechar}>Pronto</Botao>}
    >
      <Campo rotulo="Nome" className="mb-3" value={fe.nomeSnapshot} onChange={(e) => muda({ nomeSnapshot: e.target.value })} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Selecao rotulo="Grupo principal" value={base?.grupoPrincipal || "Corpo inteiro"}
          onChange={(e) => mudaBase({ grupoPrincipal: e.target.value })}
          opcoes={GRUPOS_MUSCULARES.map((g) => ({ valor: g, rotulo: g }))} />
        <Selecao rotulo="Equipamento" value={base?.equipamento || "Outro"}
          onChange={(e) => mudaBase({ equipamento: e.target.value })}
          opcoes={EQUIPAMENTOS.map((g) => ({ valor: g, rotulo: g }))} />
      </div>

      <Selecao rotulo="Tipo de registro" className="mb-3" value={base?.tipoRegistro || "peso_reps"}
        onChange={(e) => mudaBase({ tipoRegistro: e.target.value })}
        opcoes={Object.entries(TIPOS_REGISTRO).map(([valor, rotulo]) => ({ valor, rotulo }))} />

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Campo rotulo="Séries" type="number" inputMode="numeric" min="1" value={fe.series}
          onChange={(e) => muda({ series: paraInteiroPositivo(e.target.value) ?? 1 })} />
        <Campo rotulo="Reps mín." type="number" inputMode="numeric" min="0" value={fe.repsMin ?? ""}
          onChange={(e) => muda({ repsMin: paraNumeroPositivo(e.target.value) })} />
        <Campo rotulo="Reps máx." type="number" inputMode="numeric" min="0" value={fe.repsMax ?? ""}
          onChange={(e) => muda({ repsMax: paraNumeroPositivo(e.target.value) })} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Selecao
          rotulo="Incremento de carga"
          value={INCREMENTOS.includes(fe.incrementoKg) ? String(fe.incrementoKg) : "custom"}
          onChange={(e) => {
            if (e.target.value === "custom") return;
            muda({ incrementoKg: Number(e.target.value) });
          }}
        >
          {INCREMENTOS.map((v) => (
            <option key={v} value={String(v)} style={{ background: "var(--sup)" }}>
              {v === 0 ? "Sem incremento" : `${String(v).replace(".", ",")} kg`}
            </option>
          ))}
          <option value="custom" style={{ background: "var(--sup)" }}>Personalizado</option>
        </Selecao>
        <Campo rotulo="Incremento (kg)" type="number" inputMode="decimal" step="any" min="0" value={fe.incrementoKg}
          onChange={(e) => muda({ incrementoKg: paraNumeroPositivo(e.target.value) ?? 0 })} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Campo rotulo="Descanso (s)" type="number" inputMode="numeric" min="0" value={fe.descansoSegundos}
          onChange={(e) => muda({ descansoSegundos: paraInteiroPositivo(e.target.value) ?? 0 })} />
        <Campo rotulo="RIR alvo" type="number" inputMode="numeric" min="0" max="10" value={fe.rirAlvo ?? ""}
          onChange={(e) => muda({ rirAlvo: paraNumeroPositivo(e.target.value) })} />
        <Campo rotulo="RPE alvo" type="number" inputMode="numeric" min="1" max="10" value={fe.rpeAlvo ?? ""}
          onChange={(e) => muda({ rpeAlvo: paraNumeroPositivo(e.target.value) })} />
      </div>

      <Campo rotulo="Carga inicial (kg, opcional)" className="mb-3" type="number" inputMode="decimal" step="any" min="0"
        value={fe.cargaInicialKg ?? ""} onChange={(e) => muda({ cargaInicialKg: paraNumeroPositivo(e.target.value) })} />

      <Campo rotulo="Supersérie (mesmo código junta exercícios)" className="mb-3" value={fe.supersetId ?? ""}
        ajuda="Deixe vazio se não usa. Exercícios com o mesmo código são feitos em sequência."
        onChange={(e) => muda({ supersetId: e.target.value || null })} />

      <CampoTexto rotulo="Observação na ficha" className="mb-3" value={fe.observacao}
        onChange={(e) => muda({ observacao: e.target.value })} />

      <CampoTexto rotulo="Instruções do exercício" value={base?.instrucoes || ""}
        onChange={(e) => mudaBase({ instrucoes: e.target.value })}
        placeholder="Como executar, pegada, amplitude…" />
    </Modal>
  );
}
