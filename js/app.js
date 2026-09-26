'use strict';
/* ===== DATA COACH 360° — Πυρήνας: κατάσταση, μετρικές, μοντέλα, πλοήγηση, Αρχική, Δεδομένα ===== */

const LS_KEY = 'dc360_v1';
const DEF_STATE = {
  settings:{ myTeam:MY_TEAM_DEFAULT, nextOpp:'Κεραυνός Αθηνών', minMin:450, revenue:9000, transferBudget:1500, agentFees:150, author:'' },
  shortlist:[], roadmap:{}, loads:{}, imported:null, tm:{}, sb:null
};
function loadState(){
  try{ const s = JSON.parse(localStorage.getItem(LS_KEY)) || {};
    return Object.assign(JSON.parse(JSON.stringify(DEF_STATE)), s, { settings:Object.assign({}, DEF_STATE.settings, s.settings) });
  }catch(e){ return JSON.parse(JSON.stringify(DEF_STATE)); }
}
const S = loadState();
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){ toast('Η αποθήκευση απέτυχε (πολύ μεγάλα δεδομένα;)'); } }

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function toast(m){ const t=$('#toast'); t.textContent=m; t.style.display='block'; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.display='none',2600); }
function on(sel, ev, fn){ const el = typeof sel==='string' ? $(sel) : sel; if(el) el.addEventListener(ev, fn); }
function opts(list, cur){ return list.map(o=>{ const [v,l] = Array.isArray(o)?o:[o,o]; return `<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`; }).join(''); }
function download(name, text, type='text/plain'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
function copyText(t){ (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Αντιγράφηκε ✔')).catch(()=>{ const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Αντιγράφηκε ✔'); }); }
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
const sum = a => a.reduce((x,y)=>x+y,0);
function sd(a){ const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)**2)))||1; }

/* ---------- Μετρικές ---------- */
const M = {
  goals:{l:'Γκολ',t:'p90'}, ast:{l:'Ασίστ',t:'p90'}, npxg:{l:'npxG',t:'p90'}, xa:{l:'xA',t:'p90'},
  ga90:{l:'Γκολ+Ασίστ',t:'sum',parts:['goals','ast']}, npxgxa:{l:'npxG+xA',t:'sum',parts:['npxg','xa']},
  shots:{l:'Σουτ',t:'p90'}, sotPct:{l:'Σουτ στο στόχο %',t:'pct',n:'sot',dn:'shots'},
  kp:{l:'Key passes',t:'p90'}, progP:{l:'Προωθητικές πάσες',t:'p90'}, progC:{l:'Προωθητικές κούρσες',t:'p90'},
  crosses:{l:'Σέντρες στην περιοχή',t:'p90'}, lineBreak:{l:'Line-breaking πάσες',t:'p90'},
  passPct:{l:'Ευστοχία πασών %',t:'pct',n:'passCmp',dn:'passAtt'}, f3Pct:{l:'Ευστοχία τελ. τρίτου %',t:'pct',n:'f3Cmp',dn:'f3Att'},
  touchBox:{l:'Επαφές στην περιοχή',t:'p90'}, drbS:{l:'Επιτυχ. ντρίμπλες',t:'p90'}, drbPct:{l:'Ντρίμπλες %',t:'pct',n:'drbS',dn:'drbA'},
  tkl:{l:'Τάκλιν',t:'p90'}, int:{l:'Αναχαιτίσεις',t:'p90'}, tklInt:{l:'Τάκλιν + Αναχαιτ.',t:'sum',parts:['tkl','int']},
  recov:{l:'Ανακτήσεις',t:'p90'}, clear:{l:'Απομακρύνσεις',t:'p90'}, pressures:{l:'Πιέσεις',t:'p90'},
  aerT:{l:'Εναέριες μονομαχίες',t:'p90'}, aerPct:{l:'Εναέριες νίκες %',t:'pct',n:'aerW',dn:'aerT'},
  dduelT:{l:'Αμυντικές μονομαχίες',t:'p90'}, dduelPct:{l:'Αμυντ. μονομαχίες %',t:'pct',n:'dduelW',dn:'dduelT'},
  savePct:{l:'Αποκρούσεις %',t:'raw'}, psxgd:{l:'PSxG ± (ανά 90)',t:'p90'}
};
function val(p,k){
  const m = M[k]; if(!m) return +p[k]||0;
  const per = Math.max(p.min,1)/90;
  if(m.t==='p90') return (+p[k]||0)/per;
  if(m.t==='sum') return m.parts.reduce((s,x)=>s+(+p[x]||0),0)/per;
  if(m.t==='pct') return p[m.dn]>0 ? 100*p[m.n]/p[m.dn] : 0;
  return +p[k]||0;
}
function fv(p,k){ const v=val(p,k); return M[k] && (M[k].t==='pct'||M[k].t==='raw') ? v.toFixed(1) : v.toFixed(2); }

const ROLES = {
  GK:{l:'Τερματοφύλακες',pos:['GK'],m:['savePct','psxgd','passPct','recov'],sx:'psxgd',sy:'savePct',vis:'Scatter PSxG± vs % αποκρούσεων'},
  CB:{l:'Κεντρικοί αμυντικοί',pos:['CB'],m:['aerPct','dduelPct','recov','clear','int','progP','passPct'],sx:'dduelT',sy:'dduelPct',vis:'Scatter: πλήθος αμυντικών μονομαχιών (Χ) vs % επιτυχίας (Υ)'},
  FB:{l:'Πλάγιοι / Χαφ-μπακ',pos:['FB'],m:['crosses','progC','xa','tklInt','kp','dduelPct'],sx:'progC',sy:'xa',vis:'Radar: επιθετική συνεισφορά (xA, σέντρες) vs αμυντική συνέπεια (τάκλιν)'},
  CM:{l:'Κεντρικοί μέσοι (6/8/10)',pos:['DM','CM','AM'],m:['passPct','f3Pct','kp','pressures','lineBreak','progP','xa','tklInt'],sx:'xa',sy:'kp',vis:'Matrix table με conditional formatting + scatter xA vs Key passes'},
  FW:{l:'Επιθετικοί & εξτρέμ',pos:['W','ST'],m:['npxg','xa','sotPct','touchBox','drbPct','shots','ga90'],sx:'npxg',sy:'xa',vis:'Scatter npxG (Χ) vs xA (Υ) — πάνω δεξιά οι απόλυτοι κίνδυνοι'}
};
const POS_L = { GK:'ΤΦ', CB:'ΚΑ', FB:'ΠΑ', DM:'ΑΜ', CM:'ΚΜ', AM:'ΟΜ', W:'ΕΞ', ST:'ΦΟΡ' };
const POS_FULL = { GK:'Τερματοφύλακας', CB:'Κεντρικός αμυντικός', FB:'Πλάγιος αμυντικός', DM:'Αμυντικός μέσος', CM:'Κεντρικός μέσος', AM:'Επιθετικός μέσος', W:'Εξτρέμ', ST:'Φορ' };
function roleOf(pos){ for(const k in ROLES) if(ROLES[k].pos.includes(pos)) return k; return 'CM'; }
function leagueName(id){ return LEAGUES[id] ? LEAGUES[id].name : (S.imported && S.imported.league===id ? S.imported.label : id); }
function leagueShort(id){ return LEAGUES[id] ? LEAGUES[id].short : (S.imported && S.imported.league===id ? (S.imported.label||'IMP').slice(0,10) : id); }

