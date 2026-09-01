import { useState } from "react";

import { Segmentado } from "../../components/Basicos.jsx";
import PlanoAtual from "./PlanoAtual.jsx";
import HistoricoCorridas from "./HistoricoCorridas.jsx";
import MeusPlanos from "./MeusPlanos.jsx";

export default function Corrida() {
  const [sub, setSub] = useState("plano");
  return (
    <div>
      <Segmentado
        rotulo="Seção de corrida"
        valor={sub}
        aoMudar={setSub}
        opcoes={[
          { valor: "plano", rotulo: "Plano" },
          { valor: "historico", rotulo: "Histórico" },
          { valor: "planos", rotulo: "Meus planos" },
        ]}
      />
      {sub === "plano" && <PlanoAtual />}
      {sub === "historico" && <HistoricoCorridas />}
      {sub === "planos" && <MeusPlanos />}
    </div>
  );
}
