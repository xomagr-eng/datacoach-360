'use strict';
/* ===== Συστήματα & Fit παικτών · Γέφυρα προς TACTIX =====
   Τα συστήματα αντιστοιχούν 1:1 στις τακτικές του TACTIX (ίδια ids, σχηματισμοί, σειρά θέσεων),
   ώστε η 11άδα που προτείνεται εδώ να «κουμπώνει» στο ταμπλό του TACTIX. */

/* Συντεταγμένες TACTIX: x 0..100 (αριστ.→δεξ.), y 0..100 (δικό μας τέρμα=0) */
const TX_FORM = {
  '4-3-3':[['ΤΦ',50,6],['ΔΑ',82,24],['ΣΤ',62,16],['ΣΤ',38,16],['ΑΑ',18,24],['ΑΜ',50,38],['ΚΜ',68,48],['ΚΜ',32,48],['ΔΕ',84,72],['ΕΠ',50,82],['ΑΕ',16,72]],
  '4-2-3-1':[['ΤΦ',50,6],['ΔΑ',82,24],['ΣΤ',62,16],['ΣΤ',38,16],['ΑΑ',18,24],['ΑΜ',62,38],['ΑΜ',38,38],['ΔΕ',84,62],['10',50,60],['ΑΕ',16,62],['ΕΠ',50,84]],
  '4-4-2':[['ΤΦ',50,6],['ΔΑ',82,24],['ΣΤ',62,16],['ΣΤ',38,16],['ΑΑ',18,24],['ΔΕ',84,50],['ΚΜ',60,46],['ΚΜ',40,46],['ΑΕ',16,50],['ΕΠ',60,80],['ΕΠ',40,80]],
  '3-5-2':[['ΤΦ',50,6],['ΣΤ',72,18],['ΣΤ',50,14],['ΣΤ',28,18],['ΔΑ',88,48],['ΚΜ',64,44],['ΑΜ',50,38],['ΚΜ',36,44],['ΑΑ',12,48],['ΕΠ',60,80],['ΕΠ',40,80]],
  '3-4-3':[['ΤΦ',50,6],['ΣΤ',72,18],['ΣΤ',50,14],['ΣΤ',28,18],['ΔΑ',86,46],['ΚΜ',60,42],['ΚΜ',40,42],['ΑΑ',14,46],['ΔΕ',80,78],['ΕΠ',50,82],['ΑΕ',20,78]],
  '3-2-4-1':[['ΤΦ',50,6],['ΣΤ',72,18],['ΣΤ',50,14],['ΣΤ',28,18],['ΑΜ',62,36],['ΑΜ',38,36],['ΔΕ',86,62],['10',60,64],['10',40,64],['ΑΕ',14,62],['ΕΠ',50,84]],
  '4-3-1-2 (Διαμάντι)':[['ΤΦ',50,6],['ΔΑ',82,24],['ΣΤ',62,16],['ΣΤ',38,16],['ΑΑ',18,24],['ΑΜ',50,34],['ΚΜ',74,50],['ΚΜ',26,50],['10',50,62],['ΕΠ',60,82],['ΕΠ',40,82]],
  '3-4-2-1':[['ΤΦ',50,6],['ΣΤ',72,18],['ΣΤ',50,14],['ΣΤ',28,18],['ΔΑ',88,44],['ΚΜ',60,40],['ΚΜ',40,40],['ΑΑ',12,44],['10',64,62],['10',36,62],['ΕΠ',50,84]]
};
const TX_ROLE_NAMES = { 'ΤΦ':'Τερματοφύλακας','ΣΤ':'Στόπερ','ΔΑ':'Δεξί μπακ','ΑΑ':'Αριστερό μπακ','ΑΜ':'Αμυντικό χαφ','ΚΜ':'Κεντρικός μέσος','10':'Επιτελικός 10','ΔΕ':'Δεξί εξτρέμ','ΑΕ':'Αριστερό εξτρέμ','ΕΠ':'Φορ','F9':'Ψευτο-9' };

