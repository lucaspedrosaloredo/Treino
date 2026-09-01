/* Migração v1 -> v2.
   Requisito crítico: ninguém pode perder histórico. Três garantias regem este
   arquivo — (1) ids antigos sobrevivem, senão o histórico se desliga do
   exercício; (2) rodar de novo não duplica nada, porque a saída já é v2 e v2
   entra e sai igual; (3) o que não couber no modelo novo vira aviso visível,
   nunca sumiço silencioso. A chave v1 original não é apagada. */

import { novoId, idDerivado } from "./ids.js";
import { paraNumero, paraNumeroPositivo, paraInteiroPositivo } from "./numbers.js";
import { agoraIso, ehChaveDataValida } from "./dates.js";
import {
  VERSAO, estadoVazio, configuracoesPadrao, criaExercicio, criaFicha, criaFichaExercicio,
  criaSerie, criaSessaoMusculacao, criaPlanoCorrida, criaSemanaCorrida, criaSessaoPlanejada,
  criaCorrida, criaPesagem, CORES_DIVISAO,
} from "./schema.js";
import { NIVEL1, NIVEL2, NIVEIS, CORRIDA1, CORRIDA2 } from "../data/legadoV1.js";

/* --------------------------------------------------------- faixa de reps */
/* A v1 guardava a prescrição como texto livre: "10-12", "15", "30-45s",
   "10 (cada perna)". Cada forma vira número mais um tipo de registro. */
export function interpretaFaixaReps(texto) {
  const bruto = String(texto ?? "").trim();
  const porTempo = /\d\s*s\b|\bsegundos?\b/i.test(bruto);
  const numeros = bruto.match(/\d+(?:[.,]\d+)?/g) || [];
  const valores = numeros.map((n) => paraNumero(n)).filter((n) => n !== null);
  const observacao = /\(([^)]+)\)/.exec(bruto);

  let min = null;
  let max = null;
  if (valores.length >= 2) {
    min = Math.min(valores[0], valores[1]);
    max = Math.max(valores[0], valores[1]);
  } else if (valores.length === 1) {
    min = valores[0];
    max = valores[0];
  }

  return {
    repsMin: min,
    repsMax: max,
    tipoRegistro: porTempo ? "tempo" : "peso_reps",
    observacao: observacao ? observacao[1].trim() : "",
    textoOriginal: bruto,
  };
}

/* ------------------------------------------------- grupo e equipamento */
/* Inferência por palavra-chave a partir do nome. É chute educado, existe só
   para o gráfico por grupo muscular nascer preenchido, e o usuário pode
   corrigir na ficha. Na dúvida devolve "Corpo inteiro". */
const PISTAS_GRUPO = [
  [/supino|crucifixo|peck deck|peitoral|crossover/i, "Peito"],
  [/puxada|remada|barra fixa|pullover|dorsal|costas/i, "Costas"],
  [/desenvolvimento|elevação lateral|elevacao lateral|crucifixo inverso|encolhimento|face pull|ombro/i, "Ombros"],
  [/rosca|bíceps|biceps/i, "Bíceps"],
  [/tríceps|triceps|mergulho|francês|frances|testa/i, "Tríceps"],
  [/agachamento|leg press|extensora|hack|afundo|búlgaro|bulgaro/i, "Quadríceps"],
  [/flexora|stiff|terra romeno|posterior/i, "Posterior"],
  [/pélvica|pelvica|hip thrust|glúteo|gluteo|abdutora/i, "Glúteo"],
  [/panturrilha|sóleo|soleo|dorsiflexão|dorsiflexao|tibial/i, "Panturrilha"],
  [/prancha|abdominal|core|infra/i, "Core"],
];

const PISTAS_EQUIPAMENTO = [
  [/halter/i, "Halter"],
  [/polia|crossover|cabo/i, "Polia"],
  [/máquina|maquina|peck deck|cadeira|mesa flexora|leg press/i, "Máquina"],
  [/smith/i, "Smith"],
  [/barra/i, "Barra"],
  [/prancha|barra fixa|mergulho|peso corporal/i, "Peso corporal"],
];

export function inferePorNome(nome, pistas, padrao) {
  const texto = String(nome ?? "");
  for (const [regex, valor] of pistas) if (regex.test(texto)) return valor;
  return padrao;
}

export function infereGrupo(nome) {
  return inferePorNome(nome, PISTAS_GRUPO, "Corpo inteiro");
}

