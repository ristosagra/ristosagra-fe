import { TriangleAlert } from "lucide-react";
import { Label } from "../../../components/core/Label";
import { LabelDimensions } from "../../../constant/label";

export const ErrorFloorPlan = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-neutral-950 font-mono text-rose-400">
      <div className="text-center space-y-3">
        <TriangleAlert size={40} />
        <Label
          tag="p"
          label="Errore nel caricamento della piantina"
          size={LabelDimensions.medium}
        />
      </div>
    </div>
  );
};
