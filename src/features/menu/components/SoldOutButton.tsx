import { useState } from "react";
import { PackageX } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Modal } from "../../../components/core/Modal";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { useNotification } from "../../../hooks/useNotification";
import type { Dish } from "../../../types/menuOrder";
import { NotificationType } from "../../../types/notification";
import { useMenu, useSetSoldOut } from "../hook/useMenu";
import { groupDishesByCategory } from "../utils/menuUtils";

//Un piatto: un tocco lo segna esaurito, un altro lo rimette disponibile
const SoldOutRow = ({ dish }: { dish: Dish }) => {
  const { mutate: setSoldOut } = useSetSoldOut();
  const showNotification = useNotification();
  const soldOut = !!dish.soldOut;

  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={soldOut}
        onClick={() =>
          setSoldOut(
            { id: dish.id, soldOut: !soldOut },
            {
              onError: () =>
                showNotification(
                  `Errore: ${dish.name} non è stato salvato`,
                  NotificationType.Err,
                ),
            },
          )
        }
        className={cn(
          "w-full min-h-12 flex items-center justify-between gap-3 px-3 py-2 text-left text-white cursor-pointer",
          ThemeVariants.borderRadius.md,
          soldOut
            ? ThemeVariants.colors.border.all.danger
            : "border border-neutral-700",
        )}
      >
        <span
          className={cn(
            "min-w-0 font-semibold [overflow-wrap:anywhere]",
            soldOut && "line-through opacity-70",
          )}
        >
          {dish.name}
        </span>
        <span
          className={cn(
            "shrink-0 px-2.5 py-1 text-xs font-bold",
            ThemeVariants.borderRadius.full,
            soldOut
              ? "bg-[var(--danger)] text-white"
              : `${ThemeVariants.colors.border.all.success} ${ThemeVariants.colors.text.success}`,
          )}
        >
          {soldOut ? "Esaurito" : "Disponibile"}
        </span>
      </button>
    </li>
  );
};

//Piatti esauriti durante il servizio (cassa, capo cucina, titolare e vice): il pulsante dice
//quanti sono e apre l'elenco dei piatti di oggi, dove un tocco li segna finiti o di nuovo
//disponibili. Clienti e cassa non possono più ordinarli; il giorno dopo tornano disponibili
export const SoldOutButton = () => {
  const [open, setOpen] = useState(false);
  const { data: menu = [] } = useMenu();
  const count = menu.filter((d) => d.soldOut).length;

  return (
    <>
      <Button
        iconLeft={<PackageX size={16} />}
        label={
          <span className="text-sm ml-1.5">
            {count > 0 ? `Esauriti · ${count}` : "Esauriti"}
          </span>
        }
        onClick={() => setOpen(true)}
        dimension={ButtonDimensions.auto}
        variant="secondary"
        className={cn(
          "h-10 px-3 shrink-0",
          count > 0 && ThemeVariants.colors.border.all.danger,
        )}
      />
      {open && (
        <Modal
          icon={<PackageX size={20} className="text-white" />}
          title="Piatti esauriti oggi"
          subTitle={
            <p className="text-sm text-neutral-400">
              Tocca un piatto finito: clienti e cassa non possono più ordinarlo.
              Domani torna disponibile da solo.
            </p>
          }
          onClose={() => setOpen(false)}
        >
          {menu.length === 0 ? (
            <p className="text-sm text-neutral-400">Nessun piatto oggi.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(groupDishesByCategory(menu)).map(
                ([category, dishes]) => (
                  <section key={category} className="flex flex-col gap-2">
                    <h3 className="text-xs font-semibold uppercase text-neutral-400">
                      {category}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {dishes.map((d) => (
                        <SoldOutRow key={d.id} dish={d} />
                      ))}
                    </ul>
                  </section>
                ),
              )}
            </div>
          )}
          <div className="flex justify-end mt-5">
            <Button
              label={<span className="text-sm">Fatto</span>}
              onClick={() => setOpen(false)}
              dimension={ButtonDimensions.auto}
              variant="primary"
              className="h-10 px-4"
            />
          </div>
        </Modal>
      )}
    </>
  );
};
