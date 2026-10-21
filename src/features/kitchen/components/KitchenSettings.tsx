import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { SettingSwitch } from "../../../components/SettingSwitch";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import {
  STATION_NAME_MAX,
  type KitchenStation,
  type RestaurantProfileUpdate,
} from "../../restaurant/types/restaurant";
import { kitchenSettingsError, newStationId } from "../utils/kitchenSettings";

interface KitchenSettingsProps {
  dispatch: boolean;
  stations: KitchenStation[];
  isEditMode: boolean;
  onChange: (changes: RestaurantProfileUpdate) => void;
}

//Come lavora la cucina: tutti vedono tutte le comande, oppure arrivano al capo cucina che
//le manda alle postazioni decise dal ristoratore (es. Primi, Griglia, Bar)
export const KitchenSettings = ({
  dispatch,
  stations,
  isEditMode,
  onChange,
}: KitchenSettingsProps) => {
  const error = kitchenSettingsError(dispatch, stations);
  const setStations = (next: KitchenStation[]) =>
    onChange({ kitchenStations: next });

  return (
    <div className="flex flex-col gap-3">
      <SettingSwitch
        label="Smistamento delle comande"
        description={
          dispatch
            ? "Le comande arrivano al capo cucina, che le manda alle postazioni"
            : "Chi è in cucina vede tutte le comande"
        }
        value={dispatch}
        isEditMode={isEditMode}
        onChange={(value) => onChange({ kitchenDispatch: value })}
      />

      {dispatch &&
        (isEditMode ? (
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
              label={
                <span className="text-sm ml-1.5">Aggiungi postazione</span>
              }
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
        ) : (
          <div className="flex flex-wrap gap-2">
            {stations.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "px-3 py-1 text-sm font-semibold",
                  ThemeVariants.borderRadius.full,
                  ThemeVariants.colors.border.all.brand,
                )}
              >
                {s.name}
              </span>
            ))}
          </div>
        ))}

      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        {dispatch
          ? "Il capo cucina vede quante comande ha ogni postazione; ogni postazione vede le sue, da chi ha ordinato per primo."
          : "Attivalo se una persona deve dividere il lavoro tra più postazioni."}
      </p>
    </div>
  );
};
