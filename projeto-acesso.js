/* INTEGRA - regras de acesso do módulo Projetos (referência, sem dependências).
   Espelha a matriz de perm.js para a linha "Cadastro do projeto" (prj_cad). No sistema real,
   a decisão é sempre tomada e validada no servidor; aqui ela só controla o que a tela mostra. */
(function () {
  'use strict';
  /* ver / editar / excluir: n = sem acesso, m = meus projetos, t = todos. criar: só com acesso a todos. */
  var PERFIS = {
    'Coordenação de Projetos': { ver: 't', editar: 't', excluir: 't', criar: true, team: 'editar' },
    'Equipe de Projetos': { ver: 'm', editar: 'm', excluir: 'n', criar: false },
    'Financeiro': { ver: 't', editar: 'n', excluir: 'n', criar: false, reprog: true, nota: 'Perfil Financeiro: o cadastro é só para consulta. Para mudar valores ou itens, peça uma reprogramação ao setor de Projetos.' },
    'Administrador do Sistema': { ver: 't', editar: 'n', excluir: 'n', criar: false, team: 'ver', nota: 'Administrador do Sistema: vê todos os projetos, só para consulta.' },
    'Visualização Geral': { ver: 't', editar: 'n', excluir: 'n', criar: false, nota: 'Perfil de visualização: o cadastro é só para consulta.' },
    'Gestor de Acessos': { ver: 'n', editar: 'n', excluir: 'n', criar: false }
  };
  var CONTEXTOS = { novo: 'Novo projeto', meu: 'Projeto existente, atribuído a mim', alheio: 'Projeto existente, não atribuído a mim' };
  var ALC = { n: 'sem acesso', m: 'meus projetos', t: 'todos os projetos' };

  window.PRJ_PERFIS = Object.keys(PERFIS);
  window.PRJ_PERFIL = function (n) { return PERFIS[n] || PERFIS['Gestor de Acessos']; };
  window.PRJ_CONTEXTOS = CONTEXTOS;
  window.PRJ_A = function () {
    var perfil = document.getElementById('perfil').value;
    var ctx = document.getElementById('contexto').value;
    var p = PERFIS[perfil] || PERFIS['Gestor de Acessos'];
    var novo = ctx === 'novo', meu = ctx === 'meu';
    var vale = function (x) { return x === 't' || (x === 'm' && meu); };
    var ver = novo ? p.criar : vale(p.ver);
    var editar = ver && (novo ? p.criar : vale(p.editar));
    var motivo = '';
    if (p.ver === 'n') motivo = 'Seu perfil não tem acesso ao módulo Projetos.';
    else if (novo && !p.criar) motivo = 'Seu perfil não cadastra projetos. Só quem tem acesso a todos os projetos cria projeto e atribui a equipe. Os projetos atribuídos a você ficam na lista de projetos.';
    else if (!novo && !vale(p.ver)) motivo = 'Este projeto não está atribuído a você, então não aparece para o seu perfil.';
    return {
      perfil: perfil, ver: ver, editar: editar, excluir: ver && !novo && vale(p.excluir),
      equipeVer: ver && (p.team === 'ver' || p.team === 'editar'), equipeEditar: ver && p.team === 'editar', /* linha "Equipe do projeto": só com acesso a todos */
      gerencia: editar && p.editar === 't', /* aprovar, validar e gerenciar listas: exige Editar com acesso a todos */
      reprog: !!p.reprog && ver && !editar, aviso: p.nota || 'Este perfil só consulta o cadastro.', motivo: motivo,
      resumo: 'Ver: ' + ALC[p.ver] + ' · Editar: ' + ALC[p.editar] + ' · Excluir: ' + ALC[p.excluir] + ' · Criar: ' + (p.criar ? 'sim' : 'não')
    };
  };
})();
