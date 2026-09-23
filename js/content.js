'use strict';
/* ===== DATA COACH 360° — Περιεχόμενο Ακαδημίας ===== */

const SOURCES = [
  { n:'StatsBomb Open Data', tag:'Χρυσό πρότυπο · event data', url:'https://github.com/statsbomb/open-data',
    what:'Πλήρη event data (κάθε πάσα, σουτ, τάκλιν, ντρίμπλα με συντεταγμένες X,Y) από Μουντιάλ, EURO, Champions League, ολόκληρες σεζόν La Liga (καριέρα Μέσι) κ.ά. Περιλαμβάνει και δείγματα 360° (freeze frames).',
    how:'Python: statsbombpy · R: StatsBombR · ή απευθείας μέσα από αυτή την εφαρμογή (καρτέλα «Ανάλυση Αγώνα» → StatsBomb live).' },
  { n:'FBref', tag:'Έτοιμοι πίνακες · Super League', url:'https://fbref.com/',
    what:'Στατιστικά για 100+ διοργανώσεις, μαζί με την ελληνική Super League: xG, xA, progressive passes/carries, πιέσεις, μονομαχίες.',
    how:'«Share & Export → Get table as CSV» σε κάθε πίνακα → επικόλληση στην καρτέλα «Δεδομένα». Python: soccerdata / ScraperFC · R: worldfootballR. (Η διαθεσιμότητα προχωρημένων μετρικών αλλάζει ανά σεζόν — έλεγξε πάντα τη σελίδα.)' },
  { n:'soccerdata (Python)', tag:'Πολλές πηγές με μία γραμμή', url:'https://github.com/probberechts/soccerdata',
    what:'Ενιαίο API για FBref, Understat (xG ανά σουτ), WhoScored, ClubElo, ESPN, Sofascore κ.ά.',
    how:'pip install soccerdata · sd.FBref(leagues="GRE-Super League", seasons="2025-2026") (τα ονόματα λιγκών ορίζονται στο config του πακέτου).' },
  { n:'Understat', tag:'xG ανά σουτ', url:'https://understat.com/',
    what:'Χάρτες σουτ και xG ανά αγώνα για τα 5 μεγάλα πρωταθλήματα + RFPL.', how:'Μέσω soccerdata ή understatapi.' },
  { n:'Transfermarkt', tag:'Αξίες · συμβόλαια', url:'https://www.transfermarkt.com/',
    what:'Εκτιμώμενες αγοραίες αξίες, λήξεις συμβολαίων, ιστορικό μεταγραφών.',
    how:'Χειροκίνητη εξαγωγή σε CSV (Όνομα, Αξία, Λήξη) → «Δεδομένα» → «Συγχώνευση Transfermarkt».' },
  { n:'Wyscout / Opta δημόσια datasets', tag:'Kaggle · ολόκληρες σεζόν', url:'https://www.kaggle.com/search?q=wyscout+soccer+events',
    what:'Το δημόσιο dataset Wyscout (Pappalardo et al., 2019) με events από Premier League, Serie A, Ligue 1, La Liga, Bundesliga, Μουντιάλ 2018, EURO 2016.',
    how:'Ιδανικό για SQL, μοντέλα xG, μοντέλα αξίας πάσας (VAEP/xT).' },
  { n:'Metrica Sports sample data', tag:'Tracking data', url:'https://github.com/metrica-sports/sample-data',
    what:'Δείγματα tracking data (θέσεις όλων των παικτών 25 φορές/δευτ.) — για pitch control & ανάλυση χώρων.', how:'Python: kloppy / floodlight.' },
  { n:'ClubElo', tag:'Βαθμολογίες δύναμης', url:'http://clubelo.com/',
    what:'Ιστορικό Elo rating συλλόγων — χρήσιμο για προβλέψεις και για προσαρμογή στατιστικών στο επίπεδο αντιπάλου.', how:'CSV API: api.clubelo.com/<Όνομα ομάδας>.' }
];

