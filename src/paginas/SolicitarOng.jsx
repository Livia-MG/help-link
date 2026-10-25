import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";
import { EstadoConsulta } from "../componentes/EstadoConsulta";
import { FormularioOng } from "../componentes/admin/FormularioOng";
import { Campo } from "../componentes/admin/Campo";
import { useCatalogo } from "../hooks/useCatalogo";

export default function SolicitarOng() {
  const { categorias, carregando, erro: erroCatalogo, tentarNovamente } = useCatalogo();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [protocolo, setProtocolo] = useState(null);
  const trava = useRef(false);
  const navegar = useNavigate();

  async function enviar(ong, campos) {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro("");
    try {
      const resposta = await fetch("/api/solicitacoes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ong, solicitanteNome: String(campos.get("solicitanteNome")).trim(), solicitanteEmail: String(campos.get("solicitanteEmail")).trim(), website: String(campos.get("website") || "") }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok || !corpo.ok) throw new Error(corpo.message || "Não foi possível enviar a solicitação agora.");
      setProtocolo(corpo.data.id || "recebida");
    } catch (falha) { setErro(falha.message); }
    finally { trava.current = false; setOcupado(false); }
  }

  return <Estrutura>
    <section className="border-b border-border bg-gradient-soft"><div className="container py-12"><h1 className="font-display text-3xl font-bold md:text-4xl">Solicitar inclusão de instituição</h1><p className="mt-3 max-w-2xl text-muted-foreground">Apresente uma ONG à comunidade Help Link. Nossa equipe analisará os dados antes da publicação e responderá pelo e-mail informado.</p></div></section>
    <section className="container py-10"><div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
      {protocolo ? <div role="status" className="space-y-5 py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-primary" /><h2 className="font-display text-2xl font-bold">Solicitação recebida!</h2><p>Os dados foram enviados para análise. A instituição será publicada somente após a aprovação dos administradores.</p><p className="break-all text-sm text-muted-foreground">Protocolo: {protocolo}</p><p className="text-sm text-muted-foreground">Você receberá o resultado pelo e-mail informado. Confira também a pasta de spam.</p><Link to="/instituicoes" className="inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Ver instituições</Link></div>
        : <><EstadoConsulta carregando={carregando} erro={erroCatalogo} tentarNovamente={tentarNovamente} />{!carregando && !erroCatalogo && <FormularioOng categorias={categorias} salvar={enviar} cancelar={() => navegar("/instituicoes")} ocupado={ocupado} erro={erro} textoSalvar="Enviar para análise" textoCancelar="Voltar">
          <div className="space-y-4 border-b border-border pb-6"><h2 className="font-display text-xl font-semibold">Seus dados de contato</h2><p className="text-sm text-muted-foreground">Esses dados serão usados pela administração para responder à solicitação e não serão publicados no catálogo.</p><Campo rotulo="Seu nome" name="solicitanteNome" autoComplete="name" minLength={2} maxLength={100} required /><Campo rotulo="Seu e-mail" name="solicitanteEmail" type="email" autoComplete="email" maxLength={254} required /><div hidden aria-hidden="true"><label>Website<input name="website" autoComplete="off" tabIndex={-1} /></label></div></div>
          <p className="text-sm leading-relaxed text-muted-foreground">Envie apenas informações institucionais que você esteja autorizado a compartilhar e publicar. Não inclua dados pessoais de beneficiários. A análise e a resposta por e-mail seguem os <Link to="/termos-de-uso" className="text-primary underline">termos de uso</Link> e a <Link to="/politica-de-privacidade" className="text-primary underline">política de privacidade</Link>.</p>
        </FormularioOng>}</>}
    </div></section>
  </Estrutura>;
}
