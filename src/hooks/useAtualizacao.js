import { useCallback, useEffect, useState } from "react";

/* Marca de tentativa, para o caso de o worker novo não conseguir assumir.
   Sem ela, uma falha viraria recarga em laço — que é bem pior que ficar uma
   versão atrás. Vive no `sessionStorage`: some ao fechar a aba. */
const CHAVE_TENTATIVA = "treino:atualizacao-tentada";

function leuTentativa() {
  try {
    return sessionStorage.getItem(CHAVE_TENTATIVA) === "1";
  } catch {
    return false;
  }
}

function marcaTentativa(valor) {
  try {
    if (valor) sessionStorage.setItem(CHAVE_TENTATIVA, "1");
    else sessionStorage.removeItem(CHAVE_TENTATIVA);
  } catch {
    /* armazenamento bloqueado: seguir sem a proteção é melhor que travar */
  }
}

/**
 * Cuida da troca de versão do app.
 *
 * O worker novo assume sozinho na abertura seguinte, desde que seja seguro —
 * `podeAtualizarAgora` é falso enquanto houver treino em andamento, porque
 * atualizar recarrega a página. Antes disto o worker esperava todas as abas
 * fecharem, o que num celular quase nunca acontece: a versão nova ficava presa
 * e a única saída era limpar os dados do site, levando o histórico junto.
 */
export function useAtualizacao({ podeAtualizarAgora = true } = {}) {
  const [emEspera, setEmEspera] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  /* Estado, e não ref: este valor é lido durante o render, para decidir se
     a faixa de "atualizar agora" precisa aparecer. */
  const [jaTentou, setJaTentou] = useState(leuTentativa);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    let cancelado = false;

    /* "installed" com um controller ativo significa: existe versão nova pronta
       e uma versão antiga rodando agora. */
    const pronto = (w) => w && w.state === "installed" && navigator.serviceWorker.controller;

    const observa = (worker) => {
      if (!worker || cancelado) return;
      if (pronto(worker)) {
        setEmEspera(worker);
        return;
      }
      worker.addEventListener("statechange", () => {
        if (!cancelado && pronto(worker)) setEmEspera(worker);
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelado) return;

      if (reg.waiting) {
        setEmEspera(reg.waiting);
      } else if (reg.installing) {
        /* O worker novo pode já estar baixando quando esta tela monta. Nesse
           caso `updatefound` disparou antes de existir quem escutasse, e sem
           olhar para `installing` a versão nova passava despercebida — era o
           que fazia a troca automática não acontecer. */
        observa(reg.installing);
      } else {
        /* Nada pendente: a troca anterior deu certo, e a próxima volta a
           poder ser automática nesta mesma aba. */
        marcaTentativa(false);
        setJaTentou(false);
      }

      reg.addEventListener("updatefound", () => observa(reg.installing));

      /* Pergunta ativamente por uma versão nova em vez de esperar o navegador
         decidir quando checar. É um pedido pequeno, uma vez por abertura. */
      reg.update().catch(() => {
        /* sem rede: o app segue funcionando com o que está em cache */
      });
    });

    return () => {
      cancelado = true;
    };
  }, []);

  const atualizar = useCallback(() => {
    if (!emEspera || atualizando) return;
    setAtualizando(true);
    marcaTentativa(true);
    setJaTentou(true);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    emEspera.postMessage({ tipo: "ASSUMIR_AGORA" });
  }, [emEspera, atualizando]);

  /* A troca automática. Se já tentamos nesta aba e a versão nova continua
     esperando, alguma coisa deu errado — aí paramos e deixamos o botão.
     A chamada sai do ciclo de render de propósito: assim a tela termina de
     pintar antes de a página recarregar, em vez de piscar pela metade. */
  useEffect(() => {
    if (!emEspera || atualizando || !podeAtualizarAgora || jaTentou) return undefined;
    const id = setTimeout(atualizar, 0);
    return () => clearTimeout(id);
  }, [emEspera, atualizando, podeAtualizarAgora, jaTentou, atualizar]);

  return {
    temAtualizacao: Boolean(emEspera),
    atualizando,
    /* Verdadeiro quando a troca automática não vai acontecer sozinha e o
       usuário precisa decidir. */
    precisaDecidir: Boolean(emEspera) && !atualizando && (!podeAtualizarAgora || jaTentou),
    atualizar,
  };
}
