# Administração do Help Link

## Estado da entrega

O painel está em `/admin/login`, com seções de instituições, usuários e solicitações de inclusão de ONGs. Todos os usuários da plataforma têm o mesmo acesso administrativo. Não existe cadastro público de usuários, upload de imagens nem gerenciamento de categorias nesta versão. O fluxo público de solicitação e aprovação é descrito em [Solicitações de ONGs](solicitacoes-ongs.md).

A migration `supabase/migrations/20261025000300_administracao.sql` foi aplicada pelo responsável no Supabase e validada com os serviços reais. As duas migrations anteriores não devem ser reaplicadas. As 11 ONGs originais foram preservadas.

## Primeiro administrador

Depois de preencher o `.env`, execute em seu terminal:

```sh
npm run admin:criar
```

O script solicita nome, e-mail e senha, sem exibir a senha. Ele só funciona enquanto a tabela `usuarios` estiver vazia. Depois, use o painel para criar as outras contas. Não há senha padrão nem administrador permanente de teste. As contas temporárias usadas na validação foram excluídas.

## Variáveis

| Variável | Destino |
| --- | --- |
| `SUPABASE_URL` | Backend, URL do projeto |
| `SUPABASE_ANON_KEY` | Backend, consultas públicas e validação da sessão |
| `SUPABASE_SECRET_KEY` | Somente backend, Admin API e gestão de contas |
| `VITE_SUPABASE_URL` | Navegador, mesma URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | Navegador, mesma chave anon pública |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Backend, formulário de contato |
| `PORT` | Apenas servidor local, padrão 3001 |

As duas variáveis `VITE_*` são necessárias para o login implementado nesta etapa. A chave secreta jamais deve ter esse prefixo. Mantenha `.env` fora do Git e cadastre as variáveis nos ambientes correspondentes da Vercel antes do build. O deploy não foi realizado nesta entrega.

## Configuração obrigatória do Supabase Auth

1. Em Authentication → Sign In / Providers, mantenha e-mail/senha habilitado e desabilite **Allow new users to sign up**. Login social permanece fora do escopo.
2. Em Authentication → URL Configuration, configure Site URL para a origem do site. Durante desenvolvimento, use sua origem local, normalmente `http://localhost:5173`.
3. Adicione às Redirect URLs os endereços exatos usados pelo projeto, incluindo `http://localhost:5173/admin/redefinir-senha` e, se usar essa porta, `http://localhost:5174/admin/redefinir-senha`. Na publicação, adicione `https://SEU-DOMINIO/admin/redefinir-senha` e atualize Site URL. Não use curingas para produção.
4. Configure o SMTP do **Supabase Auth** com o provedor que enviará a recuperação. As variáveis SMTP da aplicação são do formulário de contato e não configuram o Auth automaticamente. É possível preencher no painel do Supabase os mesmos dados do Gmail já utilizados no projeto, observando os limites do provedor.
5. Em Email Templates → Reset Password, use assunto **Redefinir senha · Help Link** e copie o conteúdo de `supabase/templates/recuperacao-senha.html`. O link deve usar `.RedirectTo`, `.TokenHash` e `type=recovery` exatamente como no arquivo. A página troca esse token de uso único por uma sessão com `verifyOtp`; o link padrão de outro template não atende a esse fluxo.
6. Configure validade de recuperação de uma hora e senha mínima de oito caracteres. A aplicação aceita senhas de 8 a 128 caracteres; políticas mais restritivas do provedor também serão respeitadas.

O pedido de recuperação mostra resposta genérica para não revelar contas cadastradas. A redefinição exige um token válido; após alterar a senha, encerra a sessão local e volta ao login. O serviço não cria contas a partir do formulário de recuperação.

## Segurança e persistência

- Cada chamada protegida valida o token no Auth e a existência de `usuarios`, além de conferir `app_metadata.help_link_admin === true`. O navegador não decide a autorização do backend.
- O perfil acompanha `auth.users` por trigger e só existe para contas marcadas pela Admin API. Nome e e-mail são sincronizados; senhas ficam exclusivamente no Auth. Metadados comuns do usuário não concedem acesso.
- RLS permite ao usuário ler o próprio perfil, mas não gravá-lo diretamente. ONGs e categorias continuam públicas para leitura; escritas em ONGs/vínculos exigem perfil administrativo.
- A chave administrativa usa um cliente separado, sem a sessão do visitante. Listagens devolvem somente ID, nome, e-mail e datas.
- Criação/edição de instituição e categorias ocorre em uma transação via RPC. Falhas desfazem todas as alterações. IDs antigos permanecem iguais; os novos usam UUID textual. A ordem original é preservada e novas ONGs entram no final.
- Exclusões são definitivas. O backend bloqueia a autoexclusão mesmo se o UUID for enviado em maiúsculas. Excluir uma conta remove seu perfil e impede novas chamadas com a sessão antiga.
- O catálogo compartilhado é recarregado após operações no painel. Outras abas/visitantes veem as alterações ao recarregar a página; não há assinatura realtime nesta versão.

