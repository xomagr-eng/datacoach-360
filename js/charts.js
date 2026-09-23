'use strict';
/* ===== DATA COACH 360° — SVG γραφήματα (χωρίς εξωτερικές βιβλιοθήκες) ===== */
const COL = { red:'#e11d2e', red2:'#ff5a67', white:'#f3f4f6', gold:'#f5b301', blue:'#4c8dff', gray:'#8b93a7', purple:'#b48cff', orange:'#ff8a3d' };
const FONT = 'font-family="Segoe UI,Inter,sans-serif"';
/* Σε στενές οθόνες τα γραφήματα σχεδιάζονται με μικρότερο «καμβά», ώστε τα γράμματα να φαίνονται μεγαλύτερα */
const narrow = () => (window.innerWidth||1200) < 640;

function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmt(v, d=2){ if(v==null || !isFinite(v)) return '–'; return Number(v).toFixed(d); }
function fmtK(v){ if(v==null||!isFinite(v)) return '–'; if(Math.abs(v)>=1000) return (v/1000).toFixed(v>=10000?1:2).replace('.',',')+' εκ.€'; return Math.round(v).toLocaleString('el-GR')+' χιλ.€'; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

function niceTicks(min, max, n=5){
  const span = (max-min) || 1, step0 = span/n, mag = 10**Math.floor(Math.log10(step0)), err = step0/mag;
  const step = (err>=7.5?10:err>=3.5?5:err>=1.5?2:1)*mag, t=[];
  for(let v=Math.ceil(min/step)*step; v<=max+1e-9; v+=step) t.push(+v.toFixed(10));
  return t;
}
function tickLabel(v){ return Math.abs(v)>=100 ? Math.round(v) : Math.abs(v)>=10 ? (+v.toFixed(1)) : (+v.toFixed(2)); }

/* ---------- Γήπεδο (συντεταγμένες StatsBomb 120×80, επίθεση προς τα δεξιά) ---------- */
function pitchLines(){
  const l = 'stroke="var(--pitch-line)" stroke-width="0.45" fill="none"';
  return `<rect x="0" y="0" width="120" height="80" ${l}/>
  <line x1="60" y1="0" x2="60" y2="80" ${l}/><circle cx="60" cy="40" r="10" ${l}/><circle cx="60" cy="40" r=".6" fill="var(--pitch-line)"/>
  <rect x="0" y="18" width="18" height="44" ${l}/><rect x="102" y="18" width="18" height="44" ${l}/>
  <rect x="0" y="30" width="6" height="20" ${l}/><rect x="114" y="30" width="6" height="20" ${l}/>
  <circle cx="12" cy="40" r=".6" fill="var(--pitch-line)"/><circle cx="108" cy="40" r=".6" fill="var(--pitch-line)"/>
  <path d="M18 32 A10 10 0 0 1 18 48" ${l}/><path d="M102 32 A10 10 0 0 0 102 48" ${l}/>
  <rect x="-2" y="36" width="2" height="8" ${l}/><rect x="120" y="36" width="2" height="8" ${l}/>`;
}
function pitchSVG(inner, o={}){
  const vb = o.half ? '57 -3 66 86' : '-3 -3 126 86';
  return `<svg ${o.id?`id="${o.id}"`:''} class="pitch" viewBox="${vb}" ${FONT} ${o.click?'style="cursor:crosshair"':''}>
    <rect x="-3" y="-3" width="126" height="86" fill="var(--pitch)"/>${o.under||''}${pitchLines()}${inner}</svg>`;
}

/* Χάρτης σουτ: μέγεθος ~ xG, γκολ = χρυσό */
function shotMapSVG(shots, o={}){
  let s='';
  const mirror = !!o.mirror;
  const sorted = shots.slice().sort((a,b)=> (a.outcome==='Goal') - (b.outcome==='Goal'));
  for(const sh of sorted){
    const x = mirror ? 120 - sh.x : sh.x, y = mirror ? 80 - sh.y : sh.y;
    const r = 0.9 + Math.sqrt(sh.xg||0.02) * 4.2;
    const goal = sh.outcome === 'Goal';
    const col = o.colorBy==='pattern' ? patternColor(sh.pattern) : (o.color || COL.red);
    const tip = `${sh.player?esc(sh.player)+'<br>':''}${sh.minute!=null?sh.minute+'′ · ':''}xG ${fmt(sh.xg,2)}<br>${esc(outcomeGR(sh.outcome))}${sh.pattern?' · '+esc(sh.pattern):''}${sh.header?' · κεφαλιά':''}`;
    if(goal) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${COL.gold}" stroke="#000" stroke-width=".3" data-tip="${tip}"/>`;
    else s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" fill-opacity=".38" stroke="${col}" stroke-width=".35" data-tip="${tip}"/>`;
  }
  return pitchSVG(s, { half: !o.full, id:o.id });
}
function outcomeGR(o){ return ({Goal:'Γκολ',Saved:'Απόκρουση','Off T':'Άουτ',Blocked:'Μπλοκ',Post:'Δοκάρι',Wayward:'Άστοχο','Saved Off T':'Απόκρουση','Saved to Post':'Απόκρουση'})[o] || o || ''; }
function patternColor(p){
  if(!p) return COL.red;
  if(/Κόρνερ|Corner/i.test(p)) return COL.blue;
  if(/Φάουλ|Free Kick/i.test(p)) return COL.purple;
  if(/Αντεπ|Counter/i.test(p)) return COL.orange;
  if(/Πέναλτι|Penalty/i.test(p)) return COL.white;
  return COL.red;
}

/* Heatmap: πλέγμα 12×8 */
function heatSVG(pts, o={}){
  const nx=12, ny=8, g = Array.from({length:ny},()=>Array(nx).fill(0));
  for(const p of pts){ const i=clamp(Math.floor(p.x/10),0,nx-1), j=clamp(Math.floor(p.y/10),0,ny-1); g[j][i]++; }
  const mx = Math.max(1, ...g.flat());
  let under='';
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){
    const v=g[j][i]; if(!v) continue;
    under += `<rect x="${i*10}" y="${j*10}" width="10" height="10" fill="${COL.red}" fill-opacity="${(0.1+0.8*v/mx).toFixed(2)}" data-tip="${v} ενέργειες (${Math.round(100*v/pts.length)}%)"/>`;
  }
  return pitchSVG('', { under, id:o.id });
}

