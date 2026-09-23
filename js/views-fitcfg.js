'use strict';
/* ===== Προσαρμογή Fit: ρόλοι · συστήματα · βαρύτητες =====
   Οι αλλαγές του χρήστη αποθηκεύονται στο S.cfg και εφαρμόζονται πάνω στις προεπιλογές (views-systems.js). */
const DEF_ARCH = JSON.parse(JSON.stringify(ARCH));
const DEF_SYSTEMS = JSON.parse(JSON.stringify(SYSTEMS));
const TX_CODES = ['SK','BPK','GK','BPD','CD','STP','COV','FB','WB','IWB','IFB','NFB','DLP','ANC','BWM','REG','B2B','CM','MEZ','CAR','AP','SS','ENG','TRE','W','IW','IF','WM','RAU','AF','PF','TM','DLF','POA','CF','F9'];
const TAG_ALL = { ...TAG_L, bait:'Δόλωμα πίεσης' };
function cfg(){ S.cfg ||= {}; S.cfg.arch ||= {}; S.cfg.sys ||= {}; S.cfg.extraSys ||= []; if(S.cfg.mix==null) S.cfg.mix = .65; return S.cfg; }
function fitMix(){ return S.cfg && S.cfg.mix!=null ? S.cfg.mix : .65; }
function applyCfg(){
  const c = cfg();
  for(const k of Object.keys(ARCH)) delete ARCH[k];
  Object.assign(ARCH, JSON.parse(JSON.stringify(DEF_ARCH)));
  for(const [k,v] of Object.entries(c.arch)) ARCH[k] = JSON.parse(JSON.stringify(v));
  SYSTEMS.length = 0;
  DEF_SYSTEMS.concat(c.extraSys).forEach(s=>SYSTEMS.push(JSON.parse(JSON.stringify(s))));
  for(const s of SYSTEMS){ const o = c.sys[s.id]; if(!o) continue; if(o.t) s.t = Object.assign({}, s.t, o.t); if(o.a) s.a = o.a.slice(); }
  // ρόλος που διαγράφηκε → προεπιλογή της θέσης
  for(const s of SYSTEMS) s.a = s.a.map((a,i)=>ARCH[a] ? a : SLOT_DEFAULT_ARCH[TX_FORM[s.f][i][0]]);
  for(const k of Object.keys(SYS)) delete SYS[k];
  SYSTEMS.forEach(s=>SYS[s.id]=s);
  _fitKey = '';
}
function sysModified(id){ const c=cfg(); return !!c.sys[id] || c.extraSys.some(s=>s.id===id); }
function archModified(k){ return !!cfg().arch[k]; }
function saveCfg(){ save(); applyCfg(); }

const FC = { tab:'sys', sys:null, arch:'IWB' };
VIEWS.fitcfg = function(arg){
  if(arg && SYS[arg]){ FC.sys = arg; FC.tab = 'sys'; }
  if(arg && ARCH[arg]){ FC.arch = arg; FC.tab = 'arch'; }
  FC.sys = SYS[FC.sys] ? FC.sys : (SYS[FV.sys] ? FV.sys : 'my-hybrid');
  if(!ARCH[FC.arch]) FC.arch = 'IWB';
  $('#view').innerHTML = `<div class="card hero"><h3>🛠️ Προσαρμογή Fit — τα κριτήρια είναι δικά σου</h3><div class="small muted">Άλλαξε το προφίλ κάθε συστήματος, τον ρόλο σε κάθε θέση και τη «συνταγή» μετρικών κάθε ρόλου — ή φτιάξε δικά σου συστήματα και ρόλους. Όλα αποθηκεύονται τοπικά, επαναφέρονται με ένα κλικ και μοιράζονται ως αρχείο. Τα δικά σου συστήματα περνούν και στο TACTIX ως νέες τακτικές.</div></div>
    <div class="tabs" style="margin-top:14px">${[['sys','🧩 Συστήματα'],['arch','🧪 Ρόλοι (συνταγές μετρικών)'],['share','💾 Βαρύτητες & κοινή χρήση']].map(([k,l])=>`<button class="${FC.tab===k?'on':''}" data-ft="${k}">${l}</button>`).join('')}</div><div id="fcBox"></div>`;
  $$('[data-ft]').forEach(b=>b.onclick=()=>{ FC.tab = b.dataset.ft; VIEWS.fitcfg(); });
  ({ sys:fcSystems, arch:fcRoles, share:fcShare })[FC.tab]();
};

