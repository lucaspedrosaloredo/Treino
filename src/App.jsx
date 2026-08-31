import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Dumbbell, Footprints, TrendingUp, Settings, Check, Plus, Trash2, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

/* ---------------------------------------------------------------- paleta */
/* Cores de anilha olímpica: 25kg vermelho, 20kg azul, 15kg amarelo,
   10kg verde, barra prata. Cada dia de treino carrega uma cor. */
const C = {
  fundo: "#141917",
  sup: "#1D2422",
  sup2: "#252E2B",
  linha: "#333D39",
  txt: "#E9E7E1",
  fraco: "#8B948D",
  A: "#D2352C",
  B: "#2E6FB7",
  C: "#E4B429",
  D: "#3E9E63",
  E: "#C4C9C2",
  run: "#7FC4E8",
};

/* --------------------------------------------------------------- nível 1 */
const NIVEL1 = {
  A: {
    nome: "Peito, ombro e tríceps",
    ex: [
      { id: "a1", n: "Supino reto com halteres", s: 3, r: "10-12", inc: 2 },
      { id: "a2", n: "Supino inclinado na máquina", s: 3, r: "10-12", inc: 5 },
      { id: "a3", n: "Crucifixo na máquina (peck deck)", s: 3, r: "12-15", inc: 5 },
      { id: "a4", n: "Desenvolvimento com halteres", s: 3, r: "10-12", inc: 2 },
      { id: "a5", n: "Tríceps na polia com corda", s: 3, r: "12-15", inc: 2.5 },
      { id: "a6", n: "Tríceps testa com barra W", s: 2, r: "12-15", inc: 2.5 },
      { id: "a7", n: "Prancha (segundos no campo de reps)", s: 3, r: "30-45s", inc: 0 },
    ],
  },
  B: {
    nome: "Pernas — força",
    ex: [
      { id: "b1", n: "Agachamento livre ou no Smith", s: 4, r: "8-10", inc: 5 },
      { id: "b2", n: "Leg press 45°", s: 3, r: "10-12", inc: 10 },
      { id: "b3", n: "Cadeira extensora", s: 3, r: "12-15", inc: 5 },
      { id: "b4", n: "Mesa flexora", s: 3, r: "12-15", inc: 5 },
      { id: "b5", n: "Elevação pélvica (hip thrust)", s: 3, r: "10-12", inc: 5 },
      { id: "b6", n: "Panturrilha em pé", s: 4, r: "15-20", inc: 5 },
    ],
  },
  C: {
    nome: "Costas e bíceps",
    ex: [
      { id: "c1", n: "Puxada frontal na polia", s: 4, r: "10-12", inc: 5 },
      { id: "c2", n: "Remada baixa com triângulo", s: 3, r: "10-12", inc: 5 },
      { id: "c3", n: "Remada curvada com halteres", s: 3, r: "10-12", inc: 2 },
      { id: "c4", n: "Pullover na polia alta", s: 2, r: "12-15", inc: 2.5 },
      { id: "c5", n: "Rosca direta com barra W", s: 3, r: "10-12", inc: 2.5 },
      { id: "c6", n: "Rosca martelo", s: 3, r: "12", inc: 2 },
      { id: "c7", n: "Face pull (saúde do ombro)", s: 3, r: "15", inc: 2.5 },
    ],
  },
  D: {
    nome: "Ombros, braços e core",
    ex: [
      { id: "d1", n: "Desenvolvimento na máquina", s: 3, r: "10-12", inc: 5 },
      { id: "d2", n: "Elevação lateral", s: 4, r: "12-15", inc: 1 },
      { id: "d3", n: "Crucifixo inverso (posterior de ombro)", s: 3, r: "12-15", inc: 2 },
      { id: "d4", n: "Encolhimento com halteres", s: 3, r: "12-15", inc: 4 },
      { id: "d5", n: "Rosca alternada", s: 3, r: "10-12", inc: 2 },
      { id: "d6", n: "Tríceps banco ou mergulho assistido", s: 3, r: "10-12", inc: 0 },
      { id: "d7", n: "Prancha lateral (segundos)", s: 3, r: "25-40s", inc: 0 },
    ],
  },
  E: {
    nome: "Posterior, glúteo e panturrilha",
    ex: [
      { id: "e1", n: "Stiff com halteres", s: 3, r: "10-12", inc: 2 },
      { id: "e2", n: "Afundo ou agachamento búlgaro", s: 3, r: "10 (cada perna)", inc: 2 },
      { id: "e3", n: "Cadeira abdutora", s: 3, r: "15", inc: 5 },
      { id: "e4", n: "Mesa flexora unilateral", s: 3, r: "12", inc: 2.5 },
      { id: "e5", n: "Panturrilha sentado", s: 4, r: "15-20", inc: 5 },
      { id: "e6", n: "Dorsiflexão / tibial anterior", s: 3, r: "15-20", inc: 1 },
      { id: "e7", n: "Abdominal infra + prancha", s: 3, r: "12-15", inc: 0 },
    ],
  },
};

/* --------------------------------------------------------------- nível 2 */
/* Cada grupo muscular passa a ser treinado 2x por semana, com 14 a 17 séries
   semanais — a faixa que a meta-análise de volume sustenta para treinados.
   Máquina, cabo, haltere e barra convivem: o que muda é a curva de resistência
   de cada um. Isoladores escolhidos pela posição alongada, com parciais
   alongadas como finalizador na última série. */
