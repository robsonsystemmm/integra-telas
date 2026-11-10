# INTEGRA: regras de responsividade

Sistema web, usado em celular, tablet e computador. Abordagem **mobile primeiro**: o layout base é o do celular, e as telas maiores acrescentam colunas e espaço.

## Breakpoints (iguais aos do DESIGN.md "Impacto Conectado")

| Faixa | Largura | Margem lateral | Observação |
|---|---|---|---|
| Celular | até 639px | 16px | Uma coluna, botões e campos em 100% da largura |
| Tablet | 640 a 1023px | 24px | Duas colunas apenas onde ajudar (formulários longos) |
| Desktop | 1024px ou mais | 32px | Menu lateral fixo, tabelas completas, container máximo de 1200px |

Telas testadas em 320, 375, 768, 1024 e 1440px.

## Regras para todas as telas

1. **Sem rolagem horizontal da página**, em nenhuma largura (a partir de 320px).
2. **Alvos de toque de 44px** de altura e largura mínimas em botões, campos, links isolados e checkboxes (o quadrado do checkbox tem 24px e o texto ao lado também é clicável). Pelo WCAG 2.2 AA o mínimo é 24px; adotamos 44px por causa do uso no celular.
3. **Texto**: corpo de 15px, nunca menor que 12px. Títulos reduzem no celular (H1 de 28px para 24px).
4. **Campos**: `autocomplete` correto (e-mail, senha atual, nova senha) e teclado certo (`type="email"`), para o celular abrir o teclado adequado.
5. **Foco visível** em todos os controles, e `prefers-reduced-motion` respeitado nas animações.
6. **Zoom de até 200%** sem perder conteúdo nem função.
7. Unidades relativas e `max-width` em vez de larguras fixas. Fonte e ícones hospedados por nós (sem CDN) para não bloquear a carga.

## Por tipo de tela

**Autenticação** (login, cadastro, confirmação de e-mail, esqueci a senha, redefinir senha, aguardando autorização, aguardando perfil, conta rejeitada, bloqueada e inativa)
- Cartão centralizado com largura máxima de 480px; no celular ocupa a largura útil, com padding de 16px.
- Botões lado a lado no desktop viram uma pilha de botões de largura total no celular (o botão principal vem primeiro).
- O CAPTCHA ocupa a largura do formulário; abaixo de 420px o selo "Proteção anti-robô" some para não apertar o texto.

**Painel do administrador** (cadastros pendentes, usuários, atribuir perfil, configurações, auditoria, minha conta)
- **Menu lateral:** fixo no desktop (a partir de 1024px); no celular e no tablet vira um menu "hambúrguer" que abre sobre a tela, com botão de fechar e foco preso dentro dele enquanto estiver aberto.
- **Tabelas (usuários, pendentes, auditoria):** tabela completa quando o espaço da própria tabela tem 900px ou mais (isso inclui o menu lateral: com menu fixo, a tabela só aparece a partir de cerca de 1230px de tela). Abaixo disso, cada linha vira um **cartão** (nome em destaque, estado, e as ações num menu "⋮" com alvo de 44px). Colunas secundárias (IP, último acesso) passam para o interior do cartão.
- **Filtros:** no celular ficam recolhidos atrás de um botão "Filtros"; a busca fica sempre visível.
- **Matriz de permissões:** no celular, uma lista de módulos que se expandem (acordeão), com os interruptores de cada ação dentro.
- **Cartões de métricas** (totais de usuários): quatro em uma linha no desktop, dois por linha no tablet, um por linha no celular.
- **Ações em massa** e botões de topo ("Exportar", "Novo"): no celular vão para uma barra fixa na parte de baixo ou para um menu.

## Como isso será implementado

- **Telas de autenticação:** Blade + Tailwind com as variáveis de `tokens.css`, mobile primeiro.
- **Painel do administrador:** Filament, que já traz menu recolhível, tabelas que viram cartões no celular e filtros em painel. Esses recursos serão configurados com o tema da paleta aprovada.
- **Testes:** um teste automatizado (Playwright) abre cada tela nas 5 larguras e falha se houver rolagem horizontal.
