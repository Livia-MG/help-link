
# Help Link

Frontend React/Vite e API Node.js para consulta de ONGs no Supabase e envio de contato por e-mail.

A área administrativa está em `/admin/login`. Veja [configuração, primeiro administrador, APIs e testes](docs/administracao.md). O primeiro acesso é criado com `npm run admin:criar` após configurar o Auth e as variáveis.

Visitantes podem solicitar a inclusão de uma ONG em `/solicitar-instituicao`. A equipe analisa em `/admin/solicitacoes` e o resultado é enviado por e-mail. Veja [fluxo, migration e notificações](docs/solicitacoes-ongs.md).

O protótipo acadêmico também possui termos de uso, políticas de privacidade/cookies e preferências que bloqueiam mapas externos até autorização. Veja [funcionamento e responsabilidades da equipe](docs/privacidade-e-termos.md).

Veja a [auditoria da conexão e das variáveis de ambiente](docs/auditoria-supabase.md) para os resultados da verificação remota de 25/10/2026 e a lista de variáveis necessárias. A validação final confirmou a integração das telas e a remoção dos dados estáticos.

## Desenvolvimento

Use Node.js 22 ou superior. Execute `npm ci`, copie `.env.example` para `.env` e preencha as variáveis. `npm run dev` inicia o frontend e o servidor Express (porta 3001). O Vite encaminha `/api` para esse servidor. Se alterar `PORT`, ajuste também o proxy em `vite.config.js`.

`npm run lint`, `npm test` e `npm run build` verificam código, consultas HTTP e build. Os testes usam um servidor HTTP local simulando respostas do Supabase, sem acessar um banco remoto. `npm run preview` serve apenas o build do frontend.

## Banco Supabase

1. No projeto Vercel, conecte o Supabase pela integração de Storage/Marketplace e selecione o plano gratuito disponível na sua conta.
2. No SQL Editor do projeto Supabase, execute os arquivos abaixo, na ordem. Cada arquivo contém uma transação:
   - `supabase/migrations/20261025000100_criar_tabelas_ongs.sql`: DDL, índices, permissões e políticas RLS.
   - `supabase/migrations/20261025000200_inserir_ongs.sql`: DML com as 11 ONGs, 6 categorias e 17 vínculos do catálogo original, preservado nessa migration.
3. Configure `SUPABASE_URL` e `SUPABASE_ANON_KEY` no `.env` local e nos ambientes correspondentes da Vercel. A API também aceita `SUPABASE_PUBLISHABLE_KEY` como alternativa à chave anon. Se a integração fornecer nomes diferentes, cadastre os nomes esperados pela API.

Alternativamente, com a CLI Supabase instalada, execute `supabase init` uma vez, `supabase link --project-ref SEU_PROJECT_REF` e `supabase db push`. Não misture execução manual e CLI sem conciliar o histórico de migrations. O DDL deve ser executado uma única vez; o DML ignora IDs já cadastrados e não sobrescreve edições futuras.

As tabelas e serviços usam português. IDs, textos, coordenadas, necessidades e ordem de exibição foram preservados. `ongs_categorias` relaciona ONGs a categorias com chaves estrangeiras. O catálogo é público: RLS e permissões permitem somente SELECT para `anon` e `authenticated`. Inserções, alterações e exclusões exigem acesso administrativo. A chave publicável é suficiente para essas consultas; não é necessário usar `service_role` nem chave secreta administrativa.

As variáveis Supabase são lidas pelo servidor, sem prefixo `VITE_`. A ausência de configuração ou uma falha de consulta resulta em HTTP 503, sem retornar detalhes internos para o cliente.

