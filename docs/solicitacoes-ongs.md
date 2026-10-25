# Solicitações de inclusão de ONGs

## Fluxo

1. O visitante acessa `/solicitar-instituicao`, disponível na lista de instituições e no rodapé. Não precisa criar uma conta.
2. Preenche nome/e-mail de contato e os mesmos campos do cadastro administrativo da ONG. Os dados de contato não serão publicados.
3. O backend valida o formulário e as categorias, salva em `solicitacoes_ongs` como `pendente` e devolve um protocolo. A ONG ainda não existe no catálogo público. O recebimento é confirmado na tela; não há e-mail automático nessa etapa.
4. Um administrador entra em `/admin/solicitacoes` e abre **Analisar**. Pode corrigir os dados antes de **Aprovar e publicar**, ou escolher **Recusar solicitação** e preencher um motivo de 10 a 1.000 caracteres. O botão **Atualizar lista** carrega novos pedidos; não há atualização realtime.
5. A aprovação cria a ONG e seus vínculos, registra o administrador/data e encerra a pendência em uma transação. A recusa encerra a pendência sem publicar a ONG. O histórico pode ser consultado pelos filtros de estado.
6. A decisão gera um e-mail ao solicitante. Se o SMTP falhar, a decisão permanece salva e o painel oferece **Reenviar resposta**. Uma solicitação já analisada não pode ser aprovada/recusada novamente.

## Banco e configuração

A migration `supabase/migrations/20261025000400_solicitacoes_ongs.sql` adiciona a tabela, índices, RLS e funções transacionais. Foi aplicada no projeto atual pelo responsável e validada com o Supabase real. Não reaplique as migrations anteriores.

Anon e usuários comuns não podem consultar solicitações nem gravar diretamente na tabela. O POST público usa o backend com validação; somente administradores podem ler dados de contato, analisar ou reenviar respostas. IPs são persistidos somente como HMAC, sem o endereço em texto, e não são retornados na API administrativa.

Há limite persistente de cinco solicitações por IP/hora e três por e-mail/dia, contando registros ainda existentes, inclusive já analisados. O limite retorna HTTP 429. Há também um campo invisível de honeypot. Esses controles continuam ativos entre diferentes instâncias da API.

## E-mails

O Custom SMTP do **Supabase Auth** atende a mensagens de autenticação. Ele não oferece uma API de e-mails arbitrários de aprovação/recusa. As notificações desta funcionalidade usam o **mesmo provedor Gmail e a mesma configuração SMTP**, pelo Node.js/Nodemailer, com as variáveis já existentes `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER` e `SMTP_PASS`. Não são necessários novos serviços nem criação de contas Auth para os solicitantes.

As mensagens incluem nome da ONG, protocolo, resultado e, na recusa, o motivo informado pelo administrador. O conteúdo fornecido pelo visitante é escapado no HTML. Não há anexos pesados.

O painel registra estado do e-mail, tentativas, data de aceitação pelo SMTP e código de falha, sem armazenar credenciais. Uma reserva de cinco minutos evita envios simultâneos; após expirar, uma tentativa interrompida pode ser retomada pelo painel. Não há job de reenvio automático nesta versão.

O estado **Resposta enviada** indica aceitação pelo SMTP, não confirmação de chegada à caixa de entrada. Se o processo cair após o SMTP aceitar a mensagem e antes de registrar o sucesso, uma nova tentativa pode gerar duplicidade; o SMTP não permite garantir entrega exatamente uma vez.

## APIs

| Rota | Método | Acesso e resultado |
| --- | --- | --- |
| `/api/solicitacoes` | POST | Público; cria pendência e retorna 201 com `{ id, estado }` |
| `/api/solicitacoes` | GET | Administrador; lista solicitações da mais recente para a mais antiga |
| `/api/solicitacoes/:id` | GET | Administrador; consulta detalhes e estado de notificação |
| `/api/solicitacoes/:id` | PATCH | Administrador; analisa e retorna decisão salva + resultado da notificação |
| `/api/solicitacoes/:id/reenviar` | POST | Administrador; tenta enviar resposta já decidida |

POST público: `{ solicitanteNome, solicitanteEmail, ong, website? }`. `ong` segue exatamente o formato usado no CRUD administrativo. O servidor ignora solicitações com honeypot preenchido e não devolve os dados de contato na resposta pública.

PATCH de aprovação: `{ decisao: "aprovada", ong: { ...camposRevisados } }`.

PATCH de recusa: `{ decisao: "recusada", motivo: "Justificativa com pelo menos 10 caracteres" }`.

Respostas seguem `{ ok: true, data }` e `{ ok: false, message }`. Validação: 400; ausência de sessão: 401; acesso negado: 403; protocolo inexistente: 404; decisão repetida: 409; limite público: 429. Dados de solicitantes não são acessíveis por uma página pública de consulta de protocolo.

A listagem administrativa tem o limite de linhas configurado na Data API, assim como as demais listagens do projeto. A página pública e as consultas administrativas usam o mesmo formulário; o histórico analisado é exibido somente para leitura.

## Validação

```sh
npm test
npm run lint
npm run build
npm run test:solicitacoes
```

Os testes padrão cobrem validação/autorização HTTP, privacidade por RLS, limites, rollback, decisão única, recusa sem publicação e reservas de notificação. O último comando usa o Supabase real, cria dados temporários, simula o SMTP (incluindo falha e reenvio) e remove seus registros ao terminar. A porta 31081 precisa estar livre.

```sh
npm run test:solicitacoes -- --email-real
```

A opção acima envia dois e-mails reais, de aprovação e recusa, **somente para o endereço configurado em `SMTP_USER`**. Use-a apenas quando desejar esse envio. Essa validação foi executada nesta entrega e o Google SMTP aceitou as duas mensagens. Os registros temporários foram removidos.

Referência: [SMTP do Supabase Auth](https://supabase.com/docs/guides/auth/auth-smtp).
