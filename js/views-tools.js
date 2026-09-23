'use strict';
/* ===== Εργαλεία (xG · Poisson · ACWR) · Πορτφόλιο & Προσέγγιση · Ακαδημία ===== */

/* ======================= ΕΡΓΑΛΕΙΑ ======================= */
const TL = { tab:'xg', shot:{ x:106, y:34 }, head:false, sit:'', home:null, away:null, lh:'', la:'', acwrSort:'r' };
VIEWS.tools = function(arg){
  if(arg && ['xg','poisson','acwr'].includes(arg)) TL.tab = arg;
  $('#view').innerHTML = `<div class="tabs">${[['xg','🎯 Υπολογιστής xG'],['poisson','🔮 Πρόβλεψη αγώνα (Poisson)'],['acwr','🩺 Φορτίο & τραυματισμοί (ACWR)']].map(([k,l])=>`<button class="${TL.tab===k?'on':''}" data-tab="${k}">${l}</button>`).join('')}</div><div id="toolBox"></div>`;
  $$('[data-tab]').forEach(b=>b.onclick=()=>{ TL.tab=b.dataset.tab; VIEWS.tools(); });
  ({ xg:toolXG, poisson:toolPoisson, acwr:toolACWR })[TL.tab]();
};
function toolXG(){
  const { x, y } = TL.shot, g = shotGeom(x,y), xg = xgModel(x,y,TL.head,TL.sit);
  let under='';
  for(let i=60;i<120;i+=2) for(let j=0;j<80;j+=2){ const v = xgModel(i+1,j+1,TL.head,TL.sit==='penalty'?'':TL.sit); if(v<.02) continue; under+=`<rect x="${i}" y="${j}" width="2" height="2" fill="${COL.red}" fill-opacity="${Math.min(.85,v*1.6).toFixed(2)}"/>`; }
  const px = TL.sit==='penalty'?108:x, py = TL.sit==='penalty'?40:y;
  const inner = `<line x1="${px}" y1="${py}" x2="120" y2="36" stroke="#fff" stroke-width=".3" stroke-dasharray="1 1"/><line x1="${px}" y1="${py}" x2="120" y2="44" stroke="#fff" stroke-width=".3" stroke-dasharray="1 1"/>
    <circle cx="${px}" cy="${py}" r="1.6" fill="${COL.gold}" stroke="#000" stroke-width=".3"/>
    <text x="${px}" y="${py-2.6}" font-size="2.6" fill="#fff" text-anchor="middle" paint-order="stroke" stroke="#000" stroke-width=".5">xG ${xg.toFixed(2)}</text>`;
  $('#toolBox').innerHTML = `<div class="grid g32">
    <div class="card"><h3>Κάνε κλικ στο γήπεδο για να «σουτάρεις»</h3>${pitchSVG(inner,{ half:true, under, id:'xgPitch', click:true })}
      <div class="small muted" style="margin-top:6px">Χρωματική ένταση = xG από κάθε σημείο με τις τρέχουσες ρυθμίσεις.</div></div>
    <div class="card"><h3>Αποτέλεσμα</h3>
      <div class="score" style="font-size:44px;color:var(--red2)">${xg.toFixed(3)}</div><div class="muted">πιθανότητα γκολ ≈ ${(xg*100).toFixed(1)}% · 1 στα ${Math.max(1,Math.round(1/xg))}</div><hr>
      <div class="row"><label class="small"><input type="checkbox" id="xgH" ${TL.head?'checked':''}> Κεφαλιά</label>
        <select id="xgS">${opts([['','Ανοιχτό παιχνίδι'],['counter','Αντεπίθεση'],['directfk','Απευθείας φάουλ'],['penalty','Πέναλτι']], TL.sit)}</select></div>
      <table class="t" style="margin-top:12px"><tr><td class="l">Απόσταση από το κέντρο εστίας</td><td><b>${(g.dist*0.9144).toFixed(1)} μ.</b></td></tr>
        <tr><td class="l">Γωνία ορατής εστίας</td><td><b>${(g.ang*180/Math.PI).toFixed(1)}°</b></td></tr>
        <tr><td class="l">Με το πόδι</td><td>${xgModel(x,y,false,TL.sit).toFixed(3)}</td></tr><tr><td class="l">Με κεφαλιά</td><td>${xgModel(x,y,true,TL.sit).toFixed(3)}</td></tr></table>
      <div class="small muted" style="margin-top:10px">Μοντέλο: logistic regression z = −1,09 + 1,2·γωνία(rad) − 0,12·απόσταση(yd) − 0,7·κεφαλιά. Εκπαιδευτική βαθμονόμηση — για δικό σου μοντέλο με StatsBomb δες <a data-go="academy" data-arg="code">Ακαδημία → Κώδικας</a>.</div></div></div>`;
  const svg = $('#xgPitch');
  svg.addEventListener('click', e=>{ const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); TL.shot = { x:clamp(p.x,60,119.5), y:clamp(p.y,0.5,79.5) }; if(TL.sit==='penalty') TL.sit=''; toolXG(); });
  on('#xgH','change',e=>{ TL.head=e.target.checked; toolXG(); });
  on('#xgS','change',e=>{ TL.sit=e.target.value; toolXG(); });
}
function toolPoisson(){
  TL.home ||= DB.teamByName[S.settings.myTeam] ? S.settings.myTeam : DB.teams[0].name; TL.away ||= S.settings.nextOpp;
  const H = DB.teamByName[TL.home], A = DB.teamByName[TL.away], ha = teamAgg(H), aa = teamAgg(A);
  const autoH = (ha.xgfM + aa.xgaM)/2 * 1.08, autoA = (aa.xgfM + ha.xgaM)/2 * .93;
  const lh = TL.lh!=='' ? +TL.lh : autoH, la = TL.la!=='' ? +TL.la : autoA;
  const pr = matchProbs(lh, la, 10);
  let o15=0,o25=0,o35=0,btts=0; const scores=[];
  for(let i=0;i<=10;i++) for(let j=0;j<=10;j++){ const p=pr.mat[i][j]; if(i+j>1)o15+=p; if(i+j>2)o25+=p; if(i+j>3)o35+=p; if(i>0&&j>0)btts+=p; scores.push([i,j,p]); }
  scores.sort((a,b)=>b[2]-a[2]);
  const mx = pr.mat.slice(0,6).flatMap(r=>r.slice(0,6)).reduce((a,b)=>Math.max(a,b),0);
  const odd = p=>p>0?(1/p).toFixed(2):'–';
  $('#toolBox').innerHTML = `<div class="grid g2">
    <div class="card"><h3>⚙️ Ρυθμίσεις</h3><div class="grid g2">
      <label class="f">Γηπεδούχος<select id="pH">${demoTeamOpts(TL.home)}</select></label><label class="f">Φιλοξενούμενος<select id="pA">${demoTeamOpts(TL.away)}</select></label>
      <label class="f">λ γηπεδούχου (αναμ. γκολ)<input type="number" step="0.05" id="pLH" value="${TL.lh}" placeholder="auto ${autoH.toFixed(2)}"></label>
      <label class="f">λ φιλοξενούμενου<input type="number" step="0.05" id="pLA" value="${TL.la}" placeholder="auto ${autoA.toFixed(2)}"></label></div>
      <div class="small muted" style="margin-top:8px">Auto: λ = (xG υπέρ επίθεσης + xG κατά αντιπάλου) ÷ 2, με πλεονέκτημα έδρας ×1,08 / ×0,93. Τα γκολ κάθε ομάδας θεωρούνται ανεξάρτητες μεταβλητές Poisson.</div>
      <hr><h3>Αποτέλεσμα 1Χ2</h3>${barsHTML([{ l:'1 · '+TL.home, v:pr.h*100, txt:`${(pr.h*100).toFixed(1)}% · @${odd(pr.h)}` },{ l:'Χ · Ισοπαλία', v:pr.d*100, color:COL.gray, txt:`${(pr.d*100).toFixed(1)}% · @${odd(pr.d)}` },{ l:'2 · '+TL.away, v:pr.a*100, color:COL.white, txt:`${(pr.a*100).toFixed(1)}% · @${odd(pr.a)}` }],{max:100})}
      <hr><table class="t"><tr><th class="l">Αγορά</th><th>Πιθανότητα</th><th>Δίκαιη απόδοση</th></tr>
        ${[['Over 1.5',o15],['Over 2.5',o25],['Over 3.5',o35],['Under 2.5',1-o25],['Goal-Goal (BTTS)',btts],['No Goal',1-btts]].map(([l,p])=>`<tr><td class="l">${l}</td><td>${(p*100).toFixed(1)}%</td><td>${odd(p)}</td></tr>`).join('')}</table>
      <div class="small muted" style="margin-top:8px">Εργαλείο ανάλυσης/προετοιμασίας — όχι συμβουλή στοιχηματισμού.</div></div>
    <div class="card"><h3>🎲 Πίνακας πιθανοτήτων σκορ</h3>
      <table class="t" style="text-align:center"><tr><th class="l">${esc(TL.home.split(' ')[0])} \\ ${esc(TL.away.split(' ')[0])}</th>${[0,1,2,3,4,5].map(j=>`<th>${j}</th>`).join('')}</tr>
      ${[0,1,2,3,4,5].map(i=>`<tr><th class="l">${i}</th>${[0,1,2,3,4,5].map(j=>`<td><span class="hc" style="${heatBg(100*pr.mat[i][j]/mx)}">${(pr.mat[i][j]*100).toFixed(1)}</span></td>`).join('')}</tr>`).join('')}</table>
      <h3 style="margin-top:14px">Πιθανότερα σκορ</h3>${barsHTML(scores.slice(0,8).map(([i,j,p])=>({ l:`${i} – ${j}`, v:p*100, txt:(p*100).toFixed(1)+'%', color:i>j?COL.red:i===j?COL.gray:COL.white })),{max:scores[0][2]*100})}
      <div class="grid g2" style="margin-top:12px">${kpi('Αναμενόμενα γκολ', (lh+la).toFixed(2), `${lh.toFixed(2)} – ${la.toFixed(2)}`)}${kpi('Αναμενόμενοι βαθμοί', `${(3*pr.h+pr.d).toFixed(2)} – ${(3*pr.a+pr.d).toFixed(2)}`, 'xPts γηπεδούχου – φιλοξενούμενου')}</div></div></div>`;
  on('#pH','change',e=>{ TL.home=e.target.value; TL.lh=''; TL.la=''; toolPoisson(); }); on('#pA','change',e=>{ TL.away=e.target.value; TL.lh=''; TL.la=''; toolPoisson(); });
  on('#pLH','change',e=>{ TL.lh=e.target.value; toolPoisson(); }); on('#pLA','change',e=>{ TL.la=e.target.value; toolPoisson(); });
}
function sparkSVG(s){
  const wk = [0,1,2,3,4,5].map(i=>sum(s.slice(i*7,i*7+7))), mx = Math.max(1,...wk);
  return `<svg viewBox="0 0 90 24" width="90" height="24">${wk.map((v,i)=>`<rect x="${i*15+1}" y="${24-22*v/mx}" width="12" height="${22*v/mx}" rx="2" fill="${i===5?COL.red:'#4a5163'}"/>`).join('')}</svg>`;
}
function toolACWR(){
  const sq = myTeamPlayers().filter(p=>p.pos!=='GK' || p.min>0);
  if(!sq.length){ $('#toolBox').innerHTML='<div class="card empty">Δεν υπάρχουν παίκτες στην ομάδα σου.</div>'; return; }
  const rows = sq.map(p=>({ p, a:acwr(p) })).sort((x,y)=> TL.acwrSort==='name' ? x.p.name.localeCompare(y.p.name,'el') : y.a.r-x.a.r);
  const hi = rows.filter(r=>r.a.r>1.5).length, mid = rows.filter(r=>r.a.r>1.3&&r.a.r<=1.5).length, lo = rows.filter(r=>r.a.r<.8).length;
  $('#toolBox').innerHTML = `<div class="grid g4">${kpi('Υψηλός κίνδυνος (>1,5)', `<span class="dn">${hi}</span>`, 'Μείωση φορτίου άμεσα')}${kpi('Προσοχή (1,3–1,5)', mid, 'Παρακολούθηση')}${kpi('Υποφόρτιση (<0,8)', lo, 'Σταδιακή αύξηση')}${kpi('Ασφαλής ζώνη', rows.length-hi-mid-lo, '0,8 – 1,3')}</div>
  <div class="grid g21" style="margin-top:14px">
    <div class="card"><h3>🩺 Acute:Chronic Workload Ratio — ${esc(S.settings.myTeam)}<span class="sp"></span><button class="btn sm" id="acS">${TL.acwrSort==='r'?'Ταξινόμηση: κίνδυνος':'Ταξινόμηση: όνομα'}</button></h3>
      <div class="tbl-wrap"><table class="t"><tr><th class="l">Παίκτης</th><th>Θέση</th><th>6 εβδομάδες</th><th>Acute (7ημ.)</th><th>Chronic (28ημ./4)</th><th>ACWR</th><th class="l">Κατάσταση</th></tr>
      ${rows.map(({p,a})=>`<tr><td class="l">${plink(p)}</td><td>${POS_L[p.pos]}</td><td>${sparkSVG(a.s)}</td><td>${Math.round(a.acute)}</td><td>${Math.round(a.chronic)}</td><td><b class="${a.r>1.5?'dn':''}">${a.r.toFixed(2)}</b></td><td class="l"><span class="tag ${a.st[1]}">${a.st[0]}</span></td></tr>`).join('')}</table></div>
      <div class="small muted" style="margin-top:6px">Επίδειξη: συνθετικά φορτία 42 ημερών + ό,τι καταχωρίσεις. Μονάδες = sRPE (RPE × λεπτά).</div></div>
    <div class="card"><h3>➕ Καταχώριση σημερινής προπόνησης/αγώνα</h3>
      <label class="f">Παίκτης<select id="acP"><option value="all">— Όλη η ομάδα —</option>${opts(sq.map(p=>[p.id,p.name]))}</select></label>
      <div class="grid g2" style="margin-top:8px"><label class="f">RPE (1–10)<input type="number" id="acR" value="6" min="1" max="10"></label><label class="f">Λεπτά<input type="number" id="acM" value="75" min="0" max="200"></label></div>
      <div class="row end" style="margin-top:10px"><span class="small muted" id="acL">= 450 μονάδες</span><button class="btn pri" id="acGo">Καταχώριση</button></div><hr>
      <div class="small"><b>Πώς διαβάζεται</b><ul style="padding-left:18px;margin:6px 0" class="muted"><li><b>0,8–1,3</b>: «sweet spot», χαμηλότερος κίνδυνος.</li><li><b>&gt;1,5</b>: απότομη αύξηση φορτίου — αυξημένος κίνδυνος μυϊκού τραυματισμού.</li><li><b>&lt;0,8</b>: υποπροπόνηση — ο παίκτης δεν είναι έτοιμος για απαιτητικό αγώνα.</li></ul>Ο ACWR είναι δείκτης παρακολούθησης, όχι διάγνωση· συνδύασέ τον με την κρίση του ιατρικού/φυσικοθεραπευτικού τιμ.</div></div></div>`;
  const upd=()=>$('#acL').textContent=`= ${(+$('#acR').value||0)*(+$('#acM').value||0)} μονάδες`;
  on('#acR','input',upd); on('#acM','input',upd);
  on('#acS','click',()=>{ TL.acwrSort = TL.acwrSort==='r'?'name':'r'; toolACWR(); });
  on('#acGo','click',()=>{ const v=(+$('#acR').value||0)*(+$('#acM').value||0), sel=$('#acP').value, d=isoDay(0); const ids = sel==='all'?sq.map(p=>p.id):[+sel];
    for(const id of ids){ S.loads[id] ||= {}; S.loads[id][d] = (S.loads[id][d]||0)+v; } save(); toast(`Καταχωρίστηκαν ${v} μονάδες σε ${ids.length} παίκτη/ες`); toolACWR(); });
}

