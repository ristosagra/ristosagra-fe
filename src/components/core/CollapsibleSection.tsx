import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../helpers/cn";

//Sezione chiusa che si apre dal titolo (es. "Pronte (3)"): il contenuto c'è solo da aperta
export const CollapsibleSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 py-2 font-bold cursor-pointer"
      >
        {title}
        <ChevronDown
          size={18}
          aria-hidden
          className={cn(
            "transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
};
