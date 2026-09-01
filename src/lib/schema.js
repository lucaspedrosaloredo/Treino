/* Esquema versionado do estado. Tudo que é persistido passa por aqui, para que
   exista um único lugar onde a forma dos dados está descrita. */

import { novoId } from "./ids.js";
import { agoraIso } from "./dates.js";

export const VERSAO = 2;

export const TIPOS_REGISTRO = {
  peso_reps: "Peso + repetições",
  corporal_reps: "Peso corporal + repetições",
  tempo: "Tempo",
  distancia: "Distância",
  reps: "Só repetições",
};

export const TIPOS_SERIE = {
  aquecimento: "Aquecimento",
  trabalho: "Trabalho",
  drop: "Drop set",
};

export const TIPOS_SESSAO_CORRIDA = {
  facil: "Fácil",
  recuperacao: "Recuperação",
  velocidade: "Velocidade",
  intervalado: "Intervalado",
  limiar: "Tempo / limiar",
  longao: "Longão",
  teste: "Teste",
  prova: "Prova",
};

export const STATUS_SESSAO_PLANEJADA = {
  planejada: "Planejada",
  concluida: "Concluída",
  pulada: "Pulada",
  reagendada: "Reagendada",
};

export const GRUPOS_MUSCULARES = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Quadríceps", "Posterior", "Glúteo", "Panturrilha", "Core", "Antebraço", "Corpo inteiro",
];

export const EQUIPAMENTOS = [
  "Barra", "Halter", "Máquina", "Polia", "Peso corporal", "Smith", "Kettlebell", "Elástico", "Outro",
];

export const MODOS_AGENDA = {
  sequencia: "Sequência livre",
  semanal: "Dias fixos da semana",
  escala12x36: "Escala 12x36",
};

export const CORES_DIVISAO = ["#D2352C", "#2E6FB7", "#E4B429", "#3E9E63", "#C4C9C2", "#7FC4E8", "#A66BBE", "#D97F3D"];

export function configuracoesPadrao() {
  return {
    unidadePeso: "kg",
    unidadeDistancia: "km",
    inicioSemana: 1,
    modoAgenda: "sequencia",
    escala12x36: {
      dataReferencia: null,
      referenciaEhTrabalho: true,
      priorizarCombinadoNaFolga: true,
    },
    agendaSemanal: {},
    descansoPadraoSegundos: 90,
    incrementoPadrao: 2.5,
    exibirRpe: false,
    exibirRir: true,
    preencherAnterior: true,
    tema: "escuro",
    reduzirAnimacoes: false,
    vibrar: true,
    ultimaDataBackup: null,
  };
}

export function estadoVazio() {
  const agora = agoraIso();
  return {
    versao: VERSAO,
    perfil: { nome: "", metaPeso: null },
    configuracoes: configuracoesPadrao(),
    exercicios: [],
    fichas: [],
    sessoesMusculacao: [],
    sessaoEmAndamento: null,
    modelosCorrida: [],
    planosCorrida: [],
    corridas: [],
    pesagens: [],
    agenda: [],
    metadados: { criadoEm: agora, atualizadoEm: agora, migradoDeV1Em: null },
  };
}

export function criaExercicio(dados = {}) {
  return {
    id: dados.id || novoId(),
    nome: dados.nome || "Exercício",
    grupoPrincipal: dados.grupoPrincipal || "Corpo inteiro",
    gruposSecundarios: Array.isArray(dados.gruposSecundarios) ? dados.gruposSecundarios : [],
    equipamento: dados.equipamento || "Outro",
    tipoRegistro: dados.tipoRegistro in TIPOS_REGISTRO ? dados.tipoRegistro : "peso_reps",
    instrucoes: dados.instrucoes || "",
    arquivado: Boolean(dados.arquivado),
  };
}

export function criaFichaExercicio(dados = {}) {
  return {
    id: dados.id || novoId(),
    exercicioId: dados.exercicioId || null,
    nomeSnapshot: dados.nomeSnapshot || "",
    ordem: Number.isFinite(dados.ordem) ? dados.ordem : 0,
    series: Number.isFinite(dados.series) ? dados.series : 3,
    repsMin: dados.repsMin ?? null,
    repsMax: dados.repsMax ?? null,
    cargaInicialKg: dados.cargaInicialKg ?? null,
    incrementoKg: dados.incrementoKg ?? 2.5,
    descansoSegundos: dados.descansoSegundos ?? 90,
    rirAlvo: dados.rirAlvo ?? null,
    rpeAlvo: dados.rpeAlvo ?? null,
    supersetId: dados.supersetId ?? null,
    observacao: dados.observacao || "",
  };
}

