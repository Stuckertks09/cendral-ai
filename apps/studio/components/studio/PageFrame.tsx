export function PageFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-gray-400 mt-1 max-w-3xl">
            {description}
          </p>
        )}
      </header>

      <main className="flex-1 overflow-auto px-6 py-4 space-y-8">
        {children}
      </main>
    </div>
  );
}
