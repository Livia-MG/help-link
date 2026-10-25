import { Link } from "react-router-dom";
import { Estrutura } from "../componentes/Estrutura";
import { usePrivacidade } from "../hooks/usePrivacidade";
import { termosDeUso, politicaDePrivacidade, politicaDeCookies, versaoLegal, contatoPrivacidade } from "../dados/documentosLegais";

const documentos = { termos: termosDeUso, privacidade: politicaDePrivacidade, cookies: politicaDeCookies };

export default function DocumentoLegal({ tipo }) {
  const documento = documentos[tipo];
  const { abrirPreferencias } = usePrivacidade();
  return <Estrutura>
    <section className="border-b border-border bg-gradient-soft"><div className="container py-12 md:py-16"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Transparência · Projeto acadêmico</p><h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{documento.titulo}</h1><p className="mt-4 max-w-3xl text-muted-foreground">{documento.resumo}</p><p className="mt-3 text-sm text-muted-foreground">Versão de {versaoLegal}</p></div></section>
    <article className="container py-10"><div className="mx-auto max-w-4xl space-y-9">
      <nav aria-label="Documentos do projeto" className="flex flex-wrap gap-3 text-sm font-semibold text-primary"><Link className="underline" to="/termos-de-uso">Termos de uso</Link><Link className="underline" to="/politica-de-privacidade">Privacidade</Link><Link className="underline" to="/politica-de-cookies">Cookies</Link><button className="underline" onClick={abrirPreferencias}>Gerenciar preferências</button></nav>
      <div className="rounded-xl border border-border bg-primary-soft p-5 text-sm leading-relaxed"><strong>Protótipo de TCC — ADS, SENAI Barretos.</strong> O Help Link não é uma empresa constituída nem um serviço oficial da instituição de ensino. Para tratar dados reais fora da avaliação acadêmica, a equipe deverá revisar a operação e identificar os responsáveis por ela.</div>
      {documento.secoes.map((secao) => <section key={secao.titulo} className="space-y-4"><h2 className="font-display text-xl font-semibold md:text-2xl">{secao.titulo}</h2>
        {secao.tabela && <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[560px] border-collapse text-left text-sm"><thead className="bg-primary-soft text-primary"><tr>{secao.tabela.cabecalhos.map((cabecalho) => <th key={cabecalho} scope="col" className="p-4 font-semibold">{cabecalho}</th>)}</tr></thead><tbody className="divide-y divide-border bg-card">{secao.tabela.linhas.map((linha) => <tr key={linha[0]}>{linha.map((celula, i) => i === 0 ? <th key={i} scope="row" className="p-4 align-top font-medium">{celula}</th> : <td key={i} className="p-4 align-top leading-relaxed text-muted-foreground">{celula}</td>)}</tr>)}</tbody></table></div>}
        {secao.paragrafos?.map((paragrafo) => <p key={paragrafo} className="leading-relaxed text-muted-foreground">{paragrafo}</p>)}
        {secao.itens && <ul className="list-disc space-y-3 pl-6 leading-relaxed text-muted-foreground">{secao.itens.map((item) => <li key={item}>{item}</li>)}</ul>}
      </section>)}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-6"><h2 className="font-display text-xl font-semibold">Fale com a equipe do projeto</h2><a href={`mailto:${contatoPrivacidade}?subject=Privacidade%20Help%20Link`} className="break-all font-medium text-primary underline">{contatoPrivacidade}</a><p className="text-sm text-muted-foreground">Envie somente as informações necessárias. Não inclua senhas ou documentos pessoais no primeiro contato.</p></section>
      <section className="space-y-3 text-sm"><h2 className="font-display text-lg font-semibold">Referências oficiais</h2><ul className="space-y-2 text-primary"><li><a className="underline" href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm" target="_blank" rel="noreferrer">Lei Geral de Proteção de Dados — Lei nº 13.709/2018</a></li><li><a className="underline" href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm" target="_blank" rel="noreferrer">Marco Civil da Internet — Lei nº 12.965/2014</a></li><li><a className="underline" href="https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais" target="_blank" rel="noreferrer">Guia da ANPD sobre cookies e proteção de dados pessoais</a></li></ul></section>
    </div></article>
  </Estrutura>;
}
