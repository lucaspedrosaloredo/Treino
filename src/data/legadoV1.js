/* Conteúdo da versão 1, preservado exatamente como estava.
   Serve a dois propósitos: é a semente de quem abre o app pela primeira vez e é
   a referência que a migração usa para reconstruir fichas e planos de quem já
   tinha dados. Por isso o texto aqui não deve ser reescrito de leve — mudar um
   `id` quebra o vínculo do histórico antigo. */


/* --------------------------------------------------------------- nível 1 */
export const NIVEL1 = {
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
export const NIVEL2 = {
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

export const NIVEIS = {
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
export const CORRIDA1 = {
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
export const CORRIDA2 = {
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

export const PLANOS_CORRIDA = { 1: CORRIDA1, 2: CORRIDA2 };

export const AGENDA = {
  1: { treino: "A", corrida: 0 },
  2: { treino: "B" },
  3: { treino: "C", corrida: 1 },
  4: { treino: "E" },
  5: { treino: "D" },
  6: { corrida: 2 },
  0: {},
};
