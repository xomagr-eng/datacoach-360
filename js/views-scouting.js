'use strict';
/* ===== Πυλώνας 2: Αγορά · Ρόλοι · Προφίλ · Ρόστερ & Μπάτζετ · Moneyball ===== */

function leaguesInData(){ return [...new Set(PL.map(p=>p.league))]; }
function leagueOpts(cur){ return `<option value="">Όλες</option>` + opts(leaguesInData().map(l=>[l, leagueName(l)]), cur); }
const GEN_COLS = ['npxgxa','xa','kp','progP','progC','tklInt','passPct'];

/* ======================= ΑΓΟΡΑ (Market Overview) ======================= */
const MK = { q:'', lg:'', team:'', role:'', ageMin:16, ageMax:40, contract:'', maxVal:'', minMin:null, sort:'_score', dir:-1, scout:'' };
function mkFilter(){
  const mm = MK.scout ? 0 : (MK.minMin ?? S.settings.minMin), q = normName(MK.q);
  return PL.filter(p=>
    (!MK.lg || p.league===MK.lg) && (!MK.team || p.team===MK.team) && (!MK.role || p._role===MK.role) &&
    p.age>=MK.ageMin && p.age<=MK.ageMax && p.min>=mm &&
    (!MK.contract || (p.contract && p.contract<=+MK.contract)) && (!MK.maxVal || (p.value||0)<=+MK.maxVal) &&
    (!q || normName(p.name).includes(q) || normName(p.team).includes(q)) && scoutMatch(p, MK.scout));
}
VIEWS.market = function(){
  const mm = MK.minMin ?? S.settings.minMin;
  $('#view').innerHTML = `
  <div class="card"><h3>🎛️ Φίλτρα (Slicers)<span class="sp"></span><button class="btn sm" id="mkReset">Καθαρισμός</button></h3><div class="grid g5">
    <label class="f">Αναζήτηση<input type="search" id="fQ" value="${esc(MK.q)}" placeholder="Παίκτης ή ομάδα"></label>
    <label class="f">Διοργάνωση<select id="fLg">${leagueOpts(MK.lg)}</select></label>
    <label class="f">Ομάδα<select id="fTeam"><option value="">Όλες</option>${opts(teamList(), MK.team)}</select></label>
    <label class="f">Ρόλος / θέση<select id="fRole"><option value="">Όλοι</option>${opts(Object.entries(ROLES).map(([k,r])=>[k,r.l]), MK.role)}</select></label>
    <label class="f">Λήξη συμβολαίου έως<select id="fCon"><option value="">Οποτεδήποτε</option>${opts([2027,2028,2029,2030].map(y=>[y,'Ιούνιος '+y]), MK.contract)}</select></label>
    <label class="f">Ηλικία από<input type="number" id="fA1" value="${MK.ageMin}" min="15" max="45"></label>
    <label class="f">Ηλικία έως<input type="number" id="fA2" value="${MK.ageMax}" min="15" max="45"></label>
    <label class="f">Μέγ. αξία (χιλ.€)<input type="number" id="fVal" value="${MK.maxVal}" step="50" placeholder="χωρίς όριο"></label>
    <label class="f">Ελάχ. λεπτά<input type="number" id="fMin" value="${mm}" step="90"></label>
    <label class="f">📝 Scouting<select id="fSc">${scoutFilterOpts(MK.scout)}</select></label>
    <div class="row" style="align-items:flex-end"><button class="btn" id="fU23">Κάτω των 23</button><button class="btn" id="fExp">Λήγουν 2027</button></div>
  </div></div>
  <div class="card" style="margin-top:14px"><h3 id="mkH">Παίκτες</h3><div id="mkT"></div></div>`;
  const bind = (id, k, f=v=>v)=>on(id, 'input', e=>{ MK[k]=f(e.target.value); drawMarket(); });
  bind('#fQ','q'); bind('#fA1','ageMin',v=>+v||0); bind('#fA2','ageMax',v=>+v||99); bind('#fVal','maxVal'); bind('#fMin','minMin',v=>+v||0);
  ['#fLg:lg','#fTeam:team','#fRole:role','#fCon:contract','#fSc:scout'].forEach(s=>{ const [id,k]=s.split(':'); on(id,'change',e=>{ MK[k]=e.target.value; if(k==='role') MK.sort='_score'; drawMarket(); }); });
  on('#fU23','click',()=>{ MK.ageMax=22; $('#fA2').value=22; drawMarket(); });
  on('#fExp','click',()=>{ MK.contract='2027'; $('#fCon').value='2027'; drawMarket(); });
  on('#mkReset','click',()=>{ Object.assign(MK,{ q:'', lg:'', team:'', role:'', ageMin:16, ageMax:40, contract:'', maxVal:'', minMin:null, sort:'_score', dir:-1, scout:'' }); VIEWS.market(); });
  drawMarket();
};
function drawMarket(){
  const list = mkFilter(), cols = MK.role ? ROLES[MK.role].m : GEN_COLS;
  const getS = p => MK.sort==='_score' ? p._score : MK.sort==='_vfm' ? (p._vfm||0) : ['name','team','pos'].includes(MK.sort) ? p[MK.sort] : M[MK.sort] ? val(p,MK.sort) : (+p[MK.sort]||0);
  list.sort((a,b)=>{ const x=getS(a), y=getS(b); return (typeof x==='string' ? x.localeCompare(y,'el') : x-y)*MK.dir; });
  $('#mkH').innerHTML = `📋 ${list.length} παίκτες ${MK.role?`· ${esc(ROLES[MK.role].l)}`:''}<span class="sp"></span><span class="small muted">Χρώμα κελιού = εκατοστημόριο στη θέση</span><button class="btn sm" id="mkCsv">⬇ CSV</button>`;
  const th = (k,l,cls='')=>`<th data-s="${k}" class="${cls}"${mtip(k)}>${l}${MK.sort===k?(MK.dir<0?' ▼':' ▲'):''}</th>`;
  const rows = list.slice(0,400).map(p=>`<tr class="${p.team===S.settings.myTeam?'me':''}">
    <td>${star(p)}</td><td class="l click" data-pid="${p.id}">${esc(p.name)} ${scoutBadge(p)}</td><td class="l small">${esc(p.team)}</td><td>${POS_L[p.pos]}</td><td>${p.age}</td><td>${p.min}</td>
    <td>${p.contract||'–'}</td><td>${p.value?Math.round(p.value):'–'}</td><td>${p.wage?Math.round(p.wage):'–'}</td>
    <td><b style="color:${scoreCol(p._score)}">${Math.round(p._score)}</b></td><td>${vfmTag(p)}</td>
    ${cols.map(k=>`<td><span class="hc" style="${heatBg(pct(p,k))}">${fv(p,k)}</span></td>`).join('')}</tr>`).join('');
  $('#mkT').innerHTML = `<div class="tbl-wrap"><table class="t"><tr><th></th>${th('name','Παίκτης','l')}${th('team','Ομάδα','l')}${th('pos','Θέση')}${th('age','Ηλ.')}${th('min','Λεπτά')}${th('contract','Λήξη')}${th('value','Αξία k€')}${th('wage','Μισθός k€')}${th('_score','Score')}${th('_vfm','VfM')}
    ${cols.map(k=>th(k, esc(M[k].l)+(M[k].t==='p90'||M[k].t==='sum'?' /90':''))).join('')}</tr>${rows}</table></div>
    ${list.length>400?`<div class="small muted" style="margin-top:6px">Εμφανίζονται οι 400 πρώτοι — στένεψε τα φίλτρα.</div>`:''}
    ${!list.length?'<div class="empty">Κανένας παίκτης με αυτά τα φίλτρα.</div>':''}`;
  $$('#mkT th[data-s]').forEach(h=>h.onclick=()=>{ const k=h.dataset.s; MK.dir = MK.sort===k ? -MK.dir : (['name','team','pos','age','contract','value','wage'].includes(k)?1:-1); MK.sort=k; drawMarket(); });
  on('#mkCsv','click',()=>exportPlayersCSV(list,'market_overview.csv'));
}

