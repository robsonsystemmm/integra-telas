# Regras de conta: quem sai da ONG

Decisão (11/11/2026): só o **Administrador do Sistema** (usuário master) inativa ou reativa contas, e sempre com motivo e justificativa.

## Inativar
- Quem pode: Administrador do Sistema. O Gestor de Acessos não vê a ação.
- Obrigatórios: motivo (lista), último dia na ONG e justificativa (mínimo 10 caracteres).
- Efeito: perde o acesso na hora e as sessões abertas são encerradas. Nada é apagado: histórico, lançamentos e auditoria ficam (LGPD, retenção de 5 anos).
- O nome continua nos projetos em que atuou, marcado como inativo.
- Se a pessoa é Responsável por projeto em andamento, o aviso lista os projetos. Eles ficam sem responsável até a coordenação designar outra pessoa.
- Ninguém inativa a própria conta. Não pode haver menos de 2 administradores ativos.
- A justificativa fica só na auditoria e não é mostrada à pessoa.

## Reativar
- Só o Administrador do Sistema, com justificativa. Volta ao estado Ativo com o perfil que tinha.

## Auditoria
Cada inativação ou reativação registra quem fez, quando, estado antigo e novo, motivo, último dia e justificativa.

## Em aberto
- Excluir dados pessoais de quem saiu: fica para a política de retenção da LGPD.
- Hospedagem: não definida, por enquanto só o front-end está sendo construído.

## Anexos
Limite de 20 MB por arquivo (decisão de 11/11/2026). Tipos: PDF, PNG e JPG. O servidor também precisa validar tipo e tamanho (upload_max_filesize e post_max_size do PHP em 20 MB ou mais).

## Responsáveis e equipe do projeto (11/11/2026)
- Todo projeto tem 1 Responsável principal (campo do cadastro). A equipe pode ter outros Responsáveis (opcional) e vários membros, qualquer pessoa cadastrada no sistema.
- O primeiro Responsável é o principal, escolhido no cadastro. Os demais são atribuídos na tela Equipe do projeto.
- Só perfis que editam projetos (Coordenação e Equipe de Projetos) podem ser Responsáveis.
- O principal só muda no campo Responsável principal; quem era principal continua na equipe. Outros Responsáveis e membros podem ser retirados livremente.
- Funções no projeto: a lista é editável (botão + no cadastro ou "Gerenciar listas"). Uma pessoa pode ter várias funções no mesmo projeto. "Responsável" é fixa e é a que dá a função de Responsável; as demais são descritivas e contam como Equipe.

## Projeto sem responsável ativo (11/11/2026)
- Se o Responsável principal fica com a conta inativa ou bloqueada, o projeto é marcado como "Sem responsável ativo": alerta urgente no Painel e etiqueta na lista de projetos.
- A coordenação resolve escolhendo outra pessoa no campo Responsável principal (no cadastro ou na tela Equipe do projeto).

## Ação Aprovar (11/11/2026)
- Nova ação na matriz, ao lado de Visualizar, Criar, Editar e Excluir. Existe em: Projetos > Cadastro (aditivos e documentos), Projetos > Prestação de contas, Financeiro > Orçamento (remanejamentos) e Financeiro > Lançamentos (pagamentos).
- Perfis: Coordenação de Projetos aprova em Projetos (todos os projetos); Financeiro aprova em Orçamento e Lançamentos; Equipe de Projetos, Administrador do Sistema, Gestor de Acessos e Visualização Geral não aprovam por padrão. Qualquer perfil pode receber a ação por ajuste individual.
- Regra proposta para o servidor: ninguém aprova o que ele mesmo criou ou lançou.
