import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ titulo, fechar, ocupado, children }) {
  const referencia = useRef(null);
  const tituloId = useId();
  useEffect(() => {
    const dialogo = referencia.current;
    const anterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialogo.close();
      document.body.style.overflow = overflowAnterior;
      anterior?.focus();
    };
  }, []);
  return (
    <dialog ref={referencia} aria-labelledby={tituloId} onCancel={(evento) => {
      evento.preventDefault();
      if (!ocupado) fechar();
    }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/45">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-5">
        <h2 id={tituloId} className="font-display text-xl font-semibold">{titulo}</h2>
        <button type="button" aria-label="Fechar modal" disabled={ocupado} onClick={fechar} className="rounded-lg p-2 hover:bg-muted disabled:opacity-50"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
