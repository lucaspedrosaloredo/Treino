/* Cálculos do app. Tudo aqui é função pura: entra dado, sai número. É o que
   permite testar as regras sem montar tela nenhuma. */

import { paraNumero, paraNumeroPositivo } from "./numbers.js";
import { deChaveData, diferencaEmDias, inicioDaSemana, somaDias, hoje } from "./dates.js";

/* ------------------------------------------------------------- volume */

export function volumeSerie(serie) {
  if (!serie || !serie.concluida) return 0;
  const carga = paraNumeroPositivo(serie.cargaKg);
  const reps = paraNumeroPositivo(serie.repeticoes);
  if (carga === null || reps === null) return 0;
  return carga * reps;
}

/** Só séries de trabalho entram: aquecimento não pode inflar o volume. */
export function ehSerieDeTrabalho(serie) {
  return Boolean(serie) && serie.tipo !== "aquecimento";
}

export function volumeSessao(sessao) {
  if (!sessao || !Array.isArray(sessao.exercicios)) return 0;
  return sessao.exercicios.reduce(
    (total, ex) =>
      total + (ex.series || []).filter(ehSerieDeTrabalho).reduce((s, serie) => s + volumeSerie(serie), 0),
    0,
  );
}

export function seriesConcluidas(sessao) {
  if (!sessao || !Array.isArray(sessao.exercicios)) return 0;
  return sessao.exercicios.reduce(
    (t, ex) => t + (ex.series || []).filter((s) => s && s.concluida).length,
    0,
  );
}

export function cargaMaxima(sessao, exercicioId) {
  const ex = (sessao.exercicios || []).find((e) => e.exercicioId === exercicioId);
  if (!ex) return null;
  const cargas = (ex.series || [])
    .filter((s) => ehSerieDeTrabalho(s) && s.concluida)
    .map((s) => paraNumeroPositivo(s.cargaKg))
    .filter((n) => n !== null);
  return cargas.length ? Math.max(...cargas) : null;
}

/* ------------------------------------------------------- 1RM estimado */
/* Fórmula de Epley: 1RM ≈ carga × (1 + reps/30). É estimativa, e a interface
   precisa dizer isso — acima de ~10 repetições ela erra bastante. */
export function estimativa1RM(cargaKg, repeticoes) {
  const carga = paraNumeroPositivo(cargaKg);
  const reps = paraNumeroPositivo(repeticoes);
  if (carga === null || reps === null || carga === 0 || reps === 0) return null;
  if (reps === 1) return carga;
  return carga * (1 + reps / 30);
}

export const FORMULA_1RM = "Epley: carga × (1 + repetições ÷ 30)";

/* -------------------------------------------------------------- ritmo */

/** Segundos por quilômetro. */
export function ritmoSegundosPorKm(distanciaKm, duracaoSegundos) {
  const km = paraNumeroPositivo(distanciaKm);
  const seg = paraNumeroPositivo(duracaoSegundos);
  if (km === null || seg === null || km === 0) return null;
  return seg / km;
}

