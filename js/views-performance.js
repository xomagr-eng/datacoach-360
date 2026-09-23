'use strict';
/* ===== Πυλώνας 1: Απόδοση ομάδας · Report αντιπάλου · Ανάλυση αγώνα (event data) ===== */

const PAT_LEGEND = `<div class="legend"><span><i style="background:${COL.red}"></i>Ανοιχτό παιχνίδι</span><span><i style="background:${COL.orange}"></i>Αντεπίθεση</span><span><i style="background:${COL.blue}"></i>Κόρνερ</span><span><i style="background:${COL.purple}"></i>Φάουλ</span><span><i style="background:${COL.white}"></i>Πέναλτι</span><span><i style="background:${COL.gold}"></i>Γκολ</span><span class="muted">μέγεθος κύκλου = xG</span></div>`;
function rolling(arr, k){ return arr.map((_,i)=>mean(arr.slice(Math.max(0,i-k+1), i+1))); }
function resChip(m){ const r = m.gf>m.ga?'Ν':m.gf===m.ga?'Ι':'Η'; const bg = r==='Ν'?'var(--red)':r==='Ι'?'#4a5163':'#0f131b';
  return `<span data-tip="${m.home?'Εντός':'Εκτός'} vs ${esc(m.opp)}<br>xG ${m.xgf} – ${m.xga}" style="display:inline-grid;place-items:center;width:52px;padding:4px 0;border-radius:8px;background:${bg};border:1px solid var(--line);font-size:12px;margin:2px"><b>${r}</b>${m.gf}-${m.ga}</span>`; }