/* ---------- Βάση παικτών + scores ---------- */
let PL = [], PBY = {}, POOL = {};
function qualified(p){ return p.min >= S.settings.minMin; }
function rebuild(){
  const imp = S.imported && S.imported.players ? S.imported.players : [];
  PL = (S.imported && S.imported.mode==='replace') ? imp.slice() : DB.players.concat(imp);
  for(const p of PL){ const tm = S.tm[normName(p.name)]; if(tm){ if(tm.value) p.value=tm.value; if(tm.wage) p.wage=tm.wage; if(tm.contract) p.contract=tm.contract; } }
  PBY = Object.fromEntries(PL.map(p=>[p.id,p]));
  POOL = {};
  for(const r in ROLES){
    const pool = PL.filter(p=>ROLES[r].pos.includes(p.pos) && qualified(p));
    POOL[r] = { n:pool.length, sorted:{} };
    const keys = new Set([...ROLES[r].m, ...Object.keys(M)]);
    for(const k of keys) POOL[r].sorted[k] = pool.map(p=>val(p,k)).sort((a,b)=>a-b);
  }
  for(const p of PL){ const r = roleOf(p.pos); p._role = r; p._score = mean(ROLES[r].m.map(k=>pct(p,k))); }
  fitModels();
}
function pct(p,k,role){
  const arr = POOL[role||p._role||roleOf(p.pos)]?.sorted[k]; if(!arr || !arr.length) return 50;
  const v = val(p,k); let lo=0, hi=arr.length;
  while(lo<hi){ const mid=(lo+hi)>>1; if(arr[mid]<v) lo=mid+1; else hi=mid; }
  let hi2=lo; while(hi2<arr.length && arr[hi2]===v) hi2++;
  return 100*((lo+hi2)/2)/arr.length;
}
function roleAvg(role, k, league){
  const pool = PL.filter(p=>ROLES[role].pos.includes(p.pos) && qualified(p) && (!league || p.league===league));
  return mean(pool.map(p=>val(p,k)));
}

/* ---------- Οικονομικά μοντέλα (OLS) ---------- */
function ols(X, y){
  const n = X[0].length, A = Array.from({length:n},()=>Array(n+1).fill(0));
  for(let i=0;i<X.length;i++) for(let a=0;a<n;a++){ for(let b=0;b<n;b++) A[a][b]+=X[i][a]*X[i][b]; A[a][n]+=X[i][a]*y[i]; }
  for(let a=0;a<n;a++) A[a][a] += 1e-6;
  for(let c=0;c<n;c++){
    let piv=c; for(let r=c+1;r<n;r++) if(Math.abs(A[r][c])>Math.abs(A[piv][c])) piv=r;
    [A[c],A[piv]]=[A[piv],A[c]];
    for(let r=0;r<n;r++){ if(r===c) continue; const f=A[r][c]/A[c][c]; for(let k=c;k<=n;k++) A[r][k]-=f*A[c][k]; }
  }
  return A.map((r,i)=>r[n]/r[i]);
}
const isTop = p => p.league==='L2' ? 0 : 1;
const wageX = p => [1, p._score, isTop(p)];
const valX = p => [1, p._score, p.age, p.age*p.age, isTop(p), Math.min(1, p.min/1800)];
let WAGE_B = null, VAL_B = null;
function fitModels(){
  const q = PL.filter(p=>qualified(p) && p.wage>0);
  WAGE_B = q.length>8 ? ols(q.map(wageX), q.map(p=>Math.log(p.wage))) : null;
  const qv = PL.filter(p=>qualified(p) && p.value>0);
  VAL_B = qv.length>10 ? ols(qv.map(valX), qv.map(p=>Math.log(p.value))) : null;
  for(const p of PL){
    p._expWage = WAGE_B ? Math.exp(sum(wageX(p).map((x,i)=>x*WAGE_B[i]))) : null;
    p._vfm = p._expWage && p.wage ? p._expWage/p.wage : null;
    p._expVal = VAL_B ? Math.exp(sum(valX(p).map((x,i)=>x*VAL_B[i]))) : null;
    p._under = p._expVal && p.value ? p._expVal/p.value : null;
  }
}
function vfmTag(p){
  if(p._vfm==null) return '<span class="tag">–</span>';
  if(p._vfm>=1.35) return '<span class="tag g">💎 Value</span>';
  if(p._vfm>=0.85) return '<span class="tag w">Δίκαιο</span>';
  if(p._vfm>=0.6) return '<span class="tag">Ακριβός</span>';
  return '<span class="tag r">Υπερπληρωμένος</span>';
}
function scoreCol(s){ return s>=75?'var(--red2)':s>=55?'#fff':s>=40?'var(--muted)':'#6b7285'; }

