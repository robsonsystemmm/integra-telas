# INTEGRA: checklist de segurança e acessibilidade

Revisão feita em 11/11/2026 sobre as 21 telas de referência (celular 390 px e computador 1280 px). A parte 1 foi verificada por script nas telas. As partes 2 e 3 são o que o sistema real (Next.js na Vercel + Supabase, ver `STACK.md`) precisa cumprir: cada item vira teste automático ou revisão de código antes de entrar dado real.

## 1. Telas de referência (verificado)

| Item | Resultado |
|---|---|
| Idioma, título e `main` em todas as telas | OK (as telas de autenticação ganharam `role="main"`) |
| Campos e botões com nome acessível; imagens e ícones | OK |
| Cabeçalhos de tabela com `scope`; diálogos com nome | OK |
| Ids duplicados | Corrigido: o filtro da matriz de permissões repetia `u-q` da busca de usuário (agora `u-mq`) |
| Alvos de toque de 44 px | Corrigido: botões pequenos, seletores de demonstração, chips e link "pular para o conteúdo" subiram de 32–40 px para 44 px |
| Contraste mínimo 4,5:1 | Corrigido: texto cinza sobre fundo azul claro nas linhas ajustadas e perfil selecionado, e texto do CAPTCHA aprovado |
| Texto menor que 12 px | Corrigido: 10–11 px passou para 12 px |
| Rolagem horizontal | Corrigida na lista de projetos (célula do Responsável) |
| Recursos externos (CDN, fontes, scripts) | Nenhum. Tudo é hospedado por nós |
| Manipuladores inline (`onsubmit` etc.) | Removidos, por causa da CSP. Formulários de demonstração usam `data-demo` |
| Campos de senha | `autocomplete` correto (senha atual e nova senha); e-mail com `type="email"` |
| Links `target=_blank` | Todos com `rel="noopener"` |

Exceções conhecidas e aceitas:
- As telas de autenticação mostram vários estados lado a lado, por isso têm mais de um `h1`. No sistema real cada estado é uma página, com um só `h1`.
- Caixas de marcação têm 24 px, mas ficam dentro de um rótulo de 44 px clicável.
- Ainda há `<script>` e atributos `style` inline em poucas telas. No Next.js eles viram módulos do projeto, e a CSP usa nonce, sem `unsafe-inline`.
- Dados de demonstração ficam no `localStorage` do navegador. No sistema real nada disso é guardado no navegador.

## 2. Login e contas (Supabase Auth + Next.js)

- [ ] CSRF: Server Actions conferem a origem; rotas de API que alteram dado conferem `Origin` e usam cookie `SameSite=Lax`.
- [ ] Cloudflare Turnstile validado **no servidor** (não só no navegador). Na 3ª tentativa errada o CAPTCHA passa a ser obrigatório.
- [ ] Mensagens de erro genéricas no login e na recuperação de senha (não revelam se o e-mail existe nem quantas tentativas restam).
- [ ] Limite de tentativas por e-mail e por IP. O login passa por uma Server Action própria que conta as tentativas em tabela e só libera a conta por ação de um administrador.
- [ ] **Decisão a tomar:** a chave pública do Supabase permite chamar o endpoint de login direto, sem passar pela nossa Server Action. Para o bloqueio valer mesmo assim, usar o *hook de verificação de senha* do Supabase (conferir se o plano contratado oferece) ou exigir CAPTCHA em todo login no próprio Supabase. Testar a tentativa direta antes de entrar dado real.
- [ ] Senha: mínimo de 10 caracteres; ativar a proteção contra senhas vazadas se o plano oferecer.
- [ ] Sessão: cookies `Secure` e `SameSite=Lax` (pelo `@supabase/ssr`); no servidor, validar sempre com `getUser()`, nunca confiar só em `getSession()`; encerrar as sessões ao inativar, bloquear ou trocar a senha.
- [ ] "Lembrar-me" define a duração da sessão; sem marcar, a sessão acaba ao fechar o navegador.
- [ ] Confirmação de e-mail e redefinição de senha por link de uso único, com validade curta (60 min; ajustar a expiração do OTP no Supabase).
- [ ] Cadastro restrito ao domínio institucional configurável (+ exceções por e-mail), validado no servidor e por hook "antes de criar usuário" ou gatilho no banco. `gmail.com` só em teste.
- [ ] Estados da conta (pendente, aguardando perfil, ativo, bloqueado, inativo, rejeitado) ficam em tabela própria e são conferidos por middleware e por uma função `exigirAcesso()` em toda rota e Server Action.
- [ ] Mínimo de 2 administradores ativos; ninguém altera o próprio perfil; só o Administrador do Sistema inativa ou reativa contas, com motivo e justificativa.
- [ ] 2FA (TOTP do Supabase) para administradores e Financeiro **antes de qualquer dado financeiro real** (2ª etapa).

## 3. Permissões, dados e infraestrutura (Supabase + Vercel)