/* ======================= ΠΟΡΤΦΟΛΙΟ & ΠΡΟΣΕΓΓΙΣΗ ======================= */
const PF = { tpl:'scatter', team:null, target:null };
const HASH = '#FootballAnalytics #DataAnalysis #SuperLeague #Scouting #xG';
VIEWS.portfolio = function(arg){
  if(arg) PF.tpl = arg==='opp'?'opp':arg;
  const tpls = [['scatter','📊 Υποτιμημένοι δημιουργοί (scatter)'],['opp','🕵️ Προεπισκόπηση αγώνα (αντίπαλος)'],['player','👤 Προφίλ παίκτη (radar)'],['moneyball','💎 Moneyball λίστα'],['setpieces','🚩 Ανάλυση στημένων φάσεων'],['pitch','✉️ Pitch προς ομάδα (Πυλώνας 4)']];
  $('#view').innerHTML = `<div class="tabs">${tpls.map(([k,l])=>`<button class="${PF.tpl===k?'on':''}" data-tpl="${k}">${l}</button>`).join('')}</div><div id="pfBox"></div>`;
  $$('[data-tpl]').forEach(b=>b.onclick=()=>{ PF.tpl=b.dataset.tpl; VIEWS.portfolio(); });
  PF.tpl==='pitch' ? pitchTool() : postTool();
};
function postTool(){
  const author = S.settings.author || '[Το όνομά σου]';
  let chart='', li='', x='', title='', extra='';
  const lgName = leagueName('L1');
  if(PF.tpl==='scatter'){
    const pool = PL.filter(p=>['CM','FW'].includes(p._role) && qualified(p) && p.league===(RV.lg||'L1'));
    const mx=mean(pool.map(p=>val(p,'xa'))), my=mean(pool.map(p=>val(p,'kp')));
    const top = pool.map(p=>({p,z:val(p,'xa')/mx+val(p,'kp')/my})).sort((a,b)=>b.z-a.z).slice(0,5);
    const under = top.filter(t=>(t.p._under||0)>1.2);
    const set = new Set(top.map(t=>t.p.id));
    chart = scatterSVG(pool.map(p=>({ x:val(p,'xa'), y:val(p,'kp'), label:p.name, showLabel:set.has(p.id), color:set.has(p.id)?COL.gold:COL.red, r:set.has(p.id)?6.5:4.5, op:set.has(p.id)?1:.5, z:set.has(p.id)?1:0 })),{ id:'pfChart', xl:'xA ανά 90′', yl:'Key passes ανά 90′', xAvg:mx, yAvg:my, qLabel:'ΟΙ ΠΙΟ ΔΗΜΙΟΥΡΓΙΚΟΙ' });
    title = 'Ποιοι είναι οι πιο δημιουργικοί παίκτες της Super League;';
    li = `📊 ${title}\n\nΑνέλυσα ${pool.length} μέσους & επιθετικούς με ${S.settings.minMin}+ λεπτά, συγκρίνοντας την ΠΟΙΟΤΗΤΑ των ευκαιριών που δημιουργούν (xA/90) με την ΠΟΣΟΤΗΤΑ (key passes/90).\n\n🔝 Πάνω δεξιά τεταρτημόριο:\n${top.map((t,i)=>`${i+1}. ${t.p.name} (${t.p.team}) — xA ${fv(t.p,'xa')} · KP ${fv(t.p,'kp')}/90`).join('\n')}\n\n${under.length?`💎 Value: ${under.map(t=>t.p.name).join(', ')} — απόδοση ανώτερη από την εκτιμώμενη αγοραία τους αξία.\n\n`:''}🔎 Μεθοδολογία: per-90 κανονικοποίηση, φίλτρο ${S.settings.minMin}′, διακεκομμένες = μέσος όρος δείγματος.\n\nΠοιον θα έβαζες στη λίστα σου; 👇\n\n${HASH} #Moneyball`;
    x = `Οι πιο δημιουργικοί της Super League (xA/90 × KP/90, ${S.settings.minMin}+′):\n${top.slice(0,3).map((t,i)=>`${i+1}. ${t.p.name} (${t.p.team})`).join('\n')}\n📊👇 #FootballAnalytics #SuperLeague`;
  } else if(PF.tpl==='opp'){
    const t = DB.teamByName[S.settings.nextOpp], A = teamAgg(t), F = oppFindings(t), w = F.filter(f=>f.k==='weak').slice(0,3);
    chart = shotMapSVG(genShots(t,'against'),{ colorBy:'pattern', id:'pfChart' });
    title = `Προεπισκόπηση: πώς «σπάει» η άμυνα της ${t.name};`;
    li = `🕵️ ${title}\n\nΟ χάρτης δείχνει κάθε σουτ που έχει δεχτεί η ${t.name} φέτος (μέγεθος = xG, χρώμα = τύπος φάσης).\n\n📌 Τι λένε τα δεδομένα:\n${w.map(f=>'• '+f.t).join('\n')||'• Ισορροπημένη άμυνα χωρίς έντονες αδυναμίες'}\n\n📈 xGA ${A.xgaM.toFixed(2)}/αγώνα · PPDA ${A.ppda.toFixed(1)} · ${t.style}\n\n🎯 Πλάνο: ${w[0]?w[0].plan:'υπομονή και ποιότητα στο τελευταίο τρίτο.'}\n\n${HASH}`;
    x = `${t.name}: ${w[0]?w[0].t:'σφιχτή άμυνα'}. xGA ${A.xgaM.toFixed(2)}/αγ. Χάρτης σουτ κατά 👇 #SuperLeague #xG`;
  } else if(PF.tpl==='player'){
    const p = PBY[PV.id] || myTeamPlayers()[0], R = ROLES[p._role];
    const best = R.m.map(k=>[k,pct(p,k)]).sort((a,b)=>b[1]-a[1]).slice(0,3);
    chart = radarSVG(R.m.map(k=>M[k].l), [{ name:p.name, color:COL.red, values:R.m.map(k=>pct(p,k)) }], { id:'pfChart' });
    title = `Προφίλ: ${p.name} (${p.team})`;
    li = `👤 ${title}\n\nRadar εκατοστημορίων έναντι ${POOL[p._role].n} παικτών ίδιας θέσης (${S.settings.minMin}+′).\n\n💪 Κορυφαία σημεία:\n${best.map(([k,v])=>`• ${M[k].l}: ${fv(p,k)} → ${Math.round(v)}ο εκατοστημόριο`).join('\n')}\n\n💶 Εκτιμώμενη αξία ${fmtK(p.value)} · αξία βάσει απόδοσης (μοντέλο) ${fmtK(p._expVal)}.\n\nΘα τον ήθελες στην ομάδα σου;\n\n${HASH}`;
    x = `${p.name}: ${best.map(([k,v])=>`${M[k].l} ${Math.round(v)}ο εκατ.`).join(' · ')} 📊 #Scouting`;
    extra = `<div class="small muted" style="margin-top:6px">Παίκτης: ο τελευταίος που άνοιξες στο <a data-go="profile">Προφίλ</a>.</div>`;
  } else if(PF.tpl==='moneyball'){
    const cand = PL.filter(p=>qualified(p) && p.league==='L2' && p._under && p.age<=26 && p._score>=55).sort((a,b)=>b._under*b._score-a._under*a._score).slice(0,8);
    const set = new Set(cand.map(p=>p.id));
    chart = scatterSVG(PL.filter(p=>qualified(p)&&p.league==='L2'&&p.value).map(p=>({ x:p._score, y:Math.log10(p.value), label:p.name, showLabel:set.has(p.id), color:set.has(p.id)?COL.gold:'#5b6478', r:set.has(p.id)?6.5:4.5, z:set.has(p.id)?1:0 })),{ id:'pfChart', xl:'Score απόδοσης ρόλου', yl:'log10(αξία χιλ.€)' });
    title = 'Moneyball: τα «διαμάντια» της Super League 2';
    li = `💎 ${title}\n\nΈφτιαξα μοντέλο που εκτιμά την αγοραία αξία από την απόδοση (percentiles ανά θέση), την ηλικία και την κατηγορία. Αυτοί οι παίκτες ≤26 ετών αποδίδουν πολύ πάνω από την τιμή τους:\n\n${cand.slice(0,6).map((p,i)=>`${i+1}. ${p.name} (${p.team}, ${POS_L[p.pos]}, ${p.age}) — score ${Math.round(p._score)} · αξία ${p.value}k€ vs μοντέλο ${Math.round(p._expVal)}k€`).join('\n')}\n\nΓια σύλλογο με περιορισμένο budget, εδώ βρίσκεται η υπεραξία. 📈\n\n${HASH} #Moneyball #SuperLeague2`;
    x = `Moneyball SL2: ${cand.slice(0,3).map(p=>p.name).join(', ')} — απόδοση πολύ πάνω από την τιμή τους 💎 #SuperLeague2`;
  } else if(PF.tpl==='setpieces'){
    PF.team ||= S.settings.nextOpp;
    const t = DB.teamByName[PF.team], sf = genShots(t,'for').filter(s=>/Κόρνερ|Φάουλ/.test(s.pattern)), sa = genShots(t,'against').filter(s=>/Κόρνερ|Φάουλ/.test(s.pattern)), la = leagueAvg(t.league), A = teamAgg(t);
    const pf = shotProfile(genShots(t,'for')), pa = shotProfile(genShots(t,'against'));
    chart = shotMapSVG(sf.concat(), { colorBy:'pattern', id:'pfChart' });
    title = `Στημένες φάσεις: ${t.name}`;
    li = `🚩 ${title}\n\n⚔️ Επιθετικά: ${sf.length} σουτ από κόρνερ/φάουλ, ${sum(sf.map(s=>s.xg)).toFixed(1)} xG (${Math.round(pf.sp*100)}% της συνολικής απειλής· Μ.Ο. λίγκας ${Math.round(la.spFor*100)}%). Γκολ: ${sf.filter(s=>s.outcome==='Goal').length}.\n🛡️ Αμυντικά: δέχονται ${sum(sa.map(s=>s.xg)).toFixed(1)} xG από στημένες (${Math.round(pa.sp*100)}% του xGA· Μ.Ο. ${Math.round(la.spAg*100)}%) — ${Math.round(100*sa.filter(s=>s.header).length/Math.max(1,sa.length))}% κεφαλιές.\n\n📌 Συμπέρασμα: ${pa.sp>la.spAg+.05?'ευάλωτοι στην άμυνα των στημένων — κάθε κόρνερ εναντίον τους είναι ευκαιρία.':pf.sp>la.spFor+.05?'οι στημένες είναι το «όπλο» τους — πειθαρχία στα φάουλ κοντά στην περιοχή.':'μέσα στον μέσο όρο της λίγκας.'}\n\n${HASH} #SetPieces`;
    x = `${t.name}: ${Math.round(pf.sp*100)}% του xG τους από στημένες, ${Math.round(pa.sp*100)}% του xGA κατά. 🚩📊 #SetPieces`;
    extra = `<label class="f" style="margin-top:8px">Ομάδα<select id="pfTeam">${demoTeamOpts(PF.team)}</select></label>`;
  }
  $('#pfBox').innerHTML = `<div class="grid g2">
    <div class="card"><h3>🖼 Γράφημα<span class="sp"></span><button class="btn pri sm" onclick="svgToPng(document.getElementById('pfChart'),'post_${PF.tpl}')">⬇ PNG για ανάρτηση</button></h3>
      <div style="font-weight:800;font-size:16px;margin-bottom:8px">${esc(title)}</div>${chart}${extra}
      <div class="small muted" style="margin-top:6px">Το PNG περιλαμβάνει υπογραφή «${esc(author)}» — όρισέ την στα <a data-go="data">Δεδομένα & Ρυθμίσεις</a>.</div></div>
    <div class="card"><h3>💼 LinkedIn<span class="sp"></span><button class="btn sm" id="cpLi">📋 Αντιγραφή</button></h3><textarea id="liTxt" rows="16">${esc(li)}</textarea>
      <h3 style="margin-top:12px">𝕏 X / Twitter <span class="small muted" id="xLen"></span><span class="sp"></span><button class="btn sm" id="cpX">📋 Αντιγραφή</button></h3><textarea id="xTxt" rows="4">${esc(x)}</textarea>
      <div class="find info" style="margin-top:10px"><span class="ic">💡</span><div><b>Συμβουλές ανάρτησης</b><span class="small muted">1 γράφημα = 1 μήνυμα · εξήγησε το metric σε μία πρόταση · ανάφερε πηγή δεδομένων (π.χ. «Data: FBref/Opta» ή «StatsBomb Open Data») · δημοσίευε σταθερά (1–2/εβδομάδα) · απάντα σε κάθε σχόλιο. ${S.imported?'':'<b>Τα demo δεδομένα είναι φανταστικά — για δημόσια ανάρτηση φόρτωσε πραγματικά.</b>'}</span></div></div></div></div>`;
  const xl=()=>$('#xLen').textContent=`(${$('#xTxt').value.length}/280)`; xl(); on('#xTxt','input',xl);
  on('#cpLi','click',()=>copyText($('#liTxt').value)); on('#cpX','click',()=>copyText($('#xTxt').value));
  on('#pfTeam','change',e=>{ PF.team=e.target.value; postTool(); });
}
function pitchTool(){
  PF.target ||= DB.teams.find(t=>t.league==='L2')?.name || DB.teams[0].name;
  const t = DB.teamByName[PF.target], A = teamAgg(t), la = leagueAvg(t.league), pa = shotProfile(genShots(t,'against'));
  const ins = [];
  const luck = A.pts-A.xpts;
  if(Math.abs(luck)>2.5) ins.push(luck>0 ? `Η ομάδα έχει ${luck.toFixed(1)} βαθμούς περισσότερους από τα xPoints της (${A.xpts.toFixed(1)}) — υπάρχει ρίσκο «διόρθωσης» αν δεν βελτιωθεί η ποιότητα των ευκαιριών.` : `Η απόδοση (xPoints ${A.xpts.toFixed(1)}) αξίζει ${Math.abs(luck).toFixed(1)} βαθμούς περισσότερους από όσους έχετε — τα δεδομένα δείχνουν ότι η δουλειά αποδίδει και η βαθμολογία θα ακολουθήσει.`);
  if(pa.sp>la.spAg+.04) ins.push(`Το ${Math.round(pa.sp*100)}% του xG που δέχεστε προέρχεται από στημένες φάσεις (Μ.Ο. κατηγορίας ${Math.round(la.spAg*100)}%) — εύκολα διορθώσιμο σημείο με στοχευμένη ανάλυση.`);
  if(pa.late>la.lateAg+.04) ins.push(`Το ${Math.round(pa.late*100)}% του xGA έρχεται μετά το 76′ — ένδειξη για διαχείριση φορτίου/αλλαγών.`);
  if(A.gf-A.xgf<-2) ins.push(`Σκοράρετε ${Math.abs(A.gf-A.xgf).toFixed(1)} γκολ λιγότερα από το xG σας — η δημιουργία υπάρχει, το τελείωμα όχι.`);
  const gem = PL.filter(p=>p.team===t.name && qualified(p) && p._vfm).sort((a,b)=>b._vfm-a._vfm)[0];
  if(gem) ins.push(`Ο ${gem.name} αποδίδει σε επίπεδο (score ${Math.round(gem._score)}) που δικαιολογεί σημαντικά υψηλότερη αξία — κρίσιμος για ανανέωση/μεταπώληση.`);
  if(ins.length<3) ins.push(`PPDA ${A.ppda.toFixed(1)} (Μ.Ο. ${la.ppda.toFixed(1)}): ${A.ppda<la.ppda?'από τις πιο επιθετικές πιέσεις της κατηγορίας':'χαμηλότερη ένταση πίεσης από τον μέσο όρο'}.`);
  const name = S.settings.author || '[Το όνομά σου]';
  const msg = `Θέμα: Δωρεάν ανάλυση δεδομένων για την ${t.name}\n\nΚαλησπέρα σας,\n\nΟνομάζομαι ${name}. Έχω υπόβαθρο στα Οικονομικά και ειδικεύομαι στην ανάλυση ποδοσφαιρικών δεδομένων (xG, pressing, scouting με βάση την απόδοση, value-for-money ρόστερ).\n\nΕτοίμασα μια σύντομη ανάλυση για την ομάδα σας με βάση τα δεδομένα της σεζόν:\n\n${ins.slice(0,4).map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nΘα ήθελα να σας στείλω δωρεάν ένα 2σέλιδο report για τον επόμενο αντίπαλό σας, ώστε να δείτε αν μια τέτοια δουλειά μπορεί να φανεί χρήσιμη στο τεχνικό επιτελείο. Αν σας ενδιαφέρει, προτείνω μια πιλοτική συνεργασία 4 εβδομάδων (εβδομαδιαίο opponent report + dashboard ρόστερ/μπάτζετ).\n\nΜπορείτε να δείτε δείγματα της δουλειάς μου εδώ: [link LinkedIn/πορτφόλιο]\n\nΜε εκτίμηση,\n${name}\n[τηλέφωνο · email]`;
  const li = `Καλησπέρα! Ασχολούμαι με ανάλυση δεδομένων ποδοσφαίρου. Παρατήρησα ότι η ${t.name} ${ins[0] ? ins[0].charAt(0).toLowerCase()+ins[0].slice(1,140)+'…' : 'έχει ενδιαφέρον προφίλ στα δεδομένα.'} Θα χαιρόμουν να σας στείλω δωρεάν ένα σύντομο report για τον επόμενο αντίπαλό σας. 🙂`;
  $('#pfBox').innerHTML = `<div class="grid g2">
    <div class="card"><h3>🎯 Ομάδα-στόχος</h3><label class="f">Σύλλογος<select id="ptT">${demoTeamOpts(PF.target)}</select></label>
      <h3 style="margin-top:14px">🔎 Εντοπισμένα insights (αυτόματα)</h3>${ins.map(s=>`<div class="find info"><span class="ic">📌</span><div class="small">${esc(s)}</div></div>`).join('')}
      <div class="row" style="margin-top:8px"><button class="btn" data-go="opp" data-arg="${esc(t.name)}">Report για αυτή την ομάδα</button></div>
      <hr><h3>📋 Πλάνο προσέγγισης</h3><ol class="small" style="padding-left:18px;margin:0">
        <li>Βρες τον Τεχνικό Διευθυντή / Head Analyst / προπονητή στο LinkedIn.</li><li>Στείλε σύντομο αίτημα σύνδεσης (κείμενο δεξιά).</li><li>Μετά την αποδοχή: email/μήνυμα με τα insights + PDF report αντιπάλου.</li><li>Follow-up σε 7 ημέρες με νέο, φρέσκο insight από τον τελευταίο αγώνα τους.</li><li>Πρόταση pilot 4 εβδομάδων — ξεκάθαρα παραδοτέα και ημέρα παράδοσης.</li></ol></div>
    <div class="card"><h3>✉️ Email προσέγγισης<span class="sp"></span><button class="btn sm" id="cpM">📋 Αντιγραφή</button></h3><textarea id="ptM" rows="20">${esc(msg)}</textarea>
      <h3 style="margin-top:12px">💼 Αίτημα σύνδεσης LinkedIn <span class="small muted">(≤300 χαρ.)</span><span class="sp"></span><button class="btn sm" id="cpL">📋</button></h3><textarea id="ptL" rows="4">${esc(li.slice(0,300))}</textarea>
      <div class="small muted" style="margin-top:6px">Επεξεργάσου ελεύθερα πριν την αποστολή. ${S.imported?'':'Με demo δεδομένα τα insights είναι ενδεικτικά — για πραγματική ομάδα φόρτωσε τα δεδομένα της.'}</div></div></div>`;
  on('#ptT','change',e=>{ PF.target=e.target.value; pitchTool(); });
  on('#cpM','click',()=>copyText($('#ptM').value)); on('#cpL','click',()=>copyText($('#ptL').value));
}

