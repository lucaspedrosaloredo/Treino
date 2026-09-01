/* Reducer do app. Função pura: estado + ação -> estado novo. Persistir é
   trabalho do provider, não daqui — é isso que deixa cada regra testável sem
   navegador. */

import { agoraIso, hoje, dataDeIso } from "../lib/dates.js";
import { novoId } from "../lib/ids.js";
import {
  criaFicha, criaFichaExercicio, criaExercicio, criaSerie, criaSessaoMusculacao,
  criaCorrida, criaPesagem, criaPlanoCorrida, criaSemanaCorrida, criaSessaoPlanejada,
  CORES_DIVISAO,
} from "../lib/schema.js";
import { normalizaV2 } from "../lib/migrations.js";

/* ------------------------------------------------------------ ajudantes */

const substitui = (lista, id, muda) => lista.map((item) => (item.id === id ? muda(item) : item));
const remove = (lista, id) => lista.filter((item) => item.id !== id);

/** Move um item da lista e reescreve o campo `ordem` de todos. */
function moveEReordena(lista, id, direcao) {
  const ordenada = [...lista].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const i = ordenada.findIndex((x) => x.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= ordenada.length) return lista;
  [ordenada[i], ordenada[j]] = [ordenada[j], ordenada[i]];
  return ordenada.map((item, ordem) => ({ ...item, ordem }));
}

function comCarimbo(estado) {
  return { ...estado, metadados: { ...estado.metadados, atualizadoEm: agoraIso() } };
}

/** Próxima letra livre para uma divisão nova: A, B, ... Z, depois numera. */
export function proximaDivisao(fichas) {
  const usadas = new Set(fichas.map((f) => f.divisao));
  for (let i = 0; i < 26; i += 1) {
    const letra = String.fromCharCode(65 + i);
    if (!usadas.has(letra)) return letra;
  }
  return `F${fichas.length + 1}`;
}

/* Monta a sessão a partir da ficha, congelando nome e grupo no momento do
   treino. É o que faz o histórico continuar certo depois que a ficha mudar. */
export function montaSessaoDaFicha(estado, ficha) {
  const exercicios = [...ficha.exercicios]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((fe, ordem) => {
      const base = estado.exercicios.find((e) => e.id === fe.exercicioId);
      return {
        exercicioId: fe.exercicioId,
        fichaExercicioId: fe.id,
        nomeSnapshot: fe.nomeSnapshot || base?.nome || "Exercício",
        grupoPrincipalSnapshot: base?.grupoPrincipal || "Corpo inteiro",
        tipoRegistroSnapshot: base?.tipoRegistro || "peso_reps",
        repsMinSnapshot: fe.repsMin,
        repsMaxSnapshot: fe.repsMax,
        incrementoKgSnapshot: fe.incrementoKg,
        descansoSegundosSnapshot: fe.descansoSegundos,
        ordem,
        observacao: "",
        series: Array.from({ length: Math.max(1, fe.series || 1) }).map((_, i) =>
          criaSerie({ numero: i + 1, tipo: "trabalho", concluida: false }),
        ),
      };
    });

  return criaSessaoMusculacao({
    fichaId: ficha.id,
    fichaNomeSnapshot: ficha.nome,
    divisaoSnapshot: ficha.divisao,
    data: hoje(),
    iniciadaEm: agoraIso(),
    status: "andamento",
    exercicios,
  });
}

function mudaSessaoAtual(estado, muda) {
  if (!estado.sessaoEmAndamento) return estado;
  return { ...estado, sessaoEmAndamento: muda(estado.sessaoEmAndamento) };
}

function mudaExercicioDaSessao(sessao, indiceExercicio, muda) {
  return {
    ...sessao,
    exercicios: sessao.exercicios.map((ex, i) => (i === indiceExercicio ? muda(ex) : ex)),
  };
}

/* ------------------------------------------------------------- reducer */

