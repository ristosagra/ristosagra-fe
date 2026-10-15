import {
  PLAN_BOOKING_COLORS,
  PLAN_OPP,
  Side,
  TableShape,
  TableStatus,
  type TableStatusConst,
  type SideConst,
} from "../constant/floorPlan";
import type {
  BookingSummary,
  Chair,
  ChairBooking,
  CoordinateType,
  SeatRef,
  TableData,
} from "../types/floorPlan";
import { chairPos, worldChairPos } from "./chair";
import {
  bodyHalfExtents,
  rectColumns,
  rotatePoint,
  tableHeads,
} from "./dimensions";

// Sullo stesso tavolo rettangolare attraversare il tavolo "costa" meno che spostarsi di lato:
// chi è seduto di fronte è considerato vicino.
const ACROSS_WEIGHT = 0.35;
// Peso della vicinanza ai posti già prenotati rispetto alla compattezza del gruppo.
const ATTACH_WEIGHT = 1;
const EPS = 1e-6;

/** Restituisce i tavoli prenotabili insieme: tutto il gruppo se il tavolo è unito, altrimenti il tavolo stesso. */
export function getUnit(table: TableData, tables: TableData[]) {
  return table.groupId
    ? tables.filter((t) => t.groupId === table.groupId)
    : [table];
}

/** Divide i tavoli in unità prenotabili (gruppi di tavoli uniti o tavoli singoli), ognuna una sola volta. */
export function allUnits(tables: TableData[]) {
  const seen = new Set<string>();
  const units: TableData[][] = [];
  for (const t of tables) {
    const key = t.groupId ?? t.id;
    if (seen.has(key)) continue;
    seen.add(key);
    units.push(getUnit(t, tables));
  }
  return units;
}

/** Vero se almeno un posto dei tavoli indicati è prenotato. */
export function hasBookings(tables: TableData[]) {
  return tables.some((t) => t.chairs.some((c) => c.booking));
}

/** Vero se l'unità è fatta solo di tavoli rettangolari (gli unici con i capotavola). */
function isRectUnit(unit: TableData[]) {
  return unit.every((t) => t.shape === TableShape.Rect);
}

/** Asse principale dell'unità (il lato più lungo dell'ingombro dei tavoli) e suo centro.
 *  Un'unità quadrata non ha un asse principale, quindi nemmeno capotavola. */
function unitAxis(unit: TableData[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const t of unit) {
    const { hw, hh } = bodyHalfExtents(t);
    minX = Math.min(minX, t.x - hw);
    maxX = Math.max(maxX, t.x + hw);
    minY = Math.min(minY, t.y - hh);
    maxY = Math.max(maxY, t.y + hh);
  }
  const w = maxX - minX,
    h = maxY - minY;
  const horizontal = w >= h;
  return {
    horizontal,
    elongated: Math.max(w, h) > Math.min(w, h) * 1.15,
    cu: horizontal ? (minX + maxX) / 2 : (minY + maxY) / 2,
    u: (p: CoordinateType) => (horizontal ? p.x : p.y),
  };
}

/** Un lato sinistro/destro del tavolo (non ruotato) è una testata dell'unità
 *  se è orientato lungo l'asse principale. */
function isHeadSide(
  t: TableData,
  side: Chair["side"],
  axis: ReturnType<typeof unitAxis>,
) {
  if (side !== Side.Left && side !== Side.Right) return false;
  const alongX = (t.rotation ?? 0) % 180 === 0;
  return axis.elongated && alongX === axis.horizontal;
}

/** Elenca tutti i posti dei tavoli con la loro posizione assoluta nella piantina.
 *  Sono capotavola i posti sulle testate dell'unità (tavolo o gruppo di tavoli rettangolari). */
