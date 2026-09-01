import { useRef, useState } from "react";
import { Download, Upload, Share2, FileSpreadsheet, ShieldAlert } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import {
  montaBackup, nomeDoArquivo, interpretaBackup, baixaArquivo, tentaCompartilhar,
  leArquivoComoTexto, csvSessoes, csvCorridas, csvPesagens, resumoDoEstado,
} from "../../lib/backup.js";
import { estadoSemeado } from "../../state/persistencia.js";
import { hoje, formataData } from "../../lib/dates.js";

import Botao from "../../components/Botao.jsx";
import Modal from "../../components/Modal.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import { Aviso, Cartao } from "../../components/Basicos.jsx";

export default function Dados() {
  const estado = useEstado();
  const despacha = useAcao();
  const entrada = useRef(null);
  const [aviso, setAviso] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  const exportar = async ({ compartilhar }) => {
    const conteudo = JSON.stringify(montaBackup(estado), null, 2);
    const nome = nomeDoArquivo();
    const compartilhou = compartilhar ? await tentaCompartilhar(nome, conteudo) : false;
    if (!compartilhou) baixaArquivo(nome, conteudo);
    despacha({ tipo: "CONFIG_ALTERADA", mudancas: { ultimaDataBackup: hoje() } });
    setAviso({ tipo: "ok", texto: compartilhou ? "Backup compartilhado." : `Arquivo ${nome} gerado.` });
  };

  const escolheArquivo = async (evento) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    try {
      const texto = await leArquivoComoTexto(arquivo);
      const r = interpretaBackup(texto);
      if (!r.ok) {
        setAviso({ tipo: "erro", texto: r.erro });
        return;
      }
      setPrevia(r);
      setAviso(null);
    } catch (e) {
      setAviso({ tipo: "erro", texto: e.message });
    }
  };

  const restaura = () => {
    /* Fotografia do que existe agora, antes de substituir. Se a restauração
       trouxer a coisa errada, o caminho de volta ainda existe. */
    const anterior = JSON.stringify(montaBackup(estado), null, 2);
    baixaArquivo(`treino-antes-da-restauracao-${hoje()}.json`, anterior);
    despacha({ tipo: "ESTADO_SUBSTITUIDO", estado: previa.estado });
    setAviso({
      tipo: "ok",
      texto: "Backup restaurado. O estado anterior foi baixado como arquivo, por segurança.",
    });
    setPrevia(null);
  };

  const atual = resumoDoEstado(estado);

  return (
    <div>
      <Cartao className="mb-3">
        <div className="text-sm mb-1" style={{ fontWeight: 600 }}>Seus dados ficam neste aparelho</div>
        <p className="text-xs" style={{ color: "var(--txt-fraco)", lineHeight: 1.6 }}>
          Não há servidor, conta nem sincronização. Nada sai daqui sem você mandar. Em compensação,
          <strong> limpar os dados do navegador ou trocar de aparelho apaga o que não foi exportado.</strong>
        </p>
        <div className="text-xs mt-2" style={{ color: "var(--txt-apagado)" }}>
          Último backup: {estado.configuracoes.ultimaDataBackup ? formataData(estado.configuracoes.ultimaDataBackup) : "nunca"}
          {" · "}
          {atual.sessoes} treinos, {atual.corridas} corridas, {atual.pesagens} pesagens
        </div>
      </Cartao>

      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      <div className="flex flex-wrap gap-2 mb-2">
        <Botao variante="primario" onClick={() => exportar({ compartilhar: false })}>
          <Download size={16} /> Exportar backup
        </Botao>
        <Botao onClick={() => exportar({ compartilhar: true })}>
          <Share2 size={16} /> Compartilhar
        </Botao>
        <Botao onClick={() => entrada.current?.click()}>
          <Upload size={16} /> Importar
        </Botao>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="application/json,.json"
        onChange={escolheArquivo}
        aria-label="Escolher arquivo de backup"
        style={{ display: "none" }}
      />

      <div className="text-sm mt-4 mb-1" style={{ fontWeight: 600 }}>Exportar para planilha</div>
      <p className="text-xs mb-2" style={{ color: "var(--txt-fraco)" }}>
        Arquivos separados, com cabeçalho em português. Servem para análise — não para restaurar.
      </p>
      <div className="flex flex-wrap gap-2">
        <Botao compacto onClick={() => baixaArquivo(`treino-musculacao-${hoje()}.csv`, csvSessoes(estado), "text/csv")}>
          <FileSpreadsheet size={14} /> Musculação
        </Botao>
        <Botao compacto onClick={() => baixaArquivo(`treino-corridas-${hoje()}.csv`, csvCorridas(estado), "text/csv")}>
          <FileSpreadsheet size={14} /> Corridas
        </Botao>
        <Botao compacto onClick={() => baixaArquivo(`treino-peso-${hoje()}.csv`, csvPesagens(estado), "text/csv")}>
          <FileSpreadsheet size={14} /> Peso
        </Botao>
      </div>

      <div className="text-sm mt-6 mb-1" style={{ fontWeight: 600, color: "var(--perigo)" }}>Zona de risco</div>
      <Botao
        variante="perigo"
        larguraTotal
        onClick={() =>
          setConfirmacao({
            titulo: "Apagar tudo e recomeçar?",
            texto: `Isso apaga ${atual.sessoes} treinos, ${atual.corridas} corridas, ${atual.pesagens} pesagens e todas as fichas. Não dá para desfazer. Exporte um backup antes se tiver qualquer dúvida.`,
            acao: "Apagar tudo",
            fraseExigida: "APAGAR",
            aoConfirmar: () => {
              despacha({ tipo: "ESTADO_SUBSTITUIDO", estado: estadoSemeado() });
              setAviso({ tipo: "ok", texto: "Tudo apagado. O app voltou às fichas e planos iniciais." });
            },
          })
        }
      >
        <ShieldAlert size={16} /> Apagar tudo e recomeçar
      </Botao>

      <Modal
        aberto={Boolean(previa)}
        aoFechar={() => setPrevia(null)}
        titulo="Conferir antes de restaurar"
        descricao="Restaurar substitui tudo que está no app agora."
        rodape={
          <>
            <Botao variante="fantasma" larguraTotal onClick={() => setPrevia(null)}>Cancelar</Botao>
            <Botao variante="perigoSolido" larguraTotal onClick={restaura}>Substituir tudo</Botao>
          </>
        }
      >
        {previa && (
          <>
            <div className="text-xs mb-2" style={{ color: "var(--txt-fraco)" }}>
              {previa.origem === "v1" ? "Backup da versão anterior — será migrado ao restaurar." : "Backup desta versão."}
            </div>
            <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr style={{ color: "var(--txt-fraco)" }}>
                  <th className="text-left text-xs pb-1">Conteúdo</th>
                  <th className="text-right text-xs pb-1">No arquivo</th>
                  <th className="text-right text-xs pb-1">No app agora</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Fichas", "fichas"], ["Exercícios", "exercicios"], ["Treinos", "sessoes"],
                  ["Corridas", "corridas"], ["Pesagens", "pesagens"], ["Planos", "planos"],
                ].map(([rotulo, chave]) => (
                  <tr key={chave}>
                    <td className="py-1">{rotulo}</td>
                    <td className="text-right py-1">{previa.resumo[chave]}</td>
                    <td className="text-right py-1" style={{ color: "var(--txt-fraco)" }}>{atual[chave]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previa.avisos?.length > 0 && (
              <div className="mt-3">
                <Aviso tipo="atencao">
                  {previa.avisos.map((a, i) => (
                    <div key={i} className="mb-1">{a}</div>
                  ))}
                </Aviso>
              </div>
            )}
            <p className="text-xs mt-3" style={{ color: "var(--txt-apagado)", lineHeight: 1.5 }}>
              Antes de substituir, o app baixa automaticamente um arquivo com o estado atual.
            </p>
          </>
        )}
      </Modal>

      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </div>
  );
}
