import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import { useCatalogo } from "../../hooks/useCatalogo";
import { useAutenticacao } from "../../hooks/useAutenticacao";
import { useUsuarios } from "../../hooks/useUsuarios";
import { consultarAdministrativo } from "../../servicos/servicoAdministrativo";
import { EstadoConsulta } from "../../componentes/EstadoConsulta";
import { Modal } from "../../componentes/admin/Modal";
import { FormularioOng } from "../../componentes/admin/FormularioOng";
import { FormularioUsuario } from "../../componentes/admin/FormularioUsuario";

export function InstituicoesAdmin() {
  const catalogo = useCatalogo();
  return <Cadastros tipo="instituicoes" registros={catalogo.ongs} categorias={catalogo.categorias} carregando={catalogo.carregando} erro={catalogo.erro} recarregar={catalogo.tentarNovamente} />;
}

export function UsuariosAdmin() {
  const consulta = useUsuarios();
  return <Cadastros tipo="usuarios" registros={consulta.usuarios} carregando={consulta.carregando} erro={consulta.erro} recarregar={consulta.recarregar} />;
}

function Cadastros({ tipo, registros, categorias = [], carregando, erro, recarregar }) {
  const { usuario, recarregarPerfil } = useAutenticacao();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [modal, setModal] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const [erroModal, setErroModal] = useState("");
  const instituicoes = tipo === "instituicoes";
  const titulo = instituicoes ? "Instituições" : "Usuários";
  const singular = instituicoes ? "instituição" : "usuário";
  const caminho = instituicoes ? "/api/ongs" : "/api/usuarios";
  const filtrar = (texto) => String(texto).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const filtrados = registros.filter((registro) => filtrar(`${registro.name || registro.nome} ${registro.email || ""}`).includes(filtrar(busca)) && (!categoria || registro.categories?.includes(categoria)));
  const Icone = instituicoes ? Building2 : Users;

  function abrir(acao, registro = null) { setErroModal(""); setModal({ acao, registro }); }
  function fechar() { if (!trava.current) setModal(null); }

  async function gravar(dados) {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErroModal("");
    const excluir = modal.acao === "excluir";
    const id = modal.registro?.id;
    try {
      await consultarAdministrativo(caminho + (id ? `/${encodeURIComponent(id)}` : ""), {
        metodo: excluir ? "DELETE" : id ? "PATCH" : "POST", dados: excluir ? undefined : dados,
      });
      toast.success(excluir ? "Cadastro excluído." : "Cadastro salvo com sucesso.");
      setModal(null); recarregar();
      if (!instituicoes && id === usuario.id) await recarregarPerfil();
    } catch (falha) { setErroModal(falha.message); }
    finally { trava.current = false; setOcupado(false); }
  }

  return <>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Gerenciamento</p><h1 className="mt-2 font-display text-3xl font-bold">{titulo}</h1><p className="mt-2 text-sm text-muted-foreground">{instituicoes ? "Cuide das informações que conectam pessoas às ONGs." : "Gerencie quem tem acesso à administração do Help Link."}</p></div>
      <button onClick={() => abrir("criar")} disabled={carregando || Boolean(erro)} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card disabled:opacity-60"><Plus className="h-4 w-4" />{instituicoes ? "Nova instituição" : "Novo usuário"}</button>
    </div>
    <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar {titulo.toLowerCase()}</span><Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder={instituicoes ? "Buscar por nome..." : "Buscar por nome ou e-mail..."} className="w-full rounded-lg border border-border bg-background py-2.5 pl-11 pr-3 text-sm" /></label>
      {instituicoes && <select aria-label="Filtrar por categoria" value={categoria} onChange={(evento) => setCategoria(evento.target.value)} className="max-w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option value="">Todas as categorias</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>}
    </div>
    <EstadoConsulta carregando={carregando} erro={erro} tentarNovamente={recarregar} />
    {!carregando && !erro && <>
      <p className="mb-4 text-sm text-muted-foreground">{filtrados.length} {filtrados.length === 1 ? "cadastro encontrado" : "cadastros encontrados"}</p>
      {filtrados.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><Icone className="mx-auto mb-3 h-9 w-9 text-primary" /><p>Nenhum cadastro encontrado.</p></div> : <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"><ul className="divide-y divide-border">
        {filtrados.map((registro) => <li key={registro.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1"><h2 className="break-words font-display font-semibold">{registro.name || registro.nome}{registro.id === usuario.id && <span className="ml-2 text-xs font-normal text-primary">Você</span>}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{registro.neighborhood || registro.email}</p>{instituicoes && <p className="mt-2 text-xs text-primary">{registro.categories.map((id) => categorias.find((item) => item.id === id)?.nome || id).join(" · ")}</p>}</div>
          <div className="flex gap-2"><button onClick={() => abrir("editar", registro)} aria-label={`Editar ${registro.name || registro.nome}`} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-4 w-4" />Editar</button><button disabled={!instituicoes && registro.id === usuario.id} title={!instituicoes && registro.id === usuario.id ? "Você não pode excluir sua própria conta" : undefined} onClick={() => abrir("excluir", registro)} aria-label={`Excluir ${registro.name || registro.nome}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive-soft disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" />Excluir</button></div>
        </li>)}
      </ul></div>}
    </>}
    {modal && <Modal titulo={modal.acao === "excluir" ? `Excluir ${singular}` : modal.registro ? `Editar ${singular}` : `Cadastrar ${singular}`} fechar={fechar} ocupado={ocupado}>
      {modal.acao === "excluir" ? <div className="space-y-5"><p>Deseja excluir definitivamente <strong>{modal.registro.name || modal.registro.nome}</strong>? Esta ação não poderá ser desfeita.</p>{erroModal && <p role="alert" className="text-sm text-destructive">{erroModal}</p>}<div className="flex justify-end gap-3"><button disabled={ocupado} onClick={fechar} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold">Cancelar</button><button disabled={ocupado} onClick={() => gravar()} className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{ocupado ? "Excluindo..." : "Excluir definitivamente"}</button></div></div>
        : instituicoes ? <FormularioOng ong={modal.registro} categorias={categorias} salvar={gravar} cancelar={fechar} ocupado={ocupado} erro={erroModal} /> : <FormularioUsuario usuario={modal.registro} salvar={gravar} cancelar={fechar} ocupado={ocupado} erro={erroModal} />}
    </Modal>}
  </>;
}
