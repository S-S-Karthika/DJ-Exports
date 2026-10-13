export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, description, children }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {title && (
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="font-semibold text-stone-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-stone-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>
      )}
    </div>
  );
}

export const inputClass = (error) =>
  `w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-4 ${
    error
      ? "border-red-400 focus:ring-red-100"
      : "border-stone-300 focus:border-brand-600 focus:ring-brand-100"
  }`;