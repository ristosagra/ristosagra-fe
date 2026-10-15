import { cn } from "../../helpers/cn";

interface AccordionProps {
  children: React.ReactNode;
  onClick: () => void;
  expanded: boolean;
  className?: string;
}

export const Accordion = ({
  children,
  onClick,
  expanded,
  className,
}: AccordionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cn(
        "w-full flex justify-between items-center cursor-pointer text-left",
        className,
      )}
    >
      {children}
    </button>
  );
};
