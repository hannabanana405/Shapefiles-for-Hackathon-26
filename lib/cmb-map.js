/*! Cotality Heatmap renderer v1.2.0 — reads window.CMB_MAP, loads Census boundaries from the same repo. */
(function () {
  'use strict';
  var VERSION = '1.2.0';
  var CSS = "/* Layout: one-screen app \u2014 full-bleed map canvas on the left, a cream \"field notes\" panel on the right; stacks map-over-panel on phones. */\n:root {\n  --bg: #F7EFE2;          /* Cream */\n  --surface: #FFFFFF;\n  --surface-2: #FBF6EE;\n  --fg: #1E1405;          /* Earth */\n  --muted: #6E5F4C;\n  --line: #E3D6C2;\n  --line-strong: #CBB99F;\n  --accent: #8A04CF;      /* Violet, darkened for text contrast */\n  --accent-soft: #F1E2FD;\n  --on-accent: #FFFFFF;\n  --sunray: #FFCD2E;\n  --good: #0B7A55;\n  --good-soft: #DDF3EA;\n  --warn: #9A6A00;\n  --warn-soft: #FFF1C9;\n  --bad: #B3233A;\n  --bad-soft: #FBE1E5;\n  --map-bg: #EFE4D1;\n  --nodata: #E4D7C2;\n  --insufficient: #CDBFA9;\n  --area-line: rgba(30, 20, 5, 0.16);\n  --state-line: rgba(30, 20, 5, 0.62);\n  --hover-line: #1E1405;\n  --select-line: #8A04CF;\n  --shadow: 0 1px 2px rgba(30, 20, 5, .08), 0 6px 18px rgba(30, 20, 5, .08);\n  --font-body: \"Hanken Grotesk\", Arial, Helvetica, sans-serif;\n  --font-mono: \"IBM Plex Mono\", \"Courier New\", ui-monospace, monospace;\n  --r: 6px;\n}\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme=\"light\"]) {\n    --bg: #1E1405; --surface: #2A1E10; --surface-2: #241A0C; --fg: #F7EFE2; --muted: #BBAA92;\n    --line: #43351F; --line-strong: #5C4A30; --accent: #D79BFF; --accent-soft: #3A2153; --on-accent: #1E1405;\n    --good: #5FD3A6; --good-soft: #143528; --warn: #F2C14E; --warn-soft: #3A2C0A; --bad: #FF8A9A; --bad-soft: #3D1820;\n    --map-bg: #150E03; --nodata: #33281A; --insufficient: #4D3F2D;\n    --area-line: rgba(247, 239, 226, 0.13); --state-line: rgba(247, 239, 226, 0.55);\n    --hover-line: #F7EFE2; --select-line: #D79BFF;\n    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35);\n    color-scheme: dark;\n  }\n}\n:root[data-theme=\"dark\"] {\n  --bg: #1E1405; --surface: #2A1E10; --surface-2: #241A0C; --fg: #F7EFE2; --muted: #BBAA92;\n  --line: #43351F; --line-strong: #5C4A30; --accent: #D79BFF; --accent-soft: #3A2153; --on-accent: #1E1405;\n  --good: #5FD3A6; --good-soft: #143528; --warn: #F2C14E; --warn-soft: #3A2C0A; --bad: #FF8A9A; --bad-soft: #3D1820;\n  --map-bg: #150E03; --nodata: #33281A; --insufficient: #4D3F2D;\n  --area-line: rgba(247, 239, 226, 0.13); --state-line: rgba(247, 239, 226, 0.55);\n  --hover-line: #F7EFE2; --select-line: #D79BFF;\n  --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35);\n  color-scheme: dark;\n}\n\n[hidden] { display: none !important; }\nhtml, body { height: 100%; }\nbody { margin: 0; }\nbody { background: var(--bg); color: var(--fg); font-family: var(--font-body); font-size: 14px; line-height: 1.45; }\n* { box-sizing: border-box; }\nbutton, input, select, textarea { font: inherit; color: inherit; }\n:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }\n.eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }\n.mono { font-family: var(--font-mono); font-size: 12px; }\nh1, h2 { text-wrap: balance; margin: 0; font-weight: 600; }\n\n.app { height: 100%; display: grid; grid-template-rows: auto 1fr; }\n\n/* Top bar */\n.top {\n  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;\n  padding-block: 10px;\n  padding-left: max(16px, env(safe-area-inset-left, 0px));\n  padding-right: max(16px, env(safe-area-inset-right, 0px));\n  border-bottom: 1px solid var(--line); background: var(--bg);\n}\n.brand { display: flex; align-items: center; gap: 10px; }\n.brand-name { font-weight: 700; font-size: 17px; letter-spacing: -.01em; }\n.brand-name sup { font-size: 9px; font-weight: 500; }\n.brand-divider { width: 0; height: 0; border-left: 7px solid var(--fg); border-top: 4px solid transparent; border-bottom: 4px solid transparent; opacity: .8; }\n.brand-tool { font-family: var(--font-mono); font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }\n.top-mid { flex: 1 1 auto; display: flex; align-items: center; gap: 12px; min-width: 0; }\n.metric-pick { display: flex; align-items: center; gap: 8px; min-width: 0; }\n.metric-pick select { border: 1px solid var(--line-strong); background: var(--surface); border-radius: var(--r); padding: 6px 8px; max-width: 320px; min-width: 0; font-weight: 500; }\n.icon-btn { border: 1px solid var(--line-strong); background: var(--surface); border-radius: var(--r); width: 34px; height: 34px; cursor: pointer; display: grid; place-items: center; }\n.icon-btn:hover { border-color: var(--fg); }\n.icon-btn svg { width: 16px; height: 16px; }\n.fallback { padding: 40px 20px; font-family: var(--font-body); }\n.top-actions { display: flex; gap: 8px; align-items: center; }\n.demo-pick { display: flex; align-items: center; gap: 8px; }\n.demo-pick select { border: 1px solid var(--line-strong); background: var(--surface); border-radius: var(--r); padding: 5px 8px; max-width: 220px; }\n.chip { font-family: var(--font-mono); font-size: 11px; padding: 3px 8px; border-radius: 999px; background: var(--warn-soft); color: var(--warn); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }\n\n.btn {\n  border: 1px solid var(--line-strong); background: var(--surface); padding: 7px 12px; border-radius: var(--r);\n  cursor: pointer; font-weight: 500; white-space: nowrap;\n}\n.btn:hover { border-color: var(--fg); }\n.btn.primary { background: var(--fg); color: var(--bg); border-color: var(--fg); }\n.btn.primary:hover { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }\n.menu { position: relative; }\n.menu-list {\n  position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; min-width: 220px;\n  background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r); box-shadow: var(--shadow); padding: 4px;\n  display: grid;\n}\n.menu-list button { text-align: left; border: 0; background: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; }\n.menu-list button:hover { background: var(--surface-2); }\n\n/* Body */\n.body { display: grid; grid-template-columns: minmax(0, 1fr) 360px; min-height: 0; }\n.mapwrap { position: relative; min-height: 0; overflow: hidden; background: var(--map-bg); touch-action: none; }\n#cmb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; }\n#cmb-canvas.dragging { cursor: grabbing; }\n\n.map-title {\n  position: absolute; left: 16px; top: 16px; max-width: min(460px, calc(100% - 320px));\n  background: color-mix(in srgb, var(--surface) 92%, transparent); border: 1px solid var(--line);\n  padding: 12px 14px 12px; border-radius: var(--r); box-shadow: var(--shadow); pointer-events: none;\n  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 24px) 100%, 0 100%);\n}\n.map-title h1 { font-size: 19px; line-height: 1.2; letter-spacing: -.01em; }\n.map-title p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }\n.map-title p:empty { display: none; }\n\n.search { position: absolute; right: 16px; top: 16px; width: min(260px, calc(100% - 32px)); z-index: 5; }\n.search input { width: 100%; padding: 8px 10px; border-radius: var(--r); border: 1px solid var(--line-strong); background: var(--surface); box-shadow: var(--shadow); }\n.search-results { list-style: none; margin: 4px 0 0; padding: 4px; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r); box-shadow: var(--shadow); max-height: 280px; overflow: auto; }\n.search-results li { padding: 6px 8px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; }\n.search-results li[aria-selected=\"true\"], .search-results li:hover { background: var(--surface-2); }\n.search-results .v { font-family: var(--font-mono); font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }\n\n.zoom { position: absolute; right: 16px; top: 64px; display: grid; gap: 0; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r); box-shadow: var(--shadow); overflow: hidden; }\n.zoom button { border: 0; background: none; width: 36px; height: 34px; font-size: 18px; cursor: pointer; }\n.zoom button + button { border-top: 1px solid var(--line); }\n.zoom button:hover { background: var(--surface-2); }\n.zoom .fit { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }\n\n.legend {\n  position: absolute; left: 16px; bottom: 30px; width: 272px; max-width: calc(100% - 32px);\n  background: color-mix(in srgb, var(--surface) 94%, transparent); border: 1px solid var(--line);\n  border-radius: var(--r); padding: 10px 12px; box-shadow: var(--shadow);\n}\n.legend-head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }\n.legend-hint { font-size: 11px; color: var(--muted); }\n.hist { width: 100%; height: 44px; display: block; margin: 6px 0 4px; }\n.legend-rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }\n.legend-rows li { display: grid; grid-template-columns: 18px 1fr auto; gap: 8px; align-items: center; padding: 2px 4px; border-radius: 4px; cursor: pointer; font-family: var(--font-mono); font-size: 12px; font-variant-numeric: tabular-nums; }\n.legend-rows li:hover { background: var(--surface-2); }\n.legend-rows li.off { opacity: .35; }\n.legend-rows li.static { cursor: default; }\n.legend-rows li.static:hover { background: none; }\n.legend-rows .sw { width: 18px; height: 12px; border-radius: 2px; border: 1px solid var(--area-line); }\n.legend-rows .ct { color: var(--muted); font-size: 11px; }\n\n.tooltip {\n  position: absolute; z-index: 10; pointer-events: none; min-width: 180px; max-width: 280px;\n  background: var(--fg); color: var(--bg); padding: 8px 10px; border-radius: var(--r); box-shadow: var(--shadow); font-size: 13px;\n}\n.tooltip .t-name { font-weight: 600; }\n.tooltip .t-sub { opacity: .75; font-size: 12px; }\n.tooltip .t-val { font-family: var(--font-mono); font-size: 16px; margin-top: 4px; font-variant-numeric: tabular-nums; }\n.tooltip .t-meta { font-family: var(--font-mono); font-size: 11px; opacity: .8; }\n\n.map-status { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; padding: 24px; background: color-mix(in srgb, var(--map-bg) 70%, transparent); font-family: var(--font-mono); font-size: 13px; z-index: 8; }\n.map-status .box { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 18px 20px; max-width: 420px; box-shadow: var(--shadow); font-family: var(--font-body); font-size: 14px; display: grid; gap: 10px; justify-items: center; }\n.dropveil { position: absolute; inset: 8px; border: 2px dashed var(--accent); border-radius: 10px; display: grid; place-items: center; background: color-mix(in srgb, var(--accent-soft) 80%, transparent); z-index: 20; font-weight: 600; font-size: 18px; }\n.map-source { position: absolute; left: 16px; bottom: 6px; margin: 0; font-family: var(--font-mono); font-size: 10px; color: var(--muted); max-width: calc(100% - 32px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n\n/* Panel */\n.panel {\n  border-left: 1px solid var(--line); background: var(--bg); overflow: auto; min-height: 0;\n  padding-block: 14px; padding-left: 14px; padding-right: max(14px, env(safe-area-inset-right, 0px));\n  display: flex; flex-direction: column; gap: 12px;\n}\n.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 12px 14px; display: grid; gap: 10px; min-width: 0; }\n.card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }\n.card h2 { font-size: 13px; font-family: var(--font-mono); font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }\n.pill { font-family: var(--font-mono); font-size: 11px; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }\n.pill.good { background: var(--good-soft); color: var(--good); }\n.pill.warn { background: var(--warn-soft); color: var(--warn); }\n.pill.bad { background: var(--bad-soft); color: var(--bad); }\n.pill:empty { display: none; }\n\n.stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; margin: 0; }\n.stats div { display: grid; gap: 1px; }\n.stats dt { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }\n.stats dd { margin: 0; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }\n.notes { display: grid; gap: 6px; }\n.notes:empty { display: none; }\n.note { font-size: 12.5px; padding: 6px 8px; border-radius: 4px; background: var(--surface-2); border-left: 3px solid var(--line-strong); }\n.note.warn { border-left-color: var(--warn); }\n.note.info { border-left-color: var(--accent); }\n.unmatched summary { cursor: pointer; font-size: 12.5px; color: var(--bad); }\n.unmatched ul { margin: 6px 0 0; padding: 0; list-style: none; font-family: var(--font-mono); font-size: 12px; max-height: 160px; overflow: auto; display: grid; gap: 2px; }\n.unmatched li { display: flex; justify-content: space-between; gap: 8px; }\n\n.setup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }\n.field { display: grid; gap: 4px; min-width: 0; border: 0; padding: 0; margin: 0; }\n.field.wide { grid-column: 1 / -1; }\n.field > span, .field > legend { font-size: 12px; color: var(--muted); padding: 0; }\n.field input, .field select, .field textarea {\n  width: 100%; min-width: 0; border: 1px solid var(--line-strong); background: var(--surface); border-radius: var(--r); padding: 6px 8px;\n}\n.field textarea { resize: vertical; }\n.with-unit { display: flex; align-items: center; gap: 6px; }\n.with-unit input { width: 76px; flex: none; }\n.with-unit em { font-style: normal; font-size: 12px; color: var(--muted); }\n.scheme-row { display: flex; flex-wrap: wrap; gap: 6px; }\n.scheme { border: 1px solid var(--line-strong); background: var(--surface); border-radius: var(--r); padding: 4px; cursor: pointer; display: grid; gap: 3px; }\n.scheme .ramp { display: flex; width: 70px; height: 10px; border-radius: 2px; overflow: hidden; }\n.scheme .ramp i { flex: 1; }\n.scheme span { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }\n.scheme[aria-pressed=\"true\"] { border-color: var(--fg); box-shadow: inset 0 0 0 1px var(--fg); }\n.scheme[aria-pressed=\"true\"] span { color: var(--fg); }\n\n.seg { display: flex; border: 1px solid var(--line-strong); border-radius: var(--r); overflow: hidden; }\n.seg button { border: 0; background: none; padding: 3px 9px; font-size: 12px; cursor: pointer; }\n.seg button.on { background: var(--fg); color: var(--bg); }\n.rank { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; counter-reset: r; }\n.rank li { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 5px 4px; border-radius: 4px; cursor: pointer; }\n.rank li:hover { background: var(--surface-2); }\n.rank .n { font-family: var(--font-mono); font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }\n.rank .nm { min-width: 0; display: grid; gap: 3px; }\n.rank .nm b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.rank .bar { height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; }\n.rank .bar i { display: block; height: 100%; }\n.rank .v { font-family: var(--font-mono); font-size: 12px; font-variant-numeric: tabular-nums; }\n.rank-empty { color: var(--muted); font-size: 13px; }\n\n.detail { border-color: var(--fg); }\n.detail .d-name { font-size: 17px; font-weight: 600; }\n.detail .d-sub { color: var(--muted); font-size: 12.5px; }\n.detail .d-big { font-family: var(--font-mono); font-size: 26px; font-variant-numeric: tabular-nums; }\n.detail .d-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }\n.detail .d-grid div { display: grid; }\n.detail .d-grid dt { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }\n.detail .d-grid dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 600; }\n.detail .d-close { border: 0; background: none; cursor: pointer; font-size: 18px; line-height: 1; color: var(--muted); }\n.detail .d-pos { position: relative; height: 18px; }\n.detail .d-pos .track { position: absolute; left: 0; right: 0; top: 7px; height: 4px; border-radius: 2px; }\n.detail .d-pos .mk { position: absolute; top: 0; width: 2px; height: 18px; background: var(--fg); }\n\n@media (max-width: 900px) {\n  html, body { height: auto; }\n  .app { height: auto; min-height: 100%; }\n  .body { grid-template-columns: minmax(0, 1fr); }\n  .mapwrap { height: 68vh; min-height: 420px; }\n  .panel {\n    border-left: 0; border-top: 1px solid var(--line); overflow: visible;\n    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));\n  }\n  .top-mid { order: 3; flex-basis: 100%; }\n  .search { left: 16px; right: 64px; width: auto; }\n  .zoom { top: 16px; }\n  .map-title { top: 62px; max-width: calc(100% - 96px); padding: 8px 10px 10px; }\n  .map-title h1 { font-size: 16px; }\n  .map-title p { font-size: 12px; }\n  .legend { width: auto; right: 64px; bottom: 24px; padding: 8px 10px; }\n  .legend-hint, .hist { display: none; }\n  .legend-rows { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8px; }\n  .legend-rows li { font-size: 11px; grid-template-columns: 14px 1fr auto; gap: 6px; }\n  .legend-rows .sw { width: 14px; height: 10px; }\n}\n@media (max-width: 520px) {\n  .top-actions { flex-wrap: wrap; }\n  .legend { right: 16px; }\n  .legend-rows .ct { display: none; }\n}\n@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }\n\n.display { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }\n.check-row { font-size: 12.5px; display: flex; justify-content: space-between; gap: 8px; }\n.check-row span:last-child { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }\n.about { font-size: 12px; color: var(--muted); }\n.about a { color: var(--accent); }\n";
  var script = document.currentScript;
  var BASE = window.CMB_BASE || (script && script.src ? script.src.replace(/lib\/cmb-map(\.min)?\.js(\?.*)?$/, '') : '');
  var CFG = window.CMB_MAP;

  /* ---------- small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n0(x) { return (+x || 0).toLocaleString('en-US'); }
  function titleCase(s) { return String(s || '').toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function fail(title, detail) {
    var fb = $('cmb-fallback'); if (fb) fb.remove();
    var box = document.createElement('div');
    box.style.cssText = 'max-width:640px;margin:48px auto;padding:20px 24px;border:1px solid #CBB99F;border-radius:8px;font-family:Arial,sans-serif;background:#FFF;color:#1E1405;line-height:1.5';
    box.innerHTML = '<h2 style="margin:0 0 8px;font-size:18px">' + esc(title) + '</h2><div>' + detail + '</div>';
    document.body.appendChild(box);
  }

  /* ---------- formatting ---------- */
  function fmt(v, format, opts) {
    if (v == null || !isFinite(v)) return '—';
    opts = opts || {}; var short = opts.short, d = opts.decimals;
    function num(x, dd) { return x.toLocaleString('en-US', { minimumFractionDigits: dd, maximumFractionDigits: dd }); }
    function compact(x, p) {
      var a = Math.abs(x), s;
      if (a >= 1e9) s = num(x / 1e9, a >= 1e10 ? 0 : 1) + 'B';
      else if (a >= 1e6) s = num(x / 1e6, a >= 1e7 ? 0 : 1) + 'M';
      else if (a >= 1e4) s = num(x / 1e3, 0) + 'K';
      else s = num(x, Number.isInteger(x) ? 0 : 1);
      return (p || '') + s;
    }
    switch (format) {
      case 'count': return short ? compact(v) : num(v, d == null ? (Number.isInteger(v) ? 0 : 1) : d);
      case 'currency': return short ? compact(v, '$') : '$' + num(v, d == null ? 0 : d);
      case 'percentFraction': return num(v * 100, d == null ? (short ? 0 : 1) : d) + '%';
      case 'percent': return num(v, d == null ? (short ? 0 : 1) : d) + '%';
      case 'rate': return num(v, d == null ? (short ? 2 : 3) : d) + '%';
      case 'years': return num(v, d == null ? (short ? 0 : 1) : d) + ' yrs';
      default:
        if (short && Math.abs(v) >= 1e4) return compact(v);
        return num(v, d == null ? (Number.isInteger(v) ? 0 : (Math.abs(v) < 10 ? 2 : 1)) : d);
    }
  }

  /* ---------- colors ---------- */
  var SCHEMES = {
    sunrise: { label: 'Sunrise', stops: ['#FFE9A3', '#FFCD2E', '#FF8E65', '#FF6E80', '#DD37D2', '#A805FB', '#55038A'] },
    azure: { label: 'Azure', stops: ['#DCEEFF', '#8EC3F5', '#3B8FE0', '#1A62B8', '#0B3A78'] },
    teal: { label: 'Teal', stops: ['#D5F3EC', '#86D6C3', '#2BA48F', '#0F7568', '#06443D'] },
    violet: { label: 'Violet', stops: ['#F1E2FD', '#D3A2FA', '#A805FB', '#7004AD', '#3E0263'] },
    diverging: { label: 'Diverging', stops: ['#0B4F6C', '#4FA3B5', '#E8E0D2', '#FF8E65', '#B3233A'] }
  };
  function hexRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function rgbHex(c) { return '#' + c.map(function (x) { return Math.round(x).toString(16).padStart(2, '0'); }).join(''); }
  function ramp(name, n) {
    var st = (SCHEMES[name] || SCHEMES.sunrise).stops.map(hexRgb), out = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? .5 : i / (n - 1) * (st.length - 1), a = Math.floor(t), b = Math.min(st.length - 1, a + 1), f = t - a;
      out.push(rgbHex([0, 1, 2].map(function (c) { return st[a][c] + (st[b][c] - st[a][c]) * f; })));
    }
    return out;
  }

  /* ---------- classification ---------- */
  function classify(values, method, k) {
    var s = values.filter(isFinite).sort(function (a, b) { return a - b; });
    if (!s.length) return { breaks: [], min: NaN, max: NaN, sorted: s };
    var br = [], i;
    if (method === 'equal') { for (i = 1; i < k; i++) br.push(s[0] + (s[s.length - 1] - s[0]) * i / k); }
    else if (method === 'jenks') br = jenks(s, k);
    else { for (i = 1; i < k; i++) br.push(s[Math.min(s.length - 1, Math.floor(i * s.length / k))]); }
    var clean = [];
    br.forEach(function (x) { if (x > s[0] && x < s[s.length - 1] && (!clean.length || x > clean[clean.length - 1])) clean.push(x); });
    if (!clean.length && s[0] !== s[s.length - 1]) clean.push((s[0] + s[s.length - 1]) / 2);
    return { breaks: clean, min: s[0], max: s[s.length - 1], sorted: s };
  }
  function jenks(sorted, k) {
    var d = sorted, i, j;
    if (d.length > 1000) { var smp = []; for (i = 0; i < 1000; i++) smp.push(sorted[Math.floor(i * (sorted.length - 1) / 999)]); d = smp; }
    var n = d.length; if (n <= k) return d.slice(0, -1);
    var m1 = [], m2 = [];
    for (i = 0; i <= n; i++) { m1.push(new Array(k + 1).fill(0)); m2.push(new Array(k + 1).fill(0)); }
    for (j = 1; j <= k; j++) { m1[1][j] = 1; for (i = 2; i <= n; i++) m2[i][j] = Infinity; }
    for (var l = 2; l <= n; l++) {
      var s1 = 0, s2 = 0, w = 0, v = 0;
      for (var m = 1; m <= l; m++) {
        var i3 = l - m + 1, val = d[i3 - 1]; s2 += val * val; s1 += val; w++; v = s2 - s1 * s1 / w;
        var i4 = i3 - 1;
        if (i4) for (j = 2; j <= k; j++) if (m2[l][j] >= v + m2[i4][j - 1]) { m1[l][j] = i3; m2[l][j] = v + m2[i4][j - 1]; }
      }
      m1[l][1] = 1; m2[l][1] = v;
    }
    var b = [], kk = n;
    for (j = k; j >= 2; j--) { b.unshift(d[m1[kk][j] - 2]); kk = m1[kk][j] - 1; }
    return b;
  }
  function classOf(v, br) { for (var i = 0; i < br.length; i++) if (v <= br[i]) return i; return br.length; }

  /* ---------- projection: Albers equal-area conic for the U.S. ---------- */
  var R = Math.PI / 180, P1 = 29.5 * R, P2 = 45.5 * R, P0 = 37.5 * R, L0 = -96 * R;
  var NN = (Math.sin(P1) + Math.sin(P2)) / 2, CC = Math.cos(P1) * Math.cos(P1) + 2 * NN * Math.sin(P1), RHO0 = Math.sqrt(CC - 2 * NN * Math.sin(P0)) / NN;
  function proj(lon, lat) {
    if (lon > 0) lon -= 360; // Aleutian Islands west of 180°
    var rho = Math.sqrt(Math.max(0, CC - 2 * NN * Math.sin(lat * R))) / NN, th = NN * (lon * R - L0);
    return [rho * Math.sin(th) * 1000, (RHO0 - rho * Math.cos(th)) * 1000];
  }

  /* ---------- county name normalization (matches v1/lookups/county_names.json) ---------- */
  function normCounty(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.toUpperCase().trim().replace(/&/g, ' AND ').replace(/[.'’]/g, '').replace(/\s+/g, ' ');
    s = s.replace(/^SAINTE\s/, 'STE ').replace(/^SAINT\s/, 'ST ');
    s = s.replace(/\s+(COUNTY|PARISH|BOROUGH|CENSUS AREA|CITY AND BOROUGH|MUNICIPALITY|MUNICIPIO|PLANNING REGION)$/, '');
    return s.replace(/[^A-Z0-9]/g, '');
  }
  function digits(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
  function zip5(s) {
    var t = String(s == null ? '' : s).trim(); if (!t) return null;
    var d = digits(t.split('-')[0].split('.')[0]);
    if (d.length === 9) d = d.slice(0, 5);
    return d.length >= 3 && d.length <= 5 ? d.padStart(5, '0') : null;
  }
  function tract6(v) {
    var s = String(v == null ? '' : v).trim(); if (!s) return null;
    if (s.indexOf('.') >= 0) { var a = digits(s.split('.')[0]), b = digits(s.split('.')[1]); return a.length && a.length <= 4 ? a.padStart(4, '0') + (b + '00').slice(0, 2) : null; }
    var d = digits(s);
    if (d.length === 11) return d.slice(5);
    if (d.length === 6) return d;
    if (d.length && d.length <= 4) return d.padStart(4, '0') + '00';
    return null;
  }
  function pad(s, n) { var d = digits(String(s == null ? '' : s).split('.')[0]); return d && d.length <= n ? d.padStart(n, '0') : null; }

  /* ---------- data loading ---------- */
  var cache = {};
  // Backup source: if jsDelivr refuses a file, fetch the same release straight from GitHub.
  var RAW = (function () { var m = BASE.match(/cdn\.jsdelivr\.net\/gh\/([^/]+)\/([^@/]+)@([^/]+)\//); return m ? 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3] + '/' : null; })();
  function fetchJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  function getJSON(path) {
    if (window.CMB_FILES && window.CMB_FILES[path]) return Promise.resolve(window.CMB_FILES[path]);
    if (cache[path]) return cache[path];
    return (cache[path] = fetchJSON(BASE + path).catch(function (e1) {
      if (!RAW) throw new Error('Could not load ' + path + ' (' + e1.message + ').');
      return fetchJSON(RAW + path).catch(function (e2) { throw new Error('Could not load ' + path + ' (' + e1.message + '; backup source: ' + e2.message + ').'); });
    }));
  }
  function prepFeatures(gj, level) {
    return gj.features.map(function (f) {
      var g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates, rings = [], bb = [Infinity, Infinity, -Infinity, -Infinity], bestA = -1, label = null;
      polys.forEach(function (poly) {
        poly.forEach(function (ring, ri) {
          var a = new Float64Array(ring.length * 2), area = 0, cx = 0, cy = 0;
          for (var i = 0; i < ring.length; i++) {
            var p = proj(ring[i][0], ring[i][1]); a[i * 2] = p[0]; a[i * 2 + 1] = p[1];
            if (p[0] < bb[0]) bb[0] = p[0]; if (p[0] > bb[2]) bb[2] = p[0]; if (p[1] < bb[1]) bb[1] = p[1]; if (p[1] > bb[3]) bb[3] = p[1];
          }
          if (ri === 0) {
            for (var j = 0, n = ring.length - 1; j < n; j++) {
              var x0 = a[j * 2], y0 = a[j * 2 + 1], x1 = a[j * 2 + 2], y1 = a[j * 2 + 3], c = x0 * y1 - x1 * y0;
              area += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
            }
            if (Math.abs(area) > bestA && area !== 0) { bestA = Math.abs(area); label = [cx / (3 * area), cy / (3 * area)]; }
          }
          rings.push(a);
        });
      });
      var p = f.properties || {};
      return { id: String(f.id != null ? f.id : p.GEOID), p: p, rings: rings, wb: bb, lp: label || [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2], level: level };
    });
  }
  function path2d(f) {
    if (f._p) return f._p;
    var P = new Path2D();
    f.rings.forEach(function (r) { P.moveTo(r[0], r[1]); for (var i = 2; i < r.length; i += 2) P.lineTo(r[i], r[i + 1]); P.closePath(); });
    return (f._p = P);
  }

  /* ---------- state ---------- */
  var S = { feats: [], byId: new Map(), states: [], rows: new Map(), metricIdx: 0, view: { cx: 0, cy: 0, k: 1 }, hover: null, sel: null, iso: null, rankMode: 'top', colors: [], cls: null, colorById: new Map(), clsById: new Map(), ranked: [], rank: new Map(), unmatched: [] };
  var LEVEL_PLURAL = { zcta: 'ZIP codes', county: 'counties', cbsa: 'metro areas', state: 'states', tract: 'census tracts' };
  var T = {};
  var canvas, ctx, hitCtx = document.createElement('canvas').getContext('2d');

  /* ---------- validation ---------- */
  function validate(c) {
    var errs = [];
    if (!c || typeof c !== 'object') return ['window.CMB_MAP is missing. The HTML file must set window.CMB_MAP before loading cmb-map.js.'];
    if (['state', 'county', 'cbsa', 'zcta', 'tract'].indexOf(c.level) < 0) errs.push('"level" must be one of state, county, cbsa, zcta, tract (got ' + JSON.stringify(c.level) + ').');
    if (!Array.isArray(c.metrics) || !c.metrics.length) errs.push('"metrics" must be a non-empty list.');
    if (!Array.isArray(c.rows) || !c.rows.length) errs.push('"rows" must be a non-empty list.');
    if (errs.length) return errs;
    var ids = c.metrics.map(function (m) { return m.id; });
    c.metrics.forEach(function (m, i) { if (!m.id) errs.push('metrics[' + i + '] needs an "id".'); });
    var r0 = c.rows[0];
    if (r0.key == null && !(r0.state != null && r0.county != null) && !(r0.tract != null && r0.county_fips != null)) errs.push('Each row needs "key" (a FIPS/ZIP/CBSA code or state) or, for county names, both "state" and "county".');
    if (!r0.v || typeof r0.v !== 'object') errs.push('Each row needs "v": an object of metric values keyed by metric id (' + ids.join(', ') + ').');
    return errs;
  }

  /* ---------- boot ---------- */
  function boot() {
    var errs = validate(CFG);
    if (errs.length) { fail('This heatmap file has a setup problem', '<ul><li>' + errs.map(esc).join('</li><li>') + '</li></ul><p>Ask your AI assistant to fix these and regenerate the file.</p>'); return; }
    var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'; document.head.appendChild(fl);
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.title = CFG.title || 'Cotality heatmap';
    buildDOM();
    status('Loading boundaries…');
    var lvl = CFG.level, jobs = [getJSON('v1/state.geojson')];
    var needNames = (lvl === 'county' || lvl === 'tract') && CFG.rows.some(function (r) { return r.key == null && r.county != null; });
    if (needNames) jobs.push(getJSON('v1/lookups/county_names.json')); else jobs.push(Promise.resolve(null));
    if (lvl === 'county') jobs.push(getJSON('v1/county.geojson'));
    else if (lvl === 'cbsa') jobs.push(getJSON('v1/cbsa.geojson'));
    else if (lvl === 'state' || lvl === 'tract') jobs.push(Promise.resolve(null));
    else jobs.push(getJSON('v1/lookups/zcta_county.json'));
    Promise.all(jobs).then(function (res) {
      var stateGJ = res[0], names = res[1], layer = res[2];
      S.states = prepFeatures(stateGJ, 'state');
      S.stateBy = {};
      S.states.forEach(function (f) { S.stateBy[f.p.STUSPS] = f; S.stateBy[f.id] = f; S.stateBy[String(f.p.NAME).toUpperCase()] = f; });
      if (lvl === 'tract') {
        var needT = new Set();
        CFG.rows.forEach(function (r) {
          var g = r.key != null ? pad(r.key, 11) : null;
          if (g) { needT.add(g.slice(0, 2)); return; }
          var sf = r.state != null && (S.stateBy[String(r.state).trim().toUpperCase()] || S.stateBy[pad(r.state, 2)]); if (sf) needT.add(sf.id);
        });
        return Promise.all(Array.from(needT).map(function (s) { return getJSON('tract/' + s + '.geojson'); })).then(function (parts) {
          var all = []; parts.forEach(function (gj) { all = all.concat(prepFeatures(gj, 'tract')); });
          return { feats: all, names: names };
        });
      }
      if (lvl === 'zcta') {
        var zc = layer, need = new Set();
        CFG.rows.forEach(function (r) { var z = zip5(r.key); if (z && zc[z]) need.add(zc[z].slice(0, 2)); });
        S.zctaCounty = zc;
        return Promise.all(Array.from(need).map(function (s) { return getJSON('zcta/' + s + '.geojson'); })).then(function (parts) {
          var all = []; parts.forEach(function (gj) { all = all.concat(prepFeatures(gj, 'zcta')); });
          return { feats: all, names: names };
        });
      }
      return { feats: lvl === 'state' ? S.states : prepFeatures(layer, lvl), names: names };
    }).then(function (o) {
      S.feats = o.feats; S.byId = new Map(); S.feats.forEach(function (f) { S.byId.set(f.id, f); });
      S.countyBy = {}; if (lvl === 'county') S.feats.forEach(function (f) { S.countyBy[f.id] = f; });
      matchRows(o.names);
      readTokens(); recolor(); buildRanks(); renderAll(); fitData(false);
      status(null);
    }).catch(function (e) {
      status(null);
      fail('The map boundaries could not be loaded', esc(e.message) + '<p>This heatmap loads its map shapes from the internet when it opens. Check your connection, then reload. If you opened it inside Copilot, Teams, or SharePoint, download it and open it in Chrome or Edge instead.</p>');
      var app = $('cmb-app'); if (app) app.remove();
    });
  }

  function matchRows(names) {
    var lvl = CFG.level, un = new Map();
    S.rows = new Map();
    function countyFromName(st, county) {
      var sf = S.stateBy[String(st || '').trim().toUpperCase()] || S.stateBy[pad(st, 2)];
      var ab = sf ? sf.p.STUSPS : null, key = normCounty(county), tbl = ab && names && names[ab];
      return tbl ? (tbl[key] || tbl[key + 'CITY'] || null) : null;
    }
    CFG.rows.forEach(function (r) {
      var id = null, label;
      if (lvl === 'tract') {
        if (r.key != null) { id = pad(r.key, 11); label = String(r.key); }
        else { var cf = r.county_fips != null ? pad(r.county_fips, 5) : countyFromName(r.state, r.county), t6 = tract6(r.tract); id = cf && t6 ? cf + t6 : null; label = 'Tract ' + r.tract + ', ' + (r.county || r.county_fips) + (r.state ? ', ' + r.state : ''); }
      } else if (lvl === 'county' && r.key == null) {
        id = countyFromName(r.state, r.county);
        label = r.county + ', ' + r.state;
      } else if (lvl === 'county') { id = pad(r.key, 5); label = String(r.key); }
      else if (lvl === 'cbsa') { id = pad(r.key, 5); label = String(r.key); }
      else if (lvl === 'zcta') { id = zip5(r.key); label = String(r.key); }
      else if (lvl === 'state') { var f = S.stateBy[String(r.key).trim().toUpperCase()] || S.stateBy[pad(r.key, 2)]; id = f ? f.id : null; label = String(r.key); }
      if (!id || !S.byId.has(id)) { un.set(label, (un.get(label) || 0) + (+r.n || 1)); return; }
      var ex = S.rows.get(id);
      if (ex) { // same area twice (e.g. county named two ways): add counts, keep first values
        ex.n = (+ex.n || 0) + (+r.n || 0); ex.dup = true; return;
      }
      S.rows.set(id, { id: id, n: +r.n || 0, v: r.v || {}, raw: r });
    });
    S.unmatched = Array.from(un.entries()).sort(function (a, b) { return b[1] - a[1]; });
  }

  /* ---------- tokens & theme ---------- */
  function readTokens() {
    var cs = getComputedStyle(document.documentElement);
    ['map-bg', 'nodata', 'insufficient', 'area-line', 'state-line', 'hover-line', 'select-line', 'fg', 'muted', 'surface', 'bg'].forEach(function (k) { T[k] = cs.getPropertyValue('--' + k).trim(); });
  }
  function setTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('cmb-theme', t || ''); } catch (e) {}
    readTokens(); recolor(); renderAll(); draw();
  }

  /* ---------- metric & colors ---------- */
  function metric() { return CFG.metrics[S.metricIdx]; }
  function valueOf(row) { if (!row) return null; var x = row.v[metric().id]; return x == null || x === '' || !isFinite(+x) ? null : +x; }
  function recolor() {
    var st = CFG.style || {}, vals = [];
    S.rows.forEach(function (r) { var x = valueOf(r); if (x != null) vals.push(x); });
    var m = metric(), scheme = m.scheme || st.scheme || 'sunrise';
    S.cls = classify(vals, st.breaks || 'quantile', Math.max(3, Math.min(7, +st.classes || 5)));
    S.colors = ramp(scheme, S.cls.breaks.length + 1);
    S.colorById = new Map(); S.clsById = new Map();
    S.rows.forEach(function (r) {
      var x = valueOf(r);
      if (x == null) { S.colorById.set(r.id, T.insufficient); S.clsById.set(r.id, -1); return; }
      var c = classOf(x, S.cls.breaks); S.clsById.set(r.id, c); S.colorById.set(r.id, S.colors[c]);
    });
  }
  function buildRanks() {
    var arr = []; S.rows.forEach(function (r) { if (valueOf(r) != null) arr.push(r); });
    arr.sort(function (a, b) { return valueOf(b) - valueOf(a); });
    S.ranked = arr; S.rank = new Map(); arr.forEach(function (r, i) { S.rank.set(r.id, i + 1); });
  }

  /* ---------- labels ---------- */
  function label(id) {
    var f = S.byId.get(id), lvl = CFG.level;
    if (!f) return { name: id, sub: '' };
    if (lvl === 'county') return { name: f.p.NAMELSAD || f.p.NAME, sub: f.p.STUSPS || '' };
    if (lvl === 'state') return { name: f.p.NAME, sub: '' };
    if (lvl === 'cbsa') return { name: f.p.NAME, sub: (f.p.TYPE || '') + ' area' };
    if (lvl === 'tract') return { name: 'Tract ' + f.p.NAME, sub: (f.p.COUNTY || '') + (f.p.STUSPS ? ', ' + f.p.STUSPS : '') };
    var c = f.p.COUNTY, st = S.stateBy[(c || '').slice(0, 2)];
    return { name: 'ZIP ' + id, sub: st ? st.p.NAME : '' };
  }
  function shortName(id) {
    var f = S.byId.get(id); if (!f) return id;
    if (CFG.level === 'zcta') return id;
    if (CFG.level === 'tract') return f.p.NAME;
    if (CFG.level === 'cbsa') return String(f.p.NAME).split(',')[0].split('-')[0];
    if (CFG.level === 'state') return f.p.STUSPS;
    return f.p.NAME;
  }

  /* ---------- DOM ---------- */
  function buildDOM() {
    var fb = $('cmb-fallback'); if (fb) fb.remove();
    var multi = CFG.metrics.length > 1;
    var app = document.createElement('div'); app.className = 'app'; app.id = 'cmb-app';
    app.innerHTML =
      '<header class="top">' +
        '<div class="brand"><span class="brand-name">Cotality<sup>™</sup></span><span class="brand-divider" aria-hidden="true"></span><span class="brand-tool">Heatmap</span></div>' +
        '<div class="top-mid">' + (multi ? '<label class="metric-pick"><span class="eyebrow">Showing</span><select id="cmb-metric" aria-label="Metric"></select></label>' : '') + '</div>' +
        '<div class="top-actions">' +
          '<button class="icon-btn" type="button" id="cmb-theme" aria-label="Switch light or dark theme" title="Light / dark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button>' +
          '<div class="menu" id="cmb-exmenu"><button class="btn" id="cmb-export" type="button" aria-haspopup="true" aria-expanded="false">Export</button>' +
          '<div class="menu-list" id="cmb-exlist" hidden><button type="button" id="cmb-png">Download map image (PNG)</button><button type="button" id="cmb-csv">Download results (CSV)</button><button type="button" id="cmb-copy">Copy results to clipboard</button></div></div>' +
        '</div>' +
      '</header>' +
      '<main class="body">' +
        '<section class="mapwrap" id="cmb-mapwrap" aria-label="Map">' +
          '<canvas id="cmb-canvas"></canvas>' +
          '<div class="map-title"><h1 id="cmb-title"></h1><p id="cmb-sub"></p></div>' +
          '<div class="search"><input id="cmb-search" type="search" placeholder="Find an area" autocomplete="off" aria-label="Find an area"><ul id="cmb-results" class="search-results" hidden></ul></div>' +
          '<div class="zoom"><button type="button" id="cmb-zin" aria-label="Zoom in">+</button><button type="button" id="cmb-zout" aria-label="Zoom out">−</button><button type="button" id="cmb-zfit" class="fit" aria-label="Fit to data">Fit</button></div>' +
          '<div class="legend" id="cmb-legend" hidden><div class="legend-head"><span class="eyebrow" id="cmb-legend-label"></span><span class="legend-hint">Click a class to isolate it</span></div>' +
          '<svg id="cmb-hist" class="hist" viewBox="0 0 240 44" preserveAspectRatio="none" aria-hidden="true"></svg><ol id="cmb-legend-rows" class="legend-rows"></ol></div>' +
          '<div class="tooltip" id="cmb-tip" hidden></div>' +
          '<div class="map-status" id="cmb-status" hidden></div>' +
          '<p class="map-source" id="cmb-source"></p>' +
        '</section>' +
        '<aside class="panel">' +
          '<section class="card detail" id="cmb-detail" hidden></section>' +
          '<section class="card"><div class="card-head"><h2>Rankings</h2><div class="seg" role="group" aria-label="Ranking order"><button type="button" id="cmb-rtop" class="on">Highest</button><button type="button" id="cmb-rbot">Lowest</button></div></div><ol class="rank" id="cmb-rank"></ol></section>' +
          '<section class="card"><div class="card-head"><h2>Data check</h2><span class="pill" id="cmb-pill"></span></div><dl class="stats" id="cmb-stats"></dl><div class="notes" id="cmb-notes"></div>' +
            '<details class="unmatched" id="cmb-unbox" hidden><summary id="cmb-unsum"></summary><ul id="cmb-unlist"></ul></details></section>' +
          '<section class="card"><div class="card-head"><h2>Display</h2></div><div class="display">' +
            '<fieldset class="field wide schemes"><legend>Colors</legend><div id="cmb-schemes" class="scheme-row"></div></fieldset>' +
            '<label class="field"><span>Class breaks</span><select id="cmb-breaks"><option value="quantile">Quantile (equal counts)</option><option value="jenks">Natural breaks</option><option value="equal">Equal intervals</option></select></label>' +
            '<label class="field"><span>Classes</span><select id="cmb-classes"><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option></select></label>' +
          '</div></section>' +
          '<p class="about">Boundaries: U.S. Census Bureau 2023' + (CFG.level === 'zcta' ? ' (ZIP Code Tabulation Areas, 2020)' : CFG.level === 'tract' ? ' (census tracts, 2020 definitions)' : '') + '. Map renderer v' + VERSION + '.</p>' +
        '</aside>' +
      '</main>';
    document.body.appendChild(app);
    canvas = $('cmb-canvas'); ctx = canvas.getContext('2d');
    if (multi) {
      $('cmb-metric').innerHTML = CFG.metrics.map(function (m, i) { return '<option value="' + i + '">' + esc(m.label || m.id) + '</option>'; }).join('');
      $('cmb-metric').onchange = function () { S.metricIdx = +this.value; S.iso = null; recolor(); buildRanks(); renderAll(); draw(); };
    }
    var saved = null; try { saved = localStorage.getItem('cmb-theme'); } catch (e) {}
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    $('cmb-theme').onclick = function () {
      var cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(cur === 'dark' ? 'light' : 'dark');
    };
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readTokens(); recolor(); renderAll(); draw(); }); } catch (e) {}
    wire();
  }
  function status(msg) { var el = $('cmb-status'); if (!el) return; if (!msg) { el.hidden = true; return; } el.innerHTML = '<div class="box">' + esc(msg) + '</div>'; el.hidden = false; }

  /* ---------- render ---------- */
  var raf = 0;
  function draw() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); }); }
  function size() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.min(8192, Math.round(r.width * dpr))), h = Math.max(1, Math.min(8192, Math.round(r.height * dpr)));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { W: r.width, H: r.height, dpr: dpr };
  }
  function render(target) {
    if (!canvas) return;
    var z = size(), c = target || ctx, W = z.W, H = z.H, dpr = z.dpr, v = S.view, k = v.k;
    if (target) { W = target.canvas.width; H = target.canvas.height; dpr = 1; }
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = T['map-bg']; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    var a = dpr * k;
    c.setTransform(a, 0, 0, -a, dpr * (W / 2 - v.cx * k), dpr * (H / 2 + v.cy * k));
    var x0 = v.cx - W / 2 / k, x1 = v.cx + W / 2 / k, y0 = v.cy - H / 2 / k, y1 = v.cy + H / 2 / k;
    function vis(b) { return !(b[2] < x0 || b[0] > x1 || b[3] < y0 || b[1] > y1); }
    // context: states without data
    if (CFG.level !== 'state') { c.fillStyle = T.nodata; S.states.forEach(function (f) { if (vis(f.wb)) c.fill(path2d(f), 'evenodd'); }); }
    var shown = [], iso = S.iso !== null;
    S.feats.forEach(function (f) {
      var b = f.wb; if (!vis(b)) return;
      var col = S.colorById.get(f.id); if (!col) { if (CFG.level === 'state' || CFG.level === 'cbsa') col = T.nodata; else return; }
      c.globalAlpha = iso && S.clsById.get(f.id) !== S.iso ? 0.18 : 1;
      c.fillStyle = col;
      var pw = (b[2] - b[0]) * k, ph = (b[3] - b[1]) * k;
      if (pw < 1.5 && ph < 1.5) { c.fillRect(b[0], b[1], Math.max(b[2] - b[0], 1.5 / k), Math.max(b[3] - b[1], 1.5 / k)); return; }
      c.fill(path2d(f), 'evenodd'); shown.push(f);
    });
    c.globalAlpha = 1;
    // outlines of all areas at this level when they are big enough to read
    var lineFeats = S.feats.filter(function (f) { return vis(f.wb) && (f.wb[2] - f.wb[0]) * k > 6; });
    if (lineFeats.length && lineFeats.length < 8000) {
      c.strokeStyle = T['area-line']; c.lineWidth = 0.7 / k; c.lineJoin = 'round';
      lineFeats.forEach(function (f) { c.stroke(path2d(f)); });
    }
    c.strokeStyle = T['state-line']; c.lineWidth = 1.1 / k; c.lineJoin = 'round';
    S.states.forEach(function (f) { if (vis(f.wb)) c.stroke(path2d(f)); });
    var hf = S.hover && S.byId.get(S.hover), sf = S.sel && S.byId.get(S.sel);
    if (hf && hf !== sf && !target) { c.strokeStyle = T['hover-line']; c.lineWidth = 2 / k; c.stroke(path2d(hf)); }
    if (sf) { c.strokeStyle = T['select-line']; c.lineWidth = 3 / k; c.stroke(path2d(sf)); }
    drawLabels(c, shown, k, dpr, W, H, target ? 2 : 1);
  }
  function drawLabels(c, shown, k, dpr, W, H, scale) {
    var v = S.view, placed = [], cand = [];
    shown.forEach(function (f) { var w = (f.wb[2] - f.wb[0]) * k; if (w > 64 && S.rows.has(f.id)) cand.push({ f: f, w: w }); });
    if (!cand.length || cand.length > 400) return;
    cand.sort(function (a, b) { return b.w - a.w; });
    c.setTransform(1, 0, 0, 1, 0, 0);
    var fs = 11 * scale * (scale === 1 ? dpr : 1), font = getComputedStyle(document.documentElement).getPropertyValue('--font-body');
    c.font = '600 ' + fs + 'px ' + font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    var m = metric();
    cand.forEach(function (o) {
      var f = o.f, px = ((f.lp[0] - v.cx) * k + W / 2) * (scale === 1 ? dpr : 1), py = (H / 2 - (f.lp[1] - v.cy) * k) * (scale === 1 ? dpr : 1);
      var row = S.rows.get(f.id), val = valueOf(row);
      var t1 = shortName(f.id), t2 = val == null ? '' : fmt(val, m.format, { short: true });
      var tw = Math.max(c.measureText(t1).width, c.measureText(t2).width), th = fs * 2.3;
      if (tw > o.w * (scale === 1 ? dpr : 1) * 0.95) return;
      var box = [px - tw / 2 - 3, py - th / 2, px + tw / 2 + 3, py + th / 2];
      for (var i = 0; i < placed.length; i++) { var q = placed[i]; if (!(box[2] < q[0] || box[0] > q[2] || box[3] < q[1] || box[1] > q[3])) return; }
      placed.push(box);
      c.lineWidth = 3 * (scale === 1 ? dpr : 1); c.strokeStyle = T.surface; c.fillStyle = T.fg;
      c.strokeText(t1, px, py - fs * 0.55); c.fillText(t1, px, py - fs * 0.55);
      if (t2) { c.font = '500 ' + fs + 'px ' + font; c.strokeText(t2, px, py + fs * 0.6); c.fillText(t2, px, py + fs * 0.6); c.font = '600 ' + fs + 'px ' + font; }
    });
  }

  /* ---------- view ---------- */
  function insets() { var stacked = window.innerWidth <= 900, W = canvas.clientWidth; return { t: stacked ? 120 : 100, b: stacked ? 110 : 40, l: stacked ? 16 : (W > 1000 ? 220 : 24), r: stacked ? 16 : 64 }; }
  function viewFor(b, maxK) {
    var W = canvas.clientWidth, H = canvas.clientHeight, p = insets();
    var bw = Math.max(b[2] - b[0], 1e-3), bh = Math.max(b[3] - b[1], 1e-3);
    var k = Math.min(Math.max(80, W - p.l - p.r) / bw, Math.max(80, H - p.t - p.b) / bh);
    if (maxK) k = Math.min(k, maxK);
    return { cx: (b[0] + b[2]) / 2 - (p.l - p.r) / 2 / k, cy: (b[1] + b[3]) / 2 + (p.t - p.b) / 2 / k, k: k };
  }
  function dataBox() {
    var b = [Infinity, Infinity, -Infinity, -Infinity], any = false;
    S.rows.forEach(function (r) { var f = S.byId.get(r.id); if (!f) return; any = true; b[0] = Math.min(b[0], f.wb[0]); b[1] = Math.min(b[1], f.wb[1]); b[2] = Math.max(b[2], f.wb[2]); b[3] = Math.max(b[3], f.wb[3]); });
    if (any) return b;
    var p0 = proj(-125, 24.5), p1 = proj(-67, 49.5); return [p0[0], p0[1], p1[0], p1[1]];
  }
  function fitData(anim) { if (canvas.clientWidth < 50) { requestAnimationFrame(function () { fitData(anim); }); return; } var v = viewFor(dataBox()); if (anim) animateTo(v); else { S.view = v; draw(); } }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateTo(v) {
    if (reduce) { S.view = v; draw(); return; }
    var a = { cx: S.view.cx, cy: S.view.cy, k: S.view.k }, t0 = performance.now(), la = Math.log(a.k), lb = Math.log(v.k);
    (function step(t) {
      var u = Math.min(1, ((t || performance.now()) - t0) / 380), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      S.view = { cx: a.cx + (v.cx - a.cx) * e, cy: a.cy + (v.cy - a.cy) * e, k: Math.exp(la + (lb - la) * e) };
      render(); if (u < 1) requestAnimationFrame(step);
    })();
  }
  function zoomAt(sx, sy, f) {
    S.moved = true;
    var W = canvas.clientWidth, H = canvas.clientHeight, v = S.view;
    var wx = v.cx + (sx - W / 2) / v.k, wy = v.cy - (sy - H / 2) / v.k, k = Math.max(0.05, Math.min(v.k * f, 5e5));
    S.view = { k: k, cx: wx - (sx - W / 2) / k, cy: wy + (sy - H / 2) / k }; draw();
  }
  function zoomTo(f) { animateTo(viewFor(f.wb, Math.max(S.view.k, viewFor(dataBox()).k * 6))); }
  function hit(sx, sy) {
    var W = canvas.clientWidth, H = canvas.clientHeight, v = S.view, wx = v.cx + (sx - W / 2) / v.k, wy = v.cy - (sy - H / 2) / v.k, best = null, bestA = Infinity;
    for (var i = 0; i < S.feats.length; i++) {
      var f = S.feats[i], b = f.wb;
      if (wx < b[0] || wx > b[2] || wy < b[1] || wy > b[3]) continue;
      var ar = (b[2] - b[0]) * (b[3] - b[1]); if (ar >= bestA) continue;
      if (hitCtx.isPointInPath(path2d(f), wx, wy, 'evenodd')) { best = f; bestA = ar; }
    }
    return best;
  }

  /* ---------- interaction ---------- */
  function wire() {
    var ptrs = new Map(), drag = null, pinch = null, hr = 0, last = null;
    canvas.addEventListener('pointerdown', function (e) {
      canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size === 1) drag = { x: e.offsetX, y: e.offsetY, moved: 0 };
      if (ptrs.size === 2) { var p = Array.from(ptrs.values()); pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), k: S.view.k }; drag = null; }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (pinch && ptrs.size === 2) { var p = Array.from(ptrs.values()), d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); zoomAt((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, pinch.k * d / pinch.d / S.view.k); hideTip(); return; }
      if (drag) {
        var dx = e.offsetX - drag.x, dy = e.offsetY - drag.y; drag.x = e.offsetX; drag.y = e.offsetY; drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag.moved > 3) { S.moved = true; canvas.classList.add('dragging'); S.view.cx -= dx / S.view.k; S.view.cy += dy / S.view.k; draw(); hideTip(); }
        return;
      }
      last = { x: e.offsetX, y: e.offsetY };
      if (!hr) hr = requestAnimationFrame(function () { hr = 0; if (last) hover(last.x, last.y); });
    });
    function end(e) {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (drag && !ptrs.size) { canvas.classList.remove('dragging'); if (drag.moved <= 3) { var f = hit(e.offsetX, e.offsetY); select(f && S.rows.has(f.id) ? f.id : null); } drag = null; }
    }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', function () { last = null; S.hover = null; hideTip(); draw(); });
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018))); hideTip(); }, { passive: false });
    canvas.addEventListener('dblclick', function (e) { zoomAt(e.offsetX, e.offsetY, 2); });
    $('cmb-zin').onclick = function () { zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.6); };
    $('cmb-zout').onclick = function () { zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.6); };
    $('cmb-zfit').onclick = function () { S.moved = false; fitData(true); };
    window.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      if (e.key === '+' || e.key === '=') $('cmb-zin').click(); else if (e.key === '-') $('cmb-zout').click(); else if (e.key === 'Escape') { select(null); setIso(null); }
    });
    var onResize = function () { if (!S.moved && S.cls) fitData(false); else draw(); };
    if (window.ResizeObserver) new ResizeObserver(onResize).observe($('cmb-mapwrap')); else window.addEventListener('resize', onResize);
    $('cmb-rtop').onclick = function () { S.rankMode = 'top'; this.classList.add('on'); $('cmb-rbot').classList.remove('on'); renderRank(); };
    $('cmb-rbot').onclick = function () { S.rankMode = 'bottom'; this.classList.add('on'); $('cmb-rtop').classList.remove('on'); renderRank(); };
    var st = CFG.style || (CFG.style = {});
    $('cmb-breaks').value = st.breaks || 'quantile'; $('cmb-classes').value = String(st.classes || 5);
    $('cmb-breaks').onchange = function () { st.breaks = this.value; recolor(); renderAll(); draw(); };
    $('cmb-classes').onchange = function () { st.classes = +this.value; recolor(); renderAll(); draw(); };
    // search
    var sres = [], sact = 0, inp = $('cmb-search'), ul = $('cmb-results');
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toUpperCase(); if (!q) { ul.hidden = true; return; }
      sres = []; S.rows.forEach(function (r) { var lb = label(r.id); if ((lb.name + ' ' + lb.sub + ' ' + r.id).toUpperCase().indexOf(q) >= 0 && sres.length < 8) sres.push({ id: r.id, lb: lb, r: r }); });
      sact = 0;
      ul.innerHTML = sres.length ? sres.map(function (e, i) { return '<li role="option" data-i="' + i + '" aria-selected="' + (i === 0) + '"><span>' + esc(e.lb.name) + (e.lb.sub ? ' <small>' + esc(e.lb.sub) + '</small>' : '') + '</span><span class="v">' + esc(fmt(valueOf(e.r), metric().format, { short: true })) + '</span></li>'; }).join('') : '<li aria-disabled="true">No mapped area matches “' + esc(inp.value) + '”</li>';
      ul.hidden = false;
      Array.prototype.forEach.call(ul.querySelectorAll('li[data-i]'), function (li) { li.onmousedown = function (ev) { ev.preventDefault(); pick(+li.dataset.i); }; });
    });
    function pick(i) { var e = sres[i]; if (!e) return; zoomTo(S.byId.get(e.id)); select(e.id); ul.hidden = true; inp.blur(); }
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sact = (sact + (e.key === 'ArrowDown' ? 1 : -1) + sres.length) % Math.max(1, sres.length); Array.prototype.forEach.call(ul.children, function (li, i) { li.setAttribute('aria-selected', i === sact); }); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(sact); } else if (e.key === 'Escape') ul.hidden = true;
    });
    inp.addEventListener('blur', function () { setTimeout(function () { ul.hidden = true; }, 120); });
    // export
    var exb = $('cmb-export'), exl = $('cmb-exlist');
    exb.onclick = function (e) { e.stopPropagation(); exl.hidden = !exl.hidden; exb.setAttribute('aria-expanded', String(!exl.hidden)); };
    document.addEventListener('click', function (e) { if (!e.target.closest('#cmb-exmenu')) { exl.hidden = true; exb.setAttribute('aria-expanded', 'false'); } });
    $('cmb-csv').onclick = function () { download(new Blob([csv()], { type: 'text/csv' }), slug() + '.csv'); exl.hidden = true; };
    $('cmb-copy').onclick = function () { var b = this, t = csv(); try { navigator.clipboard.writeText(t).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy results to clipboard'; }, 1400); }, function () { b.textContent = 'Copy is blocked here'; }); } catch (e) { b.textContent = 'Copy is blocked here'; } };
    $('cmb-png').onclick = function () { png(); exl.hidden = true; };
  }
  function hover(x, y) {
    var f = hit(x, y), id = f && (S.rows.has(f.id) || CFG.level === 'state' || CFG.level === 'cbsa') ? f.id : null;
    if (id !== S.hover) { S.hover = id; draw(); }
    var tip = $('cmb-tip'); if (!id) { hideTip(); return; }
    tip.innerHTML = tipHTML(id); tip.hidden = false;
    var W = canvas.clientWidth, H = canvas.clientHeight, tw = tip.offsetWidth, th = tip.offsetHeight, tx = x + 14, ty = y + 14;
    if (tx + tw > W - 8) tx = x - tw - 14; if (ty + th > H - 8) ty = y - th - 14;
    tip.style.left = Math.max(8, tx) + 'px'; tip.style.top = Math.max(8, ty) + 'px';
  }
  function hideTip() { var t = $('cmb-tip'); if (t) t.hidden = true; }
  function valText(id) {
    var r = S.rows.get(id), m = metric();
    if (!r) return { v: 'No data', meta: '' };
    var x = valueOf(r), rk = S.rank.get(id);
    if (x == null) return { v: 'Not enough data', meta: n0(r.n) + ' properties' };
    return { v: fmt(x, m.format, { decimals: m.decimals }), meta: (r.n ? n0(r.n) + ' properties · ' : '') + (rk ? 'rank ' + n0(rk) + ' of ' + n0(S.ranked.length) : '') };
  }
  function tipHTML(id) {
    var lb = label(id), t = valText(id), r = S.rows.get(id), extra = '';
    if (r && CFG.metrics.length > 1) {
      extra = CFG.metrics.map(function (m, i) { if (i === S.metricIdx) return ''; var x = r.v[m.id]; return '<div class="t-meta">' + esc(m.label || m.id) + ': ' + esc(fmt(x == null ? null : +x, m.format, { short: true })) + '</div>'; }).join('');
    }
    return '<div class="t-name">' + esc(lb.name) + '</div>' + (lb.sub ? '<div class="t-sub">' + esc(lb.sub) + '</div>' : '') + '<div class="t-val">' + esc(t.v) + '</div>' + (t.meta ? '<div class="t-meta">' + esc(t.meta) + '</div>' : '') + extra;
  }
  function select(id) {
    S.sel = id; draw();
    var el = $('cmb-detail'); if (!id) { el.hidden = true; return; }
    var lb = label(id), r = S.rows.get(id), t = valText(id), m = metric(), rk = S.rank.get(id), N = S.ranked.length, x = valueOf(r);
    var med = N ? valueOf(S.ranked[Math.floor(N / 2)]) : null, pos = '';
    if (x != null && N > 1) {
      var s = S.cls.sorted, below = 0; for (var i = 0; i < s.length && s[i] < x; i++) below++;
      var p = below / Math.max(1, s.length - 1);
      pos = '<div class="d-pos"><div class="track" style="background:linear-gradient(90deg,' + S.colors.join(',') + ')"></div><div class="mk" style="left:calc(' + (p * 100).toFixed(1) + '% - 1px)"></div></div>' +
        '<div class="eyebrow" style="display:flex;justify-content:space-between;gap:8px"><span>' + esc(fmt(S.cls.min, m.format, { short: true })) + '</span><span>Position among ' + esc(LEVEL_PLURAL[CFG.level]) + '</span><span>' + esc(fmt(S.cls.max, m.format, { short: true })) + '</span></div>';
    }
    var others = CFG.metrics.length > 1 ? '<dl class="d-grid">' + CFG.metrics.filter(function (_, i) { return i !== S.metricIdx; }).slice(0, 3).map(function (mm) { var v = r.v[mm.id]; return '<div><dt>' + esc(mm.label || mm.id) + '</dt><dd>' + esc(fmt(v == null ? null : +v, mm.format, { short: true })) + '</dd></div>'; }).join('') + '</dl>' : '';
    el.innerHTML = '<div class="card-head"><div><div class="d-name">' + esc(lb.name) + '</div><div class="d-sub">' + esc(lb.sub) + '</div></div><button class="d-close" type="button" aria-label="Clear selection">×</button></div>' +
      '<div><div class="eyebrow">' + esc(m.label || m.id) + '</div><div class="d-big">' + esc(t.v) + '</div></div>' + pos +
      '<dl class="d-grid"><div><dt>Properties</dt><dd>' + (r.n ? n0(r.n) : '—') + '</dd></div><div><dt>Rank</dt><dd>' + (rk ? n0(rk) + ' / ' + n0(N) : '—') + '</dd></div><div><dt>Median area</dt><dd>' + esc(fmt(med, m.format, { short: true })) + '</dd></div></dl>' + others;
    el.hidden = false; el.querySelector('.d-close').onclick = function () { select(null); };
  }
  function setIso(i) {
    S.iso = i === S.iso ? null : i;
    Array.prototype.forEach.call($('cmb-legend-rows').children, function (li) { if (li.dataset.c != null) li.classList.toggle('off', S.iso !== null && +li.dataset.c !== S.iso); });
    draw();
  }

  /* ---------- panels ---------- */
  function renderAll() { if (!S.cls) return; renderHeader(); renderLegend(); renderRank(); renderCheck(); renderSchemes(); if (S.sel) select(S.sel); }
  function renderHeader() {
    $('cmb-title').textContent = CFG.title || ((metric().label || 'Value') + ' by ' + titleCase(LEVEL_PLURAL[CFG.level]));
    var totalN = 0; S.rows.forEach(function (r) { totalN += r.n || 0; });
    $('cmb-sub').textContent = CFG.subtitle || ((totalN ? n0(totalN) + ' properties across ' : '') + n0(S.rows.size) + ' ' + LEVEL_PLURAL[CFG.level]);
    $('cmb-source').textContent = (CFG.source ? CFG.source + ' · ' : '') + 'Boundaries: U.S. Census Bureau';
  }
  function renderLegend() {
    var lg = $('cmb-legend'), cl = S.cls, m = metric();
    if (!cl.sorted.length) { lg.hidden = true; return; }
    $('cmb-legend-label').textContent = m.label || m.id;
    var counts = S.colors.map(function () { return 0; }), insuff = 0;
    S.clsById.forEach(function (c) { if (c >= 0) counts[c]++; else insuff++; });
    var rows = '';
    for (var i = 0; i < S.colors.length; i++) {
      var lo = i ? cl.breaks[i - 1] : cl.min, hi = i === cl.breaks.length ? cl.max : cl.breaks[i];
      var txt = lo === hi ? fmt(lo, m.format, { short: true }) : fmt(lo, m.format, { short: true }) + ' – ' + fmt(hi, m.format, { short: true });
      rows += '<li data-c="' + i + '" tabindex="0" role="button"><span class="sw" style="background:' + S.colors[i] + '"></span><span>' + esc(txt) + '</span><span class="ct">' + n0(counts[i]) + '</span></li>';
    }
    if (insuff) rows += '<li class="static"><span class="sw" style="background:var(--insufficient)"></span><span>Not enough data</span><span class="ct">' + n0(insuff) + '</span></li>';
    rows += '<li class="static"><span class="sw" style="background:var(--nodata)"></span><span>No data</span><span class="ct"></span></li>';
    var ol = $('cmb-legend-rows'); ol.innerHTML = rows;
    Array.prototype.forEach.call(ol.querySelectorAll('li[data-c]'), function (li) {
      li.onclick = function () { setIso(+li.dataset.c); };
      li.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIso(+li.dataset.c); } };
      li.classList.toggle('off', S.iso !== null && +li.dataset.c !== S.iso);
    });
    var vals = cl.sorted, useLog = cl.min > 0 && cl.max / cl.min > 50, tf = useLog ? Math.log : function (x) { return x; }, a0 = tf(cl.min), a1 = tf(cl.max), B = 28, bins = new Array(B).fill(0);
    if (a1 === a0) bins[0] = vals.length; else vals.forEach(function (x) { bins[Math.min(B - 1, Math.floor((tf(x) - a0) / (a1 - a0) * B))]++; });
    var mx = Math.max.apply(null, bins), w = 240 / B, svg = '';
    for (i = 0; i < B; i++) {
      if (!bins[i]) continue;
      var ctr = useLog ? Math.exp(a0 + (i + .5) / B * (a1 - a0)) : a0 + (i + .5) / B * (a1 - a0), h = Math.max(2, Math.sqrt(bins[i] / mx) * 42);
      svg += '<rect x="' + (i * w + .5).toFixed(1) + '" y="' + (44 - h).toFixed(1) + '" width="' + (w - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + S.colors[classOf(ctr, cl.breaks)] + '"></rect>';
    }
    $('cmb-hist').innerHTML = svg + '<line x1="0" x2="240" y1="43.5" y2="43.5" stroke="var(--line-strong)"></line>';
    lg.hidden = false;
  }
  function renderRank() {
    var arr = S.rankMode === 'top' ? S.ranked.slice(0, 10) : S.ranked.slice(-10).reverse(), m = metric(), ol = $('cmb-rank');
    if (!arr.length) { ol.innerHTML = '<li class="rank-empty">No areas to rank.</li>'; return; }
    var hi = Math.max.apply(null, S.ranked.map(function (r) { return Math.abs(valueOf(r)); })) || 1;
    ol.innerHTML = arr.map(function (r) {
      var lb = label(r.id), x = valueOf(r);
      return '<li data-id="' + esc(r.id) + '"><span class="n">' + n0(S.rank.get(r.id)) + '</span><span class="nm"><b title="' + esc(lb.name + (lb.sub ? ', ' + lb.sub : '')) + '">' + esc(lb.name) + (CFG.level === 'county' && lb.sub ? ', ' + esc(lb.sub) : '') + '</b><span class="bar"><i style="width:' + Math.max(2, Math.abs(x) / hi * 100).toFixed(1) + '%;background:' + S.colorById.get(r.id) + '"></i></span></span><span class="v">' + esc(fmt(x, m.format, { short: true })) + '</span></li>';
    }).join('');
    Array.prototype.forEach.call(ol.children, function (li) { li.onclick = function () { var f = S.byId.get(li.dataset.id); if (f) { zoomTo(f); select(f.id); } }; });
  }
  function renderCheck() {
    var c = CFG.check || {}, matchedN = 0, unN = 0, agg = true;
    S.rows.forEach(function (r) { matchedN += r.n || 1; if (r.n) agg = false; });
    S.unmatched.forEach(function (u) { unN += u[1]; });
    var pct = matchedN + unN ? matchedN / (matchedN + unN) : 1, pill = $('cmb-pill');
    pill.className = 'pill ' + (pct >= .98 ? 'good' : pct >= .85 ? 'warn' : 'bad');
    pill.textContent = (Math.floor(pct * 1000) / 10) + '% matched';
    var items = [];
    if (c.rowsRead != null) items.push(['Rows in file', n0(c.rowsRead)]);
    items.push([agg ? 'Rows mapped' : 'Properties mapped', n0(matchedN)]);
    items.push([titleCase(LEVEL_PLURAL[CFG.level]) + ' with data', n0(S.rows.size)]);
    items.push(['Not mapped', n0(unN + (c.rowsExcluded || 0) + (c.rowsMissingLocation || 0))]);
    $('cmb-stats').innerHTML = items.map(function (p) { return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>'; }).join('');
    var notes = (CFG.notes || []).map(function (t) { return '<div class="note info">' + esc(t) + '</div>'; });
    if (c.rowsExcluded) notes.push('<div class="note info">' + n0(c.rowsExcluded) + ' rows were excluded by data-quality filters.</div>');
    if (c.rowsMissingLocation) notes.push('<div class="note warn">' + n0(c.rowsMissingLocation) + ' rows had no usable location.</div>');
    $('cmb-notes').innerHTML = notes.join('');
    var box = $('cmb-unbox');
    if (S.unmatched.length) {
      $('cmb-unsum').textContent = n0(unN) + ' properties in ' + n0(S.unmatched.length) + ' locations didn’t match a boundary';
      $('cmb-unlist').innerHTML = S.unmatched.slice(0, 60).map(function (u) { return '<li><span>' + esc(u[0]) + '</span><span>' + n0(u[1]) + '</span></li>'; }).join('');
      box.hidden = false;
    } else box.hidden = true;
  }
  function renderSchemes() {
    var box = $('cmb-schemes'), cur = metric().scheme || (CFG.style && CFG.style.scheme) || 'sunrise';
    box.innerHTML = Object.keys(SCHEMES).map(function (k) { return '<button type="button" class="scheme" data-s="' + k + '" aria-pressed="' + (k === cur) + '"><span class="ramp">' + ramp(k, 5).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><span>' + SCHEMES[k].label + '</span></button>'; }).join('');
    Array.prototype.forEach.call(box.children, function (b) { b.onclick = function () { metric().scheme = b.dataset.s; recolor(); renderAll(); draw(); }; });
  }

  /* ---------- export ---------- */
  function slug() { return String(CFG.title || 'heatmap').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'heatmap'; }
  function download(blob, name) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); }
  function csv() {
    var q = function (s) { s = String(s == null ? '' : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    var head = ['geoid', 'name', 'area', 'properties'].concat(CFG.metrics.map(function (m) { return m.id; }));
    var lines = [head.join(',')];
    S.rows.forEach(function (r) { var lb = label(r.id); lines.push([r.id, lb.name, lb.sub, r.n].concat(CFG.metrics.map(function (m) { return r.v[m.id]; })).map(q).join(',')); });
    return lines.join('\n');
  }
  function png() {
    var W = Math.round(canvas.clientWidth * 2), H = Math.round(canvas.clientHeight * 2), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d'), sv = S.view; S.view = { cx: sv.cx, cy: sv.cy, k: sv.k * 2 }; render(c); S.view = sv;
    c.setTransform(1, 0, 0, 1, 0, 0);
    var cs = getComputedStyle(document.documentElement), font = cs.getPropertyValue('--font-body'), mono = cs.getPropertyValue('--font-mono'), m = metric(), cl = S.cls;
    c.globalAlpha = .94; c.fillStyle = T.surface; c.fillRect(24, 24, Math.min(W - 48, 980), 110); c.globalAlpha = 1;
    c.fillStyle = T.fg; c.font = '600 38px ' + font; c.fillText($('cmb-title').textContent, 48, 78);
    c.fillStyle = T.muted; c.font = '26px ' + font; c.fillText($('cmb-sub').textContent, 48, 116);
    var y = H - 64 - S.colors.length * 34;
    c.globalAlpha = .94; c.fillStyle = T.surface; c.fillRect(24, y - 52, 440, S.colors.length * 34 + 72); c.globalAlpha = 1;
    c.fillStyle = T.muted; c.font = '22px ' + mono; c.fillText(String(m.label || m.id).toUpperCase(), 44, y - 18);
    S.colors.forEach(function (col, i) {
      var lo = i ? cl.breaks[i - 1] : cl.min, hi = i === cl.breaks.length ? cl.max : cl.breaks[i];
      c.fillStyle = col; c.fillRect(44, y + i * 34, 36, 22); c.fillStyle = T.fg; c.font = '22px ' + mono;
      c.fillText(fmt(lo, m.format, { short: true }) + ' – ' + fmt(hi, m.format, { short: true }), 94, y + i * 34 + 19);
    });
    c.fillStyle = T.muted; c.font = '18px ' + mono; c.fillText($('cmb-source').textContent, 24, H - 16);
    cv.toBlob(function (b) { download(b, slug() + '.png'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
