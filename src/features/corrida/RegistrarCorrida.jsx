import { useState } from "react";

import { useAcao } from "../../state/contexto.js";
import { hoje } from "../../lib/dates.js";
import { interpretaDuracao, ritmoSegundosPorKm, formataRitmo } from "../../lib/calculos.js";
import { paraNumeroPositivo, formataNumero } from "../../lib/numbers.js";

import Modal from "../../components/Modal.jsx";
import Botao from "../../components/Botao.jsx";
import Campo, { CampoTexto, Selecao } from "../../components/Campo.jsx";

const TERRENOS = [
  { valor: "", rotulo: "Não informar" },
  { valor: "rua", rotulo: "Rua" },
  { valor: "esteira", rotulo: "Esteira" },
  { valor: "trilha", rotulo: "Trilha" },
  { valor: "pista", rotulo: "Pista" },
];

/* Registro de corrida. Serve para a corrida do plano e para a avulsa: a
   diferença é só o vínculo, que pode não existir. */
/* Registro de corrida. Serve para a corrida do plano e para a avulsa: a
   diferença é só o vínculo, que pode não existir. */
export default function RegistrarCorrida({ aberto, aoFechar, corrida, vinculo }) {
  if (!aberto) return null;
  /* O formulário só existe enquanto a caixa está aberta, e a chave o remonta ao
     trocar de corrida — assim os campos nascem preenchidos sem efeito nenhum. */
  return <Formulario key={corrida?.id ?? vinculo?.sessao?.id ?? "nova"} aoFechar={aoFechar} corrida={corrida} vinculo={vinculo} />;
}

function valoresIniciais(corrida, vinculo) {
  if (corrida) {
    return {
      data: corrida.data ?? "",
      distancia: corrida.distanciaKm ?? "",
      duracao: corrida.duracaoSegundos ? String(Math.round(corrida.duracaoSegundos / 60)) : "",
      rpe: corrida.rpe ?? "",
      terreno: corrida.terreno ?? "",
      observacao: corrida.observacao ?? "",
    };
  }
  return {
    data: hoje(),
    distancia: vinculo?.sessao?.distanciaKm ?? "",
    duracao: "",
    rpe: "",
    terreno: "",
    observacao: "",
  };
}

function Formulario({ aoFechar, corrida, vinculo }) {
  const despacha = useAcao();
  const [form, setForm] = useState(() => valoresIniciais(corrida, vinculo));
  const [erros, setErros] = useState({});

  const distancia = paraNumeroPositivo(form.distancia);
  const duracao = interpretaDuracao(form.duracao);
  const ritmo = ritmoSegundosPorKm(distancia, duracao);

  const salvar = () => {
    const novosErros = {};
    if (!form.data) novosErros.data = "Informe a data da corrida.";
    if (form.distancia !== "" && distancia === null) novosErros.distancia = "Use um número, como 5 ou 5,2.";
    if (form.duracao !== "" && duracao === null) novosErros.duracao = "Use 48:30, 1:02:15 ou minutos, como 45.";
    if (distancia === null && duracao === null) novosErros.distancia = "Informe ao menos a distância ou a duração.";
    if (Object.keys(novosErros).length) {
      setErros(novosErros);
      return;
    }

    const dados = {
      data: form.data,
      distanciaKm: distancia,
      duracaoSegundos: duracao,
      rpe: paraNumeroPositivo(form.rpe),
      terreno: form.terreno || null,
      observacao: form.observacao,
    };

    if (corrida) {
      despacha({ tipo: "CORRIDA_ATUALIZADA", corridaId: corrida.id, mudancas: dados });
    } else {
      despacha({
        tipo: "CORRIDA_REGISTRADA",
        corrida: { ...dados, planoId: vinculo?.plano?.id ?? null, sessaoPlanejadaId: vinculo?.sessao?.id ?? null },
      });
    }
    aoFechar();
  };

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={corrida ? "Editar corrida" : "Registrar corrida"}
      descricao={vinculo?.sessao ? `Vinculada a: ${vinculo.sessao.nome}` : "Corrida avulsa, sem vínculo com plano."}
      rodape={
        <>
          <Botao variante="fantasma" larguraTotal onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" larguraTotal onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <Campo rotulo="Data" type="date" className="mb-3" value={form.data} erro={erros.data}
        onChange={(e) => setForm({ ...form, data: e.target.value })} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Campo rotulo="Distância (km)" type="text" inputMode="decimal" value={form.distancia} erro={erros.distancia}
          placeholder="5,2" onChange={(e) => setForm({ ...form, distancia: e.target.value })} />
        <Campo rotulo="Duração" type="text" inputMode="text" value={form.duracao} erro={erros.duracao}
          placeholder="48:30 ou 45" ajuda="hh:mm:ss, mm:ss ou minutos"
          onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
      </div>

      <div className="text-xs mb-3 p-2" style={{ background: "var(--sup2)", borderRadius: 3, color: "var(--txt-fraco)" }}>
        Ritmo calculado: <strong style={{ color: "var(--txt)" }}>{formataRitmo(ritmo)}</strong>
        {distancia !== null && duracao !== null && ` — ${formataNumero(distancia)} km`}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Campo rotulo="Esforço percebido (1 a 10)" type="number" inputMode="numeric" min="1" max="10"
          value={form.rpe} onChange={(e) => setForm({ ...form, rpe: e.target.value })} />
        <Selecao rotulo="Terreno" value={form.terreno} opcoes={TERRENOS}
          onChange={(e) => setForm({ ...form, terreno: e.target.value })} />
      </div>

      <CampoTexto rotulo="Observações" value={form.observacao}
        onChange={(e) => setForm({ ...form, observacao: e.target.value })}
        placeholder="Calor, pernas pesadas, tênis novo…" />
    </Modal>
  );
}
