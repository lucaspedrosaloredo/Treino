import { useState } from "react";

import { Segmentado } from "../../components/Basicos.jsx";
import { useEstado } from "../../state/contexto.js";
import Executar from "./Executar.jsx";
import Fichas from "./Fichas.jsx";
import Historico from "./Historico.jsx";

export default function Musculacao({ irPara }) {
  const estado = useEstado();
  const [sub, setSub] = useState("executar");

  return (
    <div>
      <Segmentado
        rotulo="Seção de musculação"
        valor={sub}
        aoMudar={setSub}
        opcoes={[
          { valor: "executar", rotulo: estado.sessaoEmAndamento ? "Em andamento" : "Executar" },
          { valor: "fichas", rotulo: "Fichas" },
          { valor: "historico", rotulo: "Histórico" },
        ]}
      />
      {sub === "executar" && <Executar irPara={irPara} />}
      {sub === "fichas" && <Fichas />}
      {sub === "historico" && <Historico />}
    </div>
  );
}
