/* Semente de quem instala o app agora. Reaproveita exatamente o conteúdo
   curado da versão 1 e os mesmos conversores da migração — assim quem começa
   hoje e quem já tinha dados acabam com a mesma estrutura. */

import { NIVEL1, NIVEL2, CORRIDA1, CORRIDA2 } from "./legadoV1.js";
import { converteFichasV1, converteModeloCorridaV1 } from "../lib/migrations.js";
import { criaExercicio, criaPlanoCorrida } from "../lib/schema.js";
import { idDerivado } from "../lib/ids.js";

export function fichasIniciais() {
  /* Nível 1 ativo, nível 2 já disponível e arquivado, pronto para quando a
     pessoa quiser subir. */
  return converteFichasV1({ 1: NIVEL1, 2: NIVEL2 }, 1);
}

export function planosIniciais() {
  const modelos = [
    converteModeloCorridaV1(CORRIDA1, "corrida-1"),
    converteModeloCorridaV1(CORRIDA2, "corrida-2"),
  ];
  const planos = modelos.map((m, i) =>
    criaPlanoCorrida({
      ...m,
      id: idDerivado("plano-usuario", `corrida-${i + 1}`),
      ativo: i === 0,
      arquivado: i !== 0,
    }),
  );
  return { modelos, planos };
}

/* Alguns exercícios comuns fora das fichas, para quem for montar ficha do
   zero não começar com a lista vazia. */
const EXTRAS = [
  ["Corrida na esteira", "Corpo inteiro", "Máquina", "tempo"],
  ["Bicicleta ergométrica", "Quadríceps", "Máquina", "tempo"],
  ["Flexão de braço", "Peito", "Peso corporal", "corporal_reps"],
  ["Barra fixa", "Costas", "Peso corporal", "corporal_reps"],
  ["Abdominal remador", "Core", "Peso corporal", "reps"],
  ["Prancha frontal", "Core", "Peso corporal", "tempo"],
  ["Levantamento terra", "Posterior", "Barra", "peso_reps"],
  ["Remada cavalinho", "Costas", "Barra", "peso_reps"],
];

export function exerciciosIniciais() {
  return EXTRAS.map(([nome, grupoPrincipal, equipamento, tipoRegistro], i) =>
    criaExercicio({
      id: idDerivado("extra", String(i)),
      nome,
      grupoPrincipal,
      equipamento,
      tipoRegistro,
    }),
  );
}