/* ---------- Ομάδες: συγκεντρωτικά ---------- */
function poissonP(l,k){ let p=Math.exp(-l); for(let i=1;i<=k;i++) p*=l/i; return p; }
function matchProbs(l1,l2,max=10){
  let h=0,d=0,a=0; const mat=[];
  for(let i=0;i<=max;i++){ mat[i]=[]; for(let j=0;j<=max;j++){ const p=poissonP(l1,i)*poissonP(l2,j); mat[i][j]=p; if(i>j)h+=p; else if(i===j)d+=p; else a+=p; } }
  return { h,d,a,mat };
}
const _agg = {};
function teamAgg(t){
  if(!t) return null;
  if(_agg[t.name]) return _agg[t.name];
  const ms = t.matches, n = ms.length;
  let pts=0,w=0,d=0,l=0,xpts=0;
  for(const m of ms){ if(m.gf>m.ga){pts+=3;w++;} else if(m.gf===m.ga){pts++;d++;} else l++; const pr=matchProbs(m.xgf,m.xga,8); xpts+=3*pr.h+pr.d; }
  const A = { n, pts, w, d, l, xpts, gf:sum(ms.map(m=>m.gf)), ga:sum(ms.map(m=>m.ga)), xgf:sum(ms.map(m=>m.xgf)), xga:sum(ms.map(m=>m.xga)),
    ppda:mean(ms.map(m=>m.ppda)), poss:mean(ms.map(m=>m.poss)), spxgf:sum(ms.map(m=>m.spxgf)), spxga:sum(ms.map(m=>m.spxga)) };
  A.xgfM=A.xgf/n; A.xgaM=A.xga/n;
  _agg[t.name]=A; return A;
}
function leagueTable(lg){
  return DB.teams.filter(t=>t.league===lg).map(t=>({ t, a:teamAgg(t) }))
    .sort((x,y)=> y.a.pts-x.a.pts || (y.a.gf-y.a.ga)-(x.a.gf-x.a.ga) || y.a.gf-x.a.gf)
    .map((r,i)=>({ ...r, rank:i+1 }));
}
function rankOf(t){ return leagueTable(t.league).find(r=>r.t===t)?.rank; }
function shotProfile(shots){
  const xg = sum(shots.map(s=>s.xg))||1e-9, by = f=>sum(shots.filter(f).map(s=>s.xg))/xg;
  return { n:shots.length, xg, goals:shots.filter(s=>s.outcome==='Goal').length,
    sp:by(s=>/Κόρνερ|Φάουλ/.test(s.pattern)), head:by(s=>s.header), late:by(s=>s.minute>=76), counter:by(s=>s.pattern==='Αντεπίθεση'),
    L:by(s=>s.ch==='L'), C:by(s=>s.ch==='C'), R:by(s=>s.ch==='R'), box:by(s=>s.x>=102 && s.y>=18 && s.y<=62),
    bands:[[0,15],[16,30],[31,45],[46,60],[61,75],[76,99]].map(([a,b])=>by(s=>s.minute>=a&&s.minute<=b)),
    avgDist: mean(shots.map(s=>shotGeom(s.x,s.y).dist*0.9144)) };
}
const _lgAvg = {};
function leagueAvg(lg){
  if(_lgAvg[lg]) return _lgAvg[lg];
  const T = DB.teams.filter(t=>t.league===lg), A = T.map(teamAgg);
  const pa = T.map(t=>shotProfile(genShots(t,'against'))), pf = T.map(t=>shotProfile(genShots(t,'for')));
  const r = { xgfM:mean(A.map(a=>a.xgfM)), xgaM:mean(A.map(a=>a.xgaM)), ppda:mean(A.map(a=>a.ppda)), poss:50,
    spAg:mean(pa.map(p=>p.sp)), headAg:mean(pa.map(p=>p.head)), lateAg:mean(pa.map(p=>p.late)), ctAg:mean(pa.map(p=>p.counter)),
    spFor:mean(pf.map(p=>p.sp)), spxgfM:mean(A.map(a=>a.spxgf/a.n)), spxgaM:mean(A.map(a=>a.spxga/a.n)) };
  _lgAvg[lg]=r; return r;
}

/* ---------- ACWR (φορτίο) ---------- */
function isoDay(offset){ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-offset); return d.toISOString().slice(0,10); }
function loadSeries(p){
  const rg = makeRng(hashStr('load'+p.id)), prof = rg.r(), share = Math.min(1, p.min/1900), out=[];
  const type = prof<.12 ? 'spike' : prof<.2 ? 'return' : prof<.28 ? 'under' : 'normal';
  for(let i=0;i<42;i++){
    const off = 41-i, dow = i%7; let v;
    if(dow===6) v = share>.3 ? Math.round((500+450*share)*rg.u(.85,1.1)) : Math.round(rg.u(250,420));
    else if(dow===0) v = 0;
    else v = Math.round(rg.u(280,470));
    if(type==='spike' && i>=35) v = Math.round(v*1.65);
    if(type==='return' && i<24) v = Math.round(v*.25);
    if(type==='under' && i>=28) v = Math.round(v*.45);
    const add = (S.loads[p.id]||{})[isoDay(off)] || 0;
    out.push(v + add);
  }
  return out;
}
function acwr(p){
  const s = loadSeries(p), acute = sum(s.slice(-7)), chronic = sum(s.slice(-28))/4;
  const r = chronic>0 ? acute/chronic : 0;
  const st = r>1.5 ? ['Υψηλός κίνδυνος','r'] : r>1.3 ? ['Προσοχή','g'] : r<.8 ? ['Υποφόρτιση','b'] : ['Ασφαλής ζώνη','w'];
  return { s, acute, chronic, r, st };
}

/* ---------- Πλοήγηση ---------- */
const NAV = [
  ['home','🏠','Αρχική'],
  ['§','Πυλώνας 1 · Απόδοση'],
  ['team','📊','Απόδοση Ομάδας'], ['opp','🕵️','Ανάλυση Αντιπάλου'], ['match','📈','Ανάλυση Αγώνα'], ['logger','📝','Καταγραφή Αγώνα'], ['video','🎬','Βίντεο'],
  ['§','Τακτική & Σύστημα'],
  ['fit','🧩','Συστήματα & Fit'], ['fitcfg','🛠️','Προσαρμογή Fit'], ['bridge','🔗','Σύνδεση TACTIX'],
  ['§','Πυλώνας 2 · Scouting & Ρόστερ'],
  ['market','🔎','Αγορά (Market Overview)'], ['roles','🎯','Ανάλυση Ρόλων'], ['profile','👤','Προφίλ Παίκτη'], ['money','💎','Moneyball'], ['youth','🌱','Νέοι & Ανάπτυξη'],
  ['§','Διοίκηση & Οικονομικά'],
  ['squad','💰','Ρόστερ & Μπάτζετ'], ['contracts','✍️','Συμβόλαια'], ['scenarios','🧪','Σενάρια Μπάτζετ'], ['board','🏛️','Αναφορά Διοίκησης'],
  ['§','Εργαλεία'],
  ['tools','🧮','xG · Πρόβλεψη · Φορτίο'],
  ['§','Πυλώνες 3–4 · Καριέρα'],
  ['portfolio','📣','Πορτφόλιο & Προσέγγιση'], ['academy','🎓','Ακαδημία'],
  ['§','Σύστημα'],
  ['data','📥','Δεδομένα & Ρυθμίσεις']
];
const VIEWS = {};
let CUR = 'home', ARG = null;
function renderNav(){
  $('#nav').innerHTML = NAV.map(n => n[0]==='§' ? `<div class="nav-grp">${n[1]}</div>` : `<a data-go="${n[0]}" class="${n[0]===CUR?'on':''}" title="${esc(n[2])}"><span class="i">${n[1]}</span><span class="lbl">${n[2]}</span></a>`).join('');
}
function go(v, arg){ location.hash = v + (arg!=null ? '/'+encodeURIComponent(arg) : ''); }
function route(){
  const h = decodeURIComponent(location.hash.slice(1)); const [v, ...rest] = h.split('/');
  CUR = VIEWS[v] ? v : 'home'; ARG = rest.length ? rest.join('/') : null;
  renderNav();
  const item = NAV.find(n=>n[0]===CUR); $('#title').textContent = item ? item[2] : '';
  $('#srcPill').textContent = S.imported ? `Δεδομένα: ${S.imported.mode==='replace'?'':'demo + '}${S.imported.label} (${S.imported.players.length})` : 'Δεδομένα επίδειξης (φανταστικά)';
  $('#teamPill').textContent = '⚽ ' + S.settings.myTeam;
  toggleMenu(false);
  $$('#bottomNav a[data-go]').forEach(a=>a.classList.toggle('on', a.dataset.go===CUR));
  try{ VIEWS[CUR](ARG); }catch(e){ console.error(e); $('#view').innerHTML = `<div class="card"><h3>⚠ Σφάλμα</h3><pre class="code">${esc(e.stack||e)}</pre></div>`; }
  window.scrollTo(0,0);
}

