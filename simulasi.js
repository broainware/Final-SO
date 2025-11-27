// script.js - upgraded to animate nodes (HTML) and render edges in SVG
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  function el(tag, attrs={}, children=[]) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (!Array.isArray(children)) children = [children];
    children.forEach(c => { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  // ---------- Layout (top-down) ----------
  function layoutNodes(nodes, canvasW=1400, canvasH=1000) {
    // compute level (longest path from sources)
    const g = {};
    nodes.forEach(n => g[n.id] = (n.deps||[]).slice());
    const indeg = {}, rev = {};
    nodes.forEach(n => { indeg[n.id]=0; rev[n.id]=[]; });
    nodes.forEach(n => (n.deps||[]).forEach(d => { if (indeg[n.id]!==undefined) indeg[n.id]++; if (rev[d]) rev[d].push(n.id); }));
    const q = [], level = {};
    nodes.forEach(n => { if (indeg[n.id]===0) { q.push(n.id); level[n.id]=0; }});
    while(q.length){
      const u = q.shift();
      (rev[u]||[]).forEach(v => {
        level[v] = Math.max((level[v]||0), (level[u]||0)+1);
        indeg[v]--;
        if (indeg[v]===0) q.push(v);
      });
    }
    nodes.forEach(n => { if (level[n.id]===undefined) level[n.id]=0; });
    const buckets = {};
    Object.keys(level).forEach(id => { const lv = level[id]; (buckets[lv] = buckets[lv]||[]).push(id); });
    const levels = Object.keys(buckets).map(x=>parseInt(x)).sort((a,b)=>a-b);
    const positions = {};
    const cols = Math.max(1, levels.length);
    const colWidth = canvasW / (cols + 1);
    levels.forEach((lv, idx) => {
      const col = buckets[lv];
      const gap = canvasH / (col.length + 1);
      col.forEach((id, j) => {
        positions[id] = { x: (idx+1)*colWidth, y: (j+1)*gap };
      });
    });
    return positions;
  }

  // ---------- Cycle detection ----------
  function hasCycle(nodes) {
    const g = {};
    nodes.forEach(n => g[n.id] = (n.deps||[]).slice());
    const visited = {}, onstack = {};
    let found = false;
    function dfs(u){
      if (found) return;
      visited[u]=true; onstack[u]=true;
      (g[u]||[]).forEach(v=>{
        if (!g[v]) return;
        if (!visited[v]) dfs(v);
        else if (onstack[v]) found = true;
      });
      onstack[u]=false;
    }
    Object.keys(g).forEach(u=>{ if (!visited[u]) dfs(u); });
    return found;
  }

  // ---------- Simulation engine ----------
  function createSimulator(nodes) {
    const state = {};
    nodes.forEach(n => state[n.id] = { status:'idle', remaining: n.duration||1 });
    let time = 0, history=[];
    function step(){
      const ready = nodes.filter(n => state[n.id].status === 'idle' && (n.deps||[]).every(d=> state[d] && state[d].status==='done'));
      ready.forEach(n=> state[n.id].status = 'running');
      const running = nodes.filter(n => state[n.id].status === 'running');
      running.forEach(n => {
        state[n.id].remaining -= 1;
        if (state[n.id].remaining <= 0) state[n.id].status = 'done';
      });
      time++;
      history.push(JSON.parse(JSON.stringify(state)));
      return {time, started: ready.map(r=>r.id), finished: running.filter(n=> state[n.id].status==='done').map(n=>n.id) };
    }
    function reset() {
      nodes.forEach(n=> state[n.id] = { status:'idle', remaining: n.duration||1 });
      time=0; history=[];
    }
    function getState(){ return JSON.parse(JSON.stringify(state)); }
    function isFinished(){ return nodes.every(n=> state[n.id].status==='done'); }
    return { step, reset, getState, isFinished, nodes, timeRef: ()=> time };
  }

  // ---------- Drawing: edges in SVG, nodes as HTML divs ----------

  function drawEdges(svgEl, nodes, positions, opts={color:'rgba(255,255,255,0.12)'}) {
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    const ns = "http://www.w3.org/2000/svg";
    // match svg size to container
    const rect = svgEl.getBoundingClientRect();
     svgEl.setAttribute('viewBox', `0 0 1400 1000`);
    nodes.forEach(n => {
      (n.deps||[]).forEach(d => {
        if (!positions[d] || !positions[n.id]) return;
        const from = positions[d], to = positions[n.id];
        // convert to svg coords relative to container size
        const sx = from.x, sy = from.y;
        const tx = to.x, ty = to.y;
        const mx = (sx + tx) / 2;
        const path = document.createElementNS(ns,'path');
        const dpath = `M ${sx} ${sy} C ${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;
        path.setAttribute('d', dpath);
        path.setAttribute('fill','none');
        path.setAttribute('stroke', opts.color);
        path.setAttribute('stroke-width','2');
        path.setAttribute('stroke-linecap','round');
        path.setAttribute('class','edge-path');
        svgEl.appendChild(path);
        // arrow head polygon
        const arrow = document.createElementNS(ns,'polygon');
        const ax = tx, ay = ty;
        arrow.setAttribute('points', `${ax},${ay} ${ax-8},${ay-5} ${ax-8},${ay+5}`);
        arrow.setAttribute('fill', opts.color);
        svgEl.appendChild(arrow);
      });
    });
  }

  function renderNodesHtml(layerEl, nodes, positions, states) {
    // keep existing nodes if present (update), else create
    const existing = {};
    Array.from(layerEl.children).forEach(ch => { existing[ch.dataset.id] = ch; });
    nodes.forEach(n => {
      const pos = positions[n.id] || {x:50,y:50};
      let nodeEl = existing[n.id];
      const status = (states[n.id]||{}).status || 'idle';
      const statusClass = status === 'idle' ? 'waiting' : (status === 'ready' ? 'ready' : (status === 'running' ? 'running' : (status === 'done' ? 'done' : 'waiting')));
      if (!nodeEl) {
        nodeEl = el('div', { class: `node ${statusClass}`, 'data-id': n.id });
        nodeEl.innerHTML = `<div class="id">${n.id}</div><div class="state">${status.toUpperCase()}</div>`;
        layerEl.appendChild(nodeEl);
      } else {
        nodeEl.className = `node ${statusClass}`;
        nodeEl.querySelector('.state').textContent = status.toUpperCase();
      }
      // style transform position (animated by CSS)
      nodeEl.style.left = `${pos.x}px`;
      nodeEl.style.top = `${pos.y}px`;
    });

    // remove nodes no longer present
    Object.keys(existing).forEach(id => {
      if (!nodes.find(n=>n.id===id)) {
        const rem = existing[id];
        rem.style.opacity = '0';
        setTimeout(()=> rem.remove(), 360);
      }
    });
  }

  // utility to compute augmented "ready" state for display
  function computeAugmentedStates(nodes, simState) {
    const aug = {};
    nodes.forEach(n => {
      const st = simState[n.id] || {status:'idle'};
      if (st.status === 'idle') {
        const ready = (n.deps || []).every(d => (simState[d] && simState[d].status === 'done'));
        aug[n.id] = { status: ready ? 'ready' : 'waiting' };
      } else {
        aug[n.id] = { status: st.status };
      }
    });
    return aug;
  }

  // ---------- Manual mode variables & UI ----------
  const manual = { nodes: [], simulator: null };

  function refreshManualUI() {
    const depsSelect = $('#proc-deps');
    depsSelect.innerHTML = '';
    manual.nodes.forEach(n => {
      const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id;
      depsSelect.appendChild(opt);
    });

    const list = $('#process-list');
    list.innerHTML = '';
    manual.nodes.forEach(n => {
      const li = el('li', {}, [
        `${n.id} [${n.duration}s] deps: ${n.deps.length? n.deps.join(', '): '-'}`,
        el('div', {}, [
          (() => {
            const del = el('button', {}, 'Hapus'); del.style.marginRight='8px';
            del.onclick = () => { manual.nodes = manual.nodes.filter(x=>x.id!==n.id); refreshManualUI(); renderManualGraph();};
            return del;
          })(),
          (() => {
            const edit = el('button', {}, 'Edit'); edit.onclick = () => {
              $('#proc-id').value = n.id;
              $('#proc-duration').value = n.duration;
              Array.from($('#proc-deps').options).forEach(o => o.selected = n.deps.includes(o.value));
            };
            edit.style.background='transparent'; edit.style.border='1px solid rgba(255,255,255,0.06)'; edit.style.color='var(--muted)';
            return edit;
          })()
        ])
      ]);
      list.appendChild(li);
    });

    renderManualGraph();
  }

  function renderManualGraph() {
    const svg = $('#graph-svg');
    const layer = $('#node-layer');
    // compute layout on larger virtual canvas
    const layout = layoutNodes(manual.nodes, 1400, 1000);
    // center virtual canvas in view: we set node-layer size and offset via CSS scroll; alternatively we can position absolute coords
    // ensure svg viewbox covers node-layer area
    drawEdges(svg, manual.nodes, layout);
    // sim state
    const state = manual.simulator ? manual.simulator.getState() : {};
    const aug = computeAugmentedStates(manual.nodes, state);
    renderNodesHtml(layer, manual.nodes, layout, aug);

    $('#sim-info').textContent = manual.simulator ? `Waktu: ${manual.simulator.timeRef ? manual.simulator.timeRef() : 0}` : '';
    if (hasCycle(manual.nodes)) {
      $('#deadlock-warn').classList.remove('hidden');
    } else {
      $('#deadlock-warn').classList.add('hidden');
    }
  }

  // handlers
  $('#process-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#proc-id').value.trim();
    const duration = Math.max(1, parseInt($('#proc-duration').value,10)||1);
    if (!id) return alert('Isi ID proses');
    const deps = Array.from($('#proc-deps').selectedOptions).map(o=>o.value).filter(x=>x!==id);
    const existing = manual.nodes.find(n=>n.id===id);
    if (existing) { existing.duration = duration; existing.deps = deps; }
    else manual.nodes.push({ id, duration, deps });
    $('#proc-id').value=''; $('#proc-duration').value='3';
    refreshManualUI(); manual.simulator = null;
  });

  $('#clear-all').addEventListener('click', () => {
    if (!confirm('Hapus semua proses?')) return;
    manual.nodes = [];
    refreshManualUI();
    manual.simulator = null;
  });

  $('#start-sim').addEventListener('click', () => {
    if (!manual.simulator) manual.simulator = createSimulator(manual.nodes.map(n=>({ id:n.id,duration:n.duration,deps:n.deps })));
    if (hasCycle(manual.nodes)) { $('#deadlock-warn').classList.remove('hidden'); alert('Deadlock/loop terdeteksi — hentikan simulasi atau perbaiki dependencies.'); return; }
    const runStep = () => {
      const res = manual.simulator.step();
      renderManualGraph();
      if (!manual.simulator.isFinished()) setTimeout(runStep, 700);
      else { renderManualGraph(); alert('Simulasi selesai'); }
    };
    runStep();
  });

  $('#step-sim').addEventListener('click', () => {
    if (!manual.simulator) manual.simulator = createSimulator(manual.nodes.map(n=>({ id:n.id,duration:n.duration,deps:n.deps })));
    if (hasCycle(manual.nodes)) { $('#deadlock-warn').classList.remove('hidden'); alert('Deadlock/loop terdeteksi — hentikan simulasi atau perbaiki dependencies.'); return; }
    manual.simulator.step(); renderManualGraph();
  });

  $('#reset-sim').addEventListener('click', () => {
    if (manual.simulator) manual.simulator.reset();
    manual.simulator = null; renderManualGraph();
  });

  // ---------- Statement mode ----------
  const statement = { nodes: [], simulator: null };

  function parseStatementsText(text) {
    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
    const nodes = [];
    lines.forEach(line => {
      let left = null;
      if (line.includes('=')) left = line.split('=')[0].trim();
      else left = line.split(/\s+/)[0].trim();
      if (!left) return;
      const rhs = line.split('=').slice(1).join('=');
      const tokens = rhs ? rhs.match(/[A-Za-z]+/g) || [] : [];

      const deps = tokens.filter(t => t !== left);
      nodes.push({ id:left, duration:2, deps: Array.from(new Set(deps)), raw: line });
    });
    const defined = new Set(nodes.map(n=>n.id));
    const extra = [];
    nodes.forEach(n => n.deps.forEach(d => { if (!defined.has(d)) { defined.add(d); extra.push({ id:d, duration:1, deps: [] }); } }));
    return nodes.concat(extra);
  }

  function refreshStatementUI() {
    const list = $('#statement-list');
    list.innerHTML = '';
    statement.nodes.forEach(n => {
      const li = el('li', {}, [
        `${n.id} [${n.duration}s] deps: ${n.deps.length? n.deps.join(', '): '-'}`,
        el('div', {}, [
          (() => { const del = el('button', {}, 'Hapus'); del.onclick = () => { statement.nodes = statement.nodes.filter(x=>x.id!==n.id); refreshStatementUI(); renderStatementGraph(); }; del.style.marginRight='8px'; return del; })(),
          (() => { const edit = el('button', {}, 'Edit'); edit.onclick = () => { const newDur = prompt('Durasi (detik) untuk ' + n.id, n.duration); if (newDur !== null) { n.duration = Math.max(1, parseInt(newDur,10)||1); refreshStatementUI(); renderStatementGraph(); } }; edit.style.background='transparent'; edit.style.border='1px solid rgba(255,255,255,0.06)'; edit.style.color='var(--muted)'; return edit; })()
        ])
      ]);
      list.appendChild(li);
    });
    renderStatementGraph();
  }

  function renderStatementGraph() {
    const svg = $('#graph-st-svg');
    const layer = $('#node-layer-st');
    const layout = layoutNodes(statement.nodes, 1400, 1000);
    drawEdges(svg, statement.nodes, layout);
    const state = statement.simulator ? statement.simulator.getState() : {};
    const aug = computeAugmentedStates(statement.nodes, state);
    renderNodesHtml(layer, statement.nodes, layout, aug);

    $('#sim-info-st').textContent = statement.simulator ? `Waktu: ${statement.simulator.timeRef ? statement.simulator.timeRef() : 0}` : '';
    if (hasCycle(statement.nodes)) $('#deadlock-warn-st').classList.remove('hidden'); else $('#deadlock-warn-st').classList.add('hidden');
  }

  $('#parse-statements').addEventListener('click', () => {
    const text = $('#statements').value;
    const nodes = parseStatementsText(text);
    const map = {};
    nodes.forEach(n => {
      if (!map[n.id]) map[n.id] = { id: n.id, duration: n.duration, deps: n.deps.slice() };
      else { map[n.id].deps = Array.from(new Set(map[n.id].deps.concat(n.deps))); if (n.duration) map[n.id].duration = n.duration; }
    });
    statement.nodes = Object.values(map);
    refreshStatementUI(); statement.simulator = null;
  });

  $('#clear-statements').addEventListener('click', () => {
    $('#statements').value = '';
    statement.nodes = [];
    refreshStatementUI();
    statement.simulator = null;
  });

  $('#start-sim-st').addEventListener('click', () => {
    if (!statement.simulator) statement.simulator = createSimulator(statement.nodes.map(n=>({ id:n.id,duration:n.duration,deps:n.deps })));
    if (hasCycle(statement.nodes)) { $('#deadlock-warn-st').classList.remove('hidden'); alert('Deadlock/loop terdeteksi — hentikan simulasi atau perbaiki dependencies.'); return; }
    const runStep = () => {
      statement.simulator.step();
      renderStatementGraph();
      if (!statement.simulator.isFinished()) setTimeout(runStep, 700);
      else { renderStatementGraph(); alert('Simulasi selesai'); }
    };
    runStep();
  });

  $('#step-sim-st').addEventListener('click', () => {
    if (!statement.simulator) statement.simulator = createSimulator(statement.nodes.map(n=>({ id:n.id,duration:n.duration,deps:n.deps })));
    if (hasCycle(statement.nodes)) { $('#deadlock-warn-st').classList.remove('hidden'); alert('Deadlock/loop terdeteksi — hentikan simulasi atau perbaiki dependencies.'); return; }
    statement.simulator.step(); renderStatementGraph();
  });

  $('#reset-sim-st').addEventListener('click', () => {
    if (statement.simulator) statement.simulator.reset();
    statement.simulator = null; renderStatementGraph();
  });

  const helpBubble = document.getElementById('help-bubble');
const helpPopup = document.getElementById('help-popup');
const helpClose = document.getElementById('help-close');

helpBubble.addEventListener('click', () => {
  helpPopup.classList.toggle('show');
});

helpClose.addEventListener('click', () => {
  helpPopup.classList.remove('show');
});

window.addEventListener('click', (e) => {
  if (
    helpPopup.classList.contains('show') &&
    !helpPopup.contains(e.target) &&
    e.target !== helpBubble
  ) {
    helpPopup.classList.remove('show');
  }
});

const helpBubble = document.getElementById('help-bubble');
const helpPopup = document.getElementById('help-popup');
const helpClose = document.getElementById('help-close');

helpBubble.addEventListener('click', () => {
  helpPopup.classList.toggle('show');
});

helpClose.addEventListener('click', () => {
  helpPopup.classList.remove('show');
});

window.addEventListener('click', (e) => {
  if (
    helpPopup.classList.contains('show') &&
    !helpPopup.contains(e.target) &&
    e.target !== helpBubble
  ) {
    helpPopup.classList.remove('show');
  }
});

  // ---------- Navigation ----------
  function showPage(page) {
    $$('.page').forEach(p => p.classList.add('hidden'));
    $('#'+page).classList.remove('hidden');
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    if (page === 'landing') $('#nav-landing').classList.add('active');
    if (page === 'manual') $('#nav-manual').classList.add('active');
    if (page === 'statement') $('#nav-statement').classList.add('active');
  }
  $('#nav-landing').addEventListener('click', ()=>showPage('landing'));
  $('#nav-manual').addEventListener('click', ()=>showPage('manual'));
  $('#nav-statement').addEventListener('click', ()=>showPage('statement'));
  $('#card-manual').addEventListener('click', ()=>showPage('manual'));
  $('#card-statement').addEventListener('click', ()=>showPage('statement'));

  // initial
  refreshManualUI();
  refreshStatementUI();
  window.__simulatorApp = { manual, statement };
})();