export function formataRitmo(segundosPorKm) {
  if (segundosPorKm === null || !Number.isFinite(segundosPorKm) || segundosPorKm <= 0) return "—";
  const total = Math.round(segundosPorKm);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${String(seg).padStart(2, "0")}/km`;
}

/** Aceita "48:30", "1:02:15", "45" (minutos) e "45min". Devolve segundos. */
export function interpretaDuracao(entrada) {
  if (entrada === null || entrada === undefined) return null;
  if (typeof entrada === "number") return Number.isFinite(entrada) ? Math.round(entrada * 60) : null;

  const texto = String(entrada).trim().toLowerCase();
  if (texto === "") return null;

  if (texto.includes(":")) {
    const partes = texto.split(":").map((p) => paraNumero(p));
    if (partes.some((p) => p === null || p < 0)) return null;
    if (partes.length === 2) return Math.round(partes[0] * 60 + partes[1]);
    if (partes.length === 3) return Math.round(partes[0] * 3600 + partes[1] * 60 + partes[2]);
    return null;
  }

  const minutos = paraNumeroPositivo(texto.replace(/min(utos)?/g, "").trim());
  return minutos === null ? null : Math.round(minutos * 60);
}

export function formataDuracao(segundos) {
  const s = paraNumeroPositivo(segundos);
  if (s === null) return "—";
  const total = Math.round(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const seg = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  return `${m}:${String(seg).padStart(2, "0")}`;
}

/* ------------------------------------------------------- progressão */
/* Progressão dupla, a mesma regra da versão 1: bateu o topo da faixa em todas
   as séries de trabalho, sobe a carga; não bateu, repete a carga e busca mais
   repetições. A diferença é que agora ela explica o porquê e nunca aplica
   sozinha — quem decide é quem está treinando. */
export function sugereProgressao(fichaExercicio, ultimaSessaoDoExercicio) {
  if (!fichaExercicio) return null;
  const topo = paraNumeroPositivo(fichaExercicio.repsMax);
  const incremento = paraNumeroPositivo(fichaExercicio.incrementoKg);

  if (!ultimaSessaoDoExercicio) {
    return { tipo: "sem_dados", cargaSugerida: null, motivo: "Primeira vez com este exercício — registre uma carga para a sugestão começar." };
  }

  const series = (ultimaSessaoDoExercicio.series || []).filter((s) => ehSerieDeTrabalho(s) && s.concluida);
  const cargas = series.map((s) => paraNumeroPositivo(s.cargaKg)).filter((n) => n !== null);
  const repeticoes = series.map((s) => paraNumeroPositivo(s.repeticoes)).filter((n) => n !== null);

  if (!cargas.length || !repeticoes.length || repeticoes.length !== series.length) {
    return { tipo: "sem_dados", cargaSugerida: null, motivo: "Faltam repetições registradas na última vez para comparar." };
  }
  if (topo === null) {
    return { tipo: "sem_dados", cargaSugerida: null, motivo: "Este exercício não tem faixa de repetições definida." };
  }

  const maiorCarga = Math.max(...cargas);
  const bateuTodas = repeticoes.every((r) => r >= topo);

  if (bateuTodas && incremento !== null && incremento > 0) {
    return {
      tipo: "subir",
      cargaSugerida: maiorCarga + incremento,
      motivo: `Na última vez você fez ${topo} ou mais repetições em todas as ${series.length} séries de trabalho com ${maiorCarga} kg. A sugestão soma o incremento de ${incremento} kg.`,
    };
  }

  return {
    tipo: "manter",
    cargaSugerida: maiorCarga,
    motivo: bateuTodas
      ? `Você bateu a faixa, mas o incremento deste exercício está em zero — ajuste na ficha para o app sugerir subir.`
      : `Na última vez nem todas as séries chegaram a ${topo} repetições com ${maiorCarga} kg. A sugestão é repetir a carga e buscar a faixa cheia.`,
  };
}

/* ---------------------------------------------------------- períodos */

export const PERIODOS = {
  "4s": { rotulo: "4 semanas", dias: 28 },
  "8s": { rotulo: "8 semanas", dias: 56 },
  "3m": { rotulo: "3 meses", dias: 90 },
  "6m": { rotulo: "6 meses", dias: 180 },
  "1a": { rotulo: "1 ano", dias: 365 },
  tudo: { rotulo: "Todo o período", dias: null },
};

/** Intervalo [de, ate] em datas locais YYYY-MM-DD. */
export function intervaloDoPeriodo(chave, personalizado) {
  const fim = hoje();
  if (chave === "personalizado" && personalizado) {
    return { de: personalizado.de || null, ate: personalizado.ate || fim };
  }
  const periodo = PERIODOS[chave];
  if (!periodo || periodo.dias === null) return { de: null, ate: fim };
  return { de: somaDias(fim, -(periodo.dias - 1)), ate: fim };
}

export function dentroDoPeriodo(data, intervalo) {
  if (!data) return false;
  if (intervalo.de && data < intervalo.de) return false;
  if (intervalo.ate && data > intervalo.ate) return false;
  return true;
}

/* ------------------------------------------------------ consistência */
/* Conta sessões, não exercícios: um treino com sete exercícios é um treino. */
export function consistenciaPorSemana(sessoes, intervalo, primeiroDia = 1) {
  const porSemana = new Map();
  sessoes
    .filter((s) => s.status === "concluida" && dentroDoPeriodo(s.data, intervalo))
    .forEach((s) => {
      const semana = inicioDaSemana(s.data, primeiroDia);
      if (!semana) return;
      porSemana.set(semana, (porSemana.get(semana) || 0) + 1);
    });
  return [...porSemana.entries()]
    .map(([semana, total]) => ({ semana, total }))
    .sort((a, b) => a.semana.localeCompare(b.semana));
}

/* ---------------------------------------------------------------- peso */

export function pesoAtual(pesagens) {
  const validas = (pesagens || []).filter((p) => p && p.data && paraNumeroPositivo(p.pesoKg) !== null);
  if (!validas.length) return null;
  const ordenadas = [...validas].sort((a, b) => a.data.localeCompare(b.data));
  return ordenadas[ordenadas.length - 1];
}

export function variacaoPeso(pesagens, intervalo) {
  const noPeriodo = (pesagens || [])
    .filter((p) => p && dentroDoPeriodo(p.data, intervalo) && paraNumeroPositivo(p.pesoKg) !== null)
    .sort((a, b) => a.data.localeCompare(b.data));
  if (noPeriodo.length < 2) return null;
  const inicio = noPeriodo[0].pesoKg;
  const fim = noPeriodo[noPeriodo.length - 1].pesoKg;
  return {
    inicio,
    fim,
    absoluta: fim - inicio,
    percentual: inicio === 0 ? null : ((fim - inicio) / inicio) * 100,
  };
}

/* ------------------------------------------------------------ recordes */
/* Compara apenas o que é comparável: mesmo exercício, série de trabalho
   concluída, com carga e repetições válidas. */
export function recordesPorExercicio(sessoes) {
  const mapa = new Map();
  sessoes
    .filter((s) => s.status === "concluida")
    .forEach((sessao) => {
      (sessao.exercicios || []).forEach((ex) => {
        (ex.series || []).filter(ehSerieDeTrabalho).forEach((serie) => {
          if (!serie.concluida) return;
          const carga = paraNumeroPositivo(serie.cargaKg);
          const reps = paraNumeroPositivo(serie.repeticoes);
          if (carga === null || reps === null || carga === 0 || reps === 0) return;

          const atual = mapa.get(ex.exercicioId) || {
            exercicioId: ex.exercicioId,
            nome: ex.nomeSnapshot,
            maiorCarga: null, dataMaiorCarga: null,
            maiorVolumeSerie: null, melhor1RM: null,
          };
          if (atual.maiorCarga === null || carga > atual.maiorCarga) {
            atual.maiorCarga = carga;
            atual.dataMaiorCarga = sessao.data;
          }
          const volume = carga * reps;
          if (atual.maiorVolumeSerie === null || volume > atual.maiorVolumeSerie) atual.maiorVolumeSerie = volume;
          const rm = estimativa1RM(carga, reps);
          if (rm !== null && (atual.melhor1RM === null || rm > atual.melhor1RM)) atual.melhor1RM = rm;
          atual.nome = ex.nomeSnapshot || atual.nome;
          mapa.set(ex.exercicioId, atual);
        });
      });
    });
  return [...mapa.values()];
}

/* ----------------------------------------------------- volume/corrida */

export function resumoCorridas(corridas, intervalo) {
  const noPeriodo = (corridas || []).filter((c) => dentroDoPeriodo(c.data, intervalo));
  const distancia = noPeriodo.reduce((s, c) => s + (paraNumeroPositivo(c.distanciaKm) || 0), 0);
  const duracao = noPeriodo.reduce((s, c) => s + (paraNumeroPositivo(c.duracaoSegundos) || 0), 0);
  const comAmbos = noPeriodo.filter(
    (c) => paraNumeroPositivo(c.distanciaKm) && paraNumeroPositivo(c.duracaoSegundos),
  );
  const maisLonga = noPeriodo.reduce(
    (melhor, c) =>
      (paraNumeroPositivo(c.distanciaKm) || 0) > (paraNumeroPositivo(melhor?.distanciaKm) || 0) ? c : melhor,
    null,
  );
  const melhorRitmo = comAmbos.reduce((melhor, c) => {
    const r = ritmoSegundosPorKm(c.distanciaKm, c.duracaoSegundos);
    if (r === null) return melhor;
    return melhor === null || r < melhor.ritmo ? { ritmo: r, corrida: c } : melhor;
  }, null);

  return {
    total: noPeriodo.length,
    distancia,
    duracao,
    ritmoMedio: distancia > 0 ? duracao / distancia : null,
    maisLonga,
    melhorRitmo,
  };
}

export function distanciaPorSemana(corridas, intervalo, primeiroDia = 1) {
  const porSemana = new Map();
  (corridas || [])
    .filter((c) => dentroDoPeriodo(c.data, intervalo))
    .forEach((c) => {
      const semana = inicioDaSemana(c.data, primeiroDia);
      if (!semana) return;
      const atual = porSemana.get(semana) || { semana, distancia: 0, duracao: 0, total: 0 };
      atual.distancia += paraNumeroPositivo(c.distanciaKm) || 0;
      atual.duracao += paraNumeroPositivo(c.duracaoSegundos) || 0;
      atual.total += 1;
      porSemana.set(semana, atual);
    });
  return [...porSemana.values()].sort((a, b) => a.semana.localeCompare(b.semana));
}

/* Aviso neutro e dispensável sobre salto de volume. Não é diagnóstico, não
   bloqueia nada, e a regra dos 10% é convenção, não lei. */
export function saltoDeVolumeCorrida(porSemana) {
  if (!porSemana || porSemana.length < 2) return null;
  const ultima = porSemana[porSemana.length - 1];
  const anterior = porSemana[porSemana.length - 2];
  if (anterior.distancia <= 0) return null;
  const aumento = ((ultima.distancia - anterior.distancia) / anterior.distancia) * 100;
  if (aumento < 30) return null;
  return { aumento, de: anterior.distancia, para: ultima.distancia };
}

/* --------------------------------------------------- grupos musculares */

export function volumePorGrupo(sessoes, intervalo) {
  const mapa = new Map();
  sessoes
    .filter((s) => s.status === "concluida" && dentroDoPeriodo(s.data, intervalo))
    .forEach((sessao) => {
      (sessao.exercicios || []).forEach((ex) => {
        const grupo = ex.grupoPrincipalSnapshot || "Corpo inteiro";
        const series = (ex.series || []).filter((s) => ehSerieDeTrabalho(s) && s.concluida);
        if (!series.length) return;
        const atual = mapa.get(grupo) || { grupo, series: 0, volume: 0 };
        atual.series += series.length;
        atual.volume += series.reduce((t, s) => t + volumeSerie(s), 0);
        mapa.set(grupo, atual);
      });
    });
  return [...mapa.values()].sort((a, b) => b.series - a.series);
}

/* Última sessão concluída que contém o exercício, para "Anterior" e sugestão. */
export function ultimaExecucao(sessoes, exercicioId, ignorarSessaoId = null) {
  const candidatas = sessoes
    .filter((s) => s.status === "concluida" && s.id !== ignorarSessaoId)
    .filter((s) => (s.exercicios || []).some((e) => e.exercicioId === exercicioId))
    .sort((a, b) => String(a.data ?? "").localeCompare(String(b.data ?? "")));
  if (!candidatas.length) return null;
  const sessao = candidatas[candidatas.length - 1];
  const exercicio = sessao.exercicios.find((e) => e.exercicioId === exercicioId);
  return { sessao, exercicio };
}

export { diferencaEmDias, deChaveData };
