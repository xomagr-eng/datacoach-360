'use strict';
/* ===== Νέοι & ανάπτυξη · Συμβόλαια · Σενάρια μπάτζετ · Καταγραφή αγώνα · Βίντεο · Αναφορά διοίκησης ===== */

/* ---------- Μοντέλο εξέλιξης (καμπύλη ηλικίας) ---------- */
function growthPerYear(age, minShare){
  const base = age<=18?6.5 : age<=19?6 : age<=20?5 : age<=21?4 : age<=22?3 : age<=23?2 : age<=24?1 : age<=27?0 : age<=28?-.5 : age<=29?-1 : age<=30?-2 : age<=31?-3 : -4;
  return base>0 ? base*(.65+.7*minShare) : base;
}
function project(p, years){
  const out=[]; let s=p._score, age=p.age;
  const minShare = Math.min(1, p.min/1800);
  for(let y=0;y<=years;y++){
    const X = [1, s, age, age*age, isTop(p), Math.max(minShare, y?Math.min(1,minShare+.25*y):minShare)];
    const v = VAL_B ? Math.exp(sum(X.map((x,i)=>x*VAL_B[i]))) : p.value;
    out.push({ y, age, score:s, value: y===0 ? (p.value||v) : v, band: 3*y });
    s = clamp(s + growthPerYear(age, minShare), 0, 99); age++;
  }
  return out;
}
function bookValue(p){ if(!p.fee) return 0; const yrs=p.feeYears||4, elapsed=Math.max(0, 2026-(p.signed||2026)); return Math.max(0, p.fee - p.fee/yrs*elapsed); }

/* ======================= ΝΕΟΙ & ΑΝΑΠΤΥΞΗ (U21) ======================= */
const YV = { scope:'my', maxAge:21, horizon:3, pid:null };
VIEWS.youth = function(){
  const pool = PL.filter(p=>p.age<=YV.maxAge && p.min>=180 && (YV.scope==='my' ? p.team===S.settings.myTeam : YV.scope==='market' ? p.team!==S.settings.myTeam : true));
  const rows = pool.map(p=>{ const pr=project(p,YV.horizon), end=pr[YV.horizon]; const cost=(p.wage||0)*YV.horizon; const buy = p.team===S.settings.myTeam ? bookValue(p) : (p.value||0);
    return { p, pr, end, gain:end.value-(p.value||0), roi:(end.value - buy - cost)/Math.max(50, buy+cost), cost, buy }; }).sort((a,b)=>b.roi-a.roi);
  if(!YV.pid || !rows.some(r=>r.p.id===YV.pid)) YV.pid = rows[0]?.p.id;
  const sel = rows.find(r=>r.p.id===YV.pid);
  const my = PL.filter(p=>p.team===S.settings.myTeam), u21min = sum(my.filter(p=>p.age<=21).map(p=>p.min))/Math.max(1,sum(my.map(p=>p.min)));
  $('#view').innerHTML = `
  <div class="card hero"><h3>🌱 Ανάπτυξη νέων & ROI</h3><div class="small muted">Καμπύλη εξέλιξης ανά ηλικία (ταχύτερη βελτίωση όσο περισσότερα λεπτά παίζει ο νέος), προβολή score και αγοραίας αξίας με το μοντέλο αξίας. <b>ROI</b> = (αξία σε ${YV.horizon} χρόνια − κόστος απόκτησης/λογιστική αξία − μισθοί) ÷ επένδυση.</div></div>
  <div class="card" style="margin-top:14px"><div class="row">
    <label class="f">Δείγμα<select id="yS">${opts([['my','Η ομάδα μου'],['market','Αγορά (υποψήφιοι)'],['all','Όλοι']], YV.scope)}</select></label>
    <label class="f">Μέγ. ηλικία<input type="number" id="yA" value="${YV.maxAge}" style="width:80px"></label>
    <label class="f">Ορίζοντας (έτη)<select id="yH">${opts([[2,'2 έτη'],[3,'3 έτη']], YV.horizon)}</select></label>
    <span style="flex:1"></span>${kpi('Λεπτά U21 στην ομάδα μου', (u21min*100).toFixed(0)+'%', 'μερίδιο συνολικού χρόνου')}</div></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>📈 Προβολή: ${sel?esc(sel.p.name):'—'}<span class="sp"></span>${sel?star(sel.p):''}</h3>
      ${sel?lineSVG([
        { name:'Αξία (k€)', color:COL.red, pts:sel.pr.map(q=>[2026+q.y, q.value, `${2026+q.y}: ${Math.round(q.value)}k€ · score ${Math.round(q.score)}`]), dots:true, width:2.6, area:true },
        { name:'Απαισιόδοξο', color:COL.gray, pts:sel.pr.map(q=>[2026+q.y, q.value*(1-q.band/30)]), dash:'4 4', width:1.4 },
        { name:'Αισιόδοξο', color:COL.gold, pts:sel.pr.map(q=>[2026+q.y, q.value*(1+q.band/25)]), dash:'4 4', width:1.4 }
      ],{ id:'yCh', h:240, yl:'χιλ.€', xFmt:v=>String(Math.round(v)) }):''}
      ${sel?`<div class="grid g3" style="margin-top:10px">${kpi('Score σήμερα → '+(2026+YV.horizon), `${Math.round(sel.p._score)} → ${Math.round(sel.end.score)}`, `ηλικία ${sel.p.age} → ${sel.end.age}`)}${kpi('Αξία → προβολή', `${Math.round(sel.p.value)} → ${Math.round(sel.end.value)}k`, `${sel.gain>=0?'+':''}${Math.round(sel.gain)}k€`)}${kpi('ROI', `<span style="color:${sel.roi>0?'var(--red2)':'var(--muted)'}">${(sel.roi*100).toFixed(0)}%</span>`, `μισθοί ${Math.round(sel.cost)}k · ${sel.p.team===S.settings.myTeam?'λογιστική αξία':'κόστος αγοράς'} ${Math.round(sel.buy)}k`)}</div>`:''}
      <div class="small muted" style="margin-top:8px">Εκτίμηση για σχεδιασμό — η πραγματική εξέλιξη εξαρτάται από προπόνηση, τραυματισμούς και χρόνο συμμετοχής.</div></div>
    <div class="card"><h3>🏅 Κατάταξη ROI (${rows.length})</h3><div class="tbl-wrap" style="max-height:460px"><table class="t"><tr><th class="l">Παίκτης</th><th>Ηλ.</th><th>Λεπτά</th><th>Score</th><th>→ ${2026+YV.horizon}</th><th>Αξία</th><th>Προβολή</th><th>ROI</th></tr>
      ${rows.slice(0,60).map(r=>`<tr class="${r.p.id===YV.pid?'me':''}" data-y="${r.p.id}" style="cursor:pointer"><td class="l"><b>${esc(r.p.name)}</b><div class="small muted">${esc(r.p.team)}</div></td><td>${r.p.age}</td><td>${r.p.min}</td><td>${Math.round(r.p._score)}</td><td>${Math.round(r.end.score)}</td><td>${r.p.value}</td><td>${Math.round(r.end.value)}</td><td><span class="hc" style="${heatBg(clamp(50+r.roi*50,0,100))}">${(r.roi*100).toFixed(0)}%</span></td></tr>`).join('')||'<tr><td colspan="8" class="empty">Κανένας νέος παίκτης.</td></tr>'}</table></div></div>
    <div class="card span2"><h3>🧭 Συμβουλές ανάπτυξης (αυτόματα)</h3>${rows.filter(r=>r.p.team===S.settings.myTeam).slice(0,6).map(r=>{ const share=r.p.min/1800; const t = share<.3 && r.end.score>55 ? ['weak','⏱️',`${r.p.name}: λίγα λεπτά (${r.p.min}′) για το ταλέντο του`, 'Δανεισμός σε ομάδα SL2 ή σταθερός χρόνος από τον πάγκο — ο χρόνος συμμετοχής επιταχύνει την εξέλιξη.'] : r.roi>1 ? ['str','💎',`${r.p.name}: υψηλό ROI (${(r.roi*100).toFixed(0)}%)`, 'Ανανέωση/επέκταση συμβολαίου ΤΩΡΑ με ρήτρα αποδέσμευσης πριν ανέβει η αξία.'] : ['info','📋',`${r.p.name}: σταθερή πορεία`, 'Παρακολούθηση ανά τρίμηνο — στόχος +'+Math.round(growthPerYear(r.p.age,share))+' μονάδες score/έτος.'];
      return `<div class="find ${t[0]}"><span class="ic">${t[1]}</span><div><b>${esc(t[2])}</b><span class="small muted">${esc(t[3])}</span></div></div>`; }).join('')||'<div class="muted">Δεν υπάρχουν νέοι στην ομάδα σου με αρκετά λεπτά.</div>'}</div>
  </div>`;
  on('#yS','change',e=>{ YV.scope=e.target.value; YV.pid=null; VIEWS.youth(); });
  on('#yA','change',e=>{ YV.maxAge=+e.target.value||21; YV.pid=null; VIEWS.youth(); });
  on('#yH','change',e=>{ YV.horizon=+e.target.value; VIEWS.youth(); });
  $$('[data-y]').forEach(tr=>tr.onclick=()=>{ YV.pid=+tr.dataset.y; VIEWS.youth(); });
};

