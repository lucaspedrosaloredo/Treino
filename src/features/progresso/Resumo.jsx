import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

import { useAcao } from "../../state/contexto.js";
import {
  consistenciaPorSemana, dentroDoPeriodo, resumoCorridas, pesoAtual, variacaoPeso,
  volumeSessao, formataDuracao,
} from "../../lib/calculos.js";
import { formataNumero, paraNumeroPositivo } from "../../lib/numbers.js";
import { formataData, formataDataCurta, hoje } from "../../lib/dates.js";

import Botao, { BotaoIcone } from "../../components/Botao.jsx";
import Campo from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import Confirmar from "../../components/Confirmar.jsx";
import { Metrica, EstadoVazio, Cartao, Titulo, Aviso } from "../../components/Basicos.jsx";
import { GraficoTardio } from "./Progresso.jsx";

export default function Resumo({ estado, intervalo }) {
  const sessoes = useMemo(
    () => estado.sessoesMusculacao.filter((s) => s.status === "concluida" && dentroDoPeriodo(s.data, intervalo)),
    [estado.sessoesMusculacao, intervalo],
  );
  const corridas = useMemo(() => resumoCorridas(estado.corridas, intervalo), [estado.corridas, intervalo]);
  const consistencia = useMemo(
    () => consistenciaPorSemana(estado.sessoesMusculacao, intervalo, estado.configuracoes.inicioSemana),
    [estado.sessoesMusculacao, intervalo, estado.configuracoes.inicioSemana],
  );

  const tempoTreinando = sessoes.reduce((s, x) => s + (x.duracaoSegundos || 0), 0);
  const peso = pesoAtual(estado.pesagens);
  const variacao = variacaoPeso(estado.pesagens, intervalo);

  const dadosConsistencia = consistencia.map((c) => ({ rotulo: formataDataCurta(c.semana), treinos: c.total }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Metrica rotulo="Treinos concluídos" valor={sessoes.length} />
        <Metrica rotulo="Corridas" valor={corridas.total} />
        <Metrica rotulo="Distância" valor={`${formataNumero(corridas.distancia)} km`} />
        <Metrica
          rotulo="Tempo de treino"
          valor={tempoTreinando ? formataDuracao(tempoTreinando) : "—"}
          detalhe={tempoTreinando ? null : "sessões antigas não têm duração"}
        />
        <Metrica rotulo="Peso atual" valor={peso ? `${formataNumero(peso.pesoKg)} kg` : "—"}
          detalhe={peso ? formataData(peso.data) : "sem pesagem"} />
        <Metrica
          rotulo="Variação no período"
          valor={variacao ? `${variacao.absoluta > 0 ? "+" : ""}${formataNumero(variacao.absoluta)} kg` : "—"}
          detalhe={variacao ? `${formataNumero(variacao.percentual)}%` : "precisa de 2 pesagens"}
        />
      </div>

      <Titulo>Consistência por semana</Titulo>
      {consistencia.length === 0 ? (
        <EstadoVazio titulo="Sem treinos no período" texto="Finalize um treino na aba Musculação para este gráfico aparecer." />
      ) : (
        <>
          <GraficoTardio
            tipo="barra"
            dados={dadosConsistencia}
            series={[{ chave: "treinos", nome: "Treinos", cor: "#7FC4E8" }]}
            altura={150}
          />
          <p className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
            {consistencia.map((c) => `${formataDataCurta(c.semana)}: ${c.total}`).join(" · ")}
          </p>
        </>
      )}

      <Peso estado={estado} intervalo={intervalo} />

      <Titulo>Atividades recentes</Titulo>
      <AtividadesRecentes estado={estado} intervalo={intervalo} />
    </div>
  );
}

/* ---------------------------------------------------------------- peso */

function Peso({ estado, intervalo }) {
  const despacha = useAcao();
  const [novo, setNovo] = useState({ data: hoje(), valor: "" });
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [erro, setErro] = useState(null);
  const [listar, setListar] = useState(false);

  const noPeriodo = estado.pesagens.filter((p) => dentroDoPeriodo(p.data, intervalo));
  const dados = noPeriodo.map((p) => ({ rotulo: formataDataCurta(p.data), peso: p.pesoKg }));

  const registrar = () => {
    const valor = paraNumeroPositivo(novo.valor);
    if (valor === null || valor === 0) {
      setErro("Informe um peso válido, como 79,4.");
      return;
    }
    if (!novo.data) {
      setErro("Escolha a data da pesagem.");
      return;
    }
    const existente = estado.pesagens.find((p) => p.data === novo.data);
    if (existente) {
      setConfirmacao({
        titulo: "Já existe pesagem nesta data",
        texto: `${formataData(novo.data)} tem ${formataNumero(existente.pesoKg)} kg registrado. Substituir por ${formataNumero(valor)} kg?`,
        acao: "Substituir",
        aoConfirmar: () => {
          despacha({ tipo: "PESAGEM_REGISTRADA", data: novo.data, pesoKg: valor });
          setNovo({ data: hoje(), valor: "" });
        },
      });
      setErro(null);
      return;
    }
    despacha({ tipo: "PESAGEM_REGISTRADA", data: novo.data, pesoKg: valor });
    setNovo({ data: hoje(), valor: "" });
    setErro(null);
  };

  return (
    <div>
      <Titulo acao={<Botao compacto onClick={() => setListar(true)}>Ver histórico</Botao>}>Peso corporal</Titulo>

      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
        <Campo rotulo="Data" type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} />
        <Campo rotulo="Peso (kg)" type="text" inputMode="decimal" placeholder="79,4" value={novo.valor}
          onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
        <div className="flex items-end">
          <Botao variante="primario" onClick={registrar} aria-label="Registrar peso">
            <Plus size={16} />
          </Botao>
        </div>
      </div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {dados.length > 1 ? (
        <>
          <GraficoTardio tipo="linha" dados={dados} series={[{ chave: "peso", nome: "Peso (kg)", cor: "#C4C9C2" }]} altura={160} />
          <p className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
            De {formataNumero(dados[0].peso)} kg a {formataNumero(dados[dados.length - 1].peso)} kg no período,
            em {dados.length} pesagens.
          </p>
        </>
      ) : (
        <p className="text-xs" style={{ color: "var(--txt-apagado)" }}>
          Registre pelo menos duas pesagens no período para ver a tendência.
        </p>
      )}

      <Modal
        aberto={listar}
        aoFechar={() => setListar(false)}
        titulo="Histórico de peso"
        rodape={<Botao variante="primario" larguraTotal onClick={() => setListar(false)}>Fechar</Botao>}
      >
        {estado.pesagens.length === 0 && (
          <p className="text-xs" style={{ color: "var(--txt-fraco)" }}>Nenhuma pesagem registrada.</p>
        )}
        {[...estado.pesagens].reverse().map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 mb-1 p-2"
            style={{ background: "var(--sup2)", borderRadius: 3 }}>
            <div className="text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formataData(p.data)} · {formataNumero(p.pesoKg)} kg
            </div>
            <div className="flex">
              <BotaoIcone rotulo={`Editar pesagem de ${formataData(p.data)}`} onClick={() => setEditando(p)} style={{ minWidth: 38 }}>
                <Pencil size={15} />
              </BotaoIcone>
              <BotaoIcone
                rotulo={`Excluir pesagem de ${formataData(p.data)}`}
                onClick={() =>
                  setConfirmacao({
                    titulo: "Excluir pesagem?",
                    texto: `${formataData(p.data)} · ${formataNumero(p.pesoKg)} kg`,
                    acao: "Excluir",
                    aoConfirmar: () => despacha({ tipo: "PESAGEM_REMOVIDA", pesagemId: p.id }),
                  })
                }
                style={{ minWidth: 38 }}
              >
                <Trash2 size={15} />
              </BotaoIcone>
            </div>
          </div>
        ))}
      </Modal>

      <Modal
        aberto={Boolean(editando)}
        aoFechar={() => setEditando(null)}
        titulo="Editar pesagem"
        rodape={<Botao variante="primario" larguraTotal onClick={() => setEditando(null)}>Pronto</Botao>}
      >
        {editando && (
          <div className="grid grid-cols-2 gap-2">
            <Campo rotulo="Data" type="date" value={editando.data}
              onChange={(e) => {
                despacha({ tipo: "PESAGEM_ATUALIZADA", pesagemId: editando.id, mudancas: { data: e.target.value } });
                setEditando({ ...editando, data: e.target.value });
              }} />
            <Campo rotulo="Peso (kg)" type="text" inputMode="decimal" value={editando.pesoKg ?? ""}
              onChange={(e) => {
                const v = paraNumeroPositivo(e.target.value);
                despacha({ tipo: "PESAGEM_ATUALIZADA", pesagemId: editando.id, mudancas: { pesoKg: v } });
                setEditando({ ...editando, pesoKg: e.target.value });
              }} />
          </div>
        )}
      </Modal>

      <Confirmar pedido={confirmacao} aoFechar={() => setConfirmacao(null)} />
    </div>
  );
}

