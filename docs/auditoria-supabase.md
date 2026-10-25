# Auditoria da integração Supabase

Este relatório registra a integração pública anterior ao painel administrativo. Com a nova área administrativa, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` passaram a ser necessárias, além das variáveis públicas/SMTP já utilizadas. A configuração atual e os testes do painel estão em [Administração do Help Link](administracao.md).

Verificação local em 25/10/2026, usando as variáveis existentes no `.env`. Nenhuma credencial é reproduzida neste relatório. Nenhuma migration ou operação de escrita foi executada no banco remoto; o `.env` foi preservado.

## Validação final após criação das tabelas

Esta seção atualiza os achados iniciais abaixo. Após a criação das tabelas e dos dados pelo usuário, a API retornou 200 com 11 ONGs e 6 categorias. Antes de remover o arquivo estático, todos os campos das listas, categorias e cada um dos 11 detalhes foram comparados integralmente com a origem, incluindo IDs com acentos, coordenadas e ordem.

As telas passaram a consumir a API. Foram verificados em Chrome: três destaques na página inicial, 11 instituições, busca por nome, filtro de categoria, detalhe, ID com acentos, página de ONG inexistente (404), mapa com 11 marcadores, sincronização dos filtros com os marcadores, filtro de certificado e resultado vazio. Também foram simulados carregamento lento e HTTP 503, confirmando a mensagem de erro e recuperação pelo botão de nova tentativa. Nenhum erro JavaScript foi observado.

Após essas verificações, `src/dados/ongs.jsx` foi removido. Seu conteúdo original continua registrado na migration DML. O `.env` foi reduzido às variáveis efetivamente usadas, sem alterar os valores mantidos: `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER` e `SMTP_PASS`. `CONTACT_TO` era igual a `SMTP_USER` e foi removida, preservando o destinatário pelo fallback existente. As demais variáveis listadas como não utilizadas neste relatório foram removidas do arquivo local.

Para a Vercel, são necessárias as sete variáveis acima excluindo `PORT`. Não foram alteradas variáveis remotas da Vercel nem enviado e-mail de teste. O bloqueio inicial das tabelas está resolvido; as URLs SQL continuam fora do fluxo da aplicação e não foram revalidadas nesta etapa.

## Histórico da primeira verificação

## Resultado do fluxo atual

O fluxo implementado é `API Node.js → @supabase/supabase-js → Data API HTTPS → PostgreSQL`. A aplicação não abre conexões PostgreSQL diretamente e não utiliza `POSTGRES_*`. O gerenciamento de conexões por trás da Data API pertence ao Supabase.

O servidor Express real foi iniciado temporariamente para as verificações:

| Consulta | Resultado |
| --- | --- |
| `GET /api/health` | 200 |
| `GET /api/ongs` | 503 |
| `GET /api/categorias` | 503 |
| `GET /api/ongs/aba-barretos` | 503 |
| `GET /api/ongs?categoria=saude` | 503 |
| `GET /api/ongs?aceitaVoluntarios=false` | 503 |

O diagnóstico diretamente pela Data API retornou HTTP 404 e código `PGRST205` para `public.ongs`, `public.categorias` e `public.ongs_categorias`: as tabelas não estão disponíveis no cache de schema da API. Isso é compatível com migrations ainda não aplicadas nesse projeto. Se as tabelas já existirem, confira o projeto/schema escolhido e recarregue o cache do PostgREST.

O processo não falha por falta de variável: `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão preenchidas e o servidor recebeu respostas do serviço remoto. A resposta estruturada da Data API não valida a existência das tabelas nem a leitura dos registros; essa parte permanece pendente.

As telas continuam importando `src/dados/ongs.jsx`. Portanto, as ONGs visíveis no frontend ainda não comprovam que a API está funcionando.

## Teste separado das URLs PostgreSQL

Foi usado um cliente `pg` temporário fora do projeto, sem adicionar dependências à aplicação. As tentativas tinham timeout de conexão/consulta de 10 segundos e pretendiam executar somente `SELECT 1` e consultar a existência das tabelas.