const LEARN = [
  { n:'McKay Johns (YouTube)', d:'Πρακτικά tutorials Python για ποδοσφαιρικά δεδομένα: shot maps, pass networks, scraping.', url:'https://www.youtube.com/@McKayJohns' },
  { n:'Friends of Tracking (YouTube)', d:'Δωρεάν διαλέξεις από κορυφαίους αναλυτές/ερευνητές (xG, pitch control, tracking).', url:'https://www.youtube.com/@friendsoftracking755' },
  { n:'Soccermatics (D. Sumpter)', d:'Δωρεάν μαθήματα & κώδικας Python για αναλυτική ποδοσφαίρου.', url:'https://soccermatics.readthedocs.io/' },
  { n:'mplsoccer docs', d:'Η βιβλιοθήκη για γήπεδα, radars, pizza charts, heatmaps — με εκατοντάδες παραδείγματα.', url:'https://mplsoccer.readthedocs.io/' },
  { n:'StatsBomb Resource Centre', d:'Άρθρα και οδηγοί για metrics, μεθοδολογία και χρήση των open data.', url:'https://statsbomb.com/what-we-do/soccer-data/' },
  { n:'Microsoft Learn — Power BI', d:'Δωρεάν διαδρομές εκμάθησης (PL-300): Power Query, DAX, μοντελοποίηση.', url:'https://learn.microsoft.com/training/powerplatform/power-bi' },
  { n:'Mode / SQLBolt', d:'Δωρεάν interactive μαθήματα SQL — βάση για queries σε event data.', url:'https://sqlbolt.com/' }
];

const GLOSSARY = [
  ['xG (Expected Goals)','Πιθανότητα ένα σουτ να γίνει γκολ, βάσει απόστασης, γωνίας, μέρους σώματος, τύπου φάσης κ.ά. Άθροισμα xG = ποιότητα ευκαιριών.'],
  ['npxG','xG χωρίς πέναλτι (κάθε πέναλτι ≈ 0,76 xG). Πιο «καθαρό» μέτρο της απειλής ενός επιθετικού.'],
  ['xA / xAG','Expected Assists: το xG του σουτ που προήλθε από την πάσα σου. Μετρά την ποιότητα των ευκαιριών που δημιουργείς, ανεξάρτητα από το αν ο συμπαίκτης σκόραρε.'],
  ['PSxG ±','Post-Shot xG μείον γκολ που δέχτηκε ο τερματοφύλακας. Θετικό = σώζει περισσότερα από το αναμενόμενο.'],
  ['PPDA','Passes Per Defensive Action: αντίπαλες πάσες ανά αμυντική ενέργεια στο 60% του γηπέδου μας. Χαμηλό PPDA (≈7–9) = έντονο pressing. Υψηλό (≈14+) = χαμηλό μπλοκ.'],
  ['Progressive pass / carry','Πάσα/κούρσα που φέρνει την μπάλα σημαντικά πιο κοντά στην αντίπαλη εστία (π.χ. ≥10 μ. ή στην περιοχή).'],
  ['Key pass','Πάσα που οδηγεί άμεσα σε σουτ.'],
  ['Line-breaking pass','Πάσα που περνά μία ή περισσότερες αντίπαλες γραμμές (άμυνα/μεσαία).'],
  ['Field tilt','Ποσοστό επαφών στο τελευταίο τρίτο που ανήκουν σε κάθε ομάδα — δείχνει ποιος «πατάει» στο γήπεδο του άλλου.'],
  ['xT (Expected Threat)','Αξία κάθε ζώνης του γηπέδου· μια πάσα/κούρσα αξίζει τη διαφορά xT αφετηρίας-προορισμού.'],
  ['xPts (Expected Points)','Αναμενόμενοι βαθμοί από το xG κάθε αγώνα (μοντέλο Poisson). Διαφορά βαθμών – xPts ≈ τύχη/φινίρισμα.'],
  ['Per 90','Κάθε μετρική διαιρεμένη με (λεπτά/90). Δίκαιη σύγκριση παικτών με διαφορετικό χρόνο συμμετοχής. Φίλτραρε <450′ για θόρυβο.'],
  ['Εκατοστημόριο (percentile)','Η θέση του παίκτη στο δείγμα ίδιας θέσης (0–100). 90ό = καλύτερος από το 90%.'],
  ['ACWR','Acute:Chronic Workload Ratio: φορτίο 7 ημερών / μέσο εβδομαδιαίο φορτίο 28 ημερών. 0,8–1,3 «ασφαλής ζώνη», >1,5 αυξημένος κίνδυνος τραυματισμού.'],
  ['sRPE','Session RPE: βαθμός κόπωσης (1–10) × λεπτά προπόνησης = μονάδες φορτίου.'],
  ['Squad cost ratio (UEFA)','(Μισθοί + αποσβέσεις μεταγραφών + αμοιβές ατζέντηδων) / έσοδα. Όριο UEFA 70% από τη σεζόν 2025/26.'],
  ['Απόσβεση (amortization)','Το κόστος μεταγραφής κατανέμεται ισόποσα στα χρόνια του συμβολαίου (π.χ. 1 εκ.€ / 4 έτη = 250 χιλ.€/έτος).'],
  ['Moneyball','Εύρεση υποτιμημένων παικτών: υψηλή απόδοση σε σχέση με την τιμή/μισθό, συχνά σε μικρότερες κατηγορίες.']
];

