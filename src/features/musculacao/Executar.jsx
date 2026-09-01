import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Minus, Repeat, StickyNote, Trophy } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { fichasAtivas, planoDoDia } from "../../lib/agenda.js";
import {
  sugereProgressao, ultimaExecucao, volumeSessao, seriesConcluidas, recordesPorExercicio, formataDuracao,
} from "../../lib/calculos.js";
import { paraNumero, formataNumero } from "../../lib/numbers.js";
import { segundosEntre, agoraIso } from "../../lib/dates.js";
import { useCronometroDescanso } from "../../hooks/useCronometroDescanso.js";

import Botao from "../../components/Botao.jsx";
import { Cartao, EstadoVazio, Aviso, Metrica } from "../../components/Basicos.jsx";
import { CampoTexto, Selecao } from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import LinhaSerie, { CabecalhoSeries } from "./LinhaSerie.jsx";
import Cronometro from "./Cronometro.jsx";

export default function Executar({ irPara }) {
  const estado = useEstado();
  const despacha = useAcao();
  const sessao = estado.sessaoEmAndamento;

  if (!sessao) return <SemSessao estado={estado} despacha={despacha} irPara={irPara} />;
  return <SessaoAberta estado={estado} despacha={despacha} sessao={sessao} />;
}

/* ------------------------------------------------------------ sem sessão */