export function reducer(estado, acao) {
  switch (acao.tipo) {
    /* ------------------------------------------------------ geral */
    case "ESTADO_SUBSTITUIDO":
      return comCarimbo(normalizaV2(acao.estado));

    case "CONFIG_ALTERADA":
      return comCarimbo({
        ...estado,
        configuracoes: { ...estado.configuracoes, ...acao.mudancas },
      });

    case "PERFIL_ALTERADO":
      return comCarimbo({ ...estado, perfil: { ...estado.perfil, ...acao.mudancas } });

    /* ------------------------------------------------------ fichas */
    case "FICHA_CRIADA": {
      const divisao = acao.divisao || proximaDivisao(estado.fichas);
      const ficha = criaFicha({
        divisao,
        nome: acao.nome || `Ficha ${divisao}`,
        cor: CORES_DIVISAO[estado.fichas.length % CORES_DIVISAO.length],
        ordem: estado.fichas.length,
        exercicios: [],
      });
      return comCarimbo({ ...estado, fichas: [...estado.fichas, ficha] });
    }

    case "FICHA_ATUALIZADA":
      return comCarimbo({
        ...estado,
        fichas: substitui(estado.fichas, acao.fichaId, (f) => ({ ...f, ...acao.mudancas })),
      });

    case "FICHA_DUPLICADA": {
      const original = estado.fichas.find((f) => f.id === acao.fichaId);
      if (!original) return estado;
      const divisao = proximaDivisao(estado.fichas);
      const copia = criaFicha({
        ...original,
        id: novoId(),
        divisao,
        nome: `${original.nome} (cópia)`,
        ordem: estado.fichas.length,
        arquivada: false,
        /* Cada exercício da cópia ganha id próprio: editar a cópia não pode
           mexer na ficha de origem. */
        exercicios: original.exercicios.map((fe) => criaFichaExercicio({ ...fe, id: novoId() })),
      });
      return comCarimbo({ ...estado, fichas: [...estado.fichas, copia] });
    }

    case "FICHA_REMOVIDA":
      /* O histórico não é tocado: as sessões guardam snapshot próprio e
         continuam legíveis mesmo sem a ficha de origem. */
      return comCarimbo({ ...estado, fichas: remove(estado.fichas, acao.fichaId) });

    case "FICHA_MOVIDA":
      return comCarimbo({ ...estado, fichas: moveEReordena(estado.fichas, acao.fichaId, acao.direcao) });

    /* ------------------------------------ exercícios dentro da ficha */
    case "FICHA_EXERCICIO_ADICIONADO": {
      const exercicioBase = acao.exercicio
        ? criaExercicio(acao.exercicio)
        : criaExercicio({ nome: "Novo exercício" });
      const jaExiste = estado.exercicios.some((e) => e.id === exercicioBase.id);
      return comCarimbo({
        ...estado,
        exercicios: jaExiste ? estado.exercicios : [...estado.exercicios, exercicioBase],
        fichas: substitui(estado.fichas, acao.fichaId, (f) => ({
          ...f,
          exercicios: [
            ...f.exercicios,
            criaFichaExercicio({
              exercicioId: exercicioBase.id,
              nomeSnapshot: exercicioBase.nome,
              ordem: f.exercicios.length,
              incrementoKg: estado.configuracoes.incrementoPadrao,
              descansoSegundos: estado.configuracoes.descansoPadraoSegundos,
              ...acao.prescricao,
            }),
          ],
        })),
      });
    }

    case "FICHA_EXERCICIO_ATUALIZADO":
      return comCarimbo({
        ...estado,
        /* Renomear na ficha renomeia também no catálogo, para o nome não
           divergir entre as duas listas. */
        exercicios: acao.mudancas.nomeSnapshot
          ? substitui(estado.exercicios, acao.exercicioId, (e) => ({ ...e, nome: acao.mudancas.nomeSnapshot }))
          : estado.exercicios,
        fichas: substitui(estado.fichas, acao.fichaId, (f) => ({
          ...f,
          exercicios: substitui(f.exercicios, acao.fichaExercicioId, (fe) => ({ ...fe, ...acao.mudancas })),
        })),
      });

    case "FICHA_EXERCICIO_REMOVIDO":
      return comCarimbo({
        ...estado,
        fichas: substitui(estado.fichas, acao.fichaId, (f) => ({
          ...f,
          exercicios: remove(f.exercicios, acao.fichaExercicioId).map((fe, ordem) => ({ ...fe, ordem })),
        })),
      });

    case "FICHA_EXERCICIO_MOVIDO":
      return comCarimbo({
        ...estado,
        fichas: substitui(estado.fichas, acao.fichaId, (f) => ({
          ...f,
          exercicios: moveEReordena(f.exercicios, acao.fichaExercicioId, acao.direcao),
        })),
      });

    case "EXERCICIO_ATUALIZADO":
      return comCarimbo({
        ...estado,
        exercicios: substitui(estado.exercicios, acao.exercicioId, (e) => ({ ...e, ...acao.mudancas })),
      });

    /* ------------------------------------------- sessão em andamento */
    case "SESSAO_INICIADA": {
      const ficha = estado.fichas.find((f) => f.id === acao.fichaId);
      if (!ficha) return estado;
      return comCarimbo({ ...estado, sessaoEmAndamento: montaSessaoDaFicha(estado, ficha) });
    }

    case "SESSAO_SERIE_ATUALIZADA":
      return comCarimbo(
        mudaSessaoAtual(estado, (sessao) =>
          mudaExercicioDaSessao(sessao, acao.indiceExercicio, (ex) => ({
            ...ex,
            series: ex.series.map((s, i) => (i === acao.indiceSerie ? { ...s, ...acao.mudancas } : s)),
          })),
        ),
      );

    case "SESSAO_SERIE_ADICIONADA":
      return comCarimbo(
        mudaSessaoAtual(estado, (sessao) =>
          mudaExercicioDaSessao(sessao, acao.indiceExercicio, (ex) => ({
            ...ex,
            series: [...ex.series, criaSerie({ numero: ex.series.length + 1, tipo: "trabalho" })],
          })),
        ),
      );

    case "SESSAO_SERIE_REMOVIDA":
      return comCarimbo(
        mudaSessaoAtual(estado, (sessao) =>
          mudaExercicioDaSessao(sessao, acao.indiceExercicio, (ex) => ({
            ...ex,
            series: ex.series
              .filter((_, i) => i !== acao.indiceSerie)
              .map((s, i) => ({ ...s, numero: i + 1 })),
          })),
        ),
      );

    case "SESSAO_EXERCICIO_ANOTADO":
      return comCarimbo(
        mudaSessaoAtual(estado, (sessao) =>
          mudaExercicioDaSessao(sessao, acao.indiceExercicio, (ex) => ({ ...ex, observacao: acao.observacao })),
        ),
      );

    case "SESSAO_EXERCICIO_SUBSTITUIDO": {
      /* Trocar só nesta sessão ou também na ficha — a escolha é de quem treina,
         e o padrão é não mexer na ficha. */
      const novoBase = estado.exercicios.find((e) => e.id === acao.novoExercicioId);
      if (!novoBase) return estado;
      const comSessao = mudaSessaoAtual(estado, (sessao) =>
        mudaExercicioDaSessao(sessao, acao.indiceExercicio, (ex) => ({
          ...ex,
          exercicioId: novoBase.id,
          nomeSnapshot: novoBase.nome,
          grupoPrincipalSnapshot: novoBase.grupoPrincipal,
          series: ex.series.map((s) => ({ ...s, cargaKg: null, repeticoes: null, concluida: false })),
        })),
      );
      if (!acao.atualizarFicha) return comCarimbo(comSessao);
      const alvo = estado.sessaoEmAndamento.exercicios[acao.indiceExercicio];
      return comCarimbo({
        ...comSessao,
        fichas: substitui(comSessao.fichas, comSessao.sessaoEmAndamento.fichaId, (f) => ({
          ...f,
          exercicios: substitui(f.exercicios, alvo.fichaExercicioId, (fe) => ({
            ...fe,
            exercicioId: novoBase.id,
            nomeSnapshot: novoBase.nome,
          })),
        })),
      });
    }

    case "SESSAO_ANOTADA":
      return comCarimbo(mudaSessaoAtual(estado, (s) => ({ ...s, observacao: acao.observacao })));

    case "SESSAO_FINALIZADA": {
      const sessao = estado.sessaoEmAndamento;
      if (!sessao) return estado;
      const finalizadaEm = agoraIso();
      /* Só entra no histórico o que foi efetivamente marcado como feito. */
      const exercicios = sessao.exercicios
        .map((ex) => ({ ...ex, series: ex.series.filter((s) => s.concluida) }))
        .filter((ex) => ex.series.length > 0);

      if (!exercicios.length) return comCarimbo({ ...estado, sessaoEmAndamento: null });

      const concluida = {
        ...sessao,
        exercicios,
        finalizadaEm,
        data: dataDeIso(sessao.iniciadaEm) || hoje(),
        duracaoSegundos: sessao.iniciadaEm
          ? Math.max(0, Math.round((new Date(finalizadaEm) - new Date(sessao.iniciadaEm)) / 1000))
          : null,
        status: "concluida",
      };
      return comCarimbo({
        ...estado,
        sessoesMusculacao: [...estado.sessoesMusculacao, concluida],
        sessaoEmAndamento: null,
      });
    }

    case "SESSAO_DESCARTADA":
      return comCarimbo({ ...estado, sessaoEmAndamento: null });

    /* ------------------------------------------ histórico de sessões */
    case "SESSAO_HISTORICO_ATUALIZADA":
      return comCarimbo({
        ...estado,
        sessoesMusculacao: substitui(estado.sessoesMusculacao, acao.sessaoId, (s) => ({ ...s, ...acao.mudancas })),
      });

    case "SESSAO_HISTORICO_SERIE_ATUALIZADA":
      return comCarimbo({
        ...estado,
        sessoesMusculacao: substitui(estado.sessoesMusculacao, acao.sessaoId, (s) => ({
          ...s,
          exercicios: s.exercicios.map((ex, i) =>
            i !== acao.indiceExercicio
              ? ex
              : { ...ex, series: ex.series.map((serie, j) => (j === acao.indiceSerie ? { ...serie, ...acao.mudancas } : serie)) },
          ),
        })),
      });

    case "SESSAO_HISTORICO_REMOVIDA":
      return comCarimbo({ ...estado, sessoesMusculacao: remove(estado.sessoesMusculacao, acao.sessaoId) });

    /* ---------------------------------------------------- pesagens */
    case "PESAGEM_REGISTRADA": {
      const semAData = estado.pesagens.filter((p) => p.data !== acao.data);
      return comCarimbo({
        ...estado,
        pesagens: [...semAData, criaPesagem({ data: acao.data, pesoKg: acao.pesoKg })].sort((a, b) =>
          a.data.localeCompare(b.data),
        ),
      });
    }

    case "PESAGEM_ATUALIZADA":
      return comCarimbo({
        ...estado,
        pesagens: substitui(estado.pesagens, acao.pesagemId, (p) => ({ ...p, ...acao.mudancas })).sort((a, b) =>
          String(a.data).localeCompare(String(b.data)),
        ),
      });

    case "PESAGEM_REMOVIDA":
      return comCarimbo({ ...estado, pesagens: remove(estado.pesagens, acao.pesagemId) });

    /* ------------------------------------------------ planos de corrida */
    case "PLANO_CRIADO": {
      const plano = criaPlanoCorrida({
        ...acao.plano,
        id: novoId(),
        ativo: estado.planosCorrida.every((p) => !p.ativo),
      });
      return comCarimbo({ ...estado, planosCorrida: [...estado.planosCorrida, plano] });
    }

    case "PLANO_DUPLICADO": {
      const origem =
        estado.planosCorrida.find((p) => p.id === acao.planoId) ||
        estado.modelosCorrida.find((p) => p.id === acao.planoId);
      if (!origem) return estado;
      const copia = criaPlanoCorrida({
        ...origem,
        id: novoId(),
        nome: acao.nome || `${origem.nome} (cópia)`,
        ativo: false,
        arquivado: false,
        semanas: origem.semanas.map((s) =>
          criaSemanaCorrida({
            ...s,
            id: novoId(),
            sessoes: s.sessoes.map((x) => criaSessaoPlanejada({ ...x, id: novoId(), status: "planejada" })),
          }),
        ),
      });
      return comCarimbo({ ...estado, planosCorrida: [...estado.planosCorrida, copia] });
    }

    case "PLANO_ATUALIZADO":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({ ...p, ...acao.mudancas })),
      });

    case "PLANO_ATIVADO":
      return comCarimbo({
        ...estado,
        planosCorrida: estado.planosCorrida.map((p) => ({ ...p, ativo: p.id === acao.planoId })),
      });

    case "PLANO_REMOVIDO":
      return comCarimbo({ ...estado, planosCorrida: remove(estado.planosCorrida, acao.planoId) });

    case "SEMANA_ADICIONADA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({
          ...p,
          semanas: [...p.semanas, criaSemanaCorrida({ numero: p.semanas.length + 1, sessoes: [] })].map((s, i) => ({
            ...s,
            numero: i + 1,
          })),
        })),
      });

    case "SEMANA_DUPLICADA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => {
          const i = p.semanas.findIndex((s) => s.id === acao.semanaId);
          if (i < 0) return p;
          const copia = criaSemanaCorrida({
            ...p.semanas[i],
            id: novoId(),
            sessoes: p.semanas[i].sessoes.map((x) => criaSessaoPlanejada({ ...x, id: novoId(), status: "planejada" })),
          });
          const semanas = [...p.semanas];
          semanas.splice(i + 1, 0, copia);
          return { ...p, semanas: semanas.map((s, k) => ({ ...s, numero: k + 1 })) };
        }),
      });

    case "SEMANA_REMOVIDA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({
          ...p,
          semanas: remove(p.semanas, acao.semanaId).map((s, i) => ({ ...s, numero: i + 1 })),
        })),
      });

    case "SEMANA_MOVIDA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => {
          const i = p.semanas.findIndex((s) => s.id === acao.semanaId);
          const j = i + acao.direcao;
          if (i < 0 || j < 0 || j >= p.semanas.length) return p;
          const semanas = [...p.semanas];
          [semanas[i], semanas[j]] = [semanas[j], semanas[i]];
          return { ...p, semanas: semanas.map((s, k) => ({ ...s, numero: k + 1 })) };
        }),
      });

    case "SEMANA_ATUALIZADA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({
          ...p,
          semanas: substitui(p.semanas, acao.semanaId, (s) => ({ ...s, ...acao.mudancas })),
        })),
      });

    case "SESSAO_PLANEJADA_ADICIONADA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({
          ...p,
          semanas: substitui(p.semanas, acao.semanaId, (s) => ({
            ...s,
            sessoes: [...s.sessoes, criaSessaoPlanejada(acao.sessao || {})],
          })),
        })),
      });

    case "SESSAO_PLANEJADA_ATUALIZADA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({
          ...p,
          semanas: p.semanas.map((s) => ({
            ...s,
            sessoes: substitui(s.sessoes, acao.sessaoId, (x) => ({ ...x, ...acao.mudancas })),
          })),
        })),
      });

    case "SESSAO_PLANEJADA_REMOVIDA":
      return comCarimbo({
        ...estado,
        planosCorrida: substitui(estado.planosCorrida, acao.planoId, (p) => ({
          ...p,
          semanas: p.semanas.map((s) => ({ ...s, sessoes: remove(s.sessoes, acao.sessaoId) })),
        })),
      });

    /* -------------------------------------------------------- corridas */
    case "CORRIDA_REGISTRADA": {
      const corrida = criaCorrida(acao.corrida);
      const planos = corrida.sessaoPlanejadaId
        ? estado.planosCorrida.map((p) => ({
            ...p,
            semanas: p.semanas.map((s) => ({
              ...s,
              sessoes: substitui(s.sessoes, corrida.sessaoPlanejadaId, (x) => ({ ...x, status: "concluida" })),
            })),
          }))
        : estado.planosCorrida;
      return comCarimbo({ ...estado, corridas: [...estado.corridas, corrida], planosCorrida: planos });
    }

    case "CORRIDA_ATUALIZADA":
      return comCarimbo({
        ...estado,
        corridas: substitui(estado.corridas, acao.corridaId, (c) => ({ ...c, ...acao.mudancas })),
      });

    case "CORRIDA_DUPLICADA": {
      const origem = estado.corridas.find((c) => c.id === acao.corridaId);
      if (!origem) return estado;
      return comCarimbo({
        ...estado,
        corridas: [...estado.corridas, criaCorrida({ ...origem, id: novoId(), data: hoje(), sessaoPlanejadaId: null })],
      });
    }

    case "CORRIDA_REMOVIDA":
      return comCarimbo({ ...estado, corridas: remove(estado.corridas, acao.corridaId) });

    default:
      return estado;
  }
}
