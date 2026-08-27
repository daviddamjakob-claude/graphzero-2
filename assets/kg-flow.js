/* Knowledge-graph flow — nine source systems fan into one knowledge base, which
   answers through four assistants. Built from the design handoff, ported to
   this codebase: the same geometry as plain DOM plus one SVG layer.

   Where this departs from the handoff, and why:

   · No build sequence. The handoff choreographs the figure assembling itself
     over seventeen seconds; here it is simply there on the first frame. It sits
     beside the module list rather than opening a page, and a diagram that
     assembles while you are reading the copy next to it competes with that
     copy instead of supporting it.
   · Motion is ambient, and the list drives its intensity. The packets keep
     flowing and the base keeps answering; pointing at a module makes its own
     part larger and quicker, so the figure answers a question the reader is
     already asking without having been still until they asked it.
   · The closing inversion is off. The handoff says to turn it off when the page
     already has a dark block, and this one does — the security band.
   · The accent is read from --eu-blue rather than the handoff's #0000ff. The
     page already carries one blue, on the challenge tags, and the handoff is
     explicit that there is never a second accent hue.
   · The header trio and the footer wordmark are gone. The module number, the
     headline and the mark all already sit beside this figure in the showcase
     copy, so drawing them again was the same thing twice. What is left is
     cropped to fit the slot, which the handoff sanctions for a non-square one.

   Third-party marks are files under assets/images; a tile falls back to the
   name if its file is missing, and nothing here draws an approximation of
   someone else's logo. graphzero's own mark is type, so it is drawn.
*/
(function () {
  'use strict';

  var host = document.querySelector('[data-kg-flow]');
  if (!host) return;

  /* ---------- geometry, on the handoff's 600x600 grid ---------- */
  var W = 600;
  /* The drawn content plus a generous margin. The margin is what actually
     narrows the figure on screen: the plate's width is fixed by the column, so
     a crop cut tight to the drawing only scales the drawing up to fill it.
     Content spans x 24 to 500, and the crop is 40 wider on each side. */
  var CROP = { x: -16, w: 556, y: 80, h: 404 };

  var SRC = ['SharePoint', 'Outlook', 'Google Drive', 'Gmail', 'HubSpot',
             'DATEV', 'AFAS', 'Exact', 'Personio'];
  var ASSIST = [
    { name: 'Claude', logo: 'logo-claude.svg' },
    { name: 'Copilot', logo: 'logo-copilot.svg' },
    { name: 'ChatGPT', logo: 'logo-chatgpt.svg' },
    { name: 'graphzero', mark: true }
  ];
  var LOGO_DIR = 'assets/media/';

  var SB = { x: 24, w: 108, h: 34, gap: 5, y0: 118 };
  /* The convergence, pulled left with the source column: the run from the
     boxes to the hub is what most of the figure's width was going on. */
  var HUB = { x: 200, y: 291 };
  /* The base is narrower than the handoff's 160: taking 32 off its right edge
     pulls the assistants in with it and is what makes the whole figure more
     compact across, without moving the source column or the convergence the
     curves are drawn to. */
  var KB = { x: 202, y: 208, w: 128, h: 166 };
  var AP = { x: 362, y: 161, w: 138, h: 260 };
  /* the link between the base and the assistants, which the exchange runs along */
  var LINK = { x1: KB.x + KB.w, x2: AP.x, y: 291 };

  function srcY(i) { return SB.y0 + i * (SB.h + SB.gap); }

  var PATHS = SRC.map(function (_, i) {
    var sy = srcY(i) + SB.h / 2;
    /* The handles are a fixed share of the run rather than fixed lengths, so
       shortening the run keeps the fan's shape instead of kinking it. */
    var run = HUB.x - (SB.x + SB.w);
    return [{ x: SB.x + SB.w, y: sy },
            { x: SB.x + SB.w + run * 0.55, y: sy },
            { x: HUB.x - run * 0.69, y: HUB.y },
            HUB];
  });

  function bez(p, c) {
    var m = 1 - p;
    return {
      x: m*m*m*c[0].x + 3*m*m*p*c[1].x + 3*m*p*p*c[2].x + p*p*p*c[3].x,
      y: m*m*m*c[0].y + 3*m*m*p*c[1].y + 3*m*p*p*c[2].y + p*p*p*c[3].y
    };
  }

  /* ---------- colours, from the page rather than from the handoff ---------- */
  var cs = getComputedStyle(host);
  var C = {
    ink: cs.getPropertyValue('--heading').trim() || '#000',
    body: cs.getPropertyValue('--meta').trim() || '#565656',
    line: cs.getPropertyValue('--line').trim() || 'rgba(0,0,0,.16)',
    accent: cs.getPropertyValue('--eu-blue').trim() || '#003399'
  };

  /* Longhand, never the `font` shorthand. The shorthand demands a family, and
     `inherit` is not a legal value inside it — the whole declaration is dropped
     as invalid, which is exactly what had been happening to every label in this
     figure. Longhand lets the family inherit from the stage as intended.

     500 is as heavy as this typeface goes here: the page ships Geist 400 and
     500 only, and the design system's base stylesheet says in as many words
     that it never goes to 600 or 700. Asking for 700 would get a synthesised
     bold — heavier, but smeared, and off the system. */
  var LABEL = 'font-weight:500;font-size:12px';
  /* The mark, at the centre of the figure and again in its own assistant tile.
     One figure, so one size — set here rather than twice. */
  var MARK = 'font-weight:500;font-size:26px';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, css, text) {
    var n = document.createElement(tag);
    if (css) n.setAttribute('style', css);
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function ring(x, y, w, h, r, extra) {
    return el('div',
      'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h +
      'px;border-radius:' + r + 'px;box-shadow:inset 0 0 0 1px ' + C.line +
      ';display:flex;align-items:center;' + (extra || ''));
  }
  /* ---------- build, complete, once ---------- */
  /* Absolute, so the stage's literal 600px does not become the column's
     minimum width: in flow it was setting the grid track and leaving the block
     short of the container's right edge. */
  var stage = el('div',
    'position:absolute;left:0;top:0;width:' + W + 'px;height:' + W + 'px;color:' + C.ink +
    ';transform-origin:0 0;');
  host.appendChild(stage);

  var layer = svg('svg', { width: W, height: W, viewBox: '0 0 ' + W + ' ' + W,
                           'aria-hidden': 'true',
                           style: 'position:absolute;inset:0;overflow:visible' });
  PATHS.forEach(function (c) {
    layer.appendChild(svg('path', {
      d: 'M ' + c[0].x + ' ' + c[0].y + ' C ' + c[1].x + ' ' + c[1].y + ' ' +
         c[2].x + ' ' + c[2].y + ' ' + c[3].x + ' ' + c[3].y,
      fill: 'none', stroke: C.line, 'stroke-width': '1'
    }));
  });
  layer.appendChild(svg('line', { x1: LINK.x1, y1: LINK.y, x2: LINK.x2, y2: LINK.y,
                                  stroke: C.line, 'stroke-width': '1' }));

  /* One packet per ingestion curve, and a larger one for the exchange between
     the base and the assistants. These are the only things that ever move; the
     first frame of the loop gives them their positions. */
  var packets = PATHS.map(function () {
    var d = svg('circle', { r: '2', fill: C.accent, opacity: '0' });
    layer.appendChild(d);
    return d;
  });
  var exchange = svg('circle', { r: '3.5', fill: C.accent, opacity: '0', cy: LINK.y });
  layer.appendChild(exchange);
  stage.appendChild(layer);

  SRC.forEach(function (name, i) {
    var r = ring(SB.x, srcY(i), SB.w, SB.h, 8);
    r.appendChild(el('span',
      'padding-left:12px;font-size:12.5px;letter-spacing:-0.01em;color:' + C.ink, name));
    stage.appendChild(r);
  });

  var kb = ring(KB.x, KB.y, KB.w, KB.h, 24, 'flex-direction:column;justify-content:center;gap:14px;');
  kb.appendChild(el('div',
    LABEL + ';letter-spacing:-0.02em;color:' + C.ink, 'Knowledge Base'));
  var plate = el('div',
    'width:62px;height:62px;border-radius:16px;box-shadow:inset 0 0 0 1px ' + C.line +
    ';display:flex;align-items:center;justify-content:center;');
  var glyph = el('span', MARK + ';letter-spacing:-0.05em;line-height:1;');
  glyph.appendChild(el('span', 'color:' + C.accent, '/'));
  glyph.appendChild(el('span', 'color:' + C.ink, 'g'));
  plate.appendChild(glyph);
  kb.appendChild(plate);
  stage.appendChild(kb);

  var panel = ring(AP.x, AP.y, AP.w, AP.h, 24,
                   'flex-direction:column;align-items:stretch;justify-content:flex-start;padding:14px 12px;');
  panel.appendChild(el('div',
    LABEL + ';letter-spacing:-0.02em;color:' + C.ink +
    ';text-align:center;padding-bottom:12px', 'AI assistant'));

  var tileWrap = el('div',
    'display:grid;grid-template-columns:1fr 1fr;gap:10px 10px;justify-items:center');
  ASSIST.forEach(function (a) {
    var cell = el('div', 'display:grid;justify-items:center;gap:5px');
    var tile = el('div',
      'width:52px;height:52px;border-radius:14px;box-shadow:inset 0 0 0 1px ' + C.line +
      ';display:grid;place-items:center;overflow:hidden');

    if (a.mark) {
      var g = el('span', MARK + ';letter-spacing:-0.04em;line-height:1;');
      g.appendChild(el('span', 'color:' + C.accent, '/'));
      g.appendChild(el('span', 'color:' + C.ink, 'g'));
      tile.appendChild(g);
    } else {
      var img = document.createElement('img');
      img.src = LOGO_DIR + a.logo;
      img.alt = '';
      img.setAttribute('style', 'width:28px;height:28px;object-fit:contain');
      img.addEventListener('error', function () {
        img.replaceWith(el('span',
          'font-size:11px;letter-spacing:-0.01em;color:' + C.ink + ';text-align:center;padding:0 4px',
          a.name));
      });
      tile.appendChild(img);
    }

    cell.appendChild(tile);
    cell.appendChild(el('div',
      'font-size:10.5px;letter-spacing:-0.01em;color:' + C.body + ';text-align:center', a.name));
    tileWrap.appendChild(cell);
  });
  panel.appendChild(tileWrap);
  panel.appendChild(el('div',
    'margin-top:auto;padding-top:12px;font-size:10.5px;line-height:1.35;color:' + C.body +
    ';text-align:center', 'Answers from the full, holistic picture'));
  stage.appendChild(panel);

  /* ---------- fit ---------- */
  function fit() {
    var box = host.getBoundingClientRect();
    var s = Math.min(box.width / CROP.w, box.height / CROP.h);
    /* centre the crop in the slot, then lift its own origin into view */
    stage.style.transform =
      'translate(' + ((box.width - CROP.w * s) / 2 - CROP.x * s) + 'px,' +
      ((box.height - CROP.h * s) / 2 - CROP.y * s) + 'px) scale(' + s + ')';
  }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(host);
  else window.addEventListener('resize', fit);

  /* ---------- motion ----------
     The packets run all the time; pointing at a module intensifies its own —
     bigger dots, moving faster. The boost eases in and out rather than
     switching, so the figure never jumps under the pointer.

     Phase is accumulated per frame rather than computed from elapsed time.
     That is what lets the speed change mid-flight: a dot carries on from where
     it is and simply covers more ground, where `t * speed` would have snapped
     it to a new position the moment the rate changed. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var PART = {
    ingest: { k: 0, want: 0, phase: 0, slow: 0.30, fast: 0.85, small: 2,   big: 3.5 },
    agents: { k: 0, want: 0, phase: 0, slow: 0.35, fast: 0.95, small: 3.5, big: 5.5 }
  };
  var STAGGER = 0.13;   /* so the nine ingestion packets are never in step */
  var EASE = 5;         /* how briskly a boost arrives, in units per second */

  var raf = null, last = 0, visible = true;

  function mix(a, b, k) { return a + (b - a) * k; }

  function frame(now) {
    if (!visible) { raf = null; return; }
    raf = requestAnimationFrame(frame);

    /* clamped: a throttled or backgrounded tab can hand back a gap of seconds,
       which would teleport every dot on the first frame after it wakes */
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    var ing = PART.ingest;
    ing.k += (ing.want - ing.k) * Math.min(1, dt * EASE);
    ing.phase = (ing.phase + dt * mix(ing.slow, ing.fast, ing.k)) % 1;
    var ingR = mix(ing.small, ing.big, ing.k);
    PATHS.forEach(function (path, i) {
      var p = (ing.phase + i * STAGGER) % 1;
      var at = bez(p, path);
      var d = packets[i];
      d.setAttribute('cx', at.x);
      d.setAttribute('cy', at.y);
      d.setAttribute('r', ingR);
      /* fades in and out at the ends, so nothing appears or vanishes on a
         hard edge */
      d.setAttribute('opacity', Math.sin(Math.PI * p));
    });

    var ag = PART.agents;
    ag.k += (ag.want - ag.k) * Math.min(1, dt * EASE);
    ag.phase = (ag.phase + dt * mix(ag.slow, ag.fast, ag.k)) % 2;
    /* a question out and an answer back: a triangle wave, so it turns around
       rather than jumping back to the start */
    var q = ag.phase > 1 ? 2 - ag.phase : ag.phase;
    exchange.setAttribute('cx', LINK.x1 + q * (LINK.x2 - LINK.x1));
    exchange.setAttribute('r', mix(ag.small, ag.big, ag.k));
    exchange.setAttribute('opacity', 0.35 + 0.65 * Math.sin(Math.PI * q));
  }

  function start() {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  /* The modules drive the intensity. Pointer only: these are reading aids, not
     controls, and there is nothing here that is not already said in the copy
     beside them. */
  document.querySelectorAll('[data-flow]').forEach(function (item) {
    var part = PART[item.getAttribute('data-flow')];
    if (!part) return;
    item.addEventListener('pointerenter', function () { part.want = 1; });
    item.addEventListener('pointerleave', function () { part.want = 0; });
  });

  start();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(host);
  }
})();
