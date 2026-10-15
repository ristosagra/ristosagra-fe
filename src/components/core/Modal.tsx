import React, { useEffect, useId } from "react";

interface ModalProps {
  icon: React.ReactNode;
  title: string;
  subTitle: React.ReactNode | string;
  children: React.ReactNode;
  //chiusura con Esc o con un clic fuori dalla finestra
  onClose?: () => void;
}

export const Modal = ({
  icon,
  title,
  subTitle,
  children,
  onClose,
}: ModalProps) => {
  const titleId = useId();

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {/* Sul cellulare si apre dal basso a tutta larghezza, sugli schermi grandi è centrata */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-neutral-900 shadow-2xl p-5 sm:p-7 w-full sm:max-w-96 max-h-[90dvh] overflow-y-auto overscroll-contain border border-neutral-700 rounded-t-2xl sm:rounded-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 shrink-0 bg-emerald-900 rounded-lg flex items-center justify-center text-xl border border-emerald-700">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-white">
              {title}
            </h2>
            {subTitle}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
