import { Save, X } from "lucide-react";
import { Button } from "./core/Button";
import { ButtonDimensions } from "../constant/button";

interface SaveChangesProps {
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

//Salva o annulla le modifiche fatte in bozza
export const SaveChanges = ({
  onSave,
  onCancel,
  disabled,
}: SaveChangesProps) => (
  <div className="flex justify-end gap-2">
    <Button
      iconLeft={<X size={16} />}
      label={<span className="text-sm ml-1">Annulla</span>}
      dimension={ButtonDimensions.auto}
      variant="secondary"
      onClick={onCancel}
      className="px-3 py-2"
    />
    <Button
      iconLeft={<Save size={16} />}
      label={<span className="text-sm ml-1">Salva</span>}
      dimension={ButtonDimensions.auto}
      variant="primary"
      onClick={onSave}
      disabled={disabled}
      className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
    />
  </div>
);