| Variável | Endpoint configurado | Resultado |
| --- | --- | --- |
| `POSTGRES_URL` | Pooler, porta 6543 (transação) | Falha TLS: `SELF_SIGNED_CERT_IN_CHAIN` |
| `POSTGRES_PRISMA_URL` | Pooler, porta 6543 (transação) | Falha TLS: `SELF_SIGNED_CERT_IN_CHAIN` |
| `POSTGRES_URL_NON_POOLING` | Pooler, porta 5432 (sessão) | Falha TLS: `SELF_SIGNED_CERT_IN_CHAIN` |

Apesar do nome `NON_POOLING`, o hostname dessa variável aponta para o pooler em modo sessão, não para o endpoint direto do PostgreSQL.

Uma segunda tentativa, com `sslmode=verify-full` explícito e certificados do sistema habilitados no Node, apresentou a mesma falha. Não foi desativada a validação TLS. As tentativas falharam antes da autenticação e da execução de SQL: as senhas, o funcionamento da pool e a existência das tabelas via SQL **não foram validados**. O erro indica uma cadeia de certificados sem confiança neste ambiente; não é evidência de senha incorreta nem de pool indisponível.

Para utilizar SQL diretamente no futuro, configure o certificado CA apropriado, obtido pelo painel/documentação do Supabase, e confira a cadeia apresentada pela conexão. Essa configuração não é necessária para o caminho HTTP atual, que conseguiu receber respostas do serviço.

## Variáveis necessárias

| Variável | Uso no projeto |
| --- | --- |
| `SUPABASE_URL` | Necessária para a API de consulta |
| `SUPABASE_ANON_KEY` | Chave utilizada atualmente pela API |
| `SUPABASE_PUBLISHABLE_KEY` | Alternativa suportada à chave anon; se as duas existirem, tem prioridade. Não é preciso manter ambas |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Utilizadas pelo serviço de e-mail |
| `SMTP_SECURE` | Utilizada para configurar TLS do SMTP; mantenha o valor correspondente à porta/provedor |
| `CONTACT_TO` | Opcional: sem ela, o destinatário é `SMTP_USER` |
| `PORT` | Opcional no desenvolvimento: padrão 3001. As funções da Vercel não usam o servidor Express local |

Com a configuração atual, o conjunto mínimo do Supabase é `SUPABASE_URL` + `SUPABASE_ANON_KEY`. Para adotar a chave publicável moderna, copie o valor de `VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para `SUPABASE_PUBLISHABLE_KEY` e use essa variável no servidor. Não é necessário alterar o código para isso.

## Variáveis presentes que a aplicação não utiliza

Podem ser removidas do `.env` usado pela aplicação, considerando o código auditado:

- `POSTGRES_DATABASE`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_SUPABASE_URL`

As URLs SQL podem ser úteis em um ambiente separado de administração/migrations, mas não são exigidas por esta API. A remoção local não exclui variáveis gerenciadas pela integração na Vercel, nem altera o provisionamento do Supabase.

Os valores de `VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY` coincidem com as versões sem prefixo no `.env` auditado. O frontend não referencia nenhuma delas. Variáveis `VITE_*` podem ser incorporadas ao código do navegador quando referenciadas; os valores publicáveis/anon são próprios para uso público com RLS, mas as chaves administrativas não devem receber esse prefixo.

## Pendências para concluir a validação

1. Confirmar/aplicar no projeto conectado o DDL `supabase/migrations/20261025000100_criar_tabelas_ongs.sql` e depois o DML `supabase/migrations/20261025000200_inserir_ongs.sql`. O DDL não deve ser reaplicado caso as tabelas já existam.
2. Repetir as consultas HTTP: esperar 11 ONGs, 6 categorias e o detalhe por ID, além dos filtros.
3. Integrar as telas à API quando essa etapa for solicitada.
4. Se houver necessidade de conexão SQL direta, resolver a confiança da cadeia TLS e repetir o teste da pool antes de adotar esse caminho.

Referências oficiais: [conexões PostgreSQL e poolers](https://supabase.com/docs/guides/database/connecting-to-postgres), [chaves da API](https://supabase.com/docs/guides/getting-started/api-keys).