/* Αρχέτυπα ρόλων (κώδικες όπως στο TACTIX / Football Manager) — συνταγή μετρικών */
const ARCH = {
  SK:{l:'Σουίπερ-κίπερ',tx:'SK',w:{passPct:2,recov:2,savePct:1.5,psxgd:1.5}},
  BPK:{l:'Ball-playing ΤΦ',tx:'BPK',w:{passPct:3,progP:1.5,savePct:1.5,psxgd:1.5}},
  GKc:{l:'Κλασικός ΤΦ',tx:'GK',w:{savePct:3,psxgd:3,clear:1}},
  BPD:{l:'Ball-playing στόπερ',tx:'BPD',w:{progP:3,passPct:2,lineBreak:2,aerPct:1,dduelPct:1}},
  CD:{l:'Καθαρός αμυντικός',tx:'CD',w:{aerPct:3,clear:2,dduelPct:2,int:1}},
  STP:{l:'Stopper (βγαίνει μπροστά)',tx:'STP',w:{dduelT:2,dduelPct:2,tkl:2,int:2,pressures:1}},
  COV:{l:'Καλυπτής',tx:'COV',w:{int:3,recov:2,dduelPct:1,passPct:1}},
  WB:{l:'Wing-back',tx:'WB',w:{crosses:3,progC:3,xa:2,pressures:1},elig:{FB:1,W:.9}},
  IWB:{l:'Ανεστραμμένος μπακ',tx:'IWB',w:{passPct:3,progP:2,lineBreak:2,tklInt:2},elig:{FB:1,DM:.92,CM:.85,CB:.8}},
  FBc:{l:'Κλασικός μπακ',tx:'FB',w:{tklInt:2,dduelPct:2,crosses:1,progC:1,passPct:1}},
  NFB:{l:'Αμυντικός μπακ',tx:'NFB',w:{tklInt:3,dduelPct:3,aerPct:1,clear:1}},
  DLP:{l:'Deep-lying playmaker',tx:'DLP',w:{passPct:3,progP:3,lineBreak:3,f3Pct:1}},
  ANC:{l:'Anchor',tx:'ANC',w:{int:3,tkl:2,recov:2,aerPct:1,passPct:1}},
  BWM:{l:'Ball-winning μέσος',tx:'BWM',w:{tklInt:3,pressures:3,dduelPct:2,recov:1}},
  REG:{l:'Regista',tx:'REG',w:{progP:3,lineBreak:3,kp:2,xa:1}},
  B2B:{l:'Box-to-box',tx:'B2B',w:{pressures:2,recov:2,progC:2,tklInt:2,npxg:1}},
  MEZ:{l:'Mezzala',tx:'MEZ',w:{progC:2,kp:2,xa:2,touchBox:1,drbS:1},elig:{CM:1,AM:1,W:.8}},
  CAR:{l:'Carrilero',tx:'CAR',w:{pressures:2,tklInt:2,passPct:2,progP:1}},
  AP:{l:'Advanced playmaker',tx:'AP',w:{kp:3,xa:3,f3Pct:2,lineBreak:1},elig:{AM:1,CM:.95,W:.85}},
  CM8P:{l:'Πιεστικό 8άρι',tx:'B2B',w:{pressures:3,recov:2,tklInt:2,progP:1}},
  SS:{l:'Shadow striker',tx:'SS',w:{npxg:3,touchBox:3,shots:1,xa:1},elig:{AM:1,ST:.95,W:.9}},
  Wc:{l:'Κλασικό εξτρέμ',tx:'W',w:{crosses:3,drbS:2,progC:2,xa:2}},
  IF:{l:'Inside forward',tx:'IF',w:{npxg:3,shots:2,drbS:2,touchBox:2}},
  WPR:{l:'Πιεστικό εξτρέμ',tx:'W',w:{pressures:3,recov:2,progC:1,npxg:1,xa:1}},
  WM:{l:'Πλάγιος μέσος',tx:'WM',w:{pressures:2,tklInt:2,crosses:1,passPct:1},elig:{W:1,FB:.9,CM:.85}},
  AF:{l:'Advanced forward',tx:'AF',w:{npxg:3,shots:2,touchBox:2,drbS:1}},
  PF:{l:'Pressing forward',tx:'PF',w:{pressures:3,recov:2,npxg:2,dduelT:1}},
  TM:{l:'Target man',tx:'TM',w:{aerPct:3,aerT:2,touchBox:1,npxg:1}},
  DLF:{l:'Deep-lying forward',tx:'DLF',w:{kp:2,xa:2,passPct:2,npxg:1,progP:1}},
  POA:{l:'Poacher',tx:'POA',w:{npxg:3,sotPct:2,touchBox:2,goals:1}},
  F9:{l:'False nine',tx:'F9',w:{kp:2,xa:2,drbS:2,progC:1,npxg:1}}
};
const SLOT_ELIG = { 'ΤΦ':{GK:1}, 'ΣΤ':{CB:1,DM:.85,FB:.8}, 'ΔΑ':{FB:1,W:.8,CB:.75,DM:.7}, 'ΑΑ':{FB:1,W:.8,CB:.75,DM:.7},
  'ΑΜ':{DM:1,CM:.92,CB:.78,AM:.8}, 'ΚΜ':{CM:1,DM:.92,AM:.9,W:.72}, '10':{AM:1,CM:.88,W:.86,ST:.8},
  'ΔΕ':{W:1,AM:.88,FB:.75,ST:.82}, 'ΑΕ':{W:1,AM:.88,FB:.75,ST:.82}, 'ΕΠ':{ST:1,W:.85,AM:.8}, 'F9':{ST:.95,AM:.95,W:.85} };
const SLOT_SIDE = { 'ΔΑ':'R','ΔΕ':'R','ΑΑ':'L','ΑΕ':'L' };
const SLOT_DEFAULT_ARCH = { 'ΤΦ':'GKc','ΣΤ':'CD','ΔΑ':'FBc','ΑΑ':'FBc','ΑΜ':'DLP','ΚΜ':'B2B','10':'AP','ΔΕ':'Wc','ΑΕ':'Wc','ΕΠ':'AF','F9':'F9' };

/* Συστήματα = τακτικές του TACTIX. tags 0..1: pos κατοχή, press πίεση, direct κάθετο, counter μετάβαση,
   width πλάτος, central κέντρο, aerial εναέριο/σέντρες, int ένταση, bait δόλωμα πίεσης */
