import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { PickupMode } from "../types/orders";
import {
  useSaveTakeawaySettings,
  useTakeawaySettings,
} from "../hook/useOrders";

//Impostazione dell'orario di ritiro dell'asporto: unico per tutti o scelto dal cliente
export const TakeawaySettingsBox = () => {
  const { data: settings } = useTakeawaySettings();
  const { mutate: save } = useSaveTakeawaySettings();

  if (!settings) return null;
  const isFixed = settings.mode === PickupMode.Fixed;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          label={<span className="text-sm">Unico</span>}
          onClick={() => save({ ...settings, mode: PickupMode.Fixed })}
          dimension={ButtonDimensions.auto}
          variant={isFixed ? "primary" : "secondary"}
          className="px-3 py-2"
        />
        <Button
          label={<span className="text-sm">Scelto dal cliente</span>}
          onClick={() => save({ ...settings, mode: PickupMode.Custom })}
          dimension={ButtonDimensions.auto}
          variant={isFixed ? "secondary" : "primary"}
          className="px-3 py-2"
        />
      </div>
      {isFixed ? (
        <div className="flex items-center gap-2">
          <span className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
            Tutti ritirano alle
          </span>
          <Input
            type="time"
            placeholder="19:30"
            value={settings.fixedTime}
            setValue={(fixedTime) =>
              fixedTime && save({ ...settings, fixedTime })
            }
            variant="secondary"
            className="w-28 text-sm py-1"
            ariaLabel="Orario unico di ritiro"
          />
        </div>
      ) : (
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          Il cliente sceglie l'orario quando ordina
        </p>
      )}
    </div>
  );
};
