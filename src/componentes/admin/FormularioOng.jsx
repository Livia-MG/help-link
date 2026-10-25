import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Campo } from "./Campo";
import { formatarTelefone } from "../../lib/telefone";

export function FormularioOng({ ong, categorias, salvar, cancelar, ocupado, erro, children, textoSalvar, textoCancelar = "Cancelar", somenteLeitura = false }) {
  const [imagem, setImagem] = useState(ong?.image || "");
  const [telefone, setTelefone] = useState(() => formatarTelefone(ong?.phone));
  const [necessidades, setNecessidades] = useState(() => ong?.needs?.length ? ong.needs : [""]);
  const [erroLocal, setErroLocal] = useState("");
  function validarCampos(formulario) {
    formulario.querySelectorAll("input[required], textarea[required]").forEach((campo) => {
      campo.setCustomValidity(campo.value.trim() ? "" : "Preencha este campo.");
    });
    const categorias = [...formulario.querySelectorAll('input[name="categories"]')];
    categorias[0]?.setCustomValidity(categorias.some((campo) => campo.checked) ? "" : "Selecione ao menos uma categoria.");
  }
  function enviar(evento) {
    evento.preventDefault();
    if (ocupado || somenteLeitura) return;
    validarCampos(evento.currentTarget);
    if (!evento.currentTarget.reportValidity()) return;
    const campos = new FormData(evento.currentTarget);
    const categories = campos.getAll("categories");
    if (!categories.length) { setErroLocal("Selecione ao menos uma categoria."); return; }
    if (!necessidades.length || necessidades.some((item) => !item.trim())) {
      setErroLocal("Informe ao menos uma necessidade e preencha todos os itens adicionados."); return;
    }
    setErroLocal("");
    salvar({
      ...Object.fromEntries(["name", "shortDescription", "description", "address", "neighborhood", "phone"].map((chave) => [chave, String(campos.get(chave)).trim()])),
      image: imagem.trim(), categories,
      coordinates: { lat: Number(campos.get("latitude")), lng: Number(campos.get("longitude")) },
      acceptsVolunteers: campos.has("acceptsVolunteers"), issuesCertificate: campos.has("issuesCertificate"),
      needs: necessidades.map((item) => item.trim()).filter(Boolean),
    }, campos);
  }
  return <form onSubmit={enviar} onInput={(evento) => validarCampos(evento.currentTarget)}><fieldset disabled={ocupado || somenteLeitura} className="space-y-5">
    {children}
    <Campo rotulo="Nome da instituição" name="name" defaultValue={ong?.name || ""} required maxLength={200} />
    <Campo rotulo="Descrição curta" name="shortDescription" defaultValue={ong?.shortDescription || ""} multiline rows={2} required maxLength={500} />
    <Campo rotulo="Descrição completa" name="description" defaultValue={ong?.description || ""} multiline rows={4} required maxLength={10000} />
    <fieldset className="rounded-lg border border-border p-4"><legend className="px-1 text-sm font-medium">Categorias</legend><div className="grid grid-cols-2 gap-3">
      {categorias.map((categoria) => <label key={categoria.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="categories" value={categoria.id} defaultChecked={ong?.categories.includes(categoria.id)} className="accent-[var(--primary)]" />{categoria.nome}</label>)}
    </div></fieldset>
    <Campo rotulo="Endereço" name="address" defaultValue={ong?.address || ""} required maxLength={500} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo rotulo="Bairro" name="neighborhood" defaultValue={ong?.neighborhood || ""} required maxLength={120} />
      <Campo rotulo="Telefone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(17) 99999-9999" value={telefone} onChange={(evento) => setTelefone(formatarTelefone(evento.target.value))} pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}" title="Informe o DDD e o telefone completo, com 10 ou 11 dígitos." required maxLength={15} />
      <Campo rotulo="Latitude" name="latitude" type="number" step="any" min={-90} max={90} defaultValue={ong?.coordinates.lat ?? ""} required />
      <Campo rotulo="Longitude" name="longitude" type="number" step="any" min={-180} max={180} defaultValue={ong?.coordinates.lng ?? ""} required />
    </div>
    <Campo rotulo="URL da imagem (HTTPS)" name="image" type="url" pattern="https://.*" value={imagem} onChange={(evento) => setImagem(evento.target.value)} required maxLength={2048} />
    {imagem.startsWith("https://") && <div className="h-36 overflow-hidden rounded-lg bg-muted"><img key={imagem} src={imagem} alt="Prévia da imagem da instituição" className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={(evento) => { evento.currentTarget.style.visibility = "hidden"; }} /></div>}
    <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Necessidades</legend>
      {necessidades.map((item, indice) => <div key={indice} className="flex gap-2">
        <input aria-label={`Necessidade ${indice + 1}`} value={item} required maxLength={200} onChange={(evento) => setNecessidades((lista) => lista.map((valor, i) => i === indice ? evento.target.value : valor))} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button type="button" disabled={necessidades.length === 1} aria-label={`Remover necessidade ${indice + 1}`} onClick={() => setNecessidades((lista) => lista.filter((_, i) => i !== indice))} className="rounded-lg p-2 text-destructive hover:bg-destructive-soft disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
      </div>)}
      <button type="button" disabled={necessidades.length >= 50} onClick={() => setNecessidades((lista) => [...lista, ""])} className="inline-flex items-center gap-1 text-sm font-medium text-primary"><Plus className="h-4 w-4" />Adicionar necessidade</button>
    </fieldset>
    <div className="flex flex-wrap gap-5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="acceptsVolunteers" defaultChecked={ong?.acceptsVolunteers} />Aceita voluntários</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="issuesCertificate" defaultChecked={ong?.issuesCertificate} />Emite certificado</label>
    </div>
    {(erro || erroLocal) && <p role="alert" className="text-sm text-destructive">{erro || erroLocal}</p>}
    {!somenteLeitura && <div className="flex justify-end gap-3 border-t border-border pt-5">
      <button type="button" onClick={cancelar} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold">{textoCancelar}</button>
      <button className="rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{ocupado ? "Salvando..." : textoSalvar || (ong ? "Salvar alterações" : "Criar instituição")}</button>
    </div>}
  </fieldset></form>;
}