/* ======================= ΑΚΑΔΗΜΙΑ ======================= */
const AC = { tab:'sources', code:'shotmap' };
VIEWS.academy = function(arg){
  if(arg) AC.tab = arg;
  const tabs = [['sources','🌐 Ανοιχτά δεδομένα'],['learn','📚 Δωρεάν μαθήματα'],['code','💻 Κώδικας'],['powerbi','📊 Power BI report'],['glossary','📖 Γλωσσάρι'],['roadmap','🗺️ Roadmap καριέρας']];
  $('#view').innerHTML = `<div class="tabs">${tabs.map(([k,l])=>`<button class="${AC.tab===k?'on':''}" data-at="${k}">${l}</button>`).join('')}</div><div id="acBox"></div>`;
  $$('[data-at]').forEach(b=>b.onclick=()=>{ AC.tab=b.dataset.at; VIEWS.academy(); });
  const box = $('#acBox');
  if(AC.tab==='sources') box.innerHTML = `<div class="grid g2">${SOURCES.map(s=>`<div class="card src"><h3>${esc(s.n)}<span class="sp"></span><span class="tag r">${esc(s.tag)}</span></h3><p style="margin:0 0 8px">${esc(s.what)}</p><div class="small muted"><b>Πώς:</b> ${esc(s.how)}</div><a href="${s.url}" target="_blank" rel="noopener" class="small">${esc(s.url)} ↗</a></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>🚀 Το πρώτο σου mini-project (30 λεπτά)</h3><ol style="padding-left:18px;margin:0"><li>FBref → Super League → Player Stats → <b>Passing</b> και <b>Goal & Shot Creation</b>.</li><li>«Get table as CSV» → επικόλληση στα <a data-go="data">Δεδομένα</a>.</li><li>Άνοιξε <a data-go="roles" data-arg="CM">Ανάλυση Ρόλων → Κεντρικοί μέσοι</a> με Χ = xA/90, Υ = Key passes/90.</li><li>Πάνω δεξιά: οι πιο δημιουργικοί. Φίλτραρε αξία στη <a data-go="money">Moneyball</a> → οι υποτιμημένοι.</li><li><a data-go="portfolio" data-arg="scatter">Πορτφόλιο</a> → PNG + κείμενο → LinkedIn.</li></ol></div>`;
  else if(AC.tab==='learn') box.innerHTML = `<div class="grid g3">${LEARN.map(l=>`<div class="card"><h3>${esc(l.n)}</h3><p class="small" style="margin:0 0 8px">${esc(l.d)}</p><a href="${l.url}" target="_blank" rel="noopener" class="small">Άνοιγμα ↗</a></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>💡 Power BI & SQL ή Hudl/Wyscout;</h3><div class="grid g2"><div><b>Business/Data εργαλεία (Power BI, SQL, Python)</b><p class="small muted">Το πλεονέκτημά σου ως οικονομολόγος: μοντελοποίηση, dashboards για Τεχνικούς Διευθυντές, οικονομικά μοντέλα ρόστερ. Δωρεάν να μάθεις, άμεσα αξιοποιήσιμα, μεταφέρονται σε κάθε σύλλογο.</p></div><div><b>Πλατφόρμες βιντεοανάλυσης (Hudl, Wyscout, InStat)</b><p class="small muted">Το καθημερινό εργαλείο των αναλυτών στους συλλόγους (clips, tagging, scouting). Συνήθως απαιτούν συνδρομή — πολλές ομάδες δίνουν πρόσβαση όταν συνεργαστείς. Μάθε τη λογική τους (tagging, playlists) από δωρεάν tutorials.</p></div></div><div class="small">👉 Προτεινόμενη σειρά: Excel/Power BI → SQL → Python (mplsoccer) → εξοικείωση με Wyscout/Hudl όταν μπεις σε σύλλογο.</div></div>`;
  else if(AC.tab==='code'){
    const c = CODE[AC.code];
    box.innerHTML = `<div class="grid g13"><div class="card">${Object.entries(CODE).map(([k,v])=>`<div class="pillar" style="margin-bottom:8px;${k===AC.code?'border-color:var(--red)':''}" data-code="${k}"><b class="small">${esc(v.t)}</b></div>`).join('')}</div>
      <div class="card"><h3>${esc(c.t)}<span class="sp"></span><button class="btn sm" id="cpC">📋 Αντιγραφή</button><button class="btn sm" id="dlC">⬇ Αρχείο</button></h3><pre class="code">${esc(c.c)}</pre>
      <div class="small muted">Χρησιμοποίησε τον κώδικα με προσοχή· ονόματα στηλών και IDs αγώνων μπορεί να αλλάξουν ανά έκδοση πακέτου/σεζόν.</div></div></div>`;
    $$('[data-code]').forEach(b=>b.onclick=()=>{ AC.code=b.dataset.code; VIEWS.academy(); });
    on('#cpC','click',()=>copyText(c.c)); on('#dlC','click',()=>download(AC.code+({python:'.py',m:'.pq',dax:'.dax',sql:'.sql'}[c.lang]||'.txt'), c.c));
  }
  else if(AC.tab==='powerbi') box.innerHTML = `<div class="card"><h3>📊 Δομή Scouting Report σε Power BI (3 σελίδες)</h3><div class="grid g3">
      <div class="pillar"><div class="n">1</div><b>Market Overview</b><div class="small muted">Μεγάλος πίνακας όλων των παικτών + slicers: Θέση, Ηλικία, Ομάδα, Λήξη συμβολαίου, Λεπτά. → εδώ: <a data-go="market">Αγορά</a></div></div>
      <div class="pillar"><div class="n">2</div><b>Role Analytics</b><div class="small muted">Scatter plots ανά θέση που ψάχνει η ομάδα. → εδώ: <a data-go="roles">Ανάλυση Ρόλων</a></div></div>
      <div class="pillar"><div class="n">3</div><b>Player Profile</b><div class="small muted">Drill-through: radar + σύγκριση με Μ.Ο. πρωταθλήματος. → εδώ: <a data-go="profile">Προφίλ</a></div></div></div></div>
    <div class="card" style="margin-top:14px"><h3>🧩 Metrics ανά γραμμή του γηπέδου</h3><div class="tbl-wrap"><table class="t"><tr><th class="l">Ρόλος</th><th class="l">Βασικά metrics (ανά 90′)</th><th class="l">Ιδανικό visual</th><th></th></tr>
      ${Object.entries(ROLES).map(([k,r])=>`<tr><td class="l"><b>${esc(r.l)}</b></td><td class="l" style="white-space:normal">${r.m.map(m=>esc(M[m].l)).join(' · ')}</td><td class="l" style="white-space:normal">${esc(r.vis)}</td><td><button class="btn sm" data-go="roles" data-arg="${k}">Άνοιγμα</button></td></tr>`).join('')}</table></div></div>
    <div class="card" style="margin-top:14px"><h3>🔧 Βήματα</h3><ol style="padding-left:18px;margin:0" class="small"><li><b>Get Data → Web</b>: URL πίνακα FBref (ή CSV export για αξιοπιστία).</li><li><b>Power Query</b>: αφαίρεση επαναλαμβανόμενων headers, φίλτρο Min ≥ 450, στήλες per-90 (δες «Κώδικας → Power Query»).</li><li><b>DAX</b>: per-90 measures, percentiles ανά θέση, VfM (δες «Κώδικας → DAX»).</li><li><b>Visuals</b>: Scatter (με average lines από το Analytics pane), Radar (AppSource visual), Matrix με conditional formatting, Cards + Slicers.</li><li><b>Python visual</b>: επικόλλησε τον κώδικα shot map για γήπεδο mplsoccer μέσα στο report.</li><li>Δημοσίευση στο Power BI Service ή εξαγωγή PDF για τον Τεχνικό Διευθυντή.</li></ol></div>`;
  else if(AC.tab==='glossary') box.innerHTML = `<div class="card"><table class="t">${GLOSSARY.map(([k,v])=>`<tr><td class="l" style="width:230px;vertical-align:top"><b>${esc(k)}</b></td><td class="l" style="white-space:normal">${esc(v)}</td></tr>`).join('')}</table></div>`;
  else if(AC.tab==='roadmap'){
    const all = ROADMAP.flatMap((g,gi)=>g.items.map((_,ii)=>gi+'.'+ii)), done = all.filter(k=>S.roadmap[k]).length;
    box.innerHTML = `<div class="card"><h3>🗺️ Πρόοδος: ${done}/${all.length}<span class="sp"></span><div class="pb" style="width:220px"><i style="width:${100*done/all.length}%"></i></div></h3>
      <div class="grid g2">${ROADMAP.map((g,gi)=>`<div><h3 style="margin-top:10px">${esc(g.g)}</h3>${g.items.map((it,ii)=>{ const k=gi+'.'+ii; return `<label class="check ${S.roadmap[k]?'done':''}"><input type="checkbox" data-rm="${k}" ${S.roadmap[k]?'checked':''}><span>${esc(it)}</span></label>`; }).join('')}</div>`).join('')}</div>
      <div class="find info" style="margin-top:12px"><span class="ic">💶</span><div><b>Μην ξοδέψεις ακόμα σε ακριβά διπλώματα</b><span class="small muted">Οι σύλλογοι προσλαμβάνουν με βάση αποδείξεις δουλειάς (reports, dashboards, κώδικας). Πρώτα πορτφόλιο, μετά πιστοποιήσεις — όταν ξέρεις ακριβώς τι σου λείπει.</span></div></div></div>`;
    $$('[data-rm]').forEach(c=>c.onchange=()=>{ S.roadmap[c.dataset.rm]=c.checked; save(); VIEWS.academy(); });
  }
};