/* ======================= ΑΠΟΔΟΣΗ ΟΜΑΔΑΣ ======================= */
const TV = { team:null, color:'pattern', hp:null, sort:'pts', minPass:4 };
VIEWS.team = function(){
  if(!TV.team || !DB.teamByName[TV.team]) TV.team = DB.teamByName[S.settings.myTeam] ? S.settings.myTeam : DB.teams[0].name;
  const t = DB.teamByName[TV.team], A = teamAgg(t), la = leagueAvg(t.league);
  const sf = genShots(t,'for'), sa = genShots(t,'against'), pf = shotProfile(sf), pa = shotProfile(sa);
  const ms = t.matches, rf = rolling(ms.map(m=>m.xgf),5), ra = rolling(ms.map(m=>m.xga),5);
  const tp = PL.filter(p=>p.team===t.name).sort((a,b)=>b.min-a.min);
  if(!TV.hp || !tp.some(p=>p.id==TV.hp)) TV.hp = tp.find(p=>p.pos==='AM'||p.pos==='W'||p.pos==='CM')?.id || tp[0]?.id;
  const hpP = PBY[TV.hp];
  const tbl = leagueTable(t.league).map(r=>({ ...r, gd:r.a.gf-r.a.ga, xgd:(r.a.xgf-r.a.xga)/r.a.n, luck:r.a.pts-r.a.xpts }));
  const sk = { pts:r=>r.a.pts, xpts:r=>r.a.xpts, luck:r=>r.luck, xgf:r=>r.a.xgfM, xga:r=>-r.a.xgaM, xgd:r=>r.xgd, ppda:r=>-r.a.ppda, poss:r=>r.a.poss }[TV.sort] || (r=>r.a.pts);
  tbl.sort((a,b)=>sk(b)-sk(a));
  const pBar = (l,v,av)=>({ l, v:v*100, avg:av*100, txt:Math.round(v*100)+'%' });
  $('#view').innerHTML = `
  <div class="row" style="margin-bottom:14px"><label class="f">Ομάδα<select id="tTeam">${demoTeamOpts(t.name)}</select></label>
    <span class="tag r">${esc(t.style)}</span><span class="tag">${t.formation}</span><span class="tag">${esc(LEAGUES[t.league].name)}</span>
    <span class="sp" style="flex:1"></span><button class="btn" data-go="opp" data-arg="${esc(t.name)}">🕵️ Report αντιπάλου για αυτή την ομάδα</button></div>
  <div class="grid g5">
    ${kpi('Βαθμοί / xPts', `${A.pts} / ${A.xpts.toFixed(1)}`, `${rankOf(t)}η θέση · ${A.w}-${A.d}-${A.l}`)}
    ${kpi('Γκολ / xG υπέρ', `${A.gf} / ${A.xgf.toFixed(1)}`, A.gf-A.xgf>=0?`Φινίρισμα +${(A.gf-A.xgf).toFixed(1)}`:`Φινίρισμα ${(A.gf-A.xgf).toFixed(1)}`)}
    ${kpi('Γκολ / xG κατά', `${A.ga} / ${A.xga.toFixed(1)}`, A.xga-A.ga>=0?`ΤΦ/τύχη +${(A.xga-A.ga).toFixed(1)}`:`${(A.xga-A.ga).toFixed(1)} χειρότερα του αναμενόμενου`)}
    ${kpi('PPDA', A.ppda.toFixed(1), `Μ.Ο. ${la.ppda.toFixed(1)} · ${A.ppda<la.ppda-1?'υψηλή πίεση':A.ppda>la.ppda+1?'χαμηλό μπλοκ':'μέτρια πίεση'}`)}
    ${kpi('Κατοχή', A.poss.toFixed(0)+'%', `xG στημένων: ${(A.spxgf/A.n).toFixed(2)} υπέρ · ${(A.spxga/A.n).toFixed(2)} κατά`)}
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card span2"><h3>📈 Τάση xG (κυλιόμενος μέσος 5 αγώνων)<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('cTrend'),'xg_trend')">PNG</button></h3>
      ${lineSVG([
        { name:'xG υπέρ', color:COL.red, pts:rf.map((v,i)=>[i+1,v,`Αγ. ${i+1} vs ${esc(ms[i].opp)}: ${ms[i].gf}-${ms[i].ga} · xG ${ms[i].xgf}`]), dots:true, width:2.6, area:true },
        { name:'xG κατά', color:COL.white, pts:ra.map((v,i)=>[i+1,v,`Αγ. ${i+1}: xGA ${ms[i].xga}`]), dots:true, width:2 }
      ], { id:'cTrend', h:250, yl:'xG / αγώνα', xFmt:v=>'Α'+v })}
      <div style="margin-top:8px">${ms.slice(-12).map(resChip).join('')}</div></div>
    <div class="card"><h3>🎯 Σουτ υπέρ · ${pf.n} σουτ · ${pf.xg.toFixed(1)} xG · ${pf.goals} γκολ<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('smF'),'shots_for')">PNG</button></h3>${shotMapSVG(sf,{colorBy:'pattern',id:'smF'})}${PAT_LEGEND}</div>
    <div class="card"><h3>🛡️ Σουτ κατά · ${pa.n} σουτ · ${pa.xg.toFixed(1)} xG · ${pa.goals} γκολ<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('smA'),'shots_against')">PNG</button></h3>${shotMapSVG(sa,{colorBy:'pattern',id:'smA'})}<div class="small muted" style="margin-top:6px">Οι αντίπαλοι επιτίθενται προς τα δεξιά.</div></div>
    <div class="card"><h3>🧩 Προφίλ σουτ (μερίδιο xG)</h3>
      <div class="small muted">Υπέρ</div>${barsHTML([pBar('Στημένες φάσεις',pf.sp,la.spFor), pBar('Κεφαλιές',pf.head), pBar('Αντεπιθέσεις',pf.counter), pBar('Μέσα στην περιοχή',pf.box)],{max:100})}
      <hr><div class="small muted">Κατά (λευκή γραμμή = Μ.Ο. λίγκας)</div>${barsHTML([pBar('Στημένες φάσεις',pa.sp,la.spAg), pBar('Κεφαλιές',pa.head,la.headAg), pBar('Αντεπιθέσεις',pa.counter,la.ctAg), pBar('Λεπτά 76–90+',pa.late,la.lateAg)],{max:100})}
      <div class="small muted" style="margin-top:6px">Μέση απόσταση σουτ: υπέρ ${pf.avgDist.toFixed(1)} μ. · κατά ${pa.avgDist.toFixed(1)} μ.</div></div>
    <div class="card"><h3>🕸️ Δίκτυο πασών (${t.formation})<span class="sp"></span><label class="small muted">min πάσες <input type="range" id="tMP" min="1" max="15" value="${TV.minPass}"></label><button class="btn sm" onclick="svgToPng(document.getElementById('pnT'),'pass_network')">PNG</button></h3>
      <div id="pnBox">${passNetSVG(demoPassNet(t.name, PL), { id:'pnT', minPass:TV.minPass })}</div>
      <div class="small muted" style="margin-top:6px">Κόμβος = μέση θέση & όγκος πασών · πάχος γραμμής = πάσες μεταξύ δύο παικτών. Για πραγματικό δίκτυο: «Ανάλυση Αγώνα» → StatsBomb.</div></div>
    <div class="card"><h3>🔥 Heatmap παίκτη<span class="sp"></span><select id="tHP">${opts(tp.map(p=>[p.id,`${p.name} (${POS_L[p.pos]})`]), TV.hp)}</select></h3>
      ${hpP ? heatSVG(genTouches(hpP), { id:'hmT' }) : '<div class="empty">—</div>'}<div class="small muted" style="margin-top:6px">Επίθεση προς τα δεξιά · ${hpP?`${hpP.min}′ συμμετοχής`:''}</div></div>
    <div class="card"><h3>🧠 Ερμηνεία για τον προπονητή</h3>${teamInsights(t,A,la,pf,pa).map(x=>`<div class="find ${x.k}"><span class="ic">${x.i}</span><div><b>${esc(x.t)}</b><span class="small muted">${esc(x.d)}</span></div></div>`).join('')}</div>
    <div class="card span2"><h3>🏆 Βαθμολογία με advanced metrics — ${esc(LEAGUES[t.league].name)}</h3>
      <div class="tbl-wrap"><table class="t" id="lgT"><tr><th>#</th><th class="l">Ομάδα</th><th>Αγ</th><th data-s="pts">Β</th><th data-s="xpts">xPts</th><th data-s="luck">Β−xPts</th><th>Γκολ</th><th data-s="xgf">xG/αγ</th><th data-s="xga">xGA/αγ</th><th data-s="xgd">xGD/αγ</th><th data-s="ppda">PPDA</th><th data-s="poss">Κατοχή</th><th class="l">Στυλ</th></tr>
      ${tbl.map(r=>`<tr class="${r.t.name===S.settings.myTeam?'me':''}"><td>${r.rank}</td><td class="l click" data-t="${esc(r.t.name)}">${esc(r.t.name)}</td><td>${r.a.n}</td><td><b>${r.a.pts}</b></td><td>${r.a.xpts.toFixed(1)}</td><td style="color:${r.luck>=0?'#fff':'var(--red2)'}">${(r.luck>=0?'+':'')+r.luck.toFixed(1)}</td><td>${r.a.gf}-${r.a.ga}</td><td>${r.a.xgfM.toFixed(2)}</td><td>${r.a.xgaM.toFixed(2)}</td><td>${(r.xgd>=0?'+':'')+r.xgd.toFixed(2)}</td><td>${r.a.ppda.toFixed(1)}</td><td>${r.a.poss.toFixed(0)}%</td><td class="l small muted">${esc(r.t.style)}</td></tr>`).join('')}
      </table></div><div class="small muted" style="margin-top:6px">Κλικ στις επικεφαλίδες για ταξινόμηση · κλικ σε ομάδα για ανάλυση.</div></div>
  </div>`;
  on('#tTeam','change',e=>{ TV.team=e.target.value; VIEWS.team(); });
  on('#tHP','change',e=>{ TV.hp=+e.target.value; VIEWS.team(); });
  on('#tMP','input',e=>{ TV.minPass=+e.target.value; $('#pnBox').innerHTML = passNetSVG(demoPassNet(t.name, PL), { id:'pnT', minPass:TV.minPass }); });
  $$('#lgT th[data-s]').forEach(th=>th.onclick=()=>{ TV.sort=th.dataset.s; VIEWS.team(); });
  $$('#lgT td[data-t]').forEach(td=>td.onclick=()=>{ TV.team=td.dataset.t; VIEWS.team(); });
};
function teamInsights(t,A,la,pf,pa){
  const out=[];
  const fin = A.gf-A.xgf, gk = A.xga-A.ga, luck = A.pts-A.xpts;
  if(luck>4) out.push({k:'weak',i:'🍀',t:`+${luck.toFixed(1)} βαθμοί πάνω από τα xPoints`,d:'Τα αποτελέσματα είναι καλύτερα από την απόδοση. Ιστορικά αυτό «διορθώνεται» — μην αλλάξεις τίποτα με βάση μόνο τη βαθμολογία.'});
  else if(luck<-4) out.push({k:'str',i:'📉',t:`${luck.toFixed(1)} βαθμοί κάτω από τα xPoints`,d:'Η ομάδα παίζει καλύτερα απ’ όσο δείχνει η βαθμολογία. Κράτα τη διαδικασία — τα αποτελέσματα συνήθως ακολουθούν.'});
  if(fin<-3) out.push({k:'weak',i:'🥅',t:`Φινίρισμα ${fin.toFixed(1)} γκολ κάτω από το xG`,d:'Δουλειά στο τελείωμα ή αναζήτηση επιθετικού με ιστορικό G > xG.'});
  if(fin>3) out.push({k:'info',i:'🔥',t:`Φινίρισμα +${fin.toFixed(1)} πάνω από το xG`,d:'Πολύ αποτελεσματικοί — προσοχή, δύσκολα διατηρείται μακροπρόθεσμα.'});
  if(gk>3) out.push({k:'info',i:'🧤',t:`Δέχτηκαν ${gk.toFixed(1)} γκολ λιγότερα από το xGA`,d:'Ο τερματοφύλακας/τύχη «σώζουν» την ομάδα· η άμυνα επιτρέπει καλές ευκαιρίες.'});
  if(pa.sp>la.spAg+.07) out.push({k:'weak',i:'🚩',t:`${Math.round(pa.sp*100)}% του xGA από στημένες`,d:`Μ.Ο. λίγκας ${Math.round(la.spAg*100)}%. Προτεραιότητα προπόνησης: ζωνική/μικτή άμυνα κόρνερ.`});
  if(pf.sp>la.spFor+.07) out.push({k:'str',i:'🎯',t:`Δυνατοί στις στημένες (${Math.round(pf.sp*100)}% του xG)`,d:'Εκμετάλλευση: κέρδισε κόρνερ/φάουλ στο τελευταίο τρίτο.'});
  if(A.xgaM<la.xgaM-.2) out.push({k:'str',i:'🛡️',t:'Άμυνα καλύτερη από τον μέσο όρο',d:`xGA ${A.xgaM.toFixed(2)}/αγ. έναντι ${la.xgaM.toFixed(2)}.`});
  if(A.xgfM>la.xgfM+.2) out.push({k:'str',i:'⚔️',t:'Επίθεση πάνω από τον μέσο όρο',d:`xG ${A.xgfM.toFixed(2)}/αγ. έναντι ${la.xgfM.toFixed(2)}.`});
  if(pa.late>la.lateAg+.06) out.push({k:'weak',i:'⏱️',t:'Πέφτουν στο τελευταίο 15λεπτο',d:`${Math.round(pa.late*100)}% του xGA μετά το 76′. Φρεσκάρισμα με αλλαγές 60′–70′, διαχείριση φορτίου.`});
  if(!out.length) out.push({k:'info',i:'ℹ️',t:'Ισορροπημένο προφίλ',d:'Κανένας δείκτης δεν αποκλίνει έντονα από τον μέσο όρο.'});
  return out;
}