function fcSystems(){
  const s = SYS[FC.sys], c = cfg(), custom = c.extraSys.some(x=>x.id===s.id);
  const sq = myTeamPlayers(), xi = bestXI(s, sq);
  const opp = DB.teamByName[S.settings.nextOpp], mu = opp ? matchup(s, oppFlags(opp)) : null;
  const archOpts = Object.entries(ARCH).map(([k,a])=>[k, `${a.l} (${a.tx})${archModified(k)?' ✏️':''}`]);
  $('#fcBox').innerHTML = `<div class="grid g32">
    <div class="card"><h3>🧩 Σύστημα<span class="sp"></span>${sysModified(s.id)?`<span class="tag g">${custom?'δικό μου':'τροποποιημένο'}</span>`:'<span class="tag">προεπιλογή</span>'}</h3>
      <div class="row"><label class="f" style="flex:1 1 260px">Επιλογή<select id="fcS">${opts(SYSTEMS.map(x=>[x.id,`${x.f} · ${x.n} — ${x.c}${sysModified(x.id)?' ✏️':''}`]), s.id)}</select></label></div>
      ${custom?`<div class="grid g2" style="margin-top:8px"><label class="f">Όνομα<input type="text" id="fcN" value="${esc(s.n)}"></label><label class="f">Προπονητής / πηγή<input type="text" id="fcC" value="${esc(s.c)}"></label></div>`:''}
      <h3 style="margin-top:14px">🎚️ Προφίλ παιχνιδιού (0–10)</h3>
      <div class="small muted" style="margin-bottom:6px">Χρησιμοποιείται στο ταίριασμα με τις αδυναμίες του αντιπάλου (π.χ. αντίπαλος ευάλωτος στις μεταβάσεις → κερδίζουν τα συστήματα με υψηλή «Μετάβαση»).</div>
      ${Object.entries(TAG_ALL).map(([k,l])=>`<div class="row" style="flex-wrap:nowrap;margin:4px 0"><span class="small" style="width:130px;flex:0 0 130px">${esc(l)}</span><input type="range" min="0" max="10" step="1" value="${Math.round((s.t[k]||0)*10)}" data-tag="${k}" style="flex:1"><b style="width:28px;text-align:right" id="tv_${k}">${Math.round((s.t[k]||0)*10)}</b></div>`).join('')}
      <h3 style="margin-top:14px">👥 Ρόλος σε κάθε θέση (${esc(s.f)})</h3>
      <table class="t"><tr><th>#</th><th class="l">Θέση</th><th class="l">Ρόλος</th><th class="l">Καλύτερος (fit)</th></tr>
      ${xi.slots.map((sl,i)=>`<tr><td>${i+1}</td><td class="l">${esc(sl.r)} <span class="small muted">${esc(TX_ROLE_NAMES[sl.r])}</span></td><td class="l"><select data-slot="${i}" style="max-width:230px">${opts(archOpts, sl.a)}</select> <a class="small" data-go="fitcfg" data-arg="${sl.a}" title="Επεξεργασία συνταγής" style="cursor:pointer">✎</a></td><td class="l small">${sl.p?`${esc(sl.p.name)} <b style="color:${fitCol(sl.fit)}">${Math.round(sl.fit)}</b>`:'—'}</td></tr>`).join('')}</table>
      <div class="row" style="margin-top:12px"><button class="btn" id="fcNew">＋ Νέο σύστημα</button>
        <label class="f" style="flex:0 0 auto">Σχηματισμός νέου<select id="fcF">${opts(Object.keys(TX_FORM), s.f)}</select></label>
        ${sysModified(s.id)&&!custom?'<button class="btn" id="fcReset">↺ Επαναφορά προεπιλογής</button>':''}${custom?'<button class="btn" id="fcDel">🗑 Διαγραφή</button>':''}</div>
      <div class="small muted" style="margin-top:6px">Το νέο σύστημα αντιγράφει ρόλους & προφίλ από το τρέχον (ή παίρνει τους προεπιλεγμένους ρόλους αν αλλάξεις σχηματισμό).</div></div>
    <div class="card"><h3>👁 Ζωντανή προεπισκόπηση — ${esc(S.settings.myTeam)}</h3>
      <div class="grid g2">${kpi('Fit 11άδας', `<span style="color:${fitCol(xi.avg)}">${Math.round(xi.avg)}%</span>`, `βάθος ${Math.round(xi.depth)}%`)}${mu?kpi('Matchup vs '+esc(opp.name), mu.score+'/100', mu.why[0]?esc(mu.why[0].txt):'ουδέτερο'):''}</div>
      <div style="max-width:420px;margin:10px auto 0">${xiPitch(xi,'fcP')}</div>
      <div class="row" style="margin-top:8px"><button class="btn" data-go="fit" data-arg="${s.id}">🧩 Άνοιγμα στο Fit</button><button class="btn" data-go="bridge">🔗 Στείλε στο TACTIX</button></div></div></div>`;
  const ensure = ()=>{ const c=cfg(); if(custom) return c.extraSys.find(x=>x.id===s.id); return (c.sys[s.id] ||= {}); };
  on('#fcS','change',e=>{ FC.sys = e.target.value; fcSystems(); });
  $$('[data-tag]').forEach(r=>{
    r.oninput = ()=>{ $('#tv_'+r.dataset.tag).textContent = r.value; };
    r.onchange = ()=>{ const o=ensure(); o.t = Object.assign({}, o.t||{}, { [r.dataset.tag]: +r.value/10 }); saveCfg(); fcSystems(); };
  });
  $$('[data-slot]').forEach(sel=>sel.onchange=()=>{ const o=ensure(); o.a = (o.a||s.a).slice(); o.a[+sel.dataset.slot] = sel.value; saveCfg(); fcSystems(); });
  on('#fcN','change',e=>{ ensure().n = e.target.value.trim()||'Σύστημα'; saveCfg(); });
  on('#fcC','change',e=>{ ensure().c = e.target.value.trim(); saveCfg(); });
  on('#fcReset','click',()=>{ if(!confirm('Επαναφορά του συστήματος στις προεπιλογές;')) return; delete cfg().sys[s.id]; saveCfg(); fcSystems(); });
  on('#fcDel','click',()=>{ if(!confirm('Διαγραφή του συστήματος;')) return; const c=cfg(); c.extraSys = c.extraSys.filter(x=>x.id!==s.id); FC.sys='my-hybrid'; saveCfg(); fcSystems(); });
  on('#fcNew','click',()=>{
    const f = $('#fcF').value, name = prompt('Όνομα νέου συστήματος:', 'Δικό μου '+f); if(!name) return;
    const a = f===s.f ? s.a.slice() : TX_FORM[f].map(([r])=>SLOT_DEFAULT_ARCH[r]);
    const ns = { id:'u_'+Date.now().toString(36), n:name, c:S.settings.author||'Ο προπονητής μου', f, a, t:Object.assign({}, s.t), custom:true };
    cfg().extraSys.push(ns); FC.sys = ns.id; saveCfg(); fcSystems(); toast('Δημιουργήθηκε ✔');
  });
}

