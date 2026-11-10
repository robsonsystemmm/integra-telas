/* INTEGRA - matriz de permissões, busca de usuário e equipe do projeto (referência, sem dependências).
   No sistema real, tudo isto é validado e filtrado no servidor, e cada alteração vai para a auditoria. */
(function () {
  'use strict';
  const say = (m) => (window.integraSay ? window.integraSay(m) : null);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const initials = (n) => { const p = n.split(' '); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };

  /* ---------- Modelo ---------- */
  const OPT = { n: 'Sem acesso', m: 'Meus projetos', t: 'Todos', y: 'Sim' };
  const ACTS = [['ver', 'Visualizar'], ['criar', 'Criar'], ['editar', 'Editar'], ['excluir', 'Excluir']]; /* para novas ações (aprovar, arquivar...), basta acrescentar aqui e nas linhas desejadas */
  const SIX = ['ver', 'criar', 'editar', 'excluir'];
  const AREAS = [
    { name: 'Acesso', note: 'Vale para o sistema todo, não depende de projeto', rows: [
      { k: 'acc_users', type: 'acc', label: 'Usuários', hint: 'Editar: aceitar ou rejeitar cadastros, bloquear, inativar e reativar.', acts: ['ver', 'editar'] },
      { k: 'acc_perfis', type: 'acc', label: 'Perfis e permissões', hint: 'Atribuir perfis e criar ou editar perfis.', acts: ['ver', 'criar', 'editar', 'excluir'] },
      { k: 'acc_config', type: 'acc', label: 'Configurações de acesso', hint: 'Domínios, exceções de e-mail e segurança do login.', acts: ['ver', 'editar'] },
      { k: 'acc_audit', type: 'acc', label: 'Auditoria', hint: 'O registro não pode ser editado nem apagado.', acts: ['ver'] } ] },
    { name: 'Projetos', note: '“Meus projetos” são os que foram atribuídos à pessoa', rows: [
      { k: 'prj_cad', type: 'sc', label: 'Cadastro do projeto', hint: 'Criar exige acesso a todos os projetos.', acts: SIX },
      { k: 'prj_est', type: 'sc', label: 'Estruturação', hint: 'Equipe, núcleos, materiais e identidade visual.', acts: SIX },
      { k: 'prj_exe', type: 'sc', label: 'Execução', hint: 'Beneficiários, frequência e atividades.', acts: SIX },
      { k: 'prj_pre', type: 'sc', label: 'Prestação de contas', hint: 'Relatórios, diligências e envio.', acts: SIX },
      { k: 'prj_team', type: 'team', label: 'Equipe do projeto', hint: 'Atribuir e retirar pessoas de um projeto. Só com acesso a todos.', acts: ['ver', 'editar'] } ] },
    { name: 'Financeiro', note: 'Ver o projeto não dá acesso ao financeiro dele', rows: [
      { k: 'fin_orc', type: 'sc', label: 'Orçamento (rubricas)', hint: 'Rubricas, valores, remanejamentos e saldos.', acts: SIX },
      { k: 'fin_lan', type: 'sc', label: 'Lançamentos', hint: 'Gastos e pagamentos por rubrica.', acts: SIX },
      { k: 'fin_rel', type: 'sc', label: 'Relatórios', hint: 'Painéis e relatórios financeiros.', acts: ['ver'] } ] }
  ];
  const ROWS = AREAS.reduce((a, ar) => a.concat(ar.rows), []);
  const rowOf = (k) => ROWS.find((r) => r.k === k);
  const optsFor = (r, a) => (r.type === 'acc' ? ['n', 'y'] : r.type === 'team' ? ['n', 't'] : (a === 'criar' ? ['n', 'y'] : ['n', 'm', 't']));
  const ACTNAME = Object.fromEntries(ACTS);

  const S = (rows, acts, v) => { const o = {}; rows.forEach((r) => acts.forEach((a) => { o[r + '.' + a] = v; })); return o; };
  const mk = (spec) => { const b = {}; ROWS.forEach((r) => r.acts.forEach((a) => { b[r.k + '.' + a] = 'n'; })); return Object.assign(b, spec); };
  const PRJ = ['prj_cad', 'prj_est', 'prj_exe', 'prj_pre'];
  const PROFILES = {
    admin: { name: 'Administrador do Sistema', prot: true, desc: 'Acesso total à administração e visualiza todos os projetos e o financeiro (só consulta).',
      base: mk(Object.assign(S(['acc_users'], ['ver', 'editar'], 'y'), S(['acc_perfis'], ['ver', 'criar', 'editar', 'excluir'], 'y'), S(['acc_config'], ['ver', 'editar'], 'y'), S(['acc_audit'], ['ver'], 'y'), S(PRJ.concat(['prj_team', 'fin_orc', 'fin_lan', 'fin_rel']), ['ver'], 't'))) },
    gestor: { name: 'Gestor de Acessos', prot: true, desc: 'Gerencia usuários e perfis. Não altera a segurança do login.',
      base: mk(Object.assign(S(['acc_users'], ['ver', 'editar'], 'y'), S(['acc_perfis'], ['ver', 'criar', 'editar', 'excluir'], 'y'), S(['acc_audit'], ['ver'], 'y'))) },
    coord: { name: 'Coordenação de Projetos', desc: 'Tudo em Projetos, de todos os projetos. No Financeiro, só consulta.',
      base: mk(Object.assign(S(PRJ, ['ver', 'editar', 'excluir'], 't'), S(PRJ, ['criar'], 'y'), S(['prj_team'], ['ver', 'editar'], 't'), S(['fin_orc', 'fin_lan', 'fin_rel'], ['ver'], 't'))) },
    equipe: { name: 'Equipe de Projetos', desc: 'Vê e edita só os projetos atribuídos a ela. Não cria, exclui nem aprova.',
      base: mk(Object.assign(S(PRJ, ['ver', 'editar'], 'm'))) },
    fin: { name: 'Financeiro', desc: 'Tudo no Financeiro, de todos os projetos. Em Projetos, só consulta.',
      base: mk(Object.assign(S(['fin_orc', 'fin_lan'], ['ver', 'editar', 'excluir'], 't'), S(['fin_orc', 'fin_lan'], ['criar'], 'y'), S(['fin_rel'], ['ver'], 't'), S(PRJ, ['ver'], 't'))) },
    visual: { name: 'Visualização Geral', desc: 'Perfil de consulta. Ao atribuir, marque o que a pessoa pode visualizar.',
      base: mk({}) }
  };
  /* Perfil genérico: começa vazio e a matriz é montada na hora, só para aquela pessoa. */
  PROFILES.custom = { name: 'Personalizado', custom: true, desc: 'Monte a matriz do zero para esta pessoa, quando nenhum perfil se encaixa. Só vale para ela.', base: mk({}) };
  const PKEYS = Object.keys(PROFILES);

  const STATE = { ativo: ['ok', 'Ativo'], bloqueado: ['danger', 'Bloqueado'], inativo: ['muted', 'Inativo'], perfil: ['warn', 'Aguardando perfil'], pendente: ['info', 'Aguardando autorização'], rejeitado: ['danger', 'Rejeitado'] };
  const USERS = [
    { id: 'maria', name: 'Maria Souza', email: 'maria.souza@suaong.org.br', st: 'ativo', profile: 'admin', adj: {}, self: true },
    { id: 'rodrigo', name: 'Rodrigo Camargo', email: 'rodrigo.camargo@suaong.org.br', st: 'ativo', profile: 'gestor', adj: {} },
    { id: 'ana', name: 'Ana Lúcia Ferreira', email: 'ana.ferreira@suaong.org.br', st: 'ativo', profile: 'coord', adj: { 'prj_cad.excluir': 'n' } },
    { id: 'carlos', name: 'Carlos Eduardo Mendes', email: 'carlos.mendes@suaong.org.br', st: 'bloqueado', profile: 'equipe', adj: {} },
    { id: 'beatriz', name: 'Beatriz Santos Lima', email: 'beatriz.lima@suaong.org.br', st: 'inativo', profile: 'equipe', adj: {} },
    { id: 'felipe', name: 'Felipe Albuquerque', email: 'felipe.albuquerque@suaong.org.br', st: 'perfil', profile: null, adj: {},
      demo: { choice: 'fin', adj: { 'fin_orc.ver': 'm', 'fin_lan.ver': 'm', 'fin_rel.ver': 'm' } } },
    { id: 'camila', name: 'Camila Ferreira', email: 'camila.ferreira@suaong.org.br', st: 'pendente', profile: null, adj: {}, off: 'Aceite o cadastro primeiro' },
    { id: 'paulo', name: 'Paulo Nogueira', email: 'paulo.nogueira@outrodominio.com', st: 'rejeitado', profile: null, adj: {}, off: 'Cadastro rejeitado' }
  ];

  /* ---------- Busca de usuário (combobox acessível) ---------- */
  function combo(root, cfg) {
    const input = root.querySelector('input');
    const list = root.querySelector('[role=listbox]');
    let shown = [], active = -1;
    function render() {
      const q = norm(input.value.trim());
      shown = cfg.items().filter((i) => !q || norm(i.name + ' ' + i.email).includes(q)).slice(0, 8);
      list.innerHTML = shown.length
        ? shown.map((i, ix) => '<li role="option" id="' + list.id + '-' + ix + '" aria-selected="false"' + (i.off ? ' aria-disabled="true"' : '') + ' data-ix="' + ix + '">' + cfg.row(i) + '</li>').join('')
        : '<li class="none" role="presentation">Nenhuma pessoa encontrada.</li>';
      active = -1; input.removeAttribute('aria-activedescendant');
    }
    function open() { render(); list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    function mark(n) {
      const lis = list.querySelectorAll('[role=option]');
      lis.forEach((l) => { l.classList.remove('active'); l.setAttribute('aria-selected', 'false'); });
      if (!lis.length) return;
      active = (n + lis.length) % lis.length;
      const el = lis[active]; el.classList.add('active'); el.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' });
    }
    function pick(ix) { const i = shown[ix]; if (!i || i.off) return; close(); cfg.pick(i); }
    input.addEventListener('input', open);
    input.addEventListener('focus', open);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); mark(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (list.hidden) open(); mark(active - 1); }
      else if (e.key === 'Home' && !list.hidden) { e.preventDefault(); mark(0); }
      else if (e.key === 'End' && !list.hidden) { e.preventDefault(); mark(shown.length - 1); }
      else if (e.key === 'Enter') { if (!list.hidden && active > -1) { e.preventDefault(); pick(active); } }
      else if (e.key === 'Escape') { close(); }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const li = e.target.closest('[role=option]'); if (li) pick(+li.getAttribute('data-ix')); });
    document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(); });
    return { close, open };
  }
  const userRow = (i) => {
    const st = STATE[i.st];
    return '<span class="avatar" aria-hidden="true">' + initials(i.name) + '</span><span class="o-t"><b>' + esc(i.name) + '</b><small>' + esc(i.email) + '</small>' +
      (i.off ? '<em>' + esc(i.off) + '</em>' : '') + '</span><span class="pill ' + st[0] + '"><i aria-hidden="true"></i>' + st[1] + '</span>';
  };

  /* ---------- Matriz (módulos recolhíveis + caixas de marcação) ----------
     Para um módulo novo, basta acrescentar um item em AREAS: a tela se monta sozinha. */
  const on = (v) => !!v && v !== 'n';
  function rowScope(map, r) {
    if (r.type !== 'sc') return null;
    for (const a of r.acts) { if (a !== 'criar' && map[r.k + '.' + a] === 't') return 't'; }
    return map[r.k + '.criar'] === 'y' ? 't' : 'm';
  }
  function setAct(map, r, a, val) {
    map[r.k + '.' + a] = !val ? 'n' : r.type === 'acc' ? 'y' : r.type === 'team' ? 't' : a === 'criar' ? 'y' : rowScope(map, r);
  }
  function setScope(map, r, sc) {
    r.acts.forEach((a) => { const k = r.k + '.' + a; if (a === 'criar') { if (sc === 'm') map[k] = 'n'; } else if (on(map[k])) map[k] = sc; });
  }
  const countArea = (map, ar) => { let t = 0, n = 0; ar.rows.forEach((r) => r.acts.forEach((a) => { t++; if (on(map[r.k + '.' + a])) n++; })); return [n, t]; };

  function mx(root, prefix, cfg) {
    const openSet = new Set(AREAS.map((a) => a.name)); let q = '';
    function render() {
      const map = cfg.get(), base = cfg.base ? cfg.base() : null, dis = !!(cfg.dis && cfg.dis());
      const ae = document.activeElement, aid = ae && root.contains(ae) ? ae.id : '', sel = aid === prefix + '-q' ? [ae.selectionStart, ae.selectionEnd] : null;
      const nq = norm(q.trim());
      let h = '<div class="mx2"><div class="mx-bar"><div class="search">' + '<svg width="20" height="20" aria-hidden="true"><use href="#i-search"/></svg>' +
        '<input id="' + prefix + '-q" type="search" placeholder="Filtrar permissões (ex.: orçamento, usuários)" aria-label="Filtrar permissões" value="' + esc(q) + '"></div>' +
        '<div class="mx-btns"><button type="button" class="btn ghost sm auto" data-open="1">Expandir tudo</button><button type="button" class="btn ghost sm auto" data-open="0">Recolher tudo</button></div></div>';
      let shownAny = false;
      AREAS.forEach((ar) => {
        const rows = ar.rows.filter((r) => !nq || norm(r.label + ' ' + r.hint + ' ' + ar.name).includes(nq));
        if (!rows.length) return; shownAny = true;
        const [n, t] = countArea(map, ar), isOpen = nq ? true : openSet.has(ar.name);
        h += '<details class="mod2" data-area="' + esc(ar.name) + '"' + (isOpen ? ' open' : '') + '><summary><span class="mh"><b>' + ar.name + '</b><small>' + ar.note + '</small></span><span class="count' + (n ? '' : ' zero') + '">' + n + ' de ' + t + '</span></summary>';
        if (!dis) h += '<div class="mod-tools"><button type="button" class="btn ghost sm auto" data-all="' + esc(ar.name) + '">Marcar tudo</button><button type="button" class="btn ghost sm auto" data-none="' + esc(ar.name) + '">Limpar módulo</button></div>';
        rows.forEach((r) => {
          const sc = rowScope(map, r), anyOn = r.acts.some((a) => on(map[r.k + '.' + a]));
          const rowAdj = base && r.acts.some((a) => map[r.k + '.' + a] !== base[r.k + '.' + a]);
          h += '<div class="pr' + (rowAdj ? ' adj' : '') + '"><div class="pr-name"><b>' + r.label + '</b><small>' + r.hint + '</small></div><div class="pr-scope">';
          if (r.type === 'sc') h += '<label class="sr-only" for="' + prefix + '-' + r.k + '-sc">Alcance de ' + r.label + '</label><select class="select sm" id="' + prefix + '-' + r.k + '-sc" data-sc="' + r.k + '"' + (dis || !anyOn ? ' disabled' : '') + '><option value="m"' + (sc === 'm' ? ' selected' : '') + '>Meus projetos</option><option value="t"' + (sc === 't' ? ' selected' : '') + '>Todos os projetos</option></select>';
          else h += '<span class="pr-fixed">' + (r.type === 'team' ? 'Todos os projetos' : 'Sistema todo') + '</span>';
          h += '</div><div class="pr-acts" role="group" aria-label="' + r.label + '">';
          r.acts.forEach((a) => {
            const k = r.k + '.' + a, v = map[k], needAll = r.type === 'sc' && a === 'criar' && sc !== 't' && !on(v);
            const ch = base && v !== base[k];
            h += '<label class="chk' + (ch ? ' adj' : '') + (needAll ? ' off' : '') + '"><input type="checkbox" id="' + prefix + '-' + r.k + '-' + a + '" data-row="' + r.k + '" data-act="' + a + '"' + (on(v) ? ' checked' : '') + (dis || needAll ? ' disabled' : '') + '><span>' + ACTNAME[a] + '</span></label>';
          });
          h += '</div></div>';
        });
        h += '</details>';
      });
      if (!shownAny) h += '<div class="empty">Nenhuma permissão encontrada para “' + esc(q) + '”.</div>';
      h += '<p class="hint">Alcance “Meus projetos”: só os projetos atribuídos à pessoa. “Criar” exige acesso a todos os projetos. O alcance vale para as ações marcadas na linha.</p></div>';
      root.innerHTML = h;
      if (aid) { const el = document.getElementById(aid); if (el) { el.focus(); if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignora */ } } } }
    }
    const commit = (m) => { cfg.set(m); render(); };
    root.addEventListener('change', (e) => {
      const t = e.target, m = Object.assign({}, cfg.get());
      if (t.matches('input[type=checkbox]')) setAct(m, rowOf(t.dataset.row), t.dataset.act, t.checked);
      else if (t.matches('select[data-sc]')) setScope(m, rowOf(t.dataset.sc), t.value);
      else return;
      commit(m);
    });
    root.addEventListener('input', (e) => { if (e.target.type === 'search') { q = e.target.value; render(); } });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.open) { AREAS.forEach((a) => (b.dataset.open === '1' ? openSet.add(a.name) : openSet.delete(a.name))); render(); return; }
      const nm = b.dataset.all || b.dataset.none; if (!nm) return;
      const ar = AREAS.find((x) => x.name === nm), m = Object.assign({}, cfg.get());
      ar.rows.forEach((r) => { r.acts.forEach((a) => { m[r.k + '.' + a] = 'n'; }); if (b.dataset.all) { r.acts.forEach((a) => { m[r.k + '.' + a] = r.type === 'acc' ? 'y' : r.type === 'team' ? 't' : a === 'criar' ? 'y' : 't'; }); } });
      commit(m);
    });
    root.addEventListener('toggle', (e) => { const d = e.target; if (d.matches && d.matches('details.mod2') && !q.trim()) { if (d.open) openSet.add(d.dataset.area); else openSet.delete(d.dataset.area); } }, true);
    render();
    return { render };
  }
  const grantsText = (map) => {
    const out = [];
    ROWS.forEach((r) => { const acts = r.acts.filter((a) => on(map[r.k + '.' + a])); if (acts.length) out.push('<li>' + r.label + ': ' + acts.map((a) => ACTNAME[a]).join(', ') + (r.type === 'sc' ? ' · ' + (rowScope(map, r) === 't' ? 'todos os projetos' : 'meus projetos') : '') + '</li>'); });
    return out;
  };
  const diffCount = (map, base) => Object.keys(map).filter((k) => map[k] !== base[k]).length;

  /* ---------- Tela: perfis e permissões ---------- */
  function initPerfis() {
    const root = document.getElementById('perm-root'); if (!root) return;
    const $ = (id) => document.getElementById(id);
    let cur = null, choice = null, eff = {};
    const base = () => (choice ? PROFILES[choice].base : mk({}));
    const pname = (k) => (k ? PROFILES[k].name : 'Sem perfil');
    const curEff = (u) => Object.assign({}, PROFILES[u.profile].base, u.adj);
    const sameMap = (a, b) => Object.keys(a).every((k) => a[k] === b[k]);
    const changed = () => !!cur && (choice !== cur.profile || (choice && !sameMap(eff, cur.profile ? curEff(cur) : mk({}))));
    const isCustom = () => choice === 'custom';
    const U = mx($('u-matrix'), 'u', { get: () => eff, set: (m) => { eff = m; update(); }, base: () => (isCustom() ? null : base()), dis: () => !choice || !!(cur && cur.self) });

    function profilesHTML() {
      return PKEYS.map((k) => '<label class="prof"><input type="radio" name="perfil" value="' + k + '"><span><b>' + PROFILES[k].name + (PROFILES[k].prot ? ' <em class="lock">protegido</em>' : '') + (PROFILES[k].custom ? ' <em class="lock">matriz livre</em>' : '') + '</b><span>' + PROFILES[k].desc + '</span></span></label>').join('');
    }
    function update() {
      const n = isCustom() ? grantsText(eff).length : diffCount(eff, base());
      $('u-adjn').textContent = isCustom() ? n + (n === 1 ? ' linha com acesso' : ' linhas com acesso') : n + (n === 1 ? ' ajuste' : ' ajustes');
      $('u-copy-wrap').hidden = !isCustom();
      const items = [];
      if (choice !== cur.profile) items.push('<li>Perfil: <b>' + pname(cur.profile) + '</b> → <b>' + pname(choice) + '</b></li>');
      if (choice && isCustom()) { items.push.apply(items, grantsText(eff)); }
      else if (choice) Object.keys(eff).forEach((k) => { if (eff[k] !== base()[k]) { const p = k.split('.'); items.push('<li>' + rowOf(p[0]).label + ', ' + ACTNAME[p[1]] + ': ' + OPT[base()[k]] + ' → <b>' + OPT[eff[k]] + '</b></li>'); } });
      $('u-sum').innerHTML = items.length ? '<ul>' + items.join('') + '</ul>' : '<p class="hint">Nenhuma alteração ainda.</p>';
      $('u-save').disabled = !changed() || !!cur.self;
    }
    function renderUser() {
      const st = STATE[cur.st];
      $('u-avatar').textContent = initials(cur.name); $('u-name').textContent = cur.name; $('u-email').textContent = cur.email;
      $('u-state').className = 'pill ' + st[0]; $('u-state').innerHTML = '<i aria-hidden="true"></i>' + st[1];
      $('u-current').textContent = pname(cur.profile);
      const notes = [];
      if (cur.self) notes.push('<div class="alert warn" role="alert">Você não pode alterar o seu próprio perfil nem as suas permissões. Peça a outro administrador.</div>');
      if (cur.st === 'bloqueado' || cur.st === 'inativo') notes.push('<div class="alert info" role="status">A conta está ' + STATE[cur.st][1].toLowerCase() + '. Trocar o perfil não libera o acesso; para isso use ' + (cur.st === 'bloqueado' ? '“Desbloquear”' : '“Reativar”') + ' na lista de usuários.</div>');
      $('u-notes').innerHTML = notes.join('');
      document.querySelectorAll('input[name=perfil]').forEach((r) => { r.checked = r.value === choice; r.disabled = !!cur.self; });
      $('u-copy').innerHTML = '<option value="">Em branco</option>' + PKEYS.filter((k) => !PROFILES[k].custom).map((k) => '<option value="' + k + '">' + PROFILES[k].name + '</option>').join('');
      $('u-copy').disabled = !!cur.self;
      U.render(); update();
    }
    function select(u) {
      cur = u;
      if (u.demo) { choice = u.demo.choice; eff = Object.assign({}, PROFILES[choice].base, u.demo.adj); }
      else { choice = u.profile; eff = u.profile ? curEff(u) : mk({}); }
      $('u-area').hidden = false; $('u-empty').hidden = true; $('u-q').value = u.name; renderUser();
      try { history.replaceState(null, '', '#' + u.id); } catch (e) { /* ignora */ }
    }
    function clear() { cur = null; $('u-area').hidden = true; $('u-empty').hidden = false; $('u-q').value = ''; $('u-q').focus(); try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignora */ } }

    $('u-profiles').innerHTML = profilesHTML();
    $('u-profiles').addEventListener('change', (e) => {
      if (e.target.name !== 'perfil') return;
      choice = e.target.value; eff = Object.assign({}, PROFILES[choice].base); $('u-copy').value = ''; U.render(); update();
    });
    $('u-copy').addEventListener('change', (e) => { eff = e.target.value ? Object.assign({}, PROFILES[e.target.value].base) : mk({}); U.render(); update(); });
    $('u-save').addEventListener('click', () => {
      cur.profile = choice; const b = PROFILES[choice].base; cur.adj = {};
      Object.keys(eff).forEach((k) => { if (eff[k] !== b[k]) cur.adj[k] = eff[k]; });
      if (cur.demo) cur.demo = null;
      if (cur.st === 'perfil' && choice) cur.st = 'ativo';
      say('Atribuição salva para ' + cur.name + '. Registrada na auditoria.'); renderUser();
    });
    $('u-cancel').addEventListener('click', () => { select(cur); });
    $('u-change').addEventListener('click', clear);
    combo($('u-combo'), { items: () => USERS, row: userRow, pick: select });

    /* Aba: editar perfis (perfil "Personalizado" não entra: não tem matriz fixa) */
    const EDIT = PKEYS.filter((k) => !PROFILES[k].custom);
    let pk = 'fin';
    const draft = {}; EDIT.forEach((k) => { draft[k] = Object.assign({}, PROFILES[k].base); });
    const P = mx($('p-matrix'), 'p', { get: () => draft[pk], set: (m) => { draft[pk] = m; }, base: null, dis: () => false });
    function renderProfile() {
      const p = PROFILES[pk], n = USERS.filter((u) => u.profile === pk).length;
      $('p-desc').textContent = p.desc; $('p-count').textContent = n + (n === 1 ? ' pessoa usa' : ' pessoas usam') + ' este perfil';
      $('p-prot').hidden = !p.prot; P.render();
    }
    $('p-select').innerHTML = EDIT.map((k) => '<option value="' + k + '"' + (k === pk ? ' selected' : '') + '>' + PROFILES[k].name + '</option>').join('');
    $('p-select').addEventListener('change', (e) => { pk = e.target.value; renderProfile(); });
    $('p-save').addEventListener('click', () => { PROFILES[pk].base = Object.assign({}, draft[pk]); say('Perfil “' + PROFILES[pk].name + '” salvo. Quem usa o perfil acompanha a mudança.'); });
    $('p-new').addEventListener('click', () => say('Na versão real, abre um formulário com nome e descrição do novo perfil.'));
    renderProfile();

    /* Abas */
    const tabs = root.querySelectorAll('[role=tab]');
    function showTab(t) { tabs.forEach((x) => { const o = x === t; x.setAttribute('aria-selected', o ? 'true' : 'false'); x.tabIndex = o ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !o; }); }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => showTab(t));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); showTab(n); } });
    });

    const start = USERS.find((u) => u.id === (location.hash || '').slice(1)) || USERS.find((u) => u.id === 'felipe');
    select(start);
  }

  /* ---------- Tela: equipe do projeto ---------- */
  function initTeam() {
    const root = document.getElementById('team-root'); if (!root) return;
    const $ = (id) => document.getElementById(id);
    const CAND = [
      { name: 'Ana Lúcia Ferreira', email: 'ana.ferreira@suaong.org.br', st: 'ativo', who: 'Coordenação de Projetos' },
      { name: 'João Lima', email: 'joao.lima@suaong.org.br', st: 'ativo', who: 'Equipe de Projetos' },
      { name: 'Luciana Prado', email: 'luciana.prado@suaong.org.br', st: 'ativo', who: 'Equipe de Projetos' },
      { name: 'Marcos Teixeira', email: 'marcos.teixeira@suaong.org.br', st: 'ativo', who: 'Financeiro' },
      { name: 'Carlos Eduardo Mendes', email: 'carlos.mendes@suaong.org.br', st: 'bloqueado', who: 'Equipe de Projetos', off: 'Conta bloqueada' },
      { name: 'Felipe Albuquerque', email: 'felipe.albuquerque@suaong.org.br', st: 'perfil', who: '', off: 'Ainda sem perfil de acesso' }
    ];
    let team = [{ name: 'Ana Lúcia Ferreira', email: 'ana.ferreira@suaong.org.br', role: 'Responsável' }, { name: 'João Lima', email: 'joao.lima@suaong.org.br', role: 'Equipe' }];
    let chosen = null;
    const items = () => CAND.map((c) => Object.assign({}, c, { off: c.off || (team.some((t) => t.email === c.email) ? 'Já está na equipe' : '') }));
    function renderTeam() {
      $('t-list').innerHTML = team.length ? team.map((t, i) => '<li><span class="avatar" aria-hidden="true">' + initials(t.name) + '</span><span class="nm"><b>' + esc(t.name) + '</b><small>' + esc(t.email) + '</small></span>' +
        '<span class="pill ' + (t.role === 'Responsável' ? 'violet' : 'info') + '">' + t.role + '</span><button type="button" class="icon-btn" data-rm="' + i + '" aria-label="Retirar ' + esc(t.name) + ' da equipe"><svg width="20" height="20" aria-hidden="true"><use href="#i-trash"/></svg></button></li>').join('')
        : '<li class="empty">Nenhuma pessoa atribuída. Só quem tem acesso a todos os projetos vê este projeto.</li>';
      $('t-count').textContent = team.length + (team.length === 1 ? ' pessoa' : ' pessoas');
    }
    function updateAdd() { $('t-add').disabled = !chosen; }
    combo($('t-combo'), { items, row: (i) => '<span class="avatar" aria-hidden="true">' + initials(i.name) + '</span><span class="o-t"><b>' + esc(i.name) + '</b><small>' + esc(i.email) + (i.who ? ' · ' + esc(i.who) : '') + '</small>' + (i.off ? '<em>' + esc(i.off) + '</em>' : '') + '</span>',
      pick: (i) => { chosen = i; $('t-q').value = i.name; updateAdd(); } });
    $('t-q').addEventListener('input', () => { chosen = null; updateAdd(); });
    $('t-add').addEventListener('click', () => {
      if (!chosen) return;
      team.push({ name: chosen.name, email: chosen.email, role: $('t-role').value });
      say(chosen.name + ' agora vê este projeto. Registrado na auditoria.'); chosen = null; $('t-q').value = ''; updateAdd(); renderTeam();
    });
    $('t-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      const t = team.splice(+b.getAttribute('data-rm'), 1)[0]; say(t.name + ' deixou de ver este projeto. Registrado na auditoria.'); renderTeam();
    });
    renderTeam(); updateAdd();
  }

  initPerfis(); initTeam();
})();
