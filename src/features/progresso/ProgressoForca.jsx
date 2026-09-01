import { useMemo, useState } from "react";

import {
  dentroDoPeriodo, volumeSessao, volumePorGrupo, recordesPorExercicio, estimativa1RM,
  FORMULA_1RM, ehSerieDeTrabalho,
} from "../../lib/calculos.js";
import { formataNumero } from "../../lib/numbers.js";
import { formataData, formataDataCurta } from "../../lib/dates.js";

import { Selecao } from "../../components/Campo.jsx";
import { Metrica, EstadoVazio, Titulo, Cartao } from "../../components/Basicos.jsx";
import { GraficoTardio } from "./Progresso.jsx";

export default function ProgressoForca({ estado, intervalo }) {
  const sessoes = useMemo(
    () => estado.sessoesMusculacao.filter((s) => s.status === "concluida" && dentroDoPeriodo(s.data, intervalo)),
    [estado.sessoesMusculacao, intervalo],
  );

  const exerciciosNoPeriodo = useMemo(() => {
    const mapa = new Map();
    sessoes.forEach((s) => s.exercicios.forEach((e) => mapa.set(e.exercicioId, e.nomeSnapshot)));
    return [...mapa.entries()].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [sessoes]);

  const [exSel, setExSel] = useState("");
  const alvo = exSel || exerciciosNoPeriodo[0]?.id || "";

  const porExercicio = useMemo(() => {
    if (!alvo) return [];
    return sessoes
      .filter((s) => s.exercicios.some((e) => e.exercicioId === alvo))
      .sort((a, b) => String(a.data ?? "").localeCompare(String(b.data ?? "")))
      .map((s) => {
        const ex = s.exercicios.find((e) => e.exercicioId === alvo);
        const trabalho = ex.series.filter((x) => ehSerieDeTrabalho(x) && x.concluida);
        const cargas = trabalho.map((x) => x.cargaKg).filter((n) => n !== null && n !== undefined);
        const volume = trabalho.reduce((t, x) => t + (x.cargaKg || 0) * (x.repeticoes || 0), 0);
        const melhor = trabalho.reduce((m, x) => {
          const rm = estimativa1RM(x.cargaKg, x.repeticoes);
          return rm !== null && (m === null || rm > m) ? rm : m;
        }, null);
        return {
          rotulo: formataDataCurta(s.data),
          carga: cargas.length ? Math.max(...cargas) : 0,
          volume: Math.round(volume),
          rm: melhor === null ? null : Math.round(melhor * 10) / 10,
          series: trabalho.length,
          reps: trabalho.reduce((t, x) => t + (x.repeticoes || 0), 0),
        };
      });
  }, [sessoes, alvo]);

  const grupos = useMemo(() => volumePorGrupo(estado.sessoesMusculacao, intervalo), [estado.sessoesMusculacao, intervalo]);
  const recordes = useMemo(() => recordesPorExercicio(estado.sessoesMusculacao), [estado.sessoesMusculacao]);
  const recordeAlvo = recordes.find((r) => r.exercicioId === alvo);

  const volumeTotal = sessoes.reduce((s, x) => s + volumeSessao(x), 0);
  const seriesTotal = sessoes.reduce(
    (t, s) => t + s.exercicios.reduce((u, e) => u + e.series.filter((x) => ehSerieDeTrabalho(x) && x.concluida).length, 0),
    0,
  );
  const repsTotal = sessoes.reduce(
    (t, s) =>
      t + s.exercicios.reduce((u, e) => u + e.series.filter((x) => ehSerieDeTrabalho(x) && x.concluida)
        .reduce((v, x) => v + (x.repeticoes || 0), 0), 0),
    0,
  );

  if (!sessoes.length) {
    return <EstadoVazio titulo="Sem treinos no período" texto="Escolha um período maior ou registre um treino para ver os números aqui." />;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <Metrica rotulo="Volume total" valor={`${formataNumero(volumeTotal, 0)}`} detalhe="kg (carga × reps)" />
        <Metrica rotulo="Séries" valor={seriesTotal} detalhe="só de trabalho" />
        <Metrica rotulo="Repetições" valor={repsTotal} />
      </div>

      <Titulo>Evolução por exercício</Titulo>
      <Selecao
        rotulo="Exercício"
        className="mb-3"
        value={alvo}
        onChange={(e) => setExSel(e.target.value)}
        opcoes={exerciciosNoPeriodo.map((e) => ({ valor: e.id, rotulo: e.nome }))}
      />

      {porExercicio.length === 0 ? (
        <EstadoVazio titulo="Sem registro deste exercício" texto="Escolha outro exercício ou amplie o período." />
      ) : (
        <>
          <GraficoTardio
            tipo="linha"
            dados={porExercicio}
            series={[
              { chave: "carga", nome: "Maior carga (kg)", cor: "#7FC4E8" },
              { chave: "volume", nome: "Volume (kg)", cor: "#E4B429" },
            ]}
            altura={190}
          />
          <p className="text-xs mt-1 mb-2" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
            Carga e volume têm eixos separados — no mesmo eixo, o volume achataria a carga numa linha reta.
            Da primeira à última sessão do período: carga de {formataNumero(porExercicio[0].carga)} para{" "}
            {formataNumero(porExercicio[porExercicio.length - 1].carga)} kg, volume de{" "}
            {formataNumero(porExercicio[0].volume, 0)} para {formataNumero(porExercicio[porExercicio.length - 1].volume, 0)} kg.
          </p>

          {recordeAlvo && (
            <Cartao className="mb-2">
              <div className="text-xs" style={{ color: "var(--txt-fraco)" }}>Recordes deste exercício (todo o histórico)</div>
              <div className="text-sm mt-1">
                Maior carga: <strong>{formataNumero(recordeAlvo.maiorCarga)} kg</strong>
                {recordeAlvo.dataMaiorCarga && ` em ${formataData(recordeAlvo.dataMaiorCarga)}`}
              </div>
              <div className="text-sm mt-1">
                Maior volume numa série: <strong>{formataNumero(recordeAlvo.maiorVolumeSerie, 0)} kg</strong>
              </div>
              <div className="text-sm mt-1">
                1RM estimado: <strong>{formataNumero(recordeAlvo.melhor1RM)} kg</strong>
              </div>
              <div className="text-xs mt-2" style={{ color: "var(--txt-apagado)", lineHeight: 1.5 }}>
                O 1RM é <strong>estimativa</strong>, não uma carga testada — {FORMULA_1RM}. Acima de umas 10 repetições
                a fórmula erra bastante.
              </div>
            </Cartao>
          )}
        </>
      )}

      <Titulo>Volume por grupo muscular</Titulo>
      {grupos.length === 0 ? (
        <EstadoVazio titulo="Sem dados por grupo" texto="O grupo vem do cadastro de cada exercício, editável na ficha." />
      ) : (
        <>
          <GraficoTardio
            tipo="barra"
            dados={grupos.map((g) => ({ rotulo: g.grupo, series: g.series }))}
            series={[{ chave: "series", nome: "Séries", cor: "#3E9E63" }]}
            altura={170}
          />
          <p className="text-xs mt-1" style={{ color: "var(--txt-fraco)", lineHeight: 1.5 }}>
            {grupos.map((g) => `${g.grupo}: ${g.series} séries`).join(" · ")}
          </p>
        </>
      )}
    </div>
  );
}
