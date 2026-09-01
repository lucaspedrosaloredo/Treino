import { useState } from "react";
import { Smartphone, RefreshCw, ChevronDown } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { MODOS_AGENDA } from "../../lib/schema.js";
import { TEMAS } from "../../lib/tema.js";
import { fichasAtivas, proximasFolgas, ehDiaDeTrabalho } from "../../lib/agenda.js";
import { pesoAtual } from "../../lib/calculos.js";
import { formataNumero } from "../../lib/numbers.js";
import { DIAS_SEMANA, formataData, hoje } from "../../lib/dates.js";
import { useInstalacao } from "../../hooks/useInstalacao.js";
import { useAtualizacao } from "../../hooks/useAtualizacao.js";

import Botao from "../../components/Botao.jsx";
import Campo, { Selecao, CampoNumerico } from "../../components/Campo.jsx";
import { Aviso, Cartao } from "../../components/Basicos.jsx";
import Fichas from "../musculacao/Fichas.jsx";
import MeusPlanos from "../corrida/MeusPlanos.jsx";
import Dados from "./Dados.jsx";

function Secao({ titulo, descricao, children, aberta, aoAlternar }) {
  return (
    <section className="mb-2" style={{ background: "var(--sup)", borderRadius: "var(--raio)" }}>
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberta}
        className="w-full flex items-center justify-between gap-2 p-3 text-left"
        style={{ minHeight: "var(--toque)" }}
      >
        <div className="min-w-0">
          <div className="text-sm" style={{ fontWeight: 600 }}>{titulo}</div>
          {descricao && (
            <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>{descricao}</div>
          )}
        </div>
        <ChevronDown size={16} style={{ color: "var(--txt-fraco)", flexShrink: 0, transform: aberta ? "rotate(180deg)" : "none" }} />
      </button>
      {aberta && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}

export default function Ajustes() {
  const [aberta, setAberta] = useState("perfil");
  const alterna = (chave) => setAberta((a) => (a === chave ? null : chave));

  return (
    <div>
      <Secao titulo="Perfil e medidas" aberta={aberta === "perfil"} aoAlternar={() => alterna("perfil")}>
        <Perfil />
      </Secao>
      <Secao titulo="Treinos e agenda" descricao="Fichas, modo de agenda, cronômetro" aberta={aberta === "treinos"} aoAlternar={() => alterna("treinos")}>
        <TreinosEAgenda />
      </Secao>
      <Secao titulo="Fichas" descricao="Criar, editar, duplicar, arquivar" aberta={aberta === "fichas"} aoAlternar={() => alterna("fichas")}>
        <Fichas />
      </Secao>
      <Secao titulo="Corrida" descricao="Planos e plano ativo" aberta={aberta === "corrida"} aoAlternar={() => alterna("corrida")}>
        <MeusPlanos />
      </Secao>
      <Secao titulo="Aparência e acessibilidade" aberta={aberta === "aparencia"} aoAlternar={() => alterna("aparencia")}>
        <Aparencia />
      </Secao>
      <Secao titulo="Dados e privacidade" descricao="Backup, exportação, apagar tudo" aberta={aberta === "dados"} aoAlternar={() => alterna("dados")}>
        <Dados />
      </Secao>
      <Secao titulo="Instalação e versão" aberta={aberta === "instalacao"} aoAlternar={() => alterna("instalacao")}>
        <Instalacao />
      </Secao>
    </div>
  );
}

/* ------------------------------------------------------------- perfil */

function Perfil() {
  const estado = useEstado();
  const despacha = useAcao();
  const peso = pesoAtual(estado.pesagens);

  return (
    <div>
      <Campo
        rotulo="Como quer ser chamado (opcional)"
        className="mb-3"
        ajuda="Fica só neste aparelho."
        value={estado.perfil.nome}
        onChange={(e) => despacha({ tipo: "PERFIL_ALTERADO", mudancas: { nome: e.target.value } })}
      />

      <div className="text-sm mb-2">
        Peso atual: <strong>{peso ? `${formataNumero(peso.pesoKg)} kg` : "sem pesagem"}</strong>
        {peso && <span className="text-xs" style={{ color: "var(--txt-fraco)" }}> · {formataData(peso.data)}</span>}
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--txt-fraco)" }}>
        Registrar, editar e ver o histórico de peso fica na aba Progresso, no Resumo.
      </p>

      <CampoNumerico
        rotulo="Meta de peso (opcional)"
        className="mb-3"
        valor={estado.perfil.metaPeso}
        aoMudar={(v) => despacha({ tipo: "PERFIL_ALTERADO", mudancas: { metaPeso: v } })}
      />

      <div className="grid grid-cols-2 gap-2">
        <Selecao rotulo="Unidade de peso" value={estado.configuracoes.unidadePeso}
          onChange={(e) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { unidadePeso: e.target.value } })}
          opcoes={[{ valor: "kg", rotulo: "Quilogramas (kg)" }]} />
        <Selecao rotulo="Unidade de distância" value={estado.configuracoes.unidadeDistancia}
          onChange={(e) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { unidadeDistancia: e.target.value } })}
          opcoes={[{ valor: "km", rotulo: "Quilômetros (km)" }]} />
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--txt-apagado)" }}>
        Por enquanto só kg e km — libra e milha entram quando houver conversão em todos os cálculos e gráficos,
        e meia conversão é pior que nenhuma.
      </p>
    </div>
  );
}

