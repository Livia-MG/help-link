import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { ContextoPrivacidade } from "../hooks/usePrivacidade";
import { lerPreferencias, salvarPreferencias } from "../lib/preferenciasPrivacidade";
import { Modal } from "./admin/Modal";

const estiloBotao = "rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary";

export function PrivacidadeProvider({ children }) {
  const [preferencias, setPreferencias] = useState(() => lerPreferencias());
  const [aberto, setAberto] = useState(false);
  const [mapasSelecionados, setMapasSelecionados] = useState(false);
  const [aviso, setAviso] = useState("");

  function abrirPreferencias() {
    setMapasSelecionados(preferencias?.mapas === true);
    setAberto(true);
  }
  function salvar(mapas) {
    const resultado = salvarPreferencias(mapas);
    setPreferencias(resultado.dados);
    setAberto(false);
    setAviso(resultado.armazenado ? "Preferências de privacidade salvas." : "Seu navegador bloqueou o armazenamento. Sua escolha será respeitada nesta visita, mas poderá ser solicitada novamente.");
  }

  return <ContextoPrivacidade.Provider value={{ mapasPermitidos: preferencias?.mapas === true, abrirPreferencias }}>
    {children}
    {!preferencias && !aberto && <section aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-5xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Sua privacidade no Help Link</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Usamos armazenamento necessário para lembrar suas escolhas e manter o acesso administrativo. Os mapas do Google e do OpenStreetMap ficam bloqueados até você permitir. Não usamos analytics ou publicidade nesta versão acadêmica.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={() => salvar(false)} className={estiloBotao}>Rejeitar não necessários</button><button onClick={() => salvar(true)} className={estiloBotao}>Permitir mapas externos</button><button onClick={abrirPreferencias} className={estiloBotao}>Personalizar</button><Link to="/politica-de-cookies" className="text-sm font-medium text-primary underline">Política de cookies</Link></div>
    </section>}
    {preferencias && <button hidden={aberto} style={aberto ? { display: "none" } : undefined} onClick={abrirPreferencias} className="fixed bottom-3 left-3 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-primary shadow-card"><ShieldCheck className="h-4 w-4" />Preferências de cookies</button>}
    {aviso && <span role="status" className="sr-only">{aviso}</span>}
    {aberto && <Modal titulo="Preferências de cookies" fechar={() => setAberto(false)}>
      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">Você pode mudar sua escolha a qualquer momento. Recusar mapas não impede consultar as instituições, usar os formulários ou acessar os textos legais.</p>
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-4"><p className="font-semibold">Necessários · sempre ativos</p><p className="mt-2 text-sm text-muted-foreground">Preferência de privacidade e, somente ao usar a área administrativa, autenticação e segurança da sessão.</p></div>
        <label className="block rounded-xl border border-border p-4"><span className="flex items-center justify-between gap-3 font-semibold">Mapas externos<input type="checkbox" checked={mapasSelecionados} onChange={(evento) => setMapasSelecionados(evento.target.checked)} className="h-5 w-5 accent-[var(--primary)]" /></span><span className="mt-2 block text-sm text-muted-foreground">Autoriza carregar mapas do Google e do OpenStreetMap. Esses provedores recebem dados técnicos, como IP e navegador, e podem usar suas próprias tecnologias de armazenamento.</span></label>
        <p className="text-sm text-muted-foreground">Não há categorias de publicidade ou analytics a ativar. A preferência é lembrada por até 180 dias neste navegador.</p>
        <Link to="/politica-de-privacidade" onClick={() => setAberto(false)} className="inline-block text-sm text-primary underline">Ler a política de privacidade</Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><button className={estiloBotao} onClick={() => salvar(false)}>Rejeitar não necessários</button><button className={estiloBotao} onClick={() => salvar(mapasSelecionados)}>Salvar preferências</button></div>
    </Modal>}
  </ContextoPrivacidade.Provider>;
}
