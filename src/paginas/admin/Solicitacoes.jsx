import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Eye, Mail, RefreshCw } from "lucide-react";
import { consultarAdministrativo } from "../../servicos/servicoAdministrativo";
import { useCatalogo } from "../../hooks/useCatalogo";
import { EstadoConsulta } from "../../componentes/EstadoConsulta";
import { Modal } from "../../componentes/admin/Modal";
import { Campo } from "../../componentes/admin/Campo";
import { FormularioOng } from "../../componentes/admin/FormularioOng";

const estados = { pendente: "Pendente", aprovada: "Aprovada", recusada: "Recusada" };
const emails = { nao_aplicavel: "Aguardando análise", pendente: "Resposta pendente", enviando: "Enviando resposta", enviado: "Resposta enviada", falha: "Falha no e-mail" };

export default function Solicitacoes() {
  const catalogo = useCatalogo();
  const [versao, setVersao] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [filtro, setFiltro] = useState("pendente");
  const [modal, setModal] = useState(null);
  const [recusar, setRecusar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const trava = useRef(false);
  const carregando = resultado?.versao !== versao;
  const recarregar = () => setVersao((v) => v + 1);
  useEffect(() => {
    const controle = new AbortController();
    consultarAdministrativo("/api/solicitacoes", { signal: controle.signal }).then((dados) => {
      if (!controle.signal.aborted) setResultado({ versao, dados });
    }).catch((erro) => { if (!controle.signal.aborted) setResultado({ versao, erro }); });
    return () => controle.abort();
  }, [versao]);

  async function executar(acao, solicitacao, dados) {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErroModal("");
    try {
      const resposta = await consultarAdministrativo(`/api/solicitacoes/${solicitacao.id}${acao === "reenviar" ? "/reenviar" : ""}`, {
        metodo: acao === "reenviar" ? "POST" : "PATCH", dados,
      });
      const notificacao = resposta.notificacao || resposta;
      if (notificacao.enviado) toast.success(acao === "reenviar" ? "Resposta enviada por e-mail." : "Decisão salva e resposta enviada.");
      else toast.warning(notificacao.message);
      setModal(null); recarregar();
      if (dados?.decisao === "aprovada") catalogo.tentarNovamente();
    } catch (erro) { setErroModal(erro.message); if (!modal) toast.error(erro.message); }
    finally { trava.current = false; setOcupado(false); }
  }

  const lista = carregando ? [] : (resultado?.dados || []).filter((item) => !filtro || item.estado === filtro);
  return <>
    <p className="text-sm font-semibold uppercase tracking-wide text-primary">Análise de cadastros</p><h1 className="mt-2 font-display text-3xl font-bold">Solicitações de instituições</h1><p className="mt-2 text-sm text-muted-foreground">Confira os dados recebidos, aprove a publicação ou informe o motivo da recusa.</p>
    <div className="my-6 flex flex-wrap gap-2">{[["pendente", "Pendentes"], ["aprovada", "Aprovadas"], ["recusada", "Recusadas"], ["", "Todas"]].map(([valor, nome]) => <button key={valor} onClick={() => setFiltro(valor)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${filtro === valor ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{nome}</button>)}<button disabled={ocupado || carregando} onClick={recarregar} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw className="h-4 w-4" />Atualizar lista</button></div>
    <EstadoConsulta carregando={carregando} erro={resultado?.erro} tentarNovamente={recarregar} />
    {!carregando && !resultado?.erro && (lista.length ? <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">{lista.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1"><h2 className="break-words font-display font-semibold">{item.dados_ong.name}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{item.solicitante_nome} · {item.solicitante_email}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {estados[item.estado]} · {emails[item.email_estado]}</p></div>
      <div className="flex flex-wrap gap-2"><button disabled={ocupado} onClick={() => { setModal(item); setRecusar(false); setErroModal(""); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Eye className="h-4 w-4" />{item.estado === "pendente" ? "Analisar" : "Ver detalhes"}</button>
        {item.estado !== "pendente" && item.email_estado !== "enviado" && <button disabled={ocupado || (item.email_estado === "enviando" && new Date(item.email_reservado_ate) > new Date())} onClick={() => executar("reenviar", item)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary disabled:opacity-50"><Mail className="h-4 w-4" />Reenviar resposta</button>}
      </div>
    </li>)}</ul> : <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><ClipboardList className="mx-auto mb-3 h-10 w-10 text-primary" /><p>Nenhuma solicitação encontrada.</p></div>)}
    {modal && <Modal titulo={modal.estado === "pendente" ? "Analisar solicitação" : "Detalhes da solicitação"} ocupado={ocupado} fechar={() => { if (!trava.current) setModal(null); }}>
      <div className="mb-6 space-y-2 rounded-lg bg-primary-soft p-4 text-sm"><p><strong>Solicitante:</strong> {modal.solicitante_nome}</p><p className="break-all"><strong>E-mail:</strong> {modal.solicitante_email}</p><p className="break-all"><strong>Protocolo:</strong> {modal.id}</p><p><strong>Estado:</strong> {estados[modal.estado]}</p></div>
      {modal.estado === "pendente" ? <>
        <div className="mb-5 flex gap-3"><button disabled={ocupado} onClick={() => { setRecusar(false); setErroModal(""); }} className={`rounded-lg px-4 py-2 text-sm ${!recusar ? "bg-primary-soft text-primary" : "border border-border"}`}>Revisar e aprovar</button><button disabled={ocupado} onClick={() => { setRecusar(true); setErroModal(""); }} className={`rounded-lg px-4 py-2 text-sm ${recusar ? "bg-destructive-soft text-destructive" : "border border-border"}`}>Recusar solicitação</button></div>
        {recusar ? <form onSubmit={(evento) => { evento.preventDefault(); const campos = new FormData(evento.currentTarget); executar("decidir", modal, { decisao: "recusada", motivo: String(campos.get("motivo")).trim() }); }}><fieldset disabled={ocupado} className="space-y-5"><Campo rotulo="Motivo da recusa (enviado ao solicitante)" name="motivo" multiline rows={5} minLength={10} maxLength={1000} required />{erroModal && <p role="alert" className="text-sm text-destructive">{erroModal}</p>}<button className="rounded-lg bg-destructive px-5 py-3 text-sm font-semibold text-white">{ocupado ? "Salvando..." : "Confirmar recusa e notificar"}</button></fieldset></form>
          : <><EstadoConsulta carregando={catalogo.carregando} erro={catalogo.erro} tentarNovamente={catalogo.tentarNovamente} />{!catalogo.carregando && !catalogo.erro && <FormularioOng ong={modal.dados_ong} categorias={catalogo.categorias} ocupado={ocupado} erro={erroModal} salvar={(ong) => executar("decidir", modal, { decisao: "aprovada", ong })} cancelar={() => setModal(null)} textoSalvar="Aprovar e publicar" />}</>}
      </> : <div className="space-y-4"><h3 className="font-display text-lg font-semibold">{modal.dados_ong.name}</h3><p className="whitespace-pre-wrap text-sm">{modal.dados_ong.description}</p><p className="text-sm">{modal.dados_ong.address}</p><p className="text-sm">{modal.dados_ong.phone}</p>{modal.motivo && <p className="whitespace-pre-wrap rounded-lg bg-destructive-soft p-4 text-sm"><strong>Motivo da recusa:</strong> {modal.motivo}</p>}<p className="text-sm">E-mail: {emails[modal.email_estado]}</p><FormularioOng ong={modal.dados_ong} categorias={catalogo.categorias} somenteLeitura />{modal.ong_id && <a href={`/instituicoes/${modal.ong_id}`} className="inline-block text-sm font-semibold text-primary">Ver instituição publicada</a>}</div>}
    </Modal>}
  </>;
}