const SYSTEMS = [
  { id:'pep-city', n:'Positional Play', c:'Pep Guardiola', f:'3-2-4-1', a:['SK','BPD','BPD','COV','DLP','IWB','Wc','AP','SS','Wc','POA'], t:{pos:1,press:.8,direct:.1,counter:.2,width:.8,central:.9,aerial:.1,int:.9} },
  { id:'klopp-liv', n:'Gegenpressing', c:'Jürgen Klopp', f:'4-3-3', a:['SK','WB','BPD','CD','WB','ANC','B2B','B2B','IF','PF','IF'], t:{pos:.5,press:1,direct:.8,counter:.9,width:.7,central:.5,aerial:.3,int:1} },
  { id:'simeone-atm', n:'Χαμηλό μπλοκ «Cholismo»', c:'Diego Simeone', f:'4-4-2', a:['GKc','NFB','CD','STP','NFB','WM','BWM','CAR','WM','PF','AF'], t:{pos:.2,press:.4,direct:.6,counter:.9,width:.4,central:.3,aerial:.6,int:.8} },
  { id:'mou-counter', n:'Αντεπίθεση & έλεγχος', c:'José Mourinho', f:'4-2-3-1', a:['GKc','FBc','CD','CD','FBc','BWM','DLP','IF','AP','IF','TM'], t:{pos:.4,press:.4,direct:.7,counter:1,width:.6,central:.5,aerial:.5,int:.6} },
  { id:'arteta-ars', n:'Δομημένη κατοχή', c:'Mikel Arteta', f:'4-3-3', a:['BPK','FBc','BPD','CD','IWB','DLP','AP','B2B','IF','AF','IF'], t:{pos:.9,press:.8,direct:.3,counter:.3,width:.7,central:.7,aerial:.7,int:.8} },
  { id:'anco-rm', n:'Ισορροπία & ελευθερία', c:'Carlo Ancelotti', f:'4-3-3', a:['GKc','FBc','CD','BPD','FBc','DLP','B2B','MEZ','IF','AF','Wc'], t:{pos:.6,press:.5,direct:.6,counter:.8,width:.6,central:.6,aerial:.4,int:.6} },
  { id:'bielsa-manmark', n:'Man-to-man «Bielsismo»', c:'Marcelo Bielsa', f:'3-4-3', a:['SK','STP','BPD','STP','WB','B2B','CM8P','WB','WPR','PF','WPR'], t:{pos:.5,press:1,direct:.8,counter:.6,width:.8,central:.4,aerial:.3,int:1} },
  { id:'mendilibar-oly', n:'Κάθετο & πίεση', c:'José Luis Mendilíbar', f:'4-2-3-1', a:['GKc','WB','CD','CD','WB','BWM','B2B','Wc','SS','Wc','PF'], t:{pos:.3,press:.9,direct:1,counter:.8,width:.9,central:.3,aerial:.9,int:.9} },
  { id:'alguacil-rso', n:'Κατοχή με διαμάντι', c:'Imanol Alguacil', f:'4-3-1-2 (Διαμάντι)', a:['BPK','WB','BPD','CD','WB','DLP','MEZ','CM8P','AP','DLF','AF'], t:{pos:.8,press:.8,direct:.4,counter:.4,width:.4,central:1,aerial:.3,int:.8} },
  { id:'valverde-ath', n:'Πειθαρχία & μετάβαση', c:'Ernesto Valverde', f:'4-2-3-1', a:['GKc','FBc','CD','BPD','FBc','BWM','DLP','WM','AP','WM','AF'], t:{pos:.5,press:.6,direct:.6,counter:.8,width:.6,central:.5,aerial:.5,int:.7} },
  { id:'xabi-lev', n:'Ευέλικτη τριάδα', c:'Xabi Alonso', f:'3-4-2-1', a:['BPK','STP','BPD','BPD','WB','DLP','B2B','WB','AP','SS','DLF'], t:{pos:.8,press:.7,direct:.6,counter:.7,width:.9,central:.8,aerial:.4,int:.8} },
  { id:'dezerbi', n:'Build-up baiting', c:'Roberto De Zerbi', f:'4-2-3-1', a:['BPK','FBc','BPD','BPD','FBc','DLP','REG','Wc','AP','Wc','DLF'], t:{pos:.9,press:.6,direct:.5,counter:.5,width:.8,central:.7,aerial:.2,int:.7,bait:1} },
  { id:'conte-352', n:'Κάθετο 3-5-2', c:'Antonio Conte', f:'3-5-2', a:['GKc','STP','CD','BPD','WB','MEZ','REG','B2B','WB','TM','AF'], t:{pos:.5,press:.6,direct:.7,counter:.7,width:.9,central:.6,aerial:.6,int:.9} },
  { id:'xavi-barca', n:'La Masia positional', c:'Xavi Hernández', f:'4-3-3', a:['BPK','FBc','BPD','BPD','IWB','DLP','MEZ','AP','Wc','AF','Wc'], t:{pos:1,press:.8,direct:.2,counter:.2,width:.8,central:.9,aerial:.1,int:.8} },
  { id:'gasperini-atalanta', n:'Man-marking & κάθετη', c:'Gian Piero Gasperini', f:'3-4-2-1', a:['GKc','STP','CD','STP','WB','BWM','B2B','WB','SS','AP','TM'], t:{pos:.5,press:1,direct:.8,counter:.6,width:.9,central:.6,aerial:.5,int:1} },
  { id:'my-hybrid', n:'⭐ Δική μου: Υβριδικό 4-3-3→3-2-5', c:'Ο προπονητής μου', f:'4-3-3', a:['BPK','FBc','BPD','CD','IWB','DLP','MEZ','B2B','Wc','AF','IF'], t:{pos:.8,press:.7,direct:.4,counter:.5,width:.8,central:.8,aerial:.3,int:.7} }
];
const SYS = Object.fromEntries(SYSTEMS.map(s=>[s.id,s]));
const TAG_L = { pos:'Κατοχή', press:'Πίεση', direct:'Κάθετο', counter:'Μετάβαση', width:'Πλάτος', central:'Κέντρο', aerial:'Εναέριο/σέντρες', int:'Ένταση' };
function sysSlots(s){ return TX_FORM[s.f].map(([r,x,y],i)=>({ r, x, y, a:s.a[i], i })); }

/* ---------- Fit ---------- */
let _fitKey = '', _fitCache = new Map();
function archFit(p, code, r){
  const key = S.settings.minMin+'|'+PL.length;
  if(key!==_fitKey){ _fitKey=key; _fitCache=new Map(); }
  const ck = p.id+'|'+code+'|'+r; if(_fitCache.has(ck)) return _fitCache.get(ck);
  const A = ARCH[code], e = Object.assign({}, SLOT_ELIG[r]||{}, A.elig||{});
  if(r==='ΤΦ' || p.pos==='GK') { if(!(r==='ΤΦ' && p.pos==='GK')) { _fitCache.set(ck,0); return 0; } }
  let m = e[p.pos] || 0;
  if(!m){ _fitCache.set(ck,0); return 0; }
  if(SLOT_SIDE[r] && p.side && p.side!==SLOT_SIDE[r]) m *= .94;
  let ws=0, acc=0; for(const [k,w] of Object.entries(A.w)){ acc += w*pct(p,k); ws += w; }
  let f = (acc/ws) * m; if(!qualified(p)) f *= .9;
  f = Math.round(f*10)/10; _fitCache.set(ck,f); return f;
}
function bestXI(sys, pool){
  const slots = sysSlots(sys), pairs = [];
  slots.forEach((s,si)=>pool.forEach(p=>{ const f=archFit(p,s.a,s.r); if(f>0) pairs.push([f,si,p]); }));
  pairs.sort((a,b)=>b[0]-a[0]);
  const used=new Set(), fill={};
  for(const [f,si,p] of pairs){ if(fill[si]||used.has(p.id)) continue; fill[si]={p,f}; used.add(p.id); }
  const out = slots.map((s,si)=>({ ...s, p:fill[si]?.p||null, fit:fill[si]?.f||0 }));
  for(const s of out){ const alt = pool.filter(p=>!used.has(p.id)).map(p=>({p,f:archFit(p,s.a,s.r)})).filter(x=>x.f>0).sort((a,b)=>b.f-a.f)[0]; s.alt = alt||null; }
  const avg = mean(out.map(s=>s.fit)), depth = mean(out.map(s=>s.alt?s.alt.f:0));
  return { sys, slots:out, avg, depth };
}
function bestRoles(p, n=6){
  const seen = {};
  for(const s of SYSTEMS) sysSlots(s).forEach(sl=>{ const k=sl.a+'|'+sl.r; if(seen[k]) return; const f=archFit(p,sl.a,sl.r); if(f>0) seen[k]={ a:sl.a, r:sl.r, f }; });
  return Object.values(seen).sort((a,b)=>b.f-a.f).slice(0,n);
}
function oppFlags(t){
  const A=teamAgg(t), la=leagueAvg(t.league), pa=shotProfile(genShots(t,'against'));
  const side=['L','C','R'].sort((a,b)=>pa[b]-pa[a])[0];
  return { passive:A.ppda>la.ppda+1.5, highPress:A.ppda<la.ppda-1.5, sp:pa.sp>la.spAg+.06, aerial:pa.head>la.headAg+.05,
    side: pa[side]>.42 ? side : null, counter:pa.counter>la.ctAg+.05, late:pa.late>la.lateAg+.05, possTeam:A.poss>55, lowBlock:A.poss<45 };
}
function matchup(sys, f){
  const T = sys.t; let sc = 50; const why = [];
  const rule = (cond, tag, k, txt) => { if(!cond) return; const d = k*((T[tag]||0)-.5)*2; sc += d; if(Math.abs(d)>=3) why.push({ d, txt: `${txt} → ${TAG_L[tag]||'δόλωμα πίεσης'} ${d>0?'✔':'✖'}` }); };
  rule(f.passive,'pos',10,'Παθητική πίεση αντιπάλου');
  rule(f.highPress,'direct',10,'Πιέζουν ψηλά'); rule(f.highPress,'bait',6,'Πιέζουν ψηλά');
  rule(f.sp,'aerial',6,'Αδύναμοι στις στημένες'); rule(f.aerial,'aerial',8,'Αδύναμοι στον αέρα');
  rule(f.side==='L'||f.side==='R','width',9,'Ευάλωτη πλευρά'); rule(f.side==='C','central',9,'Ευάλωτο κέντρο');
  rule(f.counter,'counter',10,'Ευάλωτοι στις μεταβάσεις'); rule(f.late,'int',6,'Πέφτουν στο τέλος');
  rule(f.possTeam,'press',8,'Ομάδα κατοχής'); rule(f.possTeam,'counter',4,'Ομάδα κατοχής');
  rule(f.lowBlock,'width',6,'Χαμηλό μπλοκ'); rule(f.lowBlock,'pos',4,'Χαμηλό μπλοκ');
  return { score: clamp(Math.round(sc),0,100), why: why.sort((a,b)=>b.d-a.d) };
}
function fitCol(f){ return f>=70?COL.red:f>=58?'#ff8f99':f>=45?'#8b93a7':'#4a5163'; }

