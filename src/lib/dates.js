/* Datas sempre no fuso local. O erro clássico é `new Date("2026-03-01")`, que o
   navegador lê como UTC e devolve 28/02 em qualquer fuso a oeste de Greenwich —
   por isso nada aqui usa esse construtor com string. */

/** Data-only no formato YYYY-MM-DD, a partir de um Date local. */
export function paraChaveData(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hoje() {
  return paraChaveData(new Date());
}

/** YYYY-MM-DD -> Date local à meia-noite. Sem isto, o fuso rouba um dia. */
export function deChaveData(chave) {
  if (typeof chave !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(chave);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ehChaveDataValida(chave) {
  const d = deChaveData(chave);
  if (!d) return false;
  return paraChaveData(d) === String(chave).slice(0, 10);
}

/** dd/mm/aaaa, o formato que a interface mostra. */
export function formataData(chave) {
  const d = deChaveData(chave);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** dd/mm, para eixos de gráfico e listas apertadas. */
export function formataDataCurta(chave) {
  const d = deChaveData(chave);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function somaDias(chave, dias) {
  const d = deChaveData(chave);
  if (!d) return null;
  d.setDate(d.getDate() + dias);
  return paraChaveData(d);
}

export function diferencaEmDias(de, ate) {
  const a = deChaveData(de);
  const b = deChaveData(ate);
  if (!a || !b) return null;
  /* Meio-dia nos dois lados: imune ao horário de verão, que encurta ou
     alonga um dos dias em uma hora e estragaria a divisão. */
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

/** Segunda-feira da semana da data, ou o dia escolhido como início. */
export function inicioDaSemana(chave, primeiroDia = 1) {
  const d = deChaveData(chave);
  if (!d) return null;
  const desloca = (d.getDay() - primeiroDia + 7) % 7;
  d.setDate(d.getDate() - desloca);
  return paraChaveData(d);
}

/** Carimbo com horário, para início e fim de sessão. */
export function agoraIso() {
  return new Date().toISOString();
}

/** Segundos entre dois carimbos ISO; null se algum for inválido. */
export function segundosEntre(inicioIso, fimIso) {
  const a = new Date(inicioIso).getTime();
  const b = new Date(fimIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 1000));
}

/** Extrai a data local (YYYY-MM-DD) de um carimbo ISO. */
export function dataDeIso(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : paraChaveData(d);
}

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DIAS_SEMANA_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];

export function nomeDoDia(chave) {
  const d = deChaveData(chave);
  return d ? DIAS_SEMANA[d.getDay()] : "—";
}
