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
  /* estado das contas alterado na tela Usuários (inativar, reativar): guardado para as outras telas enxergarem */
  var SKEY = 'integra.usuarios.estado.v1';
  try { var ov = JSON.parse(localStorage.getItem(SKEY) || '{}'); USUARIOS.forEach(function (u) { if (ov[u.email]) { u.st = ov[u.email].st; u.off = ov[u.email].off; } }); } catch (e) { /* sem armazenamento */ }
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

  /* catálogo de funções no projeto (editável pelo "+"). "Responsável" é fixa: é a que dá a função de Responsável. */
  var FKEY = 'integra.projeto.funcoes.v1';
  var FUNCS = [{ n: 'Responsável', a: 1, fixa: 1 }, { n: 'Equipe', a: 1 }, { n: 'Coordenador de núcleo', a: 1 }, { n: 'Educador', a: 1 }, { n: 'Apoio administrativo', a: 1 }];
  try { var fs = JSON.parse(localStorage.getItem(FKEY) || 'null'); if (fs && fs.length) { FUNCS.length = 0; fs.forEach(function (x) { FUNCS.push(x); }); } } catch (e) { /* segue com o padrão */ }

  var E = {
    FUNCS: FUNCS,
    salvarFuncoes: function () { try { localStorage.setItem(FKEY, JSON.stringify(FUNCS)); } catch (e) { /* sem armazenamento */ } },
    /* troca o Responsável principal; quem era principal continua na equipe. Devolve { erro } ou { anterior } */
    trocarPrincipal: function (email) {
      var old = E.responsavel(), r = E.atribuir(email, 'Responsável', true);
      if (r.erro) return r;
      if (old && old.email !== email) { var fs2 = old.funcoes.filter(function (x) { return x !== 'Responsável'; }); E.definir(old.email, fs2.length ? fs2 : ['Equipe']); return { anterior: old }; }
      return {};
    },
    usuarios: USUARIOS,
    /* st: 'ativo' | 'inativo' | 'bloqueado' */
    setEstado: function (email, st) {
      var off = st === 'inativo' ? 'Conta inativa' : st === 'bloqueado' ? 'Conta bloqueada' : '';
      var u = usuario(email); if (u) { u.st = st; u.off = off; }
      try { var ov = JSON.parse(localStorage.getItem(SKEY) || '{}'); if (st === 'ativo') delete ov[email]; else ov[email] = { st: st, off: off }; localStorage.setItem(SKEY, JSON.stringify(ov)); } catch (e) { /* sem armazenamento */ }
    },
    /* o Responsável do projeto precisa de conta ativa; senão o projeto fica sem responsável */
    semResponsavel: function (email) { var u = usuario(email); return !u || u.st !== 'ativo'; },
    motivoSemResp: function (email) { var u = usuario(email); return !u ? 'pessoa não encontrada' : u.st === 'inativo' ? 'conta inativa' : u.st === 'bloqueado' ? 'conta bloqueada' : 'conta sem acesso'; },
    usuario: usuario, porNome: porNome,
    nome: function () { return ler().nome; },
    equipe: function () { var p = false; return ler().equipe.map(function (m) { var u = usuario(m.email) || { name: m.email }, pr = m.role === 'Responsável' && !p; if (pr) p = true; return { name: u.name, email: m.email, role: m.role, principal: pr, funcoes: (m.funcoes && m.funcoes.length) ? m.funcoes.slice() : [m.role] }; }); },
    /* todos os Responsáveis (o projeto pode ter mais de um; o primeiro é o principal) */
    responsaveis: function () { return E.equipe().filter(function (m) { return m.role === 'Responsável'; }); },
    responsavel: function () { return E.equipe().filter(function (m) { return m.role === 'Responsável'; })[0] || null; },
    /* quem pode ser Responsável no cadastro: conta ativa com perfil que edita projetos */
    elegiveisResponsavel: function () { return USUARIOS.filter(function (u) { return ativo(u) && PERFIS_EDITAM.indexOf(u.perfil) >= 0; }); },
    zerar: function (nome) { gravar({ nome: nome || '', equipe: [] }); },
    setNome: function (n) { var d = ler(); if (d.nome !== n) { d.nome = n; gravar(d); } },
    /* devolve { erro } ou {}. O projeto pode ter vários Responsáveis; principal=true coloca esta pessoa como a principal */
    /* funcoes: lista de funções da pessoa no projeto (uma pessoa pode ter várias). 'Responsável' dá a função de Responsável; as demais são Equipe. */
    definir: function (email, funcoes, principal) {
      var u = usuario(email), d = ler();
      if (!u) return { erro: 'Pessoa não encontrada entre os usuários cadastrados.' };
      if (!funcoes || !funcoes.length) return { erro: 'Escolha pelo menos uma função no projeto.' };
      var resp = funcoes.indexOf('Responsável') >= 0, ja = d.equipe.filter(function (m) { return m.email === email; })[0];
      if (resp && !(ativo(u) && PERFIS_EDITAM.indexOf(u.perfil) >= 0)) return { erro: u.name + (ativo(u) ? ' tem o perfil ' + u.perfil + ', que não edita projetos.' : ' ainda não tem conta ativa com perfil.') + ' O Responsável precisa de conta ativa e perfil de Projetos.' };
      if (ja && !resp && E.responsaveis().length && E.responsaveis()[0].email === email) return { erro: 'Este é o Responsável principal. Para trocar, escolha outra pessoa no campo Responsável principal.' };
      var role = resp ? 'Responsável' : 'Equipe';
      if (ja) { ja.role = role; ja.funcoes = funcoes.slice(); } else d.equipe.push({ email: email, role: role, funcoes: funcoes.slice() });
      if (resp && principal) { var i = d.equipe.map(function (m) { return m.email; }).indexOf(email); d.equipe.unshift(d.equipe.splice(i, 1)[0]); }
      gravar(d); return {};
    },
    atribuir: function (email, role, principal) {
      var u = usuario(email), d = ler();
      if (!u) return { erro: 'Pessoa não encontrada entre os usuários cadastrados.' };
      if (role === 'Responsável' && !(ativo(u) && PERFIS_EDITAM.indexOf(u.perfil) >= 0)) return { erro: u.name + (ativo(u) ? ' tem o perfil ' + u.perfil + ', que não edita projetos.' : ' ainda não tem conta ativa com perfil.') + ' O Responsável precisa de conta ativa e perfil de Projetos.' };
      var ja = d.equipe.filter(function (m) { return m.email === email; })[0];
      if (ja) { ja.role = role; var fs = (ja.funcoes || []).filter(function (x) { return x !== 'Responsável' && x !== 'Equipe'; }); ja.funcoes = (role === 'Responsável' ? ['Responsável'] : []).concat(fs, role === 'Equipe' && !fs.length ? ['Equipe'] : []); } else d.equipe.push({ email: email, role: role, funcoes: [role] });
      if (role === 'Responsável' && principal) { var i = d.equipe.map(function (m) { return m.email; }).indexOf(email); d.equipe.unshift(d.equipe.splice(i, 1)[0]); }
      gravar(d); return {};
    },
    retirar: function (email) {
      var d = ler(), m = d.equipe.filter(function (x) { return x.email === email; })[0];
      var rs = E.responsaveis(); if (m && rs.length && rs[0].email === email) return { erro: 'Este é o Responsável principal. Para trocar, escolha outra pessoa no campo Responsável principal; ela passa a ser a principal e esta continua na equipe.' };
      d.equipe = d.equipe.filter(function (x) { return x.email !== email; }); gravar(d); return {};
    },
    onChange: function (f) { ouvintes.push(f); }
  };
  window.addEventListener('storage', function (e) { if (e.key === KEY) ouvintes.forEach(function (f) { f(); }); });
  window.PRJ_EQUIPE = E;
})();
