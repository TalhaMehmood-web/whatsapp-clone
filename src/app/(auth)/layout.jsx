export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-wa-bg px-4 py-8 sm:p-6">
      <div className="mb-6 flex items-center gap-2 text-wa-green sm:mb-8">
        <span className="text-2xl font-semibold">WhatsApp</span>
      </div>
      {children}
    </div>
  );
}
