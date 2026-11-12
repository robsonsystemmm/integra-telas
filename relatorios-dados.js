/* INTEGRA - relatórios do módulo Projetos (referência, sem dependências).
   Cada relatório recebe os projetos que a pessoa pode ver e devolve colunas, linhas e totais, que servem tanto
   para a tela quanto para a exportação em PDF e XLSX. No sistema real, o servidor monta os dados já filtrados pelo
   alcance da pessoa, confere a permissão "Exportar", gera o arquivo e registra a exportação na auditoria. */
(function () {
  'use strict';
  var D = window.PRJ_DADOS, E = window.PRJ_EQUIPE;
  function nome(email) { var u = E && E.usuario(email); return u ? u.name : String(email).split('@')[0]; }
  function soma(L, f) { return L.reduce(function (t, p) { return t + f(p); }, 0); }
  function ordNome(a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); }
  function textoCert(p) {
    if (p.cert === null) return 'Sem certidão cadastrada';
    if (p.cert < 0) return 'Vencida há ' + (-p.cert) + (p.cert === -1 ? ' dia' : ' dias');
    if (p.cert === 0) return 'Vence hoje';
    return 'Vence em ' + p.cert + (p.cert === 1 ? ' dia' : ' dias');
  }
  function textoPrazo(p) {
    if (p.dias < 0) return 'Vigência encerrada';
    if (p.dias <= 90) return 'Termina em até 90 dias';
    return 'No prazo';
  }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }

  var REL = [
    { id: 'resumo', titulo: 'Resumo de projetos', desc: 'Todos os projetos com instrumento, concedente, etapa, responsável, término, valor global e atendimento.',
      build: function (base) {
        var L = base.slice().sort(ordNome);
        return {
          colunas: [{ t: 'Projeto', tipo: 'texto', larg: 3 }, { t: 'Instrumento', tipo: 'texto', larg: 2.6 }, { t: 'Concedente', tipo: 'texto', larg: 2.4 }, { t: 'Etapa', tipo: 'texto', larg: 1.5 }, { t: 'Situação', tipo: 'texto', larg: 1.1 }, { t: 'Responsável principal', tipo: 'texto', larg: 2 }, { t: 'Término', tipo: 'data', larg: 1.1 }, { t: 'Valor global', tipo: 'moeda', larg: 1.5 }, { t: 'Previstos', tipo: 'int', larg: 1 }, { t: 'Atendidos', tipo: 'int', larg: 1 }],
          linhas: L.map(function (p) { return [p.nome, p.inst, p.conc, D.ETAPAS[p.etapa], p.sit, nome(p.resp), p.fim, p.valor || null, p.benPrev || null, p.benReal || null]; }),
          totais: L.length ? ['Total dos projetos listados (' + L.length + ')', '', '', '', '', '', '', soma(L, function (p) { return p.valor; }), soma(L, function (p) { return p.benPrev; }), soma(L, function (p) { return p.benReal; })] : null
        };
      } },
    { id: 'beneficiarios', titulo: 'Beneficiários por projeto', desc: 'Atendimentos previstos e realizados em cada projeto com meta de atendimento. Só números, sem nomes de beneficiários.',
      build: function (base) {
        var L = base.filter(function (p) { return p.benPrev > 0; }).sort(function (a, b) { return b.benPrev - a.benPrev; });
        var pv = soma(L, function (p) { return p.benPrev; }), rl = soma(L, function (p) { return p.benReal; });
        return {
          colunas: [{ t: 'Projeto', tipo: 'texto', larg: 4 }, { t: 'Situação', tipo: 'texto', larg: 1.3 }, { t: 'Previstos', tipo: 'int', larg: 1.2 }, { t: 'Atendidos', tipo: 'int', larg: 1.2 }, { t: '% atendido', tipo: 'pct', larg: 1.2 }],
          linhas: L.map(function (p) { return [p.nome, p.sit, p.benPrev, p.benReal, p.benReal / p.benPrev]; }),
          totais: L.length ? ['Total', '', pv, rl, pv ? rl / pv : 0] : null
        };
      } },
    { id: 'metas', titulo: 'Metas por projeto', desc: 'Quantas metas cada projeto tem, quantas foram atingidas, estão em andamento ou estão atrasadas.',
      build: function (base) {
        var L = base.filter(function (p) { return p.metasTot > 0; }).sort(ordNome);
        var t = soma(L, function (p) { return p.metasTot; }), ok = soma(L, function (p) { return p.metasOk; }), at = soma(L, function (p) { return p.metasAtraso; });
        return {
          colunas: [{ t: 'Projeto', tipo: 'texto', larg: 4 }, { t: 'Situação', tipo: 'texto', larg: 1.3 }, { t: 'Total de metas', tipo: 'int', larg: 1.1 }, { t: 'Atingidas', tipo: 'int', larg: 1 }, { t: 'Em andamento', tipo: 'int', larg: 1.1 }, { t: 'Atrasadas', tipo: 'int', larg: 1 }, { t: '% atingidas', tipo: 'pct', larg: 1 }],
          linhas: L.map(function (p) { return [p.nome, p.sit, p.metasTot, p.metasOk, Math.max(0, p.metasTot - p.metasOk - p.metasAtraso), p.metasAtraso, p.metasOk / p.metasTot]; }),
          totais: L.length ? ['Total', '', t, ok, Math.max(0, t - ok - at), at, t ? ok / t : 0] : null
        };
      } },
    { id: 'concedente', titulo: 'Valor global por concedente', desc: 'Soma do valor global dos projetos em andamento, por concedente. É o valor do cadastro; gastos e saldos ficam no Financeiro.',
      build: function (base) {
        var g = {}; base.filter(D.emAndamento).forEach(function (p) { var x = g[p.conc] = g[p.conc] || { c: p.conc, n: 0, v: 0 }; x.n++; x.v += p.valor; });
        var L = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.v - a.v; }), tv = soma(L, function (x) { return x.v; });
        return {
          colunas: [{ t: 'Concedente', tipo: 'texto', larg: 4 }, { t: 'Projetos em andamento', tipo: 'int', larg: 1.4 }, { t: 'Valor global', tipo: 'moeda', larg: 1.6 }, { t: '% do valor', tipo: 'pct', larg: 1 }],
          linhas: L.map(function (x) { return [x.c, x.n, x.v, tv ? x.v / tv : 0]; }),
          totais: L.length ? ['Total', soma(L, function (x) { return x.n; }), tv, 1] : null
        };
      } },
    { id: 'prazos', titulo: 'Prazos e vencimentos', desc: 'Projetos em andamento, do término mais próximo ao mais distante. Vigências já encerradas aparecem primeiro.',
      build: function (base) {
        var L = base.filter(function (p) { return D.emAndamento(p) && p.fim; }).sort(function (a, b) { return a.dias - b.dias; });
        return {
          colunas: [{ t: 'Projeto', tipo: 'texto', larg: 3.4 }, { t: 'Responsável principal', tipo: 'texto', larg: 2.2 }, { t: 'Término', tipo: 'data', larg: 1.2 }, { t: 'Dias até o término', tipo: 'int', larg: 1.3 }, { t: 'Situação do prazo', tipo: 'texto', larg: 2 }],
          linhas: L.map(function (p) { return [p.nome, nome(p.resp), p.fim, p.dias, textoPrazo(p)]; }),
          totais: null
        };
      } },
    { id: 'docs', titulo: 'Documentos e certidões pendentes', desc: 'Projetos em andamento com documento exigido sem arquivo ou certidão vencida ou perto de vencer (até 90 dias).',
      build: function (base) {
        function gr(p) { return (p.cert !== null && p.cert < 0) ? 0 : (p.docsPend > 0 || (p.cert !== null && p.cert <= 30)) ? 1 : 2; }
        var L = base.filter(function (p) { return D.emAndamento(p) && (p.docsPend > 0 || (p.cert !== null && p.cert <= 90)); }).sort(function (a, b) { return gr(a) - gr(b) || ordNome(a, b); });
        return {
          colunas: [{ t: 'Projeto', tipo: 'texto', larg: 3.2 }, { t: 'Responsável principal', tipo: 'texto', larg: 2.2 }, { t: 'Documentos exigidos sem arquivo', tipo: 'int', larg: 1.6 }, { t: 'Certidão mais próxima', tipo: 'texto', larg: 2 }, { t: 'Prioridade', tipo: 'texto', larg: 1.2 }],
          linhas: L.map(function (p) { return [p.nome, nome(p.resp), p.docsPend, textoCert(p), ['Urgente', 'Atenção', 'Acompanhar'][gr(p)]]; }),
          totais: L.length ? ['Total', '', soma(L, function (p) { return p.docsPend; }), '', ''] : null
        };
      } },
    { id: 'equipe', titulo: 'Equipe por projeto', desc: 'Responsável principal e pessoas de cada projeto. Só nomes; contatos pessoais não saem no relatório.',
      build: function (base) {
        var L = base.filter(function (p) { return p.sit !== 'Cancelado'; }).sort(ordNome);
        return {
          colunas: [{ t: 'Projeto', tipo: 'texto', larg: 3 }, { t: 'Situação', tipo: 'texto', larg: 1.1 }, { t: 'Responsável principal', tipo: 'texto', larg: 2.2 }, { t: 'Equipe', tipo: 'texto', larg: 4.5 }, { t: 'Pessoas', tipo: 'int', larg: 0.9 }],
          linhas: L.map(function (p) { return [p.nome, p.sit, nome(p.resp), p.eq.map(nome).join(', '), p.eq.length]; }),
          totais: null
        };
      } }
  ];

  function porId(id) { return REL.filter(function (r) { return r.id === id; })[0]; }

  /* filtros: { etapa: índice ou '', sit: texto ou '', conc: texto ou '' } */
  function filtrar(base, f) {
    return base.filter(function (p) { return (f.etapa === '' || f.etapa === undefined || p.etapa === Number(f.etapa)) && (!f.sit || p.sit === f.sit) && (!f.conc || p.conc === f.conc); });
  }

  /* monta o pedido de exportação e baixa o arquivo; devolve o nome do arquivo */
  function exportar(formato, id, base, filtros, quem) {
    var r = porId(id), d = r.build(base);
    var pedido = { nome: 'relatorio-' + id, titulo: r.titulo, subtitulo: r.desc, filtros: filtros, emitidoPor: quem, colunas: d.colunas, linhas: d.linhas, totais: d.totais };
    var arquivo = window.INTEGRA_EXPORT.baixar(formato, pedido);
    window.INTEGRA_EXPORT.registrar({ quem: quem, relatorio: r.titulo, formato: formato === 'pdf' ? 'PDF' : 'XLSX', linhas: d.linhas.length, filtros: filtros.map(function (f) { return f[0] + ': ' + f[1]; }).join(' · '), arquivo: arquivo });
    return arquivo;
  }

  window.PRJ_REL = { lista: REL, porId: porId, filtrar: filtrar, exportar: exportar, nome: nome, plural: plural };
})();
