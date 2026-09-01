import { useState } from "react";
import { Check, CalendarClock, SkipForward, Play } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { planoCorridaAtivo, semanaAtualDoPlano, progressoDoPlano } from "../../lib/agenda.js";
import { TIPOS_SESSAO_CORRIDA } from "../../lib/schema.js";
import { formataDuracao } from "../../lib/calculos.js";
import { formataData, DIAS_SEMANA } from "../../lib/dates.js";

import Botao from "../../components/Botao.jsx";
import Campo from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import { Cartao, EstadoVazio, Etiqueta, Progresso } from "../../components/Basicos.jsx";
import RegistrarCorrida from "./RegistrarCorrida.jsx";

const CORES_TIPO = {
  facil: "var(--div-d)", recuperacao: "var(--div-e)", velocidade: "var(--div-a)",
  intervalado: "var(--div-a)", limiar: "var(--div-c)", longao: "var(--acento)",
  teste: "var(--div-b)", prova: "var(--div-a)",
};

export default function PlanoAtual() {
  const estado = useEstado();
  const despacha = useAcao();
  const [registrando, setRegistrando] = useState(null);
  const [reagendando, setReagendando] = useState(null);

  const plano = planoCorridaAtivo(estado);
  if (!plano) {
    return (
      <EstadoVazio
        titulo="Nenhum plano ativo"
        texto="Ative um dos planos em Meus planos, ou crie uma periodização do zero. Você também pode registrar corridas avulsas sem plano nenhum."
        acao={<Botao variante="primario" onClick={() => setRegistrando({ vinculo: null })}>Registrar corrida avulsa</Botao>}
      />
    );
  }

  const semana = semanaAtualDoPlano(plano);
  const progresso = progressoDoPlano(plano);

  return (
    <div>
      <Cartao className="mb-3">
        <div className="text-sm" style={{ fontWeight: 600 }}>{plano.nome}</div>
        {plano.descricao && (
          <p className="text-xs mt-1 mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>{plano.descricao}</p>
        )}
        <Progresso percentual={progresso.percentual} rotulo={`${progresso.concluidas} de ${progresso.total} sessões`} />
      </Cartao>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-sm" style={{ fontWeight: 600 }}>
          Semana {semana?.numero ?? "—"} de {plano.semanas.length}
          {semana?.reducao && <Etiqueta cor="var(--aviso)"> redução</Etiqueta>}
        </div>
        <Botao compacto onClick={() => setRegistrando({ vinculo: null })}>Corrida avulsa</Botao>
      </div>

      {semana?.foco && (
        <p className="text-xs mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>{semana.foco}</p>
      )}

      {semana?.sessoes.map((s) => (
        <Cartao key={s.id} cor={CORES_TIPO[s.tipo]} className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Etiqueta cor={CORES_TIPO[s.tipo]}>{TIPOS_SESSAO_CORRIDA[s.tipo]}</Etiqueta>
                {s.status !== "planejada" && <Etiqueta>{s.status}</Etiqueta>}
              </div>
              <div className="text-sm mt-2" style={{ fontWeight: 500 }}>{s.nome}</div>
              {s.objetivo && (
                <p className="text-xs mt-1" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>{s.objetivo}</p>
              )}
              <div className="text-xs mt-1" style={{ color: "var(--txt-apagado)" }}>
                {s.dataPlanejada ? formataData(s.dataPlanejada) : s.diaSemana !== null ? DIAS_SEMANA[s.diaSemana] : "sem dia fixo"}
                {s.duracaoSegundos ? ` · ${formataDuracao(s.duracaoSegundos)}` : ""}
              </div>
            </div>
          </div>

          {s.status === "planejada" && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Botao compacto variante="primario" onClick={() => setRegistrando({ vinculo: { plano, sessao: s } })}>
                <Check size={14} /> Registrar
              </Botao>
              <Botao compacto onClick={() => setReagendando(s)}>
                <CalendarClock size={14} /> Reagendar
              </Botao>
              <Botao
                compacto
                onClick={() =>
                  despacha({ tipo: "SESSAO_PLANEJADA_ATUALIZADA", planoId: plano.id, sessaoId: s.id, mudancas: { status: "pulada" } })
                }
              >
                <SkipForward size={14} /> Pular
              </Botao>
            </div>
          )}
          {s.status !== "planejada" && (
            <Botao
              compacto
              className="mt-3"
              onClick={() =>
                despacha({ tipo: "SESSAO_PLANEJADA_ATUALIZADA", planoId: plano.id, sessaoId: s.id, mudancas: { status: "planejada" } })
              }
            >
              <Play size={14} /> Voltar para planejada
            </Botao>
          )}
        </Cartao>
      ))}

      <div className="mt-4">
        <div className="text-sm mb-2" style={{ fontWeight: 600 }}>Marcar semana à mão</div>
        <p className="text-xs mb-2" style={{ color: "var(--txt-fraco)" }}>
          O plano não precisa seguir o calendário. Se você atrasou ou adiantou, escolha a semana em que está.
        </p>
        <div className="flex flex-wrap gap-2">
          {plano.semanas.map((s) => (
            <Botao
              key={s.id}
              compacto
              variante={semana?.id === s.id ? "primario" : "secundario"}
              onClick={() => despacha({ tipo: "PLANO_ATUALIZADO", planoId: plano.id, mudancas: { semanaAtualManual: s.id } })}
            >
              {s.numero}
            </Botao>
          ))}
        </div>
      </div>

      <RegistrarCorrida
        aberto={Boolean(registrando)}
        aoFechar={() => setRegistrando(null)}
        vinculo={registrando?.vinculo}
      />

      <Modal
        aberto={Boolean(reagendando)}
        aoFechar={() => setReagendando(null)}
        titulo="Reagendar sessão"
        descricao="A sessão continua no plano e na semana de origem — só muda a data prevista."
        rodape={<Botao variante="primario" larguraTotal onClick={() => setReagendando(null)}>Pronto</Botao>}
      >
        {reagendando && (
          <Campo
            rotulo="Nova data"
            type="date"
            value={reagendando.dataPlanejada ?? ""}
            onChange={(e) => {
              despacha({
                tipo: "SESSAO_PLANEJADA_ATUALIZADA",
                planoId: plano.id,
                sessaoId: reagendando.id,
                mudancas: { dataPlanejada: e.target.value || null, status: "planejada" },
              });
              setReagendando({ ...reagendando, dataPlanejada: e.target.value });
            }}
          />
        )}
      </Modal>
    </div>
  );
}
