export const Loader = () => {
  return (
    <div className="fixed w-full h-full inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-10 h-10 border-4 border-[var(--brand)] border-t-gray-500 rounded-full animate-spin" />
    </div>
  );
};
