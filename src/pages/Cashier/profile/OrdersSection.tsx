import { ChefHat, Smartphone } from "lucide-react";
import { KitchenSettings } from "../../../features/kitchen/components/KitchenSettings";
import { kitchenSettingsError } from "../../../features/kitchen/utils/kitchenSettings";
import { OrderingSettings } from "../../../features/restaurant/components/OrderingSettings";
import { useRestaurantDraft } from "../../../features/restaurant/hook/useRestaurantDraft";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import { ProfileSection, SettingsCard } from "./ProfileSection";

//Sezione del profilo: come ordinano e pagano i clienti, come arriva loro l'ordine e come
//lavora la cucina (bigliettini o smistamento dall'app alle postazioni)
export const OrdersSection = ({ onBack }: { onBack: () => void }) => {
  const restaurant = useRestaurantDraft();
  const { profile, draft } = restaurant;
  const edit = useSectionEdit(
    [
      {
        label: "ordini e cucina",
        dirty: restaurant.isDirty,
        run: restaurant.save,
      },
    ],
    restaurant.reset,
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
      canEdit={!!profile}
      saveError={kitchenError ? "Postazioni della cucina da correggere" : null}
    >
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
