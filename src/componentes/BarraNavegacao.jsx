import { Link, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Siren } from "lucide-react";
import { IconeLogo } from "./IconeLogo";
import { cn } from "../lib/utilitarios";

const links = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/instituicoes", label: "Instituições" },
  { to: "/explorar", label: "Explorar" },
  { to: "/contato", label: "Contato" },
  { to: "/sos", label: "SOS" },
];

export const BarraNavegacao = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isSos = location.pathname === "/sos";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-1 font-display font-bold text-lg">
          <IconeLogo className="h-9 w-9 object-contain" />
          <span>
            Help<span className="text-primary">Link</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <RouterNavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-base",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )
              }
            >
              {l.label}
            </RouterNavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/sos"
            className={`inline-flex items-center gap-2 h-9 px-3 text-sm rounded-md font-semibold transition ${
              isSos
                ? "text-white bg-linear-to-r from-destructive to-destructive-glow hover:opacity-95 shadow-destructive"
                : "border-0 hover:bg-destructive-soft"
            }`}
          >
            <Siren className={`h-4 w-4 ${isSos ? 'text-destructive-soft' : 'text-destructive'}`} />
            SOS
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-3 flex flex-col gap-1">
            {links.map((l) => (
              <RouterNavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-3 rounded-lg text-sm font-medium",
                    isActive ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted",
                  )
                }
              >
                {l.label}
              </RouterNavLink>
            ))}
            <Link
              to="/sos"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-semibold text-white bg-linear-to-r from-destructive to-destructive-glow hover:opacity-95 shadow-destructive transition"
            >
              <Siren className="h-4 w-4" />
              Emergência S.O.S
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