/* ======================= ΣΥΜΒΟΛΑΙΑ & ΔΙΑΠΡΑΓΜΑΤΕΥΣΗ ======================= */
const CV = { pid:null };
function contractAdvice(p){
  const pr = project(p,3), fair = p._expWage || p.wage || 0, trend = pr[2].score - p._score;
  const k = trend>3 ? 1.08 : trend<-3 ? .9 : 1;
  const lo = Math.round(fair*.9*k), hi = Math.round(fair*1.1*k), target = Math.round(fair*k);
  const yrs = p.age<=23?'4–5 έτη': p.age<=27?'3–4 έτη': p.age<=29?'2–3 έτη': p.age<=31?'1+1 (option)':'1 έτος';
  const peakVal = Math.max(...pr.map(q=>q.value), p.value||0);
  const release = Math.round(peakVal*1.8/50)*50;
  const book = bookValue(p), remaining = Math.max(0,(p.contract||2027)-2026);
  const sellNow = (p.value||0) - book + (p.wage||0)*remaining;
  const keep2 = pr[2].value - book - (p.wage||0)*2 + (p._score-50)*8;
  const freeLoss = p.contract<=2027 ? (p.value||0) : 0;
  let rec, cls;
  if(p.contract<=2027 && p._score>=60 && p.age<=28){ rec='Ανανέωση ΤΩΡΑ — αλλιώς φεύγει ελεύθερος το καλοκαίρι και χάνεται όλη η αξία.'; cls='weak'; }
  else if(p.age>=30 && trend<0 && (p._vfm||1)<.85){ rec='Όχι ανανέωση / πώληση τώρα — η απόδοση πέφτει και ο μισθός ξεπερνά την αξία του.'; cls='weak'; }
  else if((p._vfm||1)<.7 && (p.value||0)>book){ rec='Πώληση — το κόστος υπερβαίνει την απόδοση και υπάρχει λογιστικό κέρδος πώλησης.'; cls='info'; }
  else if(trend>3 && p.age<=23){ rec='Επέκταση με υψηλή ρήτρα αποδέσμευσης — ο παίκτης ανεβαίνει, κλείδωσε την αξία του.'; cls='str'; }
  else { rec='Διατήρηση — σωστή σχέση κόστους/απόδοσης. Ανανέωση στο πλαίσιο του δίκαιου μισθού όταν πλησιάσει η λήξη.'; cls='info'; }
  return { pr, fair, lo, hi, target, yrs, release, book, sellNow, keep2, freeLoss, rec, cls, trend,
    clauses:[ `Ρήτρα αποδέσμευσης: ${fmtK(release)} (≈1,8× μέγιστη προβλεπόμενη αξία)`, `Ρήτρα υποβιβασμού: −30% στον μισθό`, `Bonus συμμετοχής: ${fmtK(Math.round(target*.15))} αν παίξει >50% των λεπτών`,
      p.age<=23?'Ποσοστό μεταπώλησης 15% αν πωληθεί (για παίκτες από ακαδημία/δανεισμό)':'Option +1 έτος μονομερώς υπέρ του συλλόγου', 'Bonus ομάδας: στόχος ευρωπαϊκής έξοδου/άνοδος' ] };
}
VIEWS.contracts = function(arg){
  const sq = myTeamPlayers().sort((a,b)=>(a.contract||9999)-(b.contract||9999) || b._score-a._score);
  if(arg && PBY[arg]) CV.pid=+arg;
  if(!CV.pid || !PBY[CV.pid]) CV.pid = sq[0]?.id;
  const p = PBY[CV.pid]; if(!p){ $('#view').innerHTML='<div class="card empty">Δεν υπάρχουν παίκτες.</div>'; return; }
  const a = contractAdvice(p);
  $('#view').innerHTML = `
  <div class="grid g31">
    <div class="card"><h3>✍️ Διαπραγμάτευση: ${plink(p)}<span class="sp"></span><select id="cP">${opts(sq.map(q=>[q.id,`${q.name} · λήξη ${q.contract||'–'}`]), p.id)}</select></h3>
      <div class="find ${a.cls}"><span class="ic">🧭</span><div><b>Σύσταση</b><span class="small">${esc(a.rec)}</span></div></div>
      <div class="grid g4" style="margin-top:10px">${kpi('Τρέχων μισθός', fmtK(p.wage), `λήξη ${p.contract||'–'}`)}${kpi('Δίκαιος μισθός (μοντέλο)', fmtK(a.fair), vfmTag(p))}${kpi('Εύρος πρότασης', `${a.lo}–${a.hi}k`, `στόχος ${a.target}k/έτος`)}${kpi('Διάρκεια', a.yrs, `${p.age} ετών · τάση score ${a.trend>=0?'+':''}${a.trend.toFixed(1)}`)}</div>
      <h3 style="margin-top:14px">📑 Προτεινόμενες ρήτρες</h3><ul style="margin:0;padding-left:18px">${a.clauses.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
      <h3 style="margin-top:14px">⚖️ Ανανέωση ή πώληση; (οικονομική εικόνα 2 ετών)</h3>
      ${barsHTML([
        { l:'Πώληση τώρα (έσοδο − λογιστ. αξία + εξοικ. μισθών)', v:Math.max(0,a.sellNow), txt:fmtK(a.sellNow) },
        { l:'Διατήρηση 2 έτη (αξία − μισθοί + αγωνιστική συνεισφορά)', v:Math.max(0,a.keep2), txt:fmtK(a.keep2), color:COL.white },
        ...(a.freeLoss?[{ l:'Χωρίς ανανέωση: χαμένη αξία (ελεύθερος)', v:a.freeLoss, txt:'−'+fmtK(a.freeLoss), color:COL.gray }]:[])
      ])}
      <div class="small muted" style="margin-top:6px">Λογιστική αξία (απομένουσα απόσβεση): ${fmtK(a.book)}. Κέρδος πώλησης στα βιβλία = τιμή πώλησης − λογιστική αξία. Η «αγωνιστική συνεισφορά» είναι ενδεικτική (score πάνω από 50 × 8k).</div></div>
    <div class="card"><h3>📅 Λήξεις ρόστερ</h3><div class="tbl-wrap" style="max-height:620px"><table class="t"><tr><th class="l">Παίκτης</th><th>Λήξη</th><th>VfM</th></tr>
      ${sq.map(q=>`<tr class="${q.id===p.id?'me':''}" data-c="${q.id}" style="cursor:pointer"><td class="l">${esc(q.name)}<div class="small muted">${POS_L[q.pos]} · ${q.age} · score ${Math.round(q._score)}</div></td><td class="${q.contract<=2027?'dn':''}">${q.contract||'–'}</td><td>${vfmTag(q)}</td></tr>`).join('')}</table></div></div>
  </div>`;
  on('#cP','change',e=>{ CV.pid=+e.target.value; VIEWS.contracts(); });
  $$('[data-c]').forEach(tr=>tr.onclick=()=>{ CV.pid=+tr.dataset.c; VIEWS.contracts(); });
};