function fcRoles(){
  const A = ARCH[FC.arch], used = SYSTEMS.filter(s=>s.a.includes(FC.arch)), custom = !DEF_ARCH[FC.arch];
  const slotR = used[0] ? TX_FORM[used[0].f][used[0].a.indexOf(FC.arch)][0] : (Object.entries(SLOT_DEFAULT_ARCH).find(([,a])=>a===FC.arch)?.[0] || 'ΚΜ');
  const top = PL.filter(qualified).map(p=>({ p, f:archFit(p,FC.arch,slotR) })).filter(x=>x.f>0).sort((a,b)=>b.f-a.f);
  const mine = top.filter(x=>x.p.team===S.settings.myTeam).slice(0,6);
  const keys = Object.keys(M).sort((a,b)=>(A.w[b]||0)-(A.w[a]||0));
  const POS = ['GK','CB','FB','DM','CM','AM','W','ST'];
  $('#fcBox').innerHTML = `<div class="grid g32">
    <div class="card"><h3>🧪 Ρόλος<span class="sp"></span>${archModified(FC.arch)?`<span class="tag g">${custom?'δικός μου':'τροποποιημένος'}</span>`:'<span class="tag">προεπιλογή</span>'}</h3>
      <div class="grid g2"><label class="f">Επιλογή<select id="faR2">${opts(Object.entries(ARCH).map(([k,a])=>[k,`${a.l} (${a.tx})${archModified(k)?' ✏️':''}`]), FC.arch)}</select></label>
        <label class="f">Όνομα<input type="text" id="faN" value="${esc(A.l)}"></label>
        <label class="f">Κωδικός ρόλου στο TACTIX<select id="faTx">${opts(TX_CODES, A.tx)}</select></label>
        <div class="small muted" style="align-self:end">Χρησιμοποιείται σε: ${used.map(s=>esc(s.f+' '+s.c.split(' ').slice(-1)[0])).join(', ')||'κανένα σύστημα ακόμα'}</div></div>
      <h3 style="margin-top:14px">⚖️ Συνταγή μετρικών (βάρος 0,5–5)</h3>
      <div class="small muted" style="margin-bottom:6px">Fit = σταθμισμένος μέσος όρος των εκατοστημορίων του παίκτη σε αυτές τις μετρικές × συντελεστής θέσης.</div>
      <table class="t">${Object.entries(A.w).sort((a,b)=>b[1]-a[1]).map(([k,w])=>`<tr><td class="l">${esc(M[k]?M[k].l:k)}</td><td style="width:170px"><input type="range" min="0.5" max="5" step="0.5" value="${w}" data-w="${k}" style="width:100%"></td><td style="width:40px"><b id="wv_${k}">${w}</b></td><td style="width:40px"><button class="btn sm" data-wdel="${k}" title="Αφαίρεση">✕</button></td></tr>`).join('')}</table>
      <div class="row" style="margin-top:8px"><select id="faAdd"><option value="">＋ Προσθήκη μετρικής…</option>${opts(keys.filter(k=>!A.w[k]).map(k=>[k,M[k].l]))}</select></div>
      <h3 style="margin-top:14px">📍 Ποιες θέσεις παικτών ταιριάζουν (0–1)</h3>
      <div class="small muted" style="margin-bottom:6px">Κενό = προεπιλογή της θέσης στο γήπεδο. Π.χ. για «Ανεστραμμένο μπακ» βάλε ΑΜ 0,9 αν δέχεσαι αμυντικό χαφ σε αυτόν τον ρόλο· 0 = αποκλείεται.</div>
      <div class="grid g4">${POS.map(ps=>`<label class="f">${POS_L[ps]} · ${esc(POS_FULL[ps])}<input type="number" min="0" max="1" step="0.05" data-e="${ps}" value="${A.elig&&A.elig[ps]!=null?A.elig[ps]:''}" placeholder="—"></label>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="faNew">＋ Νέος ρόλος από αυτόν</button>${archModified(FC.arch)&&!custom?'<button class="btn" id="faReset">↺ Επαναφορά προεπιλογής</button>':''}${custom?'<button class="btn" id="faDel">🗑 Διαγραφή</button>':''}</div></div>
    <div class="card"><h3>👁 Ποιοι ταιριάζουν τώρα (θέση ${esc(slotR)})</h3>
      <div class="small muted">Από την ομάδα μου</div>
      <table class="t">${mine.map(x=>`<tr><td class="l">${plink(x.p)} <span class="small muted">${POS_L[x.p.pos]}</span></td><td><b style="color:${fitCol(x.f)}">${Math.round(x.f)}</b></td></tr>`).join('')||'<tr><td class="muted">—</td></tr>'}</table>
      <div class="small muted" style="margin-top:10px">Όλη η αγορά</div>
      <table class="t">${top.slice(0,10).map(x=>`<tr><td class="l">${plink(x.p)}<div class="small muted">${esc(x.p.team)} · ${x.p.value||'–'}k€</div></td><td><b style="color:${fitCol(x.f)}">${Math.round(x.f)}</b></td><td>${star(x.p)}</td></tr>`).join('')}</table></div></div>`;
  const ensure = ()=>{ const c=cfg(); return (c.arch[FC.arch] ||= JSON.parse(JSON.stringify(ARCH[FC.arch]))); };
  on('#faR2','change',e=>{ FC.arch = e.target.value; fcRoles(); });
  on('#faN','change',e=>{ ensure().l = e.target.value.trim()||FC.arch; saveCfg(); fcRoles(); });
  on('#faTx','change',e=>{ ensure().tx = e.target.value; saveCfg(); fcRoles(); });
  $$('[data-w]').forEach(i=>{ i.oninput=()=>{ $('#wv_'+i.dataset.w).textContent=i.value; }; i.onchange=()=>{ ensure().w[i.dataset.w]=+i.value; saveCfg(); fcRoles(); }; });
  $$('[data-wdel]').forEach(b=>b.onclick=()=>{ const o=ensure(); if(Object.keys(o.w).length<=1){ toast('Χρειάζεται τουλάχιστον μία μετρική'); return; } delete o.w[b.dataset.wdel]; saveCfg(); fcRoles(); });
  on('#faAdd','change',e=>{ if(!e.target.value) return; ensure().w[e.target.value]=2; saveCfg(); fcRoles(); });
  $$('[data-e]').forEach(i=>i.onchange=()=>{ const o=ensure(); o.elig ||= {}; if(i.value==='') delete o.elig[i.dataset.e]; else o.elig[i.dataset.e] = clamp(+i.value,0,1); saveCfg(); fcRoles(); });
  on('#faReset','click',()=>{ if(!confirm('Επαναφορά του ρόλου στην προεπιλογή;')) return; delete cfg().arch[FC.arch]; saveCfg(); fcRoles(); });
  on('#faDel','click',()=>{ if(!confirm(used.length?'Ο ρόλος χρησιμοποιείται — οι θέσεις του θα πάρουν τον προεπιλεγμένο ρόλο. Διαγραφή;':'Διαγραφή ρόλου;')) return; delete cfg().arch[FC.arch]; FC.arch='IWB'; saveCfg(); fcRoles(); });
  on('#faNew','click',()=>{
    const name = prompt('Όνομα νέου ρόλου:', A.l+' (δικός μου)'); if(!name) return;
    const k = 'R_'+Date.now().toString(36);
    cfg().arch[k] = { ...JSON.parse(JSON.stringify(A)), l:name }; FC.arch = k; saveCfg(); fcRoles();
    toast('Ο ρόλος δημιουργήθηκε — διάλεξέ τον σε μια θέση στα «Συστήματα»');
  });
}

function fcShare(){
  const c = cfg(), nA = Object.keys(c.arch).length, nS = Object.keys(c.sys).length, nX = c.extraSys.length;
  $('#fcBox').innerHTML = `<div class="grid g2">
    <div class="card"><h3>⚖️ Fit ρόστερ vs ταίριασμα με αντίπαλο</h3>
      <div class="small muted">Πόσο μετράει η καταλληλότητα των παικτών σου έναντι του πόσο «χτυπάει» το σύστημα τις αδυναμίες του επόμενου αντιπάλου, στη συνολική κατάταξη συστημάτων.</div>
      <div class="row" style="flex-wrap:nowrap;margin-top:12px"><span class="small">Αντίπαλος</span><input type="range" id="fsM" min="0" max="100" step="5" value="${Math.round(fitMix()*100)}" style="flex:1"><span class="small">Ρόστερ</span></div>
      <div style="text-align:center;font-size:20px;font-weight:800;margin-top:6px" id="fsMv">${Math.round(fitMix()*100)}% ρόστερ · ${Math.round(100-fitMix()*100)}% αντίπαλος</div></div>
    <div class="card"><h3>💾 Οι ρυθμίσεις μου</h3>
      <div>${nA} ρόλοι τροποποιημένοι/νέοι · ${nS} συστήματα τροποποιημένα · ${nX} δικά μου συστήματα</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="fsExp">⬇ Εξαγωγή (JSON)</button><label class="btn">⬆ Εισαγωγή<input type="file" id="fsImp" accept=".json" hidden></label><button class="btn" id="fsReset">↺ Επαναφορά όλων</button></div>
      <div class="small muted" style="margin-top:8px">Μοιράσου το αρχείο με το τεχνικό επιτελείο ώστε όλοι να κρίνουν με τα ίδια κριτήρια.</div></div></div>`;
  on('#fsM','input',e=>{ $('#fsMv').textContent = `${e.target.value}% ρόστερ · ${100-e.target.value}% αντίπαλος`; });
  on('#fsM','change',e=>{ cfg().mix = +e.target.value/100; saveCfg(); });
  on('#fsExp','click',()=>download('datacoach_fit_rythmiseis.json', JSON.stringify({ format:'datacoach360-fitcfg', ...cfg() }, null, 1), 'application/json'));
  on('#fsImp','change',e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const o=JSON.parse(t); if(o.format!=='datacoach360-fitcfg') throw 0; delete o.format; S.cfg=o; saveCfg(); toast('Εισήχθησαν ✔'); fcShare(); }catch(_){ toast('Μη έγκυρο αρχείο ρυθμίσεων'); } }); });
  on('#fsReset','click',()=>{ if(!confirm('Επαναφορά ΟΛΩΝ των ρόλων/συστημάτων στις προεπιλογές; Τα δικά σου συστήματα θα διαγραφούν.')) return; S.cfg = {}; saveCfg(); fcShare(); });
}

applyCfg();
