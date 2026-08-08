import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";
import { IconeLogo } from "./IconeLogo";

export const Rodape = () => (
  <footer className="border-t border-border bg-secondary/40 mt-20">
    <div className="container py-12 grid md:grid-cols-4 gap-8">
      <div className="md:col-span-2 space-y-3">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <IconeLogo className="h-10 w-10 object-contain" />
          Help<span className="text-primary">Link</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          Conectando pessoas e ONGs da região de Barretos para que toda ajuda chegue mais longe.
        </p>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Navegação</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/instituicoes" className="hover:text-primary">Instituições</Link></li>
          <li><Link to="/sobre" className="hover:text-primary">Sobre nós</Link></li>
          <li><Link to="/sos" className="hover:text-sos">S.O.S</Link></li>
          <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Contato</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Barretos/SP</li>
          <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> helplinkhl@gmail.com</li>
          <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (17) 3322-0000</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Help Link · Toda ajuda começa com um clique.
    </div>
  </footer>
);