/* Πλήρης οθόνη (κρύβει τις μπάρες του browser — ιδανικό σε κινητό/τάμπλετ οριζόντια) */
function toggleFullscreen(){
  const d = document, el = d.documentElement;
  if(d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else { const req = el.requestFullscreen || el.webkitRequestFullscreen; if(req) Promise.resolve(req.call(el)).catch(()=>toast('Η πλήρης οθόνη δεν υποστηρίζεται εδώ')); else toast('Πρόσθεσε την εφαρμογή στην αρχική οθόνη για πλήρη οθόνη'); }
}
/* Όταν γυρίζει η συσκευή: ξανασχεδιάζει την τρέχουσα σελίδα για το νέο μέγεθος, κρατώντας τη θέση κύλισης */
function initOrientation(){
  const land = () => matchMedia('(orientation: landscape)').matches;
  let lastN = narrow(), lastL = land(), t;
  const redraw = () => {
    const n = narrow(), l = land(); if(n===lastN && l===lastL) return;
    lastN = n; lastL = l; if($('#modalBg.open')) return;
    const ratio = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    try{ VIEWS[CUR](ARG); }catch(e){ console.error(e); }
    requestAnimationFrame(()=>scrollTo(0, ratio * (document.documentElement.scrollHeight - innerHeight)));
  };
  addEventListener('resize', ()=>{ clearTimeout(t); t = setTimeout(redraw, 220); });
  addEventListener('orientationchange', ()=>setTimeout(redraw, 300));
  const fs = $('#fsBtn'); if(fs && !(document.fullscreenEnabled || document.webkitFullscreenEnabled) ) fs.style.display='none';
  document.addEventListener('fullscreenchange', ()=>{ if(fs) fs.textContent = document.fullscreenElement ? '🗗' : '⛶'; });
}
function toggleMenu(force){
  const open = force===undefined ? !$('#side').classList.contains('open') : force;
  $('#side').classList.toggle('open', open); $('#backdrop').classList.toggle('show', open);
}
const IS_TOUCH = matchMedia('(hover: none)').matches;

/* ---------- Tooltip & delegation ---------- */
function initGlobal(){
  const tip = $('#tip');
  // Οθόνες αφής: άγγιγμα σε σημείο γραφήματος δείχνει το tooltip για λίγα δευτερόλεπτα
  document.addEventListener('touchstart', e=>{
    const t = e.target.closest('[data-tip]'); if(!t) { tip.style.display='none'; return; }
    const touch = e.touches[0]; tip.innerHTML = t.getAttribute('data-tip'); tip.style.display='block';
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = clamp(touch.clientX - w/2, 8, innerWidth-w-8)+'px';
    tip.style.top = Math.max(8, touch.clientY - h - 18)+'px';
    clearTimeout(tip._t); tip._t = setTimeout(()=>tip.style.display='none', 2800);
  }, { passive:true });
  if(!('serviceWorker' in navigator) || location.protocol==='file:') {} else navigator.serviceWorker.register('sw.js').catch(()=>{});
  document.addEventListener('mouseover', e=>{ const t=e.target.closest('[data-tip]'); if(t){ tip.innerHTML=t.getAttribute('data-tip'); tip.style.display='block'; } });
  document.addEventListener('mousemove', e=>{ if(tip.style.display==='block'){ const w=tip.offsetWidth; tip.style.left=Math.min(innerWidth-w-8, e.clientX+14)+'px'; tip.style.top=(e.clientY+14)+'px'; } });
  document.addEventListener('mouseout', e=>{ if(e.target.closest('[data-tip]')) tip.style.display='none'; });
  document.addEventListener('click', e=>{
    const g = e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(g.dataset.go, g.dataset.arg); return; }
    const p = e.target.closest('[data-pid]'); if(p && !e.target.closest('button,input,select')){ go('profile', p.dataset.pid); return; }
    const st = e.target.closest('[data-star]'); if(st){ toggleShort(+st.dataset.star); st.textContent = inShort(+st.dataset.star)?'★':'☆'; }
  });
  window.addEventListener('hashchange', route);
}
function inShort(id){ return S.shortlist.some(s=>s.id===id); }
function toggleShort(id){
  const p = PBY[id]; if(!p) return;
  if(inShort(id)) S.shortlist = S.shortlist.filter(s=>s.id!==id);
  else S.shortlist.push({ id, fee: p.team===S.settings.myTeam?0:Math.round((p.value||0)*1.1/10)*10, wage: Math.round(p._expWage||p.wage||0), years:4 });
  save(); toast(inShort(id) ? `⭐ ${p.name} στη λίστα μεταγραφών` : 'Αφαιρέθηκε από τη λίστα');
}
const star = p => `<button class="btn sm" data-star="${p.id}" title="Λίστα μεταγραφών">${inShort(p.id)?'★':'☆'}</button>`;
const plink = p => `<a data-pid="${p.id}" style="cursor:pointer;color:#fff;font-weight:600;text-decoration:none">${esc(p.name)}</a>`;
function myTeamPlayers(){ return PL.filter(p=>p.team===S.settings.myTeam); }
function teamList(){ return [...new Set(PL.map(p=>p.team))].sort((a,b)=>a.localeCompare(b,'el')); }
function demoTeamOpts(cur){
  return ['L1','L2'].map(lg=>`<optgroup label="${esc(LEAGUES[lg].name)}">${opts(DB.teams.filter(t=>t.league===lg).map(t=>t.name), cur)}</optgroup>`).join('');
}