const NIVEL2 = {
  A: {
    nome: "Peito e costas — carga",
    ex: [
      { id: "A1", n: "Supino inclinado com halteres (desça até alongar)", s: 4, r: "6-8", inc: 2 },
      { id: "A2", n: "Barra fixa ou puxada aberta", s: 4, r: "6-10", inc: 5 },
      { id: "A3", n: "Supino reto na máquina ou Smith", s: 3, r: "8-10", inc: 5 },
      { id: "A4", n: "Remada baixa pegada neutra", s: 3, r: "8-10", inc: 5 },
      { id: "A5", n: "Crucifixo no crossover — parciais alongadas na última", s: 3, r: "12-15", inc: 2.5 },
      { id: "A6", n: "Pullover na polia alta", s: 3, r: "12-15", inc: 2.5 },
    ],
  },
  B: {
    nome: "Pernas — quadríceps",
    ex: [
      { id: "B1", n: "Agachamento livre ou hack (profundo)", s: 4, r: "6-8", inc: 5 },
      { id: "B2", n: "Leg press 45° — pés baixos, amplitude cheia", s: 3, r: "10-12", inc: 10 },
      { id: "B3", n: "Cadeira extensora — parciais alongadas na última", s: 4, r: "12-15", inc: 5 },
      { id: "B4", n: "Mesa flexora deitada", s: 3, r: "10-12", inc: 5 },
      { id: "B5", n: "Panturrilha em pé — 3s de pausa embaixo", s: 4, r: "10-15", inc: 5 },
      { id: "B6", n: "Abdominal na polia ajoelhado", s: 3, r: "12-15", inc: 5 },
    ],
  },
  C: {
    nome: "Ombros e braços",
    ex: [
      { id: "C1", n: "Desenvolvimento com halteres sentado", s: 4, r: "8-10", inc: 2 },
      { id: "C2", n: "Elevação lateral na polia, unilateral", s: 4, r: "12-20", inc: 2.5 },
      { id: "C3", n: "Crucifixo inverso na máquina", s: 3, r: "15-20", inc: 5 },
      { id: "C4", n: "Rosca inclinada no banco (braço atrás do corpo)", s: 3, r: "10-12", inc: 2 },
      { id: "C5", n: "Tríceps francês na polia baixa, atrás da cabeça", s: 3, r: "10-12", inc: 2.5 },
      { id: "C6", n: "Rosca martelo ou scott", s: 3, r: "10-12", inc: 2 },
      { id: "C7", n: "Tríceps corda — parciais alongadas na última", s: 3, r: "12-15", inc: 2.5 },
    ],
  },
  D: {
    nome: "Peito e costas — volume",
    ex: [
      { id: "D1", n: "Crucifixo na máquina (peck deck)", s: 4, r: "10-15", inc: 5 },
      { id: "D2", n: "Remada unilateral com halter", s: 4, r: "10-12", inc: 2 },
      { id: "D3", n: "Supino inclinado na máquina ou Smith", s: 3, r: "10-12", inc: 5 },
      { id: "D4", n: "Puxada com pegada neutra fechada", s: 3, r: "10-12", inc: 5 },
      { id: "D5", n: "Elevação lateral com halteres", s: 4, r: "15-20", inc: 1 },
      { id: "D6", n: "Rosca direta na polia baixa", s: 3, r: "12-15", inc: 2.5 },
      { id: "D7", n: "Tríceps na polia alta com barra reta", s: 3, r: "12-15", inc: 2.5 },
    ],
  },
  E: {
    nome: "Posterior, glúteo e panturrilha",
    ex: [
      { id: "E1", n: "Levantamento terra romeno com barra", s: 4, r: "8-10", inc: 5 },
      { id: "E2", n: "Cadeira flexora — parciais alongadas na última", s: 4, r: "10-12", inc: 5 },
      { id: "E3", n: "Elevação pélvica com barra", s: 3, r: "8-12", inc: 5 },
      { id: "E4", n: "Agachamento búlgaro com halteres", s: 3, r: "8-10 (cada perna)", inc: 2 },
      { id: "E5", n: "Cadeira abdutora — tronco inclinado à frente", s: 3, r: "15-20", inc: 5 },
      { id: "E6", n: "Panturrilha sentado (sóleo)", s: 4, r: "12-20", inc: 5 },
      { id: "E7", n: "Dorsiflexão com carga (tibial anterior)", s: 3, r: "15-20", inc: 1 },
    ],
  },
};

const NIVEIS = {
  1: {
    base: NIVEL1,
    nome: "Nível 1 — recomeço",
    desc: "Cinco divisões por região, cada grupo treinado uma vez por semana, 6 a 10 séries semanais. Faixas de 10 a 15 repetições, com 1 ou 2 repetições sobrando no fim de cada série. O alvo aqui é tendão, técnica e hábito.",
    dica: "Aqueça 5 minutos. Deixe 1 ou 2 repetições na reserva em cada série — você está voltando, não testando limite.",
  },
  2: {
    base: NIVEL2,
    nome: "Nível 2 — hipertrofia",
    desc: "Cada grupo passa a ser treinado duas vezes por semana, com 14 a 17 séries semanais. Compostos em 6 a 10 repetições, isoladores em 10 a 20, escolhidos pela posição alongada, e parciais alongadas fechando a última série. Feito para quem já tem cerca de 6 meses de nível 1.",
    dica: "Descanse 2 a 3 min nos compostos e 60 a 90s nos isoladores. Chegue a 1 repetição da falha nos isoladores e a 2 nos compostos.",
  },
};

/* ------------------------------------------------------- corrida nível 1 */
const CORRIDA1 = {
  meta: "5 km",
  nome: "Nível 1 — primeiros 5 km",
  desc: "Quatro semanas. O volume sobe pouco e o que aumenta de verdade é o tempo sem parar, de 4 até 25 minutos contínuos.",
  semanas: [
    {
      semana: 1,
      foco: "Acostumar as articulações. Corra devagar o bastante para conseguir falar uma frase inteira.",
      t: [
        { id: "s1t1", dia: "Segunda", t: "5 × (4 min corrida / 2 min caminhada)", d: "5 min de caminhada antes e depois. 20 min correndo no total.", tempo: "40 min" },
        { id: "s1t2", dia: "Quarta", t: "4 × (5 min corrida / 2 min caminhada)", d: "Mesmo aquecimento. Blocos um pouco maiores.", tempo: "38 min" },
        { id: "s1t3", dia: "Sábado", t: "5 × (5 min corrida / 1min30 caminhada)", d: "Corrida mais longa da semana. Se sobrar gás, sobrou certo.", tempo: "42 min" },
      ],
    },
    {
      semana: 2,
      foco: "Menos caminhada, blocos maiores. O volume sobe pouco de propósito.",
      t: [
        { id: "s2t1", dia: "Segunda", t: "4 × (6 min corrida / 2 min caminhada)", d: "5 min de caminhada antes e depois.", tempo: "42 min" },
        { id: "s2t2", dia: "Quarta", t: "3 × (8 min corrida / 2 min caminhada)", d: "Primeira vez passando de 6 min sem parar.", tempo: "40 min" },
        { id: "s2t3", dia: "Sábado", t: "3 × (9 min corrida / 1min30 caminhada)", d: "27 min correndo. Já é mais que a prova em tempo.", tempo: "42 min" },
      ],
    },
    {
      semana: 3,
      foco: "A distância já está no corpo. Agora o alvo é correr sem parar.",
      t: [
        { id: "s3t1", dia: "Segunda", t: "15 min contínuo + 2 min caminhada + 10 min contínuo", d: "5 min de caminhada antes e depois.", tempo: "37 min" },
        { id: "s3t2", dia: "Quarta", t: "2 × (13 min corrida / 2 min caminhada)", d: "Mantenha o ritmo confortável, sem acelerar no fim.", tempo: "38 min" },
        { id: "s3t3", dia: "Sábado", t: "25 min contínuos", d: "Sem pausa. Deve dar entre 3 e 4 km — anote a distância.", tempo: "35 min" },
      ],
    },
    {
      semana: 4,
      foco: "Semana de poupar as pernas e fazer a prova.",
      t: [
        { id: "s4t1", dia: "Segunda", t: "20 min contínuos, bem leve", d: "Nada de forçar. É manutenção.", tempo: "30 min" },
        { id: "s4t2", dia: "Quarta", t: "12 min leve + 3 min num ritmo mais forte", d: "Treino curto só para lembrar as pernas do que é acelerar.", tempo: "25 min" },
        { id: "s4t3", dia: "Sábado", t: "5 KM", d: "Comece mais devagar do que quer. Uma ou duas pausas de 1 min de caminhada valem — terminar é o objetivo.", tempo: "—" },
      ],
    },
  ],
};

