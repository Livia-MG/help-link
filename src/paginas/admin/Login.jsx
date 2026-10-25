import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useAutenticacao } from "../../hooks/useAutenticacao";
import { obterAuth } from "../../servicos/supabaseAuth";
import { IconeLogo } from "../../componentes/IconeLogo";
import { Campo } from "../../componentes/admin/Campo";
import { CampoSenha } from "../../componentes/admin/CampoSenha";

export default function Login() {
  const { usuario, carregando, entrar, erro: erroSessao } = useAutenticacao();
  const [recuperar, setRecuperar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  if (usuario) return <Navigate to="/admin/instituicoes" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    setOcupado(true); setErro(""); setAviso("");
    const dados = new FormData(evento.currentTarget);
    try {
      const email = String(dados.get("email")).trim();
      if (recuperar) {
        const { error } = await obterAuth().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/redefinir-senha` });
        if (error && (error.status === 429 || error.status >= 500 || error.name === "AuthRetryableFetchError")) throw new Error("Não foi possível solicitar a recuperação agora. Tente mais tarde.");
        setAviso("Se houver uma conta com esse e-mail, você receberá as instruções para redefinir sua senha.");
      } else await entrar(email, String(dados.get("senha")));
    } catch (falha) { setErro(falha.message); }
    finally { setOcupado(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-soft px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar ao site</Link>
        <section className="rounded-3xl border border-border bg-card p-7 shadow-card md:p-9">
          <div className="mb-7 flex items-center gap-2 font-display text-2xl font-bold"><IconeLogo className="h-12 w-12" />Help<span className="text-primary">Link</span></div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"><LockKeyhole className="h-3.5 w-3.5" />Área administrativa</div>
          <h1 className="font-display text-2xl font-bold">{recuperar ? "Recuperar senha" : "Bem-vindo de volta"}</h1>
          <p className="mb-7 mt-2 text-sm text-muted-foreground">{recuperar ? "Informe seu e-mail para receber as instruções." : "Entre para gerenciar instituições e usuários."}</p>
          <form onSubmit={enviar} className="space-y-5">
            <fieldset disabled={ocupado || carregando} className="space-y-5">
              <Campo rotulo="E-mail" name="email" type="email" autoComplete="username" required maxLength={254} />
              {!recuperar && <CampoSenha rotulo="Senha" name="senha" autoComplete="current-password" required maxLength={128} />}
              {(erro || erroSessao) && <p role="alert" className="text-sm text-destructive">{erro || erroSessao}</p>}
              {aviso && <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-primary">{aviso}</p>}
              <button className="w-full rounded-lg bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{ocupado || carregando ? "Aguarde..." : recuperar ? "Enviar instruções" : "Entrar"}</button>
            </fieldset>
            <button type="button" disabled={ocupado} onClick={() => { setRecuperar(!recuperar); setErro(""); setAviso(""); }} className="w-full text-center text-sm font-medium text-primary">{recuperar ? "Voltar para o login" : "Esqueci minha senha"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