/* ======================= ΣΕΝΑΡΙΑ ΜΠΑΤΖΕΤ ======================= */
const SC = { releg:false, revDrop:45, wageCut:30, sells:[], fees:{}, signShort:false, revGrowth:0, europe:0 };
VIEWS.scenarios = function(){
  const st = S.settings, sq = myTeamPlayers();
  const wages = sum(sq.map(p=>p.wage||0)), amort = sum(sq.map(p=>p.fee?p.fee/(p.feeYears||4):0)), agents = +st.agentFees||0, rev0 = +st.revenue||0;
  const base = { rev:rev0, wages, amort, agents, sale:0 };
  const sold = SC.sells.map(id=>PBY[id]).filter(Boolean);
  const SL = S.shortlist.map(s=>({ ...s, p:PBY[s.id] })).filter(s=>s.p && s.p.team!==st.myTeam);
  let rev = rev0*(1+SC.revGrowth/100) + (+SC.europe||0); if(SC.releg) rev *= (1-SC.revDrop/100);
  let w = wages - sum(sold.map(p=>p.wage||0)); if(SC.signShort) w += sum(SL.map(s=>+s.wage||0)); if(SC.releg) w *= (1-SC.wageCut/100);
  let am = amort - sum(sold.map(p=>p.fee?p.fee/(p.feeYears||4):0)); if(SC.signShort) am += sum(SL.map(s=>(+s.fee||0)/(+s.years||4)));
  const saleProfit = sum(sold.map(p=>(+SC.fees[p.id] || p.value || 0) - bookValue(p)));
  const scen = { rev, wages:w, amort:am, agents, sale:saleProfit };
  const res = o=>o.rev + o.sale - o.wages - o.amort - o.agents, ratio = o=>o.rev? (o.wages+o.amort+o.agents)/o.rev : 0;
  const cash = sum(sold.map(p=>+SC.fees[p.id]||p.value||0)) - (SC.signShort?sum(SL.map(s=>+s.fee||0)):0);
  // αγωνιστική επίπτωση: fit καλύτερου συστήματος
  const remain = sq.filter(p=>!SC.sells.includes(p.id)).concat(SC.signShort?SL.map(s=>s.p):[]);
  const bestNow = SYSTEMS.map(s=>bestXI(s,sq)).sort((a,b)=>b.avg-a.avg)[0], bestAfter = SYSTEMS.map(s=>bestXI(s,remain)).sort((a,b)=>b.avg-a.avg)[0];
  const row = (l,a,b,neg)=>`<tr><td class="l">${l}</td><td>${fmtK(a)}</td><td><b>${fmtK(b)}</b></td><td style="color:${(neg?a-b:b-a)>=0?'#fff':'var(--red2)'}">${b-a>=0?'+':''}${fmtK(b-a)}</td></tr>`;
  $('#view').innerHTML = `
  <div class="grid g2">
    <div class="card"><h3>🧪 Παράμετροι σεναρίου</h3>
      <label class="small" style="display:block"><input type="checkbox" id="scR" ${SC.releg?'checked':''}> <b>Υποβιβασμός</b></label>
      <div class="grid g2" style="margin-top:6px"><label class="f">Πτώση εσόδων %<input type="number" id="scD" value="${SC.revDrop}"></label><label class="f">Ρήτρα μείωσης μισθών %<input type="number" id="scW" value="${SC.wageCut}"></label></div>
      <div class="grid g2" style="margin-top:8px"><label class="f">Μεταβολή εσόδων % (χορηγίες/εισιτήρια)<input type="number" id="scG" value="${SC.revGrowth}"></label><label class="f">Ευρώπη / έπαθλα (χιλ.€)<input type="number" id="scE" value="${SC.europe}" step="100"></label></div>
      <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="scS" ${SC.signShort?'checked':''}> Υλοποίηση λίστας μεταγραφών (${SL.length} παίκτες, ${fmtK(sum(SL.map(s=>+s.fee||0)))})</label>
      <hr><h3>💸 Πωλήσεις παικτών</h3><div class="tbl-wrap" style="max-height:300px"><table class="t"><tr><th></th><th class="l">Παίκτης</th><th>Αξία</th><th>Λογιστ.</th><th>Τιμή πώλησης</th></tr>
      ${sq.slice().sort((a,b)=>b.value-a.value).map(p=>`<tr><td><input type="checkbox" data-sell="${p.id}" ${SC.sells.includes(p.id)?'checked':''}></td><td class="l">${esc(p.name)}<div class="small muted">${POS_L[p.pos]} · ${p.age} · μισθός ${p.wage}k</div></td><td>${p.value}</td><td class="muted">${Math.round(bookValue(p))}</td><td><input type="number" data-fee="${p.id}" value="${SC.fees[p.id]??p.value}" style="width:80px"></td></tr>`).join('')}</table></div></div>
    <div class="card"><h3>📊 Αποτέλεσμα σεζόν (χιλ.€)</h3><table class="t"><tr><th class="l">Μέγεθος</th><th>Βάση</th><th>Σενάριο</th><th>Διαφορά</th></tr>
      ${row('Έσοδα',base.rev,scen.rev)}${row('Μισθοί',base.wages,scen.wages,true)}${row('Αποσβέσεις',base.amort,scen.amort,true)}${row('Κέρδος πωλήσεων (βιβλία)',0,scen.sale)}${row('<b>Λειτουργικό αποτέλεσμα</b>',res(base),res(scen))}</table>
      <div class="grid g2" style="margin-top:12px">${kpi('Squad cost ratio', `${(ratio(base)*100).toFixed(0)}% → <span style="color:${ratio(scen)>.7?'var(--red2)':'#fff'}">${(ratio(scen)*100).toFixed(0)}%</span>`, 'όριο UEFA 70%')}${kpi('Ταμειακή ροή μεταγραφών', fmtK(cash), 'εισπράξεις − πληρωμές')}</div>
      <h3 style="margin-top:14px">⚽ Αγωνιστική επίπτωση</h3>
      <div class="grid g2">${kpi('Καλύτερο σύστημα σήμερα', `${Math.round(bestNow.avg)}%`, `${esc(bestNow.sys.f)} · ${esc(bestNow.sys.n)}`)}${kpi('Μετά το σενάριο', `<span style="color:${bestAfter.avg<bestNow.avg-2?'var(--red2)':'#fff'}">${Math.round(bestAfter.avg)}%</span>`, `${esc(bestAfter.sys.f)} · ${esc(bestAfter.sys.n)}`)}</div>
      <div class="find ${res(scen)>=res(base)&&bestAfter.avg>=bestNow.avg-2?'str':'weak'}" style="margin-top:10px"><span class="ic">🧭</span><div><b>${res(scen)>=res(base)?'Οικονομικά βελτιώνεται':'Οικονομικά χειροτερεύει'} · ${bestAfter.avg>=bestNow.avg-2?'αγωνιστικά σταθερό':'αγωνιστικά πέφτει'}</b><span class="small muted">${SC.releg?'Σε υποβιβασμό, οι ρήτρες μείωσης μισθών είναι το κλειδί για να μείνει ο λόγος κόστους κάτω από 70%. ':''}Δες τα κενά της 11άδας στο <a data-go="fit">Συστήματα & Fit</a>.</span></div></div></div>
  </div>`;
  const num=(id,k)=>on(id,'change',e=>{ SC[k]=+e.target.value||0; VIEWS.scenarios(); });
  on('#scR','change',e=>{ SC.releg=e.target.checked; VIEWS.scenarios(); }); on('#scS','change',e=>{ SC.signShort=e.target.checked; VIEWS.scenarios(); });
  num('#scD','revDrop'); num('#scW','wageCut'); num('#scG','revGrowth'); num('#scE','europe');
  $$('[data-sell]').forEach(c=>c.onchange=()=>{ const id=+c.dataset.sell; SC.sells = c.checked ? SC.sells.concat(id) : SC.sells.filter(x=>x!==id); VIEWS.scenarios(); });
  $$('[data-fee]').forEach(i=>i.onchange=()=>{ SC.fees[+i.dataset.fee]=+i.value||0; VIEWS.scenarios(); });
};

