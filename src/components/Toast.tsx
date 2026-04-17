interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[300] bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl pointer-events-none max-w-xs text-center transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {message}
    </div>
  );
}