/* ======================= ΑΝΑΛΥΣΗ ΑΝΤΙΠΑΛΟΥ (2σέλιδο report) ======================= */
const CH_L = { L:'αριστερή πλευρά της επίθεσής τους (= δεξιά της άμυνάς μας)', C:'κέντρο', R:'δεξιά πλευρά της επίθεσής τους (= αριστερή της άμυνάς μας)' };
function oppFindings(t){
  const A = teamAgg(t), la = leagueAvg(t.league), pa = shotProfile(genShots(t,'against')), pf = shotProfile(genShots(t,'for'));
  const F = [];
  // Πίεση
  if(A.ppda < la.ppda-1.5) F.push({ k:'str', t:`Έντονο pressing (PPDA ${A.ppda.toFixed(1)})`, d:`Μ.Ο. ${la.ppda.toFixed(1)}. Πιέζουν ψηλά.`, plan:'Παράκαμψη της πίεσης: μακριές μπαλιές στον φορ/τρίτο παίκτη, τερματοφύλακας ως 11ος στο build-up, επιθέσεις στον χώρο πίσω από τη γραμμή πίεσης.' });
  else if(A.ppda > la.ppda+1.5) F.push({ k:'weak', t:`Παθητική πίεση (PPDA ${A.ppda.toFixed(1)})`, d:`Μ.Ο. ${la.ppda.toFixed(1)}. Αφήνουν χρόνο στο build-up.`, plan:'Υπομονετικό build-up, κυκλοφορία για να τους μετακινήσουμε, οι κεντρικοί αμυντικοί να οδηγούν τη μπάλα (progressive carries).' });
  // Άμυνα γενικά
  if(A.xgaM > la.xgaM+.15) F.push({ k:'weak', t:`Επιτρέπουν πολλές ευκαιρίες (xGA ${A.xgaM.toFixed(2)}/αγ.)`, d:`Μ.Ο. ${la.xgaM.toFixed(2)}.`, plan:'Επιθετικό πλάνο από το 1′: όγκος σουτ από καλές θέσεις, παίκτες μέσα στην περιοχή.' });
  else if(A.xgaM < la.xgaM-.15) F.push({ k:'str', t:`Σφιχτή άμυνα (xGA ${A.xgaM.toFixed(2)}/αγ.)`, d:`Μ.Ο. ${la.xgaM.toFixed(2)}.`, plan:'Λίγες καθαρές ευκαιρίες — κάθε στημένη και κάθε μετάβαση μετράει διπλά.' });
  // Στημένες
  if(pa.sp > la.spAg+.06) F.push({ k:'weak', t:`Ευάλωτοι στις στημένες (${Math.round(pa.sp*100)}% του xGA)`, d:`Μ.Ο. ${Math.round(la.spAg*100)}%.`, plan:'Κέρδισε κόρνερ/φάουλ: σέντρες στο πρώτο δοκάρι, μπλοκ στον ζωνικό αμυντικό, 2 ψηλοί στην περιοχή.' });
  if(pf.sp > la.spFor+.06) F.push({ k:'str', t:`Επικίνδυνοι στις στημένες (${Math.round(pf.sp*100)}% του xG τους)`, d:'Μεγάλο μέρος της απειλής τους έρχεται από κόρνερ/φάουλ.', plan:'Αποφυγή φάουλ κοντά στην περιοχή, σωστή ανάθεση μαρκαρίσματος στους ψηλούς τους.' });
  // Κεφαλιές
  if(pa.head > la.headAg+.05) F.push({ k:'weak', t:`Αδύναμοι στον αέρα (${Math.round(pa.head*100)}% του xGA από κεφαλιές)`, d:`Μ.Ο. ${Math.round(la.headAg*100)}%.`, plan:'Σέντρες από τα άκρα και δεύτερος στόχος στο πίσω δοκάρι.' });
  // Πλευρά
  const side = ['L','C','R'].sort((a,b)=>pa[b]-pa[a])[0];
  if(pa[side] > .42) F.push({ k:'weak', t:`Ευάλωτη ζώνη: ${side==='C'?'κέντρο':side==='L'?'δεξιά τους πλευρά':'αριστερή τους πλευρά'} (${Math.round(pa[side]*100)}% του xGA)`, d:`Οι αντίπαλοι βρίσκουν το περισσότερο xG από το ${CH_L[side]}.`, plan: side==='C' ? 'Συνδυασμοί στο κέντρο, παίκτες ανάμεσα στις γραμμές, line-breaking πάσες.' : 'Υπερφόρτωση αυτής της πλευράς: μπακ + εξτρέμ + μέσος (τρίγωνα), αλλαγές πλευράς για απομόνωση 1v1.' });
  // Αντεπίθεση
  if(pa.counter > la.ctAg+.05) F.push({ k:'weak', t:`Ευάλωτοι στις μεταβάσεις (${Math.round(pa.counter*100)}% του xGA από αντεπιθέσεις)`, d:`Μ.Ο. ${Math.round(la.ctAg*100)}%.`, plan:'Άμεση κάθετη πάσα μετά την ανάκτηση, γρήγοροι εξτρέμ ανοιχτά.' });
  // Τέλος αγώνα
  if(pa.late > la.lateAg+.05) F.push({ k:'weak', t:`Πέφτουν στο τέλος (${Math.round(pa.late*100)}% του xGA μετά το 76′)`, d:`Μ.Ο. ${Math.round(la.lateAg*100)}%.`, plan:'Φρέσκα πόδια από τον πάγκο στο 60′–70′, ένταση στο τελευταίο 20λεπτο.' });
  // Κατοχή / στυλ
  if(A.poss>55) F.push({ k:'info', t:`Ομάδα κατοχής (${A.poss.toFixed(0)}%)`, d:'Θα έχουν την μπάλα — προετοιμασία για άμυνα στο μεσαίο μπλοκ.', plan:'Μεσαίο μπλοκ 4-4-2, κλείσιμο κεντρικών διαδρόμων, πίεση-trigger στην πάσα προς τα πλάγια.' });
  else if(A.poss<45) F.push({ k:'info', t:`Αφήνουν την μπάλα (${A.poss.toFixed(0)}% κατοχή)`, d:'Θα έχουμε εμείς την κατοχή απέναντι σε χαμηλό μπλοκ.', plan:'Πλάτος, γρήγορη κυκλοφορία, cut-backs αντί για σέντρες ψηλά, rest-defence για τις αντεπιθέσεις τους.' });
  // Φόρμα
  const l5 = t.matches.slice(-5), x5 = mean(l5.map(m=>m.xgf-m.xga)), xs = mean(t.matches.map(m=>m.xgf-m.xga));
  if(x5 > xs+.3) F.push({ k:'str', t:'Σε ανοδική φόρμα', d:`xGD τελευταίων 5: ${x5>=0?'+':''}${x5.toFixed(2)}/αγ. (σεζόν ${xs>=0?'+':''}${xs.toFixed(2)}).`, plan:'Μην τους υποτιμήσεις — προσαρμογή στο πρόσφατο πλάνο τους.' });
  else if(x5 < xs-.3) F.push({ k:'weak', t:'Σε πτωτική φόρμα', d:`xGD τελευταίων 5: ${x5.toFixed(2)}/αγ. (σεζόν ${xs.toFixed(2)}).`, plan:'Πίεση από την αρχή για να «σπάσει» η αυτοπεποίθησή τους.' });
  return F;
}
VIEWS.opp = function(arg){
  if(arg && DB.teamByName[arg]) S.settings.nextOpp = arg;
  const t = DB.teamByName[S.settings.nextOpp] || DB.teams[1];
  const A = teamAgg(t), la = leagueAvg(t.league), sa = genShots(t,'against'), sf = genShots(t,'for'), pa = shotProfile(sa), pf = shotProfile(sf);
  const F = oppFindings(t), weak = F.filter(f=>f.k==='weak'), strg = F.filter(f=>f.k==='str'), info = F.filter(f=>f.k==='info');
  const key = PL.filter(p=>p.team===t.name && qualified(p)).sort((a,b)=>b._score-a._score).slice(0,6);
  const danger = PL.filter(p=>p.team===t.name && qualified(p)).sort((a,b)=>val(b,'npxgxa')-val(a,'npxgxa'))[0];
  const today = new Date().toLocaleDateString('el-GR');
  const bands = ['0–15','16–30','31–45+','46–60','61–75','76–90+'];
  const fnd = (x,ic)=>`<div class="find ${x.k}"><span class="ic">${ic}</span><div><b>${esc(x.t)}</b><span class="small muted">${esc(x.d)}</span></div></div>`;
  $('#view').innerHTML = `
  <div class="row noprint" style="margin-bottom:14px"><label class="f">Αντίπαλος<select id="oT">${demoTeamOpts(t.name)}</select></label>
    <span class="sp" style="flex:1"></span><button class="btn" id="oTxt">📋 Αντιγραφή σύνοψης</button><button class="btn" data-go="portfolio" data-arg="opp">📣 Κάν’ το post</button><button class="btn pri" onclick="window.print()">🖨 Εκτύπωση / PDF (2 σελίδες)</button></div>
  <div class="report-head"><b>OPPONENT REPORT · ${esc(t.name)}</b><span>${esc(S.settings.author||'DATA COACH 360°')} · ${today}</span></div>
  <div class="grid g3">
    <div class="card"><h3>🆔 Ταυτότητα</h3><div style="font-size:20px;font-weight:800">${esc(t.name)}</div>
      <div class="muted small">${esc(LEAGUES[t.league].name)} · ${rankOf(t)}η θέση · ${A.pts} β. (xPts ${A.xpts.toFixed(1)})</div>
      <div class="row" style="margin:10px 0"><span class="tag r">${esc(t.style)}</span><span class="tag">Σύστημα ${t.formation}</span><span class="tag">${A.w}Ν ${A.d}Ι ${A.l}Η</span></div>
      <div class="small muted">Φόρμα (τελευταίοι 6)</div><div>${t.matches.slice(-6).map(resChip).join('')}</div>
      ${danger?`<hr><div class="small muted">Επικίνδυνος παίκτης</div><div>${plink(danger)} <span class="tag r">${POS_L[danger.pos]}</span> <span class="small muted">npxG+xA ${val(danger,'npxgxa').toFixed(2)}/90</span></div>`:''}</div>
    <div class="card span2"><h3>📊 Βασικοί δείκτες vs Μ.Ο. λίγκας <span class="small muted">(λευκή γραμμή = Μ.Ο.)</span></h3>
      ${barsHTML([
        { l:'xG υπέρ / αγ.', v:A.xgfM, avg:la.xgfM }, { l:'xG κατά / αγ.', v:A.xgaM, avg:la.xgaM, color:COL.white },
        { l:'PPDA (↓ = πίεση)', v:A.ppda, avg:la.ppda, color:COL.gray, txt:A.ppda.toFixed(1) }, { l:'Κατοχή %', v:A.poss, avg:50, color:COL.gray, txt:A.poss.toFixed(0)+'%' },
        { l:'xG στημένων υπέρ', v:A.spxgf/A.n, avg:la.spxgfM, color:COL.blue }, { l:'xG στημένων κατά', v:A.spxga/A.n, avg:la.spxgaM, color:COL.purple }
      ], { each:true })}</div>
    <div class="card"><h3>🎯 Αδύναμα σημεία (${weak.length})</h3>${weak.map(x=>fnd(x,'🎯')).join('')||'<div class="muted small">Δεν εντοπίστηκαν.</div>'}</div>
    <div class="card"><h3>⚠️ Δυνατά σημεία (${strg.length})</h3>${strg.map(x=>fnd(x,'⚠️')).join('')||'<div class="muted small">Δεν εντοπίστηκαν.</div>'}${info.map(x=>fnd(x,'ℹ️')).join('')}</div>
    <div class="card"><h3>📝 Πλάνο αγώνα (προτάσεις)</h3><ol style="margin:0;padding-left:18px">${F.map(f=>`<li style="margin-bottom:7px">${esc(f.plan)}</li>`).join('')}</ol></div>
    ${(()=>{ const sq=myTeamPlayers(); if(!sq.length) return ''; const fl=oppFlags(t); const r=SYSTEMS.map(s=>{ const xi=bestXI(s,sq), mu=matchup(s,fl); return { s, xi, mu, tot:fitMix()*xi.avg+(1-fitMix())*mu.score }; }).sort((a,b)=>b.tot-a.tot).slice(0,3);
      return `<div class="card span2"><h3>🧩 Προτεινόμενο σύστημα για ${esc(S.settings.myTeam)}<span class="sp"></span><button class="btn sm noprint" data-go="fit" data-arg="${r[0].s.id}">Άνοιγμα Fit →</button></h3><div class="grid g3">${r.map((x,i)=>`<div class="pillar" data-go="fit" data-arg="${x.s.id}"><div class="n">${i+1}</div><b>${esc(x.s.f)} · ${esc(x.s.n)}</b><div class="small muted">${esc(x.s.c)} · fit ${Math.round(x.xi.avg)}% · matchup ${x.mu.score}</div><div class="small" style="margin-top:4px">${x.mu.why.filter(w=>w.d>0).slice(0,2).map(w=>esc(w.txt)).join('<br>')}</div></div>`).join('')}</div></div>`; })()}
  </div>
  <div class="page-break"></div>
  <div class="report-head"><b>OPPONENT REPORT · ${esc(t.name)} · σελ. 2</b><span>${today}</span></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>🛡️ Πού τους βρίσκουν (σουτ κατά) · xGA ${pa.xg.toFixed(1)}</h3>${shotMapSVG(sa,{colorBy:'pattern',id:'oSA'})}${PAT_LEGEND}</div>
    <div class="card"><h3>⚔️ Πώς απειλούν (σουτ υπέρ) · xG ${pf.xg.toFixed(1)}</h3>${shotMapSVG(sf,{colorBy:'pattern',id:'oSF'})}</div>
    <div class="card"><h3>↔️ xG κατά ανά ζώνη επίθεσης αντιπάλων</h3>${barsHTML([
        { l:'Αριστερά (δεξιά άμυνά τους)', v:pa.L*100, txt:Math.round(pa.L*100)+'%' }, { l:'Κέντρο', v:pa.C*100, txt:Math.round(pa.C*100)+'%' }, { l:'Δεξιά (αριστερή άμυνά τους)', v:pa.R*100, txt:Math.round(pa.R*100)+'%' }],{max:100})}
      <hr><h3>⏱️ xG κατά ανά χρονικό διάστημα</h3>${barsHTML(pa.bands.map((b,i)=>({ l:bands[i]+'′', v:b*100, txt:Math.round(b*100)+'%', color:i===5?COL.red:COL.gray })),{max:Math.max(30,...pa.bands.map(b=>b*100))})}</div>
    <div class="card"><h3>⭐ Βασικοί παίκτες (score ρόλου)</h3><table class="t"><tr><th class="l">Παίκτης</th><th>Θέση</th><th>Λεπτά</th><th>Score</th><th class="l">Χαρακτηριστικό</th></tr>
      ${key.map(p=>{ const best = ROLES[p._role].m.map(k=>[k,pct(p,k)]).sort((a,b)=>b[1]-a[1])[0]; return `<tr><td class="l">${plink(p)}</td><td>${POS_L[p.pos]}</td><td>${p.min}</td><td><b style="color:${scoreCol(p._score)}">${Math.round(p._score)}</b></td><td class="l small">${esc(M[best[0]].l)} · ${Math.round(best[1])}ο εκατ.</td></tr>`; }).join('')}</table>
      <div class="small muted" style="margin-top:8px">Score = μέσο εκατοστημόριο στις μετρικές του ρόλου, έναντι παικτών ίδιας θέσης (≥${S.settings.minMin}′).</div></div>
  </div>`;
  on('#oT','change',e=>{ S.settings.nextOpp=e.target.value; save(); VIEWS.opp(); });
  on('#oTxt','click',()=>copyText(`OPPONENT REPORT — ${t.name}\n${rankOf(t)}η θέση · ${A.pts} β. · ${t.style} · ${t.formation}\nxG ${A.xgfM.toFixed(2)} / xGA ${A.xgaM.toFixed(2)} ανά αγώνα · PPDA ${A.ppda.toFixed(1)}\n\nΑΔΥΝΑΜΙΕΣ:\n${weak.map(f=>'• '+f.t).join('\n')||'—'}\n\nΔΥΝΑΤΑ ΣΗΜΕΙΑ:\n${strg.map(f=>'• '+f.t).join('\n')||'—'}\n\nΠΛΑΝΟ:\n${F.map((f,i)=>(i+1)+'. '+f.plan).join('\n')}`));
};

