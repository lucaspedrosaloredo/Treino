import { useMemo, useState } from "react";
import { Play, Footprints, Scale, Sparkles } from "lucide-react";

import { useAcao, useEstado } from "../../state/contexto.js";
import { planoDoDia, proximaSessaoCorrida, fichasAtivas, ehDiaDeTrabalho } from "../../lib/agenda.js";
import { TIPOS_SESSAO_CORRIDA } from "../../lib/schema.js";
import { dentroDoPeriodo, volumeSessao, pesoAtual, formataDuracao } from "../../lib/calculos.js";
import { formataNumero, paraNumeroPositivo } from "../../lib/numbers.js";
import { formataData, hoje, somaDias } from "../../lib/dates.js";

import Botao from "../../components/Botao.jsx";
import Campo from "../../components/Campo.jsx";
import Modal from "../../components/Modal.jsx";
import { Cartao, Metrica, EstadoVazio, Etiqueta, Aviso, Titulo } from "../../components/Basicos.jsx";
import RegistrarCorrida from "../corrida/RegistrarCorrida.jsx";

export default function Hoje({ irPara }) {
  const estado = useEstado();
  const despacha = useAcao();
  const [registrandoCorrida, setRegistrandoCorrida] = useState(false);
  const [pesando, setPesando] = useState(false);

  const hojeChave = hoje();
  const treino = planoDoDia(estado, hojeChave);
  const corrida = proximaSessaoCorrida(estado, hojeChave);
  const ativas = fichasAtivas(estado);
  const emAndamento = estado.sessaoEmAndamento;

  const intervalo7 = useMemo(() => ({ de: somaDias(hojeChave, -6), ate: hojeChave }), [hojeChave]);
  const sete = useMemo(() => {
    const treinos = estado.sessoesMusculacao.filter((s) => s.status === "concluida" && dentroDoPeriodo(s.data, intervalo7));
    const corridas = estado.corridas.filter((c) => dentroDoPeriodo(c.data, intervalo7));
    return {
      treinos: treinos.length,
      corridas: corridas.length,
      distancia: corridas.reduce((s, c) => s + (c.distanciaKm || 0), 0),
      volume: treinos.reduce((s, t) => s + volumeSessao(t), 0),
    };
  }, [estado.sessoesMusculacao, estado.corridas, intervalo7]);

  const sequencia = useMemo(() => calculaSequencia(estado, hojeChave), [estado, hojeChave]);
  const peso = pesoAtual(estado.pesagens);
  const combinado = Boolean(treino.ficha) && Boolean(corrida);
  const diaDeTrabalho = ehDiaDeTrabalho(hojeChave, estado.configuracoes);

  const recentes = useMemo(() => {
    const t = estado.sessoesMusculacao
      .filter((s) => s.status === "concluida")
      .map((s) => ({ id: s.id, tipo: "Musculação", data: s.data, titulo: `${s.divisaoSnapshot} · ${s.fichaNomeSnapshot}`,
        detalhe: `${formataNumero(volumeSessao(s), 0)} kg de volume` }));
    const c = estado.corridas.map((x) => ({
      id: x.id, tipo: "Corrida", data: x.data,
      titulo: x.distanciaKm ? `${formataNumero(x.distanciaKm)} km` : "Corrida",
      detalhe: x.duracaoSegundos ? formataDuracao(x.duracaoSegundos) : "sem duração",
    }));
    return [...t, ...c].sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? ""))).slice(0, 4);
  }, [estado.sessoesMusculacao, estado.corridas]);

  const semNada = ativas.length === 0 && estado.planosCorrida.length === 0;
  if (semNada) {
    return (
      <EstadoVazio
        icone={Sparkles}
        titulo="Vamos montar seu treino"
        texto="Você ainda não tem ficha nem plano de corrida. Crie uma ficha em Configurações e o app já passa a sugerir o próximo treino."
        acao={<Botao variante="primario" onClick={() => irPara("ajustes")}>Ir para Configurações</Botao>}
      />
    );
  }

  return (
    <div>
      {estado.perfil.nome && (
        <p className="text-sm mb-3" style={{ color: "var(--txt-fraco)" }}>
          Bom treino, {estado.perfil.nome}.
        </p>
      )}

      {emAndamento && (
        <Cartao cor="var(--acento)" className="mb-3">
          <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Você tem um treino em andamento</div>
          <div className="text-base mt-1 mb-3" style={{ fontWeight: 600 }}>
            {emAndamento.divisaoSnapshot} · {emAndamento.fichaNomeSnapshot}
          </div>
          <Botao variante="primario" larguraTotal onClick={() => irPara("treino")}>
            <Play size={16} /> Continuar treino
          </Botao>
        </Cartao>
      )}

      {combinado && !emAndamento && (
        <Aviso tipo="info">
          Hoje tem musculação e corrida no plano.
          {diaDeTrabalho === false && estado.configuracoes.escala12x36?.priorizarCombinadoNaFolga
            ? " É folga na sua escala — bom dia para juntar as duas."
            : " Dá para separar em dois momentos do dia se ficar pesado."}
        </Aviso>
      )}

      {!emAndamento && treino.ficha && (
        <Cartao cor={treino.ficha.cor} className="mb-3">
          <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Próximo treino</div>
          <div className="text-lg mt-1" style={{ fontWeight: 600 }}>
            {treino.ficha.divisao} · {treino.ficha.nome}
          </div>
          <div className="text-xs mt-1 mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
            {treino.ficha.exercicios.length} exercícios · {treino.motivo}
          </div>
          <Botao
            variante="primario"
            larguraTotal
            onClick={() => {
              despacha({ tipo: "SESSAO_INICIADA", fichaId: treino.ficha.id });
              irPara("treino");
            }}
          >
            <Play size={16} /> Iniciar treino
          </Botao>
        </Cartao>
      )}

      {corrida && (
        <Cartao cor="var(--acento)" className="mb-3">
          <div className="flex items-center gap-2">
            <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Corrida prevista</div>
            <Etiqueta cor="var(--acento)">{TIPOS_SESSAO_CORRIDA[corrida.sessao.tipo]}</Etiqueta>
          </div>
          <div className="text-base mt-1" style={{ fontWeight: 600 }}>{corrida.sessao.nome}</div>
          {corrida.sessao.objetivo && (
            <p className="text-xs mt-1 mb-3" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
              {corrida.sessao.objetivo}
            </p>
          )}
          <div className="text-xs mb-3" style={{ color: "var(--txt-apagado)" }}>
            Semana {corrida.semana.numero} de {corrida.plano.semanas.length} · {corrida.plano.nome}
          </div>
          <Botao larguraTotal onClick={() => setRegistrandoCorrida(true)}>
            <Footprints size={16} /> Registrar esta corrida
          </Botao>
        </Cartao>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Botao onClick={() => setRegistrandoCorrida(true)}>
          <Footprints size={16} /> Corrida avulsa
        </Botao>
        <Botao onClick={() => setPesando(true)}>
          <Scale size={16} /> Atualizar peso
        </Botao>
      </div>

      <Titulo>Últimos sete dias</Titulo>
      <div className="grid grid-cols-2 gap-2">
        <Metrica rotulo="Treinos" valor={sete.treinos} />
        <Metrica rotulo="Corridas" valor={sete.corridas} />
        <Metrica rotulo="Distância" valor={`${formataNumero(sete.distancia)} km`} />
        <Metrica
          rotulo="Sequência"
          valor={sequencia.dias > 0 ? `${sequencia.dias} dia(s)` : "—"}
          detalhe={sequencia.dias > 0 ? "com atividade seguida" : "registre algo hoje"}
        />
      </div>

      <Titulo>Atividades recentes</Titulo>
      {recentes.length === 0 ? (
        <EstadoVazio titulo="Nada registrado ainda" texto="Assim que você finalizar um treino ou registrar uma corrida, ele aparece aqui." />
      ) : (
        recentes.map((r) => (
          <Cartao key={r.id} className="mb-2">
            <div className="text-sm">{r.titulo}</div>
            <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
              {r.tipo} · {r.data ? formataData(r.data) : "sem data"} · {r.detalhe}
            </div>
          </Cartao>
        ))
      )}

      <RegistrarCorrida
        aberto={registrandoCorrida}
        aoFechar={() => setRegistrandoCorrida(false)}
        vinculo={corrida ? { plano: corrida.plano, sessao: corrida.sessao } : null}
      />
      <AtualizarPeso aberto={pesando} aoFechar={() => setPesando(false)} pesoAnterior={peso} />
    </div>
  );
}

/* Dias seguidos com alguma atividade, contando a partir de hoje ou de ontem —
   quem ainda não treinou hoje não deve ver a sequência zerada às 8 da manhã. */
function calculaSequencia(estado, ate) {
  const dias = new Set([
    ...estado.sessoesMusculacao.filter((s) => s.status === "concluida" && s.data).map((s) => s.data),
    ...estado.corridas.filter((c) => c.data).map((c) => c.data),
  ]);
  if (!dias.size) return { dias: 0 };

  let inicio = ate;
  if (!dias.has(inicio)) {
    const ontem = somaDias(ate, -1);
    if (!dias.has(ontem)) return { dias: 0 };
    inicio = ontem;
  }
  let total = 0;
  let cursor = inicio;
  while (dias.has(cursor)) {
    total += 1;
    cursor = somaDias(cursor, -1);
  }
  return { dias: total };
}

function AtualizarPeso({ aberto, aoFechar, pesoAnterior }) {
  const despacha = useAcao();
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState(null);

  const salvar = () => {
    const n = paraNumeroPositivo(valor);
    if (n === null || n === 0) {
      setErro("Informe um peso válido, como 79,4.");
      return;
    }
    despacha({ tipo: "PESAGEM_REGISTRADA", data: hoje(), pesoKg: n });
    setValor("");
    setErro(null);
    aoFechar();
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Atualizar peso"
      descricao={pesoAnterior ? `Última pesagem: ${formataNumero(pesoAnterior.pesoKg)} kg em ${formataData(pesoAnterior.data)}.` : "Primeira pesagem."}
      rodape={
        <>
          <Botao variante="fantasma" larguraTotal onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" larguraTotal onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <Campo
        rotulo={`Peso de hoje (${formataData(hoje())})`}
        type="text"
        inputMode="decimal"
        placeholder="79,4"
        value={valor}
        erro={erro}
        onChange={(e) => setValor(e.target.value)}
      />
      <p className="text-xs mt-2" style={{ color: "var(--txt-apagado)" }}>
        Para registrar em outra data, use a aba Progresso.
      </p>
    </Modal>
  );
}
