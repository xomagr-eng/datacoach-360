'use strict';
/* ===== Εμπειρία χρήστη: υποδοχή (onboarding) · γενική αναζήτηση · σημειώσεις scout ·
         εξηγήσεις μετρικών · υπενθύμιση αντιγράφου ασφαλείας ===== */

/* ---------- Εξηγήσεις μετρικών (tooltips στις επικεφαλίδες) ---------- */
const MINFO = {
  goals:'Γκολ ανά 90 λεπτά συμμετοχής.', ast:'Ασίστ ανά 90′.',
  npxg:'Non-penalty xG: ποιότητα των ευκαιριών που βρίσκει ο παίκτης, χωρίς πέναλτι. Υψηλό = παίρνει θέσεις σουτ υψηλής πιθανότητας.',
  xa:'Expected Assists: πόσο «καλές» είναι οι ευκαιρίες που δημιουργεί με τις πάσες του, ανεξάρτητα αν ο συμπαίκτης σκόραρε.',
  ga90:'Γκολ + ασίστ ανά 90′.', npxgxa:'npxG + xA ανά 90′: συνολική αναμενόμενη επιθετική συνεισφορά.',
  shots:'Σουτ ανά 90′.', sotPct:'Ποσοστό σουτ που βρήκαν τον στόχο.',
  kp:'Key passes: πάσες που οδήγησαν αμέσως σε σουτ.', progP:'Προωθητικές πάσες: φέρνουν την μπάλα σημαντικά πιο κοντά στην αντίπαλη εστία.',
  progC:'Προωθητικές κούρσες: μεταφορές της μπάλας με το πόδι προς την αντίπαλη εστία.', crosses:'Σέντρες που κατέληξαν μέσα στην περιοχή.',
  lineBreak:'Πάσες που περνούν μία ή περισσότερες γραμμές του αντιπάλου.', passPct:'Ποσοστό επιτυχημένων πασών.',
  f3Pct:'Ποσοστό επιτυχημένων πασών στο τελευταίο τρίτο — εκεί που η πίεση είναι μεγαλύτερη.',
  touchBox:'Επαφές με την μπάλα μέσα στην αντίπαλη περιοχή.', drbS:'Επιτυχημένες ντρίμπλες ανά 90′.', drbPct:'Ποσοστό επιτυχίας στις ντρίμπλες.',
  tkl:'Τάκλιν ανά 90′.', int:'Αναχαιτίσεις: κόψιμο πάσας του αντιπάλου.', tklInt:'Τάκλιν + αναχαιτίσεις: συνολική αμυντική δράση.',
  recov:'Ανακτήσεις: φορές που ο παίκτης πήρε πίσω την μπάλα.', clear:'Απομακρύνσεις από την περιοχή.',
  pressures:'Πιέσεις στον αντίπαλο κάτοχο της μπάλας — δείκτης έντασης στο pressing.',
  aerT:'Εναέριες μονομαχίες ανά 90′.', aerPct:'Ποσοστό νικών στις εναέριες μονομαχίες.',
  dduelT:'Αμυντικές μονομαχίες (1v1 χωρίς μπάλα) ανά 90′.', dduelPct:'Ποσοστό νικών στις αμυντικές μονομαχίες.',
  savePct:'Ποσοστό σουτ στον στόχο που απέκρουσε ο τερματοφύλακας.',
  psxgd:'Post-shot xG μείον γκολ που δέχτηκε: θετικό = σώζει περισσότερα από το αναμενόμενο.',
  _score:'Score ρόλου: μέσο εκατοστημόριο του παίκτη στις μετρικές της θέσης του (0–100), σε σύγκριση με παίκτες ίδιας θέσης.',
  _vfm:'Value for money: δίκαιος μισθός (βάσει απόδοσης) ÷ πραγματικός μισθός. >1 = αξίζει περισσότερα απ’ όσα πληρώνεται.'
};
function mtip(k){ return MINFO[k] ? ` data-tip="${esc(MINFO[k])}"` : ''; }

