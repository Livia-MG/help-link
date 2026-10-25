export function Campo({ rotulo, className = "", multiline, children, ...props }) {
  const estilo = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60";
  return (
    <label className={`grid content-start gap-2 text-sm font-medium ${className}`}>
      <span>{rotulo}</span>
      {multiline ? <textarea {...props} className={estilo} /> : children || <input {...props} className={estilo} />}
    </label>
  );
}
