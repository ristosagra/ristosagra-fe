import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Label } from "../../../components/core/Label";
import { Loader } from "../../../components/core/Loader";
import { SaveChanges } from "../../../components/SaveChanges";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import {
  LabelDimensions,
  LabelTags,
  LabelWeight,
} from "../../../constant/label";
import { cn } from "../../../helpers/cn";
import type { SectionEdit } from "../../../hooks/useSectionEdit";

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

//Box di una sezione del profilo, sempre aperta: un argomento per box
export const SettingsCard = ({ icon, title, children }: SettingsCardProps) => (
  <section
    className={cn(
      "flex flex-col gap-3 p-4",
      ThemeVariants.colors.bg.surface,
      ThemeVariants.colors.border.all.default,
      ThemeVariants.borderRadius.lg,
    )}
  >
    <h3
      className={cn(
        "flex items-center gap-2 min-w-0 text-sm font-semibold uppercase [overflow-wrap:anywhere]",
        ThemeVariants.colors.text.secondary,
      )}
    >
      {icon}
      {title}
    </h3>
    {children}
  </section>
);

interface ProfileSectionProps {
  icon: React.ReactNode;
  title: string;
  onBack: () => void;
  //modifica della sezione (il personale non ce l'ha: si salva subito)
  edit?: SectionEdit;
  //dati caricati: si può entrare in modifica
  canEdit?: boolean;
  //cosa impedisce di salvare: Salva resta spento e si vede il motivo
  saveError?: string | null;
  children: React.ReactNode;
}

//Sezione del profilo aperta dalla pagina Profilo: torna indietro, titolo e Modifica, che rende
//modificabili solo le box di questa sezione. In modifica si esce con Salva o Annulla
export const ProfileSection = ({
  icon,
  title,
  onBack,
  edit,
  canEdit = true,
  saveError,
  children,
}: ProfileSectionProps) => {
  const isEditMode = !!edit?.isEditMode;

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      {edit?.isSaving && <Loader />}

      {/* Intestazione fissa in alto, così Salva resta a portata anche scorrendo */}
      <div
        className={`sticky top-0 z-10 flex flex-col gap-1 -mx-4 px-4 py-3 mb-2 sm:-mx-6 sm:px-6 sm:py-4 sm:mb-3 ${ThemeVariants.colors.bg.base}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {!isEditMode && (
              <Button
                iconLeft={<ChevronLeft size={20} />}
                onClick={onBack}
                dimension={ButtonDimensions.auto}
                variant="secondary"
                className="w-10 h-10 shrink-0"
                ariaLabel="Torna al profilo"
              />
            )}
            <span className={`shrink-0 ${ThemeVariants.colors.text.brand}`}>
              {icon}
            </span>
            <Label
              tag={LabelTags.h2}
              label={title}
              size={LabelDimensions.xlarge}
              weight={LabelWeight.bold}
              noMargin
              additionalClasses="max-sm:text-xl min-w-0 [overflow-wrap:anywhere]"
            />
          </div>
          {edit && (
            <div className="ml-auto">
              {isEditMode ? (
                <SaveChanges
                  onSave={edit.save}
                  onCancel={edit.cancel}
                  disabled={edit.isSaving || !!saveError}
                />
              ) : (
                <Button
                  iconLeft={<Pencil size={16} />}
                  label={<span className="text-sm ml-1">Modifica</span>}
                  dimension={ButtonDimensions.auto}
                  variant="primary"
                  onClick={edit.start}
                  disabled={!canEdit}
                  className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              )}
            </div>
          )}
        </div>
        {isEditMode && saveError && (
          <p
            role="alert"
            className={`text-sm sm:text-right ${ThemeVariants.colors.text.danger}`}
          >
            {saveError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};