/* ---------- Modal ---------- */
function openModal(html, o={}){
  let bg = $('#modalBg');
  if(!bg){ bg = document.createElement('div'); bg.id='modalBg'; document.body.appendChild(bg); bg.addEventListener('click', e=>{ if(e.target===bg && !bg.dataset.lock) closeModal(); }); }
  bg.dataset.lock = o.lock ? '1' : '';
  bg.innerHTML = `<div class="modal ${o.wide?'wide':''}" role="dialog" aria-modal="true">${html}</div>`;
  bg.classList.add('open'); document.body.style.overflow='hidden';
  return bg.querySelector('.modal');
}
function closeModal(){ const bg=$('#modalBg'); if(bg){ bg.classList.remove('open'); bg.innerHTML=''; } document.body.style.overflow=''; }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('#modalBg.open') && !$('#modalBg').dataset.lock) closeModal(); });

/* ---------- 1) Υποδοχή (πρώτη χρήση) ---------- */
const ROLE_GOALS = [
  ['coach','🧠','Προπονητής','Αντίπαλος, σύστημα, 11άδα, φορτίο','opp'],
  ['analyst','📊','Αναλυτής','xG, αγώνες, γραφήματα, πορτφόλιο','team'],
  ['director','💼','Τεχνικός διευθυντής','Ρόστερ, μπάτζετ, συμβόλαια, σενάρια','squad'],
  ['scout','🔎','Scout','Αγορά, ρόλοι, Moneyball, σημειώσεις','market']
];
const OB = { step:0, role:null };
function showOnboarding(){
  OB.step = 0; OB.role = S.settings.role || null;
  obRender();
}
function obRender(){
  const dots = [0,1,2].map(i=>`<i class="${i===OB.step?'on':''}"></i>`).join('');
  let body = '';
  if(OB.step===0) body = `
    <div class="ob-hero"><div class="logo">DC</div><div><h2>Καλώς ήρθες στο DATA COACH 360°</h2><div class="muted">Ο προπονητής-αναλυτής σε ένα εργαλείο: δεδομένα, scouting, μπάτζετ και στρατηγική.</div></div></div>
    <h3>Ποιος είναι ο κύριος ρόλος σου;</h3><div class="small muted" style="margin-bottom:10px">Θα ξεκινάς από τη σελίδα που σε ενδιαφέρει περισσότερο. Όλα τα εργαλεία μένουν διαθέσιμα.</div>
    <div class="ob-grid">${ROLE_GOALS.map(([k,i,l,d])=>`<button class="ob-opt ${OB.role===k?'on':''}" data-role="${k}"><span class="i">${i}</span><b>${l}</b><span class="small muted">${d}</span></button>`).join('')}</div>`;
  else if(OB.step===1) body = `
    <h3>⚽ Η ομάδα σου</h3><div class="small muted" style="margin-bottom:10px">Τα ενσωματωμένα δεδομένα είναι <b>φανταστικά</b>, για να εξερευνήσεις την εφαρμογή. Διάλεξε μια ομάδα-δείγμα ή φόρτωσε αργότερα πραγματικά δεδομένα (FBref / StatsBomb).</div>
    <div class="grid g2"><label class="f">Η ομάδα μου<select id="obTeam">${opts(teamList(), S.settings.myTeam)}</select></label>
      <label class="f">Επόμενος αντίπαλος<select id="obOpp">${demoTeamOpts(S.settings.nextOpp)}</select></label>
      <label class="f" style="grid-column:1/-1">Το όνομά σου (υπογραφή σε reports & γραφήματα — προαιρετικό)<input type="text" id="obName" value="${esc(S.settings.author)}" placeholder="π.χ. Γ. Παπαδόπουλος · Football Analyst"></label></div>
    <label class="small" style="display:block;margin-top:12px"><input type="checkbox" id="obImport"> Θέλω να φορτώσω δικά μου δεδομένα αμέσως μετά</label>`;
  else body = `
    <h3>✨ Τρία κόλπα που θα χρησιμοποιείς συνέχεια</h3>
    <div class="find info"><span class="ic">🔎</span><div><b>Αναζήτηση παντού</b><span class="small muted">Πάτα <kbd>/</kbd> ή <kbd>Ctrl</kbd>+<kbd>K</kbd> (ή το 🔎 πάνω δεξιά) για παίκτες, ομάδες, σελίδες και όρους.</span></div></div>
    <div class="find info"><span class="ic">📝</span><div><b>Σημειώσεις scout & ☆ λίστα μεταγραφών</b><span class="small muted">Σε κάθε παίκτη: κατάσταση (παρακολούθηση/στόχος), αστέρια και σημειώσεις. Το ☆ τον βάζει στη λίστα μεταγραφών με υπολογισμό μπάτζετ.</span></div></div>
    <div class="find info"><span class="ic">ℹ️</span><div><b>Δεν ξέρεις τι σημαίνει ένας δείκτης;</b><span class="small muted">Πέρασε το ποντίκι (ή άγγιξε) πάνω από το όνομά του — π.χ. xA, PPDA, line-breaking.</span></div></div>
    <div class="find str"><span class="ic">💾</span><div><b>Τα δεδομένα σου μένουν στη συσκευή σου</b><span class="small muted">Τίποτα δεν ανεβαίνει σε server. Κράτα αντίγραφο με «Δεδομένα → Backup» — θα σου το θυμίζουμε.</span></div></div>`;
  openModal(`<div class="ob">${body}
    <div class="ob-foot"><div class="ob-dots">${dots}</div><span style="flex:1"></span>
      ${OB.step>0?'<button class="btn" id="obBack">← Πίσω</button>':'<button class="btn" id="obSkip">Παράλειψη</button>'}
      <button class="btn pri" id="obNext" ${OB.step===0&&!OB.role?'disabled':''}>${OB.step===2?'Ξεκίνα 🚀':'Συνέχεια →'}</button></div></div>`, { wide:true, lock:true });
  $$('.ob-opt').forEach(b=>b.onclick=()=>{ OB.role=b.dataset.role; obRender(); });
  on('#obSkip','click',()=>{ S.onboarded=true; save(); closeModal(); });
  on('#obBack','click',()=>{ OB.step--; obRender(); });
  on('#obNext','click',()=>{
    if(OB.step===1){ S.settings.myTeam=$('#obTeam').value; S.settings.nextOpp=$('#obOpp').value; S.settings.author=$('#obName').value.trim(); OB.wantImport=$('#obImport').checked; }
    if(OB.step<2){ OB.step++; obRender(); return; }
    S.settings.role = OB.role; S.onboarded = true; save(); rebuild(); closeModal();
    const land = OB.wantImport ? 'data' : (ROLE_GOALS.find(r=>r[0]===OB.role)||[])[4] || 'home';
    toast('Έτοιμο — καλή δουλειά! ⚽'); if(location.hash==='#'+land) route(); else go(land);
  });
}

