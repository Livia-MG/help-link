import { useCallback, useEffect, useRef, useState } from "react";
import { ContextoAutenticacao } from "../../hooks/useAutenticacao";
import { obterAuth } from "../../servicos/supabaseAuth";
import { consultarAdministrativo } from "../../servicos/servicoAdministrativo";

export function AutenticacaoProvider({ children }) {
  const [estado, setEstado] = useState({ carregando: true, usuario: null, erro: "" });
  const versao = useRef(0);

  const atualizarPerfil = useCallback(async (sessao) => {
    const atual = ++versao.current;
    if (!sessao) {
      setEstado({ carregando: false, usuario: null, erro: "" });
      return;
    }
    setEstado({ carregando: true, usuario: null, erro: "" });
    try {
      const usuario = await consultarAdministrativo("/api/autenticacao/me");
      if (atual === versao.current) setEstado({ carregando: false, usuario, erro: "" });
    } catch (erro) {
      if (atual === versao.current) setEstado({ carregando: false, usuario: null, erro: erro.message });
    }
  }, []);

  useEffect(() => {
    let inscricao;
    let ativo = true;
    const invalidar = () => {
      versao.current += 1;
      setEstado({ carregando: false, usuario: null, erro: "Sua sessão não permite mais acesso. Entre novamente." });
    };
    window.addEventListener("sessao-administrativa-invalida", invalidar);
    try {
      const auth = obterAuth().auth;
      const { data } = auth.onAuthStateChange((_evento, sessao) => {
        // Fora do callback: chamadas Auth assincronas aqui podem bloquear o SDK.
        queueMicrotask(() => { if (ativo) void atualizarPerfil(sessao); });
      });
      inscricao = data.subscription;
    } catch (erro) {
      queueMicrotask(() => { if (ativo) setEstado({ carregando: false, usuario: null, erro: erro.message }); });
    }
    return () => {
      ativo = false;
      versao.current += 1;
      inscricao?.unsubscribe();
      window.removeEventListener("sessao-administrativa-invalida", invalidar);
    };
  }, [atualizarPerfil]);

  async function entrar(email, senha) {
    const { data, error } = await obterAuth().auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error("Não foi possível entrar. Confira seu e-mail e senha.");
    await atualizarPerfil(data.session);
  }

  async function sair() {
    const { error } = await obterAuth().auth.signOut({ scope: "local" });
    if (error) throw new Error("Não foi possível sair. Tente novamente.");
    versao.current += 1;
    setEstado({ carregando: false, usuario: null, erro: "" });
  }

  async function recarregarPerfil() {
    const { data: { session } } = await obterAuth().auth.getSession();
    await atualizarPerfil(session);
  }

  return <ContextoAutenticacao.Provider value={{ ...estado, entrar, sair, recarregarPerfil }}>{children}</ContextoAutenticacao.Provider>;
}