export function criaFicha(dados = {}) {
  return {
    id: dados.id || novoId(),
    divisao: dados.divisao || "A",
    nome: dados.nome || "Nova ficha",
    descricao: dados.descricao || "",
    cor: dados.cor || CORES_DIVISAO[0],
    ordem: Number.isFinite(dados.ordem) ? dados.ordem : 0,
    arquivada: Boolean(dados.arquivada),
    observacao: dados.observacao || "",
    exercicios: Array.isArray(dados.exercicios) ? dados.exercicios : [],
  };
}

export function criaSerie(dados = {}) {
  return {
    id: dados.id || novoId(),
    numero: Number.isFinite(dados.numero) ? dados.numero : 1,
    tipo: dados.tipo in TIPOS_SERIE ? dados.tipo : "trabalho",
    cargaKg: dados.cargaKg ?? null,
    repeticoes: dados.repeticoes ?? null,
    duracaoSegundos: dados.duracaoSegundos ?? null,
    distanciaMetros: dados.distanciaMetros ?? null,
    rpe: dados.rpe ?? null,
    rir: dados.rir ?? null,
    concluida: Boolean(dados.concluida),
  };
}

export function criaSessaoMusculacao(dados = {}) {
  return {
    id: dados.id || novoId(),
    fichaId: dados.fichaId ?? null,
    fichaNomeSnapshot: dados.fichaNomeSnapshot || "",
    divisaoSnapshot: dados.divisaoSnapshot || "",
    /* `data` é a data local do treino e é o que os filtros usam. Os carimbos
       podem faltar (sessões vindas da v1 não tinham horário). */
    data: dados.data || null,
    iniciadaEm: dados.iniciadaEm ?? null,
    finalizadaEm: dados.finalizadaEm ?? null,
    duracaoSegundos: dados.duracaoSegundos ?? null,
    status: dados.status || "concluida",
    observacao: dados.observacao || "",
    origem: dados.origem || "app",
    exercicios: Array.isArray(dados.exercicios) ? dados.exercicios : [],
  };
}

export function criaSessaoPlanejada(dados = {}) {
  return {
    id: dados.id || novoId(),
    nome: dados.nome || "Sessão",
    tipo: dados.tipo in TIPOS_SESSAO_CORRIDA ? dados.tipo : "facil",
    diaSemana: dados.diaSemana ?? null,
    dataPlanejada: dados.dataPlanejada ?? null,
    objetivo: dados.objetivo || "",
    distanciaKm: dados.distanciaKm ?? null,
    duracaoSegundos: dados.duracaoSegundos ?? null,
    blocos: Array.isArray(dados.blocos) ? dados.blocos : [],
    alvo: dados.alvo ?? null,
    observacao: dados.observacao || "",
    status: dados.status in STATUS_SESSAO_PLANEJADA ? dados.status : "planejada",
  };
}

export function criaSemanaCorrida(dados = {}) {
  return {
    id: dados.id || novoId(),
    numero: Number.isFinite(dados.numero) ? dados.numero : 1,
    foco: dados.foco || "",
    reducao: Boolean(dados.reducao),
    sessoes: Array.isArray(dados.sessoes) ? dados.sessoes : [],
  };
}

export function criaPlanoCorrida(dados = {}) {
  return {
    id: dados.id || novoId(),
    nome: dados.nome || "Novo plano",
    objetivo: dados.objetivo || "",
    descricao: dados.descricao || "",
    dataInicio: dados.dataInicio ?? null,
    ativo: Boolean(dados.ativo),
    arquivado: Boolean(dados.arquivado),
    semanaAtualManual: dados.semanaAtualManual ?? null,
    semanas: Array.isArray(dados.semanas) ? dados.semanas : [],
  };
}

export function criaCorrida(dados = {}) {
  return {
    id: dados.id || novoId(),
    data: dados.data || null,
    horario: dados.horario ?? null,
    distanciaKm: dados.distanciaKm ?? null,
    duracaoSegundos: dados.duracaoSegundos ?? null,
    rpe: dados.rpe ?? null,
    terreno: dados.terreno ?? null,
    observacao: dados.observacao || "",
    planoId: dados.planoId ?? null,
    sessaoPlanejadaId: dados.sessaoPlanejadaId ?? null,
  };
}

export function criaPesagem(dados = {}) {
  return {
    id: dados.id || novoId(),
    data: dados.data || null,
    pesoKg: dados.pesoKg ?? null,
  };
}
