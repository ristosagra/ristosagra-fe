import {
  PLAN_MIN_SEATS,
  TableShape,
  type HeadsConst,
} from "../constant/floorPlan";
import type { TableData, WallData } from "../types/floorPlan";
import {
  addChair,
  defaultChairs,
  removeChair,
  resizeTable,
  rotateTable,
} from "../helpers/chair";
import { tableHeads } from "../helpers/dimensions";
import { hasCollision } from "../helpers/collision";
import { getUnit, hasBookings } from "../helpers/booking";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";

interface UseTableEditorProps {
  tables: TableData[];
  walls: WallData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
}

//Azioni di modifica di un singolo tavolo (nome, posti, capotavola, rotazione),
//condivise tra il footer e la barra laterale in modalità "Sposta"
export const useTableEditor = ({
  tables,
  walls,
  setTables,
}: UseTableEditorProps) => {
  const showNotification = useNotification();

  const updateTable = (id: string, fn: (t: TableData) => TableData) =>
    setTables((p) => p.map((tt) => (tt.id === id ? fn(tt) : tt)));

  //posti del tavolo (o del suo gruppo) già prenotati: non si possono rigenerare le sedie
  const isLocked = (t: TableData) => hasBookings(getUnit(t, tables));

  const notifyLocked = () =>
    showNotification(
      "🔒 Libera i posti prenotati per modificarli",
      NotificationType.Err,
    );

  const rename = (t: TableData, name: string) =>
    updateTable(t.id, (tt) => ({ ...tt, name }));

  //Modifica i posti di un tavolo. Un tavolo non agganciato ad altri viene ridimensionato
  //(cresce o diminuisce in base ai posti); uno agganciato mantiene la sua grandezza
  //e aggiunge/toglie sedie solo dove c'è spazio, per non staccarsi dal gruppo.
  const editChairs = (t: TableData, delta: 1 | -1) => {
    if (isLocked(t)) return notifyLocked();
    if (t.blockedSides.length > 0) {
      updateTable(t.id, (tt) => (delta === 1 ? addChair(tt) : removeChair(tt)));
      return;
    }
    const size = t.chairs.length + delta;
    if (size < PLAN_MIN_SEATS) return;
    if (
      delta === 1 &&
      hasCollision(t.x, t.y, { ...t, size }, tables, walls, [t.id])
    ) {
      showNotification(
        "❌ Spazio insufficiente per ingrandire il tavolo",
        NotificationType.Err,
      );
      return;
    }
    updateTable(t.id, (tt) => resizeTable(tt, size));
  };

  //Aggiunge o toglie i capotavola: ogni capotavola è un posto in più (o in meno)
  //sulle testate, i lati lunghi e la grandezza del tavolo restano uguali
  const setHeads = (t: TableData, heads: HeadsConst) => {
    if (t.shape !== TableShape.Rect || heads === tableHeads(t)) return;
    if (isLocked(t)) return notifyLocked();
    if (t.blockedSides.length > 0) {
      showNotification(
        "🔗 Separa il gruppo per cambiare i capotavola",
        NotificationType.Err,
      );
      return;
    }
    const size = t.size - tableHeads(t) + heads;
    if (size < PLAN_MIN_SEATS) {
      showNotification(
        `❌ Il tavolo deve avere almeno ${PLAN_MIN_SEATS} posti`,
        NotificationType.Err,
      );
      return;
    }
    // l'ingombro non cambia (le colonne restano le stesse), quindi non serve controllare le collisioni
    const next = { ...t, size, heads };
    updateTable(t.id, () => ({ ...next, chairs: defaultChairs(next) }));
  };

  //Ruota il tavolo di 90°. Non si può ruotare un tavolo agganciato ad altri
  //perché si staccherebbe dal gruppo.
  const rotate = (t: TableData) => {
    if (t.blockedSides.length > 0) {
      showNotification(
        "🔗 Separa il gruppo per ruotare il tavolo",
        NotificationType.Err,
      );
      return;
    }
    const rotated = rotateTable(t);
    if (hasCollision(t.x, t.y, rotated, tables, walls, [t.id])) {
      showNotification(
        "❌ Spazio insufficiente per ruotare il tavolo",
        NotificationType.Err,
      );
      return;
    }
    updateTable(t.id, () => rotated);
  };

  return { isLocked, rename, editChairs, setHeads, rotate };
};
