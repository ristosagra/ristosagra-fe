import { useState } from "react";
import { ChefHat, PartyPopper, Smartphone } from "lucide-react";
import { KitchenSettings } from "../../../features/kitchen/components/KitchenSettings";
import { kitchenSettingsError } from "../../../features/kitchen/utils/kitchenSettings";
import {
  useSaveTakeawaySettings,
  useTakeawaySettings,
} from "../../../features/orders/hook/useOrders";
import { OrderingSettings } from "../../../features/restaurant/components/OrderingSettings";
import { PresetSettings } from "../../../features/restaurant/components/PresetSettings";
import { useRestaurantDraft } from "../../../features/restaurant/hook/useRestaurantDraft";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import { ProfileSection, SettingsCard } from "./ProfileSection";

//Sezione del profilo: come funziona la festa (un modo già pronto o scelte fatte a mano), come
//ordinano e pagano i clienti, come arriva loro l'ordine, come lavora la cucina (bigliettini o
//smistamento dall'app alle postazioni) e se c'è l'asporto, che un modo già pronto decide
//(gli orari di ritiro restano in Orari e asporto)
export const OrdersSection = ({ onBack }: { onBack: () => void }) => {
  const restaurant = useRestaurantDraft();
  const { profile, draft } = restaurant;
  const { data: takeaway } = useTakeawaySettings();
  const { mutateAsync: saveTakeaway } = useSaveTakeawaySettings();
  //asporto attivo o no, se cambiato in questa sezione
  const [takeawayDraft, setTakeawayDraft] = useState<boolean | null>(null);
  const takeawayEnabled = takeawayDraft ?? !!takeaway?.enabled;

  const edit = useSectionEdit(
    [
      {
        label: "ordini e cucina",
        dirty: restaurant.isDirty,
        run: restaurant.save,
      },
      {
        label: "asporto",
        dirty: !!takeaway && takeawayEnabled !== takeaway.enabled,
        run: async () => {
          if (!takeaway) return;
          await saveTakeaway({ ...takeaway, enabled: takeawayEnabled });
          setTakeawayDraft(null);
        },
      },
    ],
    () => {
      restaurant.reset();
      setTakeawayDraft(null);
    },
  );

  const kitchenDirty =
    draft.kitchenDispatch !== undefined || draft.kitchenStations !== undefined;
  const kitchenError =
    kitchenDirty &&
    profile &&
    kitchenSettingsError(
      profile.kitchenDispatch,
      profile.kitchenStations ?? [],
    );

  return (
    <ProfileSection
      icon={<Smartphone size={22} />}
      title="Ordini e cucina"
      onBack={onBack}
      edit={edit}
      canEdit={!!profile && !!takeaway}
      saveError={kitchenError ? "Postazioni della cucina da correggere" : null}
    >
      <SettingsCard
        icon={<PartyPopper size={15} />}
        title="Come funziona la tua festa?"
      >
        {profile && takeaway && (
          <PresetSettings
            profile={profile}
            takeawayEnabled={takeawayEnabled}
            isEditMode={edit.isEditMode}
            onApply={(preset) => {
              restaurant.edit(preset.settings);
              setTakeawayDraft(preset.takeaway);
            }}
            onTakeawayChange={setTakeawayDraft}
          />
        )}
      </SettingsCard>
      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <SettingsCard
          icon={<Smartphone size={15} />}
          title="Ordini dei clienti"
        >
          {profile && (
            <OrderingSettings
              settings={profile}
              isEditMode={edit.isEditMode}
              onChange={restaurant.edit}
            />
          )}
        </SettingsCard>
        <SettingsCard icon={<ChefHat size={15} />} title="Cucina">
          {profile && (
            <KitchenSettings
              dispatch={!!profile.kitchenDispatch}
              stations={profile.kitchenStations ?? []}
              isEditMode={edit.isEditMode}
              onChange={restaurant.edit}
            />
          )}
        </SettingsCard>
      </div>
    </ProfileSection>
  );
};
