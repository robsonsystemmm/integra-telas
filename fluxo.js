/* INTEGRA - fluxo de navegação das telas de autenticação (somente referência/demonstração).
   Cada tela de autenticação tem vários estados (erro, CAPTCHA, link expirado...). Aqui a tela mostra um estado por vez
   e os botões levam à próxima tela, como no sistema real. Para ver todos os estados lado a lado: acrescente ?todos=1.
   Estado específico: ?estado=B (A, B, C...).
   Tudo aqui é simulação: no sistema real, login, cadastro, confirmação e recuperação de senha são feitos no servidor. */
(function () {
  'use strict';
  var script = document.currentScript;
  var RAIZ = script.getAttribute('data-raiz') || '';          /* '' no index.html, '../' nas telas */
  var PAG = script.getAttribute('data-pagina') || '';
  var q = new URLSearchParams(location.search);
  if (q.get('todos') === '1') return;                          /* galeria de estados: não mexe em nada */

  var T = function (n) { return (RAIZ ? '' : 'telas/') + n; };   /* caminho até uma tela da pasta telas */
  var LOGIN = RAIZ + 'index.html', MAPA = RAIZ + 'mapa-de-telas.html';
  var SENHA_DEMO = 'Integra@2026', CHAVE_ERROS = 'integra.fluxo.erros', CHAVE_EMAIL = 'integra.fluxo.email';
  var enc = encodeURIComponent;

  function guardar(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, String(v)); } catch (e) { /* sem armazenamento */ } }
  function ler(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ir(url) { location.href = url; }

  /* ---------- 1. um estado por vez ---------- */
  var estados = [].slice.call(document.querySelectorAll('.state'));
  var letra = (q.get('estado') || 'A').toUpperCase().charCodeAt(0) - 65;
  var atual = estados[letra >= 0 && letra < estados.length ? letra : 0];
  if (!atual) return;
  estados.forEach(function (e) { if (e !== atual) e.remove(); });
  var cap = atual.querySelector('.state-cap'); if (cap) cap.remove();
  var cab = document.querySelector('.sheet-head'); if (cab) cab.remove();
  document.body.classList.add('fluxo');
  var form = atual.querySelector('form');

  /* ---------- 2. avisos ---------- */
  function aviso(msg, onde, papel) {
    var p = atual.querySelector('.fluxo-aviso');
    if (!p) { p = document.createElement('p'); p.className = 'fluxo-aviso'; (onde || form || atual).appendChild(p); }
    p.setAttribute('role', papel || 'alert'); p.textContent = msg; p.hidden = false; return p;
  }
  function falha(campo, msg) { aviso(msg); if (campo) campo.focus(); }

  /* ---------- 3. demonstração: painel de ajuda ---------- */
  function painel(titulo, html) {
    var d = document.createElement('details'); d.className = 'demo-fluxo'; d.open = PAG !== 'login';
    d.innerHTML = '<summary>' + esc(titulo) + '</summary><div class="demo-corpo">' + html + '</div>';
    var tela = atual.querySelector('.screen'); (tela || atual).appendChild(d);
  }
  var linkMapa = '<a href="' + MAPA + '">Mapa de todas as telas</a> · <a href="?todos=1">Ver todos os estados desta tela</a>';

  var CONTAS = [
    ['admin', 'Administrador do Sistema', T('admin-cadastros-pendentes.html')],
    ['coordenacao', 'Coordenação de Projetos', T('projetos-painel.html') + '?perfil=' + enc('Coordenação de Projetos')],
    ['equipe', 'Equipe de Projetos', T('projetos-painel.html') + '?perfil=' + enc('Equipe de Projetos')],
    ['financeiro', 'Financeiro', T('projetos-lista.html') + '?perfil=' + enc('Financeiro')],
    ['pendente', 'Cadastro aguardando autorização', T('aguardando-autorizacao.html')],
    ['semperfil', 'Autorizado, aguardando perfil', T('aguardando-perfil.html')],
    ['naoconfirmou', 'E-mail ainda não confirmado', T('confirmar-email.html')],
    ['rejeitada', 'Cadastro rejeitado', T('conta-rejeitada.html')],
    ['bloqueada', 'Conta bloqueada', T('conta-bloqueada.html')],
    ['inativa', 'Conta inativa (saiu da ONG)', T('conta-inativa.html')]
  ];

  /* ---------- 4. cada tela ---------- */
  if (PAG === 'login') {
    var email = atual.querySelector('input[type="email"]');
    var salvo = ler(CHAVE_EMAIL); if (email && salvo && (letra > 0)) email.value = salvo;
    var captcha = atual.querySelector('.captcha');
    var entrar = atual.querySelector('button[type="submit"]');
    if (captcha && entrar) { /* o botão só libera depois do CAPTCHA */
      new MutationObserver(function () { entrar.disabled = captcha.getAttribute('data-state') !== 'ok'; })
        .observe(captcha, { attributes: true, attributeFilter: ['data-state'] });
    }
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var erros = parseInt(ler(CHAVE_ERROS) || '0', 10);
      if (erros >= 5) return ir(LOGIN + '?estado=D');          /* bloqueada: só um administrador desfaz */
      if (captcha && captcha.getAttribute('data-state') !== 'ok') { captcha.focus(); return; }
      var senha = atual.querySelector('input[name="a-pass"]'), mail = (email && email.value || '').trim().toLowerCase();
      var conta = CONTAS.filter(function (c) { return c[0] === mail.split('@')[0]; })[0];
      if (conta && senha && senha.value === SENHA_DEMO) { guardar(CHAVE_ERROS, null); guardar(CHAVE_EMAIL, null); return ir(conta[2]); }
      erros++; guardar(CHAVE_ERROS, erros); guardar(CHAVE_EMAIL, mail);
      ir(LOGIN + '?estado=' + (erros >= 5 ? 'D' : erros >= 2 ? 'C' : 'B'));   /* CAPTCHA a partir da 3ª tentativa */
    });
    var linhas = CONTAS.map(function (c) { return '<tr><td><code>' + c[0] + '@exemplo.org.br</code></td><td>' + esc(c[1]) + '</td></tr>'; }).join('');
    painel('Demonstração: contas para testar', '<p>Senha de todas: <code>' + SENHA_DEMO + '</code>. Qualquer outra combinação conta como erro: a 3ª tentativa pede CAPTCHA e a 5ª bloqueia a conta.</p>' +
      '<div class="demo-tab"><table><thead><tr><th scope="col">E-mail</th><th scope="col">Resultado</th></tr></thead><tbody>' + linhas + '</tbody></table></div>' +
      '<p><button type="button" class="demo-btn" id="fluxo-zerar">Reiniciar demonstração (zera as tentativas)</button></p><p>' + linkMapa + '</p>');
    var z = document.getElementById('fluxo-zerar');
    if (z) z.addEventListener('click', function () { guardar(CHAVE_ERROS, null); guardar(CHAVE_EMAIL, null); ir(LOGIN); });
  }

  if (PAG === 'cadastro' && form) {
    var termos = form.querySelector('input[name="terms"]'), cap2 = form.querySelector('.captcha');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.querySelector('#a-nome'), mail2 = form.querySelector('#a-email'), s1 = form.querySelector('#a-pw'), s2 = form.querySelector('#a-pw2');
      if (!nome.value.trim()) return falha(nome, 'Informe seu nome completo.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail2.value.trim())) return falha(mail2, 'Informe um e-mail válido.');
      if (s1.value.length < 8 || !/[A-Za-z]/.test(s1.value) || !/\d/.test(s1.value)) return falha(s1, 'A senha precisa de 8 caracteres ou mais, com letra e número.');
      if (s1.value !== s2.value) return falha(s2, 'As senhas não são iguais.');
      if (termos && !termos.checked) return falha(termos, 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.');
      if (cap2 && cap2.getAttribute('data-state') !== 'ok') return falha(cap2, 'Faça a verificação "Não sou um robô" antes de continuar.');
      guardar(CHAVE_EMAIL, mail2.value.trim().toLowerCase());
      ir(T('confirmar-email.html'));
    });
    painel('Demonstração', '<p>Preencha com dados de teste (senha com 8 caracteres ou mais, letra e número). Depois do cadastro o sistema pede a confirmação do e-mail, e só então a coordenação analisa.</p><p>' + linkMapa + '</p>');
  }

  if (PAG === 'confirmar-email') {
    [].forEach.call(atual.querySelectorAll('button[type="button"]'), function (b) {
      if (/Reenviar e-mail|Enviar novo link/.test(b.textContent) && !b.disabled) b.addEventListener('click', function () { ir(T('confirmar-email.html') + '?estado=B'); });
    });
    painel('Demonstração: como seguir', '<ul><li><a href="' + T('aguardando-autorizacao.html') + '">Simular: cliquei no link do e-mail</a></li><li><a href="' + T('confirmar-email.html') + '?estado=C">Simular: o link expirou</a></li></ul><p>' + linkMapa + '</p>');
  }

  if (PAG === 'esqueci-senha') {
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = form.querySelector('input[type="email"]');
      if (!m || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim())) return falha(m, 'Informe um e-mail válido.');
      ir(T('esqueci-senha.html') + '?estado=B');                /* resposta igual exista ou não a conta */
    });
    painel('Demonstração: como seguir', '<ul><li><a href="' + T('redefinir-senha.html') + '">Simular: abri o link recebido por e-mail</a></li></ul><p>' + linkMapa + '</p>');
  }

  if (PAG === 'redefinir-senha') {
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = form.querySelectorAll('input[type="password"],input[type="text"]'), a = p[0], b = p[1];
      if (!a || a.value.length < 8 || !/[A-Za-z]/.test(a.value) || !/\d/.test(a.value)) return falha(a, 'A senha precisa de 8 caracteres ou mais, com letra e número.');
      if (b && a.value !== b.value) return falha(b, 'As senhas não são iguais.');
      ir(T('redefinir-senha.html') + '?estado=D');
    });
    painel('Demonstração: como seguir', '<ul><li><a href="' + T('redefinir-senha.html') + '?estado=C">Simular: o link expirou</a></li></ul><p>' + linkMapa + '</p>');
  }

  if (PAG === 'aguardando-autorizacao' || PAG === 'aguardando-perfil') {
    var ver = [].filter.call(atual.querySelectorAll('button[type="button"]'), function (b) { return /Verificar status/.test(b.textContent); })[0];
    if (ver) ver.addEventListener('click', function () { aviso('Ainda aguardando. Você receberá um e-mail assim que houver novidade.', ver.parentNode, 'status'); });
    var passos = PAG === 'aguardando-autorizacao'
      ? '<li><a href="' + T('aguardando-perfil.html') + '">Simular: o administrador autorizou o cadastro</a></li><li><a href="' + T('conta-rejeitada.html') + '">Simular: o cadastro foi rejeitado</a></li>'
      : '<li><a href="' + T('projetos-painel.html') + '?perfil=' + enc('Equipe de Projetos') + '">Simular: o perfil Equipe de Projetos foi atribuído</a></li>';
    painel('Demonstração: como seguir', '<ul>' + passos + '</ul><p>' + linkMapa + '</p>');
  }
})();