/* ======================= ΑΡΧΙΚΗ ======================= */
VIEWS.home = function(){
  const my = DB.teamByName[S.settings.myTeam], A = teamAgg(my), opp = DB.teamByName[S.settings.nextOpp];
  const sq = myTeamPlayers();
  const expiring = sq.filter(p=>p.contract<=2027).sort((a,b)=>b._score-a._score);
  const risk = sq.filter(p=>p.pos!=='GK').map(p=>({p,a:acwr(p)})).filter(x=>x.a.r>1.5);
  const over = sq.filter(p=>p._vfm!=null && p._vfm<.65).sort((a,b)=>a._vfm-b._vfm).slice(0,3);
  const value = sq.filter(p=>p._vfm!=null && p._vfm>1.35 && qualified(p)).sort((a,b)=>b._vfm-a._vfm).slice(0,3);
  let html = backupBanner() + `<div class="card hero"><div class="row" style="align-items:flex-start">
    <div style="flex:1;min-width:260px"><h2 style="margin:0 0 6px">Ο προπονητής-αναλυτής που θέλουν οι ομάδες</h2>
    <div class="muted">Data analytics, διαχείριση μπάτζετ και στρατηγική σε ένα εργαλείο. Μετατρέπει τα raw δεδομένα σε αποφάσεις: αναφορές αντιπάλου, scouting με αριθμούς, value-for-money και πορτφόλιο που ανοίγει πόρτες.</div></div>
    <div class="row"><button class="btn pri" data-go="opp">🕵️ Report επόμενου αντιπάλου</button><button class="btn" data-go="data">📥 Φόρτωσε δικά σου δεδομένα</button></div></div>
    <div class="pillars" style="margin-top:14px">
      <div class="pillar" data-go="team"><div class="n">1</div><b>Ανάλυση Απόδοσης & Scouting</b><div class="small muted">xG, xA, PPDA, προωθητικές, heatmaps, report αντιπάλου</div></div>
      <div class="pillar" data-go="squad"><div class="n">2</div><b>Οικονομικό Scouting & Ρόστερ</b><div class="small muted">Value-for-money, Moneyball, μπάτζετ, αποσβέσεις</div></div>
      <div class="pillar" data-go="portfolio"><div class="n">3</div><b>Ψηφιακό Πορτφόλιο</b><div class="small muted">Γραφήματα PNG + έτοιμα posts LinkedIn / X</div></div>
      <div class="pillar" data-go="portfolio" data-arg="pitch"><div class="n">4</div><b>Στοχευμένη Προσέγγιση</b><div class="small muted">Μήνυμα προς ομάδα με δικά της δεδομένα</div></div>
    </div></div>`;
  if(A){
    const rk = rankOf(my), lgN = DB.teams.filter(t=>t.league===my.league).length, la = leagueAvg(my.league);
    html += `<div class="grid g5" style="margin-top:14px">
      ${kpi('Θέση βαθμολογίας', `${rk}η / ${lgN}`, `${A.w}Ν-${A.d}Ι-${A.l}Η`)}
      ${kpi('Βαθμοί vs xPoints', `${A.pts} <span class="muted" style="font-size:15px">/ ${A.xpts.toFixed(1)}</span>`, A.pts-A.xpts>=0?`+${(A.pts-A.xpts).toFixed(1)} πάνω από την απόδοση`:`${(A.pts-A.xpts).toFixed(1)} «άτυχοι»`)}
      ${kpi('xG υπέρ / αγώνα', A.xgfM.toFixed(2), `Μ.Ο. λίγκας ${la.xgfM.toFixed(2)}`)}
      ${kpi('xG κατά / αγώνα', A.xgaM.toFixed(2), `Μ.Ο. λίγκας ${la.xgaM.toFixed(2)}`)}
      ${kpi('PPDA (πίεση)', A.ppda.toFixed(1), A.ppda<la.ppda?'Πιο έντονη πίεση από τον Μ.Ο.':'Πιο χαμηλό μπλοκ από τον Μ.Ο.')}
    </div>`;
  }
  html += `<div class="grid g3" style="margin-top:14px">`;
  if(opp){
    const f = oppFindings(opp).filter(x=>x.k==='weak').slice(0,3), oa=teamAgg(opp);
    html += `<div class="card"><h3>🕵️ Επόμενος αντίπαλος<span class="sp"></span><span class="tag r">${esc(opp.style)}</span></h3>
      <div style="font-size:18px;font-weight:700">${esc(opp.name)}</div>
      <div class="muted small">${rankOf(opp)}η θέση · ${oa.pts} β. · xG ${oa.xgfM.toFixed(2)} / xGA ${oa.xgaM.toFixed(2)} · ${opp.formation}</div><hr>
      <div class="small muted" style="margin-bottom:6px">Αδύναμα σημεία (από τα δεδομένα):</div>
      ${f.map(x=>`<div class="find weak"><span class="ic">🎯</span><div><b>${esc(x.t)}</b><span class="small muted">${esc(x.d)}</span></div></div>`).join('')||'<div class="muted small">Δεν εντοπίστηκαν έντονες αδυναμίες.</div>'}
      <button class="btn pri" data-go="opp" style="margin-top:6px">Πλήρες 2σέλιδο report →</button></div>`;
  }
  html += `<div class="card"><h3>🔔 Ειδοποιήσεις ρόστερ</h3>
    <div class="small muted">Λήξη συμβολαίου Ιούνιο 2027 (${expiring.length})</div>
    <div style="margin:4px 0 10px">${expiring.slice(0,6).map(p=>`<span class="tag ${p._score>60?'r':''}" style="margin:2px">${plink(p)} · ${Math.round(p._score)}</span>`).join(' ')||'–'}</div>
    <div class="small muted">Κίνδυνος τραυματισμού (ACWR &gt; 1,5)</div>
    <div style="margin:4px 0 10px">${risk.map(x=>`<span class="tag r" style="margin:2px">${plink(x.p)} · ${x.a.r.toFixed(2)}</span>`).join(' ')||'<span class="muted small">Κανένας</span>'}</div>
    <div class="small muted">Υπερπληρωμένοι (μισθός vs απόδοση)</div>
    <div style="margin:4px 0 10px">${over.map(p=>`<span class="tag" style="margin:2px">${plink(p)} · ${Math.round(p.wage)}k vs ${Math.round(p._expWage)}k</span>`).join(' ')||'–'}</div>
    <div class="small muted">Καλύτερο value-for-money</div>
    <div style="margin-top:4px">${value.map(p=>`<span class="tag g" style="margin:2px">${plink(p)} · ×${p._vfm.toFixed(1)}</span>`).join(' ')||'–'}</div>
    <button class="btn" data-go="squad" style="margin-top:10px">Ρόστερ & Μπάτζετ →</button></div>`;
  if(my){
    const tbl = leagueTable(my.league);
    html += `<div class="card"><h3>🏆 Βαθμολογία & xPoints</h3><div class="tbl-wrap" style="max-height:380px"><table class="t"><tr><th>#</th><th class="l">Ομάδα</th><th>Β</th><th>xPts</th><th>Δ</th></tr>
      ${tbl.map(r=>`<tr class="${r.t.name===S.settings.myTeam?'me':''}"><td>${r.rank}</td><td class="l">${esc(r.t.name)}</td><td><b>${r.a.pts}</b></td><td>${r.a.xpts.toFixed(1)}</td><td style="color:${r.a.pts-r.a.xpts>=0?'#fff':'var(--red2)'}">${(r.a.pts-r.a.xpts>=0?'+':'')+(r.a.pts-r.a.xpts).toFixed(1)}</td></tr>`).join('')}
      </table></div><div class="small muted" style="margin-top:6px">Δ &gt; 0: περισσότεροι βαθμοί από όσους «δικαιολογεί» το xG (τύχη/φινίρισμα) — πιθανή πτώση στο μέλλον.</div></div>`;
  }
  html += `</div><div class="card" style="margin-top:14px"><h3>✨ Επιπλέον εργαλεία που προσθέσαμε</h3><div class="grid g4">
    ${IDEAS.map(i=>`<div class="pillar" data-go="${i[3]}"><div style="font-size:22px">${i[0]}</div><b>${esc(i[1])}</b><div class="small muted">${esc(i[2])}</div></div>`).join('')}</div></div>`;
  $('#view').innerHTML = html;
};
function kpi(l,v,d){ return `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d||''}</div></div>`; }