/* ======================= ΑΝΑΛΥΣΗ ΡΟΛΩΝ (scatter) ======================= */
const RV = { role:'CM', x:null, y:null, lg:'', ageMax:40, labels:narrow()?6:12, hl:'my' };
VIEWS.roles = function(arg){
  if(arg && ROLES[arg]) { RV.role=arg; RV.x=null; RV.y=null; }
  const R = ROLES[RV.role]; RV.x ||= R.sx; RV.y ||= R.sy;
  const pool = PL.filter(p=>R.pos.includes(p.pos) && qualified(p) && (!RV.lg || p.league===RV.lg) && p.age<=RV.ageMax);
  const xs = pool.map(p=>val(p,RV.x)), ys = pool.map(p=>val(p,RV.y)), mx=mean(xs), my=mean(ys), sx=sd(xs), sy=sd(ys);
  const ranked = pool.map(p=>({ p, z:(val(p,RV.x)-mx)/sx + (val(p,RV.y)-my)/sy })).sort((a,b)=>b.z-a.z);
  const lab = new Set(ranked.slice(0,RV.labels).map(r=>r.p.id));
  const pts = pool.map(p=>{ const mine = p.team===S.settings.myTeam, l2 = p.league==='L2', sl = inShort(p.id);
    return { x:val(p,RV.x), y:val(p,RV.y), id:p.id, label:p.name, showLabel:lab.has(p.id)||(RV.hl==='my'&&mine), z:mine||sl?2:lab.has(p.id)?1:0,
      color: sl?COL.gold : mine&&RV.hl==='my' ? COL.white : l2 ? COL.blue : COL.red, r: mine||sl?6.5:5, op: mine||lab.has(p.id)?.95:.6,
      tip:`<b>${esc(p.name)}</b> · ${esc(p.team)}<br>${POS_FULL[p.pos]} · ${p.age} ετών · ${p.min}′<br>${esc(M[RV.x].l)}: ${fv(p,RV.x)}<br>${esc(M[RV.y].l)}: ${fv(p,RV.y)}<br>Αξία ${p.value||'–'}k€` }; });
  const mOpts = Object.keys(M).map(k=>[k, M[k].l+(M[k].t==='p90'||M[k].t==='sum'?' /90':'')]);
  $('#view').innerHTML = `
  <div class="tabs">${Object.entries(ROLES).map(([k,r])=>`<button class="${k===RV.role?'on':''}" data-role="${k}">${esc(r.l)}</button>`).join('')}</div>
  <div class="grid g31">
    <div class="card"><h3>🎯 ${esc(R.l)} — ${esc(M[RV.x].l)} vs ${esc(M[RV.y].l)}<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('rSc'),'scatter_${RV.role}')">PNG</button><button class="btn sm" data-go="portfolio" data-arg="scatter">📣 Post</button></h3>
      <div class="row" style="margin-bottom:10px">
        <label class="f">Άξονας Χ<select id="rX">${opts(mOpts, RV.x)}</select></label><label class="f">Άξονας Υ<select id="rY">${opts(mOpts, RV.y)}</select></label>
        <label class="f">Διοργάνωση<select id="rLg">${leagueOpts(RV.lg)}</select></label><label class="f">Μέγ. ηλικία<input type="number" id="rAge" value="${RV.ageMax}" style="width:80px"></label>
        <label class="f">Ετικέτες<input type="number" id="rLab" value="${RV.labels}" min="0" max="40" style="width:70px"></label></div>
      ${scatterSVG(pts,{ id:'rSc', xl:M[RV.x].l+(M[RV.x].t==='pct'?'':' ανά 90′'), yl:M[RV.y].l+(M[RV.y].t==='pct'?'':' ανά 90′'), xAvg:mx, yAvg:my })}
      <div class="legend"><span><i style="background:${COL.red}"></i>${esc(leagueName('L1'))}${S.imported&&S.imported.mode==='append'?' / εισαγωγή':''}</span><span><i style="background:${COL.blue}"></i>${esc(leagueName('L2'))}</span><span><i style="background:${COL.white}"></i>Η ομάδα μου</span><span><i style="background:${COL.gold}"></i>Λίστα μεταγραφών</span><span>Διακεκομμένες = Μ.Ο. δείγματος (${pool.length} παίκτες ≥${S.settings.minMin}′)</span></div>
      <div class="small muted" style="margin-top:6px">💡 Προτεινόμενο visual για τον ρόλο: ${esc(R.vis)}. Κλικ σε κουκκίδα → προφίλ.</div></div>
    <div class="card"><h3>🏅 Πάνω δεξιά (z-score Χ+Υ)</h3>${ranked.slice(0,15).map((r,i)=>`<div class="row" style="justify-content:space-between;flex-wrap:nowrap;padding:4px 0;border-bottom:1px solid var(--line)"><span>${i+1}. ${plink(r.p)}<br><span class="small muted">${esc(r.p.team)} · ${r.p.age} · ${r.p.value||'–'}k€</span></span><b>${r.z.toFixed(1)}</b></div>`).join('')}</div>
  </div>`;
  $$('[data-role]').forEach(b=>b.onclick=()=>{ RV.role=b.dataset.role; RV.x=null; RV.y=null; VIEWS.roles(); });
  on('#rX','change',e=>{ RV.x=e.target.value; VIEWS.roles(); }); on('#rY','change',e=>{ RV.y=e.target.value; VIEWS.roles(); });
  on('#rLg','change',e=>{ RV.lg=e.target.value; VIEWS.roles(); }); on('#rAge','change',e=>{ RV.ageMax=+e.target.value||40; VIEWS.roles(); });
  on('#rLab','change',e=>{ RV.labels=+e.target.value||0; VIEWS.roles(); });
};

