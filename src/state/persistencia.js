/* Carregar e salvar. Fica separado do provider para poder ser testado sem
   React e sem navegador — basta injetar um repositório de memória. */

import { criaRepositorio, CHAVE_V1, CHAVE_V2, CHAVE_BACKUP_V1 } from "../lib/storage.js";
import { migra, normalizaV2 } from "../lib/migrations.js";
import { estadoVazio } from "../lib/schema.js";
import { fichasIniciais, planosIniciais, exerciciosIniciais } from "../data/sementes.js";
import { agoraIso } from "../lib/dates.js";

/** Estado de quem abre o app pela primeira vez: já vem com as fichas e os
 *  planos curados, senão a primeira tela é um formulário em branco. */
export function estadoSemeado() {
  const base = estadoVazio();
  const { exercicios, fichas } = fichasIniciais();
  return {
    ...base,
    exercicios: [...exercicios, ...exerciciosIniciais()],
    fichas,
    modelosCorrida: planosIniciais().modelos,
    planosCorrida: planosIniciais().planos,
  };
}

/**
 * Devolve `{ estado, avisos, origem }`.
 * origem: "v2" (já estava migrado), "v1" (migrou agora), "novo" (primeira vez)
 * ou "recuperado" (o conteúdo estava corrompido).
 */
export function carregaEstado(repositorio = criaRepositorio()) {
  const v2 = repositorio.lerJson(CHAVE_V2);

  if (v2 && !v2.__invalido) {
    return { estado: normalizaV2(v2), avisos: [], origem: "v2" };
  }
  if (v2 && v2.__invalido) {
    /* Não sobrescrevemos: o conteúdo cru fica guardado para eventual resgate
       manual, e o app segue com o que der para recuperar da v1 ou do zero. */
    repositorio.escreverJson(`${CHAVE_V2}:corrompido:${Date.now()}`, v2.cru);
  }

  const v1 = repositorio.lerJson(CHAVE_V1);
  if (v1 && !v1.__invalido) {
    const { estado, avisos } = migra(v1);
    /* Cópia intacta da v1 antes de qualquer coisa. A chave original também
       continua onde está — nada é apagado nesta versão. */
    if (!repositorio.existe(CHAVE_BACKUP_V1)) repositorio.escreverJson(CHAVE_BACKUP_V1, v1);
    salvaEstado(estado, repositorio);
    return {
      estado,
      avisos,
      origem: v2 && v2.__invalido ? "recuperado" : "v1",
    };
  }

  const novo = estadoSemeado();
  salvaEstado(novo, repositorio);
  return { estado: novo, avisos: [], origem: "novo" };
}

/** Devolve null em caso de sucesso, ou a mensagem de erro. */
export function salvaEstado(estado, repositorio = criaRepositorio()) {
  try {
    repositorio.escreverJson(CHAVE_V2, { ...estado, metadados: { ...estado.metadados, atualizadoEm: agoraIso() } });
    return null;
  } catch (e) {
    const semEspaco = e && (e.name === "QuotaExceededError" || e.code === 22);
    return semEspaco
      ? "O aparelho ficou sem espaço para salvar. Exporte um backup e apague dados antigos do navegador."
      : "Não deu para salvar neste aparelho. Se estiver numa janela privada, os dados não persistem.";
  }
}