/* ======================= ΚΑΤΑΓΡΑΦΗ ΑΓΩΝΑ (δικά μου δεδομένα) ======================= */
const LG = { mid:null, team:'us', player:'', outcome:'Saved', header:false, pattern:'Ανοιχτό παιχνίδι', minute:1, video:'', vt:'' };
function logs(){ return S.logs ||= []; }
function curLog(){ return logs().find(m=>m.id===LG.mid); }
function logToEv(m){
  const us=S.settings.myTeam, them=m.opp||'Αντίπαλος';
  return { demo:false, title:`${m.home?us:them} – ${m.home?them:us} · ${m.date||''} (δική μου καταγραφή)`, teams:[us, them],
    shots:m.shots.map(s=>({ ...s, team:s.team==='us'?us:them })), passes:[], touches:m.shots.map(s=>({ team:s.team==='us'?us:them, player:s.player||'', x:s.x, y:s.y })), xi:{}, subMin:{}, og:{} };
}
VIEWS.logger = function(){
  const L = logs(); if(!LG.mid && L.length) LG.mid = L[L.length-1].id;
  const m = curLog(), sq = myTeamPlayers();
  let inner='';
  if(m) m.shots.forEach((s,i)=>{ const us=s.team==='us', x=us?s.x:120-s.x, y=us?s.y:80-s.y, r=.9+Math.sqrt(s.xg)*4.2, g=s.outcome==='Goal', c=us?COL.red:COL.white;
    inner += `<circle cx="${x}" cy="${y}" r="${r}" fill="${g?COL.gold:c}" fill-opacity="${g?1:.4}" stroke="${g?'#000':c}" stroke-width=".35" data-shot="${i}" style="cursor:pointer" data-tip="${esc(s.player||'')} ${s.minute}′ · xG ${fmt(s.xg)} · ${esc(outcomeGR(s.outcome))}${s.video?'<br>🎬 έχει βίντεο (κλικ)':''}"/>`; });
  const tot = t=>m?m.shots.filter(s=>s.team===t):[];
  const allUs = L.flatMap(x=>x.shots.filter(s=>s.team==='us')), allThem = L.flatMap(x=>x.shots.filter(s=>s.team==='them'));
  $('#view').innerHTML = `
  <div class="card"><h3>📝 Καταγραφή δικών μου αγώνων <span class="small muted">(για κατηγορίες χωρίς δημόσια δεδομένα)</span></h3><div class="row">
    <label class="f">Αγώνας<select id="lgM">${L.length?opts(L.map(x=>[x.id,`${x.date} · vs ${x.opp}`]).reverse(), LG.mid):'<option>—</option>'}</select></label>
    <label class="f">Αντίπαλος<input type="text" id="lgO" placeholder="π.χ. Ακρίτας Έβρου"></label><label class="f">Ημερομηνία<input type="date" id="lgD" value="${new Date().toISOString().slice(0,10)}"></label>
    <label class="f">Έδρα<select id="lgH"><option value="1">Εντός</option><option value="0">Εκτός</option></select></label>
    <button class="btn pri" id="lgNew" style="align-self:flex-end">＋ Νέος αγώνας</button>${m?`<button class="btn" id="lgDel" style="align-self:flex-end">🗑</button>`:''}</div></div>
  ${m?`<div class="grid g32" style="margin-top:14px">
    <div class="card"><h3>👆 Κλικ στο γήπεδο = νέο σουτ · <span style="color:${COL.red}">εμείς →</span> · <span>← ${esc(m.opp)}</span></h3>${pitchSVG(inner,{ id:'lgP', click:true })}
      <div class="row" style="margin-top:8px"><b style="color:${COL.red}">${esc(S.settings.myTeam)} ${tot('us').filter(s=>s.outcome==='Goal').length} (xG ${sum(tot('us').map(s=>s.xg)).toFixed(2)})</b> – <b>${tot('them').filter(s=>s.outcome==='Goal').length} (xG ${sum(tot('them').map(s=>s.xg)).toFixed(2)}) ${esc(m.opp)}</b><span style="flex:1"></span><button class="btn" id="lgAn">📈 Ανάλυση αγώνα</button><button class="btn" id="lgUndo">↶ Αναίρεση</button></div></div>
    <div class="card"><h3>⚙️ Επόμενο σουτ</h3><div class="grid g2">
      <label class="f">Ομάδα<select id="lsT">${opts([['us','Εμείς'],['them','Αντίπαλος']], LG.team)}</select></label>
      <label class="f">Παίκτης<select id="lsP"><option value="">—</option>${opts(sq.map(p=>p.name), LG.player)}</select></label>
      <label class="f">Έκβαση<select id="lsO">${opts([['Goal','Γκολ'],['Saved','Απόκρουση'],['Off T','Άουτ'],['Blocked','Μπλοκ'],['Post','Δοκάρι']], LG.outcome)}</select></label>
      <label class="f">Φάση<select id="lsF">${opts(['Ανοιχτό παιχνίδι','Αντεπίθεση','Κόρνερ','Φάουλ','Πέναλτι'], LG.pattern)}</select></label>
      <label class="f">Λεπτό<input type="number" id="lsM" value="${LG.minute}" min="1" max="130"></label>
      <label class="small" style="align-self:flex-end"><input type="checkbox" id="lsH" ${LG.header?'checked':''}> Κεφαλιά</label>
      <label class="f span2">🎬 Βίντεο (YouTube link, προαιρετικό)<input type="text" id="lsV" value="${esc(LG.video)}" placeholder="https://youtu.be/…"></label>
      <label class="f">Χρόνος στο βίντεο (λλ:δδ)<input type="text" id="lsVT" value="${esc(LG.vt)}" placeholder="12:34"></label></div>
      <div class="small muted" style="margin-top:8px">Το xG υπολογίζεται αυτόματα από τη θέση (δες Εργαλεία → xG). Όταν η ομάδα είναι «Αντίπαλος», κάνε κλικ στο αριστερό μισό.</div>
      <hr><div class="tbl-wrap" style="max-height:260px"><table class="t"><tr><th>′</th><th class="l">Ομάδα</th><th class="l">Παίκτης</th><th>xG</th><th class="l">Έκβαση</th><th></th></tr>
      ${m.shots.map((s,i)=>`<tr><td>${s.minute}</td><td class="l">${s.team==='us'?'Εμείς':esc(m.opp)}</td><td class="l">${esc(s.player||'—')}</td><td>${fmt(s.xg)}</td><td class="l">${esc(outcomeGR(s.outcome))}${s.video?' 🎬':''}</td><td><button class="btn sm" data-del="${i}">✕</button></td></tr>`).join('')}</table></div></div></div>`:'<div class="card empty" style="margin-top:14px">Δημιούργησε αγώνα για να ξεκινήσεις την καταγραφή.</div>'}
  ${L.length?`<div class="grid g2" style="margin-top:14px"><div class="card"><h3>📊 Όλη η σεζόν — σουτ υπέρ (${allUs.length} · xG ${sum(allUs.map(s=>s.xg)).toFixed(1)})</h3>${shotMapSVG(allUs,{colorBy:'pattern'})}</div>
    <div class="card"><h3>🛡️ Σουτ κατά (${allThem.length} · xG ${sum(allThem.map(s=>s.xg)).toFixed(1)})</h3>${shotMapSVG(allThem,{colorBy:'pattern'})}</div></div>`:''}`;
  on('#lgM','change',e=>{ LG.mid=e.target.value; VIEWS.logger(); });
  on('#lgNew','click',()=>{ const opp=$('#lgO').value.trim()||'Αντίπαλος'; const id='lg'+Date.now(); logs().push({ id, opp, date:$('#lgD').value, home:$('#lgH').value==='1', shots:[] }); LG.mid=id; save(); VIEWS.logger(); });
  on('#lgDel','click',()=>{ if(!confirm('Διαγραφή αγώνα;')) return; S.logs=logs().filter(x=>x.id!==LG.mid); LG.mid=null; save(); VIEWS.logger(); });
  const bind=(id,k,f=v=>v)=>on(id,'change',e=>{ LG[k]=f(e.target.type==='checkbox'?e.target.checked:e.target.value); });
  bind('#lsT','team'); bind('#lsP','player'); bind('#lsO','outcome'); bind('#lsF','pattern'); bind('#lsM','minute',v=>+v||1); bind('#lsH','header'); bind('#lsV','video'); bind('#lsVT','vt');
  on('#lgUndo','click',()=>{ m.shots.pop(); save(); VIEWS.logger(); });
  on('#lgAn','click',()=>{ MV.ev = logToEv(m); MV.team=null; MV.player=null; go('match'); });
  $$('[data-del]').forEach(b=>b.onclick=()=>{ m.shots.splice(+b.dataset.del,1); save(); VIEWS.logger(); });
  const svg = $('#lgP');
  if(svg) svg.addEventListener('click', e=>{
    const t = e.target.closest('[data-shot]'); if(t){ const s=m.shots[+t.dataset.shot]; if(s.video) openClip({ url:s.video, start:parseTime(s.vt), title:`${s.player||''} ${s.minute}′` }); return; }
    const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse());
    let x=clamp(p.x,0,120), y=clamp(p.y,0,80); if(LG.team==='them'){ x=120-x; y=80-y; }
    const sit = LG.pattern==='Πέναλτι'?'penalty':LG.pattern==='Αντεπίθεση'?'counter':'';
    if(sit==='penalty'){ x=108; y=40; }
    const xg = xgModel(x,y,LG.header,sit);
    m.shots.push({ team:LG.team, player:LG.team==='us'?LG.player:'', minute:LG.minute, x:+x.toFixed(1), y:+y.toFixed(1), xg:+xg.toFixed(3), outcome:LG.outcome, header:LG.header, pattern:LG.pattern, video:LG.video, vt:LG.vt });
    m.shots.sort((a,b)=>a.minute-b.minute); save(); VIEWS.logger();
  });
};