export function infereEquipamento(nome) {
  return inferePorNome(nome, PISTAS_EQUIPAMENTO, "Outro");
}

/* ----------------------------------------------- fichas e exercícios v1 */
/* A v1 tinha dois conjuntos completos (nível 1 e nível 2), cada um com as
   divisões A a E. No modelo novo ficha é lista plana, então os dois conjuntos
   entram: o do nível ativo fica ativo, o outro entra arquivado. Nada some, e
   quem quiser volta a usar depois. */
export function converteFichasV1(fichasV1, nivelAtivo) {
  const exercicios = new Map();
  const fichas = [];
  const niveis = Object.keys(fichasV1 || {}).sort();

  niveis.forEach((nivel) => {
    const conjunto = fichasV1[nivel] || {};
    Object.keys(conjunto).forEach((divisao, indice) => {
      const bloco = conjunto[divisao] || {};
      const listaEx = Array.isArray(bloco.ex) ? bloco.ex : [];

      const exercicioDaFicha = listaEx.map((ex, ordem) => {
        /* O id da v1 vira o id do exercício no catálogo. É o que mantém os
           `logs` antigos ligados ao exercício certo. */
        const idExercicio = String(ex.id ?? novoId());
        const faixa = interpretaFaixaReps(ex.r);

        if (!exercicios.has(idExercicio)) {
          exercicios.set(
            idExercicio,
            criaExercicio({
              id: idExercicio,
              nome: ex.n || "Exercício",
              grupoPrincipal: infereGrupo(ex.n),
              equipamento: infereEquipamento(ex.n),
              tipoRegistro: faixa.tipoRegistro,
              instrucoes: "",
            }),
          );
        }

        const incremento = paraNumeroPositivo(ex.inc);
        return criaFichaExercicio({
          id: idDerivado("fe", `${nivel}-${divisao}-${idExercicio}`),
          exercicioId: idExercicio,
          nomeSnapshot: ex.n || "Exercício",
          ordem,
          series: paraInteiroPositivo(ex.s) ?? 3,
          repsMin: faixa.repsMin,
          repsMax: faixa.repsMax,
          incrementoKg: incremento === null ? 2.5 : incremento,
          descansoSegundos: 90,
          observacao: faixa.observacao,
        });
      });

      fichas.push(
        criaFicha({
          id: idDerivado("ficha", `${nivel}-${divisao}`),
          divisao,
          nome: bloco.nome || `Ficha ${divisao}`,
          descricao: (NIVEIS?.[nivel]?.nome) || "",
          cor: CORES_DIVISAO[indice % CORES_DIVISAO.length],
          ordem: indice,
          arquivada: String(nivel) !== String(nivelAtivo),
          observacao: (NIVEIS?.[nivel]?.dica) || "",
          exercicios: exercicioDaFicha,
        }),
      );
    });
  });

  return { exercicios: [...exercicios.values()], fichas };
}

/* -------------------------------------------------------- sessões de força */
/* A v1 gravava uma linha por exercício. Uma sessão é o conjunto de linhas com
   a mesma data e a mesma divisão — exatamente como a v1 já contava treinos. */
export function converteLogsV1(logs, fichas) {
  const porSessao = new Map();
  const avisos = [];

  (Array.isArray(logs) ? logs : []).forEach((log) => {
    if (!log || typeof log !== "object") return;
    const data = ehChaveDataValida(log.data) ? String(log.data).slice(0, 10) : null;
    if (!data) {
      avisos.push(`Um registro antigo tinha data inválida (${JSON.stringify(log.data)}) e ficou sem data.`);
    }
    const divisao = String(log.dia ?? "");
    const chave = `${data ?? "sem-data"}|${divisao}`;

    if (!porSessao.has(chave)) porSessao.set(chave, []);
    porSessao.get(chave).push({ ...log, data });
  });

  const sessoes = [...porSessao.entries()].map(([chave, linhas]) => {
    const data = linhas[0].data;
    const divisao = String(linhas[0].dia ?? "");
    /* A v1 não guardava de qual nível era o treino; casamos pela divisão
       entre as fichas ativas, e caímos em qualquer uma que bata se não houver. */
    const ficha =
      fichas.find((f) => f.divisao === divisao && !f.arquivada) ||
      fichas.find((f) => f.divisao === divisao) ||
      null;

    const exercicios = linhas.map((linha, ordem) => {
      const series = (Array.isArray(linha.series) ? linha.series : []).map((s, i) =>
        criaSerie({
          id: idDerivado("serie", `${chave}-${linha.exId}-${i}`),
          numero: i + 1,
          tipo: "trabalho",
          cargaKg: paraNumeroPositivo(s?.kg),
          repeticoes: paraInteiroPositivo(s?.reps),
          concluida: true,
        }),
      );
      return {
        exercicioId: linha.exId ? String(linha.exId) : null,
        nomeSnapshot: linha.exNome || String(linha.exId ?? "Exercício"),
        grupoPrincipalSnapshot: infereGrupo(linha.exNome),
        ordem,
        observacao: "",
        series,
      };
    });

    return criaSessaoMusculacao({
      /* Id determinístico: rodar a migração de novo produz o mesmo id e o
         mesmo registro, em vez de uma segunda cópia da mesma sessão. */
      id: idDerivado("sessao", chave),
      fichaId: ficha ? ficha.id : null,
      fichaNomeSnapshot: ficha ? ficha.nome : divisao,
      divisaoSnapshot: divisao,
      data,
      status: "concluida",
      origem: "v1",
      exercicios,
    });
  });

  sessoes.sort((a, b) => String(a.data ?? "").localeCompare(String(b.data ?? "")));
  return { sessoes, avisos };
}

