import { Spinner } from "../components/core/Spinner";
import { useEffect } from "react";
import { usePickupBoard } from "../features/orders/hook/useOrders";
import { useRestaurant } from "../features/restaurant/hook/useRestaurant";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { ThemeVariants } from "../constant/colors";
import { cn } from "../helpers/cn";

//Quanti numeri stanno sullo schermo (i più vecchi in preparazione, i più recenti pronti)
const MAX_PREPARING = 30;
const MAX_READY = 18;

//Lo schermo resta acceso finché la pagina è aperta (dove il browser lo permette)
const useKeepScreenOn = () => {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () =>
      navigator.wakeLock
        ?.request("screen")
        .then((l) => (lock = l))
        .catch(() => {
          // non supportato o negato: lo schermo seguirà le impostazioni del dispositivo
        });
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release();
    };
  }, []);
};

//Schermo "Pronti" da aprire su una TV o un monitor vicino al banco: i numeri pronti da ritirare
//(l'ultimo in evidenza) e quelli in preparazione. Pubblico, mostra solo i numeri, si aggiorna da solo
export const PickupScreen = () => {
  const { data: restaurant } = useRestaurant();
  const { data: board, isLoading, isError } = usePickupBoard();
  const now = useCurrentTime();
  useKeepScreenOn();

  const ready = board?.ready.slice(0, MAX_READY) ?? [];
  const preparing = board?.preparing.slice(0, MAX_PREPARING) ?? [];

  return (
    <div
      className={`h-dvh flex flex-col gap-4 lg:gap-8 p-5 lg:p-10 overflow-hidden ${ThemeVariants.colors.bg.base}`}
    >
      <header className="flex items-baseline justify-between gap-4 shrink-0">
        <h1
          className={`text-3xl lg:text-5xl italic truncate ${ThemeVariants.colors.text.brand} ${ThemeVariants.fontFamily.display}`}
        >
          {restaurant?.name}
        </h1>
        <span className="text-2xl lg:text-4xl font-bold tabular-nums">
          {now}
        </span>
      </header>

      {isLoading ? (
        <Spinner size={48} className="flex-1 items-center py-0" />
      ) : isError || !board ? (
        <p
          className={`flex-1 flex items-center justify-center text-center text-2xl ${ThemeVariants.colors.text.secondary}`}
        >
          Lo schermo Pronti non è attivo: si usa col ritiro al banco
        </p>
      ) : (
        <main className="flex-1 min-h-0 grid gap-6 lg:gap-10 lg:grid-cols-[1fr_2fr]">
          <section className="flex flex-col gap-3 min-h-0 overflow-hidden">
            <h2
              className={`text-xl lg:text-3xl 2xl:text-4xl font-bold uppercase ${ThemeVariants.colors.text.secondary}`}
            >
              In preparazione
            </h2>
            <ul className="flex flex-wrap content-start gap-2 lg:gap-3">
              {preparing.map((n) => (
                <li
                  key={n}
                  className={cn(
                    "min-w-16 lg:min-w-24 px-3 py-1 text-center text-3xl lg:text-5xl 2xl:text-6xl font-bold tabular-nums",
                    ThemeVariants.borderRadius.md,
                    ThemeVariants.colors.border.all.default,
                    ThemeVariants.colors.text.secondary,
                  )}
                >
                  {n}
                </li>
              ))}
            </ul>
          </section>

          {/* Sul telefono i pronti stanno sopra: sono quelli che interessano */}
          <section className="flex flex-col gap-3 min-h-0 overflow-hidden max-lg:order-first">
            <h2
              className={`text-xl lg:text-3xl 2xl:text-4xl font-bold uppercase ${ThemeVariants.colors.text.success}`}
            >
              Pronti · ritira al banco
            </h2>
            {ready.length === 0 ? (
              <p
                className={`text-2xl lg:text-3xl ${ThemeVariants.colors.text.secondary}`}
              >
                Nessun ordine pronto
              </p>
            ) : (
              <ul
                aria-live="polite"
                className="flex flex-wrap content-start gap-3 lg:gap-4"
              >
                {ready.map((n, i) => (
                  <li
                    key={n}
                    className={cn(
                      "min-w-24 lg:min-w-40 px-4 py-2 text-center font-bold tabular-nums",
                      ThemeVariants.borderRadius.lg,
                      //l'ultimo pronto in evidenza, perché lo si noti (senza lampeggiare: si legge meglio)
                      i === 0
                        ? `text-6xl lg:text-9xl 2xl:text-[11rem] ${ThemeVariants.colors.bg.brand} text-white`
                        : `text-5xl lg:text-8xl 2xl:text-9xl ${ThemeVariants.colors.border.all.success}`,
                    )}
                  >
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}
    </div>
  );
};