const CODE = {
  shotmap:{ t:'Python · Shot Map (StatsBomb)', lang:'python', c:
`# pip install pandas matplotlib mplsoccer statsbombpy
import matplotlib.pyplot as plt
from mplsoccer import VerticalPitch
from statsbombpy import sb

events = sb.events(match_id=3869685)            # Τελικός Μουντιάλ 2022
shots = events[events['type'] == 'Shot'].copy()
shots = shots[shots['period'] < 5]              # χωρίς διαδικασία πέναλτι
shots[['x', 'y']] = shots['location'].tolist()

team = 'Argentina'
s = shots[shots['team'] == team]
goals, misses = s[s['shot_outcome'] == 'Goal'], s[s['shot_outcome'] != 'Goal']

pitch = VerticalPitch(pitch_type='statsbomb', half=True,
                      pitch_color='#0b0d12', line_color='#5b6478')
fig, ax = pitch.draw(figsize=(8, 7))
pitch.scatter(misses.x, misses.y, s=misses.shot_statsbomb_xg * 900,
              c='#e11d2e', alpha=.45, edgecolors='#e11d2e', ax=ax, label='Χωρίς γκολ')
pitch.scatter(goals.x, goals.y, s=goals.shot_statsbomb_xg * 900,
              c='#f5b301', edgecolors='black', ax=ax, label='Γκολ')
ax.set_title(f'{team} · {len(s)} σουτ · xG {s.shot_statsbomb_xg.sum():.2f}',
             color='white', fontsize=15)
ax.legend(loc='lower center', ncol=2, frameon=False, labelcolor='white')
fig.set_facecolor('#0b0d12')
plt.savefig('shotmap.png', dpi=200, bbox_inches='tight')` },
  passnet:{ t:'Python · Passing Network', lang:'python', c:
`import pandas as pd
from mplsoccer import Pitch
from statsbombpy import sb

ev = sb.events(match_id=3869685)
team = 'Argentina'
# κρατάμε μέχρι την πρώτη αλλαγή ώστε να μένει η βασική 11άδα
first_sub = ev[(ev.type == 'Substitution') & (ev.team == team)].minute.min()
p = ev[(ev.type == 'Pass') & (ev.team == team) & (ev.minute < first_sub)
       & (ev.pass_outcome.isna())].copy()
p[['x', 'y']] = p.location.tolist()

avg = p.groupby('player').agg(x=('x', 'mean'), y=('y', 'mean'), n=('x', 'size'))
pairs = (p.groupby(['player', 'pass_recipient']).size()
          .reset_index(name='cnt'))
pairs = pairs[pairs.cnt >= 3].merge(avg, left_on='player', right_index=True)
pairs = pairs.merge(avg, left_on='pass_recipient', right_index=True, suffixes=('', '_end'))

pitch = Pitch(pitch_type='statsbomb', pitch_color='#0b0d12', line_color='#5b6478')
fig, ax = pitch.draw(figsize=(11, 7))
pitch.lines(pairs.x, pairs.y, pairs.x_end, pairs.y_end,
            lw=pairs.cnt / pairs.cnt.max() * 10, color='#e11d2e', alpha=.6, ax=ax)
pitch.scatter(avg.x, avg.y, s=avg.n * 12, color='#0b0d12',
              edgecolors='#e11d2e', linewidth=2, ax=ax)
for name, r in avg.iterrows():
    pitch.annotate(name.split()[-1], (r.x, r.y - 4), color='white',
                   ha='center', fontsize=9, ax=ax)
fig.set_facecolor('#0b0d12')` },
  radar:{ t:'Python · Radar με εκατοστημόρια', lang:'python', c:
`import pandas as pd
from mplsoccer import PyPizza

df = pd.read_csv('fbref_superleague_mf.csv')      # εξαγωγή από FBref
df = df[df['Min'] >= 450]
metrics = ['xAG', 'KP', 'PrgP', 'Cmp%', 'Tkl+Int', 'PrgC']
for m in metrics:
    if m != 'Cmp%':
        df[m + '_90'] = df[m] / (df['Min'] / 90)
cols = [m + '_90' if m != 'Cmp%' else m for m in metrics]
pct = df[cols].rank(pct=True) * 100

row = df.index[df['Player'] == 'Όνομα Παίκτη'][0]
values = pct.loc[row].round().astype(int).tolist()

baker = PyPizza(params=metrics, background_color='#0b0d12',
                straight_line_color='#262d3d', last_circle_color='#262d3d')
fig, ax = baker.make_pizza(values, figsize=(7, 7),
    kwargs_slices=dict(facecolor='#e11d2e', edgecolor='#0b0d12'),
    kwargs_params=dict(color='white'), kwargs_values=dict(color='white'))` },
  soccerdata:{ t:'Python · Κατέβασμα FBref με soccerdata', lang:'python', c:
`# pip install soccerdata
import soccerdata as sd

fb = sd.FBref(leagues='GRE-Super League', seasons='2025-2026')
std  = fb.read_player_season_stats(stat_type='standard')
pas  = fb.read_player_season_stats(stat_type='passing')
gca  = fb.read_player_season_stats(stat_type='goal_shot_creation')

df = std.join(pas, rsuffix='_pass').join(gca, rsuffix='_gca')
df.to_csv('superleague_players.csv')    # → «Δεδομένα» σε DATA COACH 360°
# Σημ.: αν το όνομα λίγκας δεν υπάρχει, πρόσθεσέ το στο league_dict.json του soccerdata.` },
  xgmodel:{ t:'Python · Δικό σου μοντέλο xG (logistic regression)', lang:'python', c:
`import numpy as np, pandas as pd
from statsbombpy import sb
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, brier_score_loss

matches = sb.matches(competition_id=43, season_id=106)   # Μουντιάλ 2022
shots = pd.concat([sb.events(m, split=True)['shots'] for m in matches.match_id])
shots = shots[shots.shot_type != 'Penalty']
shots[['x', 'y']] = shots.location.tolist()
dx = 120 - shots.x
shots['dist'] = np.hypot(dx, 40 - shots.y)
shots['angle'] = np.abs(np.arctan2(44 - shots.y, dx) - np.arctan2(36 - shots.y, dx))
shots['header'] = (shots.shot_body_part == 'Head').astype(int)
shots['goal'] = (shots.shot_outcome == 'Goal').astype(int)

X, y = shots[['dist', 'angle', 'header']], shots.goal
model = LogisticRegression().fit(X, y)
p = model.predict_proba(X)[:, 1]
print('AUC', roc_auc_score(y, p), 'Brier', brier_score_loss(y, p))
print(dict(zip(X.columns, model.coef_[0])), model.intercept_)` },
  powerquery:{ t:'Power Query (M) · Καθαρισμός & Per 90', lang:'m', c:
`let
    Source   = Web.Page(Web.Contents("https://fbref.com/en/comps/27/stats/Super-League-Greece-Stats")),
    Players  = Source{[Id="stats_standard"]}[Data],
    Typed    = Table.TransformColumnTypes(Players, {{"Min", Int64.Type}, {"Gls", Int64.Type}, {"Ast", Int64.Type}}),
    NoHeaderRows = Table.SelectRows(Typed, each [Player] <> "Player"),
    MinFilter    = Table.SelectRows(NoHeaderRows, each [Min] >= 450),
    AddP90   = Table.AddColumn(MinFilter, "Nineties", each [Min] / 90, type number),
    Gls90    = Table.AddColumn(AddP90, "Gls_90", each [Gls] / [Nineties], type number),
    Ast90    = Table.AddColumn(Gls90, "Ast_90", each [Ast] / [Nineties], type number)
in
    Ast90
// Σημ.: το FBref συχνά κρύβει πίνακες σε HTML comments· αν δεν φανεί ο πίνακας, χρησιμοποίησε το CSV export.` },
  dax:{ t:'DAX · Μετρικές scouting', lang:'dax', c:
`Nineties         = DIVIDE( SUM ( Players[Min] ), 90 )
Goal_Contrib_90  = DIVIDE( SUM ( Players[Gls] ) + SUM ( Players[Ast] ), [Nineties], 0 )
npxG_90          = DIVIDE( SUM ( Players[npxG] ), [Nineties], 0 )
xA_90            = DIVIDE( SUM ( Players[xAG] ), [Nineties], 0 )
KP_90            = DIVIDE( SUM ( Players[KP] ), [Nineties], 0 )
Aerial_Win_Pct   = DIVIDE( SUM ( Players[AerWon] ), SUM ( Players[AerWon] ) + SUM ( Players[AerLost] ) )

-- Εκατοστημόριο xA/90 μέσα στην ίδια θέση (για radar/cards)
xA90_Percentile =
VAR cur = [xA_90]
VAR pos = SELECTEDVALUE ( Players[Pos] )
VAR pool = FILTER ( ALL ( Players ), Players[Pos] = pos && Players[Min] >= 450 )
RETURN DIVIDE ( COUNTROWS ( FILTER ( pool, CALCULATE ( [xA_90] ) < cur ) ), COUNTROWS ( pool ) )

-- Value for money: απόδοση ανά 100 χιλ.€ μισθού
VfM = DIVIDE ( [Goal_Contrib_90], DIVIDE ( SUM ( Players[Wage_k] ), 100 ) )` },
  sql:{ t:'SQL · Queries σε event data (Wyscout/StatsBomb)', lang:'sql', c:
`-- Top δημιουργοί: key passes & xA ανά 90' (min 450')
SELECT p.player_name, p.team,
       SUM(m.minutes)                                   AS mins,
       90.0 * SUM(CASE WHEN e.is_key_pass THEN 1 END) / SUM(m.minutes) AS kp_90,
       90.0 * SUM(e.xa) / SUM(m.minutes)                AS xa_90
FROM events e
JOIN players p   ON p.player_id = e.player_id
JOIN minutes m   ON m.player_id = e.player_id AND m.match_id = e.match_id
WHERE e.type = 'Pass'
GROUP BY p.player_name, p.team
HAVING SUM(m.minutes) >= 450
ORDER BY xa_90 DESC
LIMIT 20;

-- xG κατά ανά τύπο φάσης για έναν αντίπαλο (για opponent report)
SELECT play_pattern, COUNT(*) AS shots, ROUND(SUM(xg),2) AS xg
FROM shots WHERE opponent = 'Αντίπαλος ΦΚ'
GROUP BY play_pattern ORDER BY xg DESC;` }
};