/* ======================= ΠΡΟΦΙΛ ΠΑΙΚΤΗ ======================= */
const PV = { id:null, cmp:null };
function similar(p, n=8){
  const R = ROLES[p._role], pool = PL.filter(q=>q._role===p._role && qualified(q) && q.id!==p.id);
  const vec = q=>R.m.map(k=>pct(q,k)/100-.5), a = vec(p), na = Math.hypot(...a)||1;
  return pool.map(q=>{ const b=vec(q); return { q, sim: sum(a.map((x,i)=>x*b[i]))/(na*(Math.hypot(...b)||1)) }; }).sort((x,y)=>y.sim-x.sim).slice(0,n);
}
VIEWS.profile = function(arg){
  if(arg && PBY[arg]) PV.id = +arg;
  if(!PV.id || !PBY[PV.id]) PV.id = (myTeamPlayers().filter(qualified).sort((a,b)=>b._score-a._score)[0] || PL[0]).id;
  const p = PBY[PV.id], R = ROLES[p._role], c = PV.cmp && PBY[PV.cmp] && PBY[PV.cmp]._role===p._role ? PBY[PV.cmp] : null;
  const axes = R.m.map(k=>M[k].l);
  const series = [{ name:p.name, color:COL.red, values:R.m.map(k=>pct(p,k)), raw:R.m.map(k=>fv(p,k)) }];
  if(c) series.push({ name:c.name, color:COL.white, values:R.m.map(k=>pct(c,k)), raw:R.m.map(k=>fv(c,k)) });
  const sims = similar(p), cheaper = sims.filter(s=>(s.q.value||0) < (p.value||0));
  const rolePeers = PL.filter(q=>q._role===p._role).sort((a,b)=>a.name.localeCompare(b.name,'el'));
  const lgAvgName = leagueName(p.league);
  const amort = p.fee ? p.fee/(p.feeYears||4) : 0;
  $('#view').innerHTML = `
  <div class="row noprint" style="margin-bottom:14px">
    <label class="f" style="min-width:260px">Παίκτης<input list="plList" id="pSel" value="${esc(p.name)} — ${esc(p.team)}"></label>
    <label class="f" style="min-width:260px">Σύγκριση με (ίδιος ρόλος)<select id="pCmp"><option value="">—</option>${opts(rolePeers.filter(q=>q.id!==p.id).map(q=>[q.id,`${q.name} (${q.team})`]), c?c.id:'')}</select></label>
    <datalist id="plList">${PL.map(q=>`<option value="${esc(q.name)} — ${esc(q.team)}">`).join('')}</datalist>
    <span style="flex:1"></span>${star(p)}<button class="btn" onclick="svgToPng(document.getElementById('pRad'),'radar_${esc(p.name).replace(/\s/g,'_')}')">🖼 Radar PNG</button><button class="btn" data-go="portfolio" data-arg="player">📣 Post</button><button class="btn" onclick="window.print()">🖨</button></div>
  <div class="grid g3">
    <div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start"><div>
      <div style="font-size:21px;font-weight:800">${esc(p.name)} ${scoutBadge(p)}</div><div class="muted">${esc(p.team)} · ${esc(lgAvgName)}</div></div>
      <div style="text-align:center"><div class="score" style="color:${scoreCol(p._score)}">${Math.round(p._score)}</div><div class="small muted">score ρόλου</div></div></div>
      <div class="row" style="margin:10px 0"><span class="tag r">${POS_FULL[p.pos]}</span><span class="tag">${p.age} ετών</span>${p.foot?`<span class="tag">Πόδι ${p.foot}</span>`:''}<span class="tag">${p.min}′ (${(p.min/90).toFixed(1)} × 90′)</span></div>
      <table class="t"><tr><td class="l">Εκτιμώμενη αξία</td><td><b>${fmtK(p.value)}</b></td></tr>
        <tr><td class="l">Αναμενόμενη αξία (μοντέλο)</td><td>${fmtK(p._expVal)} ${p._under?`<span class="tag ${p._under>1.4?'g':p._under<.7?'r':''}">×${p._under.toFixed(2)}</span>`:''}</td></tr>
        <tr><td class="l">Μισθός / έτος</td><td><b>${p.wage?fmtK(p.wage):'–'}</b></td></tr>
        <tr><td class="l">Δίκαιος μισθός (μοντέλο)</td><td>${fmtK(p._expWage)} ${vfmTag(p)}</td></tr>
        <tr><td class="l">Κόστος ανά 90′</td><td>${p.wage&&p.min?fmtK(p.wage/(p.min/90)):'–'}</td></tr>
        <tr><td class="l">Λήξη συμβολαίου</td><td>${p.contract?'Ιούνιος '+p.contract:'–'} ${p.contract&&p.contract<=2027?'<span class="tag r">λήγει</span>':''}</td></tr>
        ${amort?`<tr><td class="l">Απόσβεση μεταγραφής</td><td>${fmtK(amort)}/έτος (${fmtK(p.fee)} / ${p.feeYears} έτη)</td></tr>`:''}
        <tr><td class="l">Γκολ / Ασίστ</td><td>${p.goals||0} / ${p.ast||0} <span class="small muted">(npxG ${fmt(p.npxg,1)} · xA ${fmt(p.xa,1)})</span></td></tr></table>
      ${!qualified(p)?`<div class="find weak" style="margin-top:10px"><span class="ic">⚠</span><div><b>Μικρό δείγμα</b><span class="small muted">Κάτω από ${S.settings.minMin}′ — τα per-90 είναι αναξιόπιστα.</span></div></div>`:''}</div>
    ${notesCardHTML(p)}
    <div class="card"><h3>🕸️ Radar εκατοστημορίων — ${esc(R.l)}</h3>${radarSVG(axes, series, { id:'pRad' })}
      <div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}<span>0 = κέντρο · 100 = καλύτερος</span></div></div>
    <div class="card"><h3>📏 Μετρικές vs Μ.Ο. ${esc(leagueShort(p.league))}</h3><table class="t"><tr><th class="l">Μετρική</th><th>Παίκτης</th>${c?`<th>${esc(c.name.split(' ').slice(-1)[0])}</th>`:''}<th>Μ.Ο.</th><th>Εκατ.</th></tr>
      ${R.m.concat(['npxg','xa','progP','progC','pressures','recov'].filter(k=>!R.m.includes(k)&&p._role!=='GK')).map(k=>{ const pc=pct(p,k), av=roleAvg(p._role,k,p.league);
        return `<tr><td class="l"${mtip(k)}>${esc(M[k].l)} <span class="muted small">ⓘ</span></td><td><b>${fv(p,k)}</b></td>${c?`<td>${fv(c,k)}</td>`:''}<td class="muted">${M[k].t==='pct'||M[k].t==='raw'?av.toFixed(1):av.toFixed(2)}</td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><div class="pb" style="width:70px"><i style="width:${pc}%"></i></div><span class="small">${Math.round(pc)}</span></div></td></tr>`; }).join('')}</table></div>
    <div class="card"><h3>🔥 Heatmap (επίδειξη)</h3>${p.imported?'<div class="empty">Χωρίς δεδομένα θέσης για εισαγόμενους παίκτες.</div>':heatSVG(genTouches(p))}</div>
    <div class="card"><h3>🧩 Ταίριασμα σε ρόλους</h3>${bestRoles(p,7).map(b=>`<div class="bars"><div class="b"><span>${esc(ARCH[b.a].l)} <span class="muted small">${esc(b.r)}</span></span><div class="track"><div class="fill" style="width:${b.f}%;background:${fitCol(b.f)}"></div></div><b style="text-align:right">${Math.round(b.f)}%</b></div></div>`).join('')}
      <div class="small muted" style="margin-top:6px">Συστήματα όπου θα ήταν βασικός: ${SYSTEMS.filter(s=>bestXI(s,myTeamPlayers().filter(q=>q.id!==p.id).concat([p])).slots.some(sl=>sl.p&&sl.p.id===p.id)).slice(0,6).map(s=>`<a data-go="fit" data-arg="${s.id}">${esc(s.f)} ${esc(s.c.split(' ').slice(-1)[0])}</a>`).join(' · ')||'—'}</div>
      ${p.team===S.settings.myTeam?`<button class="btn sm" data-go="contracts" data-arg="${p.id}" style="margin-top:8px">✍️ Συμβόλαιο & διαπραγμάτευση</button>`:''}</div>
    <div class="card span2"><h3>🧬 Όμοιοι παίκτες (cosine similarity στο προφίλ εκατοστημορίων)</h3>
      <table class="t"><tr><th class="l">Παίκτης</th><th class="l">Ομάδα</th><th>Ηλ.</th><th>Ομοιότητα</th><th>Score</th><th>Αξία k€</th><th>Μισθός k€</th><th></th></tr>
      ${sims.map(s=>`<tr><td class="l">${plink(s.q)}</td><td class="l small">${esc(s.q.team)}</td><td>${s.q.age}</td><td>${Math.round(s.sim*100)}%</td><td style="color:${scoreCol(s.q._score)}">${Math.round(s.q._score)}</td><td>${s.q.value||'–'} ${(s.q.value||0)<(p.value||0)*.6?'<span class="tag g">φθηνότερος</span>':''}</td><td>${s.q.wage||'–'}</td><td><button class="btn sm" data-cmp="${s.q.id}">Σύγκριση</button> ${star(s.q)}</td></tr>`).join('')}</table>
      <div class="small muted" style="margin-top:6px">${cheaper.length?`💡 ${cheaper.length} από τους ${sims.length} πιο όμοιους κοστίζουν λιγότερο — πιθανές εναλλακτικές / αντικαταστάτες.`:''}</div></div>
  </div>`;
  on('#pSel','change',e=>{ const v=e.target.value, q=PL.find(q=>`${q.name} — ${q.team}`===v) || PL.find(q=>normName(q.name).includes(normName(v.split(' — ')[0]))); if(q){ PV.cmp=null; go('profile', q.id); } });
  on('#pCmp','change',e=>{ PV.cmp=+e.target.value||null; VIEWS.profile(); });
  $$('[data-cmp]').forEach(b=>b.onclick=()=>{ PV.cmp=+b.dataset.cmp; VIEWS.profile(); });
  bindNotes(p);
};

