import { ThemeVariants } from "../../../../constant/colors";
import { cn } from "../../../../helpers/cn";
import { PaperTicket } from "./PaperTicket";

//Dati d'esempio delle anteprime: solo da guardare
const DISHES = [
  { name: "Bigoli al ragù d'anatra", price: "8,00" },
  { name: "Grigliata mista", price: "12,00" },
  { name: "Patatine fritte", price: "3,50" },
];
const READY = [112, 109, 108];
const PREPARING = [113, 114, 115, 116];
const KITCHEN = [
  {
    number: 113,
    lines: ["2 × Bigoli al ragù", "1 × Patatine"],
    minutes: "04:12",
  },
  { number: 114, lines: ["3 × Grigliata mista"], minutes: "01:38" },
];

//Telefono del cliente col menù
const PhonePreview = () => (
  <div
    className={cn(
      "w-full max-w-[200px] p-2 border-4 border-[var(--text-primary)] rounded-[28px]",
      ThemeVariants.colors.bg.surface,
    )}
  >
    <div className="flex flex-col gap-2 px-2 pt-3 pb-4">
      <span
        className={cn(
          "text-lg leading-tight",
          ThemeVariants.colors.text.brand,
          ThemeVariants.fontFamily.display,
        )}
      >
        Sagra del Pesce
      </span>
      {DISHES.map((d) => (
        <div
          key={d.name}
          className={cn(
            "flex flex-col gap-1 p-2 text-xs",
            ThemeVariants.colors.bg.base,
            ThemeVariants.borderRadius.sm,
          )}
        >
          <span className="font-semibold leading-snug">{d.name}</span>
          <span className="flex items-center justify-between">
            <span className={ThemeVariants.colors.text.secondary}>
              €{d.price}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 font-bold",
                ThemeVariants.colors.bg.brand,
                ThemeVariants.colors.text.white,
                ThemeVariants.borderRadius.sm,
              )}
            >
              Aggiungi
            </span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

//Schermo "Pronti" sulla TV vicino al banco
const PickupBoardPreview = () => (
  <div
    className={cn(
      "w-full p-4 sm:p-5 text-[var(--text-inverse)]",
      ThemeVariants.colors.bg.white,
      ThemeVariants.borderRadius.lg,
    )}
  >
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-semibold">Pronti</span>
      <span className="text-sm tabular-nums opacity-70">20:41</span>
    </div>
    <div className="mt-2 flex flex-wrap items-baseline gap-x-4">
      {READY.map((n, i) => (
        <span
          key={n}
          className={cn(
            "tabular-nums leading-none",
            ThemeVariants.fontFamily.display,
            i === 0
              ? `text-6xl sm:text-7xl ${ThemeVariants.colors.text.brand}`
              : "text-3xl sm:text-4xl opacity-80",
          )}
        >
          {n}
        </span>
      ))}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-70">
      <span>In preparazione</span>
      {PREPARING.map((n) => (
        <span key={n} className="tabular-nums">
          {n}
        </span>
      ))}
    </div>
  </div>
);

//Comande sullo schermo della cucina, col tempo di attesa
const KitchenPreview = () => (
  <div className="flex flex-col gap-2">
    {KITCHEN.map((k) => (
      <div
        key={k.number}
        className={cn(
          "flex flex-col gap-1 p-3 text-xs",
          ThemeVariants.colors.bg.surface,
          ThemeVariants.colors.border.all.default,
          ThemeVariants.borderRadius.md,
        )}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "text-xl leading-none",
              ThemeVariants.fontFamily.display,
            )}
          >
            N. {k.number}
          </span>
          <span
            className={cn(
              "tabular-nums font-semibold",
              ThemeVariants.colors.text.success,
            )}
          >
            {k.minutes}
          </span>
        </span>
        {k.lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    ))}
  </div>
);

//Anteprime dell'app nella prima schermata: lo schermo Pronti in alto, sotto il telefono
//del cliente, il bigliettino della cassa e la cucina. Disegnate in HTML, nessuna immagine
export const AppPreviews = () => (
  <div aria-hidden className="flex flex-col gap-4 select-none">
    <PickupBoardPreview />
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
      <PhonePreview />
      <div className="flex flex-col gap-4">
        <PaperTicket className="-rotate-2 text-center">
          <span
            className={cn("block text-xs", ThemeVariants.colors.text.secondary)}
          >
            Ordine
          </span>
          <span
            className={cn(
              "block text-5xl leading-none tabular-nums",
              ThemeVariants.fontFamily.display,
            )}
          >
            113
          </span>
          <span
            className={cn(
              "block mt-2 text-xs",
              ThemeVariants.colors.text.secondary,
            )}
          >
            Pagato · €19,50
          </span>
        </PaperTicket>
        <div className="hidden sm:block">
          <KitchenPreview />
        </div>
      </div>
    </div>
  </div>
);