## Contratos HTTP

| Rota | Métodos | Acesso |
| --- | --- | --- |
| `/api/ongs` | GET, POST | GET público; POST administrativo |
| `/api/ongs/:id` | GET, PATCH, DELETE | GET público; demais administrativos |
| `/api/categorias` | GET | Público |
| `/api/usuarios` | GET, POST | Administrativo |
| `/api/usuarios/:id` | GET, PATCH, DELETE | Administrativo |
| `/api/autenticacao/me` | GET | Administrativo |

Todas respondem OPTIONS. Chamadas protegidas exigem `Authorization: Bearer TOKEN`; as respostas privadas usam `Cache-Control: no-store`.

Sucesso: `{ "ok": true, "data": ... }`. Erro: `{ "ok": false, "message": "..." }`. Criação retorna 201; consulta/edição, 200; exclusão, 204 sem corpo. Validação retorna 400; sessão ausente/inválida, 401; acesso negado, 403; inexistente, 404; conflito, 409; indisponibilidade, 503.

Corpo de usuário: `{ nome, email, senha }`. No PATCH, todos são opcionais e ao menos um deve ser informado. Senha vazia deve ser omitida. Campos extras são rejeitados.

Corpo de instituição mantém o formato público atual: `{ name, shortDescription, description, categories, address, neighborhood, coordinates: { lat, lng }, acceptsVolunteers, issuesCertificate, phone, image, needs }`. No POST, todos os campos são obrigatórios; `needs` pode ser uma lista vazia. No PATCH, envie os campos alterados; se enviar `coordinates`, inclua latitude e longitude. ID e ordem não são editáveis. A imagem exige HTTPS e as categorias devem existir e não se repetir.

As listagens usam o limite de linhas configurado na Data API (normalmente 1.000); busca e filtros do painel operam sobre os registros carregados. Acrescente paginação antes de expandir o catálogo além desse limite.

## Verificação

```sh
npm test
npm run lint
npm run build
```

Os testes padrão usam HTTP simulado para validar a autorização e PostgreSQL em memória via PGlite para migrations, triggers, RLS, exclusão em cascata e rollback. Não alteram o banco remoto.

```sh
npm run test:integracao
```

Esse comando é opt-in e usa o Supabase real do `.env`: cria contas e uma ONG temporárias, valida os CRUDs e remove os registros ao final. Gera um link de recuperação pela Admin API sem enviar e-mail. Execute apenas no projeto em que deseja realizar essa validação. A porta 31078 precisa estar livre. Se o processo for encerrado à força, confira a existência de registros temporários antes de repetir.

Também foram verificados no Chrome com o banco real: login válido/inválido, persistência da sessão, acesso direto protegido, CRUD dos modais, atualização do catálogo público, autoexclusão desabilitada, foco/teclado, layout em 390 px e desktop, logout e redefinição com token real. Nenhum erro JavaScript foi observado. O recebimento de e-mail real depende de concluir o SMTP/template acima e de uma conta de teste indicada pelo responsável; nenhuma mensagem de recuperação foi enviada durante os testes.

Na tentativa posterior com dois destinatários autorizados, o formulário chegou ao Auth, mas ambos os pedidos de recuperação retornaram HTTP 500 (`unexpected_failure`) em cerca de dois segundos. Não houve confirmação de envio. O diagnóstico depende do erro detalhado em Logs → Auth e da configuração do remetente/SMTP no Supabase. A conta temporária sem privilégios usada nesse teste foi removida; a conta administrativa foi preservada.

Referências: [gestão de usuários](https://supabase.com/docs/guides/auth/managing-user-data), [validação da identidade](https://supabase.com/docs/reference/javascript/auth-getuser), [SMTP do Auth](https://supabase.com/docs/guides/auth/auth-smtp).