/* ---------- 2) Γενική αναζήτηση ---------- */
const SR = { q:'', sel:0, items:[] };
function openSearch(){
  openModal(`<div class="srch"><div class="srch-in"><span>🔎</span><input type="search" id="srQ" placeholder="Παίκτης, ομάδα, σελίδα ή όρος (π.χ. «xA», «Κεραυνός», «μπάτζετ»)…" autocomplete="off"><kbd>Esc</kbd></div><div id="srR" class="srch-res"></div>
    <div class="small muted srch-hint">↑↓ επιλογή · Enter άνοιγμα · <kbd>/</kbd> ή <kbd>Ctrl</kbd>+<kbd>K</kbd> από οπουδήποτε</div></div>`, { wide:true });
  const inp = $('#srQ'); inp.value = SR.q; setTimeout(()=>inp.focus(), 30);
  inp.oninput = ()=>{ SR.q = inp.value; SR.sel = 0; srDraw(); };
  inp.onkeydown = e=>{
    if(e.key==='ArrowDown'){ SR.sel = Math.min(SR.items.length-1, SR.sel+1); srDraw(); e.preventDefault(); }
    else if(e.key==='ArrowUp'){ SR.sel = Math.max(0, SR.sel-1); srDraw(); e.preventDefault(); }
    else if(e.key==='Enter' && SR.items[SR.sel]){ srGo(SR.items[SR.sel]); }
  };
  srDraw();
}
/* ελληνικά ↔ λατινικά: «κοστα» βρίσκει «Costa», «πεπ» βρίσκει «Pep» */
const GR2LAT = [["ντ","nd"],["μπ","mb"],["γκ","gk"],["γγ","ng"],["ου","ou"],["θ","th"],["χ","ch"],["ψ","ps"],["α","a"],["β","v"],["γ","g"],["δ","d"],["ε","e"],["ζ","z"],["η","i"],["ι","i"],["κ","k"],["λ","l"],["μ","m"],["ν","n"],["ξ","x"],["ο","o"],["π","p"],["ρ","r"],["σ","s"],["ς","s"],["τ","t"],["υ","y"],["φ","f"],["ω","o"]];
const latin = s => { let t = s; for (const [g, l] of GR2LAT) t = t.split(g).join(l); return t.replace(/y/g,"i").replace(/w/g,"o").replace(/(.)\1/g,"$1").replace(/c(?!h)/g,"k").replace(/mb/g,"b").replace(/nd/g,"d"); };
function srSearch(q){
  const n = normName(q), nl = latin(n), out = [];
  const hit = s => { const t = normName(s); return t.includes(n) || latin(t).includes(nl); };
  const pages = NAV.filter(x=>x[0]!=='§').map(x=>({ t:'page', ic:x[1], l:x[2], sub:'Σελίδα', go:x[0] }));
  const actions = [
    { t:'page', ic:'🕵️', l:'Report αντιπάλου: '+S.settings.nextOpp, sub:'Ενέργεια', go:'opp' },
    { t:'page', ic:'💾', l:'Backup δεδομένων', sub:'Ενέργεια', fn:doBackup },
    { t:'page', ic:'❓', l:'Οδηγός υποδοχής', sub:'Βοήθεια', fn:showOnboarding },
    { t:'page', ic:'📝', l:'Οι σημειώσεις μου (scouting)', sub:'Αγορά', fn:()=>{ MK.scout='any'; go('market'); } }
  ];
  if(!n){ return actions.concat(pages.slice(0,8)); }
  out.push(...actions.filter(a=>hit(a.l)), ...pages.filter(p=>hit(p.l)));
  const pl = PL.filter(p=>hit(p.name)).sort((a,b)=>(b.team===S.settings.myTeam)-(a.team===S.settings.myTeam) || b._score-a._score).slice(0,8)
    .map(p=>{ const sn=scoutNote(p.id); return { t:'player', ic:sn&&sn.status?SCOUT_ST[sn.status][0]:'👤', l:p.name, sub:`${p.team} · ${POS_L[p.pos]} · ${p.age} ετών · score ${Math.round(p._score)}`, go:'profile', arg:p.id }; });
  const tm = DB.teams.filter(t=>hit(t.name)).slice(0,5).map(t=>({ t:'team', ic:'🛡️', l:t.name, sub:`${LEAGUES[t.league].name} · ${t.style}`, fn:()=>{ TV.team=t.name; go('team'); } }));
  const gl = GLOSSARY.filter(([k,v])=>hit(k)||hit(v)).slice(0,4).map(([k,v])=>({ t:'term', ic:'📖', l:k, sub:v.slice(0,90)+(v.length>90?'…':''), go:'academy', arg:'glossary' }));
  const mt = Object.entries(M).filter(([k,m])=>hit(m.l)||hit(k)).slice(0,3).map(([k,m])=>({ t:'term', ic:'📏', l:m.l, sub:MINFO[k]||'Μετρική', fn:()=>{ RV.x=k; go('roles'); } }));
  return out.concat(pl, tm, mt, gl).slice(0,20);
}
function srDraw(){
  SR.items = srSearch(SR.q);
  const box = $('#srR'); if(!box) return;
  box.innerHTML = SR.items.length ? SR.items.map((it,i)=>`<div class="srch-it ${i===SR.sel?'on':''}" data-i="${i}"><span class="ic">${it.ic}</span><div><b>${esc(it.l)}</b><div class="small muted">${esc(it.sub||'')}</div></div><span class="tag">${{page:'σελίδα',player:'παίκτης',team:'ομάδα',term:'όρος'}[it.t]}</span></div>`).join('')
    : `<div class="empty">Δεν βρέθηκε τίποτα για «${esc(SR.q)}».</div>`;
  $$('.srch-it').forEach(d=>{ d.onclick=()=>srGo(SR.items[+d.dataset.i]); });
  const on_ = box.querySelector('.srch-it.on'); if(on_) on_.scrollIntoView({ block:'nearest' });
}
function srGo(it){ closeModal(); SR.q=''; if(it.fn) it.fn(); else go(it.go, it.arg); }
document.addEventListener('keydown', e=>{
  const typing = /INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'');
  if((e.key==='k' || e.key==='K') && (e.ctrlKey||e.metaKey)){ e.preventDefault(); openSearch(); }
  else if(e.key==='/' && !typing && !$('#modalBg.open')){ e.preventDefault(); openSearch(); }
});