export function unitSeats(unit: TableData[]): SeatRef[] {
  const rectUnit = isRectUnit(unit);
  const axis = unitAxis(unit);
  return unit.flatMap((t) =>
    t.chairs.map((c, index) => {
      const local = chairPos(c, t);
      const p = worldChairPos(c, t);
      return {
        tableId: t.id,
        index,
        x: t.x + p.x,
        y: t.y + p.y,
        lx: local.x,
        ly: local.y,
        booked: !!c.booking,
        head: rectUnit && isHeadSide(t, c.side, axis),
      };
    }),
  );
}

/** Capotavola ancora liberi dell'unità. */
export function freeHeadSeats(unit: TableData[]) {
  return unitSeats(unit).filter((s) => s.head && !s.booked);
}

/** Posti dei lati lunghi raggruppati in colonne lungo l'asse principale;
 *  in ogni colonna i posti vanno da un lato all'altro del tavolo. */
function seatColumns(unit: TableData[], seats: SeatRef[]) {
  const axis = unitAxis(unit);
  const v = (s: SeatRef) => (axis.horizontal ? s.y : s.x);
  const cols: SeatRef[][] = [];
  for (const s of seats
    .filter((x) => !x.head)
    .sort((a, b) => axis.u(a) - axis.u(b))) {
    const last = cols[cols.length - 1];
    if (last && Math.abs(axis.u(s) - axis.u(last[0])) <= 10) last.push(s);
    else cols.push([s]);
  }
  return { axis, cols: cols.map((c) => c.sort((a, b) => v(a) - v(b))) };
}

/** Tra più testate preferisce quella con la colonna vicina libera (così il gruppo le sta accanto),
 *  a parità quella più a sinistra (o più in alto). */
function pickEnd<T extends CoordinateType>(
  candidates: T[],
  { axis, cols }: ReturnType<typeof seatColumns>,
) {
  const freeNear = (p: T) => {
    const col = axis.u(p) < axis.cu ? cols[0] : cols[cols.length - 1];
    return col ? col.filter((s) => !s.booked).length : 0;
  };
  return [...candidates].sort(
    (a, b) => freeNear(b) - freeNear(a) || axis.u(a) - axis.u(b),
  )[0];
}

/** Testate vuote (senza sedia e non unite a un altro tavolo) dove si può aggiungere un posto a capotavola,
 *  dalla più adatta (quella con la colonna vicina libera, poi a sinistra/in alto). */
export function addableHeads(unit: TableData[]) {
  if (!isRectUnit(unit)) return [];
  const axis = unitAxis(unit);
  const candidates = unit.flatMap((t) =>
    [Side.Left, Side.Right]
      .filter(
        (side) =>
          isHeadSide(t, side, axis) &&
          !t.blockedSides.includes(side) &&
          !t.chairs.some((c) => c.side === side),
      )
      .map((side) => {
        const p = rotatePoint(chairPos({ side, offset: 0 }, t), t.rotation);
        return { tableId: t.id, side, x: t.x + p.x, y: t.y + p.y };
      }),
  );
  const model = seatColumns(unit, unitSeats(unit));
  const best = candidates.length > 0 ? pickEnd(candidates, model) : null;
  return best ? [best, ...candidates.filter((c) => c !== best)] : [];
}

/** Aggiunge al tavolo un posto a capotavola sulla testata indicata:
 *  le altre sedie (e le loro prenotazioni) restano invariate e il tavolo non cambia grandezza. */
export function addHeadChair(
  tables: TableData[],
  { tableId, side }: { tableId: string; side: SideConst },
): TableData[] {
  return tables.map((t) =>
    t.id === tableId
      ? {
          ...t,
          size: t.size + 1,
          heads: (tableHeads(t) + 1) as TableData["heads"],
          chairs: [...t.chairs, { side, offset: 0 }],
        }
      : t,
  );
}

/** Conta posti totali, prenotati e liberi e ricava lo stato (libero, parziale, completo). */
export function unitOccupancy(unit: TableData[]) {
  const total = unit.reduce((s, t) => s + t.chairs.length, 0);
  const booked = unit.reduce(
    (s, t) => s + t.chairs.filter((c) => c.booking).length,
    0,
  );
  const status: TableStatusConst =
    booked === 0
      ? TableStatus.Free
      : booked >= total
        ? TableStatus.Full
        : TableStatus.Partial;
  return { total, booked, free: total - booked, status };
}

