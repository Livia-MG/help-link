import { Campo } from "./Campo";
import { CampoSenha } from "./CampoSenha";

export function FormularioUsuario({ usuario, salvar, cancelar, ocupado, erro }) {
  return <form onSubmit={(evento) => {
    evento.preventDefault();
    if (ocupado) return;
    const campos = new FormData(evento.currentTarget);
    const dados = { nome: String(campos.get("nome")).trim(), email: String(campos.get("email")).trim() };
    if (campos.get("senha")) dados.senha = String(campos.get("senha"));
    salvar(dados);
  }}>
    <fieldset disabled={ocupado} className="space-y-5">
      <Campo rotulo="Nome" name="nome" defaultValue={usuario?.nome || ""} required minLength={2} maxLength={100} autoComplete="name" />
      <Campo rotulo="E-mail" name="email" defaultValue={usuario?.email || ""} type="email" required maxLength={254} autoComplete="off" />
      <CampoSenha rotulo={usuario ? "Nova senha (opcional)" : "Senha"} name="senha" required={!usuario} minLength={8} maxLength={128} autoComplete="new-password" />
      <p className="rounded-lg bg-primary-soft p-3 text-sm text-primary">Este usuário poderá gerenciar todas as instituições e os demais usuários.</p>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button type="button" onClick={cancelar} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold">Cancelar</button>
        <button className="rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{ocupado ? "Salvando..." : usuario ? "Salvar alterações" : "Criar usuário"}</button>
      </div>
    </fieldset>
  </form>;
}
