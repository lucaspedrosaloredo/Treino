import { CalendarDays, Dumbbell, Footprints, TrendingUp, Settings } from "lucide-react";

/* Cinco itens, o limite do que cabe numa barra inferior sem virar loteria de
   toque. O rótulo curto é "Ajustes"; o título da tela é "Configurações". */
export const ABAS = [
  { chave: "hoje", rotulo: "Hoje", titulo: "Hoje", icone: CalendarDays },
  { chave: "treino", rotulo: "Treino", titulo: "Musculação", icone: Dumbbell },
  { chave: "corrida", rotulo: "Corrida", titulo: "Corrida", icone: Footprints },
  { chave: "progresso", rotulo: "Progresso", titulo: "Progresso", icone: TrendingUp },
  { chave: "ajustes", rotulo: "Ajustes", titulo: "Configurações", icone: Settings },
];

export const ABA_PADRAO = "hoje";