## Rotas de consulta

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/api/ongs` | Lista de ONGs na ordem original |
| GET | `/api/ongs/:id` | Detalhes da ONG pelo ID textual original |
| GET | `/api/categorias` | Categorias no formato `{ id, nome }` |

A listagem aceita os filtros opcionais `categoria` (ID), `bairro` (nome exato), `aceitaVoluntarios` e `emiteCertificado` (literais `true` ou `false`). Eles podem ser combinados:

```text
/api/ongs?categoria=saude&bairro=Centro&aceitaVoluntarios=true
/api/ongs/aba-barretos
```

Codifique IDs com acentos usando `encodeURIComponent(id)`. As respostas de sucesso têm `{ ok: true, data: [...] }` na listagem e `{ ok: true, data: {...} }` no detalhe. O objeto de ONG mantém os campos já usados pelo frontend: `id`, `name`, `shortDescription`, `description`, `categories`, `address`, `neighborhood`, `coordinates: { lat, lng }`, `acceptsVolunteers`, `issuesCertificate`, `phone`, `image` e `needs`.

Filtros inválidos retornam 400; ID não encontrado, 404; métodos de escrita, 405; indisponibilidade do banco, 503. Listas sem resultados retornam 200 e `data: []`. Erros seguem `{ ok: false, message: "..." }`. As rotas também respondem OPTIONS. A listagem inicial não tem paginação: o limite padrão de linhas do Supabase se aplica; acrescente paginação antes de expandir o catálogo além desse limite.

Os handlers em `api/` são usados pela Vercel; `server/servidor.js` reutiliza os mesmos handlers em desenvolvimento. O serviço de contato existente permanece em `/api/contato`.

## Publicação

Importe o repositório na Vercel com o preset Vite, build `npm run build` e saída `dist`. Os arquivos de `api/` são publicados como funções Node.js. `vercel.json` encaminha as rotas do frontend para `index.html`, preservando `/api`. Configure as variáveis Supabase e SMTP antes do deploy e faça um novo deploy após alterar variáveis.

As páginas Início, Instituições e Explorar carregam ONGs e categorias da API por um catálogo compartilhado em memória durante a navegação. A página de detalhes consulta `/api/ongs/:id`. As telas exibem carregamento, erro com nova tentativa e resultados vazios; os filtros são aplicados sobre a lista recebida do banco. Não existe fallback para dados locais. O arquivo estático `src/dados/ongs.jsx` foi removido após comparar integralmente seus dados com os registros remotos.

Para o deploy atual, configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER` e `SMTP_PASS`. `CONTACT_TO` só é necessário se o destinatário for diferente de `SMTP_USER`. `PORT` permanece apenas no desenvolvimento local; não precisa ser cadastrado para as funções Vercel. A chave administrativa fica exclusivamente no backend. Nenhuma variável `POSTGRES_*` ou `VITE_PUBLIC_SUPABASE_*` é usada nesse fluxo.

As migrations não são executadas automaticamente no build e nenhum banco remoto é alterado por `npm run dev` ou pelos testes. As tabelas já criadas no projeto atual não precisam de nova execução do DDL.

## Diagnóstico do contato por e-mail

O formulário aguarda o servidor SMTP aceitar o envio antes de mostrar sucesso. Isso não confirma a chegada à caixa de entrada, que depende do provedor. O serviço utiliza limites de 10 segundos para DNS, conexão e saudação, e 20 segundos de inatividade no socket; esses limites são por etapa, não um prazo total para a requisição. Um timeout retorna HTTP 504 sem confirmar o envio.

Os logs de sucesso registram `duracaoMs` (tempo total), `envelopeMs` (negociação do envelope após a conexão/autenticação), `mensagemMs` (transmissão da mensagem e resposta SMTP) e `tamanhoBytes`. Falhas registram duração, código e comando SMTP, sem incluir o texto do contato ou credenciais. Use esses dados da tentativa real para localizar a etapa lenta.

Na verificação local de 25/10/2026, DNS levou cerca de 88 ms e conexão/TLS/autenticação com o Gmail, 1,3 segundo, sem enviar e-mail. A montagem local da mensagem levou cerca de 15 ms. O logo específico para e-mail, `public/icone-help-link-email.png`, preserva a imagem original em 96×96 pixels e reduziu o tamanho da mensagem de aproximadamente 470 KB para 14 KB. As imagens do site permanecem com seus arquivos originais.

Referências: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [chaves Supabase](https://supabase.com/docs/guides/getting-started/api-keys) e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
