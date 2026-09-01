/* Único ponto de contato com o armazenamento do aparelho. Nenhum componente
   fala com o `localStorage` direto — trocar por IndexedDB depois é substituir
   este arquivo, não a interface. */

export const CHAVE_V1 = "treino:estado:v1";
export const CHAVE_V2 = "treino:estado:v2";
/* Cópia intacta do estado v1, guardada na primeira migração. Só existe para o
   caso de a migração ter errado algo que só aparece semanas depois. */
export const CHAVE_BACKUP_V1 = "treino:backup-v1";

/* Backend padrão: o `localStorage`. Injetável para os testes e para uma
   eventual troca de mecanismo. */
function backendLocalStorage() {
  return {
    ler(chave) {
      try {
        return localStorage.getItem(chave);
      } catch {
        return null;
      }
    },
    escrever(chave, valor) {
      localStorage.setItem(chave, valor);
    },
    remover(chave) {
      try {
        localStorage.removeItem(chave);
      } catch {
        /* nada a fazer */
      }
    },
  };
}

export function criaRepositorio(backend) {
  const b = backend || backendLocalStorage();

  return {
    lerBruto(chave) {
      return b.ler(chave);
    },
    lerJson(chave) {
      const cru = b.ler(chave);
      if (cru === null || cru === undefined) return null;
      try {
        return JSON.parse(cru);
      } catch {
        /* Conteúdo corrompido não é "estado vazio": quem chama precisa saber
           a diferença para não sobrescrever dados recuperáveis. */
        return { __invalido: true, cru };
      }
    },
    escreverJson(chave, valor) {
      b.escrever(chave, JSON.stringify(valor));
    },
    remover(chave) {
      b.remover(chave);
    },
    existe(chave) {
      return b.ler(chave) !== null && b.ler(chave) !== undefined;
    },
  };
}

/* Repositório em memória, para teste. */
export function criaBackendMemoria(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  return {
    ler: (c) => (mapa.has(c) ? mapa.get(c) : null),
    escrever: (c, v) => mapa.set(c, v),
    remover: (c) => mapa.delete(c),
    _mapa: mapa,
  };
}