/* ---------- 3) Σημειώσεις scout ---------- */
const SCOUT_ST = { watch:['👀','Παρακολούθηση','b'], target:['🎯','Στόχος','r'], maybe:['🤔','Ίσως','w'], reject:['⛔','Απορρίφθηκε',''] };
function scoutNote(id){ return (S.notes||{})[id]; }
function scoutBadge(p){ const n=scoutNote(p.id); if(!n || (!n.status && !n.rating && !n.text)) return ''; const st=SCOUT_ST[n.status];
  return `<span class="tag ${st?st[2]:''}" data-tip="${esc((st?st[1]+' · ':'')+(n.rating?'★'.repeat(n.rating)+' · ':'')+(n.text||'').slice(0,140))}">${st?st[0]:'📝'}${n.rating?' '+n.rating+'★':''}</span>`; }
function scoutMatch(p, f){
  if(!f) return true;
  const n = scoutNote(p.id);
  if(f==='any') return !!(n && (n.status || n.rating || n.text));
  return !!(n && n.status===f);
}
function scoutFilterOpts(cur){ return opts([['','Όλοι'],['any','Με σημειώσεις / αστέρια'], ...Object.entries(SCOUT_ST).map(([k,[i,l]])=>[k, i+' '+l])], cur); }
function scoutCsv(p){ const n = scoutNote(p.id)||{}; return [SCOUT_ST[n.status]?SCOUT_ST[n.status][1]:'', n.rating||'', `"${String(n.text||'').replace(/"/g,'""').replace(/\r?\n/g,' ')}"`]; }
function scoutNoteText(p){ const n = scoutNote(p.id); return n && n.text ? ' · Σημειώσεις: '+n.text.replace(/\s+/g,' ') : ''; }
function notesCardHTML(p){
  const n = scoutNote(p.id) || {};
  return `<div class="card"><h3>📝 Σημειώσεις scout<span class="sp"></span><span class="small muted" id="snSaved">${n.updated?'ενημέρωση '+new Date(n.updated).toLocaleDateString('el-GR'):''}</span></h3>
    <div class="row" style="gap:6px">${Object.entries(SCOUT_ST).map(([k,[i,l]])=>`<button class="btn sm ${n.status===k?'pri':''}" data-sst="${k}">${i} ${l}</button>`).join('')}</div>
    <div class="stars" style="margin:10px 0">${[1,2,3,4,5].map(i=>`<button data-star-r="${i}" class="${(n.rating||0)>=i?'on':''}" aria-label="${i} αστέρια">★</button>`).join('')}<span class="small muted" style="margin-left:8px">η δική σου βαθμολογία</span></div>
    <textarea id="snText" rows="5" placeholder="π.χ. «Εξαιρετικός στο 1v1 αλλά χάνει θέση στις μεταβάσεις. Να τον δω live vs Κεραυνό.»">${esc(n.text||'')}</textarea>
    <input type="text" id="snTags" value="${esc((n.tags||[]).join(', '))}" placeholder="Ετικέτες (κόμμα): αριστεροπόδαρος, ηγέτης, ταχύτητα" style="width:100%;margin-top:8px">
    <div class="small muted" style="margin-top:6px">Αποθηκεύεται αυτόματα. Οι σημειώσεις για παίκτες της ομάδας σου περνούν και στο TACTIX.</div></div>`;
}
function bindNotes(p){
  S.notes ||= {};
  const cur = ()=> (S.notes[p.id] ||= { status:'', rating:0, text:'', tags:[] });
  const stamp = ()=>{ cur().updated = Date.now(); save(); const s=$('#snSaved'); if(s) s.textContent='✔ αποθηκεύτηκε'; };
  $$('[data-sst]').forEach(b=>b.onclick=()=>{ const c=cur(); c.status = c.status===b.dataset.sst ? '' : b.dataset.sst; stamp(); $$('[data-sst]').forEach(x=>x.classList.toggle('pri', x.dataset.sst===c.status)); });
  $$('[data-star-r]').forEach(b=>b.onclick=()=>{ const c=cur(), v=+b.dataset.starR; c.rating = c.rating===v ? 0 : v; stamp(); $$('[data-star-r]').forEach(x=>x.classList.toggle('on', +x.dataset.starR<=c.rating)); });
  let t; on('#snText','input',e=>{ clearTimeout(t); t=setTimeout(()=>{ cur().text=e.target.value; stamp(); }, 400); });
  on('#snTags','change',e=>{ cur().tags=e.target.value.split(',').map(s=>s.trim()).filter(Boolean); stamp(); });
}

