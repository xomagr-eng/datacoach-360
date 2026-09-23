'use strict';
/* ===== DATA COACH 360° — Συνθετικά δεδομένα επίδειξης (ντετερμινιστικά, seeded) =====
   Όλες οι ομάδες/παίκτες είναι ΦΑΝΤΑΣΤΙΚΟΙ. Για πραγματικά δεδομένα: καρτέλα «Δεδομένα» (FBref CSV / StatsBomb). */

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hashStr(s){ let h=2166136261; for(const c of String(s)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function makeRng(seed){
  const r = mulberry32(seed);
  const o = { r,
    u:(a,b)=>a+r()*(b-a),
    i:(a,b)=>Math.floor(a+r()*(b-a+1)),
    pick:a=>a[Math.floor(r()*a.length)],
    g:()=>{ let u=0,v=0; while(!u)u=r(); while(!v)v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); },
    pois:l=>{ const L=Math.exp(-l); let k=0,p=1; do{ k++; p*=r(); }while(p>L); return k-1; }
  };
  return o;
}

const SEASON = '2026/27';
const LEAGUES = {
  L1:{ id:'L1', name:'Super League (demo)', short:'SL1', rounds:24, q:1 },
  L2:{ id:'L2', name:'Super League 2 (demo)', short:'SL2', rounds:22, q:.8 }
};
const MY_TEAM_DEFAULT = 'Ερυθρόλευκοι ΦΚ';
const TEAM_NAMES = {
  L1:[MY_TEAM_DEFAULT,'Αστέρας Αιγαίου','Θύελλα Βορρά','Κεραυνός Αθηνών','Ποσειδών Πειραιά','Ιππότες Ρόδου','Αετοί Ηπείρου','Τιτάνες Λάρισας','Φοίνικες Κρήτης','Λέοντες Αχαΐας','Δελφίνια Κέρκυρας','Κένταυροι Πηλίου'],
  L2:['Ακρίτας Έβρου','Νέα Γενιά Βόλου','Ολύμπιος Κατερίνης','Ορεινός Τρικάλων','Πύρρος Άρτας','Αργοναύτες Ιωλκού','Μινωικός Χανίων','Θρακικός Ξάνθης']
};
const STYLES = ['Κατοχή & build-up','Υψηλή πίεση','Κάθετο / direct','Χαμηλό μπλοκ & αντεπίθεση','Ισορροπημένο'];
const FORMATIONS = ['4-3-3','4-2-3-1','3-5-2','4-4-2','3-4-3'];

const FIRST_GR = ['Γιώργος','Νίκος','Κώστας','Δημήτρης','Γιάννης','Παναγιώτης','Βασίλης','Χρήστος','Άγγελος','Στέλιος','Μάριος','Θανάσης','Λευτέρης','Σωτήρης','Μιχάλης','Αντώνης','Ηλίας','Φώτης','Πέτρος','Τάσος','Αλέξης','Στράτος','Ορέστης','Ζήσης','Λάμπρος','Άρης','Μανώλης','Σπύρος'];
const LAST_GR  = ['Παπαδόπουλος','Γεωργίου','Νικολάου','Καραγιάννης','Βλάχος','Αντωνίου','Μακρής','Οικονόμου','Δημητρίου','Κωνσταντίνου','Αλεξίου','Σταθόπουλος','Μιχαηλίδης','Παππάς','Ζαφειρίου','Λαμπράκης','Τσιρίγος','Χατζής','Ρήγας','Σιδέρης','Κουτσός','Αναστασίου','Μαυρίδης','Πετρίδης','Φραγκιαδάκης','Σαββίδης','Κυριακίδης','Ηλιόπουλος','Ξενάκης','Δρόσος','Μπαλτάς','Κεχαγιάς','Τζαννής','Λιάπης','Βρεττός'];
const FIRST_FX = ['Marko','Luka','Diego','João','Karim','Ivan','Pablo','Mateo','Nikola','Andrej','Rui','Sergio','Tomás','Yannick','Bruno','Emil','Lars','Kwame','Idrissa','Facundo'];
const LAST_FX  = ['Petrović','Silva','Kovač','Fernández','Mendes','Diallo','Novak','Ruiz','Horvat','Costa','Traoré','Jović','Santos','Mbala','Ibáñez','Kroll','Lindqvist','Mensah','Sarr','Acosta'];

/* Βασικά προφίλ ανά θέση (ανά 90') */
const BASE = {
  GK:{npxg:0,xa:.01,shots:0,kp:.05,progP:1.2,progC:.1,crosses:0,tkl:.05,int:.1,recov:2.5,clear:1.2,aerT:.6,aerP:.8,dduelT:.3,dduelP:.6,drbA:0,drbP:.5,touchBox:0,lineBreak:.8,pressures:.5,passAtt:30,passP:.74,f3Att:.2,f3P:.5,save:.70},
  CB:{npxg:.05,xa:.02,shots:.5,kp:.25,progP:4.5,progC:.8,crosses:.05,tkl:1.3,int:1.3,recov:5,clear:4,aerT:4,aerP:.6,dduelT:5,dduelP:.62,drbA:.3,drbP:.55,touchBox:.6,lineBreak:1.8,pressures:9,passAtt:55,passP:.86,f3Att:8,f3P:.72},
  FB:{npxg:.05,xa:.12,shots:.6,kp:.9,progP:4,progC:2.8,crosses:.9,tkl:2,int:1.2,recov:5.5,clear:1.8,aerT:2,aerP:.48,dduelT:6,dduelP:.58,drbA:1.3,drbP:.55,touchBox:1.6,lineBreak:1.2,pressures:14,passAtt:45,passP:.8,f3Att:14,f3P:.7},
  DM:{npxg:.04,xa:.06,shots:.6,kp:.8,progP:6,progC:1.2,crosses:.1,tkl:2.3,int:1.6,recov:7,clear:1.5,aerT:2.5,aerP:.52,dduelT:7,dduelP:.58,drbA:.6,drbP:.6,touchBox:.5,lineBreak:2.6,pressures:17,passAtt:60,passP:.87,f3Att:14,f3P:.78},
  CM:{npxg:.08,xa:.1,shots:1,kp:1.3,progP:5.5,progC:1.8,crosses:.3,tkl:1.8,int:1,recov:6,clear:.8,aerT:1.5,aerP:.45,dduelT:6,dduelP:.55,drbA:1.2,drbP:.58,touchBox:1.5,lineBreak:2.2,pressures:18,passAtt:50,passP:.83,f3Att:18,f3P:.74},
  AM:{npxg:.18,xa:.2,shots:2,kp:2.2,progP:4.5,progC:2.5,crosses:.8,tkl:1,int:.5,recov:4,clear:.3,aerT:1,aerP:.35,dduelT:4,dduelP:.45,drbA:2.5,drbP:.55,touchBox:3.5,lineBreak:1.8,pressures:16,passAtt:40,passP:.78,f3Att:20,f3P:.7},
  W:{npxg:.22,xa:.17,shots:2.3,kp:1.8,progP:3,progC:4,crosses:1.5,tkl:1,int:.4,recov:3.5,clear:.3,aerT:1,aerP:.35,dduelT:4.5,dduelP:.42,drbA:4,drbP:.5,touchBox:5,lineBreak:.9,pressures:15,passAtt:30,passP:.76,f3Att:15,f3P:.68},
  ST:{npxg:.38,xa:.08,shots:3,kp:.9,progP:1.2,progC:1.5,crosses:.2,tkl:.5,int:.2,recov:2.5,clear:.6,aerT:5,aerP:.45,dduelT:3,dduelP:.4,drbA:1.8,drbP:.48,touchBox:6,lineBreak:.5,pressures:14,passAtt:22,passP:.72,f3Att:8,f3P:.65}
};
const ATT_KEYS = ['npxg','xa','shots','kp','progC','crosses','touchBox','drbA'];
const SQUAD_TEMPLATE = ['GK','GK','CB','CB','CB','CB','FB','FB','FB','FB','DM','DM','CM','CM','AM','W','W','W','ST','ST','ST'];

/* Θέσεις σχηματισμών (επίθεση → δεξιά) */
const FORMATION_SLOTS = {
  '4-3-3':  [['GK',8,40],['FB',36,70],['CB',28,52],['CB',28,28],['FB',36,10],['DM',46,40],['CM',60,56],['CM',60,24],['W',88,68],['ST',98,40],['W',88,12]],
  '4-2-3-1':[['GK',8,40],['FB',36,70],['CB',28,52],['CB',28,28],['FB',36,10],['DM',48,50],['CM',48,30],['W',82,68],['AM',80,40],['W',82,12],['ST',100,40]],
  '3-5-2':  [['GK',8,40],['CB',28,58],['CB',26,40],['CB',28,22],['FB',58,72],['DM',46,40],['CM',60,54],['CM',60,26],['FB',58,8],['ST',96,48],['ST',96,32]]
};
function slotsFor(f){ return FORMATION_SLOTS[f] || (f.startsWith('3') ? FORMATION_SLOTS['3-5-2'] : f==='4-4-2' ? FORMATION_SLOTS['4-2-3-1'] : FORMATION_SLOTS['4-3-3']); }

function rotate(a,k){ return a.slice(k).concat(a.slice(0,k)); }

/* ---------- xG μοντέλο (logistic: γωνία + απόσταση, κεφαλιά) ---------- */
function shotGeom(x,y){
  const dx = 120-x, dist = Math.hypot(dx, 40-y);
  let ang = Math.abs(Math.atan2(44-y, dx) - Math.atan2(36-y, dx));
  if(ang > Math.PI) ang = 2*Math.PI-ang;
  return { dist, ang };
}
function xgModel(x,y,header=false,situation=''){
  if(situation==='penalty') return 0.76;
  const { dist, ang } = shotGeom(x,y);
  let z = -1.09 + 1.2*ang - 0.12*dist;
  if(header) z -= 0.7;
  if(situation==='counter') z += 0.25;
  if(situation==='directfk') z -= 0.35;
  return 1/(1+Math.exp(-z));
}

/* ---------- Ομάδες & αγώνες ---------- */
function genTeams(){
  const rg = makeRng(2026), teams = [];
  for(const lg of ['L1','L2']) TEAM_NAMES[lg].forEach((n,i)=>{
    const mine = n===MY_TEAM_DEFAULT;
    const q = LEAGUES[lg].q * (mine ? 1.07 : rg.u(.84,1.2));
    const style = mine ? 'Κατοχή & build-up' : rg.pick(STYLES);
    const ppda = style==='Υψηλή πίεση' ? rg.u(7,8.8) : style.startsWith('Χαμηλό') ? rg.u(14,17.5) : rg.u(9.5,13.5);
    const poss = style.startsWith('Κατοχή') ? rg.u(55,62) : style.startsWith('Χαμηλό') ? rg.u(38,45) : rg.u(45,54);
    teams.push({ id:lg+'-'+i, name:n, league:lg, q, style, ppda, poss,
      att: q*rg.u(.88,1.14), def: rg.u(.88,1.14)/q,
      spWeak: rg.r(), spStr: rg.r(), aerWeak: rg.r(), lateFade: rg.r(),
      counterVuln: (style.startsWith('Κατοχή')||style==='Υψηλή πίεση') ? rg.u(.45,1) : rg.u(0,.55),
      weakSide: rg.pick(['L','C','R']), weakSideStr: rg.r(),
      formation: mine ? '4-3-3' : rg.pick(FORMATIONS), matches: [] });
  });
  for(const lg of ['L1','L2']){
    const T = teams.filter(t=>t.league===lg), n = T.length, R = LEAGUES[lg].rounds;
    for(let r=0;r<R;r++){
      const rot = [T[0], ...rotate(T.slice(1), r%(n-1))];
      for(let k=0;k<n/2;k++){
        const a=rot[k], b=rot[n-1-k], home=(r+k)%2===0?a:b, away=home===a?b:a;
        const lh = Math.max(.2, 1.32*home.att*away.def*1.08*rg.u(.55,1.5));
        const la = Math.max(.2, 1.32*away.att*home.def*.93*rg.u(.55,1.5));
        const gh = rg.pois(lh*.97), ga = rg.pois(la*.97);
        const ph = clamp(100*home.poss/(home.poss+away.poss)+rg.g()*4, 25, 75);
        home.matches.push({ r:r+1, opp:away.name, home:true,  xgf:+lh.toFixed(2), xga:+la.toFixed(2), gf:gh, ga, ppda:+(home.ppda*rg.u(.8,1.22)).toFixed(1), poss:Math.round(ph), spxgf:0, spxga:0 });
        away.matches.push({ r:r+1, opp:home.name, home:false, xgf:+la.toFixed(2), xga:+lh.toFixed(2), gf:ga, ga:gh, ppda:+(away.ppda*rg.u(.8,1.22)).toFixed(1), poss:100-Math.round(ph), spxgf:0, spxga:0 });
      }
    }
  }
  return teams;
}

/* ---------- Σουτ (για/κατά) ανά ομάδα: αθροίζουν στο xG κάθε αγώνα ---------- */
function oneShot(rg, t, side, round){
  const against = side==='against';
  const pSP = .24 + (against ? (t.spWeak-.5)*.18 : (t.spStr-.5)*.18);
  const pCt = .12 + (against ? (t.counterVuln-.5)*.14 : 0);
  const u = rg.r();
  let pattern = u<pSP ? (rg.r()<.65?'Κόρνερ':'Φάουλ') : u<pSP+pCt ? 'Αντεπίθεση' : 'Ανοιχτό παιχνίδι';
  const penalty = pattern!=='Αντεπίθεση' && rg.r()<.022;
  let ch;
  if(against && t.weakSideStr>.3){ const pw=.36+.3*t.weakSideStr, others=['L','C','R'].filter(c=>c!==t.weakSide); ch = rg.r()<pw ? t.weakSide : rg.pick(others); }
  else { const r2=rg.r(); ch = r2<.33?'L':r2<.66?'C':'R'; }
  let x,y;
  if(penalty){ x=108; y=40; }
  else {
    const d = pattern==='Κόρνερ' ? Math.abs(rg.g())*4.5+5 : pattern==='Φάουλ' && rg.r()<.4 ? rg.u(18,30) : Math.abs(rg.g())*9+6;
    const yOff = ch==='C' ? rg.g()*5 : ch==='L' ? -(Math.abs(rg.g())*8+3) : (Math.abs(rg.g())*8+3);
    y = clamp(40+yOff, 3, 77); const dx = Math.sqrt(Math.max(1, d*d-(y-40)**2)); x = clamp(120-dx, 62, 119.3);
  }
  let pH = pattern==='Κόρνερ'?.58 : pattern==='Φάουλ'?.3 : .1; if(against) pH *= (.7+.6*t.aerWeak);
  const header = !penalty && rg.r()<pH;
  let minute = rg.i(1,93); if(against && rg.r() < t.lateFade*.28) minute = rg.i(76,95);
  const sit = penalty?'penalty' : pattern==='Αντεπίθεση'?'counter' : '';
  const xg = xgModel(x,y,header,sit);
  return { x:+x.toFixed(1), y:+y.toFixed(1), xg:+xg.toFixed(3), pattern: penalty?'Πέναλτι':pattern, header, ch, minute, round, outcome:'' };
}
const _shotCache = {};
function genShots(t, side){
  const key = t.id+side; if(_shotCache[key]) return _shotCache[key];
  const rg = makeRng(hashStr(key)), out = [];
  for(const m of t.matches){
    const target = side==='for' ? m.xgf : m.xga, goals = side==='for' ? m.gf : m.ga;
    const ms = []; let acc=0, guard=0;
    while(acc < target*.97 && guard++ < 45){ const s=oneShot(rg,t,side,m.r); acc+=s.xg; ms.push(s); }
    let pool = ms.slice();
    for(let g=0; g<goals && pool.length; g++){
      const tot = pool.reduce((a,s)=>a+s.xg+.02,0); let r=rg.r()*tot, k=0;
      for(; k<pool.length-1; k++){ r -= pool[k].xg+.02; if(r<=0) break; }
      pool[k].outcome='Goal'; pool.splice(k,1);
    }
    for(const s of ms) if(!s.outcome){ const r=rg.r(); s.outcome = r<.34?'Saved':r<.7?'Off T':'Blocked'; }
    const sp = ms.filter(s=>/Κόρνερ|Φάουλ/.test(s.pattern)).reduce((a,s)=>a+s.xg,0);
    if(side==='for') m.spxgf=+sp.toFixed(2); else m.spxga=+sp.toFixed(2);
    out.push(...ms);
  }
  _shotCache[key] = out;
  return out;
}

/* ---------- Παίκτες ---------- */
function genPlayers(teams){
  const rg = makeRng(77), players = []; let id = 1;
  const usedNames = new Set();
  for(const t of teams){
    const lq = LEAGUES[t.league].q, maxMin = LEAGUES[t.league].rounds*90;
    const foreignP = t.league==='L1' ? .35 : .15;
    const posCount = {};
    SQUAD_TEMPLATE.forEach((pos)=>{
      posCount[pos]=(posCount[pos]||0)+1;
      let name, guard=0;
      do{ name = rg.r()<foreignP ? rg.pick(FIRST_FX)+' '+rg.pick(LAST_FX) : rg.pick(FIRST_GR)+' '+rg.pick(LAST_GR); } while(usedNames.has(name) && guard++<30);
      usedNames.add(name);
      const age = clamp(Math.round(25.5+rg.g()*4), 17, 36);
      const ind = clamp(1+rg.g()*.17, .6, 1.5);
      const q = (t.q/lq)*.55+.45; // ομαδικός παράγοντας
      const Q = clamp(ind*q*(lq===1?1:.9), .55, 1.6);
      const starterRank = posCount[pos];
      const needed = {GK:1,CB:2,FB:2,DM:1,CM:2,AM:1,W:2,ST:1}[pos]||1;
      const starter = starterRank<=needed ? rg.r()<.85 : rg.r()<.25;
      const min = pos==='GK' && !starter ? rg.i(0,400) : starter ? rg.i(Math.round(maxMin*.55), maxMin-40) : rg.i(90, Math.round(maxMin*.45));
      const b = BASE[pos], per = min/90, p = { id:id++, name, team:t.name, league:t.league, pos, age, min, foot: rg.r()<.72?'Δ':'Α', side: rg.r()<.5?'L':'R', q:Q };
      const noise = s=>Math.exp(rg.g()*s);
      for(const k of ['npxg','xa','shots','kp','progP','progC','crosses','tkl','int','recov','clear','aerT','dduelT','drbA','touchBox','lineBreak','pressures','passAtt','f3Att']){
        const expn = ATT_KEYS.includes(k) ? 1.35 : 0.6;
        const rate = b[k]*Math.pow(Q,expn)*noise(.22);
        p[k] = (k==='npxg'||k==='xa') ? +(rate*per).toFixed(1) : Math.round(rate*per);
      }
      const pc = (base, spread=.04, k=.1)=>clamp(base + (Q-1)*k + rg.g()*spread, .05, .98);
      p.aerW = Math.round(p.aerT*pc(b.aerP,.06));
      p.dduelW = Math.round(p.dduelT*pc(b.dduelP,.05));
      p.drbS = Math.round(p.drbA*pc(b.drbP,.07));
      p.passCmp = Math.round(p.passAtt*pc(b.passP,.03,.08));
      p.f3Cmp = Math.round(p.f3Att*pc(b.f3P,.05,.08));
      p.sot = Math.round(p.shots*pc(.34,.07,.12));
      const fin = clamp(1+rg.g()*.18, .6, 1.5);
      p.goals = Math.max(0, Math.round(p.npxg*fin + (pos==='ST'&&starter&&rg.r()<.5 ? rg.i(0,3) : 0)*(per>8?1:0)));
      p.ast = Math.max(0, Math.round(p.xa*clamp(1+rg.g()*.25,.4,1.7)));
      p.npxg = Math.max(0,p.npxg);
      if(pos==='GK'){ p.savePct = +(100*pc(b.save,.04,.12)).toFixed(1); p.psxgd = +((Q-1)*per*.12 + rg.g()*1.2).toFixed(1); }
      // αγορά
      const ageF = age<=21 ? 1.35 : age<=24 ? 1.2 : age<=27 ? 1 : age<=29 ? .8 : age<=31 ? .55 : .35;
      const posF = {GK:.6,CB:.9,FB:.85,DM:.9,CM:1,AM:1.15,W:1.15,ST:1.25}[pos];
      const lgBase = t.league==='L1' ? 420 : 110;
      const playF = starter ? 1 : .6;
      p.value = Math.max(25, Math.round(lgBase*Math.pow(Q,3.4)*ageF*posF*playF*noise(.35)/5)*5);
      const minW = t.league==='L1' ? 35 : 14;
      p.wage = Math.max(minW, Math.round((p.value*.16 + minW*.6)*noise(.38) * (age>=30 ? 1.35 : 1)));
      p.contract = 2027 + Math.min(4, Math.floor(rg.r()*(age>=31?2:5)));
      if(t.name===MY_TEAM_DEFAULT && rg.r()<.55){ p.fee = Math.round(p.value*rg.u(.25,.7)/10)*10; p.feeYears = rg.i(3,5); p.signed = 2027 - rg.i(0,p.feeYears-1); }
      players.push(p);
    });
  }
  return players;
}

/* ---------- Heatmap & δίκτυα πασών (επίδειξη) ---------- */
const ZONE = { GK:[9,40,5,6], CB:[30,40,10,9], FB:[50,0,18,7], DM:[48,40,11,10], CM:[60,40,14,12], AM:[80,40,13,12], W:[84,0,15,8], ST:[98,40,12,10] };
function genTouches(p){
  const rg = makeRng(hashStr('t'+p.id)), z = ZONE[p.pos], out=[];
  const n = Math.min(900, Math.max(30, Math.round(p.min/90*(p.passAtt/Math.max(1,p.min/90)+8))));
  let cy = z[1]; if(p.pos==='FB'||p.pos==='W') cy = p.side==='L' ? 11 : 69;
  if(p.pos==='CB'||p.pos==='CM') cy = p.side==='L' ? 32 : 48;
  for(let i=0;i<n;i++) out.push({ x: clamp(z[0]+rg.g()*z[2],1,119), y: clamp(cy+rg.g()*z[3],1,79) });
  return out;
}
function lineupFor(teamName, players){
  const t = DB.teamByName[teamName]; const slots = slotsFor(t ? t.formation : '4-3-3');
  const pool = players.filter(p=>p.team===teamName).sort((a,b)=>b.min-a.min), used=new Set(), xi=[];
  const compat = { GK:['GK'], CB:['CB','DM','FB'], FB:['FB','W','CB'], DM:['DM','CM','CB'], CM:['CM','DM','AM'], AM:['AM','CM','W'], W:['W','AM','FB','ST'], ST:['ST','W','AM'] };
  for(const [pos,x,y] of slots){
    let p = null;
    for(const c of compat[pos]){ p = pool.find(q=>q.pos===c && !used.has(q.id)); if(p) break; }
    if(!p) p = pool.find(q=>!used.has(q.id) && q.pos!=='GK');
    if(p){ used.add(p.id); xi.push({ p, pos, x, y }); }
  }
  return xi;
}
function demoPassNet(teamName, players){
  const xi = lineupFor(teamName, players), rg = makeRng(hashStr('net'+teamName));
  const nodes = xi.map(s=>({ id:s.p.id, label:s.p.name, short:s.p.name.split(' ').slice(-1)[0], x:s.x+rg.g()*2.5, y:clamp(s.y+rg.g()*2.5,3,77), n:0 }));
  const edges = [];
  for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
    const d = Math.hypot(nodes[i].x-nodes[j].x, nodes[i].y-nodes[j].y);
    const n = Math.round(34*Math.exp(-d/22)*rg.u(.4,1.4));
    if(n>0){ edges.push({ a:nodes[i].id, b:nodes[j].id, n }); nodes[i].n+=n; nodes[j].n+=n; }
  }
  return { nodes, edges };
}