function SemSessao({ estado, despacha, irPara }) {
  const ativas = fichasAtivas(estado);
  const plano = planoDoDia(estado);

  if (!ativas.length) {
    return (
      <EstadoVazio
        titulo="Nenhuma ficha ativa"
        texto="Crie uma ficha com seus exercícios para poder registrar um treino. Você pode começar do zero ou reativar uma ficha arquivada."
        acao={<Botao variante="primario" onClick={() => irPara && irPara("ajustes")}>Ir para as fichas</Botao>}
      />
    );
  }

  return (
    <div>
      {plano.ficha && (
        <Cartao cor={plano.ficha.cor} className="mb-4">
          <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Próximo treino</div>
          <div className="text-lg mt-1" style={{ fontWeight: 600 }}>
            {plano.ficha.divisao} · {plano.ficha.nome}
          </div>
          <p className="text-xs mt-1 mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
            {plano.motivo}
          </p>
          {plano.sugereAdiar && (
            <Aviso tipo="atencao">
              Hoje é dia de trabalho na sua escala. Dá para treinar mesmo assim — é só uma indicação.
            </Aviso>
          )}
          <Botao
            variante="primario"
            larguraTotal
            onClick={() => despacha({ tipo: "SESSAO_INICIADA", fichaId: plano.ficha.id })}
          >
            Iniciar treino
          </Botao>
        </Cartao>
      )}

      <div className="text-sm mt-4 mb-2" style={{ fontWeight: 600 }}>Começar outra ficha</div>
      <p className="text-xs mb-3" style={{ color: "var(--txt-fraco)" }}>
        A sequência é sugestão. Comece a que fizer sentido hoje.
      </p>
      {ativas.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => despacha({ tipo: "SESSAO_INICIADA", fichaId: f.id })}
          className="w-full text-left mb-2 p-3 flex items-center justify-between gap-3"
          style={{ background: "var(--sup)", borderRadius: "var(--raio)", borderLeft: `3px solid ${f.cor}`, minHeight: "var(--toque)" }}
        >
          <div className="min-w-0">
            <div className="text-sm" style={{ fontWeight: 500 }}>{f.divisao} · {f.nome}</div>
            <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
              {f.exercicios.length} exercícios · {f.exercicios.reduce((s, e) => s + (e.series || 0), 0)} séries
            </div>
          </div>
          <Plus size={16} style={{ color: "var(--txt-fraco)", flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- sessão aberta */

function SessaoAberta({ estado, despacha, sessao }) {
  const cronometro = useCronometroDescanso({ vibrar: estado.configuracoes.vibrar });
  const [confirmacao, setConfirmacao] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [abertos, setAbertos] = useState(() => new Set([0]));

  const totalSeries = sessao.exercicios.reduce((s, e) => s + e.series.length, 0);
  const feitas = seriesConcluidas(sessao);
  const duracao = sessao.iniciadaEm ? segundosEntre(sessao.iniciadaEm, agoraIso()) : null;

  const alterna = (i) =>
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(i)) novo.delete(i);
      else novo.add(i);
      return novo;
    });

  const finalizar = () => {
    const incompletas = totalSeries - feitas;
    if (feitas === 0) {
      setConfirmacao({
        titulo: "Descartar este treino?",
        texto: "Nenhuma série foi marcada como feita, então não há o que salvar.",
        acao: "Descartar",
        aoConfirmar: () => despacha({ tipo: "SESSAO_DESCARTADA" }),
      });
      return;
    }
    if (incompletas > 0) {
      setConfirmacao({
        titulo: "Finalizar com séries em aberto?",
        texto: `${incompletas} série(s) começaram e não foram marcadas como feitas. Elas não entram no histórico.`,
        acao: "Finalizar mesmo assim",
        aoConfirmar: () => salvar(),
      });
      return;
    }
    salvar();
  };

  const salvar = () => {
    const recordesAntes = recordesPorExercicio(estado.sessoesMusculacao);
    const antes = new Map(recordesAntes.map((r) => [r.exercicioId, r.maiorCarga]));
    const novos = [];
    sessao.exercicios.forEach((ex) => {
      const cargas = ex.series
        .filter((s) => s.concluida && s.tipo !== "aquecimento")
        .map((s) => paraNumero(s.cargaKg))
        .filter((n) => n !== null);
      if (!cargas.length) return;
      const maior = Math.max(...cargas);
      const anterior = antes.get(ex.exercicioId);
      if (anterior === undefined || maior > anterior) {
        novos.push({ nome: ex.nomeSnapshot, carga: maior, anterior: anterior ?? null });
      }
    });

    setResumo({
      volume: volumeSessao({ ...sessao, exercicios: sessao.exercicios.map((e) => ({ ...e, series: e.series.filter((s) => s.concluida) })) }),
      series: feitas,
      exercicios: sessao.exercicios.filter((e) => e.series.some((s) => s.concluida)).length,
      duracao,
      recordes: novos,
    });
    cronometro.dispensar();
    despacha({ tipo: "SESSAO_FINALIZADA" });
  };

  return (
    <div>
      <Cartao className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Treino em andamento</div>
            <div className="text-base mt-1" style={{ fontWeight: 600 }}>
              {sessao.divisaoSnapshot} · {sessao.fichaNomeSnapshot}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{feitas}/{totalSeries}</div>
            <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>séries</div>
          </div>
        </div>
      </Cartao>

      {sessao.exercicios.map((ex, i) => (
        <ExercicioDaSessao
          key={`${ex.exercicioId}-${i}`}
          estado={estado}
          despacha={despacha}
          sessao={sessao}
          ex={ex}
          indice={i}
          aberto={abertos.has(i)}
          aoAlternar={() => alterna(i)}
          cronometro={cronometro}
        />
      ))}

      <CampoTexto
        rotulo="Como foi o treino (opcional)"
        className="mt-4 mb-3"
        value={sessao.observacao}
        onChange={(e) => despacha({ tipo: "SESSAO_ANOTADA", observacao: e.target.value })}
        placeholder="Dormiu mal, academia cheia, dor no ombro…"
      />

      <div className="flex gap-2 mb-4">
        <Botao
          variante="fantasma"
          larguraTotal
          onClick={() =>
            setConfirmacao({
              titulo: "Descartar treino em andamento?",
              texto: "Tudo que você registrou nesta sessão é perdido. O histórico anterior não é afetado.",
              acao: "Descartar",
              aoConfirmar: () => {
                cronometro.dispensar();
                despacha({ tipo: "SESSAO_DESCARTADA" });
              },
            })
          }
        >
          Descartar
        </Botao>
        <Botao variante="primario" larguraTotal onClick={finalizar}>
          <Check size={16} /> Finalizar treino
        </Botao>
      </div>

      <Cronometro cronometro={cronometro} />
      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
      <ResumoDaSessao resumo={resumo} aoFechar={() => setResumo(null)} />
    </div>
  );
}

/* --------------------------------------------- um exercício da sessão */

function ExercicioDaSessao({ estado, despacha, sessao, ex, indice, aberto, aoAlternar, cronometro }) {
  const [anotando, setAnotando] = useState(false);
  const [substituindo, setSubstituindo] = useState(false);

  const anterior = useMemo(
    () => ultimaExecucao(estado.sessoesMusculacao, ex.exercicioId, sessao.id),
    [estado.sessoesMusculacao, ex.exercicioId, sessao.id],
  );

  /* A prescrição vem do snapshot da própria sessão: mudar a ficha no meio do
     treino não pode alterar a sugestão que está na tela. */
  const sugestao = useMemo(
    () =>
      sugereProgressao(
        { repsMin: ex.repsMinSnapshot, repsMax: ex.repsMaxSnapshot, incrementoKg: ex.incrementoKgSnapshot },
        anterior ? anterior.exercicio : null,
      ),
    [anterior, ex.repsMinSnapshot, ex.repsMaxSnapshot, ex.incrementoKgSnapshot],
  );

  const feitas = ex.series.filter((s) => s.concluida).length;
  const preencheTodas = () => {
    if (sugestao?.cargaSugerida === null || sugestao?.cargaSugerida === undefined) return;
    ex.series.forEach((_, j) =>
      despacha({
        tipo: "SESSAO_SERIE_ATUALIZADA",
        indiceExercicio: indice,
        indiceSerie: j,
        mudancas: { cargaKg: sugestao.cargaSugerida },
      }),
    );
  };

  return (
    <div className="mb-2" style={{ background: "var(--sup)", borderRadius: "var(--raio)" }}>
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberto}
        className="w-full flex items-center justify-between gap-2 p-3 text-left"
        style={{ minHeight: "var(--toque)" }}
      >
        <div className="min-w-0">
          <div className="text-sm" style={{ fontWeight: 500 }}>{ex.nomeSnapshot}</div>
          <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
            {ex.series.length} × {ex.repsMinSnapshot ?? "?"}
            {ex.repsMaxSnapshot && ex.repsMaxSnapshot !== ex.repsMinSnapshot ? `-${ex.repsMaxSnapshot}` : ""}
            {feitas > 0 && ` · ${feitas} feita(s)`}
          </div>
        </div>
        <ChevronDown
          size={16}
          style={{ color: "var(--txt-fraco)", flexShrink: 0, transform: aberto ? "rotate(180deg)" : "none" }}
        />
      </button>

      {aberto && (
        <div className="px-3 pb-3">
          {sugestao && sugestao.tipo !== "sem_dados" && (
            <div className="text-xs mb-2 p-2" style={{ background: "var(--sup2)", borderRadius: 3, lineHeight: 1.5 }}>
              <strong>{sugestao.tipo === "subir" ? "Sugestão: subir para " : "Sugestão: repetir "}
              {formataNumero(sugestao.cargaSugerida)} kg.</strong>{" "}
              <span style={{ color: "var(--txt-fraco)" }}>{sugestao.motivo}</span>
            </div>
          )}
          {sugestao && sugestao.tipo === "sem_dados" && (
            <div className="text-xs mb-2" style={{ color: "var(--txt-apagado)" }}>{sugestao.motivo}</div>
          )}

          <CabecalhoSeries mostraCarga={ex.tipoRegistroSnapshot !== "tempo"} />
          {ex.series.map((serie, j) => (
            <LinhaSerie
              key={serie.id}
              serie={serie}
              indice={j}
              nomeExercicio={ex.nomeSnapshot}
              anterior={anterior ? anterior.exercicio.series[j] : null}
              sugestaoCarga={sugestao?.cargaSugerida}
              repsAlvo={ex.repsMaxSnapshot}
              mostraCarga={ex.tipoRegistroSnapshot !== "tempo"}
              exibirRpe={estado.configuracoes.exibirRpe}
              exibirRir={estado.configuracoes.exibirRir}
              aoMudar={(mudancas) =>
                despacha({ tipo: "SESSAO_SERIE_ATUALIZADA", indiceExercicio: indice, indiceSerie: j, mudancas })
              }
              aoAlternarConcluida={(concluida) => {
                despacha({
                  tipo: "SESSAO_SERIE_ATUALIZADA",
                  indiceExercicio: indice,
                  indiceSerie: j,
                  mudancas: { concluida },
                });
                if (concluida) cronometro.iniciar(ex.descansoSegundosSnapshot || estado.configuracoes.descansoPadraoSegundos);
              }}
            />
          ))}

          <div className="flex flex-wrap gap-2 mt-2">
            <Botao compacto onClick={() => despacha({ tipo: "SESSAO_SERIE_ADICIONADA", indiceExercicio: indice })}>
              <Plus size={14} /> Série
            </Botao>
            <Botao
              compacto
              disabled={ex.series.length <= 1}
              onClick={() =>
                despacha({ tipo: "SESSAO_SERIE_REMOVIDA", indiceExercicio: indice, indiceSerie: ex.series.length - 1 })
              }
            >
              <Minus size={14} /> Série
            </Botao>
            {estado.configuracoes.preencherAnterior && sugestao?.cargaSugerida != null && (
              <Botao compacto onClick={preencheTodas}>
                Preencher tudo com {formataNumero(sugestao.cargaSugerida)} kg
              </Botao>
            )}
            <Botao compacto onClick={() => setSubstituindo(true)}>
              <Repeat size={14} /> Trocar
            </Botao>
            <Botao compacto onClick={() => setAnotando(true)}>
              <StickyNote size={14} /> Nota
            </Botao>
          </div>

          {ex.observacao && (
            <div className="text-xs mt-2 p-2" style={{ background: "var(--sup2)", borderRadius: 3, color: "var(--txt-fraco)" }}>
              {ex.observacao}
            </div>
          )}
        </div>
      )}

      <Modal
        aberto={anotando}
        aoFechar={() => setAnotando(false)}
        titulo="Nota do exercício"
        descricao={ex.nomeSnapshot}
        rodape={<Botao variante="primario" larguraTotal onClick={() => setAnotando(false)}>Pronto</Botao>}
      >
        <CampoTexto
          rotulo="Observação"
          value={ex.observacao}
          onChange={(e) =>
            despacha({ tipo: "SESSAO_EXERCICIO_ANOTADO", indiceExercicio: indice, observacao: e.target.value })
          }
          placeholder="Aparelho ocupado, troquei o pegador, ombro incomodou…"
        />
      </Modal>

      <TrocaExercicio
        aberto={substituindo}
        aoFechar={() => setSubstituindo(false)}
        estado={estado}
        despacha={despacha}
        indice={indice}
        atual={ex}
      />
    </div>
  );
}

