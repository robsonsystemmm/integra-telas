/* INTEGRA - comportamento de referência do painel (sem dependências).
   No sistema real, toda ação é validada e registrada no servidor. */
(function () {
  var app = document.querySelector('.app');
  var side = document.getElementById('side');
  var scrim = document.querySelector('.scrim');
  var menuBtn = document.querySelector('.menu-btn');
  var wide = window.matchMedia('(min-width:1024px)');

  // ---- Menu lateral recolhível ----
  function setMenu(open) {
    if (!app || !side) return;
    app.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open && !wide.matches);
    if (scrim) scrim.hidden = !open;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var first = side.querySelector('a[href]'); if (first) first.focus(); }
    else if (document.activeElement && side.contains(document.activeElement) && menuBtn) menuBtn.focus();
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(true); });
  document.querySelectorAll('[data-close-menu]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  wide.addEventListener('change', function () { setMenu(false); });
  // mantém o foco dentro do menu enquanto ele está aberto no celular
  document.addEventListener('keydown', function (e) {
    if (!app || !app.classList.contains('menu-open') || wide.matches) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key === 'Tab') {
      var f = side.querySelectorAll('a[href],button:not([disabled]),summary');
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  // ---- Filtros recolhidos no celular ----
  var filt = document.querySelector('details.filters');
  if (filt) {
    var tablet = window.matchMedia('(min-width:768px)');
    var sync = function () { filt.open = tablet.matches; };
    sync(); tablet.addEventListener('change', sync);
  }

  // ---- Menus de ação por linha ----
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.menu[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('details.menu[open]').forEach(function (d) { d.removeAttribute('open'); d.querySelector('summary').focus(); });
  });

  // ---- Aviso temporário ----
  var toast = document.getElementById('toast'), tt;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, 4000);
  }
  window.INTEGRA_SAY = say;
  window.integraSay = say;
  document.querySelectorAll('[data-say]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); say(b.getAttribute('data-say')); var m = b.closest('details.menu'); if (m) m.removeAttribute('open'); });
  });
  document.querySelectorAll('form[data-say-submit]').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); say(f.getAttribute('data-say-submit')); });
  });

  // ---- Cadastros pendentes: aceitar e rejeitar ----
  function removeRow(el) { var r = el.closest('tr'); if (r) r.remove(); checkEmpty(); }
  function checkEmpty() {
    var tb = document.querySelector('[data-pending] tbody');
    var empty = document.getElementById('empty');
    if (tb && empty) empty.hidden = tb.querySelectorAll('tr').length > 0;
  }
  document.querySelectorAll('[data-accept]').forEach(function (b) {
    b.addEventListener('click', function () {
      say('Cadastro aceito. ' + b.getAttribute('data-accept') + ' agora aguarda a atribuição de perfil.');
      removeRow(b);
    });
  });
  var dlg = document.getElementById('reject');
  var target = null;
  document.querySelectorAll('[data-reject]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!dlg || !dlg.showModal) return;
      target = b; dlg.querySelector('[data-name]').textContent = b.getAttribute('data-reject');
      dlg.querySelector('textarea').value = ''; dlg.showModal(); dlg.querySelector('textarea').focus();
    });
  });
  if (dlg) {
    dlg.querySelectorAll('[data-cancel]').forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    dlg.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      say('Cadastro rejeitado. O motivo será mostrado à pessoa.');
      dlg.close(); if (target) removeRow(target);
    });
  }
})();
