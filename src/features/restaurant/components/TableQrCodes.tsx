import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { useFloorPlan } from "../../floorPlan/hook/useFloorPlan";
import { tableNames } from "../../floorPlan/helpers/tableNames";
import { tableQrUrl } from "../../orders/utils/tableQr";
import { QrCode } from "./QrCode";

//QR code da mettere sui tavoli, uno per tavolo della piantina: inquadrandolo il cliente apre
//il sito con il tavolo già indicato. Stampa prepara un foglio con solo i QR code
export const TableQrCodes = ({
  restaurantName,
}: {
  restaurantName?: string;
}) => {
  const { data: plan, isLoading, isError } = useFloorPlan();
  const tables = tableNames(plan);
  const secondary = `text-sm ${ThemeVariants.colors.text.secondary}`;

  if (isLoading) return <p className={secondary}>Caricamento dei tavoli…</p>;
  if (isError)
    return (
      <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
        Errore nel caricamento dei tavoli
      </p>
    );
  if (tables.length === 0)
    return (
      <p className={secondary}>
        Nessun tavolo con un nome: aggiungili nella Piantina per avere i loro QR
        code.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={secondary}>
          {tables.length === 1
            ? "1 tavolo nella piantina"
            : `${tables.length} tavoli nella piantina`}
        </p>
        <Button
          iconLeft={<Printer size={15} />}
          label={<span className="text-sm ml-1.5">Stampa</span>}
          onClick={() => window.print()}
          dimension={ButtonDimensions.auto}
          variant="primary"
          className="px-3 py-2"
        />
      </div>
      <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {tables.map((t) => (
          <li key={t} className="flex flex-col items-center gap-1">
            <QrCode
              value={tableQrUrl(t)}
              label={`QR code del tavolo ${t}`}
              className="w-full max-w-28 rounded"
            />
            <span className="text-sm font-semibold [overflow-wrap:anywhere]">
              {t}
            </span>
          </li>
        ))}
      </ul>

      {/* Foglio da stampare, fuori dall'app: in stampa si vede solo questo (vedi index.css) */}
      {createPortal(
        <div className="print-sheet hidden print:grid grid-cols-2 gap-x-10 gap-y-12 p-4 text-black bg-white">
          {tables.map((t) => (
            <div
              key={t}
              className="flex flex-col items-center gap-2 text-center break-inside-avoid"
            >
              {restaurantName && <p className="text-lg">{restaurantName}</p>}
              <p className="text-3xl font-bold">Tavolo {t}</p>
              <QrCode
                value={tableQrUrl(t)}
                label={`QR code del tavolo ${t}`}
                className="w-56 h-56"
              />
              <p className="text-base">Inquadra il codice per ordinare</p>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};