/* Κάθετο γήπεδο (συντεταγμένες TACTIX, επίθεση προς τα πάνω) */
function vPitchSVG(inner, id){
  const l='stroke="var(--pitch-line)" stroke-width=".5" fill="none"';
  return `<svg ${id?`id="${id}"`:''} viewBox="-3 -3 106 146" class="pitch" ${FONT}><rect x="-3" y="-3" width="106" height="146" fill="var(--pitch)"/>
    <rect x="0" y="0" width="100" height="140" ${l}/><line x1="0" y1="70" x2="100" y2="70" ${l}/><circle cx="50" cy="70" r="12" ${l}/>
    <rect x="20" y="0" width="60" height="22" ${l}/><rect x="36" y="0" width="28" height="8" ${l}/><rect x="20" y="118" width="60" height="22" ${l}/><rect x="36" y="132" width="28" height="8" ${l}/>
    ${inner}</svg>`;
}
function xiPitch(xi, id){
  let s='';
  for(const sl of xi.slots){
    const cx=sl.x, cy=(100-sl.y)*1.36+2, p=sl.p, nm = p ? p.name.split(' ').slice(-1)[0] : '—';
    s += `<g ${p?`data-pid="${p.id}" style="cursor:pointer"`:''} data-tip="<b>${esc(ARCH[sl.a].l)}</b> (${esc(TX_ROLE_NAMES[sl.r])})<br>${p?esc(p.name)+' · fit '+Math.round(sl.fit)+'%':'κενό'}${sl.alt?'<br>2η επιλογή: '+esc(sl.alt.p.name)+' '+Math.round(sl.alt.f)+'%':''}">
      <circle cx="${cx}" cy="${cy}" r="5.4" fill="${p?fitCol(sl.fit):'#1b2030'}" stroke="#fff" stroke-width=".6"/>
      <text x="${cx}" y="${cy+1.4}" font-size="3.6" font-weight="700" fill="#fff" text-anchor="middle">${p?Math.round(sl.fit):'?'}</text>
      <text x="${cx}" y="${cy+9.2}" font-size="3.3" fill="var(--text)" text-anchor="middle" paint-order="stroke" stroke="var(--pitch)" stroke-width="1.2">${esc(nm)}</text>
      <text x="${cx}" y="${cy-7}" font-size="2.6" fill="var(--muted)" text-anchor="middle">${esc(sl.a==='GKc'?'ΤΦ':ARCH[sl.a].tx)}</text></g>`;
  }
  return vPitchSVG(s, id);
}

