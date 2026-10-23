import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { ChoiceList, type Choice } from "../../../components/ChoiceList";
import {
  SettingsSummary,
  SummaryItem,
} from "../../../components/SettingsSummary";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import {
  STATION_NAME_MAX,
  type KitchenStation,
  type RestaurantProfileUpdate,
} from "../../restaurant/types/restaurant";
import { kitchenSettingsError, newStationId } from "../utils/kitchenSettings";

//Come si divide il lavoro in cucina (kitchenDispatch false / true)
const KitchenWork = { Tickets: "tickets", App: "app" } as const;
type KitchenWorkConst = (typeof KitchenWork)[keyof typeof KitchenWork];

const KITCHEN_WORK: Choice<KitchenWorkConst>[] = [
  {
    value: KitchenWork.Tickets,
    label: "Con i bigliettini",
    description:
      "Il lavoro tra le postazioni si divide a mano, con i bigliettini: in Cucina si vedono tutte le comande e si segna pronto l'ordine intero. Il capo cucina non serve",
  },
  {
    value: KitchenWork.App,
    label: "Smistamento dall'app",
    description:
      "Le comande arrivano al capo cucina, che le manda alle postazioni (es. Primi, Griglia, Bar): ogni postazione vede le sue e il capo cucina il carico di ognuna",
  },
];

interface KitchenSettingsProps {
  dispatch: boolean;
  stations: KitchenStation[];
  isEditMode: boolean;
  onChange: (changes: RestaurantProfileUpdate) => void;
}

//Come lavora la cucina: con i bigliettini (tutti vedono tutte le comande e il lavoro si divide
//a mano) oppure con lo smistamento dall'app alle postazioni decise dal ristoratore
export const KitchenSettings = ({
  dispatch,
  stations,
  isEditMode,
  onChange,
}: KitchenSettingsProps) => {
  const error = kitchenSettingsError(dispatch, stations);
  const setStations = (next: KitchenStation[]) =>
    onChange({ kitchenStations: next });

  if (!isEditMode)
    return (
      <SettingsSummary>
        <SummaryItem label="Comande">
          {dispatch ? "Smistate dall'app" : "Con i bigliettini"}
        </SummaryItem>
        {dispatch && (
          <SummaryItem label="Postazioni">
            <span className="flex flex-wrap justify-end gap-1.5">
              {stations.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    "px-2.5 py-0.5",
                    ThemeVariants.borderRadius.full,
                    ThemeVariants.colors.border.all.brand,
                  )}
                >
                  {s.name}
                </span>
              ))}
            </span>
          </SummaryItem>
        )}
      </SettingsSummary>
    );

  return (
    <div className="flex flex-col gap-3">
      <ChoiceList
        label="Come si divide il lavoro in cucina"
        choices={KITCHEN_WORK}
        value={dispatch ? KitchenWork.App : KitchenWork.Tickets}
        onChange={(value) =>
          onChange({ kitchenDispatch: value === KitchenWork.App })
        }
      />

      {dispatch && (
        <>
          <p className="text-sm font-semibold">Postazioni</p>
          <ul className="flex flex-col gap-2">
            {stations.map((s, i) => (
              <li key={s.id} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Es. Griglia"
                  value={s.name}
                  setValue={(name) =>
                    setStations(
                      stations.map((x, j) => (j === i ? { ...x, name } : x)),
                    )
                  }
                  maxLength={STATION_NAME_MAX}
                  variant="secondary"
                  className="flex-1 text-sm"
                  ariaLabel={`Nome della postazione ${i + 1}`}
                />
                <Button
                  iconLeft={
                    <Trash2
                      size={15}
                      className={ThemeVariants.colors.text.danger}
                    />
                  }
                  onClick={() =>
                    setStations(stations.filter((_, j) => j !== i))
                  }
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  className="w-10 shrink-0"
                  ariaLabel={`Elimina la postazione ${s.name || i + 1}`}
                />
              </li>
            ))}
          </ul>
          <Button
            iconLeft={<Plus size={15} />}
            label={<span className="text-sm ml-1.5">Aggiungi postazione</span>}
            onClick={() =>
              setStations([...stations, { id: newStationId(), name: "" }])
            }
            dimension={ButtonDimensions.auto}
            variant="secondary"
            className="px-3 py-2 self-start"
          />
          {error && (
            <p
              role="alert"
              className={`text-sm ${ThemeVariants.colors.text.danger}`}
            >
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
};
