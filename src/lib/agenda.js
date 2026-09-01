/* Agenda. O app não presume que a semana de quem treina seja de segunda a
   sábado: quem trabalha em escala não tem semana, tem ciclo. Por isso são três
   modos, e em todos eles começar qualquer ficha fora da ordem continua valendo. */

import { deChaveData, diferencaEmDias, hoje, paraChaveData } from "./dates.js";

/** Fichas ativas na ordem definida pelo usuário. */
export function fichasAtivas(estado) {
  return (estado.fichas || [])
    .filter((f) => !f.arquivada)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/** Última sessão de musculação concluída, pela data. */
export function ultimaSessaoConcluida(estado) {
  const concluidas = (estado.sessoesMusculacao || [])
    .filter((s) => s.status === "concluida" && s.data)
    .sort((a, b) => a.data.localeCompare(b.data));
  return concluidas.length ? concluidas[concluidas.length - 1] : null;
}

/* ------------------------------------------------------- modo sequência */
/* Concluiu A, a próxima é B — independente de quantos dias passaram. É o modo
   que sobrevive a folga, viagem e plantão. */
export function proximaFichaPorSequencia(estado) {
  const ativas = fichasAtivas(estado);
  if (!ativas.length) return null;

  const ultima = ultimaSessaoConcluida(estado);
  if (!ultima) return ativas[0];

  const indice = ativas.findIndex((f) => f.id === ultima.fichaId);
  if (indice < 0) {
    /* A ficha da última sessão foi arquivada ou apagada: recomeça do topo em
       vez de travar. */
    return ativas[0];
  }
  return ativas[(indice + 1) % ativas.length];
}

/* --------------------------------------------------------- modo semanal */
export function fichaDoDiaSemanal(estado, data = hoje()) {
  const d = deChaveData(data);
  if (!d) return null;
  const mapa = estado.configuracoes?.agendaSemanal || {};
  const fichaId = mapa[String(d.getDay())];
  if (!fichaId) return null;
  return fichasAtivas(estado).find((f) => f.id === fichaId) || null;
}

/* ------------------------------------------------------- escala 12x36 */
/* 12 horas de trabalho e 36 de descanso fecham 48 horas: o turno cai a cada
   dois dias. Sabendo um dia de referência, todo o resto se deduz. */
export function ehDiaDeTrabalho(data, config) {
  const escala = config?.escala12x36;
  if (!escala || !escala.dataReferencia) return null;
  const dias = diferencaEmDias(escala.dataReferencia, data);
  if (dias === null) return null;
  const par = ((dias % 2) + 2) % 2 === 0;
  return par ? Boolean(escala.referenciaEhTrabalho) : !escala.referenciaEhTrabalho;
}

/** Próximos dias de folga a partir de uma data, úteis para planejar. */
export function proximasFolgas(config, apartirDe = hoje(), quantidade = 3) {
  const folgas = [];
  const base = deChaveData(apartirDe);
  if (!base) return folgas;
  for (let i = 0; i < 30 && folgas.length < quantidade; i += 1) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const chave = paraChaveData(d);
    if (ehDiaDeTrabalho(chave, config) === false) folgas.push(chave);
  }
  return folgas;
}

/* ------------------------------------------------------------ resolução */
/* O que o app propõe para uma data, considerando o modo escolhido. Isto é
   sugestão: nada aqui impede começar outra ficha. */
export function planoDoDia(estado, data = hoje()) {
  const modo = estado.configuracoes?.modoAgenda || "sequencia";
  const ativas = fichasAtivas(estado);

  const reagendada = (estado.agenda || []).find(
    (item) => item.tipo === "musculacao" && item.dataPlanejada === data && item.status !== "cancelada",
  );
  if (reagendada) {
    const ficha = ativas.find((f) => f.id === reagendada.refId);
    if (ficha) return { ficha, motivo: "Reagendado por você para hoje.", modo, diaDeTrabalho: ehDiaDeTrabalho(data, estado.configuracoes) };
  }

  const diaDeTrabalho = ehDiaDeTrabalho(data, estado.configuracoes);

  if (modo === "semanal") {
    const ficha = fichaDoDiaSemanal(estado, data);
    return {
      ficha,
      motivo: ficha ? "Ficha marcada para este dia da semana." : "Nenhuma ficha marcada para hoje — dia livre.",
      modo,
      diaDeTrabalho,
    };
  }

  if (modo === "escala12x36") {
    const proxima = proximaFichaPorSequencia(estado);
    if (diaDeTrabalho === true) {
      return {
        ficha: proxima,
        motivo: "Hoje é dia de trabalho na sua escala. A ficha continua disponível se você quiser encaixar.",
        modo,
        diaDeTrabalho,
        sugereAdiar: true,
      };
    }
    return {
      ficha: proxima,
      motivo: diaDeTrabalho === false ? "Folga na sua escala — bom dia para treinar." : "Defina a data de referência da escala nos Ajustes.",
      modo,
      diaDeTrabalho,
    };
  }

  return {
    ficha: proximaFichaPorSequencia(estado),
    motivo: ultimaSessaoConcluida(estado)
      ? "Próxima da sequência, depois do seu último treino."
      : "Primeira ficha da sua sequência.",
    modo,
    diaDeTrabalho,
  };
}

/* -------------------------------------------------------------- corrida */

export function planoCorridaAtivo(estado) {
  return (estado.planosCorrida || []).find((p) => p.ativo && !p.arquivado) || null;
}

/** Semana corrente do plano: a marcada à mão vence; senão, deduz da data de
 *  início; sem data de início, a primeira com sessão pendente. */
export function semanaAtualDoPlano(plano, data = hoje()) {
  if (!plano || !plano.semanas?.length) return null;
  if (plano.semanaAtualManual) {
    const marcada = plano.semanas.find((s) => s.id === plano.semanaAtualManual);
    if (marcada) return marcada;
  }
  if (plano.dataInicio) {
    const dias = diferencaEmDias(plano.dataInicio, data);
    if (dias !== null && dias >= 0) {
      const indice = Math.min(Math.floor(dias / 7), plano.semanas.length - 1);
      return plano.semanas[indice];
    }
  }
  const pendente = plano.semanas.find((s) => s.sessoes.some((x) => x.status === "planejada"));
  return pendente || plano.semanas[0];
}

export function proximaSessaoCorrida(estado, data = hoje()) {
  const plano = planoCorridaAtivo(estado);
  if (!plano) return null;
  const semana = semanaAtualDoPlano(plano, data);
  if (!semana) return null;

  const pendenteNaSemana = semana.sessoes.find((s) => s.status === "planejada");
  if (pendenteNaSemana) return { plano, semana, sessao: pendenteNaSemana };

  for (const s of plano.semanas) {
    const pendente = s.sessoes.find((x) => x.status === "planejada");
    if (pendente) return { plano, semana: s, sessao: pendente };
  }
  return null;
}

export function progressoDoPlano(plano) {
  if (!plano) return null;
  const todas = plano.semanas.flatMap((s) => s.sessoes);
  const concluidas = todas.filter((s) => s.status === "concluida").length;
  return {
    total: todas.length,
    concluidas,
    percentual: todas.length ? (concluidas / todas.length) * 100 : 0,
  };
}

/** Musculação e corrida no mesmo dia. */
export function temCombinacaoHoje(estado, data = hoje()) {
  const treino = planoDoDia(estado, data);
  const corrida = proximaSessaoCorrida(estado, data);
  const corridaHoje =
    corrida && (corrida.sessao.dataPlanejada === data || corrida.sessao.dataPlanejada === null);
  return Boolean(treino.ficha) && Boolean(corridaHoje);
}