/* ---------------------------------------------------------- corrida v1 */
/* Os planos da v1 eram texto por sessão. Viram plano estruturado, preservando
   o id de cada sessão — é por ele que as corridas marcadas se reconectam. */
export function converteModeloCorridaV1(modeloV1, chave) {
  const semanas = (modeloV1.semanas || []).map((semana) =>
    criaSemanaCorrida({
      id: idDerivado("semana", `${chave}-${semana.semana}`),
      numero: semana.semana,
      foco: semana.foco || "",
      reducao: /corte|redu|poupar|recupera/i.test(semana.foco || ""),
      sessoes: (semana.t || []).map((t) =>
        criaSessaoPlanejada({
          /* O id vem tal e qual da v1 — `corridas` é indexado por ele. */
          id: String(t.id),
          nome: t.t || "Sessão",
          tipo: classificaSessaoCorrida(t.t, t.d),
          diaSemana: nomeDiaParaNumero(t.dia),
          objetivo: t.d || "",
          duracaoSegundos: interpretaDuracaoTextual(t.tempo),
          observacao: "",
          status: "planejada",
        }),
      ),
    }),
  );

  return criaPlanoCorrida({
    id: idDerivado("plano", chave),
    nome: modeloV1.nome || "Plano",
    objetivo: modeloV1.meta || "",
    descricao: modeloV1.desc || "",
    semanas,
  });
}