- [ ] Acesso negado por padrão; toda ação checada no servidor por uma função central (`pode(usuario, ação, projeto)`) a partir das tabelas de perfil e ajuste individual. Esconder botão na tela não conta como proteção.
- [ ] **RLS ligado em todas as tabelas, sem política = nega tudo.** Os dados só são lidos e gravados pelo servidor, com a chave `service_role`. Essa chave e qualquer segredo nunca vão para o navegador (nada de `NEXT_PUBLIC_` em segredo).
- [ ] Alcance por linha (Meus projetos / Todos) aplicado na consulta, por uma função única que monta o filtro, não só na tela. Estar no projeto não dá acesso ao financeiro dele.
- [ ] Ação Aprovar: ninguém aprova o que ele mesmo criou ou lançou.
- [ ] Toda Server Action e rota valida a entrada com um esquema (Zod) que lista os campos aceitos; campo fora da lista é descartado.
- [ ] Consultas sempre parametrizadas (supabase-js ou ORM); nada de SQL montado com texto do usuário. Nunca `dangerouslySetInnerHTML` com dado de usuário.
- [ ] Anexos: até 20 MB; bucket **privado** do Supabase Storage com limite de tamanho; envio direto do navegador por URL assinada (a Vercel limita o corpo das requisições a cerca de 4,5 MB); tipo conferido pelo conteúdo (PDF, PNG, JPG), não só pela extensão; nome gerado pelo servidor; entrega por link assinado de vida curta e com checagem de permissão.
- [ ] Auditoria em tabela própria: quem, quando, valor antigo e novo; somente inclusão (sem permissão de editar ou apagar, com gatilho que bloqueia); gravada pelo servidor e por gatilhos nas tabelas críticas; retenção de 5 anos. Consulta a dado sensível também é registrada.
- [ ] Cabeçalhos pelo Next.js: CSP com nonce, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`. Só HTTPS (a Vercel já força).
- [ ] Ambientes separados: **produção e teste usam projetos Supabase diferentes**; deploys de prévia da Vercel nunca apontam para o banco de produção e ficam protegidos por login da Vercel.
- [ ] Produção: segredos só nas variáveis de ambiente da Vercel (marcadas como sensíveis), nunca no Git; logs sem senha, token nem dado de menor; região São Paulo (funções e banco).
- [ ] Dependências: `npm audit` no CI e atualizações automáticas de segurança (Dependabot).
- [ ] Backups do Supabase (plano pago) com restauração testada, e cópia exportada periodicamente. Plano para falha de e-mail (o Gmail é provisório; usar SMTP próprio configurado no Supabase).

## 4. LGPD

- [ ] Aceite dos Termos de uso e da Política de privacidade no primeiro acesso, com versão e data registradas.
- [ ] Beneficiários incluem menores: coletar só o necessário, restringir quem vê e registrar cada consulta.
- [ ] Ciclo de vida: o que acontece com os dados de quem sai da ONG (hoje: conta inativada e histórico preservado; exclusão depende da política de retenção a definir).
- [ ] Canal para pedidos do titular (acesso, correção, eliminação) e responsável (encarregado) definido.

## Como repetir a revisão das telas

O script usado nesta revisão confere idioma, títulos, landmarks, nomes acessíveis, ids duplicados, alvos de 44 px, contraste, fonte mínima, rolagem horizontal e recursos externos em cada tela, em 390 e 1280 px. Qualquer tela nova deve passar por ele antes de entrar no repositório.

## Relatórios e exportação (PDF e XLSX)

Regra do produto: todo relatório oferece **Exportar PDF** e **Exportar XLSX**. Na referência (telas estáticas) os arquivos são gerados no navegador por `exportar.js`; no sistema real o servidor gera (sugestão: exceljs para XLSX e pdf-lib ou @react-pdf/renderer para PDF, respeitando os limites de tempo das funções da Vercel; ou manter o gerador do navegador).

- [ ] Ação nova **Exportar** na matriz (linhas Relatórios de projetos, Relatórios do Financeiro e Auditoria), separada de Visualizar. Padrão: Administrador, Coordenação e Financeiro; Equipe de Projetos e Visualização Geral veem, mas não exportam.
- [ ] O servidor confere a permissão Exportar e o alcance (Meus projetos / Todos) **a cada exportação**; esconder o botão não basta. O arquivo traz só as linhas que a pessoa pode ver.
- [ ] Cada exportação vai para a auditoria: quem, quando, relatório, formato, filtros e número de linhas.
- [ ] LGPD: relatórios de projetos trazem só números de beneficiários, nunca nomes (menores de idade); equipe sai só com nomes, sem telefone ou e-mail.
- [ ] Células que começam com `=`, `+`, `-` ou `@` recebem apóstrofo no XLSX real (injeção de fórmula). No gerador de referência todo texto sai como texto, não como fórmula.
- [ ] Limite de linhas por exportação; acima dele, gerar em fila e avisar por e-mail. Arquivo não fica guardado no servidor depois do download.
- [ ] Rodapé de todo arquivo: quem emitiu, quando e "uso restrito".

## Termos de uso e política de privacidade

- [ ] Telas públicas `termos-de-uso` e `politica-de-privacidade` (hoje **rascunho**, sem revisão jurídica). Publicar só depois de preencher os campos em amarelo (nome e CNPJ da ONG, encarregado/DPO, foro, provedores, prazos, base legal de cada finalidade).
- [ ] Aceite no cadastro é obrigatório (caixa desmarcada por padrão; o servidor rejeita se não vier marcada). Guardar **versão do documento, data/hora e IP** do aceite.
- [ ] Mudança relevante nos textos: nova versão e novo aceite no próximo login.
- [ ] Menores de idade: confirmar com o jurídico como o consentimento do responsável é coletado e guardado.
- [ ] Links dos documentos no rodapé do login e do cadastro; abrem em nova aba para não perder o formulário preenchido.