/* ------------------------------------------------- treinos e agenda */

function TreinosEAgenda() {
  const estado = useEstado();
  const despacha = useAcao();
  const cfg = estado.configuracoes;
  const ativas = fichasAtivas(estado);

  const mudaEscala = (mudancas) =>
    despacha({ tipo: "CONFIG_ALTERADA", mudancas: { escala12x36: { ...cfg.escala12x36, ...mudancas } } });

  return (
    <div>
      <Selecao
        rotulo="Modo de agenda"
        className="mb-2"
        value={cfg.modoAgenda}
        onChange={(e) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { modoAgenda: e.target.value } })}
        opcoes={Object.entries(MODOS_AGENDA).map(([valor, rotulo]) => ({ valor, rotulo }))}
      />
      <p className="text-xs mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
        {cfg.modoAgenda === "sequencia" && "Concluiu A, a próxima é B — não importa quantos dias passaram. É o modo que sobrevive a plantão, folga e viagem."}
        {cfg.modoAgenda === "semanal" && "Cada ficha fica presa a um dia da semana."}
        {cfg.modoAgenda === "escala12x36" && "O app calcula seus dias de trabalho e folga a partir de uma data de referência, e sugere treinar na folga. Você pode treinar em qualquer dia mesmo assim."}
      </p>

      {cfg.modoAgenda === "semanal" && (
        <div className="mb-3">
          {DIAS_SEMANA.map((dia, i) => (
            <Selecao
              key={dia}
              rotulo={dia}
              className="mb-2"
              value={cfg.agendaSemanal?.[String(i)] ?? ""}
              onChange={(e) =>
                despacha({
                  tipo: "CONFIG_ALTERADA",
                  mudancas: { agendaSemanal: { ...cfg.agendaSemanal, [String(i)]: e.target.value || undefined } },
                })
              }
            >
              <option value="" style={{ background: "var(--sup)" }}>Descanso</option>
              {ativas.map((f) => (
                <option key={f.id} value={f.id} style={{ background: "var(--sup)" }}>
                  {f.divisao} · {f.nome}
                </option>
              ))}
            </Selecao>
          ))}
        </div>
      )}

      {cfg.modoAgenda === "escala12x36" && (
        <Cartao className="mb-3">
          <Campo
            rotulo="Uma data que você sabe de cor"
            type="date"
            className="mb-2"
            value={cfg.escala12x36.dataReferencia ?? ""}
            onChange={(e) => mudaEscala({ dataReferencia: e.target.value || null })}
          />
          <Selecao
            rotulo="Nesse dia você"
            className="mb-2"
            value={cfg.escala12x36.referenciaEhTrabalho ? "trabalho" : "folga"}
            onChange={(e) => mudaEscala({ referenciaEhTrabalho: e.target.value === "trabalho" })}
            opcoes={[{ valor: "trabalho", rotulo: "Trabalhou" }, { valor: "folga", rotulo: "Folgou" }]}
          />
          <label className="flex items-center gap-2 text-sm" style={{ minHeight: "var(--toque)" }}>
            <input
              type="checkbox"
              checked={cfg.escala12x36.priorizarCombinadoNaFolga}
              onChange={(e) => mudaEscala({ priorizarCombinadoNaFolga: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            Juntar musculação e corrida nas folgas
          </label>

          {cfg.escala12x36.dataReferencia && (
            <div className="text-xs mt-2" style={{ color: "var(--txt-fraco)", lineHeight: 1.6 }}>
              Hoje ({formataData(hoje())}) é dia de <strong>{ehDiaDeTrabalho(hoje(), cfg) ? "trabalho" : "folga"}</strong>.
              <br />
              Próximas folgas: {proximasFolgas(cfg, hoje(), 3).map(formataData).join(", ") || "—"}
            </div>
          )}
        </Cartao>
      )}

      <Selecao
        rotulo="Primeiro dia da semana"
        className="mb-3"
        value={String(cfg.inicioSemana)}
        onChange={(e) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { inicioSemana: Number(e.target.value) } })}
        opcoes={DIAS_SEMANA.map((d, i) => ({ valor: String(i), rotulo: d }))}
      />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <CampoNumerico
          rotulo="Descanso padrão (s)"
          inteiro
          valor={cfg.descansoPadraoSegundos}
          aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { descansoPadraoSegundos: v ?? 0 } })}
        />
        <CampoNumerico
          rotulo="Incremento padrão (kg)"
          valor={cfg.incrementoPadrao}
          aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { incrementoPadrao: v ?? 2.5 } })}
        />
      </div>

      <Interruptor rotulo="Mostrar campo de RIR (repetições na reserva)" valor={cfg.exibirRir}
        aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { exibirRir: v } })} />
      <Interruptor rotulo="Mostrar campo de RPE (esforço percebido)" valor={cfg.exibirRpe}
        aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { exibirRpe: v } })} />
      <Interruptor rotulo="Oferecer preencher todas as séries com a carga sugerida" valor={cfg.preencherAnterior}
        aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { preencherAnterior: v } })} />
    </div>
  );
}