const ROADMAP = [
  { g:'1 · Βάσεις (εβδ. 1–4)', items:[
    'Μάθε την ορολογία: xG, xA, PPDA, progressive actions, per 90 (δες «Γλωσσάρι»)',
    'Παρακολούθησε δωρεάν σειρές (Friends of Tracking, McKay Johns)',
    'Κατέβασε έναν πίνακα FBref Super League σε CSV και φόρτωσέ τον εδώ',
    'Φτιάξε το πρώτο σου scatter xA/90 vs Key Passes/90 (καρτέλα «Ανάλυση Ρόλων»)' ]},
  { g:'2 · Εργαλεία (εβδ. 5–10)', items:[
    'Εγκατάσταση Python (Anaconda) + pandas, mplsoccer, statsbombpy',
    'Αναπαραγωγή Shot Map & Passing Network από τον «Κώδικα»',
    'Power BI: Get Data → Web (FBref), Power Query per-90, 3 σελίδες report',
    'Βασικό SQL: GROUP BY, JOIN, HAVING σε event data' ]},
  { g:'3 · Πορτφόλιο (εβδ. 8–16)', items:[
    'Δημοσίευση #1: «Οι πιο υποτιμημένοι δημιουργοί της Super League» (scatter)',
    'Δημοσίευση #2: Ανάλυση στημένων φάσεων μιας ομάδας (shot map ανά τύπο φάσης)',
    'Δημοσίευση #3: 2σέλιδο opponent report για αγώνα της αγωνιστικής',
    'Δημοσίευση #4: Moneyball λίστα από Super League 2 (αξία vs απόδοση)',
    'Φτιάξε σελίδα/Notion ή GitHub με όλα τα reports & τον κώδικα' ]},
  { g:'4 · Στοχευμένη προσέγγιση', items:[
    'Λίστα 10 ομάδων SL2/SL1 με τον τεχνικό διευθυντή/προπονητή τους (LinkedIn)',
    'Για κάθε ομάδα: δωρεάν mini-report για τον επόμενο αντίπαλό τους',
    'Μήνυμα προσέγγισης (πρότυπο στο «Πορτφόλιο») + follow-up σε 7 ημέρες',
    'Πρόταση pilot 4 εβδομάδων (π.χ. weekly opponent report + squad dashboard)' ]},
  { g:'5 · Εξέλιξη', items:[
    'Εκμάθηση Wyscout/InStat/Hudl (πολλές ομάδες δίνουν πρόσβαση σε αναλυτές)',
    'Δικό σου μοντέλο xG / xT και σύγκριση με το StatsBomb',
    'Tracking data (Metrica) → pitch control',
    'Πιστοποιήσεις μόνο όταν χρειαστούν — πρώτα αποδείξεις δουλειάς' ]}
];