/* ---------- Αγώνας επίδειξης σε μορφή event data ---------- */
function demoMatch(homeName, awayName, players){
  const rg = makeRng(hashStr('m'+homeName+awayName));
  const H = DB.teamByName[homeName], A = DB.teamByName[awayName];
  const ev = { demo:true, title:`${homeName} – ${awayName} (επίδειξη)`, teams:[homeName, awayName], shots:[], passes:[], touches:[], xi:{}, subMin:{}, og:{} };
  for(const [T,O] of [[H,A],[A,H]]){
    const xi = lineupFor(T.name, players); ev.xi[T.name] = xi.map(s=>({ name:s.p.name, pos:s.pos }));
    ev.subMin[T.name] = rg.i(55,70);
    const lam = Math.max(.3, 1.3*T.att*O.def*(T===H?1.08:.93)*rg.u(.7,1.3));
    let acc=0, g=0;
    while(acc<lam && g++<30){
      const s = oneShot(rg, O, 'against', 1);
      const shooters = xi.filter(x=>x.pos!=='GK'); const w = shooters.map(x=>({ST:5,W:3,AM:3,CM:1.5,FB:.6,DM:.6,CB:s.header?2:.3}[x.pos]||.5));
      let r = rg.r()*w.reduce((a,b)=>a+b,0), k=0; for(;k<w.length-1;k++){ r-=w[k]; if(r<=0)break; }
      s.player = shooters[k].p.name; s.team = T.name; s.outcome = rg.r()<s.xg ? 'Goal' : (rg.r()<.4?'Saved':rg.r()<.6?'Off T':'Blocked');
      acc += s.xg; ev.shots.push(s);
    }
    const net = demoPassNet(T.name, players);
    const byId = Object.fromEntries(net.nodes.map(n=>[n.id,n]));
    for(const e of net.edges){
      const a=byId[e.a], b=byId[e.b];
      for(let i=0;i<Math.round(e.n/3);i++){
        const [f,to] = rg.r()<.5 ? [a,b] : [b,a];
        ev.passes.push({ team:T.name, player:f.label, recipient:to.label, x:clamp(f.x+rg.g()*6,1,119), y:clamp(f.y+rg.g()*6,1,79), ex:clamp(to.x+rg.g()*6,1,119), ey:clamp(to.y+rg.g()*6,1,79), ok:rg.r()<.84, minute:rg.i(1,90) });
      }
    }
    for(const s of xi) for(const tp of genTouches(s.p).slice(0,70)) ev.touches.push({ team:T.name, player:s.p.name, x:tp.x, y:tp.y });
  }
  ev.shots.sort((a,b)=>a.minute-b.minute);
  return ev;
}

/* ---------- Φόρτωση βάσης ---------- */
const DB = { teams:[], players:[], teamByName:{} };
function buildDemoDB(){
  DB.teams = genTeams();
  DB.teamByName = Object.fromEntries(DB.teams.map(t=>[t.name,t]));
  DB.players = genPlayers(DB.teams);
  for(const t of DB.teams){ genShots(t,'for'); genShots(t,'against'); }
}
