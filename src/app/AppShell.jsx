import { useEffect, useState } from "react";

import { ABAS, ABA_PADRAO } from "./navegacao.js";
import { useDespacho, useEstado } from "../state/contexto.js";
import { Aviso } from "../components/Basicos.jsx";
import Botao from "../components/Botao.jsx";
import { formataData, hoje, nomeDoDia } from "../lib/dates.js";

import Hoje from "../features/hoje/Hoje.jsx";
import Musculacao from "../features/musculacao/Musculacao.jsx";
import Corrida from "../features/corrida/Corrida.jsx";
import ProgressoTela from "../features/progresso/Progresso.jsx";
import Ajustes from "../features/ajustes/Ajustes.jsx";

const TELAS = {
  hoje: Hoje,
  treino: Musculacao,
  corrida: Corrida,
  progresso: ProgressoTela,
  ajustes: Ajustes,
};

export default function AppShell() {
  const estado = useEstado();
  const { erroAoSalvar, avisosMigracao, origemDosDados, dispensaAvisos } = useDespacho();
  const [aba, setAba] = useState(ABA_PADRAO);
  const definicao = ABAS.find((a) => a.chave === aba) || ABAS[0];
  const Tela = TELAS[aba];

  /* Ir para outra aba deve começar do topo, não no meio da rolagem anterior. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [aba]);

  const treinoEmAndamento = Boolean(estado.sessaoEmAndamento);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--fundo)",
        color: "var(--txt)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        paddingBottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <header className="px-3 pt-4 pb-3">
        <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>
          {nomeDoDia(hoje())}, {formataData(hoje())}
        </div>
        <h1 className="text-2xl mt-1" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          {definicao.titulo}
        </h1>
      </header>

      <div className="px-3">
        {erroAoSalvar && <Aviso tipo="erro">{erroAoSalvar}</Aviso>}

        {avisosMigracao.length > 0 && (
          <div className="mb-3">
            <Aviso tipo="atencao">
              <strong>Seus dados da versão anterior foram migrados.</strong> Alguns pontos precisaram de atenção:
              <ul className="mt-2 mb-2" style={{ listStyle: "disc", paddingLeft: 18 }}>
                {avisosMigracao.map((a, i) => (
                  <li key={i} className="mb-1">
                    {a}
                  </li>
                ))}
              </ul>
              A cópia dos dados antigos continua guardada neste aparelho.
            </Aviso>
            <Botao compacto onClick={dispensaAvisos}>
              Entendi
            </Botao>
          </div>
        )}

        {origemDosDados === "v1" && avisosMigracao.length === 0 && (
          <Aviso tipo="ok">Seus dados da versão anterior foram migrados sem perdas.</Aviso>
        )}

        <main>
          <Tela irPara={setAba} />
        </main>
      </div>

      <nav
        aria-label="Seções do app"
        className="fixed bottom-0 left-0 right-0 flex"
        style={{
          background: "var(--sup)",
          borderTop: "1px solid var(--linha)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          zIndex: 40,
        }}
      >
        {ABAS.map((a) => {
          const Icone = a.icone;
          const ativa = a.chave === aba;
          const marca = a.chave === "treino" && treinoEmAndamento;
          return (
            <button
              key={a.chave}
              type="button"
              onClick={() => setAba(a.chave)}
              aria-current={ativa ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1"
              style={{
                minHeight: 56,
                color: ativa ? "var(--txt)" : "var(--txt-fraco)",
                borderTop: `2px solid ${ativa ? "var(--acento)" : "transparent"}`,
                position: "relative",
              }}
            >
              <Icone size={18} />
              <span className="text-xs">{a.rotulo}</span>
              {marca && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute", top: 6, right: "50%", marginRight: -16,
                    width: 7, height: 7, borderRadius: "50%", background: "var(--acento)",
                  }}
                />
              )}
              {marca && <span className="sr-only">treino em andamento</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