/* ---------- 5) Αντίγραφο ασφαλείας ---------- */
function doBackup(){
  S.lastBackup = Date.now(); save();
  download(`datacoach360_backup_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(S), 'application/json');
  toast('💾 Αντίγραφο αποθηκεύτηκε');
}
function hasOwnWork(){ return !!(S.shortlist.length || Object.keys(S.notes||{}).length || (S.logs||[]).length || (S.clips||[]).length || S.imported || (S.cfg && (Object.keys(S.cfg.arch||{}).length || Object.keys(S.cfg.sys||{}).length || (S.cfg.extraSys||[]).length))); }
function backupBanner(){
  if(!hasOwnWork()) return '';
  const last = S.lastBackup||0, snooze = S.backupSnooze||0, day = 864e5;
  if(Date.now()-last < 14*day || Date.now() < snooze) return '';
  return `<div class="find str" id="bkBanner" style="margin-bottom:14px"><span class="ic">💾</span><div style="flex:1"><b>${last?`Τελευταίο αντίγραφο πριν από ${Math.floor((Date.now()-last)/day)} ημέρες`:'Δεν έχεις κρατήσει ακόμα αντίγραφο ασφαλείας'}</b>
    <span class="small muted">Η λίστα μεταγραφών, οι σημειώσεις και οι ρυθμίσεις σου ζουν μόνο σε αυτόν τον browser. Ένα κλικ και τα έχεις σε αρχείο — και μπορείς να τα περάσεις και σε άλλη συσκευή.</span></div>
    <div class="row" style="flex-wrap:nowrap"><button class="btn pri sm" onclick="doBackup();document.getElementById('bkBanner').remove()">Backup τώρα</button><button class="btn sm" onclick="S.backupSnooze=Date.now()+7*864e5;save();document.getElementById('bkBanner').remove()">Αργότερα</button></div></div>`;
}