/* ------------------------------------------------------- corrida nível 2 */
/* Oito semanas rumo aos 10 km. Estrutura padrão de planilha intermediária:
   uma sessão de qualidade, uma corrida fácil e um longão que cresce por
   semana, com duas semanas de corte (4 e 7) para absorver a carga. */
const CORRIDA2 = {
  meta: "10 km",
  nome: "Nível 2 — preparação para 10 km",
  desc: "Oito semanas, três corridas por semana: uma fácil, uma de qualidade e o longão. O longão sai de 5 km e chega a 10, com semanas de corte na 4 e na 7.",
  semanas: [
    {
      semana: 1,
      foco: "Base. A corrida fácil precisa ser fácil de verdade — é ela que sustenta o resto.",
      t: [
        { id: "n2s1t1", dia: "Segunda", t: "30 min em ritmo fácil", d: "Conversa completa sem ofegar. Se não conseguir, está rápido demais.", tempo: "30 min" },
        { id: "n2s1t2", dia: "Quarta", t: "6 × (2 min forte / 2 min trote)", d: "10 min de aquecimento e 10 de volta à calma. Forte = fala só palavras soltas.", tempo: "44 min" },
        { id: "n2s1t3", dia: "Sábado", t: "Longão de 5 km", d: "Ritmo confortável do começo ao fim.", tempo: "~35 min" },
      ],
    },
    {
      semana: 2,
      foco: "Tiros um pouco mais longos e o longão crescendo 1 km.",
      t: [
        { id: "n2s2t1", dia: "Segunda", t: "35 min em ritmo fácil", d: "Se der, troque o asfalto por terra ou grama uma vez por semana.", tempo: "35 min" },
        { id: "n2s2t2", dia: "Quarta", t: "5 × (3 min forte / 2 min trote)", d: "10 min de aquecimento e 10 de volta à calma.", tempo: "45 min" },
        { id: "n2s2t3", dia: "Sábado", t: "Longão de 6 km", d: "Sem acelerar no fim. O longão não é prova.", tempo: "~42 min" },
      ],
    },
    {
      semana: 3,
      foco: "Entra o ritmo firme — o esforço que você aguentaria por uns 40 min seguidos.",
      t: [
        { id: "n2s3t1", dia: "Segunda", t: "35 min em ritmo fácil", d: "Recuperação ativa da semana.", tempo: "35 min" },
        { id: "n2s3t2", dia: "Quarta", t: "2 × (8 min firme / 3 min trote)", d: "Firme é mais forte que o longão e mais fraco que tiro. Frases curtas.", tempo: "42 min" },
        { id: "n2s3t3", dia: "Sábado", t: "Longão de 6,5 km", d: "Aumento pequeno de propósito.", tempo: "~46 min" },
      ],
    },
    {
      semana: 4,
      foco: "Semana de corte. O corpo cresce na recuperação, não no treino.",
      t: [
        { id: "n2s4t1", dia: "Segunda", t: "30 min em ritmo fácil", d: "Sem cobrança de ritmo.", tempo: "30 min" },
        { id: "n2s4t2", dia: "Quarta", t: "Fartlek: 8 × (1 min forte / 1 min leve)", d: "10 min de aquecimento e 10 de volta à calma. Divertido, sem cronômetro rígido.", tempo: "36 min" },
        { id: "n2s4t3", dia: "Sábado", t: "Longão de 7 km", d: "Já é 70% da prova.", tempo: "~50 min" },
      ],
    },
    {
      semana: 5,
      foco: "Bloco mais forte da preparação. Durma bem nesta semana.",
      t: [
        { id: "n2s5t1", dia: "Segunda", t: "40 min em ritmo fácil", d: "Maior corrida fácil até aqui.", tempo: "40 min" },
        { id: "n2s5t2", dia: "Quarta", t: "15 min contínuos em ritmo firme", d: "10 min de aquecimento e 10 de volta à calma. Um bloco só, sem pausa.", tempo: "35 min" },
        { id: "n2s5t3", dia: "Sábado", t: "Longão de 8 km", d: "Leve água se passar de 50 min.", tempo: "~57 min" },
      ],
    },
    {
      semana: 6,
      foco: "Pico de volume. É a semana mais dura das oito.",
      t: [
        { id: "n2s6t1", dia: "Segunda", t: "40 min em ritmo fácil", d: "Se as pernas estiverem pesadas, corte para 30 min sem culpa.", tempo: "40 min" },
        { id: "n2s6t2", dia: "Quarta", t: "6 × (3 min forte / 90s trote)", d: "10 min de aquecimento e 10 de volta à calma.", tempo: "47 min" },
        { id: "n2s6t3", dia: "Sábado", t: "Longão de 9 km", d: "Faltando 1 km para a prova. Ritmo do longão, não da prova.", tempo: "~64 min" },
      ],
    },
    {
      semana: 7,
      foco: "Corte antes da prova. Mantém a intensidade, derruba o volume.",
      t: [
        { id: "n2s7t1", dia: "Segunda", t: "30 min em ritmo fácil", d: "Perna leve é o objetivo da semana.", tempo: "30 min" },
        { id: "n2s7t2", dia: "Quarta", t: "2 × (10 min em ritmo de prova / 3 min trote)", d: "Ritmo de prova é o que você acha que aguenta por 10 km. Teste aqui.", tempo: "43 min" },
        { id: "n2s7t3", dia: "Sábado", t: "Longão de 7 km", d: "Volume menor de propósito, mesmo se você estiver se sentindo ótimo.", tempo: "~50 min" },
      ],
    },
    {
      semana: 8,
      foco: "Semana da prova. Nada que você fizer agora melhora o resultado — mas dá para piorar.",
      t: [
        { id: "n2s8t1", dia: "Segunda", t: "25 min em ritmo fácil", d: "Só para as pernas não esquecerem o movimento.", tempo: "25 min" },
        { id: "n2s8t2", dia: "Quarta", t: "10 min leve + 4 × (1 min em ritmo de prova / 2 min trote)", d: "Curto e sem desgaste. Último treino de qualidade.", tempo: "25 min" },
        { id: "n2s8t3", dia: "Sábado", t: "10 KM", d: "Primeiros 2 km mais devagar do que o plano. Se sobrar, acelera nos últimos 2.", tempo: "—" },
      ],
    },
  ],
};