/* ======================= ΡΟΣΤΕΡ & ΜΠΑΤΖΕΤ ======================= */
const SQ = { sort:'_score', dir:-1 };
VIEWS.squad = function(){
  const st = S.settings, sq = myTeamPlayers(), T = DB.teamByName[st.myTeam], A = teamAgg(T);
  if(!sq.length){ $('#view').innerHTML = `<div class="card empty">Η ομάδα «${esc(st.myTeam)}» δεν έχει παίκτες. Όρισε την ομάδα σου στα <a data-go="data">Δεδομένα & Ρυθμίσεις</a>.</div>`; return; }
  const wages = sum(sq.map(p=>p.wage||0)), amort = sum(sq.map(p=>p.fee?p.fee/(p.feeYears||4):0));
  const cost = wages + amort + (+st.agentFees||0), ratio = st.revenue ? cost/st.revenue : 0;
  const SL = S.shortlist.map(s=>({ ...s, p:PBY[s.id] })).filter(s=>s.p && s.p.team!==st.myTeam);
  const slFees = sum(SL.map(s=>+s.fee||0)), slWages = sum(SL.map(s=>+s.wage||0)), slAmort = sum(SL.map(s=>(+s.fee||0)/(+s.years||4)));
  const sells = sq.filter(p=>(p._vfm!=null && p._vfm<.7 && p.min<LEAGUES[T?T.league:'L1']?.rounds*90*.4) || (p.age>=31 && p.contract<=2027) || (p._vfm!=null&&p._vfm<.55)).sort((a,b)=>(a._vfm||1)-(b._vfm||1));
  const sellSave = sum(sells.map(p=>p.wage||0));
  const newCost = cost + slWages + slAmort, newRatio = st.revenue ? newCost/st.revenue : 0, newRatioSell = st.revenue ? (newCost-sellSave)/st.revenue : 0;
  const u23 = sum(sq.filter(p=>p.age<23).map(p=>p.min))/Math.max(1,sum(sq.map(p=>p.min)));
  const getS = p => SQ.sort==='_amort' ? (p.fee?p.fee/(p.feeYears||4):0) : SQ.sort==='_c90' ? (p.wage/(Math.max(p.min,1)/90)) : typeof p[SQ.sort]==='string' ? p[SQ.sort] : (+p[SQ.sort]||0);
  const rows = sq.slice().sort((a,b)=>{ const x=getS(a),y=getS(b); return (typeof x==='string'?x.localeCompare(y,'el'):x-y)*SQ.dir; });
  const th = (k,l,cls='')=>`<th data-s="${k}" class="${cls}">${l}${SQ.sort===k?(SQ.dir<0?' ▼':' ▲'):''}</th>`;
  // Βάθος ρόστερ
  const need = { GK:2, CB:4, FB:4, CM:6, FW:5 };
  const depth = Object.keys(ROLES).map(r=>{ const ps=sq.filter(p=>p._role===r), q=ps.filter(qualified); return { r, n:ps.length, avg:q.length?mean(q.map(p=>p._score)):0, age:mean(ps.map(p=>p.age)), best:ps.sort((a,b)=>b._score-a._score)[0], need:need[r] }; });
  const prio = depth.slice().sort((a,b)=>(a.avg - (a.n<a.need?15:0)) - (b.avg - (b.n<b.need?15:0)))[0];
  // Scatter score vs μισθός + καμπύλη δίκαιου μισθού
  const lgTop = sq[0] ? isTop(sq[0]) : 1;
  const curve = WAGE_B ? Array.from({length:21},(_,i)=>{ const s=i*5; return [s, Math.exp(WAGE_B[0]+WAGE_B[1]*s+WAGE_B[2]*lgTop)]; }) : null;
  const pts = sq.filter(p=>p.wage).map(p=>({ x:p._score, y:p.wage, id:p.id, label:p.name.split(' ').slice(-1)[0], showLabel:true, color: p._vfm>=1.35?COL.gold:p._vfm<.65?COL.red:COL.white, op:.9,
    tip:`<b>${esc(p.name)}</b><br>Score ${Math.round(p._score)} · μισθός ${p.wage}k€<br>Δίκαιος: ${Math.round(p._expWage)}k€ (×${(p._vfm||0).toFixed(2)})` }));
  const years = [2027,2028,2029,2030,2031];
  $('#view').innerHTML = `
  <div class="card"><h3>🏦 Οικονομικά δεδομένα συλλόγου (χιλ.€ / σεζόν)</h3><div class="row">
    <label class="f">Έσοδα σεζόν<input type="number" id="bRev" value="${st.revenue}" step="100"></label>
    <label class="f">Μεταγραφικό budget<input type="number" id="bTB" value="${st.transferBudget}" step="50"></label>
    <label class="f">Αμοιβές ατζέντηδων / έτος<input type="number" id="bAg" value="${st.agentFees}" step="10"></label>
    <button class="btn pri" id="bSave" style="align-self:flex-end">Υπολογισμός</button></div></div>
  <div class="grid g5" style="margin-top:14px">
    ${kpi('Μισθολόγιο', fmtK(wages), `${sq.length} παίκτες · Μ.Ο. ${fmtK(wages/sq.length)}`)}
    ${kpi('Αποσβέσεις / έτος', fmtK(amort), 'κόστος μεταγραφών ÷ έτη συμβολαίου')}
    ${kpi('Squad cost ratio', `<span style="color:${ratio>.7?'var(--red2)':'#fff'}">${(ratio*100).toFixed(0)}%</span>`, `Όριο UEFA 70% · ${ratio>.7?'⚠ εκτός ορίου':'εντός ορίου'}`)}
    ${kpi('Κόστος ανά βαθμό', A?fmtK(cost/Math.max(1,A.pts)):'–', A?`${A.pts} βαθμοί · κόστος/xG ${fmtK(cost/Math.max(1,A.xgf))}`:'')}
    ${kpi('Μ.Ο. ηλικίας · λεπτά U23', `${mean(sq.map(p=>p.age)).toFixed(1)} · ${(u23*100).toFixed(0)}%`, 'Ηλικιακό προφίλ ρόστερ')}
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>💶 Value for money: απόδοση vs μισθός<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('sqSc'),'value_for_money')">PNG</button></h3>
      ${scatterSVG(pts,{ id:'sqSc', xl:'Score ρόλου (0–100)', yl:'Μισθός (χιλ.€/έτος)', curve, curveLabel:'δίκαιος μισθός' })}
      <div class="legend"><span><i style="background:${COL.gold}"></i>Value (×1,35+)</span><span><i style="background:${COL.white}"></i>Δίκαιο</span><span><i style="background:${COL.red}"></i>Υπερπληρωμένος</span><span>Καμπύλη: μοντέλο log(μισθός) ~ score + κατηγορία (όλη η αγορά)</span></div></div>
    <div class="card"><h3>🧱 Βάθος ρόστερ & προτεραιότητες</h3><table class="t"><tr><th class="l">Ρόλος</th><th>Παίκτες</th><th>Στόχος</th><th>Μ.Ο. score</th><th>Μ.Ο. ηλ.</th><th class="l">Καλύτερος</th></tr>
      ${depth.map(d=>`<tr class="${d===prio?'me':''}"><td class="l">${esc(ROLES[d.r].l)}</td><td style="color:${d.n<d.need?'var(--red2)':'#fff'}">${d.n}</td><td class="muted">${d.need}</td><td><b style="color:${scoreCol(d.avg)}">${Math.round(d.avg)}</b></td><td>${d.age.toFixed(1)}</td><td class="l">${d.best?plink(d.best):'–'}</td></tr>`).join('')}</table>
      <div class="find weak" style="margin-top:10px"><span class="ic">🎯</span><div><b>Προτεραιότητα μεταγραφών: ${esc(ROLES[prio.r].l)}</b><span class="small muted">Χαμηλότερο μέσο score${prio.n<prio.need?' και έλλειψη αριθμού':''}. <a data-go="money">Βρες υποτιμημένους →</a></span></div></div>
      <h3 style="margin-top:14px">📅 Λήξεις συμβολαίων</h3>${years.map(y=>{ const ps=sq.filter(p=>p.contract===y); return `<div style="margin:6px 0"><b class="${y===2027?'dn':''}">${y}</b> <span class="small muted">(${ps.length} · ${fmtK(sum(ps.map(p=>p.wage||0)))} μισθοί)</span><div>${ps.map(p=>`<span class="tag ${y===2027&&p._score>60?'r':''}" style="margin:2px">${plink(p)}</span>`).join('')}</div></div>`; }).join('')}</div>
    <div class="card span2"><h3>📋 Ρόστερ — οικονομική εικόνα<span class="sp"></span><button class="btn sm" id="sqCsv">⬇ CSV</button></h3><div class="tbl-wrap"><table class="t" id="sqT"><tr>${th('name','Παίκτης','l')}${th('pos','Θέση')}${th('age','Ηλ.')}${th('min','Λεπτά')}${th('_score','Score')}${th('wage','Μισθός')}${th('_expWage','Δίκαιος')}${th('_vfm','VfM')}${th('_c90','Κόστος/90′')}${th('value','Αξία')}${th('_expVal','Αξία (μοντ.)')}${th('contract','Λήξη')}${th('_amort','Απόσβεση/έτ.')}</tr>
      ${rows.map(p=>`<tr><td class="l click" data-pid="${p.id}">${esc(p.name)}</td><td>${POS_L[p.pos]}</td><td>${p.age}</td><td>${p.min}</td><td><b style="color:${scoreCol(p._score)}">${Math.round(p._score)}</b></td><td>${p.wage||'–'}</td><td class="muted">${p._expWage?Math.round(p._expWage):'–'}</td><td>${vfmTag(p)}</td><td>${p.wage&&p.min?(p.wage/(p.min/90)).toFixed(1):'–'}</td><td>${p.value||'–'}</td><td class="muted">${p._expVal?Math.round(p._expVal):'–'}</td><td class="${p.contract<=2027?'dn':''}">${p.contract||'–'}</td><td>${p.fee?Math.round(p.fee/(p.feeYears||4)):'–'}</td></tr>`).join('')}</table></div>
      <div class="small muted" style="margin-top:6px">Ποσά σε χιλ.€. «Δίκαιος» = μισθός που αντιστοιχεί στην απόδοση βάσει όλης της αγοράς. VfM = δίκαιος ÷ πραγματικός.</div></div>
    <div class="card span2"><h3>⭐ Λίστα μεταγραφών — προσομοίωση budget</h3>
      ${SL.length?`<div class="tbl-wrap"><table class="t"><tr><th class="l">Στόχος</th><th class="l">Ομάδα</th><th>Θέση</th><th>Ηλ.</th><th>Score</th><th>Αξία</th><th>Κόστος μεταγρ.</th><th>Μισθός/έτ.</th><th>Έτη</th><th>Απόσβ./έτ.</th><th></th></tr>
      ${SL.map((s,i)=>`<tr><td class="l">${plink(s.p)}</td><td class="l small">${esc(s.p.team)}</td><td>${POS_L[s.p.pos]}</td><td>${s.p.age}</td><td style="color:${scoreCol(s.p._score)}">${Math.round(s.p._score)}</td><td>${s.p.value||'–'}</td>
        <td><input type="number" data-sl="${i}" data-f="fee" value="${s.fee}" style="width:90px"></td><td><input type="number" data-sl="${i}" data-f="wage" value="${s.wage}" style="width:80px"></td><td><input type="number" data-sl="${i}" data-f="years" value="${s.years||4}" min="1" max="6" style="width:56px"></td><td>${Math.round((+s.fee||0)/(+s.years||4))}</td><td><button class="btn sm" data-star="${s.id}">✕</button></td></tr>`).join('')}</table></div>
      <div class="grid g4" style="margin-top:12px">
        ${kpi('Κόστος μεταγραφών', fmtK(slFees), `Budget ${fmtK(st.transferBudget)} · <b style="color:${slFees>st.transferBudget?'var(--red2)':'#fff'}">υπόλοιπο ${fmtK(st.transferBudget-slFees)}</b>`)}
        ${kpi('Νέοι μισθοί / έτος', fmtK(slWages), `+ αποσβέσεις ${fmtK(slAmort)}/έτος`)}
        ${kpi('Squad cost ratio μετά', `<span style="color:${newRatio>.7?'var(--red2)':'#fff'}">${(newRatio*100).toFixed(0)}%</span>`, `από ${(ratio*100).toFixed(0)}% σήμερα`)}
        ${kpi('…και με τις πωλήσεις', `<span style="color:${newRatioSell>.7?'var(--red2)':'#fff'}">${(newRatioSell*100).toFixed(0)}%</span>`, `αν φύγουν οι ${sells.length} υποψήφιοι (−${fmtK(sellSave)})`)}
      </div>`:`<div class="empty">Άδεια λίστα. Πρόσθεσε στόχους με ☆ από την Αγορά, τους Ρόλους, το Προφίλ ή το Moneyball.</div>`}</div>
    <div class="card span2"><h3>📤 Υποψήφιοι για πώληση / μη ανανέωση</h3>
      ${sells.length?`<table class="t"><tr><th class="l">Παίκτης</th><th>Ηλ.</th><th>Λεπτά</th><th>Score</th><th>Μισθός</th><th>VfM</th><th>Λήξη</th><th class="l">Λόγος</th></tr>${sells.map(p=>`<tr><td class="l">${plink(p)}</td><td>${p.age}</td><td>${p.min}</td><td>${Math.round(p._score)}</td><td>${p.wage}</td><td>${vfmTag(p)}</td><td>${p.contract}</td><td class="l small muted">${[p._vfm<.7?'μισθός πάνω από την απόδοση':'', p.age>=31&&p.contract<=2027?'31+ με λήξη 2027':'', p.min<900?'λίγα λεπτά':''].filter(Boolean).join(' · ')}</td></tr>`).join('')}</table>`:'<div class="muted">Κανένας εμφανής υποψήφιος.</div>'}</div>
  </div>`;
  on('#bSave','click',()=>{ st.revenue=+$('#bRev').value||0; st.transferBudget=+$('#bTB').value||0; st.agentFees=+$('#bAg').value||0; save(); VIEWS.squad(); });
  $$('#sqT th[data-s]').forEach(h=>h.onclick=()=>{ const k=h.dataset.s; SQ.dir = SQ.sort===k?-SQ.dir:(['name','pos','age','contract'].includes(k)?1:-1); SQ.sort=k; VIEWS.squad(); });
  $$('[data-sl]').forEach(inp=>inp.onchange=()=>{ const s = S.shortlist.find(x=>x.id===SL[+inp.dataset.sl].id); s[inp.dataset.f]=+inp.value||0; save(); VIEWS.squad(); });
  $$('#view [data-star]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>VIEWS.squad(),0)));
  on('#sqCsv','click',()=>exportPlayersCSV(sq,'squad.csv'));
};

/* ======================= MONEYBALL ======================= */
const MB = { role:'', lg:'L2', maxVal:400, maxAge:27, minScore:55 };
VIEWS.money = function(){
  const pool = PL.filter(p=>qualified(p) && p.value>0 && p._expVal && (!MB.role || p._role===MB.role));
  const cand = pool.filter(p=>(!MB.lg || p.league===MB.lg) && p.value<=MB.maxVal && p.age<=MB.maxAge && p._score>=MB.minScore)
    .map(p=>({ p, idx: p._under * (p._score/60) * (p.age<=23?1.15:1) * (p.contract<=2027?1.1:1) })).sort((a,b)=>b.idx-a.idx);
  const top = new Set(cand.slice(0,12).map(c=>c.p.id));
  const pts = pool.filter(p=>!MB.lg || p.league===MB.lg).map(p=>({ x:p._score, y:Math.log10(p.value), id:p.id, label:p.name, showLabel:top.has(p.id),
    color: top.has(p.id)?COL.gold : p._under>1.4?COL.red : '#5b6478', op: top.has(p.id)?1:.55, r: top.has(p.id)?6.5:4.5, z: top.has(p.id)?2:0,
    tip:`<b>${esc(p.name)}</b> · ${esc(p.team)}<br>Score ${Math.round(p._score)} · ${p.age} ετών<br>Αξία ${p.value}k€ · μοντέλο ${Math.round(p._expVal)}k€ (×${p._under.toFixed(2)})` }));
  // καμπύλη αναμενόμενης αξίας για τυπικό παίκτη 25 ετών, πλήρης συμμετοχή
  const lgT = MB.lg==='L2'?0:1;
  const curve = VAL_B ? Array.from({length:21},(_,i)=>{ const s=i*5; return [s, Math.log10(Math.exp(sum([1,s,25,625,lgT,1].map((x,k)=>x*VAL_B[k]))))]; }) : null;
  $('#view').innerHTML = `
  <div class="card hero"><h3>💎 Moneyball: υψηλή απόδοση, χαμηλή τιμή</h3><div class="small muted">Μοντέλο αγοράς: log(αξία) ~ score ρόλου + ηλικία + ηλικία² + κατηγορία + συμμετοχή (OLS σε όλους τους παίκτες ≥${S.settings.minMin}′). Δείκτης Moneyball = αναμενόμενη ÷ πραγματική αξία × απόδοση, με μπόνους για U23 και λήξη συμβολαίου 2027 (ευκαιρία ελεύθερης/φθηνής μεταγραφής).</div></div>
  <div class="card" style="margin-top:14px"><div class="grid g5">
    <label class="f">Ρόλος<select id="mbR"><option value="">Όλοι</option>${opts(Object.entries(ROLES).map(([k,r])=>[k,r.l]), MB.role)}</select></label>
    <label class="f">Διοργάνωση<select id="mbL">${leagueOpts(MB.lg)}</select></label>
    <label class="f">Μέγ. αξία (χιλ.€)<input type="number" id="mbV" value="${MB.maxVal}" step="50"></label>
    <label class="f">Μέγ. ηλικία<input type="number" id="mbA" value="${MB.maxAge}"></label>
    <label class="f">Ελάχ. score<input type="number" id="mbS" value="${MB.minScore}" step="5"></label></div></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>📉 Απόδοση vs αξία (log)<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('mbSc'),'moneyball')">PNG</button><button class="btn sm" data-go="portfolio" data-arg="moneyball">📣 Post</button></h3>
      ${scatterSVG(pts,{ id:'mbSc', xl:'Score ρόλου (0–100)', yl:'log10(αξία χιλ.€)', curve, curveLabel:'αναμενόμενη αξία (25 ετών)' })}
      <div class="legend"><span><i style="background:${COL.gold}"></i>Top Moneyball</span><span><i style="background:${COL.red}"></i>Υποτιμημένοι (×1,4+)</span><span>Κάτω από την καμπύλη, δεξιά = φθηνή απόδοση</span></div></div>
    <div class="card"><h3>🏅 Top ${Math.min(20,cand.length)} ευκαιρίες (${cand.length} υποψήφιοι)</h3><div class="tbl-wrap" style="max-height:520px"><table class="t"><tr><th></th><th class="l">Παίκτης</th><th>Θέση</th><th>Ηλ.</th><th>Score</th><th>Αξία</th><th>Μοντέλο</th><th>×</th><th>Λήξη</th></tr>
      ${cand.slice(0,20).map(c=>{ const p=c.p; return `<tr><td>${star(p)}</td><td class="l">${plink(p)}<div class="small muted">${esc(p.team)}</div></td><td>${POS_L[p.pos]}</td><td>${p.age}</td><td><b style="color:${scoreCol(p._score)}">${Math.round(p._score)}</b></td><td>${p.value}</td><td class="muted">${Math.round(p._expVal)}</td><td><span class="tag ${p._under>1.4?'g':''}">${p._under.toFixed(2)}</span></td><td class="${p.contract<=2027?'dn':''}">${p.contract}</td></tr>`; }).join('')||'<tr><td colspan="9" class="empty">Κανένας — χαλάρωσε τα φίλτρα.</td></tr>'}</table></div></div>
  </div>`;
  const b=(id,k,num=true)=>on(id,'change',e=>{ MB[k]=num?+e.target.value:e.target.value; VIEWS.money(); });
  b('#mbR','role',false); b('#mbL','lg',false); b('#mbV','maxVal'); b('#mbA','maxAge'); b('#mbS','minScore');
};
