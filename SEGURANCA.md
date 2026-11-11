# INTEGRA: checklist de segurança e acessibilidade

Revisão feita em 11/11/2026 sobre as 21 telas de referência (celular 390 px e computador 1280 px). A parte 1 foi verificada por script nas telas. As partes 2 e 3 são o que o Laravel precisa cumprir: cada item vira teste automático ou revisão de código antes de entrar dado real.

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
- Ainda há `<script>` e atributos `style` inline em poucas telas. No Laravel eles vão para arquivos do Vite, e a CSP fica sem `unsafe-inline`.
- Dados de demonstração ficam no `localStorage` do navegador. No sistema real nada disso é guardado no navegador.

## 2. Login e contas (Laravel)

- [ ] CSRF em todo formulário e requisição que altera dado.
- [ ] Cloudflare Turnstile validado **no servidor** (não só no navegador). Na 3ª tentativa errada o CAPTCHA passa a ser obrigatório.
- [ ] Mensagens de erro genéricas no login e na recuperação de senha (não revelam se o e-mail existe nem quantas tentativas restam).
- [ ] Limite de tentativas por e-mail e por IP (`throttle`). Bloqueio por tentativas só é desfeito por um administrador.
- [ ] Senhas com hash (Argon2id ou bcrypt); mínimo de 10 caracteres; checagem contra senhas vazadas comuns.
- [ ] Sessão: cookie `Secure`, `HttpOnly`, `SameSite=Lax`; `session()->regenerate()` no login; sessões encerradas ao inativar, bloquear ou trocar a senha.
- [ ] "Lembrar-me": token de longa duração guardado com hash, revogado ao trocar a senha.
- [ ] Confirmação de e-mail e redefinição de senha por link assinado, com validade curta (60 min) e uso único.
- [ ] Cadastro restrito ao domínio institucional configurável (+ exceções por e-mail), validado no servidor. `gmail.com` só em teste.
- [ ] Estados da conta (pendente, aguardando perfil, ativo, bloqueado, inativo, rejeitado) aplicados por middleware em toda rota, inclusive APIs e o painel Filament.
- [ ] Mínimo de 2 administradores ativos; ninguém altera o próprio perfil; só o Administrador do Sistema inativa ou reativa contas, com motivo e justificativa.
- [ ] 2FA para administradores e Financeiro **antes de qualquer dado financeiro real** (2ª etapa).

## 3. Permissões, dados e infraestrutura (Laravel)

- [ ] Acesso negado por padrão; toda ação checada no servidor (Policies + spatie/laravel-permission). Esconder botão na tela não conta como proteção.
- [ ] Alcance por linha (Meus projetos / Todos) aplicado na consulta (escopo global), não só na tela. Estar no projeto não dá acesso ao financeiro dele.
- [ ] Ação Aprovar: ninguém aprova o que ele mesmo criou ou lançou.
- [ ] `$fillable` explícito em todo modelo (sem mass assignment); validação por FormRequest.
- [ ] Banco só com Eloquent e parâmetros ligados (nada de SQL montado com texto do usuário). Saída sempre escapada (`{{ }}` no Blade, nunca `{!! !!}` com dado de usuário).
- [ ] Anexos: até 20 MB; tipo conferido pelo conteúdo (PDF, PNG, JPG), não só pela extensão; nome gerado pelo servidor; guardados fora da pasta pública, entregues por link assinado e com checagem de permissão.
- [ ] Auditoria com spatie/laravel-activitylog: quem, quando, valor antigo e novo; somente inclusão, sem editar nem apagar; retenção de 5 anos. Consulta a dado sensível também é registrada.
- [ ] Cabeçalhos: CSP sem `unsafe-inline`, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`. Só HTTPS.
- [ ] Produção: `APP_DEBUG=false`, segredos só no `.env` (fora do Git), sem Telescope/Debugbar, logs sem senha, token nem dado de menor.
- [ ] Dependências: `composer audit` e `npm audit` no CI; atualizações de segurança em dia.
- [ ] Backups criptografados e restauração testada. Plano para falha de e-mail (o Gmail é provisório).

## 4. LGPD

- [ ] Aceite dos Termos de uso e da Política de privacidade no primeiro acesso, com versão e data registradas.
- [ ] Beneficiários incluem menores: coletar só o necessário, restringir quem vê e registrar cada consulta.
- [ ] Ciclo de vida: o que acontece com os dados de quem sai da ONG (hoje: conta inativada e histórico preservado; exclusão depende da política de retenção a definir).
- [ ] Canal para pedidos do titular (acesso, correção, eliminação) e responsável (encarregado) definido.

## Como repetir a revisão das telas

O script usado nesta revisão confere idioma, títulos, landmarks, nomes acessíveis, ids duplicados, alvos de 44 px, contraste, fonte mínima, rolagem horizontal e recursos externos em cada tela, em 390 e 1280 px. Qualquer tela nova deve passar por ele antes de entrar no repositório.