const PLANOS_CORRIDA = { 1: CORRIDA1, 2: CORRIDA2 };

const AGENDA = {
  1: { treino: "A", corrida: 0 },
  2: { treino: "B" },
  3: { treino: "C", corrida: 1 },
  4: { treino: "E" },
  5: { treino: "D" },
  6: { corrida: 2 },
  0: {},
};
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/* ------------------------------------------------------------ storage */
/* Tudo fica no proprio aparelho, no armazenamento local do navegador.
   Nada sai daqui: nao ha servidor, conta nem sincronizacao. */
const KEY = "treino:estado:v1";

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoje = () => iso(new Date());
const fmt = (s) => (s ? s.slice(8, 10) + "/" + s.slice(5, 7) : "");

const inicioSemana = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
};

const VAZIO = {
  nivel: 1,
  nivelCorrida: 1,
  fichas: { 1: NIVEL1, 2: NIVEL2 },
  logs: [],
  corridas: {},
  pesos: [],
  rascunho: {},
};

const migra = (raw) => {
  const o = { ...VAZIO, ...(raw || {}) };
  if (!o.fichas || !o.fichas[1]) o.fichas = { 1: NIVEL1, 2: NIVEL2 };
  if (!o.fichas[2]) o.fichas = { ...o.fichas, 2: NIVEL2 };
  o.nivel = Number(o.nivel) === 2 ? 2 : 1;
  o.nivelCorrida = Number(o.nivelCorrida) === 2 ? 2 : 1;
  o.logs = Array.isArray(o.logs) ? o.logs : [];
  o.pesos = Array.isArray(o.pesos) ? o.pesos : [];
  o.corridas = o.corridas && typeof o.corridas === "object" ? o.corridas : {};
  o.rascunho = o.rascunho && typeof o.rascunho === "object" ? o.rascunho : {};
  return o;
};

const carregar = () => {
  try {
    const bruto = localStorage.getItem(KEY);
    return migra(bruto ? JSON.parse(bruto) : null);
  } catch {
    return migra(null);
  }
};

/* impede que a rolagem do mouse altere o valor de um campo numérico */
const travaScroll = (e) => {
  if (document.activeElement === e.currentTarget) e.currentTarget.blur();
};

function Campo({ className = "", style = {}, ...p }) {
  return (
    <input
      {...p}
      onWheel={travaScroll}
      className={"p-2 text-sm " + className}
      style={{ background: C.sup2, color: C.txt, border: `1px solid ${C.linha}`, borderRadius: 3, ...style }}
    />
  );
}

