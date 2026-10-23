import { useState } from "react";
import { useNotification } from "./useNotification";
import { NotificationType } from "../types/notification";

export interface SaveTask {
  //cosa si salva, per il messaggio d'errore (es. "orari", "asporto")
  label: string;
  dirty: boolean;
  run: () => Promise<unknown>;
}

//Modifica di una sezione del Profilo: si parte in lettura, Modifica rende modificabili le sue
//box e Salva salva le bozze cambiate, una dopo l'altra nell'ordine dato (es. il personale:
//prima chi si elimina, così il suo username si libera). Se qualcosa non va si resta in
//modifica, con le sole bozze non salvate
export const useSectionEdit = (tasks: SaveTask[], reset: () => void) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const showNotification = useNotification();

  const cancel = () => {
    reset();
    setIsEditMode(false);
  };

  const save = async () => {
    const changed = tasks.filter((t) => t.dirty);
    const failed: SaveTask[] = [];
    setIsSaving(true);
    for (const task of changed) {
      try {
        await task.run();
      } catch {
        failed.push(task);
      }
    }
    setIsSaving(false);

    if (failed.length > 0)
      return showNotification(
        `Errore nel salvataggio: ${failed.map((t) => t.label).join(", ")}`,
        NotificationType.Err,
      );
    setIsEditMode(false);
    if (changed.length > 0)
      showNotification("Modifiche salvate", NotificationType.Ok);
  };

  return {
    isEditMode,
    isSaving,
    start: () => setIsEditMode(true),
    cancel,
    save,
  };
};

export type SectionEdit = ReturnType<typeof useSectionEdit>;
