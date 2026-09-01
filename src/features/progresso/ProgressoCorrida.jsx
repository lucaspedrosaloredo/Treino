import { useMemo } from "react";

import {
  resumoCorridas, distanciaPorSemana, saltoDeVolumeCorrida, formataRitmo, formataDuracao,
  ritmoSegundosPorKm, dentroDoPeriodo,
} from "../../lib/calculos.js";
import { formataNumero } from "../../lib/numbers.js";
import { formataData, formataDataCurta } from "../../lib/dates.js";
import { planoCorridaAtivo, progressoDoPlano, semanaAtualDoPlano } from "../../lib/agenda.js";

import { Metrica, EstadoVazio, Titulo, Cartao, Aviso, Progresso } from "../../components/Basicos.jsx";
import { GraficoTardio } from "./Progresso.jsx";

export default function ProgressoCorrida({ estado, intervalo }) {
  const resumo = useMemo(() => resumoCorridas(estado.corridas, intervalo), [estado.corridas, intervalo]);
  const porSemana = useMemo(
    () => distanciaPorSemana(estado.corridas, intervalo, estado.configuracoes.inicioSemana),
    [estado.corridas, intervalo, estado.configuracoes.inicioSemana],
  );
  const salto = useMemo(() => saltoDeVolumeCorrida(porSemana), [porSemana]);
  const plano = planoCorridaAtivo(estado);
  const progresso = plano ? progressoDoPlano(plano) : null;

  /* Comparar ritmo só entre corridas de distância parecida. Um tiro de 3 km e
     um longão de 12 km não são a mesma prova. */
  const comparaveis = useMemo(() => {
    const validas = estado.corridas.filter(
      (c) => dentroDoPeriodo(c.data, intervalo) && c.distanciaKm && c.duracaoSegundos,
    );
    const faixas = [
      { nome: "até 5 km", min: 0, max: 5.99 },
      { nome: "6 a 9,9 km", min: 6, max: 9.99 },
      { nome: "10 km ou mais", min: 10, max: Infinity },
    ];
    return faixas
      .map((f) => {
        const nela = validas.filter((c) => c.distanciaKm >= f.min && c.distanciaKm <= f.max);
        if (!nela.length) return null;
        const melhor = nela.reduce((m, c) => {
          const r = ritmoSegundosPorKm(c.distanciaKm, c.duracaoSegundos);
          return m === null || r < m.ritmo ? { ritmo: r, corrida: c } : m;
        }, null);
        return { faixa: f.nome, total: nela.length, melhor };
      })
      .filter(Boolean);
  }, [estado.corridas, intervalo]);

  if (!resumo.total) {
    return <EstadoVazio titulo="Sem corridas no período" texto="Registre uma corrida na aba Corrida para os números aparecerem aqui." />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Metrica rotulo="Corridas" valor={resumo.total} />
        <Metrica rotulo="Distância" valor={`${formataNumero(resumo.distancia)} km`} />
        <Metrica rotulo="Tempo" valor={formataDuracao(resumo.duracao)} />
        <Metrica rotulo="Ritmo médio" valor={formataRitmo(resumo.ritmoMedio)} detalhe="distância total ÷ tempo total" />
        <Metrica
          rotulo="Mais longa"
          valor={resumo.maisLonga?.distanciaKm ? `${formataNumero(resumo.maisLonga.distanciaKm)} km` : "—"}
          detalhe={resumo.maisLonga?.data ? formataData(resumo.maisLonga.data) : null}
        />
        <Metrica
          rotulo="Melhor ritmo"
          valor={resumo.melhorRitmo ? formataRitmo(resumo.melhorRitmo.ritmo) : "—"}
          detalhe={resumo.melhorRitmo ? `${formataNumero(resumo.melhorRitmo.corrida.distanciaKm)} km` : null}
        />
      </div>

      {salto && (
        <Aviso tipo="atencao">
          A distância da última semana subiu {formataNumero(salto.aumento, 0)}% em relação à anterior
          ({formataNumero(salto.de)} para {formataNumero(salto.para)} km). É só uma observação — a regra de subir pouco
          por semana é convenção, não lei, e você conhece seu corpo melhor que uma porcentagem.
        </Aviso>
      )}

      <Titulo>Distância por semana</Titulo>
      <GraficoTardio
        tipo="barra"
        dados={porSemana.map((s) => ({ rotulo: formataDataCurta(s.semana), km: Math.round(s.distancia * 10) / 10 }))}
        series={[{ chave: "km", nome: "km", cor: "--serie-1" }]}
        altura={160}
      />
      <p className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
        {porSemana.map((s) => `${formataDataCurta(s.semana)}: ${formataNumero(s.distancia)} km`).join(" · ")}
      </p>

      <Titulo>Melhor ritmo por faixa de distância</Titulo>
      {comparaveis.map((c) => (
        <Cartao key={c.faixa} className="mb-2">
          <div className="text-sm">{c.faixa}</div>
          <div className="text-xs mt-1" style={{ color: "var(--txt-fraco)" }}>
            {c.total} corrida(s) · melhor ritmo {formataRitmo(c.melhor.ritmo)} em{" "}
            {formataNumero(c.melhor.corrida.distanciaKm)} km
            {c.melhor.corrida.data ? `, em ${formataData(c.melhor.corrida.data)}` : ""}
          </div>
        </Cartao>
      ))}
      <p className="text-xs" style={{ color: "var(--txt-apagado)", lineHeight: 1.5 }}>
        As faixas existem para não comparar um tiro curto com um longão como se fossem a mesma coisa.
      </p>

      {plano && progresso && (
        <>
          <Titulo>Aderência ao plano</Titulo>
          <Cartao>
            <div className="text-sm mb-2" style={{ fontWeight: 600 }}>{plano.nome}</div>
            <Progresso percentual={progresso.percentual} rotulo={`${progresso.concluidas} de ${progresso.total} sessões concluídas`} />
            <div className="text-xs mt-2" style={{ color: "var(--txt-fraco)" }}>
              Semana atual: {semanaAtualDoPlano(plano)?.numero ?? "—"} de {plano.semanas.length}
            </div>
          </Cartao>
        </>
      )}
    </div>
  );
}