/* ======================= ΑΝΑΛΥΣΗ ΑΓΩΝΑ (event data) ======================= */
const SB_BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data/';
const MV = { ev:null, comps:null, matches:null, comp:'', match:'', team:null, player:null, minPass:3, loading:false };
function parseSB(events, meta){
  const ev = { demo:false, title:'', teams:[], shots:[], passes:[], touches:[], xi:{}, subMin:{}, og:{} };
  for(const e of events){
    const tn = e.team?.name, ty = e.type?.name;
    if(tn && !ev.teams.includes(tn)) ev.teams.push(tn);
    if(e.period===5) continue;
    if(ty==='Starting XI') ev.xi[tn] = (e.tactics?.lineup||[]).map(l=>({ name:l.player?.name, pos:l.position?.name }));
    if(ty==='Substitution' && ev.subMin[tn]==null) ev.subMin[tn] = e.minute;
    if(ty==='Own Goal For') ev.og[tn] = (ev.og[tn]||0)+1;
    if(e.location && e.player) ev.touches.push({ team:tn, player:e.player.name, x:e.location[0], y:e.location[1] });
    if(ty==='Shot' && e.location){ const sh=e.shot||{};
      ev.shots.push({ team:tn, player:e.player?.name, minute:e.minute, x:e.location[0], y:e.location[1], xg:sh.statsbomb_xg||0, outcome:sh.outcome?.name||'', pattern:(sh.type?.name==='Penalty'?'Πέναλτι':sh.type?.name==='Free Kick'?'Φάουλ':e.play_pattern?.name==='From Corner'?'Κόρνερ':e.play_pattern?.name==='From Counter'?'Αντεπίθεση':'Ανοιχτό παιχνίδι'), header:sh.body_part?.name==='Head' });
    }
    if(ty==='Pass' && e.location && e.pass){ ev.passes.push({ team:tn, player:e.player?.name, recipient:e.pass.recipient?.name, x:e.location[0], y:e.location[1], ex:e.pass.end_location?.[0], ey:e.pass.end_location?.[1], ok:!e.pass.outcome, minute:e.minute }); }
  }
  if(meta){ ev.title = `${meta.home_team?.home_team_name} ${meta.home_score}–${meta.away_score} ${meta.away_team?.away_team_name} · ${meta.competition?.competition_name||''} ${meta.season?.season_name||''} · ${meta.match_date||''}`;
    const h=meta.home_team?.home_team_name; if(h && ev.teams[0]!==h && ev.teams.includes(h)) ev.teams.sort((a,b)=>a===h?-1:b===h?1:0); }
  else ev.title = ev.teams.join(' – ');
  return ev;
}
function computeNet(ev, team, minPass){
  const until = ev.subMin[team] ?? 999, xiNames = ev.xi[team] ? new Set(ev.xi[team].map(x=>x.name)) : null;
  const ps = ev.passes.filter(p=>p.team===team && p.ok && p.minute<until && p.recipient && (!xiNames || (xiNames.has(p.player) && xiNames.has(p.recipient))));
  const node = {}, pair = {};
  for(const p of ps){
    (node[p.player] ||= { id:p.player, label:p.player, xs:[], ys:[], n:0 }); node[p.player].xs.push(p.x); node[p.player].ys.push(p.y); node[p.player].n++;
    (node[p.recipient] ||= { id:p.recipient, label:p.recipient, xs:[], ys:[], n:0 }); if(p.ex!=null){ node[p.recipient].xs.push(p.ex); node[p.recipient].ys.push(p.ey); }
    const k = [p.player,p.recipient].sort().join('|'); pair[k]=(pair[k]||0)+1;
  }
  const nodes = Object.values(node).filter(n=>n.xs.length).map(n=>({ id:n.id, label:n.label, short:n.label.split(' ').slice(-1)[0], x:mean(n.xs), y:mean(n.ys), n:n.n }));
  const edges = Object.entries(pair).map(([k,n])=>{ const [a,b]=k.split('|'); return { a, b, n }; });
  return { nodes, edges, until };
}
function matchSummary(ev){
  return ev.teams.map(t=>{ const s=ev.shots.filter(x=>x.team===t), oth=ev.teams.find(x=>x!==t);
    return { team:t, shots:s.length, sot:s.filter(x=>['Goal','Saved','Saved to Post'].includes(x.outcome)).length, xg:sum(s.map(x=>x.xg)), goals:s.filter(x=>x.outcome==='Goal').length + (ev.og[t]||0),
      passes:ev.passes.filter(p=>p.team===t).length, passOk:ev.passes.filter(p=>p.team===t&&p.ok).length,
      f3:ev.touches.filter(p=>p.team===t && p.x>=80).length }; });
}
VIEWS.match = function(){
  if(!MV.ev) MV.ev = demoMatch(S.settings.myTeam in DB.teamByName ? S.settings.myTeam : DB.teams[0].name, S.settings.nextOpp, PL);
  const ev = MV.ev;
  if(!MV.team || !ev.teams.includes(MV.team)) MV.team = ev.teams[0];
  const sm = matchSummary(ev), [A,B] = sm;
  const colA = COL.red, colB = COL.white;
  const race = ev.teams.map((t,i)=>{ let c=0; const pts=[[0,0]]; ev.shots.filter(s=>s.team===t).sort((a,b)=>a.minute-b.minute).forEach(s=>{ c+=s.xg; pts.push([s.minute,c,`${esc(s.player||'')} ${s.minute}′ · xG ${fmt(s.xg)}${s.outcome==='Goal'?' · ⚽ ΓΚΟΛ':''}`, s.outcome==='Goal']); }); pts.push([Math.max(90,...ev.shots.map(s=>s.minute)),c]); return { name:t, color:i?colB:colA, pts, step:true, dots:true, width:2.6 }; });
  const shotsInner = ev.shots.map(s=>{ const home = s.team===ev.teams[0]; const x = home?s.x:120-s.x, y = home?s.y:80-s.y, r=0.9+Math.sqrt(s.xg)*4.2, g=s.outcome==='Goal', c=home?colA:colB;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${g?COL.gold:c}" fill-opacity="${g?1:.35}" stroke="${g?'#000':c}" stroke-width=".35" data-tip="${esc(s.team)}<br>${esc(s.player||'')} ${s.minute}′<br>xG ${fmt(s.xg)} · ${esc(outcomeGR(s.outcome))}"/>`; }).join('');
  const net = computeNet(ev, MV.team, MV.minPass);
  const tPlayers = [...new Set(ev.touches.filter(t=>t.team===MV.team).map(t=>t.player))];
  if(!MV.player || !tPlayers.includes(MV.player)) MV.player = tPlayers[0];
  const topX = Object.entries(ev.shots.reduce((o,s)=>{ o[s.player+'|'+s.team]=(o[s.player+'|'+s.team]||0)+s.xg; return o; },{})).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const topP = Object.entries(ev.passes.filter(p=>p.ok).reduce((o,p)=>{ o[p.player+'|'+p.team]=(o[p.player+'|'+p.team]||0)+1; return o; },{})).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const compOpts = MV.comps ? MV.comps.map(c=>[c.competition_id+'_'+c.season_id, `${c.competition_name} · ${c.season_name}`]) : [];
  $('#view').innerHTML = `
  <div class="card"><h3>📡 Πηγή δεδομένων αγώνα</h3><div class="row">
    <button class="btn ${ev.demo?'pri':''}" id="mDemo">🎲 Αγώνας επίδειξης (η ομάδα μου vs αντίπαλος)</button>
    <button class="btn" id="mComps">🌐 StatsBomb Open Data (online)</button>
    ${MV.comps?`<select id="mComp" style="max-width:320px"><option value="">— Διοργάνωση —</option>${opts(compOpts, MV.comp)}</select>`:''}
    ${MV.matches?`<select id="mMatch" style="max-width:360px"><option value="">— Αγώνας —</option>${opts(MV.matches.map(m=>[m.match_id,`${m.match_date} · ${m.home_team.home_team_name} ${m.home_score}-${m.away_score} ${m.away_team.away_team_name}`]), MV.match)}</select><button class="btn pri" id="mLoad">Φόρτωση</button>`:''}
    <label class="btn">📂 Αρχείο events JSON<input type="file" id="mFile" accept=".json" hidden></label>
    <span class="small muted" id="mMsg">${MV.loading?'⏳ Φόρτωση…':''}</span></div>
    <div class="small muted" style="margin-top:6px">Γρήγορη αρχή: Τελικός Μουντιάλ 2022 (match_id 3869685) · <button class="btn sm" id="mWC">Φόρτωσε τον</button> · Τα StatsBomb open data διατίθενται για έρευνα/εκπαίδευση — ανάφερε την πηγή όταν δημοσιεύεις.</div></div>
  <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between">
    <div><div class="muted small">${ev.demo?'Συνθετικός αγώνας επίδειξης':'StatsBomb Open Data'}</div><div style="font-size:19px;font-weight:800">${esc(ev.title)}</div></div>
    <div class="row" style="font-size:22px;font-weight:800"><span style="color:${colA}">${esc(A.team)}</span> ${A.goals} – ${B?B.goals:0} <span>${esc(B?B.team:'')}</span></div></div>
    <table class="t" style="margin-top:10px"><tr><th class="l">Ομάδα</th><th>Γκολ</th><th>xG</th><th>Σουτ</th><th>Στο στόχο</th><th>Πάσες</th><th>Ευστοχία</th><th>Ενέργειες στο τελ. τρίτο</th></tr>
    ${sm.map((r,i)=>`<tr><td class="l" style="color:${i?colB:colA};font-weight:700">${esc(r.team)}</td><td>${r.goals}</td><td><b>${r.xg.toFixed(2)}</b></td><td>${r.shots}</td><td>${r.sot}</td><td>${r.passes}</td><td>${r.passes?Math.round(100*r.passOk/r.passes):0}%</td><td>${r.f3}</td></tr>`).join('')}</table></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card span2"><h3>🏁 xG race (αθροιστικό xG ανά λεπτό)<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('mRace'),'xg_race')">PNG</button></h3>${lineSVG(race,{ id:'mRace', h:260, yl:'αθροιστικό xG', xFmt:v=>v+'′', vlines:[{x:45,label:'ΗΜ'}] })}<div class="small muted">Χρυσές κουκκίδες = γκολ.</div></div>
    <div class="card span2"><h3>🎯 Χάρτης σουτ — ${esc(ev.teams[0])} → δεξιά · ${esc(ev.teams[1]||'')} ← αριστερά<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('mShots'),'shot_map')">PNG</button></h3>${pitchSVG(shotsInner,{id:'mShots'})}</div>
    <div class="card"><h3>🕸️ Δίκτυο πασών<span class="sp"></span><select id="mTeam">${opts(ev.teams, MV.team)}</select></h3>
      <div class="row small muted">Min πάσες ανά ζευγάρι <input type="range" id="mMP" min="1" max="12" value="${MV.minPass}"> <b id="mMPv">${MV.minPass}</b> · έως ${net.until<999?net.until+'′ (1η αλλαγή)':'τέλος'}</div>
      <div id="mNet">${passNetSVG(net,{ id:'mNetSvg', minPass:MV.minPass, color: MV.team===ev.teams[0]?colA:colB })}</div></div>
    <div class="card"><h3>🔥 Heatmap ενεργειών<span class="sp"></span><select id="mPl" style="max-width:220px">${opts(tPlayers, MV.player)}</select></h3>${heatSVG(ev.touches.filter(t=>t.player===MV.player),{id:'mHeat'})}</div>
    <div class="card"><h3>⭐ Top xG</h3><table class="t">${topX.map(([k,v])=>{ const [p,t]=k.split('|'); return `<tr><td class="l">${esc(p)}</td><td class="l small muted">${esc(t)}</td><td><b>${v.toFixed(2)}</b></td></tr>`; }).join('')}</table></div>
    <div class="card"><h3>🔁 Top πασέρ (επιτυχημένες)</h3><table class="t">${topP.map(([k,v])=>{ const [p,t]=k.split('|'); return `<tr><td class="l">${esc(p)}</td><td class="l small muted">${esc(t)}</td><td><b>${v}</b></td></tr>`; }).join('')}</table></div>
  </div>`;
  const msg = m=>{ const e=$('#mMsg'); if(e) e.textContent=m; };
  on('#mDemo','click',()=>{ MV.ev = demoMatch(DB.teamByName[S.settings.myTeam]?S.settings.myTeam:DB.teams[0].name, S.settings.nextOpp, PL); VIEWS.match(); });
  async function getJSON(u){ const r = await fetch(u); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }
  on('#mComps','click',async()=>{ msg('⏳ Λήψη διοργανώσεων…'); try{ MV.comps = (await getJSON(SB_BASE+'competitions.json')).sort((a,b)=>a.competition_name.localeCompare(b.competition_name)||b.season_name.localeCompare(a.season_name)); VIEWS.match(); }catch(e){ msg('✖ Χωρίς σύνδεση ή μπλοκαρισμένο αίτημα: '+e.message); } });
  on('#mComp','change',async e=>{ MV.comp=e.target.value; MV.matches=null; if(!MV.comp) return VIEWS.match(); const [c,s]=MV.comp.split('_'); msg('⏳ Λήψη αγώνων…'); try{ MV.matches=(await getJSON(`${SB_BASE}matches/${c}/${s}.json`)).sort((a,b)=>b.match_date.localeCompare(a.match_date)); VIEWS.match(); }catch(err){ msg('✖ '+err.message); } });
  async function loadMatch(id, meta){ msg('⏳ Λήψη events (μπορεί να είναι 3–5 MB)…'); try{ const evs = await getJSON(`${SB_BASE}events/${id}.json`); MV.ev = parseSB(evs, meta); MV.team=null; MV.player=null; MV.match=String(id); VIEWS.match(); toast('Φορτώθηκε ✔'); }catch(err){ msg('✖ '+err.message); } }
  on('#mLoad','click',()=>{ const id=$('#mMatch').value; if(!id) return; loadMatch(id, MV.matches.find(m=>String(m.match_id)===id)); });
  on('#mWC','click',()=>loadMatch(3869685, { home_team:{home_team_name:'Argentina'}, away_team:{away_team_name:'France'}, home_score:3, away_score:3, competition:{competition_name:'FIFA World Cup'}, season:{season_name:'2022'}, match_date:'2022-12-18' }));
  on('#mFile','change',e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ MV.ev=parseSB(JSON.parse(t)); MV.team=null; MV.player=null; VIEWS.match(); }catch(err){ toast('Μη έγκυρο JSON events'); } }); });
  on('#mTeam','change',e=>{ MV.team=e.target.value; MV.player=null; VIEWS.match(); });
  on('#mPl','change',e=>{ MV.player=e.target.value; VIEWS.match(); });
  on('#mMP','input',e=>{ MV.minPass=+e.target.value; $('#mMPv').textContent=MV.minPass; $('#mNet').innerHTML = passNetSVG(computeNet(ev, MV.team, MV.minPass),{ id:'mNetSvg', minPass:MV.minPass, color: MV.team===ev.teams[0]?colA:colB }); });
};
