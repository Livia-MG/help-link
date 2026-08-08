import { BarraNavegacao } from "./BarraNavegacao";
import { Rodape } from "./Rodape";

export const Estrutura = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <BarraNavegacao />
    <main className="flex-1">{children}</main>
    <Rodape />
  </div>
);
