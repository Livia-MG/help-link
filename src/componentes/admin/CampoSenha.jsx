import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function CampoSenha({ rotulo, id, ...props }) {
  const identificador = useId();
  const campoId = id || identificador;
  const [visivel, setVisivel] = useState(false);
  return <div className="grid gap-2 text-sm font-medium">
    <label htmlFor={campoId}>{rotulo}</label>
    <div className="relative">
      <input {...props} id={campoId} type={visivel ? "text" : "password"} className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
      <button type="button" disabled={props.disabled} aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${rotulo.toLowerCase()}`} aria-controls={campoId} aria-pressed={visivel} onClick={() => setVisivel((valor) => !valor)} className="absolute inset-y-0 right-1 my-1 rounded-md px-2 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
        {visivel ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  </div>;
}
