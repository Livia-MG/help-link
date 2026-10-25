import { MapPin } from "lucide-react";
import { usePrivacidade } from "../hooks/usePrivacidade";

export function MapaComPrivacidade({ children }) {
  const { mapasPermitidos, abrirPreferencias } = usePrivacidade();
  if (mapasPermitidos) return children;
  return <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 bg-muted p-5 text-center">
    <MapPin className="h-7 w-7 text-primary" />
    <p className="text-sm font-semibold">Mapa externo desativado</p>
    <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">Para carregar o mapa, autorize os serviços externos nas preferências de cookies. O endereço continua disponível nesta página.</p>
    <button onClick={abrirPreferencias} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary">Gerenciar mapas externos</button>
  </div>;
}