/* ======================= ΔΕΔΟΜΕΝΑ & ΡΥΘΜΙΣΕΙΣ ======================= */
function normName(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9α-ω ]/g,'').replace(/\s+/g,' ').trim(); }
function parseCSV(text){
  text = text.replace(/^﻿/,'');
  const first = text.split(/\r?\n/).find(l=>l.trim()) || '';
  const delim = (first.match(/;/g)||[]).length > (first.match(/,/g)||[]).length ? ';' : (first.match(/\t/g)||[]).length > (first.match(/,/g)||[]).length ? '\t' : ',';
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else if(c==='"') q=true;
    else if(c===delim){ row.push(cur); cur=''; }
    else if(c==='\n' || c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(cur); if(row.some(x=>x.trim()!=='')) rows.push(row); row=[]; cur=''; }
    else cur+=c;
  }
  row.push(cur); if(row.some(x=>x.trim()!=='')) rows.push(row);
  return { rows, delim };
}
const ALIAS = {
  name:['player','παίκτης','παικτης','name','όνομα','ονομα'], team:['squad','team','ομάδα','ομαδα','club'], pos:['pos','position','θέση','θεση'], age:['age','ηλικία','ηλικια'],
  min:['min','minutes','λεπτά','λεπτα','mins'], goals:['gls','goals','γκολ'], ast:['ast','assists','ασίστ','ασιστ'], npxg:['npxg'], xa:['xag','xa','xast'],
  shots:['sh','shots','σουτ'], sot:['sot'], kp:['kp','key passes'], progP:['prgp','progressive passes','progp'], progC:['prgc','progressive carries','progc'],
  crosses:['crspa','crosses into penalty area','crosses'], tkl:['tkl','tackles'], int:['int','interceptions'], recov:['recov','recoveries'], clear:['clr','clearances','clear'],
  aerW:['won','aerial won','aerw'], aerL:['lost','aerial lost','aerl'], aerT:['aert'], dduelW:['dduelw','tklw'], dduelT:['dduelt'], drbS:['succ','drbs'], drbA:['drba'],
  touchBox:['att pen','touchbox'], lineBreak:['linebreak'], pressures:['press','pressures'], passCmp:['cmp','passcmp'], passAtt:['att','passatt'], passPctRaw:['cmp%','pass%'],
  f3Cmp:['f3cmp'], f3Att:['f3att'], value:['value','αξία','αξια','market value','marketvalue'], wage:['wage','μισθός','μισθος','salary'], contract:['contract','λήξη','ληξη','expires','contract end'],
  savePct:['save%','savepct'], psxgd:['psxg+/-','psxgd']
};
function mapHeaders(hdr){
  const map = {}, h = hdr.map(x=>String(x).trim().toLowerCase());
  for(const f in ALIAS){ const i = h.findIndex(x=>ALIAS[f].includes(x)); if(i>=0) map[f]=i; }
  return map;
}
function mapPos(s){
  s = String(s||'').toUpperCase().trim();
  if(POS_L[s]) return s;
  const gr = { 'ΤΦ':'GK','ΚΑ':'CB','ΠΑ':'FB','ΑΜ':'DM','ΚΜ':'CM','ΟΜ':'AM','ΕΞ':'W','ΦΟΡ':'ST' }; if(gr[s]) return gr[s];
  const t = s.split(/[,\/ ]+/);
  if(t[0]==='GK') return 'GK';
  if(/WB|FB|LB|RB/.test(s)) return 'FB';
  if(t[0]==='DF') return t[1]==='MF' ? 'FB' : 'CB';
  if(t[0]==='MF') return t[1]==='FW' ? 'AM' : t[1]==='DF' ? 'DM' : 'CM';
  if(t[0]==='FW') return t[1]==='MF' ? 'W' : 'ST';
  return 'CM';
}
function csvToPlayers(text, lgId){
  const { rows, delim } = parseCSV(text);
  let hi = rows.findIndex(r=>r.some(c=>ALIAS.name.includes(String(c).trim().toLowerCase())));
  if(hi<0) throw new Error('Δεν βρέθηκε στήλη «Player / Παίκτης».');
  const map = mapHeaders(rows[hi]);
  const num = v => { if(v==null) return 0; let s=String(v).trim().replace(/[€%\s]/g,''); if(delim===';') s=s.replace(/\./g,'').replace(',', '.'); else s=s.replace(/,/g,''); const n=parseFloat(s); return isFinite(n)?n:0; };
  const out = []; let id = 100000 + Math.floor(Math.random()*1000)*1000;
  for(const r of rows.slice(hi+1)){
    const name = String(r[map.name]||'').trim(); if(!name || ALIAS.name.includes(name.toLowerCase())) continue;
    const p = { id:id++, name, team:String(r[map.team]||'—').trim(), pos:mapPos(r[map.pos]), age:parseInt(String(r[map.age]||'25'))||25, league:lgId, imported:true };
    for(const f of Object.keys(ALIAS)) if(!['name','team','pos','age'].includes(f)) p[f] = map[f]!=null ? num(r[map[f]]) : 0;
    if(!p.aerT && (p.aerW||p.aerL)) p.aerT = p.aerW + p.aerL;
    if(!p.passAtt && p.passPctRaw){ p.passAtt=100; p.passCmp=p.passPctRaw; }
    if(p.value>20000) p.value = Math.round(p.value/1000);
    if(p.wage>20000) p.wage = Math.round(p.wage/1000);
    if(p.contract>3000) p.contract = parseInt(String(p.contract).slice(0,4));
    if(!p.contract) p.contract = 0;
    out.push(p);
  }
  return { players: out, map };
}
VIEWS.data = function(){
  const st = S.settings;
  $('#view').innerHTML = `<div class="grid g2">
  <div class="card"><h3>⚙️ Ρυθμίσεις</h3><div class="grid g2">
    <label class="f">Η ομάδα μου<select id="sMy">${opts(teamList(), st.myTeam)}</select></label>
    <label class="f">Επόμενος αντίπαλος (report)<select id="sOpp">${demoTeamOpts(st.nextOpp)}</select></label>
    <label class="f">Ελάχιστα λεπτά για δείγμα (φίλτρο θορύβου)<input type="number" id="sMin" value="${st.minMin}" step="90" min="0"></label>
    <label class="f">Όνομά σου (υπογραφή σε PNG/posts)<input type="text" id="sAuth" value="${esc(st.author)}" placeholder="π.χ. Γ. Παπαδόπουλος · Football Data Analyst"></label>
  </div><div class="row end" style="margin-top:12px"><button class="btn pri" id="sSave">Αποθήκευση</button></div>
  <div class="small muted" style="margin-top:8px">Τα 450′ (5 γεμάτα 90λεπτα) είναι το σύνηθες κατώφλι ώστε παίκτες με ελάχιστο χρόνο να μην αλλοιώνουν τα per-90.</div></div>

  <div class="card"><h3>💾 Αντίγραφα & επαναφορά</h3>
    <div class="row"><button class="btn" id="bExp">⬇ Backup (JSON)</button><label class="btn">⬆ Επαναφορά backup<input type="file" id="bImp" accept=".json" hidden></label>
    <button class="btn" id="bCsv">⬇ Όλοι οι παίκτες (CSV)</button><button class="btn" id="bTpl">⬇ Πρότυπο CSV</button></div><hr>
    <div class="row"><button class="btn" id="bDelImp" ${S.imported?'':'disabled'}>🗑 Αφαίρεση εισαγόμενων</button><button class="btn" id="bReset">↺ Πλήρης επαναφορά</button></div>
    <div class="small muted" style="margin-top:8px">Όλα αποθηκεύονται τοπικά στον browser (localStorage). Τίποτα δεν ανεβαίνει σε server.</div></div>

  <div class="card span2"><h3>📥 Εισαγωγή στατιστικών παικτών (FBref / Excel / Power BI / δικό σου CSV)</h3>
    <div class="sub">FBref: σε κάθε πίνακα «Share & Export → Get table as CSV» → αντιγραφή → επικόλληση εδώ. Αναγνωρίζονται αυτόματα οι στήλες: Player, Squad, Pos, Age, Min, Gls, Ast, npxG, xAG, Sh, SoT, KP, PrgP, PrgC, CrsPA, Tkl, Int, Recov, Clr, Won/Lost, Cmp/Att, Cmp%… και Value/Wage/Contract.</div>
    <div class="grid g2"><div>
      <div class="drop" id="drop">Σύρε εδώ αρχείο CSV ή <u>κάνε κλικ</u><input type="file" id="fCsv" accept=".csv,.txt,.tsv" hidden></div>
      <textarea id="csvTxt" rows="7" placeholder="…ή επικόλλησε εδώ το CSV" style="margin-top:10px"></textarea>
    </div><div>
      <label class="f">Όνομα διοργάνωσης/συνόλου<input type="text" id="impLbl" value="Super League 25/26 (FBref)"></label>
      <label class="f" style="margin-top:8px">Τρόπος<select id="impMode">${opts([['append','Προσθήκη στα demo δεδομένα'],['replace','Αντικατάσταση (μόνο τα δικά μου)']], 'append')}</select></label>
      <div class="row" style="margin-top:12px"><button class="btn" id="impPrev">👁 Προεπισκόπηση</button><button class="btn pri" id="impGo">Εισαγωγή</button></div>
      <div id="impOut" class="small" style="margin-top:10px"></div>
    </div></div>
    <div class="small muted" style="margin-top:8px">💡 Αν συνδυάσεις πίνακες (Standard + Passing + Defense), ένωσέ τους πρώτα στο Excel/Power Query ή με το script soccerdata (δες Ακαδημία → Κώδικας).</div></div>

  <div class="card"><h3>💶 Συγχώνευση Transfermarkt (αξία · μισθός · συμβόλαιο)</h3>
    <div class="sub">CSV με στήλες: Player, Value (χιλ.€ ή €), Wage (χιλ.€/έτος), Contract (έτος λήξης). Συνδέεται με βάση το όνομα.</div>
    <textarea id="tmTxt" rows="5" placeholder="Player;Value;Wage;Contract&#10;Γιώργος Παπαδόπουλος;450;60;2028"></textarea>
    <div class="row end" style="margin-top:8px"><span class="small muted" id="tmOut"></span><button class="btn pri" id="tmGo">Συγχώνευση</button></div></div>

  <div class="card"><h3>🌐 Πηγές για να κατεβάσεις δεδομένα</h3>
    ${SOURCES.slice(0,5).map(s=>`<div style="margin-bottom:8px"><a href="${s.url}" target="_blank" rel="noopener">${esc(s.n)}</a> <span class="tag">${esc(s.tag)}</span></div>`).join('')}
    <button class="btn" data-go="academy" style="margin-top:6px">Όλες οι πηγές & κώδικας →</button></div>
  </div>`;

  on('#sSave','click',()=>{ st.myTeam=$('#sMy').value; st.nextOpp=$('#sOpp').value; st.minMin=Math.max(0,+$('#sMin').value||0); st.author=$('#sAuth').value.trim(); save(); rebuild(); toast('Αποθηκεύτηκε ✔'); route(); });
  on('#bExp','click',doBackup);
  on('#bImp','change',e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const o=JSON.parse(t); Object.keys(S).forEach(k=>delete S[k]); Object.assign(S, JSON.parse(JSON.stringify(DEF_STATE)), o); save(); rebuild(); toast('Επαναφέρθηκε ✔'); route(); }catch(err){ toast('Μη έγκυρο αρχείο'); } }); });
  on('#bCsv','click',()=>exportPlayersCSV(PL,'players_all.csv'));
  on('#bTpl','click',()=>download('datacoach360_template.csv', '﻿Player;Squad;Pos;Age;Min;Gls;Ast;npxG;xAG;Sh;SoT;KP;PrgP;PrgC;CrsPA;Tkl;Int;Recov;Clr;AerW;AerT;dDuelW;dDuelT;Succ;DrbA;Att Pen;LineBreak;Press;Cmp;Att;F3Cmp;F3Att;Value;Wage;Contract\nΓιώργος Παπαδόπουλος;Ομάδα Χ;CM;24;1850;3;5;2,1;4,3;25;9;38;110;45;6;40;22;120;15;18;35;60;110;22;40;35;60;400;1500;1750;300;420;450;60;2028\n','text/csv'));
  on('#bDelImp','click',()=>{ if(!confirm('Αφαίρεση των εισαγόμενων παικτών;')) return; S.imported=null; save(); rebuild(); route(); });
  on('#bReset','click',()=>{ if(!confirm('Πλήρης επαναφορά; Χάνονται ρυθμίσεις, λίστες, εισαγωγές.')) return; localStorage.removeItem(LS_KEY); location.hash=''; location.reload(); });
  const drop=$('#drop'), fin=$('#fCsv');
  on(drop,'click',()=>fin.click());
  on(drop,'dragover',e=>{ e.preventDefault(); drop.classList.add('over'); });
  on(drop,'dragleave',()=>drop.classList.remove('over'));
  on(drop,'drop',e=>{ e.preventDefault(); drop.classList.remove('over'); const f=e.dataTransfer.files[0]; if(f) f.text().then(t=>{ $('#csvTxt').value=t; preview(); }); });
  on(fin,'change',()=>{ const f=fin.files[0]; if(f) f.text().then(t=>{ $('#csvTxt').value=t; preview(); }); });
  function preview(){
    try{ const { players, map } = csvToPlayers($('#csvTxt').value, 'IMP');
      const found = Object.keys(map), missing = ['min','npxg','xa','kp','progP','tkl','int'].filter(k=>!(k in map));
      $('#impOut').innerHTML = `<b>${players.length}</b> παίκτες · αναγνωρισμένες στήλες: ${found.map(f=>`<span class="tag b">${f}</span>`).join(' ')}${missing.length?`<div class="muted" style="margin-top:6px">Χωρίς: ${missing.join(', ')} (θα μετρούν 0)</div>`:''}`;
      return players;
    }catch(e){ $('#impOut').innerHTML = `<span style="color:var(--red2)">${esc(e.message)}</span>`; return null; }
  }
  on('#impPrev','click',preview);
  on('#impGo','click',()=>{
    const players = preview(); if(!players || !players.length) return;
    S.imported = { mode:$('#impMode').value, league:'IMP', label:$('#impLbl').value.trim()||'Εισαγωγή', players };
    if(S.imported.mode==='replace' && !players.some(p=>p.team===st.myTeam)) st.myTeam = players[0].team;
    save(); rebuild(); toast(`Εισήχθησαν ${players.length} παίκτες ✔`); go('market');
  });
  on('#tmGo','click',()=>{
    const { rows } = parseCSV($('#tmTxt').value); if(rows.length<2){ toast('Κενό CSV'); return; }
    const h = rows[0].map(x=>x.trim().toLowerCase()), ix = f=>h.findIndex(x=>ALIAS[f].includes(x));
    const iN=ix('name'), iV=ix('value'), iW=ix('wage'), iC=ix('contract'); let n=0, hit=0;
    const names = new Set(PL.map(p=>normName(p.name)));
    const nm = v=>{ const x=parseFloat(String(v||'').replace(/[^\d.,]/g,'').replace(',','.')); return isFinite(x)?(x>20000?Math.round(x/1000):x):0; };
    for(const r of rows.slice(1)){ if(iN<0||!r[iN]) continue; const k=normName(r[iN]); S.tm[k]={ value:iV>=0?nm(r[iV]):0, wage:iW>=0?nm(r[iW]):0, contract:iC>=0?parseInt(r[iC])||0:0 }; n++; if(names.has(k)) hit++; }
    save(); rebuild(); $('#tmOut').textContent = `${n} εγγραφές · ${hit} ταυτίστηκαν με παίκτες`; toast('Συγχωνεύτηκε ✔');
  });
};
function exportPlayersCSV(list, name){
  const cols = ['name','team','league','pos','age','min','goals','ast','npxg','xa','shots','sot','kp','progP','progC','crosses','tkl','int','recov','clear','aerW','aerT','dduelW','dduelT','drbS','drbA','touchBox','lineBreak','pressures','passCmp','passAtt','f3Cmp','f3Att','value','wage','contract'];
  const extra = ['score','exp_wage','vfm','exp_value','scout_status','scout_rating','scout_notes'];
  const lines = [cols.concat(extra).join(';')];
  for(const p of list) lines.push(cols.map(c=>{ const v=p[c]; return typeof v==='number' ? String(v).replace('.',',') : `"${String(v??'').replace(/"/g,'""')}"`; })
    .concat([p._score, p._expWage, p._vfm, p._expVal].map(v=>v==null?'':(+v).toFixed(2).replace('.',','))).concat(scoutCsv(p)).join(';'));
  download(name, '﻿'+lines.join('\n'), 'text/csv');
}

/* ---------- Εκκίνηση ---------- */
function boot(){
  buildDemoDB();
  rebuild();
  if(!teamList().includes(S.settings.myTeam)) S.settings.myTeam = teamList()[0];
  if(!DB.teamByName[S.settings.nextOpp]) S.settings.nextOpp = DB.teams.find(t=>t.name!==S.settings.myTeam).name;
  initGlobal();
  initOrientation();
  route();
  if(!S.onboarded) setTimeout(showOnboarding, 350);
}
