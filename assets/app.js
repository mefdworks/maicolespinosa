/* Michael Espinosa · Estratega Digital — portal personal. Lee el endpoint del Apps Script del agente. */
(function () {
  'use strict';

  // ── Utilidades ──
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var CFG = null;       // { u: url del Apps Script, k: clave }
  var D = null;         // datos del portal
  var VERIF = null;     // "por verificar" (carga perezosa)
  var BIT = {};         // bitácoras por cliente
  var filtros = { cliente: '', perfil: 'Todos', tipo: 'Todos', q: '', tarea: 'Todas', tcliente: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
  function seguro(url) { return /^https?:\/\//i.test(url || '') ? url : '#'; }
  function host(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }

  var ICONOS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    refresh: '<path d="M20 11A8 8 0 006 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0014 4.7l2-2.2"/><path d="M20 20v-4.5h-4.5"/>',
    out: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[n] + '</svg>'; }

  // ── Fechas ──
  function hoyIso() { return (D && D.hoy) || new Date().toISOString().slice(0, 10); }
  function parse(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dias(iso) { return Math.round((parse(iso) - parse(hoyIso())) / 86400000); }
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function corta(iso) { var d = parse(iso); return DIA[d.getDay()] + ' ' + d.getDate() + ' ' + MES[d.getMonth()]; }
  function chipFecha(iso) {
    if (!iso) return '';
    var n = dias(iso);
    if (n < 0) return '<span class="chip late">Vencida · ' + (n === -1 ? 'ayer' : 'hace ' + (-n) + ' d') + '</span>';
    if (n === 0) return '<span class="chip today">Hoy</span>';
    if (n === 1) return '<span class="chip">Mañana</span>';
    return '<span class="chip">' + corta(iso) + '</span>';
  }
  function fechaLarga() {
    var d = parse(hoyIso());
    var t = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()] + ' ' + d.getDate() + ' de ' +
      ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()];
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function saludo() { var h = new Date().getHours(); return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }

  // ── Datos ──
  function api(action, params) {
    var u = new URL(CFG.u);
    u.searchParams.set('action', action);
    u.searchParams.set('t', CFG.k);
    Object.keys(params || {}).forEach(function (k) { u.searchParams.set(k, params[k]); });
    return fetch(u.toString()).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.error) { var e = new Error(j.error); e.auth = j.error === 'no autorizado'; throw e; }
      return j;
    });
  }

  function clienteDe(t) {
    var c = norm(t.cliente), n = norm(t.negocio);
    var lista = D.clientes, i, j, alias;
    for (i = 0; i < lista.length; i++) {
      alias = String(lista[i].alias || '').split(',').map(norm).filter(Boolean);
      alias.push(norm(lista[i].nombre), norm(lista[i].cliente));
      if (c && alias.indexOf(c) >= 0) return lista[i].cliente;
    }
    if (!c) for (j = 0; j < lista.length; j++) { if (norm(lista[j].cliente) === n) return lista[j].cliente; }
    return '';
  }
  function nombreCliente(clave) {
    var c = D.clientes.filter(function (x) { return x.cliente === clave; })[0];
    return c ? c.nombre : '';
  }
  function tareasAbiertas() {
    return D.tareas.map(function (t) { t._c = clienteDe(t); return t; });
  }
  function orden(a, b) {
    var pa = { alta: 0, media: 1, baja: 2 };
    var fa = a.fecha_limite || '9999', fb = b.fecha_limite || '9999';
    return fa < fb ? -1 : fa > fb ? 1 : (pa[a.prioridad] == null ? 1 : pa[a.prioridad]) - (pa[b.prioridad] == null ? 1 : pa[b.prioridad]);
  }
  function inicial(n) { return n.split(/\s+/).map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase(); }
  function clasePerfil(p) { return norm(p) || 'adcom'; }

  // ── Piezas ──
  function filaTarea(t) {
    var cl = t._c ? '<a class="chip ' + clasePerfil((D.clientes.filter(function (c) { return c.cliente === t._c; })[0] || {}).perfil) + '" href="#c/' + esc(t._c) + '">' + esc(nombreCliente(t._c)) + '</a>'
      : (t.cliente || t.negocio ? '<span class="chip">' + esc(t.cliente || t.negocio) + '</span>' : '');
    return '<div class="row"><span class="dot ' + esc(t.prioridad) + '" title="Prioridad ' + esc(t.prioridad) + '"></span><div class="t"><b>' + esc(t.tarea) + '</b>' +
      (t.notas ? '<small>' + esc(t.notas) + '</small>' : '') +
      '<div class="meta">' + chipFecha(t.fecha_limite) + cl + (t.estado === 'en curso' ? '<span class="chip">En curso</span>' : '') + '</div></div></div>';
  }
  function listaTareas(ts, vacio) {
    return ts.length ? '<div class="card list">' + ts.map(filaTarea).join('') + '</div>' : '<div class="card empty">' + esc(vacio) + '</div>';
  }
  function filaLink(l, conCliente) {
    var tipo = String(l.tipo || '').slice(0, 3).toUpperCase();
    return '<a class="lk" href="' + esc(seguro(l.url)) + '" target="_blank" rel="noopener"><span class="ty">' + esc(tipo) + '</span><span class="t"><b>' + esc(l.nombre) + '</b><small>' +
      (conCliente ? esc(nombreCliente(l.cliente)) + ' · ' : '') + esc(l.tipo) + ' · ' + esc(host(l.url)) + '</small></span>' + ic('out') + '</a>';
  }
  function tarjetaFav(l) {
    return '<a class="fav" href="' + esc(seguro(l.url)) + '" target="_blank" rel="noopener"><b>' + esc(l.nombre) + '</b><small>' + esc(l.cliente === 'general' ? l.tipo : nombreCliente(l.cliente)) + '</small></a>';
  }

  // ── Markdown (bitácoras) ──
  function md(src) {
    var inline = function (s) {
      s = esc(s);
      s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
      s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
      return s;
    };
    var cells = function (l) { return l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); }); };
    var L = String(src || '').replace(/\r/g, '').split('\n'), out = [], i = 0, m;
    while (i < L.length) {
      var l = L[i];
      if (!l.trim()) { i++; continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { var n = Math.min(m[1].length, 3); out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^\s*\|/.test(l) && i + 1 < L.length && /^\s*\|?\s*:?-{2,}/.test(L[i + 1])) {
        var head = cells(l), rows = []; i += 2;
        while (i < L.length && /^\s*\|/.test(L[i])) { rows.push(cells(L[i])); i++; }
        out.push('<div class="tw"><table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
        continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        var orde = /^\s*\d+\./.test(l), items = [];
        while (i < L.length && /^\s*([-*]|\d+\.)\s+/.test(L[i])) { items.push(inline(L[i].replace(/^\s*([-*]|\d+\.)\s+/, ''))); i++; }
        out.push((orde ? '<ol>' : '<ul>') + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + (orde ? '</ol>' : '</ul>'));
        continue;
      }
      if (/^>\s?/.test(l)) { var q = []; while (i < L.length && /^>\s?/.test(L[i])) { q.push(inline(L[i].replace(/^>\s?/, ''))); i++; } out.push('<blockquote>' + q.join('<br>') + '</blockquote>'); continue; }
      var par = [];
      while (i < L.length && L[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+\.)\s|>)/.test(L[i])) { par.push(inline(L[i])); i++; }
      if (!par.length) { par.push(inline(L[i])); i++; }
      out.push('<p>' + par.join('<br>') + '</p>');
    }
    return '<div class="md">' + out.join('') + '</div>';
  }

  // ── Vistas ──
  function vHoy() {
    var ts = tareasAbiertas(), h = hoyIso();
    var venc = ts.filter(function (t) { return t.fecha_limite && t.fecha_limite < h; }).sort(orden);
    var hoy = ts.filter(function (t) { return t.fecha_limite === h; }).sort(orden);
    var sem = ts.filter(function (t) { var n = dias(t.fecha_limite || '9999-01-01'); return t.fecha_limite && n > 0 && n <= 7; }).sort(orden);
    var favs = D.enlaces.filter(function (l) { return norm(l.favorito) === 'si'; });
    var ag = D.agenda || [];
    return '<div class="view"><div class="hi"><h1>' + saludo() + ', <em>Michael</em></h1><p>' + fechaLarga() + '</p></div>' +
      '<div class="tiles"><a class="tile late" href="#tareas/venc"><b>' + venc.length + '</b><span>Vencidas</span></a>' +
      '<a class="tile today" href="#tareas/hoy"><b>' + hoy.length + '</b><span>Para hoy</span></a>' +
      '<a class="tile" href="#tareas/sem"><b>' + sem.length + '</b><span>Esta semana</span></a>' +
      '<a class="tile" href="#tareas"><b>' + ts.length + '</b><span>Abiertas</span></a></div>' +
      '<div class="sec"><h2>Agenda de hoy</h2></div>' +
      (ag.length ? '<div class="card list">' + ag.map(function (e) {
        return '<div class="ev"><time>' + esc(e.hora || '·') + '</time><div><b>' + esc(e.titulo) + '</b>' + (e.cal || e.participantes ? '<small>' + esc((e.cal || '').trim().replace(/[()]/g, '')) + (e.participantes ? (e.cal ? ' · ' : '') + esc(e.participantes) : '') + '</small>' : '') + '</div></div>';
      }).join('') + '</div>' : '<div class="card empty">Sin reuniones hoy.</div>') +
      (venc.length ? '<div class="sec"><h2>Vencidas</h2><a href="#tareas/venc">Ver todas</a></div>' + listaTareas(venc.slice(0, 6)) : '') +
      '<div class="sec"><h2>Para hoy</h2></div>' + listaTareas(hoy, 'Nada con fecha de hoy.') +
      (sem.length ? '<div class="sec"><h2>Próximos 7 días</h2><a href="#tareas/sem">Ver todas</a></div>' + listaTareas(sem.slice(0, 6)) : '') +
      '<div class="sec"><h2>Por verificar</h2><button id="ver-verif">Cargar</button></div><div id="verif"><div class="card empty">Lo que cada bitácora dejó pendiente de revisar.</div></div>' +
      (favs.length ? '<div class="sec"><h2>Favoritos</h2><a href="#accesos">Todos los accesos</a></div><div class="favs">' + favs.map(tarjetaFav).join('') + '</div>' : '') +
      '<div class="foot">' + 'Actualizado ' + esc((D.actualizado || '').slice(11, 16)) + ' · <button id="salir">Cerrar sesión</button>' + '</div></div>';
  }
  function posHoy() {
    var b = $('#ver-verif');
    if (b) b.onclick = cargarVerificar;
    var s = $('#salir');
    if (s) s.onclick = function () { lsDel('mp_cfg'); lsDel('mp_cache'); location.hash = ''; location.reload(); };
    if (VERIF) pintarVerificar();
  }
  function cargarVerificar() {
    var cont = $('#verif'), b = $('#ver-verif');
    if (b) b.classList.add('hide');
    cont.innerHTML = '<div class="card loading">Leyendo bitácoras…</div>';
    api('verificar').then(function (r) { VERIF = r; pintarVerificar(); }).catch(function (e) { cont.innerHTML = '<div class="card empty">No pude leerlas: ' + esc(e.message) + '</div>'; if (b) b.classList.remove('hide'); });
  }
  function pintarVerificar() {
    var cont = $('#verif'), b = $('#ver-verif');
    if (!cont || !VERIF) return;
    if (b) b.classList.add('hide');
    cont.innerHTML = VERIF.clientes.length ? '<div class="card">' + VERIF.clientes.map(function (v) {
      var nombre = nombreCliente(v.cliente) || v.cliente;
      return '<details class="vf"><summary>' + esc(nombre) + '</summary>' + md(v.texto) + '</details>';
    }).join('') + '</div>' : '<div class="card empty">Ninguna bitácora tiene pendientes por verificar.</div>';
  }

  function vClientes() {
    var ts = tareasAbiertas(), h = hoyIso(), q = norm(filtros.q);
    var lista = D.clientes.filter(function (c) {
      if (c.cliente === 'general') return false;
      if (filtros.perfil !== 'Todos' && c.perfil !== filtros.perfil) return false;
      return !q || norm(c.nombre + ' ' + c.resumen).indexOf(q) >= 0;
    });
    var chips = ['Todos', 'Adcom', 'Freelance', 'Personal'].map(function (p) { return '<button class="pill' + (filtros.perfil === p ? ' on' : '') + '" data-perfil="' + p + '">' + p + '</button>'; }).join('');
    return '<div class="view"><div class="hi"><h1>Clientes</h1></div>' +
      '<div class="search">' + ic('search') + '<input id="q" type="search" placeholder="Buscar cliente" value="' + esc(filtros.q) + '" autocomplete="off"></div>' +
      '<div class="chips">' + chips + '</div>' +
      '<div class="grid">' + lista.map(function (c) {
        var mias = ts.filter(function (t) { return t._c === c.cliente; });
        var venc = mias.filter(function (t) { return t.fecha_limite && t.fecha_limite < h; }).length;
        var links = D.enlaces.filter(function (l) { return l.cliente === c.cliente; }).length;
        return '<a class="card cl" href="#c/' + esc(c.cliente) + '"><div class="cl-h"><div class="av ' + clasePerfil(c.perfil) + '">' + esc(inicial(c.nombre)) + '</div><div><h3>' + esc(c.nombre) + '</h3><span class="chip ' + clasePerfil(c.perfil) + '">' + esc(c.perfil) + '</span></div></div>' +
          '<p>' + esc(c.resumen) + '</p><div class="cl-f"><span class="chip">' + mias.length + ' tarea' + (mias.length === 1 ? '' : 's') + '</span>' +
          (venc ? '<span class="chip late">' + venc + ' vencida' + (venc === 1 ? '' : 's') + '</span>' : '') + '<span class="chip">' + links + ' acceso' + (links === 1 ? '' : 's') + '</span></div></a>';
      }).join('') + (lista.length ? '' : '<div class="card empty" style="grid-column:1/-1">Ningún cliente coincide.</div>') + '</div></div>';
  }
  function posClientes() {
    var q = $('#q');
    q.oninput = function () { filtros.q = q.value; var pos = q.selectionStart; render(true); var n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    document.querySelectorAll('[data-perfil]').forEach(function (b) { b.onclick = function () { filtros.perfil = b.dataset.perfil; render(true); }; });
  }

  function vCliente(clave, sub) {
    var c = D.clientes.filter(function (x) { return x.cliente === clave; })[0];
    if (!c) return '<div class="view"><a class="back" href="#clientes">' + ic('back') + 'Clientes</a><div class="card empty">No encontré ese cliente.</div></div>';
    sub = sub || 'resumen';
    var ts = tareasAbiertas().filter(function (t) { return t._c === clave; }).sort(orden);
    var ls = D.enlaces.filter(function (l) { return l.cliente === clave; });
    var tabs = [['resumen', 'Resumen'], ['tareas', 'Tareas · ' + ts.length], ['accesos', 'Accesos · ' + ls.length]];
    if (c.bitacora) tabs.push(['bitacora', 'Bitácora']);
    var cuerpo = '';
    if (sub === 'resumen') {
      var reglas = String(c.reglas || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean);
      var favs = ls.filter(function (l) { return norm(l.favorito) === 'si'; });
      cuerpo = '<div class="card">' +
        (reglas.length ? '<div class="facts"><h3>Reglas del cliente</h3><ul>' + reglas.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>' : '') +
        (c.cuentas ? '<div class="facts"><h3>Cuentas</h3><p>' + esc(c.cuentas) + '</p></div>' : '') +
        '<div class="facts"><h3>Perfil de trabajo</h3><p>' + (c.perfil === 'Freelance' ? 'Freelance: se opera con el perfil freelance, nunca con el de Adcom.' : c.perfil === 'Adcom' ? 'Adcom: se opera con el perfil por defecto (sin perfil freelance).' : 'Personal.') + '</p></div></div>' +
        '<div class="sec"><h2>Próximas tareas</h2><a href="#c/' + esc(clave) + '/tareas">Ver todas</a></div>' + listaTareas(ts.slice(0, 4), 'Sin tareas abiertas.') +
        (ls.length ? '<div class="sec"><h2>Accesos clave</h2><a href="#c/' + esc(clave) + '/accesos">Ver todos</a></div><div class="card list">' + (favs.length ? favs : ls.slice(0, 5)).map(function (l) { return filaLink(l); }).join('') + '</div>' : '');
    } else if (sub === 'tareas') {
      cuerpo = listaTareas(ts, 'Sin tareas abiertas.');
    } else if (sub === 'accesos') {
      var tipos = {};
      ls.forEach(function (l) { (tipos[l.tipo] = tipos[l.tipo] || []).push(l); });
      cuerpo = ls.length ? Object.keys(tipos).map(function (t) { return '<div class="grp">' + esc(t) + '</div><div class="card list">' + tipos[t].map(function (l) { return filaLink(l); }).join('') + '</div>'; }).join('') : '<div class="card empty">Todavía no hay accesos para este cliente.</div>';
    } else if (sub === 'bitacora') {
      cuerpo = '<div class="card" id="bit"><div class="loading">Leyendo la bitácora…</div></div>';
    }
    return '<div class="view"><a class="back" href="#clientes">' + ic('back') + 'Clientes</a>' +
      '<div class="ch"><div class="av ' + clasePerfil(c.perfil) + '">' + esc(inicial(c.nombre)) + '</div><div><h1>' + esc(c.nombre) + '</h1><span class="chip ' + clasePerfil(c.perfil) + '">' + esc(c.perfil) + '</span></div></div>' +
      (c.resumen ? '<p style="color:var(--soft);margin-bottom:4px">' + esc(c.resumen) + '</p>' : '') +
      '<div class="sub">' + tabs.map(function (t) { return '<a class="pill' + (sub === t[0] ? ' on' : '') + '" href="#c/' + esc(clave) + '/' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('') + '</div>' + cuerpo + '</div>';
  }
  function posCliente(clave, sub) {
    if (sub !== 'bitacora') return;
    var c = D.clientes.filter(function (x) { return x.cliente === clave; })[0];
    var pintar = function (r) {
      var cont = $('#bit');
      if (!cont) return;
      cont.innerHTML = r.bitacora ? md(r.bitacora) + (r.recortada ? '<div class="empty">Se muestra el inicio; lo más viejo está recortado.</div>' : '') : '<div class="empty">Este cliente todavía no tiene bitácora.</div>';
    };
    if (BIT[c.bitacora]) return pintar(BIT[c.bitacora]);
    api('bitacora', { cliente: c.bitacora }).then(function (r) { BIT[c.bitacora] = r; pintar(r); })
      .catch(function (e) { var cont = $('#bit'); if (cont) cont.innerHTML = '<div class="empty">No pude leerla: ' + esc(e.message) + '</div>'; });
  }

  function vAccesos() {
    var q = norm(filtros.q);
    var tipos = ['Todos'];
    D.enlaces.forEach(function (l) { if (tipos.indexOf(l.tipo) < 0) tipos.push(l.tipo); });
    var ls = D.enlaces.filter(function (l) {
      if (filtros.tipo !== 'Todos' && l.tipo !== filtros.tipo) return false;
      return !q || norm(l.nombre + ' ' + l.tipo + ' ' + nombreCliente(l.cliente) + ' ' + host(l.url)).indexOf(q) >= 0;
    });
    var porCliente = {};
    ls.forEach(function (l) { (porCliente[l.cliente] = porCliente[l.cliente] || []).push(l); });
    var claves = D.clientes.map(function (c) { return c.cliente; }).filter(function (k) { return porCliente[k]; });
    claves.sort(function (a, b) { return a === 'general' ? -1 : b === 'general' ? 1 : 0; });
    return '<div class="view"><div class="hi"><h1>Accesos</h1></div>' +
      '<div class="search">' + ic('search') + '<input id="q" type="search" placeholder="Buscar tablero, hoja o cliente" value="' + esc(filtros.q) + '" autocomplete="off"></div>' +
      '<div class="chips">' + tipos.map(function (t) { return '<button class="pill' + (filtros.tipo === t ? ' on' : '') + '" data-tipo="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
      (claves.length ? claves.map(function (k) {
        return '<div class="grp">' + esc(nombreCliente(k) || k) + '</div><div class="card list">' + porCliente[k].map(function (l) { return filaLink(l); }).join('') + '</div>';
      }).join('') : '<div class="card empty">No hay accesos con ese filtro.</div>') + '</div>';
  }
  function posAccesos() {
    var q = $('#q');
    q.oninput = function () { filtros.q = q.value; var pos = q.selectionStart; render(true); var n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    document.querySelectorAll('[data-tipo]').forEach(function (b) { b.onclick = function () { filtros.tipo = b.dataset.tipo; render(true); }; });
  }

  function vTareas() {
    var h = hoyIso(), ts = tareasAbiertas();
    var f = filtros.tarea;
    ts = ts.filter(function (t) {
      if (filtros.tcliente && t._c !== filtros.tcliente) return false;
      if (f === 'Vencidas') return t.fecha_limite && t.fecha_limite < h;
      if (f === 'Hoy') return t.fecha_limite === h;
      if (f === 'Semana') { var n = t.fecha_limite ? dias(t.fecha_limite) : -1; return n >= 0 && n <= 7; }
      if (f === 'Sin fecha') return !t.fecha_limite;
      return true;
    }).sort(orden);
    var opciones = D.clientes.filter(function (c) { return c.cliente !== 'general'; });
    return '<div class="view"><div class="hi"><h1>Tareas</h1></div><div class="chips">' +
      ['Todas', 'Vencidas', 'Hoy', 'Semana', 'Sin fecha'].map(function (x) { return '<button class="pill' + (f === x ? ' on' : '') + '" data-tarea="' + x + '">' + x + '</button>'; }).join('') +
      '<select class="pill" id="tcl" aria-label="Cliente"><option value="">Todos los clientes</option>' + opciones.map(function (c) { return '<option value="' + esc(c.cliente) + '"' + (filtros.tcliente === c.cliente ? ' selected' : '') + '>' + esc(c.nombre) + '</option>'; }).join('') + '</select></div>' +
      listaTareas(ts, 'No hay tareas con ese filtro.') + '</div>';
  }
  function posTareas() {
    document.querySelectorAll('[data-tarea]').forEach(function (b) { b.onclick = function () { filtros.tarea = b.dataset.tarea; render(true); }; });
    $('#tcl').onchange = function (e) { filtros.tcliente = e.target.value; render(true); };
  }

  // ── Router ──
  var TABS = [['hoy', 'Hoy', 'home'], ['clientes', 'Clientes', 'users'], ['tareas', 'Tareas', 'check'], ['accesos', 'Accesos', 'link']];
  function ruta() {
    var p = (location.hash || '#hoy').slice(1).split('/');
    return { v: p[0] || 'hoy', a: p[1] || '', b: p[2] || '' };
  }
  function pintarTabs(activa) {
    var venc = D ? tareasAbiertas().filter(function (t) { return t.fecha_limite && t.fecha_limite < hoyIso(); }).length : 0;
    $('#tabs').innerHTML = TABS.map(function (t) {
      return '<a href="#' + t[0] + '" class="' + (activa === t[0] ? 'on' : '') + '">' + ic(t[2]) + t[1] + (t[0] === 'hoy' && venc ? '<span class="badge">' + venc + '</span>' : '') + '</a>';
    }).join('');
  }
  function render(mismo) {
    if (!D) return;
    var r = ruta(), html = '', pos = function () {};
    if (!mismo && r.v === 'tareas') { filtros.tarea = { venc: 'Vencidas', hoy: 'Hoy', sem: 'Semana' }[r.a] || 'Todas'; filtros.tcliente = ''; }
    var activa = r.v === 'c' ? 'clientes' : r.v;
    if (r.v === 'clientes') { html = vClientes(); pos = posClientes; }
    else if (r.v === 'c') { html = vCliente(r.a, r.b); pos = function () { posCliente(r.a, r.b || 'resumen'); }; }
    else if (r.v === 'accesos') { html = vAccesos(); pos = posAccesos; }
    else if (r.v === 'tareas') { html = vTareas(); pos = posTareas; }
    else { html = vHoy(); pos = posHoy; activa = 'hoy'; }
    var y = window.scrollY;
    $('#view').innerHTML = html;
    if (mismo) { $('.view').style.animation = 'none'; window.scrollTo(0, y); } else window.scrollTo(0, 0);
    pintarTabs(activa);
    pos();
  }
  window.addEventListener('hashchange', function () { render(false); });

  // ── Arranque ──
  function mostrar(que) {
    $('#login').classList.toggle('hide', que !== 'login');
    $('#app').classList.toggle('hide', que !== 'app');
  }
  function girar(on) { var b = $('#refresh'); b.classList.toggle('spin', on); }
  function cargar(silencioso) {
    girar(true);
    return api('datos').then(function (j) {
      D = j; lsSet('mp_cache', JSON.stringify(j));
      mostrar('app'); render(!!silencioso);
    }).catch(function (e) {
      if (e.auth) { lsDel('mp_cfg'); lsDel('mp_cache'); CFG = null; D = null; mostrar('login'); var m = $('#login-err'); m.textContent = 'La clave ya no es válida. Abre de nuevo el enlace de instalación.'; m.classList.remove('hide'); return; }
      if (D) { var v = $('#view'); if (!v.querySelector('.banner')) v.insertAdjacentHTML('afterbegin', '<div class="banner">Sin conexión con los datos. Muestro lo último que guardé.</div>'); }
      else { mostrar('login'); var m2 = $('#login-err'); m2.textContent = 'No pude conectar: ' + e.message; m2.classList.remove('hide'); }
    }).then(function () { girar(false); });
  }

  // Dirección del Apps Script del agente. Sola no da acceso a nada: sin la clave responde "no autorizado".
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxmVtjvsmTBMg81foW9QJmsrEzeywOiR2BKiMZBzlIP4-VgNlPwkqS8FVJo-CcrsWi/exec';
  function guardarClave(k) {
    if (!/^[A-Za-z0-9_-]{16,}$/.test(k)) return false;
    lsSet('mp_cfg', JSON.stringify({ u: SCRIPT_URL, k: k }));
    return true;
  }

  // Guarda #u=...&k=... si trae las dos partes; devuelve si lo guardó.
  function guardarEnlace(hash) {
    var h = String(hash || '').replace(/^#/, '');
    if (!/(^|&)k=/.test(h) || !/(^|&)u=/.test(h)) return false;
    var p = new URLSearchParams(h);
    if (!/^https:\/\/script\.google\.com\//.test(p.get('u') || '') || !p.get('k')) return false;
    lsSet('mp_cfg', JSON.stringify({ u: p.get('u'), k: p.get('k') }));
    return true;
  }

  function iniciar() {
    $('#refresh').innerHTML = ic('refresh');
    $('#refresh').onclick = function () { BIT = {}; VERIF = null; cargar(true); };
    // Enlace de instalación: #u=<url del script>&k=<clave>
    guardarEnlace(location.hash);
    if (/(^|&)k=/.test(location.hash)) history.replaceState(null, '', location.pathname + '#hoy');
    $('#entrar').onclick = function () {
      var m = $('#login-err'), txt = $('#enlace').value.trim();
      var ok = txt.indexOf('#') >= 0 ? guardarEnlace(txt.slice(txt.indexOf('#'))) : guardarClave(txt);
      if (!ok) { m.textContent = 'No reconozco eso. Pega la clave (PORTAL_TOKEN) o el enlace completo.'; m.classList.remove('hide'); return; }
      m.classList.add('hide');
      iniciar();
    };
    try { CFG = JSON.parse(lsGet('mp_cfg') || 'null'); } catch (e) { CFG = null; }
    if (!CFG || !CFG.u || !CFG.k) { mostrar('login'); return; }
    try { D = JSON.parse(lsGet('mp_cache') || 'null'); } catch (e2) { D = null; }
    if (D) { mostrar('app'); render(false); }
    cargar(!!D);
  }
  iniciar();
})();
