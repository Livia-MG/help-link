import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { obterAuth } from "../../servicos/supabaseAuth";
import { CampoSenha } from "../../componentes/admin/CampoSenha";
import { IconeLogo } from "../../componentes/IconeLogo";

export default function RedefinirSenha() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token_hash");
  const tipo = parametros.get("type");
  const chave = `${tipo}:${token}`;
  const verificacao = useRef(null);
  const [resultado, setResultado] = useState(null);
  const estado = resultado?.chave === chave ? resultado.estado : "verificando";
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const navegar = useNavigate();

  useEffect(() => {
    let ativo = true;
    if (verificacao.current?.chave !== chave) {
      verificacao.current = { chave, promessa: Promise.resolve().then(async () => {
        if (!token || tipo !== "recovery") throw new Error("Link inválido");
        const { error } = await obterAuth().auth.verifyOtp({ token_hash: token, type: "recovery" });
        if (error) throw error;
      }) };
    }
    verificacao.current.promessa.then(() => { if (ativo) setResultado({ chave, estado: "valido" }); }).catch(() => { if (ativo) setResultado({ chave, estado: "invalido" }); });
    return () => { ativo = false; };
  }, [token, tipo, chave]);

  async function salvar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    const dados = new FormData(evento.currentTarget);
    if (dados.get("senha") !== dados.get("confirmacao")) { setErro("As senhas devem ser iguais."); return; }
    setOcupado(true); setErro("");
    try {
      const { error } = await obterAuth().auth.updateUser({ password: String(dados.get("senha")) });
      if (error) throw new Error("Não foi possível alterar a senha. Confira se ela é diferente da anterior e tente novamente.");
      const { error: erroSaida } = await obterAuth().auth.signOut({ scope: "local" });
      if (erroSaida) throw new Error("Senha alterada. Saia da conta antes de entrar com a nova senha.");
      navegar("/admin/login", { replace: true });
    } catch (falha) { setErro(falha.message); }
    finally { setOcupado(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-gradient-soft px-5 py-12">
    <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
      <IconeLogo className="mb-5 h-12 w-12" /><h1 className="font-display text-2xl font-bold">Definir nova senha</h1>
      {estado === "verificando" && <p role="status" className="mt-5">Verificando seu link...</p>}
      {estado === "invalido" && <div className="mt-5"><p role="alert">Este link é inválido, expirou ou já foi utilizado.</p><Link to="/admin/login" className="mt-4 inline-block text-primary">Solicitar um novo link</Link></div>}
      {estado === "valido" && <form onSubmit={salvar} className="mt-6 space-y-5"><fieldset disabled={ocupado} className="space-y-5">
        <CampoSenha rotulo="Nova senha" name="senha" autoComplete="new-password" minLength={8} maxLength={128} required />
        <CampoSenha rotulo="Confirmar nova senha" name="confirmacao" autoComplete="new-password" minLength={8} maxLength={128} required />
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <button className="w-full rounded-lg bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{ocupado ? "Salvando..." : "Salvar nova senha"}</button>
      </fieldset></form>}
    </section>
  </main>;
}
