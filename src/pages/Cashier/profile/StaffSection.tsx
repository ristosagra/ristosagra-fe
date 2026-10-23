import { Users } from "lucide-react";
import { StaffSettings } from "../../../features/staff/components/StaffSettings";
import { useStaffDraft } from "../../../features/staff/hook/useStaffDraft";
import { useCurrentUser } from "../../../hooks/useAuth";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import { ProfileSection, SettingsCard } from "./ProfileSection";

//Sezione del profilo: il personale. Come le altre si parte in lettura; con Modifica si
//aggiungono, cambiano ed eliminano persone, salvate tutte insieme con Salva
export const StaffSection = ({ onBack }: { onBack: () => void }) => {
  const { data: currentUser } = useCurrentUser();
  const staff = useStaffDraft();
  const edit = useSectionEdit(staff.tasks, staff.reset);

  return (
    <ProfileSection
      icon={<Users size={22} />}
      title="Personale"
      onBack={onBack}
      edit={edit}
      canEdit={!staff.isLoading && !staff.isError}
      saveError={
        staff.editing !== null
          ? "Conferma o annulla la persona in modifica"
          : null
      }
    >
      <SettingsCard icon={<Users size={15} />} title="Chi lavora nel locale">
        {currentUser && (
          <StaffSettings
            actor={currentUser}
            draft={staff}
            isEditMode={edit.isEditMode}
          />
        )}
      </SettingsCard>
    </ProfileSection>
  );
};
