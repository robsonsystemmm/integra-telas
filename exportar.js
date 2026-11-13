/* INTEGRA - exportação de relatórios em PDF e XLSX, direto no navegador, sem bibliotecas e sem CDN.
   Gera arquivos reais (PDF 1.4 com Helvetica e planilha OOXML). No sistema real o servidor gera os dois
   formatos (por exemplo, exceljs e pdf-lib), valida a permissão "Exportar" e registra a exportação na auditoria.

   Uso:
     INTEGRA_EXPORT.baixar('pdf' | 'xlsx', {
       nome: 'relatorio-resumo',            // sem extensão
       titulo: 'Resumo de projetos',
       subtitulo: 'Projetos em andamento',  // opcional
       filtros: [['Etapa', 'Todas']],       // opcional
       emitidoPor: 'Maria Souza',
       colunas: [{ t: 'Projeto', tipo: 'texto', larg: 3 }, { t: 'Valor', tipo: 'moeda', larg: 1.4 }],
       linhas: [['Esporte na Comunidade', 800000]],
       totais: ['Total', 800000]            // opcional, mesmo número de colunas
     });
   Tipos de coluna: texto, int, moeda, pct (fração: 0.64 = 64%), data (Date). */
(function () {
  'use strict';

  /* ---------- utilidades ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dataBR(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function agoraBR(d) { return dataBR(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  var nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var nfM = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function textoCelula(tipo, v) {
    if (v === null || v === undefined || v === '') return '';
    if (tipo === 'int') return nf0.format(v);
    if (tipo === 'moeda') return nfM.format(v).replace(/ /g, ' ');
    if (tipo === 'pct') return Math.round(v * 100) + '%';
    if (tipo === 'data') return v instanceof Date ? dataBR(v) : String(v);
    return String(v);
  }
  function slug(s) { return String(s || 'relatorio').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'relatorio'; }
  function baixarBlob(blob, nome) {
    var a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = nome; a.rel = 'noopener'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function utf8(s) { return new TextEncoder().encode(s); }

  /* ---------- ZIP (sem compressão) ---------- */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(arquivos) {
    var partes = [], central = [], desloc = 0, d = new Date();
    var hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    arquivos.forEach(function (f) {
      var nome = utf8(f.nome), dados = utf8(f.conteudo), crc = crc32(dados);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, hora, true); h.setUint16(12, dia, true); h.setUint32(14, crc, true);
      h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true); h.setUint16(26, nome.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nome, dados);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, hora, true); c.setUint16(14, dia, true); c.setUint32(16, crc, true);
      c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true); c.setUint16(28, nome.length, true);
      c.setUint32(42, desloc, true);
      central.push(new Uint8Array(c.buffer), nome);
      desloc += 30 + nome.length + dados.length;
    });
    var tamCentral = central.reduce(function (s, p) { return s + p.length; }, 0);
    var fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
    fim.setUint32(12, tamCentral, true); fim.setUint32(16, desloc, true);
    return new Blob(partes.concat(central, [new Uint8Array(fim.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ---------- XLSX ---------- */
  function xml(s) { return String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function colLetra(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function serial(d) { return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000); }
  /* estilos: 0 padrão, 1 título, 2 cabeçalho, 3 inteiro, 4 moeda, 5 percentual, 6 data, 7 negrito, 8 inteiro negrito, 9 moeda negrito, 10 apoio, 11 texto com quebra */
  var ESTILO = { texto: 11, int: 3, moeda: 4, pct: 5, data: 6 }, ESTILO_TOT = { texto: 7, int: 8, moeda: 9, pct: 7, data: 7 };
  function celula(ref, tipo, v, est) {
    if (v === null || v === undefined || v === '') return '<c r="' + ref + '" s="' + est + '"/>';
    if (tipo === 'int' || tipo === 'moeda' || tipo === 'pct') return '<c r="' + ref + '" s="' + est + '"><v>' + Number(v) + '</v></c>';
    if (tipo === 'data' && v instanceof Date) return '<c r="' + ref + '" s="' + est + '"><v>' + serial(v) + '</v></c>';
    return '<c r="' + ref + '" s="' + est + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>';
  }
  function montarXlsx(o) {
    var cols = o.colunas, linhas = [], r = 1, agora = new Date();
    function texto(s, est) { linhas.push('<row r="' + r + '"><c r="A' + r + '" s="' + est + '" t="inlineStr"><is><t xml:space="preserve">' + xml(s) + '</t></is></c></row>'); r++; }
    texto(o.titulo, 1);
    if (o.subtitulo) texto(o.subtitulo, 10);
    if (o.filtros && o.filtros.length) texto('Filtros: ' + o.filtros.map(function (f) { return f[0] + ': ' + f[1]; }).join(' · '), 10);
    texto('Emitido em ' + agoraBR(agora) + (o.emitidoPor ? ' por ' + o.emitidoPor : '') + '. Contém dados da ONG: uso restrito.', 10);
    r++;
    var cab = r;
    linhas.push('<row r="' + r + '" ht="30" customHeight="1">' + cols.map(function (c, i) { return '<c r="' + colLetra(i) + r + '" s="2" t="inlineStr"><is><t>' + xml(c.t) + '</t></is></c>'; }).join('') + '</row>'); r++;
    o.linhas.forEach(function (ln) { linhas.push('<row r="' + r + '">' + cols.map(function (c, i) { return celula(colLetra(i) + r, c.tipo, ln[i], ESTILO[c.tipo]); }).join('') + '</row>'); r++; });
    if (o.totais) { linhas.push('<row r="' + r + '">' + cols.map(function (c, i) { return celula(colLetra(i) + r, c.tipo, o.totais[i], ESTILO_TOT[c.tipo]); }).join('') + '</row>'); r++; }
    var ultima = cab + o.linhas.length;
    var larguras = cols.map(function (c, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + Math.round(Math.max(10, (c.larg || 1) * 12)) + '" customWidth="1"/>'; }).join('');
    var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="' + cab + '" topLeftCell="A' + (cab + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="18"/><cols>' + larguras + '</cols><sheetData>' + linhas.join('') + '</sheetData>' +
      (o.linhas.length ? '<autoFilter ref="A' + cab + ':' + colLetra(cols.length - 1) + ultima + '"/>' : '') +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToHeight="0"/></worksheet>';
    var estilos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>' +
      '<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="12">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
      '<xf numFmtId="9" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>' +
      '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="3" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
      '<xf numFmtId="164" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    var nomeAba = String(o.titulo || 'Relatório').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31);
    return zip([
      { nome: '[Content_Types].xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
      { nome: '_rels/.rels', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
      { nome: 'docProps/core.xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xml(o.titulo) + '</dc:title><dc:creator>INTEGRA</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + agora.toISOString().replace(/\.\d+Z$/, 'Z') + '</dcterms:created></cp:coreProperties>' },
      { nome: 'xl/workbook.xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + xml(nomeAba) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { nome: 'xl/_rels/workbook.xml.rels', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { nome: 'xl/styles.xml', conteudo: estilos },
      { nome: 'xl/worksheets/sheet1.xml', conteudo: sheet }
    ]);
  }

  /* ---------- PDF ---------- */
  /* larguras da Helvetica (1/1000 em), caracteres 32 a 126 */
  var HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  var HWB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
  var CP1252 = { '€': 0x80, '…': 0x85, '•': 0x95, '–': 0x96, '—': 0x97, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94 };
  function paraWinAnsi(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), c = s.charCodeAt(i);
      if (c === 9 || c === 10 || c === 13) o += ' ';
      else if (c >= 32 && c < 127) o += ch;
      else if (c >= 160 && c <= 255) o += ch;
      else if (CP1252[ch]) o += String.fromCharCode(CP1252[ch]);
      else o += '?';
    }
    return o;
  }
  function larguraChar(ch, negrito) {
    var c = ch.charCodeAt(0);
    if (c >= 32 && c < 127) return (negrito ? HWB : HW)[c - 32];
    var base = ch.normalize('NFD').charAt(0), cb = base.charCodeAt(0);
    if (cb >= 32 && cb < 127) return (negrito ? HWB : HW)[cb - 32];
    return 556;
  }
  function larguraTexto(s, tam, negrito) { var w = 0; for (var i = 0; i < s.length; i++) w += larguraChar(s.charAt(i), negrito); return w * tam / 1000; }
  function quebra(s, maxW, tam, negrito) {
    s = paraWinAnsi(String(s)); if (!s) return [''];
    var palavras = s.split(' '), linhas = [], atual = '';
    palavras.forEach(function (p) {
      while (larguraTexto(p, tam, negrito) > maxW && p.length > 1) { /* palavra maior que a coluna: parte em pedaços */
        var k = 1; while (k < p.length && larguraTexto(p.slice(0, k + 1), tam, negrito) <= maxW) k++;
        if (atual) { linhas.push(atual); atual = ''; }
        linhas.push(p.slice(0, k)); p = p.slice(k);
      }
      var teste = atual ? atual + ' ' + p : p;
      if (larguraTexto(teste, tam, negrito) <= maxW || !atual) atual = teste; else { linhas.push(atual); atual = p; }
    });
    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [''];
  }
  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function num(n) { return (Math.round(n * 100) / 100).toString(); }

  function montarPdf(o) {
    var W = 842, H = 595, M = 36, cols = o.colunas, agora = new Date(), util = W - 2 * M;
    var soma = cols.reduce(function (s, c) { return s + (c.larg || 1); }, 0), cw = cols.map(function (c) { return util * (c.larg || 1) / soma; });
    var TAM = 8.5, LH = 11, PAD = 4, paginas = [], cs, y;
    var emitido = 'Emitido em ' + agoraBR(agora) + (o.emitidoPor ? ' por ' + o.emitidoPor : '');
    function txt(x, yy, s, tam, neg, cor, alinhar, largura) {
      s = paraWinAnsi(s); var w = larguraTexto(s, tam, neg), xx = alinhar === 'r' ? x + largura - w : alinhar === 'c' ? x + (largura - w) / 2 : x;
      cs.push((cor || '0.06 0.09 0.16') + ' rg BT /' + (neg ? 'F2' : 'F1') + ' ' + tam + ' Tf ' + num(xx) + ' ' + num(yy) + ' Td (' + esc(s) + ') Tj ET');
    }
    function ret(x, yy, w, h, cor) { cs.push(cor + ' rg ' + num(x) + ' ' + num(yy) + ' ' + num(w) + ' ' + num(h) + ' re f'); }
    function linha(x1, yy, x2, cor, esp) { cs.push(cor + ' RG ' + (esp || 0.5) + ' w ' + num(x1) + ' ' + num(yy) + ' m ' + num(x2) + ' ' + num(yy) + ' l S'); }
    function cabecalhoTabela() {
      var cab = cols.map(function (c, i) { return quebra(c.t, cw[i] - 2 * PAD, TAM, true); });
      var n = Math.max.apply(null, cab.map(function (l) { return l.length; })), alt = n * LH + 2 * PAD;
      ret(M, y - alt, util, alt, '0.118 0.227 0.541');
      var x = M; cols.forEach(function (c, i) { cab[i].forEach(function (l, j) { txt(x + PAD, y - PAD - 8.5 - j * LH, l, TAM, true, '1 1 1', c.tipo === 'texto' ? 'l' : 'r', cw[i] - 2 * PAD); }); x += cw[i]; });
      y -= alt;
    }
    function novaPagina(primeira) {
      cs = []; paginas.push(cs);
      ret(0, H - 8, W, 8, '0.118 0.227 0.541');
      if (primeira) {
        txt(M, H - 40, 'INTEGRA', 10, true, '0.118 0.227 0.541');
        txt(M, H - 62, o.titulo, 17, true);
        y = H - 78;
        if (o.subtitulo) { txt(M, y - 8, o.subtitulo, 10, false, '0.2 0.25 0.33'); y -= 16; }
        if (o.filtros && o.filtros.length) { quebra('Filtros: ' + o.filtros.map(function (f) { return f[0] + ': ' + f[1]; }).join(' · '), util, 9, false).forEach(function (l) { txt(M, y - 8, l, 9, false, '0.2 0.25 0.33'); y -= 12; }); }
        txt(M, y - 8, emitido, 9, false, '0.2 0.25 0.33'); y -= 22;
      } else {
        txt(M, H - 32, 'INTEGRA · ' + o.titulo + ' (continuação)', 9, true, '0.118 0.227 0.541'); y = H - 46;
      }
      cabecalhoTabela();
    }
    function desenharLinha(valores, i, total) {
      var cels = cols.map(function (c, k) { return quebra(textoCelula(c.tipo, valores[k]), cw[k] - 2 * PAD, TAM, total); });
      var n = Math.max.apply(null, cels.map(function (l) { return l.length; })), alt = n * LH + 2 * PAD;
      if (y - alt < M + 28) novaPagina(false);
      if (!total && i % 2 === 1) ret(M, y - alt, util, alt, '0.945 0.961 0.976');
      if (total) linha(M, y, M + util, '0.118 0.227 0.541', 1.2);
      var x = M; cols.forEach(function (c, k) { cels[k].forEach(function (l, j) { txt(x + PAD, y - PAD - 8 - j * LH, l, TAM, !!total, null, c.tipo === 'texto' ? 'l' : 'r', cw[k] - 2 * PAD); }); x += cw[k]; });
      linha(M, y - alt, M + util, '0.8 0.835 0.88', 0.4); y -= alt;
    }
    novaPagina(true);
    if (!o.linhas.length) { txt(M + PAD, y - 18, 'Nenhum registro para os filtros escolhidos.', 10, false, '0.2 0.25 0.33'); }
    o.linhas.forEach(function (l, i) { desenharLinha(l, i, false); });
    if (o.totais) desenharLinha(o.totais, 0, true);
    var total = paginas.length;
    paginas.forEach(function (p, i) {
      cs = p; linha(M, 34, W - M, '0.8 0.835 0.88', 0.5);
      txt(M, 22, 'INTEGRA · ' + emitido + '. Contém dados da ONG: uso restrito.', 7.5, false, '0.39 0.45 0.55');
      txt(W - M - 120, 22, 'Página ' + (i + 1) + ' de ' + total, 7.5, false, '0.39 0.45 0.55', 'r', 120);
    });
    /* monta o arquivo (cada caractere = 1 byte) */
    var objs = [];
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[2] = '<< /Type /Pages /Kids [' + paginas.map(function (_, i) { return (6 + 2 * i) + ' 0 R'; }).join(' ') + '] /Count ' + total + ' >>';
    objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    var d = agora, dataPdf = 'D:' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    objs[5] = '<< /Title (' + esc(paraWinAnsi(o.titulo)) + ') /Producer (INTEGRA) /Creator (INTEGRA) /CreationDate (' + dataPdf + ') >>';
    paginas.forEach(function (p, i) {
      var cont = p.join('\n');
      objs[6 + 2 * i] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (7 + 2 * i) + ' 0 R >>';
      objs[7 + 2 * i] = '<< /Length ' + cont.length + ' >>\nstream\n' + cont + '\nendstream';
    });
    var out = '%PDF-1.4\n%âãÏÓ\n', off = [];
    for (var k = 1; k <= 5 + 2 * total; k++) { off[k] = out.length; out += k + ' 0 obj\n' + objs[k] + '\nendobj\n'; }
    var xref = out.length, cnt = 6 + 2 * total;
    out += 'xref\n0 ' + cnt + '\n0000000000 65535 f \n';
    for (k = 1; k < cnt; k++) out += ('0000000000' + off[k]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + cnt + ' /Root 1 0 R /Info 5 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    var bytes = new Uint8Array(out.length); for (var b = 0; b < out.length; b++) bytes[b] = out.charCodeAt(b) & 0xFF;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  /* Registro das exportações (demonstração). No sistema real o servidor grava na auditoria: quem, quando, qual relatório, formato, filtros e quantidade de linhas. */
  var CHAVE = 'integra.auditoria.exportacoes.v1';
  function registrar(r) {
    r.quando = new Date().toISOString();
    try { var a = JSON.parse(localStorage.getItem(CHAVE) || '[]'); a.unshift(r); localStorage.setItem(CHAVE, JSON.stringify(a.slice(0, 50))); } catch (e) { /* sem armazenamento */ }
  }
  function registros() { try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch (e) { return []; } }

  window.INTEGRA_EXPORT = {
    registrar: registrar, registros: registros,
    textoCelula: textoCelula,
    gerar: function (formato, o) { return formato === 'pdf' ? montarPdf(o) : montarXlsx(o); },
    baixar: function (formato, o) {
      var nome = slug(o.nome || o.titulo) + '-' + new Date().toISOString().slice(0, 10) + (formato === 'pdf' ? '.pdf' : '.xlsx');
      baixarBlob(window.INTEGRA_EXPORT.gerar(formato, o), nome); return nome;
    }
  };
})();