/* ======================= ΒΙΝΤΕΟ ======================= */
function ytId(u){ const m = String(u||'').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m?m[1]:null; }
function parseTime(t){ if(!t) return 0; const p=String(t).split(':').map(Number); return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:(+p[0]||0); }
function fmtTime(s){ s=Math.round(s||0); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
function openClip(c){ S._clip = c; go('video'); }
const VV = { tag:'', player:'' };
VIEWS.video = function(){
  const clips = S.clips ||= [];
  const fromShots = logs().flatMap(m=>m.shots.filter(s=>s.video).map(s=>({ title:`${m.date} vs ${m.opp} · ${s.player||'αντίπαλος'} ${s.minute}′ (${outcomeGR(s.outcome)})`, url:s.video, start:parseTime(s.vt), tags:['σουτ', s.pattern], player:s.player||'' })));
  const all = clips.concat(fromShots).filter(c=>(!VV.tag || (c.tags||[]).includes(VV.tag)) && (!VV.player || c.player===VV.player));
  const tags = [...new Set(clips.concat(fromShots).flatMap(c=>c.tags||[]))].filter(Boolean);
  const cur = S._clip || all[0]; const id = cur && ytId(cur.url);
  $('#view').innerHTML = `<div class="grid g32">
    <div class="card"><h3>🎬 ${cur?esc(cur.title):'Βίντεο'}</h3>
      ${id?`<div style="position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden;background:#000"><iframe src="https://www.youtube-nocookie.com/embed/${id}?start=${cur.start||0}&rel=0" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><div class="small muted" style="margin-top:6px">Ξεκινά από ${fmtTime(cur.start)} · απαιτεί σύνδεση στο internet.</div>`
        : cur ? `<div class="empty">Μη αναγνωρίσιμο link YouTube. <a href="${esc(cur.url)}" target="_blank" rel="noopener">Άνοιγμα ↗</a></div>` : '<div class="empty">Πρόσθεσε το πρώτο clip δεξιά ή βάλε link σε σουτ στην «Καταγραφή αγώνα».</div>'}</div>
    <div class="card"><h3>➕ Νέο clip</h3>
      <label class="f">Τίτλος<input type="text" id="vT" placeholder="π.χ. Πίεση μετά από απώλεια — 2ο γκολ"></label>
      <label class="f" style="margin-top:6px">YouTube link<input type="text" id="vU" placeholder="https://www.youtube.com/watch?v=…"></label>
      <div class="grid g2" style="margin-top:6px"><label class="f">Χρόνος (λλ:δδ)<input type="text" id="vS" placeholder="0:00"></label><label class="f">Παίκτης<select id="vP"><option value="">—</option>${opts(myTeamPlayers().map(p=>p.name))}</select></label></div>
      <label class="f" style="margin-top:6px">Ετικέτες (κόμμα)<input type="text" id="vG" placeholder="πίεση, στημένες, αντίπαλος"></label>
      <div class="row end" style="margin-top:10px"><button class="btn pri" id="vAdd">Αποθήκευση</button></div>
      <hr><div class="row"><label class="f">Ετικέτα<select id="vfT"><option value="">Όλες</option>${opts(tags, VV.tag)}</select></label><label class="f">Παίκτης<select id="vfP"><option value="">Όλοι</option>${opts([...new Set(clips.concat(fromShots).map(c=>c.player).filter(Boolean))], VV.player)}</select></label></div>
      <div style="margin-top:10px;max-height:340px;overflow:auto">${all.map((c,i)=>`<div class="find info" style="cursor:pointer" data-clip="${i}"><span class="ic">▶</span><div><b>${esc(c.title||'Clip')}</b><span class="small muted">${fmtTime(c.start)} · ${(c.tags||[]).map(esc).join(', ')}${c.player?' · '+esc(c.player):''}</span></div>${clips.includes(c)?`<button class="btn sm" data-vdel="${clips.indexOf(c)}" style="margin-left:auto">✕</button>`:''}</div>`).join('')||'<div class="muted small">Κανένα clip.</div>'}</div></div></div>`;
  on('#vAdd','click',()=>{ const url=$('#vU').value.trim(); if(!url){ toast('Βάλε link'); return; } clips.push({ title:$('#vT').value.trim()||'Clip', url, start:parseTime($('#vS').value), player:$('#vP').value, tags:$('#vG').value.split(',').map(s=>s.trim()).filter(Boolean) }); S._clip=clips[clips.length-1]; save(); VIEWS.video(); });
  on('#vfT','change',e=>{ VV.tag=e.target.value; VIEWS.video(); }); on('#vfP','change',e=>{ VV.player=e.target.value; VIEWS.video(); });
  $$('[data-clip]').forEach(d=>d.onclick=e=>{ if(e.target.closest('[data-vdel]')) return; S._clip=all[+d.dataset.clip]; VIEWS.video(); });
  $$('[data-vdel]').forEach(b=>b.onclick=()=>{ clips.splice(+b.dataset.vdel,1); S._clip=null; save(); VIEWS.video(); });
};

/* ======================= ΑΝΑΦΟΡΑ ΔΙΟΙΚΗΣΗΣ ======================= */
const BR = { last:6 };
VIEWS.board = function(){
  const st=S.settings, t=DB.teamByName[st.myTeam], sq=myTeamPlayers();
  if(!t){ $('#view').innerHTML='<div class="card empty">Η αναφορά χρειάζεται δεδομένα αγώνων της ομάδας (demo ομάδες).</div>'; return; }
  const ms = t.matches.slice(-BR.last), A = teamAgg(t);
  let pts=0,xp=0; ms.forEach(m=>{ pts += m.gf>m.ga?3:m.gf===m.ga?1:0; const pr=matchProbs(m.xgf,m.xga,8); xp+=3*pr.h+pr.d; });
  const w=ms.filter(m=>m.gf>m.ga).length, d=ms.filter(m=>m.gf===m.ga).length, l=ms.length-w-d;
  const xgd = sum(ms.map(m=>m.xgf-m.xga))/ms.length, xgdS = (A.xgf-A.xga)/A.n;
  const wages=sum(sq.map(p=>p.wage||0)), amort=sum(sq.map(p=>p.fee?p.fee/(p.feeYears||4):0)), ratio=st.revenue?(wages+amort+(+st.agentFees||0))/st.revenue:0;
  const risk = sq.filter(p=>p.pos!=='GK').map(p=>({p,a:acwr(p)})).filter(x=>x.a.r>1.5);
  const exp = sq.filter(p=>p.contract<=2027).sort((a,b)=>b._score-a._score);
  const best = SYSTEMS.map(s=>bestXI(s,sq)).sort((a,b)=>b.avg-a.avg)[0];
  const SL = S.shortlist.map(s=>({ ...s, p:PBY[s.id] })).filter(s=>s.p && s.p.team!==st.myTeam);
  const recs = [];
  if(pts-xp>2) recs.push('Τα αποτελέσματα ξεπερνούν την απόδοση (xPts) — κίνδυνος πτώσης· δεν χρειάζονται υπερβολικές αποφάσεις με βάση τη βαθμολογία.');
  if(pts-xp<-2) recs.push('Η απόδοση αξίζει περισσότερους βαθμούς — συνέχεια του πλάνου, τα αποτελέσματα αναμένεται να ακολουθήσουν.');
  if(ratio>.7) recs.push(`Ο λόγος κόστους ρόστερ (${(ratio*100).toFixed(0)}%) ξεπερνά το όριο UEFA 70% — απαιτούνται πωλήσεις ή μείωση μισθολογίου.`);
  if(exp.filter(p=>p._score>=60).length) recs.push(`Άμεση ανανέωση: ${exp.filter(p=>p._score>=60).slice(0,3).map(p=>p.name).join(', ')} (λήξη 2027, υψηλή απόδοση).`);
  if(risk.length) recs.push(`${risk.length} παίκτες σε υψηλό κίνδυνο τραυματισμού (ACWR>1,5) — διαχείριση φορτίου αυτή την εβδομάδα.`);
  recs.push(`Βέλτιστο σύστημα για το ρόστερ: ${best.sys.f} (${best.sys.n}) με fit ${Math.round(best.avg)}%.`);
  const today = new Date().toLocaleDateString('el-GR');
  $('#view').innerHTML = `
  <div class="row noprint" style="margin-bottom:14px"><label class="f">Περίοδος<select id="brL">${opts([[4,'Τελευταίοι 4 αγώνες'],[6,'Τελευταίοι 6 (≈ μήνας+)'],[8,'Τελευταίοι 8'],[99,'Όλη η σεζόν']], BR.last)}</select></label><span style="flex:1"></span><button class="btn pri" onclick="window.print()">🖨 Εκτύπωση / PDF</button></div>
  <div class="report-head"><b>ΑΝΑΦΟΡΑ ΠΡΟΣ ΔΙΟΙΚΗΣΗ · ${esc(st.myTeam)}</b><span>${esc(st.author||'Τεχνικό τμήμα')} · ${today}</span></div>
  <div class="card hero"><h3>🏛️ Αναφορά προς Διοίκηση & Τεχνικό Διευθυντή — ${esc(st.myTeam)}</h3><div class="small muted">Περίοδος: ${ms.length} αγώνες · σύνταξη ${today}</div></div>
  <div class="grid g4" style="margin-top:14px">${kpi('Αποτελέσματα', `${w}Ν-${d}Ι-${l}Η`, `${pts} βαθμοί (xPts ${xp.toFixed(1)})`)}${kpi('xG διαφορά / αγ.', `${xgd>=0?'+':''}${xgd.toFixed(2)}`, `σεζόν ${xgdS>=0?'+':''}${xgdS.toFixed(2)}`)}${kpi('Θέση', `${rankOf(t)}η`, `${A.pts} β. σεζόν`)}${kpi('Squad cost ratio', `<span style="color:${ratio>.7?'var(--red2)':'#fff'}">${(ratio*100).toFixed(0)}%</span>`, 'όριο UEFA 70%')}</div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>📈 Απόδοση περιόδου</h3>${lineSVG([{ name:'xG υπέρ', color:COL.red, pts:ms.map((m,i)=>[i+1,m.xgf,`vs ${esc(m.opp)} ${m.gf}-${m.ga}`]), dots:true, width:2.4 },{ name:'xG κατά', color:COL.white, pts:ms.map((m,i)=>[i+1,m.xga]), dots:true }],{ h:220, xFmt:v=>'Α'+v })}
      <table class="t" style="margin-top:8px"><tr><th class="l">Αντίπαλος</th><th>Σκορ</th><th>xG</th></tr>${ms.map(m=>`<tr><td class="l">${m.home?'':'@ '}${esc(m.opp)}</td><td><b>${m.gf}-${m.ga}</b></td><td>${m.xgf} – ${m.xga}</td></tr>`).join('')}</table></div>
    <div class="card"><h3>💶 Οικονομικά & ρόστερ</h3><table class="t">
      <tr><td class="l">Μισθολόγιο</td><td><b>${fmtK(wages)}</b></td></tr><tr><td class="l">Αποσβέσεις μεταγραφών</td><td>${fmtK(amort)}</td></tr>
      <tr><td class="l">Έσοδα σεζόν</td><td>${fmtK(st.revenue)}</td></tr><tr><td class="l">Μεταγραφικό υπόλοιπο</td><td>${fmtK((+st.transferBudget||0)-sum(SL.map(s=>+s.fee||0)))}</td></tr>
      <tr><td class="l">Στόχοι μεταγραφών</td><td>${SL.length?SL.map(s=>esc(s.p.name)).join(', '):'—'}</td></tr>
      <tr><td class="l">Λήξεις 2027</td><td>${exp.length} (${exp.slice(0,4).map(p=>esc(p.name.split(' ').slice(-1)[0])).join(', ')})</td></tr>
      <tr><td class="l">Κίνδυνος τραυματισμού</td><td>${risk.length?risk.map(x=>esc(x.p.name.split(' ').slice(-1)[0])).join(', '):'κανένας'}</td></tr>
      <tr><td class="l">Βέλτιστο σύστημα</td><td>${esc(best.sys.f)} · fit ${Math.round(best.avg)}%</td></tr></table></div>
    <div class="card span2"><h3>🧭 Συμπεράσματα & προτάσεις</h3><ol style="margin:0;padding-left:18px">${recs.map(r=>`<li style="margin-bottom:6px">${esc(r)}</li>`).join('')}</ol></div>
  </div>`;
  on('#brL','change',e=>{ BR.last=+e.target.value; VIEWS.board(); });
};
