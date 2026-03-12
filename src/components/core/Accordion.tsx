interface AccordionProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const Accordion = ({ children, onClick }: AccordionProps) => {
  return (
    <button
      onClick={() => onClick()}
      className="w-full flex justify-between items-center p-4 cursor-pointer"
    >
      {children}
    </button>
  );
};