/* ======================= ΣΥΣΤΗΜΑΤΑ & FIT ======================= */
const FV = { team:null, sys:'my-hybrid', withShort:false, arch:'IWB', archR:'ΑΑ', archLg:'', archMaxVal:'', archMaxAge:40 };
VIEWS.fit = function(arg){
  if(arg && SYS[arg]) FV.sys = arg;
  FV.team ||= S.settings.myTeam;
  const pool0 = PL.filter(p=>p.team===FV.team);
  const shortP = S.shortlist.map(s=>PBY[s.id]).filter(p=>p && p.team!==FV.team);
  const pool = FV.withShort ? pool0.concat(shortP) : pool0;
  if(!pool.length){ $('#view').innerHTML = `<div class="card empty">Η ομάδα δεν έχει παίκτες.</div>`; return; }
  const ranks = SYSTEMS.map(s=>bestXI(s,pool));
  const opp = DB.teamByName[S.settings.nextOpp], fl = opp ? oppFlags(opp) : null;
  ranks.forEach(r=>{ r.mu = fl ? matchup(r.sys, fl) : { score:50, why:[] }; r.total = fitMix()*r.avg + (1-fitMix())*r.mu.score; });
  const cur = ranks.find(r=>r.sys.id===FV.sys) || ranks[0], sys = cur.sys;
  const byFit = ranks.slice().sort((a,b)=>b.avg-a.avg), byTot = ranks.slice().sort((a,b)=>b.total-a.total);
  // κενά
  const spent = sum(S.shortlist.filter(s=>PBY[s.id]&&PBY[s.id].team!==S.settings.myTeam).map(s=>+s.fee||0));
  const budget = Math.max(0, (+S.settings.transferBudget||0) - spent);
  const gaps = cur.slots.slice().sort((a,b)=>a.fit-b.fit).slice(0,3);
  const gapCands = gaps.map(g=>{
    const c = PL.filter(p=>p.team!==FV.team && qualified(p) && (p.value||0)<=Math.max(budget,50))
      .map(p=>({ p, f:archFit(p,g.a,g.r) })).filter(x=>x.f>g.fit+4).sort((a,b)=>b.f-a.f || a.p.value-b.p.value).slice(0,5);
    return { g, c };
  });
  const uniq = []; const seen=new Set(); cur.slots.forEach(s=>{ const k=s.a+'|'+s.r; if(!seen.has(k)){ seen.add(k); uniq.push(s); } });
  const sqSorted = pool.slice().sort((a,b)=>['GK','CB','FB','DM','CM','AM','W','ST'].indexOf(a.pos)-['GK','CB','FB','DM','CM','AM','W','ST'].indexOf(b.pos));
  // εύρεση παίκτη για ρόλο
  const aPool = PL.filter(p=>qualified(p) && (!FV.archLg || p.league===FV.archLg) && (!FV.archMaxVal || (p.value||0)<=+FV.archMaxVal) && p.age<=FV.archMaxAge)
    .map(p=>({ p, f:archFit(p,FV.arch,FV.archR) })).filter(x=>x.f>0).sort((a,b)=>b.f-a.f).slice(0,15);
  const archOpts = Object.entries(ARCH).map(([k,a])=>[k,`${a.l} (${a.tx})`]);
  $('#view').innerHTML = `
  <div class="card"><div class="row">
    <label class="f">Ομάδα<select id="fvT">${opts(teamList(), FV.team)}</select></label>
    <label class="f" style="min-width:240px">Σύστημα (τακτικές TACTIX)<select id="fvS">${opts(SYSTEMS.map(s=>[s.id,`${s.f} · ${s.n} — ${s.c}`]), sys.id)}</select></label>
    <label class="small" style="align-self:flex-end"><input type="checkbox" id="fvSh" ${FV.withShort?'checked':''}> Μαζί με τη λίστα μεταγραφών (${shortP.length})</label>
    <span style="flex:1"></span><button class="btn" data-go="fitcfg" data-arg="${sys.id}">🛠️ Προσαρμογή συστήματος & ρόλων</button><button class="btn" data-go="bridge">🔗 Στείλε στο TACTIX</button></div></div>
  <div class="grid g32" style="margin-top:14px">
    <div class="card"><h3>🧩 Καλύτερη 11άδα — ${esc(sys.f)} · ${esc(sys.n)}<span class="sp"></span><button class="btn sm" onclick="svgToPng(document.getElementById('fvP'),'best_xi_${sys.id}')">PNG</button></h3>
      <div style="max-width:520px;margin:auto">${xiPitch(cur,'fvP')}</div>
      <div class="legend"><span><i style="background:${COL.red}"></i>Fit 70+</span><span><i style="background:#ff8f99"></i>58–69</span><span><i style="background:#8b93a7"></i>45–57</span><span><i style="background:#4a5163"></i>&lt;45</span><span>αριθμός = fit % · πάνω: ρόλος TACTIX</span></div></div>
    <div class="card"><h3>📋 ${esc(sys.c)}</h3>
      <div class="grid g2">${kpi('Fit 11άδας', `<span style="color:${fitCol(cur.avg)}">${Math.round(cur.avg)}%</span>`, `${byFit.indexOf(cur)+1}ο από ${SYSTEMS.length} συστήματα`)}${kpi('Βάθος (2η επιλογή)', Math.round(cur.depth)+'%', 'μέσο fit αναπληρωματικών')}</div>
      ${fl?`<div class="find ${cur.mu.score>=55?'str':'info'}" style="margin-top:10px"><span class="ic">🆚</span><div><b>Ταίριασμα με ${esc(opp.name)}: ${cur.mu.score}/100</b><span class="small muted">${cur.mu.why.slice(0,3).map(w=>esc(w.txt)).join('<br>')||'Ουδέτερο'}</span></div></div>`:''}
      ${barsHTML(Object.entries(TAG_L).map(([k,l])=>({ l, v:(sys.t[k]||0)*100, txt:Math.round((sys.t[k]||0)*10)+'/10', color:COL.gray })),{max:100})}
      <table class="t" style="margin-top:10px"><tr><th class="l">Θέση</th><th class="l">Ρόλος</th><th class="l">Παίκτης</th><th>Fit</th><th class="l">2η επιλογή</th></tr>
      ${cur.slots.map(s=>`<tr><td class="l">${esc(s.r)}</td><td class="l small">${esc(ARCH[s.a].l)}</td><td class="l">${s.p?plink(s.p):'<span class="dn">κενό</span>'}</td><td><b style="color:${fitCol(s.fit)}">${Math.round(s.fit)}</b></td><td class="l small muted">${s.alt?esc(s.alt.p.name)+' '+Math.round(s.alt.f):'—'}</td></tr>`).join('')}</table></div>
    <div class="card"><h3>🏆 Ποιο σύστημα ταιριάζει στο ρόστερ${fl?` & απέναντι σε ${esc(opp.name)}`:''}</h3>
      <div class="tbl-wrap" style="max-height:520px"><table class="t"><tr><th class="l">Σύστημα</th><th>Fit 11άδας</th><th>Βάθος</th>${fl?'<th>Matchup</th><th>Σύνολο</th>':''}<th></th></tr>
      ${byTot.map((r,i)=>`<tr class="${r===cur?'me':''}"><td class="l"><b>${esc(r.sys.f)}</b> · ${esc(r.sys.n)}<div class="small muted">${esc(r.sys.c)}</div></td><td><span class="hc" style="${heatBg(r.avg)}">${Math.round(r.avg)}</span></td><td class="muted">${Math.round(r.depth)}</td>${fl?`<td><span class="hc" style="${heatBg(r.mu.score)}">${r.mu.score}</span></td><td><b>${Math.round(r.total)}</b>${i===0?' 🥇':''}</td>`:''}<td><button class="btn sm" data-sys="${r.sys.id}">Προβολή</button></td></tr>`).join('')}</table></div>
      <div class="small muted" style="margin-top:6px">Σύνολο = ${Math.round(fitMix()*100)}% fit ρόστερ + ${Math.round(100-fitMix()*100)}% ταίριασμα με τις αδυναμίες του επόμενου αντιπάλου (από το report αντιπάλου).</div></div>
    <div class="card"><h3>🧲 Κενά → μεταγραφές (budget: ${fmtK(budget)})</h3>
      ${gapCands.map(({g,c})=>`<div style="margin-bottom:12px"><div><b>${esc(ARCH[g.a].l)}</b> <span class="tag">${esc(g.r)}</span> — σήμερα: ${g.p?esc(g.p.name)+' '+Math.round(g.fit)+'%':'κανείς'}</div>
        ${c.length?`<table class="t"><tr><th class="l">Υποψήφιος</th><th>Fit</th><th>Ηλ.</th><th>Αξία</th><th></th></tr>${c.map(x=>`<tr><td class="l">${plink(x.p)}<div class="small muted">${esc(x.p.team)} · ${esc(leagueShort(x.p.league))}</div></td><td><b style="color:${fitCol(x.f)}">${Math.round(x.f)}</b> <span class="small muted">+${Math.round(x.f-g.fit)}</span></td><td>${x.p.age}</td><td>${x.p.value}k ${x.p._under>1.4?'<span class="tag g">💎</span>':''}</td><td>${star(x.p)}</td></tr>`).join('')}</table>`:'<div class="small muted">Κανένας καλύτερος εντός budget.</div>'}</div>`).join('')}
      <div class="small muted">Τσέκαρε «Μαζί με τη λίστα μεταγραφών» για να δεις την 11άδα με τις νέες προσθήκες.</div></div>
    <div class="card span2"><h3>🔢 Πίνακας fit: παίκτες × ρόλοι του ${esc(sys.f)}</h3><div class="tbl-wrap"><table class="t"><tr><th class="l">Παίκτης</th><th>Θέση</th>${uniq.map(s=>`<th title="${esc(ARCH[s.a].l)}">${esc(s.r)}<div class="small">${esc(ARCH[s.a].tx)}</div></th>`).join('')}<th class="l">Καλύτερος ρόλος (όλα τα συστήματα)</th></tr>
      ${sqSorted.map(p=>{ const br=bestRoles(p,1)[0]; return `<tr><td class="l">${plink(p)}${p.team!==FV.team?' <span class="tag g">λίστα</span>':''}</td><td>${POS_L[p.pos]}</td>${uniq.map(s=>{ const f=archFit(p,s.a,s.r); return `<td>${f?`<span class="hc" style="${heatBg(f)}">${Math.round(f)}</span>`:'<span class="muted">·</span>'}</td>`; }).join('')}<td class="l small">${br?`${esc(ARCH[br.a].l)} · ${Math.round(br.f)}%`:'–'}</td></tr>`; }).join('')}</table></div></div>
    <div class="card span2"><h3>🔎 Βρες παίκτη για συγκεκριμένο ρόλο (όλη η αγορά)</h3><div class="row">
      <label class="f">Ρόλος<select id="faA">${opts(archOpts, FV.arch)}</select></label>
      <label class="f">Θέση στο γήπεδο<select id="faR">${opts(Object.entries(TX_ROLE_NAMES).map(([k,l])=>[k,`${k} · ${l}`]), FV.archR)}</select></label>
      <label class="f">Διοργάνωση<select id="faL">${leagueOpts(FV.archLg)}</select></label>
      <label class="f">Μέγ. αξία k€<input type="number" id="faV" value="${FV.archMaxVal}" placeholder="χωρίς" style="width:100px"></label>
      <label class="f">Μέγ. ηλικία<input type="number" id="faG" value="${FV.archMaxAge}" style="width:70px"></label></div>
      <div class="small muted" style="margin:6px 0">Συνταγή: ${Object.entries(ARCH[FV.arch].w).map(([k,w])=>`${esc(M[k].l)} ×${w}`).join(' · ')}</div>
      <div class="tbl-wrap" style="max-height:420px"><table class="t"><tr><th></th><th class="l">Παίκτης</th><th class="l">Ομάδα</th><th>Θέση</th><th>Ηλ.</th><th>Fit</th><th>Score</th><th>Αξία</th><th>Μισθός</th></tr>
      ${aPool.map(x=>`<tr class="${x.p.team===S.settings.myTeam?'me':''}"><td>${star(x.p)}</td><td class="l">${plink(x.p)}</td><td class="l small">${esc(x.p.team)}</td><td>${POS_L[x.p.pos]}</td><td>${x.p.age}</td><td><b style="color:${fitCol(x.f)}">${Math.round(x.f)}</b></td><td>${Math.round(x.p._score)}</td><td>${x.p.value||'–'}</td><td>${x.p.wage||'–'}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">Κανένας (ο ρόλος δεν ταιριάζει σε αυτή τη θέση)</td></tr>'}</table></div></div>
  </div>`;
  on('#fvT','change',e=>{ FV.team=e.target.value; VIEWS.fit(); });
  on('#fvS','change',e=>{ FV.sys=e.target.value; VIEWS.fit(); });
  on('#fvSh','change',e=>{ FV.withShort=e.target.checked; VIEWS.fit(); });
  $$('[data-sys]').forEach(b=>b.onclick=()=>{ FV.sys=b.dataset.sys; VIEWS.fit(); window.scrollTo(0,0); });
  on('#faA','change',e=>{ FV.arch=e.target.value; VIEWS.fit(); }); on('#faR','change',e=>{ FV.archR=e.target.value; VIEWS.fit(); });
  on('#faL','change',e=>{ FV.archLg=e.target.value; VIEWS.fit(); }); on('#faV','change',e=>{ FV.archMaxVal=e.target.value; VIEWS.fit(); });
  on('#faG','change',e=>{ FV.archMaxAge=+e.target.value||40; VIEWS.fit(); });
};

/* ======================= ΓΕΦΥΡΑ → TACTIX ======================= */
const TX_KEY = 'cosmos_coach_v1', BRIDGE_KEY = 'dc360_bridge_inbox';
const TX_DRILLS = { 'setpieces-corners':'Στημένες Φάσεις — Κόρνερ', 'buildup-11v0':'Ανάπτυξη υπό πίεση 8+GK v6', 'pos-3v3+3':'Positional Game 3v3+3', 'possession-directional-7v7':'Κατοχή με Κατεύθυνση 7v7+3',
  'transition-cycle':'Κύκλος Μετάβασης 8v8', 'gegen-transition':'Counter-Press Transition 6v6', 'finishing-cutback':'Τελείωμα — Cut-backs', 'ssg-4v4':'Small-Sided Game 4v4', 'rondo-4v2':'Rondo 4v2', 'pressing-triggers':'Οργανωμένη Πίεση — Triggers', 'finishing-1v1-gk':'Τελείωμα 1v1' };
function txPos(p){ return { GK:'ΤΦ', CB:'ΣΤ', FB:p.side==='L'?'ΑΑ':'ΔΑ', DM:'ΑΜ', CM:'ΚΜ', AM:'10', W:p.side==='L'?'ΑΕ':'ΔΕ', ST:'ΕΠ' }[p.pos] || 'ΚΜ'; }
const TX_ATTR_MAP = {
  GK:{ 'ρεφλέξ':'savePct', 'τοποθέτηση':'psxgd', 'πόδια':'passPct', 'εναέρια':'clear', 'ηρεμία':'passPct', 'σουίπερ':'recov' },
  CB:{ 'μαρκάρισμα':'dduelPct', 'τάκλιν':'tkl', 'εναέρια':'aerPct', 'πάσα':'passPct', 'τοποθέτηση':'int', 'δύναμη':'aerT' },
  FB:{ 'σέντρα':'crosses', 'αντοχή':'pressures', 'ταχύτητα':'progC', 'τάκλιν':'tklInt', 'πάσα':'passPct', 'μαρκάρισμα':'dduelPct' },
  DM:{ 'πάσα':'passPct', 'όραμα':'lineBreak', 'τάκλιν':'tklInt', 'αντοχή':'pressures', 'τοποθέτηση':'int', 'ηρεμία':'f3Pct' },
  CM:{ 'πάσα':'passPct', 'όραμα':'lineBreak', 'τάκλιν':'tklInt', 'αντοχή':'pressures', 'δημιουργία':'kp', 'τεχνική':'f3Pct' },
  AM:{ 'δημιουργία':'xa', 'όραμα':'kp', 'τεχνική':'drbPct', 'σουτ':'npxg', 'πάσα':'f3Pct', 'ντρίμπλα':'drbS' },
  W:{ 'ταχύτητα':'progC', 'ντρίμπλα':'drbS', 'σέντρα':'crosses', 'σουτ':'shots', 'τεχνική':'drbPct', 'δημιουργία':'xa' },
  ST:{ 'τελείωμα':'npxg', 'σουτ':'sotPct', 'εναέρια':'aerPct', 'τοποθέτηση':'touchBox', 'δύναμη':'aerT', 'ψυχραιμία':'goals' }
};
function txAttrs(p){ const o={}; for(const [a,k] of Object.entries(TX_ATTR_MAP[p.pos]||TX_ATTR_MAP.CM)) o[a] = clamp(Math.round(4+16*pct(p,k)/100),1,20); return o; }
function txSuit(p){
  const o={};
  for(const r of Object.keys(SLOT_DEFAULT_ARCH)){ const f=archFit(p,SLOT_DEFAULT_ARCH[r],r); if(f<=0) continue; o[r] = f>=62?'good':f>=48?'ok':'no'; }
  o[txPos(p)] = 'good'; return o;
}
function suggestDrills(t){
  const f = oppFlags(t), d = new Set();
  if(f.sp || f.aerial) d.add('setpieces-corners');
  if(f.highPress){ d.add('buildup-11v0'); }
  if(f.passive || f.lowBlock){ d.add('pos-3v3+3'); d.add('possession-directional-7v7'); }
  if(f.counter){ d.add('transition-cycle'); d.add('gegen-transition'); }
  if(f.possTeam) d.add('pressing-triggers');
  if(f.side==='C') d.add('rondo-4v2');
  if(f.late) d.add('ssg-4v4');
  const my = DB.teamByName[S.settings.myTeam]; if(my){ const A=teamAgg(my); if(A.gf<A.xgf-2){ d.add('finishing-cutback'); d.add('finishing-1v1-gk'); } }
  return [...d].slice(0,5);
}
function nextSat(){ const d=new Date(); d.setDate(d.getDate()+((6-d.getDay()+7)%7||7)); return d.toISOString().slice(0,10); }
function buildBridge(sysId, withOpp){
  const sys = SYS[sysId], sq = myTeamPlayers(), xi = bestXI(sys, sq);
  const opp = DB.teamByName[S.settings.nextOpp];
  const payload = { format:'datacoach360-bridge', version:1, at:new Date().toISOString(), source:'DATA COACH 360°',
    club:{ name:S.settings.myTeam }, tacticId:sys.id, formation:sys.f,
    players: sq.map(p=>{ const br = bestRoles(p,2);
      return { name:p.name, pos:txPos(p), age:p.age, attrs:txAttrs(p), minutes:p.min||0, goals:p.goals||0, assists:p.ast||0, suitability:txSuit(p),
        notes:`DATA COACH: score ${Math.round(p._score)}/100 · καλύτεροι ρόλοι: ${br.map(b=>`${ARCH[b.a].l} ${Math.round(b.f)}%`).join(', ')} · μισθός ${p.wage||'–'}k€ · λήξη ${p.contract||'–'}${scoutNoteText(p)}` }; }),
    xi: xi.slots.map(s=>({ i:s.i, r:s.r, role:ARCH[s.a].tx, roleName:ARCH[s.a].l, name:s.p?s.p.name:null, fit:Math.round(s.fit) })) };
  if(sys.custom) payload.customTactic = { id:sys.id, name:sys.n, coach:sys.c, formation:sys.f, tags:sys.t, positions: sysSlots(sys).map(sl=>({ r:sl.r, x:sl.x, y:sl.y, roleCode:ARCH[sl.a].tx, roleName:ARCH[sl.a].l })) };
  if(withOpp && opp){
    const F = oppFindings(opp), dr = suggestDrills(opp);
    payload.opponent = { name:opp.name, date:nextSat(), formation:opp.formation,
      notes:`${opp.style} · ${opp.formation} · xG ${teamAgg(opp).xgfM.toFixed(2)} / xGA ${teamAgg(opp).xgaM.toFixed(2)} ανά αγώνα.\nΑΔΥΝΑΜΙΕΣ: ${F.filter(f=>f.k==='weak').map(f=>f.t).join(' · ')||'—'}\nΔΥΝΑΤΑ: ${F.filter(f=>f.k==='str').map(f=>f.t).join(' · ')||'—'}\nΠΛΑΝΟ: ${F.map(f=>f.plan).join(' ')}\nΑΣΚΗΣΕΙΣ ΕΒΔΟΜΑΔΑΣ: ${dr.map(d=>TX_DRILLS[d]).join(', ')}`,
      drills: dr };
  }
  return payload;
}
const BV = { sys:null, opp:true };
VIEWS.bridge = function(){
  BV.sys ||= FV.sys || 'my-hybrid';
  const pl = buildBridge(BV.sys, BV.opp);
  let tx = null; try{ tx = JSON.parse(localStorage.getItem(TX_KEY)); }catch(e){}
  const sameOrigin = !!tx, pages = location.hostname.endsWith('github.io'), hub = location.pathname.startsWith('/datacoach') || pages;
  const txNext = tx && tx.matches ? tx.matches.filter(m=>m.status==='upcoming').sort((a,b)=>(a.date||'').localeCompare(b.date||''))[0] : null;
  const txTac = txNext && tx.tactics ? tx.tactics.find(t=>t.id===txNext.tacticId) : null;
  $('#view').innerHTML = `
  <div class="card hero"><h3>🔗 Σύνδεση με το TACTIX (πρόγραμμα προπονητή)</h3>
    <div class="small muted">Το DATA COACH στέλνει στο TACTIX: <b>ρόστερ με βαθμούς 1–20</b> (από τα εκατοστημόρια), <b>καταλληλότητα θέσεων</b> (από το fit), την <b>προτεινόμενη 11άδα</b> στο επιλεγμένο σύστημα και τον <b>επόμενο αγώνα</b> με το report αντιπάλου και προτεινόμενες ασκήσεις.</div>
    <div class="grid g2" style="margin-top:12px">
      <div class="find ${hub?'str':'info'}"><span class="ic">⚡</span><div><b>Ζωντανή σύνδεση${pages?' (online)':' (Coach Hub)'}</b><span class="small muted">${pages?'Το DATA COACH και το TACTIX είναι online στον ίδιο τομέα ✔ — τα δεδομένα πάνε απευθείας στο TACTIX, από υπολογιστή, κινητό ή τάμπλετ (στον ίδιο browser).':hub?'Είσαι στο Coach Hub ✔ — τα δεδομένα πάνε απευθείας στο TACTIX.':sameOrigin?'Το TACTIX τρέχει στην ίδια διεύθυνση ✔ — απευθείας αποστολή.':location.hostname==='localhost'?'Άνοιξε και τις δύο εφαρμογές από το Coach Hub (ρύθμιση εκκίνησης «COACH HUB», http://localhost:5265) για απευθείας αποστολή χωρίς αρχεία.':'Στην online έκδοση χρησιμοποίησε τη σύνδεση με αρχείο (δεξιά) — λειτουργεί από κινητό, τάμπλετ και υπολογιστή.'} ${sameOrigin?'<br>Βρέθηκε TACTIX με '+(tx.players||[]).length+' παίκτες ✔':''}</span></div></div>
      <div class="find info"><span class="ic">📁</span><div><b>Με αρχείο (λειτουργεί παντού)</b><span class="small muted">«Λήψη αρχείου» εδώ → στο TACTIX: Ρόστερ → «🔗 DATA COACH» → επιλογή αρχείου.</span></div></div></div></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>⚙️ Τι θα σταλεί</h3>
      <label class="f">Σύστημα / τακτική<select id="bS">${opts(SYSTEMS.map(s=>[s.id,`${s.f} · ${s.n} — ${s.c}`]), BV.sys)}</select></label>
      <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="bO" ${BV.opp?'checked':''}> Επόμενος αγώνας vs <b>${esc(S.settings.nextOpp)}</b> με report & ασκήσεις</label>
      <div class="row" style="margin-top:14px"><button class="btn pri" id="bSend" ${sameOrigin||hub?'':'disabled title="Διαθέσιμο μέσα από το Coach Hub"'}>⚡ Αποστολή στο TACTIX</button><button class="btn" id="bFile">⬇ Λήψη αρχείου για TACTIX</button>
      ${hub?'<a class="btn" href="/tactix/" target="_blank" rel="noopener">🧠 Άνοιγμα TACTIX</a>':''}</div>
      ${pl.opponent?`<hr><div class="small"><b>Report αντιπάλου που θα γραφτεί στον αγώνα:</b><pre class="code" style="white-space:pre-wrap;max-height:220px">${esc(pl.opponent.notes)}</pre></div>`:''}</div>
    <div class="card"><h3>🧩 11άδα (${esc(pl.formation)})</h3><div style="max-width:420px;margin:auto">${xiPitch(bestXI(SYS[BV.sys], myTeamPlayers()),'bP')}</div></div>
    ${txNext?`<div class="card span2"><h3>⬅️ Από το TACTIX</h3><div>Επόμενος αγώνας στο TACTIX: <b>${esc(txNext.opp)}</b> (${esc(txNext.date||'')}) με τακτική <b>${esc(txTac?txTac.name:txNext.tacticId||'—')}</b>.</div>
      <div class="row" style="margin-top:8px">${SYS[txNext.tacticId]?`<button class="btn" data-go="fit" data-arg="${txNext.tacticId}">🧩 Δες το fit του ρόστερ σε αυτή την τακτική</button>`:''}${DB.teamByName[txNext.opp]?`<button class="btn" id="bUseOpp">🕵️ Ορισμός ως επόμενου αντιπάλου</button>`:''}</div></div>`:''}
    <div class="card span2"><h3>👥 Ρόστερ όπως θα φανεί στο TACTIX (βαθμοί 1–20)</h3><div class="tbl-wrap"><table class="t"><tr><th class="l">Παίκτης</th><th>Θέση</th><th>Ηλ.</th><th class="l">Χαρακτηριστικά</th><th class="l">Καταλληλότητα</th></tr>
      ${pl.players.map(p=>`<tr><td class="l">${esc(p.name)}</td><td>${esc(p.pos)}</td><td>${p.age}</td><td class="l small">${Object.entries(p.attrs).map(([a,v])=>`${esc(a)} <b style="color:${v>=15?'var(--red2)':v>=11?'#fff':'var(--muted)'}">${v}</b>`).join(' · ')}</td><td class="l small">${Object.entries(p.suitability).filter(([,v])=>v!=='no').map(([r,v])=>`<span class="tag ${v==='good'?'r':''}">${esc(r)}</span>`).join(' ')}</td></tr>`).join('')}</table></div>
      <div class="small muted" style="margin-top:6px">Βαθμός = 4 + 16 × εκατοστημόριο/100 στη μετρική που αντιστοιχεί (π.χ. «εναέρια» ← εναέριες νίκες %). Οι υπάρχοντες παίκτες του TACTIX με το ίδιο όνομα ενημερώνονται· οι νέοι προστίθενται.</div></div>
  </div>`;
  on('#bS','change',e=>{ BV.sys=e.target.value; VIEWS.bridge(); });
  on('#bO','change',e=>{ BV.opp=e.target.checked; VIEWS.bridge(); });
  on('#bFile','click',()=>download(`DATACOACH_to_TACTIX_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(buildBridge(BV.sys,BV.opp),null,1), 'application/json'));
  on('#bSend','click',()=>{ try{ localStorage.setItem(BRIDGE_KEY, JSON.stringify(buildBridge(BV.sys,BV.opp))); toast('Στάλθηκε ✔ — άνοιξε/ανανέωσε το TACTIX'); }catch(e){ toast('Αποτυχία αποθήκευσης'); } });
  on('#bUseOpp','click',()=>{ S.settings.nextOpp = txNext.opp; save(); toast('Ορίστηκε ✔'); VIEWS.bridge(); });
};
