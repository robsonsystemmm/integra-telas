/* INTEGRA - projetos de exemplo, compartilhados pela lista e pelo painel (só demonstração).
   No sistema real vêm do banco, já filtrados no servidor pelo alcance de cada pessoa. */
(function () {
  'use strict';
  var HJ = new Date(); HJ.setHours(0, 0, 0, 0);
  function dia(n) { var d = new Date(HJ); d.setDate(d.getDate() + n); return d; }
  var A = 'ana.ferreira@suaong.org.br', J = 'joao.lima@suaong.org.br', L = 'luciana.prado@suaong.org.br';
  var ETAPAS = ['Celebração', 'Estruturação', 'Execução', 'Prestação de contas', 'Encerramento'];
  var SITS = ['Rascunho', 'Ativo', 'Suspenso', 'Cancelado'];
  /* nome, instrumento, concedente, etapa, situação, responsável, término vigente (dias a partir de hoje), valor global, equipe,
     beneficiários previstos, atendidos, tipos de documento exigidos sem arquivo, dias até vencer a certidão mais próxima (null = sem), metas atrasadas */
  var LINHAS = [
    ['Esporte na Comunidade', 'Termo de fomento 0123/2025', 'Ministério do Esporte', 2, 'Ativo', A, 420, 800000, [A, J], 1000, 640, 0, 20, 0],
    ['Esporte para Todos', 'Termo de fomento 912346/2026', 'Ministério do Esporte', 1, 'Ativo', A, 610, 1000000, [A, L], 1200, 0, 3, 120, 0],
    ['Basquete nas Escolas', 'Convênio 45/2024', 'Secretaria Estadual de Esporte', 2, 'Ativo', L, 62, 420000, [L, J], 800, 710, 0, 12, 1],
    ['Judô Cidadão', 'Termo de colaboração 07/2025', 'Secretaria Municipal de Esporte', 3, 'Ativo', A, -12, 260000, [A], 300, 296, 1, -3, 0],
    ['Futsal Feminino', 'Emenda parlamentar 118/2025', 'Ministério do Esporte', 0, 'Rascunho', L, 0, 0, [L], 0, 0, 5, null, 0],
    ['Natação Inclusiva', 'Convênio 12/2023', 'Secretaria Estadual de Esporte', 4, 'Ativo', A, -200, 180000, [A, J], 400, 400, 0, null, 0],
    ['Capoeira nos Bairros', 'Termo de fomento 0456/2025', 'Instituto Parceiro (privado)', 2, 'Suspenso', L, 140, 150000, [L], 250, 90, 0, 45, 2],
    ['Vôlei de Praia Social', 'Contrato de patrocínio 03/2026', 'Instituto Parceiro (privado)', 2, 'Ativo', J, 75, 95000, [J, A], 200, 120, 0, 80, 0],
    ['Atletismo Jovem', 'Termo de colaboração 21/2025', 'Secretaria Municipal de Esporte', 1, 'Ativo', A, 520, 330000, [A, L, J], 600, 0, 2, 200, 0],
    ['Ginástica para Idosos', 'Convênio 88/2025', 'Secretaria Estadual de Esporte', 2, 'Cancelado', L, -40, 120000, [L], 150, 60, 0, null, 0],
    ['Xadrez nas Escolas', 'Termo de fomento 0777/2026', 'Ministério do Esporte', 0, 'Rascunho', J, 0, 0, [J], 0, 0, 4, null, 0],
    ['Skate e Cidadania', 'Emenda parlamentar 204/2025', 'Ministério do Esporte', 2, 'Ativo', L, 300, 540000, [L, J], 700, 380, 0, 25, 1]
  ];
  var projetos = LINHAS.map(function (r, i) {
    return { id: i + 1, nome: r[0], inst: r[1], conc: r[2], etapa: r[3], sit: r[4], resp: r[5], fim: r[6] ? dia(r[6]) : null, dias: r[6], valor: r[7], eq: r[8], benPrev: r[9], benReal: r[10], docsPend: r[11], cert: r[12], metasAtraso: r[13] };
  });
  window.PRJ_DADOS = {
    hoje: HJ, dia: dia, ETAPAS: ETAPAS, SITS: SITS, projetos: projetos,
    USER: { 'Coordenação de Projetos': A, 'Equipe de Projetos': J, 'Financeiro': 'marcos.teixeira@suaong.org.br', 'Administrador do Sistema': 'maria.souza@suaong.org.br', 'Visualização Geral': 'visualizacao@suaong.org.br', 'Gestor de Acessos': 'rodrigo.camargo@suaong.org.br' },
    /* projeto em andamento: não é rascunho, nem cancelado, nem encerrado */
    emAndamento: function (p) { return p.sit !== 'Rascunho' && p.sit !== 'Cancelado' && p.etapa < 4; }
  };
})();