function TrocaExercicio({ aberto, aoFechar, estado, despacha, indice, atual }) {
  const [escolhido, setEscolhido] = useState("");
  const [tambemNaFicha, setTambemNaFicha] = useState(false);

  const opcoes = estado.exercicios
    .filter((e) => !e.arquivado && e.id !== atual.exercicioId)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Trocar exercício"
      descricao={`Substituindo ${atual.nomeSnapshot}. As séries já registradas neste exercício são limpas.`}
      rodape={
        <>
          <Botao variante="fantasma" larguraTotal onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            larguraTotal
            disabled={!escolhido}
            onClick={() => {
              despacha({
                tipo: "SESSAO_EXERCICIO_SUBSTITUIDO",
                indiceExercicio: indice,
                novoExercicioId: escolhido,
                atualizarFicha: tambemNaFicha,
              });
              aoFechar();
            }}
          >
            Trocar
          </Botao>
        </>
      }
    >
      <Selecao
        rotulo="Novo exercício"
        value={escolhido}
        onChange={(e) => setEscolhido(e.target.value)}
        className="mb-3"
      >
        <option value="">Escolha…</option>
        {opcoes.map((e) => (
          <option key={e.id} value={e.id} style={{ background: "var(--sup)" }}>
            {e.nome}
          </option>
        ))}
      </Selecao>

      <label className="flex items-center gap-2 text-sm" style={{ minHeight: "var(--toque)" }}>
        <input
          type="checkbox"
          checked={tambemNaFicha}
          onChange={(e) => setTambemNaFicha(e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        Atualizar também a ficha, não só este treino
      </label>
    </Modal>
  );
}

/* ------------------------------------------------------------- resumo */

function ResumoDaSessao({ resumo, aoFechar }) {
  if (!resumo) return null;
  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo="Treino salvo"
      rodape={<Botao variante="primario" larguraTotal onClick={aoFechar}>Fechar</Botao>}
    >
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Metrica rotulo="Exercícios" valor={resumo.exercicios} />
        <Metrica rotulo="Séries feitas" valor={resumo.series} />
        <Metrica rotulo="Volume" valor={`${formataNumero(resumo.volume, 0)} kg`} detalhe="carga × repetições" />
        <Metrica rotulo="Duração" valor={resumo.duracao ? formataDuracao(resumo.duracao) : "—"} />
      </div>

      {resumo.recordes.length > 0 && (
        <div>
          <div className="text-sm mb-2 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Trophy size={15} style={{ color: "var(--aviso)" }} /> Recordes de carga
          </div>
          {resumo.recordes.map((r) => (
            <div key={r.nome} className="text-xs mb-1" style={{ color: "var(--txt-fraco)" }}>
              <span style={{ color: "var(--txt)" }}>{r.nome}</span>: {formataNumero(r.carga)} kg
              {r.anterior !== null && ` (antes ${formataNumero(r.anterior)} kg)`}
            </div>
          ))}
          <div className="text-xs mt-2" style={{ color: "var(--txt-apagado)" }}>
            Recorde aqui é a maior carga registrada numa série de trabalho, não estimativa de 1RM.
          </div>
        </div>
      )}
    </Modal>
  );
}
