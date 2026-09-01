/* Backup, restauração e exportação em CSV.
   Nada aqui sai do aparelho por conta própria: gerar um arquivo é ação
   explícita de quem usa, e o conteúdo importado é tratado como dado inerte —
   é lido com `JSON.parse` e validado campo a campo, nunca executado. */

import { VERSAO, estadoVazio } from "./schema.js";
import { migra, ehEstadoV1, normalizaV2 } from "./migrations.js";
import { hoje, agoraIso, formataData, diferencaEmDias } from "./dates.js";
import { formataDuracao, ritmoSegundosPorKm, formataRitmo, volumeSessao } from "./calculos.js";

/* 25 MB é ordens de grandeza acima de qualquer backup real deste app e ainda
   assim protege de um arquivo trocado por engano. */
export const TAMANHO_MAXIMO = 25 * 1024 * 1024;

export function nomeDoArquivo(data = hoje()) {
  return `treino-backup-${data}.json`;
}

export function montaBackup(estado) {
  return {
    formato: "treino-backup",
    versaoEsquema: VERSAO,
    exportadoEm: agoraIso(),
    estado,
  };
}

/** Resumo do que existe num estado, para a prévia antes de restaurar. */
export function resumoDoEstado(estado) {
  return {
    fichas: (estado.fichas || []).length,
    exercicios: (estado.exercicios || []).length,
    sessoes: (estado.sessoesMusculacao || []).length,
    corridas: (estado.corridas || []).length,
    pesagens: (estado.pesagens || []).length,
    planos: (estado.planosCorrida || []).length,
  };
}

/**
 * Valida e interpreta o conteúdo de um arquivo de backup.
 * Devolve `{ ok, estado, resumo, avisos, erro }` — nunca lança.
 */
export function interpretaBackup(texto) {
  if (typeof texto !== "string" || texto.trim() === "") {
    return { ok: false, erro: "O arquivo está vazio." };
  }
  if (texto.length > TAMANHO_MAXIMO) {
    return { ok: false, erro: "O arquivo é grande demais para ser um backup deste app." };
  }

  let cru;
  try {
    cru = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "Este arquivo não é um JSON válido. Escolha o arquivo gerado pelo próprio app." };
  }
  if (!cru || typeof cru !== "object" || Array.isArray(cru)) {
    return { ok: false, erro: "O conteúdo não tem o formato de um backup." };
  }

  /* Aceita o envelope novo, um estado v2 solto e um backup da versão 1 — que
     era só o estado serializado, sem envelope. */
  const candidato = cru.formato === "treino-backup" && cru.estado ? cru.estado : cru;

  if (Number(candidato.versao) === VERSAO) {
    const estado = normalizaV2(candidato);
    return { ok: true, estado, resumo: resumoDoEstado(estado), avisos: [], origem: "v2" };
  }
  if (ehEstadoV1(candidato)) {
    const { estado, avisos } = migra(candidato);
    return { ok: true, estado, resumo: resumoDoEstado(estado), avisos, origem: "v1" };
  }

  return {
    ok: false,
    erro: "Não reconheci a versão deste backup. Ele precisa ter sido gerado por este app.",
  };
}

/* ------------------------------------------------------------------ CSV */
/* Campo entre aspas com aspas internas duplicadas — o suficiente para o
   Excel e o Google Planilhas lerem sem embaralhar as colunas. */
function campoCsv(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return /[",;\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function montaCsv(cabecalhos, linhas) {
  return [cabecalhos, ...linhas].map((l) => l.map(campoCsv).join(";")).join("\n");
}

export function csvSessoes(estado) {
  const linhas = [];
  (estado.sessoesMusculacao || [])
    .filter((s) => s.status === "concluida")
    .forEach((s) => {
      (s.exercicios || []).forEach((ex) => {
        (ex.series || []).forEach((serie) => {
          linhas.push([
            s.data ? formataData(s.data) : "",
            s.divisaoSnapshot,
            s.fichaNomeSnapshot,
            ex.nomeSnapshot,
            ex.grupoPrincipalSnapshot || "",
            serie.numero,
            serie.tipo,
            serie.cargaKg ?? "",
            serie.repeticoes ?? "",
            serie.rir ?? "",
            serie.rpe ?? "",
            s.duracaoSegundos ? formataDuracao(s.duracaoSegundos) : "",
            s.observacao || "",
          ]);
        });
      });
    });
  return montaCsv(
    ["Data", "Divisão", "Ficha", "Exercício", "Grupo", "Série", "Tipo", "Carga (kg)", "Repetições", "RIR", "RPE", "Duração do treino", "Observação"],
    linhas,
  );
}

export function csvCorridas(estado) {
  const linhas = (estado.corridas || []).map((c) => [
    c.data ? formataData(c.data) : "",
    c.distanciaKm ?? "",
    c.duracaoSegundos ? formataDuracao(c.duracaoSegundos) : "",
    formataRitmo(ritmoSegundosPorKm(c.distanciaKm, c.duracaoSegundos)),
    c.rpe ?? "",
    c.terreno ?? "",
    c.observacao || "",
  ]);
  return montaCsv(["Data", "Distância (km)", "Duração", "Ritmo", "Esforço", "Terreno", "Observação"], linhas);
}

export function csvPesagens(estado) {
  const linhas = (estado.pesagens || []).map((p) => [p.data ? formataData(p.data) : "", p.pesoKg ?? ""]);
  return montaCsv(["Data", "Peso (kg)"], linhas);
}

/* ------------------------------------------------- ajudantes de navegador */

export function baixaArquivo(nome, conteudo, tipo = "application/json") {
  const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  /* Revogar já libera a memória; o download em curso não depende mais da URL. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Compartilhar arquivo, quando o aparelho souber. Devolve false se não der,
 *  para quem chamou cair no download sem drama. */
export async function tentaCompartilhar(nome, conteudo) {
  if (typeof navigator === "undefined" || !navigator.canShare || !navigator.share) return false;
  try {
    const arquivo = new File([conteudo], nome, { type: "application/json" });
    if (!navigator.canShare({ files: [arquivo] })) return false;
    await navigator.share({ files: [arquivo], title: "Backup do Treino" });
    return true;
  } catch {
    return false;
  }
}

export function leArquivoComoTexto(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo) {
      reject(new Error("Nenhum arquivo escolhido."));
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      reject(new Error("O arquivo é grande demais para ser um backup deste app."));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result || ""));
    leitor.onerror = () => reject(new Error("Não deu para ler o arquivo."));
    leitor.readAsText(arquivo);
  });
}

export { estadoVazio, volumeSessao };

/* ---------------------------------------------------- lembrete de backup */
/* Enquanto a cópia não sai do aparelho, qualquer limpeza do navegador leva
   tudo — e não existe desfazer. Por isso o app cobra, em vez de esperar a
   pessoa lembrar sozinha. Só cobra quando há algo a perder. */
export const DIAS_ATE_LEMBRAR = 14;

export function precisaLembrarBackup(estado, dataDeHoje, limiteDias = DIAS_ATE_LEMBRAR) {
  const total =
    (estado.sessoesMusculacao?.length || 0) +
    (estado.corridas?.length || 0) +
    (estado.pesagens?.length || 0);
  if (total === 0) return null;

  const ultima = estado.configuracoes?.ultimaDataBackup;
  if (!ultima) return { motivo: "nunca", dias: null, registros: total };

  const dias = diferencaEmDias(ultima, dataDeHoje);
  if (dias === null || dias < limiteDias) return null;
  return { motivo: "antigo", dias, registros: total };
}
