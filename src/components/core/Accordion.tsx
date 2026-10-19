import { cn } from "../../helpers/cn";

interface AccordionProps {
  children: React.ReactNode;
  onClick: () => void;
  expanded: boolean;
  className?: string;
  //id del contenuto che apre/chiude, per i lettori di schermo
  controls?: string;
}

export const Accordion = ({
  children,
  onClick,
  expanded,
  className,
  controls,
}: AccordionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn(
        "w-full flex justify-between items-center cursor-pointer text-left",
        className,
      )}
    >
      {children}
    </button>
  );
};
