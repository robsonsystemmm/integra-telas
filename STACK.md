# INTEGRA: stack e plano de etapas

Decisão de 13/11/2026: sair de Laravel + Filament e usar uma stack que rode na **Vercel**.

## Stack

| Camada | Escolha |
|---|---|
| Aplicação e telas | Next.js (TypeScript, App Router), hospedado na Vercel (região São Paulo) |
| Estilo | Tailwind com os tokens de `tokens.css`; componentes acessíveis (shadcn/ui); fonte Inter empacotada no projeto, sem CDN |
| Banco | PostgreSQL do Supabase (região São Paulo), com migrations em SQL versionadas |
| Login | Supabase Auth (e-mail e senha, confirmação de e-mail, recuperação, MFA TOTP na 2ª etapa) |
| Arquivos | Supabase Storage, bucket privado, envio direto por URL assinada |
| CAPTCHA | Cloudflare Turnstile, validado no servidor |
| E-mail | SMTP configurado no Supabase: Gmail com senha de app no teste, depois servidor da ONG |
| Permissões e auditoria | Tabelas próprias; checagem no servidor; RLS ligado e fechado como segunda barreira |
| Testes | Playwright (telas, larguras, rolagem horizontal) e testes das regras de permissão |

O que **não** vem pronto e é código nosso: estados da conta, bloqueio por tentativas, restrição ao domínio institucional, matriz de permissões com alcance por linha, auditoria e exportações. As regras estão em `REGRAS-CONTA.md` e `SEGURANCA.md`.

## Entrega do código

O sistema vive em um repositório GitHub novo (por exemplo `integra`), ligado à Vercel: cada alteração enviada gera uma versão de teste, e a `main` publica. Não é preciso rodar nada localmente nem receber zip. O repositório `integra-telas` continua como referência visual.

## Etapas

0. **Contas e ambientes:** Vercel, dois projetos Supabase (teste e produção), Turnstile, SMTP, repositório.
1. **Projeto base:** Next.js + Tailwind com os tokens, primeira publicação na Vercel.
2. **Banco:** tabelas de usuários e estados, perfis, permissões, projetos, equipe, auditoria e aceite dos termos; RLS fechado; administrador inicial.
3. **Cadastro e login:** cadastro com CAPTCHA e domínio, confirmação de e-mail, login com contagem de tentativas, recuperação de senha, telas de espera, rejeitada, bloqueada e inativa.
4. **Painel do administrador:** cadastros pendentes, usuários, perfis e permissões, configurações de acesso, auditoria, minha conta.
5. **Módulo Projetos:** cadastro, equipe, dashboard, relatórios com exportação.
6. **Testes e revisão de segurança:** checklist do `SEGURANCA.md`, incluindo a tentativa direta ao endpoint de login.
7. **2ª etapa:** 2FA e módulo Financeiro (antes de qualquer dado financeiro real).

## Pendências de decisão

- Plano pago do Supabase e da Vercel (confirmar preços e se há condição para ONG).
- Domínio institucional e e-mail definitivos da ONG.
- Hook de verificação de senha do Supabase disponível no plano escolhido (ver `SEGURANCA.md`, parte 2).