function Dialogo({ dados, fechar }) {
  if (!dados) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 50 }}>
      <div className="w-full p-4" style={{ maxWidth: 380, background: C.sup, borderRadius: 6, border: `1px solid ${C.linha}` }}>
        <div className="text-sm mb-4" style={{ color: C.txt, whiteSpace: "pre-line", lineHeight: 1.55 }}>{dados.texto}</div>
        <div className="flex gap-2">
          <button onClick={fechar} className="flex-1 py-2 text-sm"
            style={{ background: "transparent", color: C.fraco, border: `1px solid ${C.linha}`, borderRadius: 3 }}>
            Cancelar
          </button>
          <button onClick={dados.ok} className="flex-1 py-2 text-sm"
            style={{ background: dados.cor, color: "#fff", borderRadius: 3, fontWeight: 600 }}>
            {dados.acao}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartaoNivel({ titulo, desc, acao, cor, onClick, subindo }) {
  return (
    <div className="mb-4 p-3" style={{ background: C.sup, borderRadius: 4, borderLeft: `3px solid ${cor}` }}>
      <div className="text-sm" style={{ fontWeight: 600 }}>{titulo}</div>
      <div className="text-xs mt-1 mb-3" style={{ color: C.fraco, lineHeight: 1.5 }}>{desc}</div>
      <button onClick={onClick} className="w-full py-2 flex items-center justify-center gap-2 text-sm"
        style={{
          background: subindo ? cor : "transparent",
          color: subindo ? "#fff" : C.fraco,
          border: subindo ? "none" : `1px solid ${C.linha}`,
          borderRadius: 3,
          fontWeight: 600,
        }}>
        {subindo ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
        {acao}
      </button>
    </div>
  );
}

export default function App() {
  const [st, setSt] = useState(carregar);
  const [erro, setErro] = useState(null);
  const [aba, setAba] = useState("treino");

  const grava = (novo) => {
    setSt(novo);
    try {
      localStorage.setItem(KEY, JSON.stringify(novo));
      setErro(null);
    } catch {
      setErro("Nao deu para salvar no aparelho. Verifique o espaco disponivel ou o modo privado do navegador.");
    }
  };

  const abas = [
    { k: "treino", n: "Treino", i: Dumbbell },
    { k: "corrida", n: "Corrida", i: Footprints },
    { k: "progresso", n: "Progresso", i: TrendingUp },
    { k: "ficha", n: "Ficha", i: Settings },
  ];

  const seg = inicioSemana();
  const treinosSemana = new Set(st.logs.filter((l) => l.data >= seg).map((l) => l.data + l.dia)).size;
  const corridasSemana = Object.values(st.corridas).filter((c) => c.feito && c.data && c.data >= seg).length;

  let contador = null;
  if (aba === "treino") contador = { n: `${treinosSemana}/5`, r: "treinos na semana" };
  if (aba === "corrida") contador = { n: `${corridasSemana}/3`, r: "corridas na semana" };

  return (
    <div
      style={{
        background: C.fundo,
        color: C.txt,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
      }}
      className="min-h-screen pb-20"
    >
      <style>{`
        input, select { font-variant-numeric: tabular-nums; }
        input:focus, button:focus-visible, select:focus { outline: 2px solid ${C.run}; outline-offset: 1px; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <Topo contador={contador} />
      {erro && (
        <div className="mx-3 mb-2 p-2 text-xs" style={{ background: "#3A2320", color: "#F0B9B3", borderRadius: 4 }}>
          {erro}
        </div>
      )}

      <div className="px-3">
        {aba === "treino" && <Treino st={st} grava={grava} />}
        {aba === "corrida" && <Corrida st={st} grava={grava} />}
        {aba === "progresso" && <Progresso st={st} grava={grava} />}
        {aba === "ficha" && <Ficha st={st} grava={grava} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex"
        style={{ background: C.sup, borderTop: `1px solid ${C.linha}`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {abas.map((a) => {
          const I = a.i;
          const on = aba === a.k;
          return (
            <button key={a.k} onClick={() => setAba(a.k)} className="flex-1 flex flex-col items-center gap-1 py-2"
              style={{ color: on ? C.txt : C.fraco, borderTop: `2px solid ${on ? C.run : "transparent"}` }}>
              <I size={18} />
              <span className="text-xs">{a.n}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* -------------------------------------------------------------- topo */
function Topo({ contador }) {
  const d = new Date();
  const ag = AGENDA[d.getDay()] || {};
  const partes = [];
  if (ag.treino) partes.push(`Treino ${ag.treino}`);
  if (ag.corrida !== undefined) partes.push("Corrida");

  return (
    <header className="px-3 pt-4 pb-3 flex items-start justify-between gap-4">
      <div>
        <div className="text-xs" style={{ color: C.fraco }}>
          {DIAS[d.getDay()]}, {fmt(hoje())}
        </div>
        <div className="text-2xl mt-1" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          {partes.length ? partes.join(" + ") : "Descanso"}
        </div>
      </div>
      {contador && (
        <div className="text-right shrink-0 pt-1" style={{ color: C.fraco }}>
          <div className="text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{contador.n}</div>
          <div style={{ fontSize: 10, lineHeight: 1.3 }}>{contador.r}</div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------ treino */
function Treino({ st, grava }) {
  const d = new Date().getDay();
  const fichaAtual = st.fichas[st.nivel];
  const [dia, setDia] = useState((AGENDA[d] || {}).treino || "A");
  const ficha = fichaAtual[dia];
  const rasc = st.rascunho[dia] || {};

  const ultima = (exId) => {
    const l = st.logs.filter((x) => x.exId === exId);
    return l.length ? l[l.length - 1] : null;
  };

  const setRasc = (exId, i, campo, valor) => {
    const novo = { ...rasc, [exId]: { ...(rasc[exId] || {}) } };
    novo[exId][i] = { ...(novo[exId][i] || {}), [campo]: valor };
    grava({ ...st, rascunho: { ...st.rascunho, [dia]: novo } });
  };

  const salvarDia = () => {
    const novos = [];
    ficha.ex.forEach((e) => {
      const s = rasc[e.id];
      if (!s) return;
      const series = Object.values(s).filter((x) => x && (x.kg || x.reps));
      if (series.length) novos.push({ data: hoje(), dia, exId: e.id, exNome: e.n, series });
    });
    if (!novos.length) return;
    grava({ ...st, logs: [...st.logs, ...novos], rascunho: { ...st.rascunho, [dia]: {} } });
  };

  const preenchidos = ficha.ex.filter((e) => rasc[e.id] && Object.values(rasc[e.id]).some((x) => x && x.kg)).length;
  const totalSeries = ficha.ex.reduce((s, e) => s + e.s, 0);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {Object.keys(fichaAtual).map((k) => (
          <button key={k} onClick={() => setDia(k)} className="flex-1 py-2 text-sm"
            style={{
              background: dia === k ? C[k] : C.sup,
              color: dia === k ? (k === "C" || k === "E" ? "#141917" : "#fff") : C.fraco,
              borderRadius: 3, fontWeight: 600,
            }}>
            {k}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="text-lg" style={{ fontWeight: 600 }}>{ficha.nome}</div>
          <span className="text-xs px-2 py-1" style={{ color: C.fraco, border: `1px solid ${C.linha}`, borderRadius: 3 }}>
            Nível {st.nivel} · {totalSeries} séries
          </span>
        </div>
        <div className="text-xs mt-2" style={{ color: C.fraco, lineHeight: 1.5 }}>{NIVEIS[st.nivel].dica}</div>
      </div>

      {ficha.ex.map((e) => (
        <Exercicio key={e.id} ex={e} rasc={rasc[e.id] || {}} ultima={ultima(e.id)} setRasc={setRasc} cor={C[dia]} />
      ))}

      <button onClick={salvarDia} disabled={!preenchidos}
        className="w-full py-3 mt-2 mb-4 flex items-center justify-center gap-2 text-sm"
        style={{
          background: preenchidos ? C[dia] : C.sup,
          color: preenchidos ? (dia === "C" || dia === "E" ? "#141917" : "#fff") : C.fraco,
          borderRadius: 3, fontWeight: 600,
        }}>
        <Check size={16} />
        {preenchidos ? `Salvar treino (${preenchidos} exercícios)` : "Preencha as cargas para salvar"}
      </button>
    </div>
  );
}

function Exercicio({ ex, rasc, ultima, setRasc, cor }) {
  const [aberto, setAberto] = useState(false);
  const topo = parseInt(String(ex.r).split("-").pop(), 10);

  let sugestao = null;
  if (ultima && ex.inc > 0) {
    const kgs = ultima.series.map((s) => parseFloat(s.kg)).filter((n) => !isNaN(n));
    const bateu = ultima.series.every((s) => parseInt(s.reps, 10) >= topo);
    const maxKg = kgs.length ? Math.max(...kgs) : null;
    if (maxKg !== null) {
      sugestao = bateu
        ? { kg: maxKg + ex.inc, txt: `Bateu todas as reps. Suba para ${maxKg + ex.inc} kg.` }
        : { kg: maxKg, txt: `Repita ${maxKg} kg e busque ${topo} reps em todas as séries.` };
    }
  }

  return (
    <div className="mb-2" style={{ background: C.sup, borderRadius: 4, borderLeft: `3px solid ${cor}` }}>
      <button onClick={() => setAberto(!aberto)} className="w-full flex items-center justify-between gap-2 p-3 text-left">
        <div>
          <div className="text-sm" style={{ fontWeight: 500 }}>{ex.n}</div>
          <div className="text-xs mt-1" style={{ color: C.fraco }}>
            {ex.s} × {ex.r}
            {ultima && ` · última: ${ultima.series.map((s) => `${s.kg || "-"}×${s.reps || "-"}`).join("  ")}`}
          </div>
        </div>
        <ChevronDown size={16} style={{ color: C.fraco, flexShrink: 0, transform: aberto ? "rotate(180deg)" : "none" }} />
      </button>

      {aberto && (
        <div className="px-3 pb-3">
          {sugestao && (
            <div className="text-xs mb-3 p-2" style={{ background: C.sup2, color: C.txt, borderRadius: 3 }}>
              {sugestao.txt}
            </div>
          )}
          <div className="flex gap-2 mb-1 text-xs" style={{ color: C.fraco }}>
            <div className="w-8" />
            <div className="flex-1">Carga (kg)</div>
            <div className="flex-1">Reps</div>
          </div>
          {Array.from({ length: ex.s }).map((_, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <div className="w-8 text-xs" style={{ color: C.fraco }}>{i + 1}ª</div>
              <Campo type="number" inputMode="decimal" value={(rasc[i] || {}).kg ?? ""}
                placeholder={sugestao ? String(sugestao.kg) : "—"}
                onChange={(ev) => setRasc(ex.id, i, "kg", ev.target.value)} className="flex-1" />
              <Campo type="number" inputMode="numeric" value={(rasc[i] || {}).reps ?? ""}
                placeholder={String(topo)}
                onChange={(ev) => setRasc(ex.id, i, "reps", ev.target.value)} className="flex-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- corrida */
function Corrida({ st, grava }) {
  const [dialogo, setDialogo] = useState(null);
  const plano = PLANOS_CORRIDA[st.nivelCorrida];
  const outro = st.nivelCorrida === 1 ? 2 : 1;
  const total = plano.semanas.reduce((s, w) => s + w.t.length, 0);
  const ids = plano.semanas.flatMap((w) => w.t.map((t) => t.id));
  const feitos = ids.filter((id) => (st.corridas[id] || {}).feito).length;

  const set = (id, campo, valor) =>
    grava({ ...st, corridas: { ...st.corridas, [id]: { ...(st.corridas[id] || {}), [campo]: valor } } });

  const marcar = (id, atual) => {
    const c = { ...(st.corridas[id] || {}), feito: !atual };
    if (!atual) c.data = hoje();
    grava({ ...st, corridas: { ...st.corridas, [id]: c } });
  };

  const trocarNivel = () => {
    const msg =
      outro === 2
        ? "O plano de 10 km assume que você já completa 5 km correndo sem pausa. Ele acrescenta tiros, ritmo firme e um longão que chega a 9 km antes da prova.\n\nSeus registros do plano de 5 km continuam salvos. Trocar agora?"
        : "Voltar para o plano de 5 km? Seus registros do plano de 10 km continuam salvos.";
    setDialogo({
      texto: msg,
      acao: outro === 2 ? "Ir para os 10 km" : "Voltar para os 5 km",
      cor: outro === 2 ? "#2E7FA8" : C.sup2,
      ok: () => { grava({ ...st, nivelCorrida: outro }); setDialogo(null); },
    });
  };

  return (
    <div>
      <CartaoNivel
        titulo={plano.nome}
        desc={plano.desc}
        acao={outro === 2 ? "Subir para os 10 km" : "Voltar para os 5 km"}
        cor={C.run}
        subindo={outro === 2}
        onClick={trocarNivel}
      />

      <div className="mb-5 p-3" style={{ background: C.sup, borderRadius: 4 }}>
        <div className="text-sm" style={{ fontWeight: 600 }}>{feitos} de {total} treinos concluídos</div>
        <div className="text-xs mt-1" style={{ color: C.fraco, lineHeight: 1.5 }}>
          Ritmo fácil é aquele em que você fala uma frase inteira sem ofegar. Dor aguda na canela ou no joelho: pare o treino do dia.
        </div>
      </div>

      {plano.semanas.map((s) => (
        <div key={s.semana} className="mb-5">
          <div className="text-lg" style={{ fontWeight: 600 }}>Semana {s.semana}</div>
          <div className="text-xs mb-3 mt-1" style={{ color: C.fraco, lineHeight: 1.5 }}>{s.foco}</div>

          {s.t.map((t) => {
            const c = st.corridas[t.id] || {};
            return (
              <div key={t.id} className="mb-2 p-3" style={{ background: C.sup, borderRadius: 4, opacity: c.feito ? 0.65 : 1 }}>
                <div className="flex items-start gap-3">
                  <button onClick={() => marcar(t.id, c.feito)} className="mt-1 flex items-center justify-center"
                    style={{
                      width: 22, height: 22, flexShrink: 0, borderRadius: 3,
                      background: c.feito ? C.run : "transparent",
                      border: `1px solid ${c.feito ? C.run : C.linha}`,
                    }}>
                    {c.feito && <Check size={14} color="#141917" />}
                  </button>
                  <div className="flex-1">
                    <div className="text-xs" style={{ color: C.fraco }}>{t.dia} · {t.tempo}</div>
                    <div className="text-sm mt-1" style={{ fontWeight: 500 }}>{t.t}</div>
                    <div className="text-xs mt-1" style={{ color: C.fraco, lineHeight: 1.5 }}>{t.d}</div>
                    {c.feito && (
                      <div className="flex gap-2 mt-3">
                        <Campo placeholder="km" inputMode="decimal" value={c.km ?? ""} onChange={(e) => set(t.id, "km", e.target.value)} className="flex-1" />
                        <Campo placeholder="tempo (min)" inputMode="decimal" value={c.tempo ?? ""} onChange={(e) => set(t.id, "tempo", e.target.value)} className="flex-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <Dialogo dados={dialogo} fechar={() => setDialogo(null)} />
    </div>
  );
}

/* --------------------------------------------------------- progresso */
function Progresso({ st, grava }) {
  const [peso, setPeso] = useState("");
  const [exSel, setExSel] = useState("");

  const addPeso = () => {
    const v = parseFloat(peso);
    if (isNaN(v)) return;
    grava({
      ...st,
      pesos: [...st.pesos.filter((p) => p.data !== hoje()), { data: hoje(), valor: v }].sort((a, b) => a.data.localeCompare(b.data)),
    });
    setPeso("");
  };

  const exercicios = [...new Set(st.logs.map((l) => l.exId))];
  const nomeDe = (id) => (st.logs.find((l) => l.exId === id) || {}).exNome || id;
  const alvo = exSel || exercicios[0];

  const dadosEx = st.logs
    .filter((l) => l.exId === alvo)
    .map((l) => {
      const vol = l.series.reduce((s, x) => s + (parseFloat(x.kg) || 0) * (parseInt(x.reps, 10) || 0), 0);
      const top = Math.max(...l.series.map((x) => parseFloat(x.kg) || 0));
      return { data: fmt(l.data), volume: Math.round(vol), carga: top };
    });

  const kmTotal = Object.values(st.corridas).reduce((s, c) => s + (parseFloat(c.km) || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Metrica rotulo="Treinos" valor={new Set(st.logs.map((l) => l.data + l.dia)).size} />
        <Metrica rotulo="Km corridos" valor={kmTotal ? kmTotal.toFixed(1) : "0"} />
        <Metrica rotulo="Séries" valor={st.logs.reduce((s, l) => s + l.series.length, 0)} />
      </div>

      <div className="mb-6">
        <div className="text-sm mb-2" style={{ fontWeight: 600 }}>Peso corporal</div>
        <div className="flex gap-2 mb-3">
          <Campo placeholder="kg de hoje" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} className="flex-1" />
          <button onClick={addPeso} className="px-4 text-sm" style={{ background: C.sup2, color: C.txt, borderRadius: 3, border: `1px solid ${C.linha}` }}>
            <Plus size={16} />
          </button>
        </div>
        {st.pesos.length > 1 ? (
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={st.pesos.map((p) => ({ data: fmt(p.data), peso: p.valor }))}>
                <CartesianGrid stroke={C.linha} vertical={false} />
                <XAxis dataKey="data" stroke={C.fraco} fontSize={11} />
                <YAxis stroke={C.fraco} fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip contentStyle={{ background: C.sup, border: `1px solid ${C.linha}`, borderRadius: 3, color: C.txt }} />
                <Line type="monotone" dataKey="peso" stroke={C.run} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-xs" style={{ color: C.fraco }}>
            Registre pelo menos duas pesagens para o gráfico aparecer. Uma vez por semana, mesmo horário, basta.
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="text-sm mb-2" style={{ fontWeight: 600 }}>Evolução por exercício</div>
        {exercicios.length ? (
          <>
            <select value={alvo} onChange={(e) => setExSel(e.target.value)} onWheel={travaScroll}
              className="w-full p-2 text-sm mb-3"
              style={{ background: C.sup2, color: C.txt, border: `1px solid ${C.linha}`, borderRadius: 3 }}>
              {exercicios.map((id) => (
                <option key={id} value={id} style={{ background: C.sup }}>{nomeDe(id)}</option>
              ))}
            </select>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosEx}>
                  <CartesianGrid stroke={C.linha} vertical={false} />
                  <XAxis dataKey="data" stroke={C.fraco} fontSize={11} />
                  <YAxis stroke={C.fraco} fontSize={11} />
                  <Tooltip contentStyle={{ background: C.sup, border: `1px solid ${C.linha}`, borderRadius: 3, color: C.txt }} />
                  <Line type="monotone" dataKey="carga" name="Maior carga" stroke={C.A} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="volume" name="Volume total" stroke={C.D} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs mt-2" style={{ color: C.fraco }}>
              <span style={{ color: C.A }}>■ maior carga</span>
              <span style={{ color: C.D }}>■ volume (kg × reps)</span>
            </div>
          </>
        ) : (
          <div className="text-xs" style={{ color: C.fraco }}>
            Salve seu primeiro treino na aba Treino e a evolução aparece aqui.
          </div>
        )}
      </div>
    </div>
  );
}

function Metrica({ rotulo, valor }) {
  return (
    <div className="p-3" style={{ background: C.sup, borderRadius: 4 }}>
      <div className="text-xl" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      <div className="text-xs mt-1" style={{ color: C.fraco }}>{rotulo}</div>
    </div>
  );
}

/* -------------------------------------------------------------- ficha */
function Ficha({ st, grava }) {
  const [dia, setDia] = useState("A");
  const [dialogo, setDialogo] = useState(null);
  const fichaAtual = st.fichas[st.nivel];
  const f = fichaAtual[dia];
  const outro = st.nivel === 1 ? 2 : 1;

  const upd = (exs) =>
    grava({ ...st, fichas: { ...st.fichas, [st.nivel]: { ...fichaAtual, [dia]: { ...f, ex: exs } } } });
  const editar = (i, campo, v) => upd(f.ex.map((e, j) => (j === i ? { ...e, [campo]: v } : e)));
  const remover = (i) => upd(f.ex.filter((_, j) => j !== i));
  const add = () => upd([...f.ex, { id: dia.toLowerCase() + Date.now(), n: "Novo exercício", s: 3, r: "10-12", inc: 2.5 }]);

  const trocarNivel = () => {
    const msg =
      outro === 2
        ? "O nível 2 quase dobra o volume semanal por grupo muscular e passa a treinar cada um duas vezes por semana. Ele foi desenhado para quem já tem cerca de 6 meses de nível 1.\n\nSuas cargas registradas continuam salvas e você pode voltar quando quiser. Trocar agora?"
        : "Voltar para o nível 1? Suas edições e cargas do nível 2 continuam salvas.";
    setDialogo({
      texto: msg,
      acao: outro === 2 ? "Subir para o nível 2" : "Voltar para o nível 1",
      cor: outro === 2 ? C.A : C.sup2,
      ok: () => { grava({ ...st, nivel: outro, rascunho: {} }); setDialogo(null); },
    });
  };

  return (
    <div>
      <CartaoNivel
        titulo={NIVEIS[st.nivel].nome}
        desc={NIVEIS[st.nivel].desc}
        acao={outro === 2 ? "Subir para o nível 2" : "Voltar para o nível 1"}
        cor={st.nivel === 1 ? C.E : C.A}
        subindo={outro === 2}
        onClick={trocarNivel}
      />

      <div className="text-xs mb-4" style={{ color: C.fraco, lineHeight: 1.5 }}>
        Troque um exercício quando o aparelho estiver ocupado ou incomodar. O histórico de cada exercício fica guardado pelo nome antigo.
      </div>

      <div className="flex gap-2 mb-4">
        {Object.keys(fichaAtual).map((k) => (
          <button key={k} onClick={() => setDia(k)} className="flex-1 py-2 text-sm"
            style={{ background: dia === k ? C[k] : C.sup, color: dia === k ? (k === "C" || k === "E" ? "#141917" : "#fff") : C.fraco, borderRadius: 3, fontWeight: 600 }}>
            {k}
          </button>
        ))}
      </div>

      <div className="text-sm mb-3" style={{ fontWeight: 600 }}>{f.nome}</div>

      {f.ex.map((e, i) => (
        <div key={e.id} className="mb-2 p-3" style={{ background: C.sup, borderRadius: 4 }}>
          <Campo value={e.n} onChange={(ev) => editar(i, "n", ev.target.value)} className="w-full mb-2" />
          <div className="flex gap-2 items-center">
            <Campo type="number" value={e.s} onChange={(ev) => editar(i, "s", parseInt(ev.target.value, 10) || 1)} className="w-16" />
            <span className="text-xs" style={{ color: C.fraco }}>séries ×</span>
            <Campo value={e.r} onChange={(ev) => editar(i, "r", ev.target.value)} className="flex-1" />
            <button onClick={() => remover(i)} className="p-2" style={{ color: C.fraco }}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      <button onClick={add} className="w-full py-3 mb-6 flex items-center justify-center gap-2 text-sm"
        style={{ background: C.sup, color: C.txt, borderRadius: 3, border: `1px dashed ${C.linha}` }}>
        <Plus size={16} /> Adicionar exercício
      </button>

      <Backup st={st} grava={grava} />

      <button
        onClick={() =>
          setDialogo({
            texto: "Isso apaga todas as cargas, corridas e pesagens registradas. Não dá para desfazer.",
            acao: "Apagar tudo",
            cor: "#8E3A33",
            ok: () => { grava(VAZIO); setDialogo(null); },
          })
        }
        className="w-full py-3 mb-4 text-sm"
        style={{ background: "transparent", color: "#C4645C", borderRadius: 3, border: `1px solid #4A2F2C` }}
      >
        Apagar tudo e recomeçar
      </button>

      <Dialogo dados={dialogo} fechar={() => setDialogo(null)} />
    </div>
  );
}

/* ------------------------------------------------------------- backup */
/* Como os dados vivem so neste aparelho, limpar o navegador ou trocar de
   celular apaga tudo. Exportar gera um texto que pode ser colado de volta. */
function Backup({ st, grava }) {
  const [modo, setModo] = useState(null);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState(null);

  const exportar = () => {
    setTexto(JSON.stringify(st));
    setAviso(null);
    setModo("exportar");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso("Copiado. Guarde num bloco de notas ou mande para voce mesmo.");
    } catch {
      setAviso("Nao deu para copiar sozinho. Selecione o texto acima e copie na mao.");
    }
  };

  const importar = () => {
    try {
      const dados = migra(JSON.parse(texto));
      grava(dados);
      setAviso("Dados restaurados.");
      setModo(null);
      setTexto("");
    } catch {
      setAviso("Esse texto nao e um backup valido. Cole o conteudo exato que foi exportado.");
    }
  };

  return (
    <div className="mb-6">
      <div className="text-sm mb-1" style={{ fontWeight: 600 }}>Backup</div>
      <div className="text-xs mb-3" style={{ color: C.fraco, lineHeight: 1.5 }}>
        Seus dados ficam apenas neste aparelho. Exporte de vez em quando e guarde o texto em algum lugar seguro.
      </div>

      <div className="flex gap-2 mb-2">
        <button onClick={exportar} className="flex-1 py-2 text-sm"
          style={{ background: C.sup, color: C.txt, borderRadius: 3, border: `1px solid ${C.linha}` }}>
          Exportar
        </button>
        <button onClick={() => { setModo("importar"); setTexto(""); setAviso(null); }} className="flex-1 py-2 text-sm"
          style={{ background: C.sup, color: C.txt, borderRadius: 3, border: `1px solid ${C.linha}` }}>
          Importar
        </button>
      </div>

      {modo && (
        <div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            readOnly={modo === "exportar"}
            placeholder={modo === "importar" ? "Cole aqui o texto exportado" : ""}
            className="w-full p-2 text-xs"
            rows={4}
            style={{ background: C.sup2, color: C.txt, border: `1px solid ${C.linha}`, borderRadius: 3, resize: "vertical" }}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { setModo(null); setAviso(null); }} className="flex-1 py-2 text-sm"
              style={{ background: "transparent", color: C.fraco, borderRadius: 3, border: `1px solid ${C.linha}` }}>
              Fechar
            </button>
            <button onClick={modo === "exportar" ? copiar : importar} className="flex-1 py-2 text-sm"
              style={{ background: C.sup2, color: C.txt, borderRadius: 3, border: `1px solid ${C.linha}`, fontWeight: 600 }}>
              {modo === "exportar" ? "Copiar" : "Restaurar"}
            </button>
          </div>
        </div>
      )}

      {aviso && <div className="text-xs mt-2" style={{ color: C.fraco }}>{aviso}</div>}
    </div>
  );
}
