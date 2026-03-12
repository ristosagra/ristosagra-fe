interface AccordionProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const Accordion = ({ children, onClick, className }: AccordionProps) => {
  return (
    <button
      onClick={() => onClick()}
      className={`w-full flex justify-between items-center cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};
