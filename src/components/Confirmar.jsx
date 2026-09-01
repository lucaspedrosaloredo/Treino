import { useState } from "react";

import Modal from "./Modal.jsx";
import Botao from "./Botao.jsx";
import Campo from "./Campo.jsx";

/* Confirmação de ação destrutiva. Nada de `window.confirm`: ele não é
   estilizável, não é traduzível e no iOS trava a página inteira.
   `fraseExigida` é para o caso extremo — apagar tudo pede digitar a palavra. */
export default function Confirmar({ pedido, aoFechar }) {
  if (!pedido) return null;
  /* A caixa é remontada a cada pedido, então o campo digitado nasce vazio sem
     precisar de efeito nenhum para limpá-lo. */
  return <Caixa key={pedido.titulo} pedido={pedido} aoFechar={aoFechar} />;
}

function Caixa({ pedido, aoFechar }) {
  const [digitado, setDigitado] = useState("");
  const exigeFrase = Boolean(pedido.fraseExigida);
  const liberado = !exigeFrase || digitado.trim().toUpperCase() === pedido.fraseExigida.toUpperCase();

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={pedido.titulo}
      descricao={pedido.texto}
      rodape={
        <>
          <Botao variante="fantasma" larguraTotal onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            variante="perigoSolido"
            larguraTotal
            disabled={!liberado}
            onClick={() => {
              pedido.aoConfirmar();
              aoFechar();
            }}
          >
            {pedido.acao}
          </Botao>
        </>
      }
    >
      {exigeFrase && (
        <Campo
          rotulo={`Digite ${pedido.fraseExigida} para confirmar`}
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
        />
      )}
    </Modal>
  );
}