const IDEAS = [
  ['🧩','Συστήματα & Fit','Fit % κάθε παίκτη ανά ρόλο, καλύτερη 11άδα στις 16 τακτικές του TACTIX.','fit'],
  ['🔗','Σύνδεση TACTIX','Ρόστερ 1–20, 11άδα & report αντιπάλου απευθείας στο πρόγραμμα προπονητή.','bridge'],
  ['🌱','Νέοι & ROI','Καμπύλες εξέλιξης U21 και αξία σε 2–3 χρόνια.','youth'],
  ['✍️','Συμβόλαια','Δίκαιος μισθός, διάρκεια, ρήτρες, ανανέωση ή πώληση.','contracts'],
  ['🧪','Σενάρια μπάτζετ','Υποβιβασμός, πωλήσεις, μεταγραφές — οικονομική & αγωνιστική επίπτωση.','scenarios'],
  ['📝','Καταγραφή αγώνα','Δικά σου δεδομένα σουτ/xG με κλικ, για SL2 & ερασιτεχνικές.','logger'],
  ['🏛️','Αναφορά διοίκησης','Μηνιαίο PDF για πρόεδρο & τεχνικό διευθυντή.','board'],
  ['🎬','Βίντεο','Clips YouTube με χρονοσήμανση, δεμένα με σουτ & παίκτες.','video'],
  ['🔮','Πρόβλεψη αγώνα (Poisson)','Πιθανότητες 1Χ2, Over/Under, ακριβές σκορ από τα xG των ομάδων.','tools'],
  ['🎯','Υπολογιστής xG','Κάνε κλικ στο γήπεδο και δες την πιθανότητα γκολ με το δικό μας μοντέλο.','tools'],
  ['🩺','Φορτίο & τραυματισμοί (ACWR)','Παρακολούθηση φορτίου προπονήσεων, προειδοποίηση για κίνδυνο.','tools'],
  ['🍀','xPoints / «τύχη»','Ποιες ομάδες έχουν περισσότερους βαθμούς απ’ όσους «αξίζουν».','team'],
  ['🧬','Όμοιοι παίκτες','Βρες φθηνότερους «κλώνους» ενός παίκτη (cosine similarity).','profile'],
  ['📈','xG race','Χρονολόγιο αθροιστικού xG σε πραγματικούς αγώνες StatsBomb.','match'],
  ['🏦','Squad cost ratio (UEFA 70%)','Μισθοί + αποσβέσεις / έσοδα και σενάρια μεταγραφών.','squad'],
  ['✉️','Pitch προς ομάδα','Αυτόματο μήνυμα προσέγγισης με δεδομένα της ομάδας-στόχου.','portfolio']
];