/** Colore preferito di una prenotazione, ricavato dal suo id (resta lo stesso anche se altre prenotazioni vengono cancellate). */
function preferredColorIndex(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % PLAN_BOOKING_COLORS.length;
}

/** Raggruppa i posti prenotati per prenotazione, in ordine di creazione,
 *  assegnando a ciascuna un colore diverso per riconoscere i posti prenotati allo stesso nome. */
export function bookingSummaries(unit: TableData[]): BookingSummary[] {
  const map = new Map<
    string,
    {
      name: string;
      seats: number;
      seatedAt?: string;
      arrivalTime?: string;
      wheelchairs: number;
    }
  >();
  for (const t of unit)
    for (const c of t.chairs) {
      if (!c.booking) continue;
      const entry = map.get(c.booking.id) ?? {
        name: c.booking.name,
        seats: 0,
        seatedAt: c.booking.seatedAt,
        arrivalTime: c.booking.arrivalTime,
        wheelchairs: 0,
      };
      entry.seats += 1;
      if (c.booking.wheelchair) entry.wheelchairs += 1;
      map.set(c.booking.id, entry);
    }
  const used = new Set<number>();
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([id, { name, seats, seatedAt, arrivalTime, wheelchairs }]) => {
      let idx = preferredColorIndex(id);
      while (used.has(idx) && used.size < PLAN_BOOKING_COLORS.length)
        idx = (idx + 1) % PLAN_BOOKING_COLORS.length;
      used.add(idx);
      return {
        id,
        name,
        seats,
        seatedAt,
        arrivalTime,
        wheelchairs,
        color: PLAN_BOOKING_COLORS[idx],
      };
    });
}

/** Distanza "sociale" tra due posti: sullo stesso tavolo rettangolare chi è di fronte
 *  risulta vicino (si usano le coordinate del tavolo non ruotato), negli altri casi si usa la distanza reale. */
