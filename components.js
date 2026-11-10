/* INTEGRA - comportamento de referência dos componentes (sem dependências).
   No sistema real, a validação é sempre refeita no servidor. */
(function () {
  // Mostrar / ocultar senha
  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    });
  });

  // Força da senha e requisitos
  function score(v) {
    if (!v) return 0;
    var s = 0;
    if (v.length >= 8) s++;
    if (/[A-Za-z]/.test(v) && /\d/.test(v)) s++;
    if (v.length >= 12) s++;
    if ((/[A-Z]/.test(v) && /[a-z]/.test(v)) || /[^A-Za-z0-9]/.test(v)) s++;
    if (v.length < 8) s = Math.min(s, 1);
    return Math.max(s, 1);
  }
  var labels = ['Aguardando digitação', 'Fraca', 'Média', 'Boa', 'Forte'];
  document.querySelectorAll('[data-strength-for]').forEach(function (meter) {
    var input = document.getElementById(meter.getAttribute('data-strength-for'));
    if (!input) return;
    var reqs = meter.parentNode.querySelectorAll('[data-req]');
    function update() {
      var v = input.value, lvl = score(v);
      meter.setAttribute('data-level', lvl);
      var t = meter.querySelector('.txt b');
      if (t) t.textContent = labels[lvl];
      reqs.forEach(function (li) {
        var ok = li.getAttribute('data-req') === 'len' ? v.length >= 8 : (/[A-Za-z]/.test(v) && /\d/.test(v));
        li.classList.toggle('ok', ok);
      });
    }
    input.addEventListener('input', update);
    update();
  });

  // CAPTCHA (simulação visual do Turnstile)
  document.querySelectorAll('.captcha[data-demo]').forEach(function (c) {
    c.addEventListener('click', function () {
      var st = c.getAttribute('data-state');
      if (st === 'ok' || st === 'verifying') return;
      c.setAttribute('data-state', 'verifying');
      c.querySelector('.ctxt').firstChild.textContent = 'Verificando…';
      c.querySelector('.ctxt small').textContent = 'Aguarde um instante';
      setTimeout(function () {
        c.setAttribute('data-state', 'ok');
        c.querySelector('.ctxt').firstChild.textContent = 'Verificação concluída';
        c.querySelector('.ctxt small').textContent = 'Pode continuar';
      }, 900);
    });
  });
})();