const NOMES_DIA = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function semAcento(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* Casamento exato pelo nome ou pela abreviação de três letras. Prefixo solto
   não serve: "qualquer" começa com "qua" e viraria quarta-feira. */
export function nomeDiaParaNumero(nome) {
  if (typeof nome !== "string") return null;
  const alvo = semAcento(nome.trim().toLowerCase()).replace(/-feira$/, "").trim();
  const i = NOMES_DIA.findIndex((d) => alvo === d || alvo === d.slice(0, 3));
  return i >= 0 ? i : null;
}

export function classificaSessaoCorrida(titulo, descricao) {
  const t = `${titulo ?? ""} ${descricao ?? ""}`;
  if (/\bKM\b|prova/i.test(titulo ?? "")) return "prova";
  if (/long[ãa]o/i.test(t)) return "longao";
  if (/fartlek|forte\s*\/|tiro|\bx\b.*forte/i.test(t)) return "intervalado";
  if (/firme|limiar|ritmo de prova|tempo\b/i.test(t)) return "limiar";
  if (/velocidade/i.test(t)) return "velocidade";
  if (/recupera/i.test(t)) return "recuperacao";
  return "facil";
}

/* "40 min", "~35 min", "—" -> segundos. */
export function interpretaDuracaoTextual(texto) {
  if (typeof texto !== "string") return null;
  const m = /(\d+(?:[.,]\d+)?)\s*min/i.exec(texto);
  if (!m) return null;
  const minutos = paraNumero(m[1]);
  return minutos === null ? null : Math.round(minutos * 60);
}

export function converteCorridasV1(corridasV1, planos) {
  const corridas = [];
  const avisos = [];
  const marcadas = new Set();

  Object.entries(corridasV1 || {}).forEach(([sessaoId, registro]) => {
    if (!registro || typeof registro !== "object") return;
    const temDado =
      registro.feito || registro.km !== undefined || registro.tempo !== undefined;
    if (!temDado) return;

    const plano = planos.find((p) => p.semanas.some((s) => s.sessoes.some((x) => x.id === sessaoId)));
    const data = ehChaveDataValida(registro.data) ? String(registro.data).slice(0, 10) : null;
    if (registro.feito && !data) {
      avisos.push(`Uma corrida marcada como feita não tinha data e ficou como "sem data" para você corrigir.`);
    }

    const minutos = paraNumeroPositivo(registro.tempo);
    corridas.push(
      criaCorrida({
        id: idDerivado("corrida", sessaoId),
        data,
        distanciaKm: paraNumeroPositivo(registro.km),
        duracaoSegundos: minutos === null ? null : Math.round(minutos * 60),
        planoId: plano ? plano.id : null,
        sessaoPlanejadaId: sessaoId,
      }),
    );
    if (registro.feito) marcadas.add(sessaoId);
  });

  return { corridas, marcadas, avisos };
}

/* ------------------------------------------------------------ rascunho */
/* A v1 podia ter rascunho de vários dias ao mesmo tempo; o modelo novo tem uma
   sessão em andamento só. Levamos a de maior conteúdo e avisamos das outras —
   e a chave v1 continua no aparelho, então nada foi realmente descartado. */
export function converteRascunhoV1(rascunho, fichas) {
  const avisos = [];
  const dias = Object.keys(rascunho || {}).filter((dia) => {
    const porExercicio = rascunho[dia] || {};
    return Object.values(porExercicio).some((series) =>
      Object.values(series || {}).some((s) => s && (s.kg || s.reps)),
    );
  });

  if (dias.length === 0) return { sessao: null, avisos };
  if (dias.length > 1) {
    avisos.push(
      `Havia treino em andamento em mais de uma divisão (${dias.join(", ")}). O de ${dias[0]} foi retomado; os outros continuam na cópia de segurança da versão anterior.`,
    );
  }

  const divisao = dias[0];
  const ficha = fichas.find((f) => f.divisao === divisao && !f.arquivada) || fichas.find((f) => f.divisao === divisao);
  if (!ficha) return { sessao: null, avisos };

  const exercicios = ficha.exercicios.map((fe, ordem) => {
    const bruto = (rascunho[divisao] || {})[fe.exercicioId] || {};
    const series = Array.from({ length: fe.series }).map((_, i) => {
      const s = bruto[i] || bruto[String(i)] || {};
      const carga = paraNumeroPositivo(s.kg);
      const reps = paraInteiroPositivo(s.reps);
      return criaSerie({
        numero: i + 1,
        tipo: "trabalho",
        cargaKg: carga,
        repeticoes: reps,
        concluida: carga !== null || reps !== null,
      });
    });
    return {
      exercicioId: fe.exercicioId,
      nomeSnapshot: fe.nomeSnapshot,
      grupoPrincipalSnapshot: infereGrupo(fe.nomeSnapshot),
      ordem,
      observacao: "",
      series,
    };
  });

  return {
    sessao: criaSessaoMusculacao({
      id: idDerivado("sessao-andamento", divisao),
      fichaId: ficha.id,
      fichaNomeSnapshot: ficha.nome,
      divisaoSnapshot: divisao,
      data: null,
      iniciadaEm: agoraIso(),
      status: "andamento",
      origem: "v1",
      exercicios,
    }),
    avisos,
  };
}

/* ------------------------------------------------------------ entrada */
export function ehEstadoV1(bruto) {
  if (!bruto || typeof bruto !== "object") return false;
  if (Number(bruto.versao) >= 2) return false;
  return "fichas" in bruto || "logs" in bruto || "corridas" in bruto || "pesos" in bruto || "nivel" in bruto;
}

export function migraV1paraV2(bruto) {
  const avisos = [];
  const v1 = bruto && typeof bruto === "object" ? bruto : {};

  const nivelAtivo = Number(v1.nivel) === 2 ? 2 : 1;
  const nivelCorrida = Number(v1.nivelCorrida) === 2 ? 2 : 1;

  const fichasV1 =
    v1.fichas && typeof v1.fichas === "object" && v1.fichas[1] ? v1.fichas : { 1: NIVEL1, 2: NIVEL2 };
  if (!(v1.fichas && v1.fichas[1])) {
    avisos.push("As fichas salvas estavam incompletas; as fichas padrão foram usadas como base.");
  }

  const { exercicios, fichas } = converteFichasV1(fichasV1, nivelAtivo);

  const { sessoes, avisos: avisosLogs } = converteLogsV1(v1.logs, fichas);
  avisos.push(...avisosLogs);

  const modelos = [
    converteModeloCorridaV1(CORRIDA1, "corrida-1"),
    converteModeloCorridaV1(CORRIDA2, "corrida-2"),
  ];
  /* O plano do usuário é uma cópia do modelo, para ele poder editar sem
     estragar o modelo de origem. */
  const planos = modelos.map((m, i) =>
    criaPlanoCorrida({
      ...m,
      id: idDerivado("plano-usuario", `corrida-${i + 1}`),
      ativo: i + 1 === nivelCorrida,
      arquivado: i + 1 !== nivelCorrida,
    }),
  );

  const { corridas, marcadas, avisos: avisosCorrida } = converteCorridasV1(v1.corridas, planos);
  avisos.push(...avisosCorrida);
  planos.forEach((p) =>
    p.semanas.forEach((s) =>
      s.sessoes.forEach((sessao) => {
        if (marcadas.has(sessao.id)) sessao.status = "concluida";
      }),
    ),
  );

  const pesagens = (Array.isArray(v1.pesos) ? v1.pesos : [])
    .map((p) => {
      const valor = paraNumeroPositivo(p?.valor ?? p?.kg);
      const data = ehChaveDataValida(p?.data) ? String(p.data).slice(0, 10) : null;
      if (valor === null || !data) return null;
      return criaPesagem({ id: idDerivado("pesagem", data), data, pesoKg: valor });
    })
    .filter(Boolean)
    .sort((a, b) => a.data.localeCompare(b.data));

  const descartadas = (Array.isArray(v1.pesos) ? v1.pesos.length : 0) - pesagens.length;
  if (descartadas > 0) {
    avisos.push(`${descartadas} pesagem(ns) sem data ou sem valor válido não puderam ser migradas.`);
  }

  const { sessao: emAndamento, avisos: avisosRascunho } = converteRascunhoV1(v1.rascunho, fichas);
  avisos.push(...avisosRascunho);

  const base = estadoVazio();
  return {
    estado: {
      ...base,
      configuracoes: { ...configuracoesPadrao(), incrementoPadrao: 2.5 },
      exercicios,
      fichas,
      sessoesMusculacao: sessoes,
      sessaoEmAndamento: emAndamento,
      modelosCorrida: modelos,
      planosCorrida: planos,
      corridas,
      pesagens,
      metadados: { ...base.metadados, migradoDeV1Em: agoraIso() },
    },
    avisos,
  };
}

/* Ponto de entrada: aceita v1, v2 ou nada, e devolve sempre um v2 coerente.
   Idempotente — passar a saída de volta não muda nada nem duplica. */
export function migra(bruto) {
  if (bruto && Number(bruto.versao) === VERSAO) {
    return { estado: normalizaV2(bruto), avisos: [] };
  }
  if (ehEstadoV1(bruto)) return migraV1paraV2(bruto);
  return { estado: estadoVazio(), avisos: [] };
}

/* Estado v2 vindo de um backup ou de um app mais antigo pode ter campo
   faltando; completar aqui evita `undefined` vazando para a interface. */
export function normalizaV2(bruto) {
  const base = estadoVazio();
  const lista = (v) => (Array.isArray(v) ? v : []);
  return {
    ...base,
    ...bruto,
    versao: VERSAO,
    perfil: { ...base.perfil, ...(bruto.perfil || {}) },
    configuracoes: {
      ...configuracoesPadrao(),
      ...(bruto.configuracoes || {}),
      escala12x36: {
        ...configuracoesPadrao().escala12x36,
        ...((bruto.configuracoes || {}).escala12x36 || {}),
      },
    },
    exercicios: lista(bruto.exercicios),
    fichas: lista(bruto.fichas),
    sessoesMusculacao: lista(bruto.sessoesMusculacao),
    modelosCorrida: lista(bruto.modelosCorrida),
    planosCorrida: lista(bruto.planosCorrida),
    corridas: lista(bruto.corridas),
    pesagens: lista(bruto.pesagens),
    agenda: lista(bruto.agenda),
    metadados: { ...base.metadados, ...(bruto.metadados || {}) },
  };
}