function seatDist(a: SeatRef, b: SeatRef, unit: TableData[]) {
  const t = unit.find((tt) => tt.id === a.tableId);
  if (a.tableId === b.tableId && t?.shape === TableShape.Rect)
    return Math.abs(a.lx - b.lx) + ACROSS_WEIGHT * Math.abs(a.ly - b.ly);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Verifica se due posti sono uno di fronte all'altro sullo stesso tavolo:
 *  sui rotondi diametralmente opposti, sui rettangolari sui lati opposti alla stessa altezza. */
function isFacing(a: SeatRef, b: SeatRef, unit: TableData[]) {
  if (a.tableId !== b.tableId) return false;
  const t = unit.find((tt) => tt.id === a.tableId);
  if (!t) return false;
  const ca = t.chairs[a.index],
    cb = t.chairs[b.index];
  if (t.shape === TableShape.Round) {
    let diff = Math.abs(ca.offset - cb.offset) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff >= 180 - 180 / t.chairs.length - 0.5;
  }
  if (ca.side === "round" || cb.side === "round") return false;
  if (PLAN_OPP[ca.side] !== cb.side) return false;
  if (ca.side === Side.Top || ca.side === Side.Bottom)
    return Math.abs(a.lx - b.lx) < 5;
  // Le due testate sono di fronte solo se il tavolo è quadrato, altrimenti sono troppo lontane
  return rectColumns(t) <= 1 && Math.abs(a.ly - b.ly) < 5;
}

/** Sceglie `count` posti liberi per una nuova prenotazione.
 *  Sui tavoli rettangolari i posti si riempiono lungo i lati senza lasciare buchi
 *  (vedi selectInRows); sui tavoli rotondi si sceglie il gruppo di posti più compatto.
 *  Ritorna null se i posti liberi non bastano. */
export function selectSeats(
  unit: TableData[],
  count: number,
): SeatRef[] | null {
  const seats = unitSeats(unit);
  const free = seats.filter((s) => !s.booked);
  if (count <= 0 || count > free.length) return null;
  return isRectUnit(unit)
    ? selectInRows(unit, seats, count)
    : selectByDistance(unit, seats, count);
}

/** Tavoli rettangolari: i posti sono in fila da un'estremità all'altra
 *  (capotavola, colonne dei lati lunghi una dopo l'altra, capotavola opposto).
 *  - tavolo vuoto: si parte dal capotavola (se c'è), altrimenti dalla prima colonna;
 *  - tavolo già prenotato: si continua dalla prenotazione esistente, chiudendo prima
 *    una colonna lasciata a metà, così non restano posti liberi in mezzo. Il capotavola
 *    opposto si occupa solo quando la fila arriva fino a lui. */
/** Posti di un'unità rettangolare in fila da un'estremità all'altra:
 *  capotavola iniziale, colonne dei lati lunghi una dopo l'altra, capotavola finale. */
function rowOrder(unit: TableData[], seats: SeatRef[]) {
  const model = seatColumns(unit, seats);
  const { axis, cols } = model;
  const heads = seats.filter((s) => s.head);
  const order = [
    ...heads.filter((h) => axis.u(h) < axis.cu),
    ...cols.flat(),
    ...heads.filter((h) => axis.u(h) >= axis.cu),
  ];
  return { model, heads, order };
}

function selectInRows(
  unit: TableData[],
  seats: SeatRef[],
  count: number,
): SeatRef[] | null {
  const { model, heads, order } = rowOrder(unit, seats);
  const { axis, cols } = model;
  const freeIdx = order.flatMap((s, i) => (s.booked ? [] : [i]));
  if (count > freeIdx.length) return null;

  const firstBooked = order.findIndex((s) => s.booked);
  if (firstBooked === -1) {
    // Tavolo vuoto: si parte dal capotavola preferito
    const start = heads.length > 0 ? pickEnd(heads, model) : null;
    const fromStart = !start || axis.u(start) < axis.cu;
    return (fromStart ? order : [...order].reverse()).slice(0, count);
  }

  const lastBooked =
    order.length - 1 - [...order].reverse().findIndex((s) => s.booked);
  // posti liberi dopo la prima prenotazione (in avanti) e prima dell'ultima (all'indietro)
  const forward = freeIdx.filter((i) => i > firstBooked);
  const backward = freeIdx.filter((i) => i < lastBooked).reverse();
  const colOf = (s: SeatRef) => cols.findIndex((c) => c.includes(s));
  const isHalf = (i: number | undefined) => {
    if (i === undefined) return false;
    const c = colOf(order[i]);
    return c !== -1 && cols[c].some((s) => s.booked);
  };
  const primary =
    isHalf(forward[0]) || (!isHalf(backward[0]) && forward.length > 0)
      ? forward
      : backward;
  const rest = freeIdx.filter((i) => !primary.includes(i));
  return [...primary, ...rest].slice(0, count).map((i) => order[i]);
}

/** Tavoli rotondi (o gruppi misti): si sceglie il gruppo di posti più compatto,
 *  attaccato ai posti già prenotati; se sono solo in due, si siedono uno di fronte all'altro. */
function selectByDistance(
  unit: TableData[],
  seats: SeatRef[],
  count: number,
): SeatRef[] {
  const free = seats.filter((s) => !s.booked);
  const booked = seats.filter((s) => s.booked);
  if (count === free.length) return free;

  const n = free.length;
  const D = free.map((a) => free.map((b) => seatDist(a, b, unit)));
  const start = [...seats].sort((a, b) => a.x - b.x || a.y - b.y)[0];
  const anchors = booked.length > 0 ? booked : [start];
  const attach = free.map((s) =>
    Math.min(...anchors.map((b) => seatDist(s, b, unit))),
  );

  const candidates: { set: number[]; spread: number }[] = [];

  if (count === 2)
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (isFacing(free[i], free[j], unit))
          candidates.push({ set: [i, j], spread: D[i][j] });

  // Nessuna coppia di fronte disponibile (o più di 2 persone): crescita greedy da ogni posto libero
  if (candidates.length === 0)
    for (let seed = 0; seed < n; seed++) {
      const inSet = free.map((_, i) => i === seed);
      const near = [...D[seed]];
      const set = [seed];
      let spread = 0;
      while (set.length < count) {
        let pick = -1;
        for (let i = 0; i < n; i++) {
          if (inSet[i]) continue;
          if (
            pick === -1 ||
            near[i] < near[pick] - EPS ||
            (Math.abs(near[i] - near[pick]) <= EPS && attach[i] < attach[pick])
          )
            pick = i;
        }
        spread += near[pick];
        inSet[pick] = true;
        set.push(pick);
        for (let i = 0; i < n; i++)
          if (!inSet[i]) near[i] = Math.min(near[i], D[pick][i]);
      }
      candidates.push({ set, spread });
    }

  const score = ({ set, spread }: { set: number[]; spread: number }) =>
    spread + ATTACH_WEIGHT * Math.min(...set.map((i) => attach[i]));
  const best = candidates.reduce((a, b) => (score(b) < score(a) - EPS ? b : a));
  return best.set.map((i) => free[i]);
}

/** Assegna la prenotazione ai posti scelti; i posti in `wheelchairSeats` sono per una carrozzina. */
export function applyBooking(
  tables: TableData[],
  seats: SeatRef[],
  booking: ChairBooking,
  wheelchairSeats: SeatRef[] = [],
): TableData[] {
  const has = (list: SeatRef[], tableId: string, i: number) =>
    list.some((s) => s.tableId === tableId && s.index === i);
  return tables.map((t) => {
    if (!seats.some((s) => s.tableId === t.id)) return t;
    return {
      ...t,
      chairs: t.chairs.map((c, i) =>
        has(seats, t.id, i)
          ? {
              ...c,
              booking: has(wheelchairSeats, t.id, i)
                ? { ...booking, wheelchair: true }
                : booking,
            }
          : c,
      ),
    };
  });
}

/** Libera tutti i posti di una prenotazione. */
export function cancelBooking(
  tables: TableData[],
  bookingId: string,
): TableData[] {
  return tables.map((t) =>
    t.chairs.some((c) => c.booking?.id === bookingId)
      ? {
          ...t,
          chairs: t.chairs.map((c) =>
            c.booking?.id === bookingId
              ? { side: c.side, offset: c.offset }
              : c,
          ),
        }
      : t,
  );
}

/** Segna i commensali di una prenotazione come arrivati e seduti (o annulla l'arrivo con undefined). */
export function setBookingSeated(
  tables: TableData[],
  bookingId: string,
  seatedAt: string | undefined,
): TableData[] {
  return tables.map((t) =>
    t.chairs.some((c) => c.booking?.id === bookingId)
      ? {
          ...t,
          chairs: t.chairs.map((c) =>
            c.booking?.id === bookingId
              ? { ...c, booking: { ...c.booking, seatedAt } }
              : c,
          ),
        }
      : t,
  );
}

/** Orario di arrivo in formato HH:MM. */
export function formatSeatedTime(seatedAt: string) {
  return new Date(seatedAt).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Prossimi arrivi previsti sul tavolo: orari delle prenotazioni non ancora sedute, in ordine. */
export function expectedArrivals(table: TableData) {
  const times = new Set<string>();
  for (const c of table.chairs)
    if (c.booking?.arrivalTime && !c.booking.seatedAt)
      times.add(c.booking.arrivalTime);
  return [...times].sort();
}

/** Vero se la prenotazione è sistemata in piantina (almeno un posto con il suo id). */
export function isPlaced(tables: TableData[], bookingId: string) {
  return tables.some((t) => t.chairs.some((c) => c.booking?.id === bookingId));
}

/** Tavoli su cui è sistemata la prenotazione. */
export function placedTables(tables: TableData[], bookingId: string) {
  return tables.filter((t) =>
    t.chairs.some((c) => c.booking?.id === bookingId),
  );
}

/** Aggiorna nome e orario di arrivo sui posti della prenotazione. */
export function updateBookingDetails(
  tables: TableData[],
  bookingId: string,
  changes: Pick<ChairBooking, "name" | "arrivalTime">,
): TableData[] {
  return tables.map((t) =>
    t.chairs.some((c) => c.booking?.id === bookingId)
      ? {
          ...t,
          chairs: t.chairs.map((c) =>
            c.booking?.id === bookingId
              ? { ...c, booking: { ...c.booking, ...changes } }
              : c,
          ),
        }
      : t,
  );
}

/** Ordine dei posti di un'unità: in fila per i rettangolari, attorno al tavolo (circolare) per gli altri. */
function seatOrder(unit: TableData[], seats: SeatRef[]) {
  if (isRectUnit(unit))
    return { order: rowOrder(unit, seats).order, cyclic: false };
  const cx = seats.reduce((s, p) => s + p.x, 0) / seats.length;
  const cy = seats.reduce((s, p) => s + p.y, 0) / seats.length;
  const angle = (p: SeatRef) => Math.atan2(p.y - cy, p.x - cx);
  return {
    order: [...seats].sort((a, b) => angle(a) - angle(b)),
    cyclic: true,
  };
}

/** Porta a `people` i posti in piantina di una prenotazione già sistemata.
 *  Se aumentano si usano i posti liberi consecutivi ai suoi (prima dopo, poi prima);
 *  se non bastano la prenotazione viene tolta dalla piantina (removed = true) e va sistemata di nuovo.
 *  Se diminuiscono si liberano gli ultimi posti in fila. */
export function resizeBookingOnMap(
  tables: TableData[],
  bookingId: string,
  people: number,
): { tables: TableData[]; removed: boolean } {
  const first = tables.find((t) =>
    t.chairs.some((c) => c.booking?.id === bookingId),
  );
  if (!first) return { tables, removed: false };
  const unit = getUnit(first, tables);
  const chairOf = (s: SeatRef) =>
    unit.find((t) => t.id === s.tableId)!.chairs[s.index];
  const { order, cyclic } = seatOrder(unit, unitSeats(unit));
  const mine = order.flatMap((s, i) =>
    chairOf(s).booking?.id === bookingId ? [i] : [],
  );
  const diff = people - mine.length;
  if (diff === 0) return { tables, removed: false };

  if (diff < 0) {
    const release = mine.slice(diff).map((i) => order[i]);
    return {
      tables: tables.map((t) =>
        release.some((s) => s.tableId === t.id)
          ? {
              ...t,
              chairs: t.chairs.map((c, i) =>
                release.some((s) => s.tableId === t.id && s.index === i)
                  ? { side: c.side, offset: c.offset }
                  : c,
              ),
            }
          : t,
      ),
      removed: false,
    };
  }

  //Posti liberi consecutivi dopo l'ultimo e prima del primo posto della prenotazione
  const n = order.length;
  const step = (i: number, d: 1 | -1) => {
    const j = i + d;
    if (cyclic) return (j + n) % n;
    return j >= 0 && j < n ? j : -1;
  };
  const extra: number[] = [];
  for (const [from, d] of [
    [mine[mine.length - 1], 1],
    [mine[0], -1],
  ] as const) {
    let i = step(from, d);
    while (
      i !== -1 &&
      extra.length < diff &&
      !order[i].booked &&
      !extra.includes(i)
    ) {
      extra.push(i);
      i = step(i, d);
    }
  }
  if (extra.length < diff)
    return { tables: cancelBooking(tables, bookingId), removed: true };

  const base = chairOf(order[mine[0]]).booking!;
  const booking: ChairBooking = {
    id: base.id,
    name: base.name,
    seatedAt: base.seatedAt,
    arrivalTime: base.arrivalTime,
  };
  return {
    tables: applyBooking(
      tables,
      extra.map((i) => order[i]),
      booking,
    ),
    removed: false,
  };
}
