export function Card({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3">
      {(title || description) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-[11px] font-medium text-gray-300">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-[11px] text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
