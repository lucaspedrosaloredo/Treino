/* Todo o Recharts vive aqui, e só aqui. Este arquivo é carregado sob demanda
   (`React.lazy` em Progresso.jsx), então a biblioteca — que sozinha responde
   por quase todo o peso do bundle — sai do caminho de abrir o app, iniciar um
   treino ou registrar uma corrida. */

import {
  Line, LineChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";

/* O Recharts entrega a cor como atributo do SVG, e atributo não resolve
   `var()`. Então quem lê o token é o JavaScript, a cada render — é isso que
   faz o gráfico trocar de cor junto com o tema. */
function token(nome, alternativa) {
  if (typeof window === "undefined") return alternativa;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return valor || alternativa;
}

export default function Grafico({ tipo, dados, series = [], altura = 180 }) {
  if (!dados || dados.length === 0) return null;

  const eixo = token("--grafico-eixo", "#8b948d");
  const grade = token("--grafico-grade", "#333d39");
  const EIXO = { stroke: eixo, fontSize: 11, tickLine: false };
  const TOOLTIP = {
    contentStyle: {
      background: token("--grafico-fundo", "#1d2422"),
      border: `1px solid ${grade}`,
      borderRadius: 4,
      fontSize: 12,
      color: token("--txt", "#e9e7e1"),
    },
    labelStyle: { color: eixo },
  };
  const cor = (s) => (s.cor.startsWith("--") ? token(s.cor, "#7fc4e8") : s.cor);

  return (
    <div style={{ height: altura }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        {tipo === "barra" ? (
          <BarChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={grade} vertical={false} />
            <XAxis dataKey="rotulo" {...EIXO} />
            <YAxis {...EIXO} />
            <Tooltip {...TOOLTIP} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s) => (
              <Bar key={s.chave} dataKey={s.chave} name={s.nome} fill={cor(s)} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={grade} vertical={false} />
            <XAxis dataKey="rotulo" {...EIXO} />
            {/* Cada série tem seu eixo: carga e volume têm ordens de grandeza
                diferentes e no mesmo eixo uma delas vira uma linha reta. */}
            <YAxis yAxisId="esq" {...EIXO} />
            {series.length > 1 && <YAxis yAxisId="dir" orientation="right" {...EIXO} />}
            <Tooltip {...TOOLTIP} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => (
              <Line
                key={s.chave}
                yAxisId={i === 0 ? "esq" : "dir"}
                type="monotone"
                dataKey={s.chave}
                name={s.nome}
                stroke={cor(s)}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
