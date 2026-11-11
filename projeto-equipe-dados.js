/* INTEGRA - dados de demonstração compartilhados entre o cadastro do projeto e a tela "Equipe do projeto".
   No sistema real isto é uma tabela (project_user) no banco, e o servidor valida cada gravação.
   Aqui o estado fica no navegador (localStorage) para as duas telas enxergarem a mesma equipe. */
(function () {
  'use strict';
  var KEY = 'integra.projeto.equipe.v1';
  var USUARIOS = [
    { name: 'Ana Lúcia Ferreira', email: 'ana.ferreira@suaong.org.br', st: 'ativo', perfil: 'Coordenação de Projetos', who: 'Coordenação de Projetos' },
    { name: 'João Lima', email: 'joao.lima@suaong.org.br', st: 'ativo', perfil: 'Equipe de Projetos', who: 'Equipe de Projetos' },
    { name: 'Luciana Prado', email: 'luciana.prado@suaong.org.br', st: 'ativo', perfil: 'Equipe de Projetos', who: 'Equipe de Projetos' },
    { name: 'Marcos Teixeira', email: 'marcos.teixeira@suaong.org.br', st: 'ativo', perfil: 'Financeiro', who: 'Financeiro' },
    { name: 'Carlos Eduardo Mendes', email: 'carlos.mendes@suaong.org.br', st: 'bloqueado', perfil: 'Equipe de Projetos', who: 'Equipe de Projetos', off: 'Conta bloqueada' },
    { name: 'Felipe Albuquerque', email: 'felipe.albuquerque@suaong.org.br', st: 'perfil', perfil: '', who: '', off: 'Ainda sem perfil de acesso' }
  ];
  var PERFIS_EDITAM = ['Coordenação de Projetos', 'Equipe de Projetos']; /* quem pode ser Responsável: perfis que editam projetos */
  var EXEMPLO = { nome: 'Esporte na Comunidade', equipe: [{ email: 'ana.ferreira@suaong.org.br', role: 'Responsável' }, { email: 'joao.lima@suaong.org.br', role: 'Equipe' }] };
  var mem = null, ouvintes = [];

  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function ler() {
    try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { /* sem armazenamento */ }
    return mem || copia(EXEMPLO);
  }
  function gravar(d) {
    mem = d;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* segue em memória */ }
    ouvintes.forEach(function (f) { f(); });
  }
  function usuario(email) { return USUARIOS.filter(function (u) { return u.email === email; })[0]; }
  function porNome(n) { return USUARIOS.filter(function (u) { return u.name === n; })[0]; }
  function ativo(u) { return u.st === 'ativo' && u.perfil; }

  var E = {
    usuarios: USUARIOS,
    usuario: usuario, porNome: porNome,
    nome: function () { return ler().nome; },
    equipe: function () { var p = false; return ler().equipe.map(function (m) { var u = usuario(m.email) || { name: m.email }, pr = m.role === 'Responsável' && !p; if (pr) p = true; return { name: u.name, email: m.email, role: m.role, principal: pr }; }); },
    /* todos os Responsáveis (o projeto pode ter mais de um; o primeiro é o principal) */
    responsaveis: function () { return E.equipe().filter(function (m) { return m.role === 'Responsável'; }); },
    responsavel: function () { return E.equipe().filter(function (m) { return m.role === 'Responsável'; })[0] || null; },
    /* quem pode ser Responsável no cadastro: conta ativa com perfil que edita projetos */
    elegiveisResponsavel: function () { return USUARIOS.filter(function (u) { return ativo(u) && PERFIS_EDITAM.indexOf(u.perfil) >= 0; }); },
    zerar: function (nome) { gravar({ nome: nome || '', equipe: [] }); },
    setNome: function (n) { var d = ler(); if (d.nome !== n) { d.nome = n; gravar(d); } },
    /* devolve { erro } ou {}. O projeto pode ter vários Responsáveis; principal=true coloca esta pessoa como a principal */
    atribuir: function (email, role, principal) {
      var u = usuario(email), d = ler();
      if (!u || !ativo(u)) return { erro: 'Só quem tem conta ativa e perfil pode ser atribuído.' };
      if (role === 'Responsável' && PERFIS_EDITAM.indexOf(u.perfil) < 0) return { erro: u.name + ' tem o perfil ' + u.perfil + ', que não edita projetos. O Responsável precisa de um perfil de Projetos.' };
      var ja = d.equipe.filter(function (m) { return m.email === email; })[0];
      if (ja) ja.role = role; else d.equipe.push({ email: email, role: role });
      if (role === 'Responsável' && principal) { var i = d.equipe.map(function (m) { return m.email; }).indexOf(email); d.equipe.unshift(d.equipe.splice(i, 1)[0]); }
      gravar(d); return {};
    },
    retirar: function (email) {
      var d = ler(), m = d.equipe.filter(function (x) { return x.email === email; })[0];
      if (m && m.role === 'Responsável' && E.responsaveis().length < 2) return { erro: 'O projeto precisa de pelo menos um Responsável. Atribua outra pessoa como Responsável antes de retirar esta.' };
      d.equipe = d.equipe.filter(function (x) { return x.email !== email; }); gravar(d); return {};
    },
    onChange: function (f) { ouvintes.push(f); }
  };
  window.addEventListener('storage', function (e) { if (e.key === KEY) ouvintes.forEach(function (f) { f(); }); });
  window.PRJ_EQUIPE = E;
})();
