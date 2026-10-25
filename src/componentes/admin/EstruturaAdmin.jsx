import { Link, NavLink, Outlet, Navigate } from "react-router-dom";
import { Building2, Users, LogOut, ArrowUpRight, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { IconeLogo } from "../IconeLogo";
import { useAutenticacao } from "../../hooks/useAutenticacao";

export function EstruturaAdmin() {
  const { usuario, carregando, sair } = useAutenticacao();
  if (carregando) return <p role="status" className="p-12 text-center">Verificando acesso...</p>;
  if (!usuario) return <Navigate to="/admin/login" replace />;
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/admin/instituicoes" className="flex items-center gap-2 font-display text-lg font-bold"><IconeLogo />Help<span className="text-primary">Link</span><span className="ml-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">Administração</span></Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">{usuario.nome}</span>
            <Link to="/" className="inline-flex items-center gap-1 text-primary">Ver site <ArrowUpRight className="h-4 w-4" /></Link>
            <button onClick={() => sair().catch((erro) => toast.error(erro.message))} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted"><LogOut className="h-4 w-4" />Sair</button>
          </div>
        </div>
      </header>
      <main className="container py-8 md:py-10">
        <nav aria-label="Administração" className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {[{ to: "/admin/instituicoes", nome: "Instituições", Icone: Building2 }, { to: "/admin/solicitacoes", nome: "Solicitações", Icone: ClipboardList }, { to: "/admin/usuarios", nome: "Usuários", Icone: Users }].map(({ to, nome, Icone }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${isActive ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted"}`}><Icone className="h-4 w-4" />{nome}</NavLink>
          ))}
        </nav>
        <Outlet />
      </main>
    </div>
  );
}