/* Δίκτυο πασών */
function passNetSVG(net, o={}){
  const { nodes, edges } = net; let s='';
  const maxE = Math.max(1, ...edges.map(e=>e.n)), maxN = Math.max(1, ...nodes.map(n=>n.n));
  const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
  for(const e of edges){
    if(e.n < (o.minPass||3)) continue;
    const a=byId[e.a], b=byId[e.b]; if(!a||!b) continue;
    const w = 0.3 + 2.4*e.n/maxE;
    s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${o.color||COL.red}" stroke-opacity="${(0.25+0.6*e.n/maxE).toFixed(2)}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" data-tip="${esc(a.label)} ↔ ${esc(b.label)}: ${e.n} πάσες"/>`;
  }
  for(const n of nodes){
    const r = 2 + 3.2*Math.sqrt(n.n/maxN);
    s += `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="#0b0d12" stroke="${o.color||COL.red}" stroke-width=".9" data-tip="${esc(n.label)}<br>${n.n} πάσες"/>
      <text x="${n.x}" y="${n.y+r+3.2}" font-size="2.7" fill="var(--text)" text-anchor="middle">${esc(n.short||n.label)}</text>`;
  }
  return pitchSVG(s, { id:o.id });
}

/* ---------- Scatter ---------- */
function scatterSVG(pts, o={}){
  const W=o.w||(narrow()?430:720), H=o.h||(narrow()?400:460), m={l:52,r:14,t:20,b:46};
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  for(const p of pts){ x0=Math.min(x0,p.x); x1=Math.max(x1,p.x); y0=Math.min(y0,p.y); y1=Math.max(y1,p.y); }
  if(!pts.length){ x0=0;x1=1;y0=0;y1=1; }
  const px=(x1-x0)*.07||0.5, py=(y1-y0)*.08||0.5; x0-=px; x1+=px; y0-=py; y1+=py;
  const sx=v=>m.l+(v-x0)/(x1-x0)*(W-m.l-m.r), sy=v=>H-m.b-(v-y0)/(y1-y0)*(H-m.t-m.b);
  let s=`<svg ${o.id?`id="${o.id}"`:''} viewBox="0 0 ${W} ${H}" class="chart" ${FONT}><rect width="${W}" height="${H}" fill="var(--panel)"/>`;
  for(const t of niceTicks(x0,x1)){ s+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${m.t}" y2="${H-m.b}" stroke="var(--grid)"/><text x="${sx(t)}" y="${H-m.b+16}" font-size="11" fill="var(--muted)" text-anchor="middle">${tickLabel(t)}</text>`; }
  for(const t of niceTicks(y0,y1)){ s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--grid)"/><text x="${m.l-8}" y="${sy(t)+4}" font-size="11" fill="var(--muted)" text-anchor="end">${tickLabel(t)}</text>`; }
  if(o.xAvg!=null && o.yAvg!=null){
    const qx=sx(o.xAvg), qy=sy(o.yAvg);
    s+=`<rect x="${qx}" y="${m.t}" width="${W-m.r-qx}" height="${qy-m.t}" fill="${COL.red}" fill-opacity=".07"/>
      <line x1="${qx}" x2="${qx}" y1="${m.t}" y2="${H-m.b}" stroke="#fff" stroke-opacity=".35" stroke-dasharray="4 4"/>
      <line x1="${m.l}" x2="${W-m.r}" y1="${qy}" y2="${qy}" stroke="#fff" stroke-opacity=".35" stroke-dasharray="4 4"/>
      <text x="${W-m.r-6}" y="${m.t+14}" font-size="11" fill="${COL.red2}" text-anchor="end" font-weight="700">${esc(o.qLabel||'ΕΛΙΤ')}</text>`;
  }
  if(o.fit){ const {a,b}=o.fit; s+=`<line x1="${sx(x0)}" y1="${sy(a+b*x0)}" x2="${sx(x1)}" y2="${sy(a+b*x1)}" stroke="${COL.gold}" stroke-width="1.6" stroke-dasharray="6 4"/>`; }
  if(o.curve && o.curve.length){ s+=`<path d="${o.curve.filter(p=>p[1]>=y0&&p[1]<=y1).map((p,i)=>(i?'L':'M')+sx(p[0]).toFixed(1)+','+sy(p[1]).toFixed(1)).join('')}" fill="none" stroke="${COL.gold}" stroke-width="1.8" stroke-dasharray="6 4"/>`; if(o.curveLabel){ const p=o.curve.filter(p=>p[1]>=y0&&p[1]<=y1).slice(-1)[0]; if(p) s+=`<text x="${sx(p[0])-4}" y="${sy(p[1])-6}" font-size="11" fill="${COL.gold}" text-anchor="end">${esc(o.curveLabel)}</text>`; } }
  s+=`<text x="${(m.l+W-m.r)/2}" y="${H-10}" font-size="12" fill="var(--text)" text-anchor="middle" font-weight="600">${esc(o.xl||'')}</text>
      <text x="16" y="${(m.t+H-m.b)/2}" font-size="12" fill="var(--text)" text-anchor="middle" font-weight="600" transform="rotate(-90 16 ${(m.t+H-m.b)/2})">${esc(o.yl||'')}</text>`;
  const ord = pts.slice().sort((a,b)=>(a.z||0)-(b.z||0));
  for(const p of ord){
    s+=`<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="${p.r||5}" fill="${p.color||COL.red}" fill-opacity="${p.op??.75}" stroke="${p.stroke||'#0b0d12'}" stroke-width="${p.sw||1}" ${p.id!=null?`data-pid="${p.id}" style="cursor:pointer"`:''} data-tip="${p.tip||esc(p.label)}"/>`;
  }
  for(const p of ord.filter(p=>p.showLabel)){
    s+=`<text x="${(sx(p.x)+7).toFixed(1)}" y="${(sy(p.y)-6).toFixed(1)}" font-size="10.5" fill="var(--text)" paint-order="stroke" stroke="var(--panel)" stroke-width="3">${esc(p.label)}</text>`;
  }
  return s+'</svg>';
}

/* ---------- Radar (εκατοστημόρια 0–100) ---------- */
function radarSVG(axes, series, o={}){
  const S=o.size||(narrow()?400:460), cx=S/2, cy=S/2, R=S/2-(narrow()?84:92), n=axes.length;
  const ang=i=>-Math.PI/2+i*2*Math.PI/n, pt=(i,v)=>[cx+Math.cos(ang(i))*R*v/100, cy+Math.sin(ang(i))*R*v/100];
  let s=`<svg ${o.id?`id="${o.id}"`:''} viewBox="0 0 ${S} ${S}" class="chart" ${FONT}><rect width="${S}" height="${S}" fill="var(--panel)"/>`;
  for(const lv of [25,50,75,100]){
    s+=`<polygon points="${axes.map((_,i)=>pt(i,lv).join(',')).join(' ')}" fill="${lv===50?'rgba(255,255,255,.03)':'none'}" stroke="var(--grid)" stroke-width="${lv===50?1.4:1}"/>`;
  }
  axes.forEach((a,i)=>{
    const [x,y]=pt(i,100), [lx,ly]=pt(i,118), c=Math.cos(ang(i));
    s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--grid)"/>`;
    const words=String(a).split(' '); const lines=[]; let cur='';
    for(const w of words){ if((cur+' '+w).trim().length>14 && cur){ lines.push(cur); cur=w; } else cur=(cur+' '+w).trim(); }
    lines.push(cur);
    s+=`<text x="${lx}" y="${ly-(lines.length-1)*6+4}" font-size="11" fill="var(--text)" text-anchor="${Math.abs(c)<.3?'middle':c>0?'start':'end'}">${lines.map((l,k)=>`<tspan x="${lx}" dy="${k?12:0}">${esc(l)}</tspan>`).join('')}</text>`;
  });
  for(const se of series){
    const P=se.values.map((v,i)=>pt(i,clamp(v,2,100)));
    s+=`<polygon points="${P.map(p=>p.join(',')).join(' ')}" fill="${se.color}" fill-opacity=".22" stroke="${se.color}" stroke-width="2"/>`;
    P.forEach((p,i)=>{ s+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${se.color}" data-tip="${esc(se.name)}<br>${esc(axes[i])}: ${Math.round(se.values[i])}ο εκατοστημόριο${se.raw?'<br>τιμή: '+se.raw[i]:''}"/>`; });
  }
  return s+'</svg>';
}

/* ---------- Γράφημα γραμμών ---------- */
function lineSVG(series, o={}){
  const W=o.w||(narrow()?430:720), H=(o.h||280)*(narrow()?1.05:1), m={l:40,r:12,t:26,b:34};
  const all=series.flatMap(s=>s.pts);
  let x0=Math.min(...all.map(p=>p[0])), x1=Math.max(...all.map(p=>p[0])), y0=o.yMin??Math.min(0,...all.map(p=>p[1])), y1=Math.max(...all.map(p=>p[1]))*1.1||1;
  if(x0===x1) x1=x0+1;
  const sx=v=>m.l+(v-x0)/(x1-x0)*(W-m.l-m.r), sy=v=>H-m.b-(v-y0)/(y1-y0)*(H-m.t-m.b);
  let s=`<svg ${o.id?`id="${o.id}"`:''} viewBox="0 0 ${W} ${H}" class="chart" ${FONT}><rect width="${W}" height="${H}" fill="var(--panel)"/>`;
  for(const t of niceTicks(y0,y1,4)) s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--grid)"/><text x="${m.l-6}" y="${sy(t)+4}" font-size="10.5" fill="var(--muted)" text-anchor="end">${tickLabel(t)}</text>`;
  for(const t of niceTicks(x0,x1,Math.min(10,x1-x0))) s+=`<text x="${sx(t)}" y="${H-m.b+15}" font-size="10.5" fill="var(--muted)" text-anchor="middle">${o.xFmt?o.xFmt(t):tickLabel(t)}</text>`;
  (o.vlines||[]).forEach(v=>{ s+=`<line x1="${sx(v.x)}" x2="${sx(v.x)}" y1="${m.t}" y2="${H-m.b}" stroke="${v.color||'#fff'}" stroke-opacity=".5" stroke-dasharray="3 3"/>${v.label?`<text x="${sx(v.x)+3}" y="${m.t+10}" font-size="10" fill="${v.color||'#fff'}">${esc(v.label)}</text>`:''}`; });
  series.forEach((se)=>{
    let d='';
    se.pts.forEach((p,i)=>{
      if(i===0) d+=`M${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`;
      else if(se.step) d+=`H${sx(p[0]).toFixed(1)}V${sy(p[1]).toFixed(1)}`;
      else d+=`L${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`;
    });
    if(se.area) s+=`<path d="${d}V${sy(y0)}H${sx(se.pts[0][0])}Z" fill="${se.color}" fill-opacity=".10"/>`;
    s+=`<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.width||2}" ${se.dash?`stroke-dasharray="${se.dash}"`:''} stroke-linejoin="round"/>`;
    if(se.dots) se.pts.forEach(p=>{ s+=`<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="${p[3]?4.5:2.6}" fill="${p[3]?COL.gold:se.color}" ${p[2]?`data-tip="${p[2]}"`:''}/>`; });
  });
  let lx=m.l+4;
  series.forEach(se=>{ s+=`<rect x="${lx}" y="6" width="12" height="4" fill="${se.color}"/><text x="${lx+16}" y="12" font-size="11" fill="var(--text)">${esc(se.name)}</text>`; lx+=30+se.name.length*6.3; });
  if(o.yl) s+=`<text x="${W-m.r}" y="12" font-size="11" fill="var(--muted)" text-anchor="end">${esc(o.yl)}</text>`;
  return s+'</svg>';
}

/* ---------- Οριζόντιες μπάρες (HTML) ---------- */
function barsHTML(items, o={}){
  const mx = o.max ?? Math.max(1e-9, ...items.map(i=>Math.max(i.v, i.avg||0)));
  return `<div class="bars">${items.map(i=>{ const m = o.each ? Math.max(1e-9,i.v,i.avg||0)*1.5 : mx; return `<div class="b"><span>${esc(i.l)}</span>
    <div class="track"><div class="fill" style="width:${clamp(100*i.v/m,0,100)}%;background:${i.color||'var(--red)'}"></div>${i.avg!=null?`<div class="avg" style="left:${clamp(100*i.avg/m,0,100)}%" title="Μ.Ο. πρωταθλήματος"></div>`:''}</div>
    <b style="text-align:right">${i.txt ?? fmt(i.v, o.d??2)}</b></div>`; }).join('')}</div>`;
}

/* Heat-colour για conditional formatting (0–100 εκατοστημόριο) */
function heatBg(p){
  const a = clamp(p,0,100)/100;
  return `background:rgba(225,29,46,${(0.06+0.72*a*a).toFixed(2)});color:${a>.55?'#fff':'var(--text)'}`;
}

/* ---------- Εξαγωγή SVG → PNG ---------- */
function svgToPng(svgEl, filename, scale=2){
  if(!svgEl){ toast('Δεν βρέθηκε γράφημα'); return; }
  const cs = getComputedStyle(document.documentElement);
  let str = new XMLSerializer().serializeToString(svgEl).replace(/var\((--[\w-]+)\)/g, (_,v)=>cs.getPropertyValue(v).trim()||'#888');
  if(!/xmlns=/.test(str)) str = str.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
  const vb = svgEl.viewBox.baseVal, w = (vb&&vb.width)||svgEl.clientWidth, h=(vb&&vb.height)||svgEl.clientHeight;
  const k = Math.max(scale, 1400/w);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = w*k; c.height = h*k + 44;
    const g = c.getContext('2d'); g.fillStyle = cs.getPropertyValue('--panel').trim()||'#141821'; g.fillRect(0,0,c.width,c.height);
    g.drawImage(img, 0, 0, w*k, h*k);
    g.fillStyle = '#e11d2e'; g.fillRect(0, h*k, c.width, 44);
    g.fillStyle = '#fff'; g.font = 'bold 20px Segoe UI, sans-serif'; g.fillText('DATA COACH 360°', 16, h*k+29);
    g.font = '15px Segoe UI, sans-serif'; g.textAlign='right'; g.fillText(S.settings.author ? S.settings.author : 'Ανάλυση δεδομένων ποδοσφαίρου', c.width-16, h*k+28);
    const a = document.createElement('a'); a.download = filename + '.png'; a.href = c.toDataURL('image/png'); a.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str);
}
