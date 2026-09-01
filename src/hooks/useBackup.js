import { useCallback } from "react";

import { useAcao, useEstado } from "../state/contexto.js";
import { montaBackup, nomeDoArquivo, baixaArquivo, tentaCompartilhar } from "../lib/backup.js";
import { hoje } from "../lib/dates.js";

/* Exportar mora num lugar só: a aba Hoje e a tela de Ajustes chamam o mesmo
   caminho, e a data do último backup é registrada nas duas. */
export function useExportarBackup() {
  const estado = useEstado();
  const despacha = useAcao();

  return useCallback(
    async ({ compartilhar = false } = {}) => {
      const conteudo = JSON.stringify(montaBackup(estado), null, 2);
      const nome = nomeDoArquivo();
      const compartilhou = compartilhar ? await tentaCompartilhar(nome, conteudo) : false;
      if (!compartilhou) baixaArquivo(nome, conteudo);
      despacha({ tipo: "CONFIG_ALTERADA", mudancas: { ultimaDataBackup: hoje() } });
      return { nome, compartilhou };
    },
    [estado, despacha],
  );
}
