import React from "react";

interface ModalProps {
  icon: React.ReactNode;
  title: string;
  subTitle: React.ReactNode | string;
  children: React.ReactNode;
}

export const Modal = ({ icon, title, subTitle, children }: ModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl p-7 w-96 border border-neutral-700">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center text-xl border border-emerald-700">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            {subTitle}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