/* --------------------------------------------------- atividades recentes */

function AtividadesRecentes({ estado, intervalo }) {
  const itens = useMemo(() => {
    const treinos = estado.sessoesMusculacao
      .filter((s) => s.status === "concluida" && dentroDoPeriodo(s.data, intervalo))
      .map((s) => ({
        id: s.id, tipo: "treino", data: s.data,
        titulo: `${s.divisaoSnapshot} · ${s.fichaNomeSnapshot}`,
        detalhe: `${formataNumero(volumeSessao(s), 0)} kg de volume`,
      }));
    const corridas = estado.corridas
      .filter((c) => dentroDoPeriodo(c.data, intervalo))
      .map((c) => ({
        id: c.id, tipo: "corrida", data: c.data,
        titulo: c.distanciaKm ? `${formataNumero(c.distanciaKm)} km` : "Corrida",
        detalhe: c.duracaoSegundos ? formataDuracao(c.duracaoSegundos) : "sem duração",
      }));
    return [...treinos, ...corridas]
      .sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? "")))
      .slice(0, 12);
  }, [estado, intervalo]);

  if (!itens.length) {
    return <EstadoVazio titulo="Nada no período" texto="Treinos e corridas registrados aparecem aqui em ordem, do mais recente ao mais antigo." />;
  }

  return itens.map((i) => (
    <Cartao key={i.id} cor={i.tipo === "treino" ? "var(--div-b)" : "var(--acento)"} className="mb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm truncate">{i.titulo}</div>
          <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
            {/* O tipo aparece escrito, não só pela cor da borda. */}
            {i.tipo === "treino" ? "Musculação" : "Corrida"} · {i.data ? formataData(i.data) : "sem data"} · {i.detalhe}
          </div>
        </div>
      </div>
    </Cartao>
  ));
}