function Interruptor({ rotulo, valor, aoMudar }) {
  return (
    <label className="flex items-center gap-3 text-sm" style={{ minHeight: "var(--toque)" }}>
      <input type="checkbox" checked={Boolean(valor)} onChange={(e) => aoMudar(e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0 }} />
      <span>{rotulo}</span>
    </label>
  );
}

/* --------------------------------------------------------- aparência */

function Aparencia() {
  const estado = useEstado();
  const despacha = useAcao();
  const cfg = estado.configuracoes;

  return (
    <div>
      <Selecao
        rotulo="Tema"
        className="mb-2"
        value={cfg.tema || "escuro"}
        onChange={(e) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { tema: e.target.value } })}
        opcoes={Object.entries(TEMAS).map(([valor, rotulo]) => ({ valor, rotulo }))}
      />
      <p className="text-xs mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.6 }}>
        O escuro continua sendo o padrão, pensado para academia com luz baixa. O claro não é o escuro
        invertido: acento, verde e amarelo são mais escuros nele, senão o texto sumiria no branco.
      </p>
      <Interruptor
        rotulo="Reduzir animações"
        valor={cfg.reduzirAnimacoes}
        aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { reduzirAnimacoes: v } })}
      />
      <p className="text-xs mb-3" style={{ color: "var(--txt-apagado)" }}>
        Se o sistema já pede menos movimento, o app respeita sem precisar desta opção.
      </p>
      <Interruptor
        rotulo="Vibrar quando o descanso terminar"
        valor={cfg.vibrar}
        aoMudar={(v) => despacha({ tipo: "CONFIG_ALTERADA", mudancas: { vibrar: v } })}
      />
      <p className="text-xs" style={{ color: "var(--txt-apagado)" }}>
        Depende do aparelho. O iPhone não vibra por página web — nele a barra do cronômetro muda de cor.
      </p>
    </div>
  );
}

/* -------------------------------------------------------- instalação */

function Instalacao() {
  const { instalado, podeChamarPrompt, ehIOS, instalar } = useInstalacao();
  const estadoApp = useEstado();
  const { precisaDecidir, atualizar } = useAtualizacao({ podeAtualizarAgora: !estadoApp.sessaoEmAndamento });
  const estado = useEstado();

  return (
    <div>
      {precisaDecidir && (
        <div className="mb-3">
          <Aviso tipo="ok">
            <strong>Nova versão disponível.</strong> Atualizar recarrega a página — seus dados não são afetados.
            {estado.sessaoEmAndamento && " Você tem um treino em andamento; termine antes se preferir."}
          </Aviso>
          <Botao variante="primario" onClick={atualizar}>
            <RefreshCw size={16} /> Atualizar agora
          </Botao>
        </div>
      )}

      {instalado ? (
        <Aviso tipo="ok">O app já está instalado e rodando em tela cheia.</Aviso>
      ) : ehIOS ? (
        <Cartao>
          <div className="text-sm mb-2" style={{ fontWeight: 600 }}>
            <Smartphone size={15} style={{ display: "inline", marginRight: 6 }} />
            Instalar no iPhone
          </div>
          <ol className="text-xs" style={{ color: "var(--txt-fraco)", lineHeight: 1.8, paddingLeft: 18, listStyle: "decimal" }}>
            <li>Abra este site no Safari.</li>
            <li>Toque no botão Compartilhar, embaixo.</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
          </ol>
          <p className="text-xs mt-2" style={{ color: "var(--txt-apagado)" }}>
            O iPhone não deixa uma página pedir instalação sozinha — por isso o passo a passo.
          </p>
        </Cartao>
      ) : podeChamarPrompt ? (
        <Botao variante="primario" larguraTotal onClick={instalar}>
          <Smartphone size={16} /> Instalar na tela de início
        </Botao>
      ) : (
        <p className="text-xs" style={{ color: "var(--txt-fraco)", lineHeight: 1.6 }}>
          Seu navegador ainda não ofereceu a instalação. Ela costuma aparecer no menu do navegador,
          como "Instalar aplicativo" ou "Adicionar à tela inicial".
        </p>
      )}
    </div>
  );
}
