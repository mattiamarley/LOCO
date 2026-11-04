from pathlib import Path
from urllib.parse import quote
from PIL import Image,ImageDraw
from collections import Counter
import json,html,hashlib
root=Path('PROJECT START FOLDER'); out=Path('research/media'); inventory=json.loads((out/'inventory.json').read_text())
for i in inventory:
 i['sha256']=hashlib.sha256(Path(i['path']).read_bytes()).hexdigest()
(out/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
css='''@font-face{font-family:Inter;src:url('../../PROJECT%20START%20FOLDER/Book%20Loco/Document%20fonts/InterTight-Medium.ttf')}*{box-sizing:border-box}body{margin:0;background:#faf9fd;color:#181818;font:16px/1.5 Inter,system-ui}header{background:#ffd114;padding:48px 5vw}h1{font-size:clamp(32px,5vw,64px);line-height:1.05;margin:10px 0}h2{font-size:30px;margin-top:48px}main{max-width:1500px;margin:auto;padding:24px 4vw 70px}nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:25px}a{color:#4e34ba}nav a{background:white;color:#181818;text-decoration:none;padding:9px 16px;border-radius:30px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}.card{padding:14px;background:white;border:1px solid #ded9ec;border-radius:16px;overflow:hidden}.card img{width:100%;height:260px;object-fit:contain;background:#f0eef5}.card h3{font-size:17px;margin:12px 0 5px}.card p{font-size:13px;color:#555;margin:5px 0}.timeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}.timeline img{width:100%;display:block}.timeline figcaption{font-size:13px;margin-top:6px}figure{margin:0}.video{width:100%;max-height:650px;background:#111;border-radius:12px}details{background:white;padding:18px;border-radius:12px;margin:15px 0}summary{cursor:pointer;font-weight:bold}.notice{padding:18px 22px;border-left:5px solid #613be0;background:#eee8ff;border-radius:4px}small{color:#555}.sheet{width:100%;border-radius:12px}code{overflow-wrap:anywhere}'''
parts=['<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LOCO — Archivio e studio dei materiali</title><style>'+css+'</style><header><small>LOCO / RICERCA PRIMA DI FIGMA · 4 NOVEMBRE 2026</small><h1>Ogni materiale.<br>Ogni dettaglio utile.</h1><p>58 file originali: 46 PNG, 2 video, 1 PDF, 1 sorgente InDesign e 8 font. 134 fotogrammi campionati con riferimento temporale.</p><nav>']
for key,label in [('sintesi','Risultati'),('adv','ADV e gadget'),('mockup','Mockup'),('spot','Spot ADV'),('mobile','Demo mobile e VR'),('book','Book e sorgenti')]:parts.append(f'<a href="#{key}">{label}</a>')
parts.append('</nav></header><main><section id="sintesi"><h2>Cosa cambia nella ricostruzione</h2><div class="notice">La cartella locale documenta una versione visiva diversa dal primo PDF: giallo e viola/lilla, oca nella L, personaggi con contorni neri. Il video mobile esplicita il funzionamento di VR, sguardo, voce e associazioni nel luogo. Gli asset originali restano integri.</div><p><a href="MEDIA-STUDY.md">Leggi lo studio completo</a> · <a href="inventory.json">Inventario tecnico con SHA-256</a> · <a href="idml-stories.txt">Testi estratti dal sorgente InDesign</a></p></section>')
for cat,title in [('ADV','ADV, caroselli, poster e gadget'),('Mockup','Mockup nel contesto')]:
 parts.append(f'<section id="{cat.lower()}"><h2>{title}</h2><div class="grid">')
 for i in inventory:
  f=Path(i['path'])
  if cat not in f.parts or i['type']!='.png':continue
  src='../../'+quote(str(f));label=html.escape(str(f.relative_to(root)))
  parts.append(f'<article class="card"><a href="{src}"><img loading="lazy" src="{src}" alt="{label}"></a><h3>{html.escape(f.name)}</h3><p>{label}</p><p>{i["width"]} × {i["height"]} px · {i["bytes"]//1024:,} KB</p></article>')
 parts.append('</div></section>')
for prefix,filename,title,step,stem in [('adv','Spot ADV.mov','Spot ADV · 57,27 secondi',1,'spot-adv'),('mobile','DEF MOBILE.mov','Demo mobile e VR · 3 minuti e 50,22 secondi',3,'demo-mobile')]:
 key='spot' if prefix=='adv' else 'mobile'
 parts.append(f'<section id="{key}"><h2>{title}</h2><video class="video" controls preload="metadata" src="../../{quote(str(root/"Video"/filename))}"></video><p>Fotogrammi a intervalli di {step} secondi. Le immagini sono campioni del filmato, non una certificazione che le funzioni mostrate fossero implementate.</p>')
 transcript=out/(stem+'-transcript.txt')
 if transcript.exists():parts.append('<details><summary>Trascrizione automatica locale dell’audio</summary><p>Da controllare sul filmato per parole ambigue; tempi automatici.</p><pre style="white-space:pre-wrap">'+html.escape(transcript.read_text())+'</pre></details>')
 parts.append('<div class="timeline">')
 for f in sorted((out/'video').glob(prefix+'-*.jpg')):
  sec=(int(f.stem.split('-')[-1])-1)*step; stamp=f'{sec//60:02}:{sec%60:02}'
  parts.append(f'<figure><a href="video/{f.name}"><img loading="lazy" src="video/{f.name}" alt="{title} a {stamp}"></a><figcaption>{stamp} · <a href="../../{quote(str(root/"Video"/filename))}#t={sec}">Apri il video qui</a></figcaption></figure>')
 parts.append('</div></section>')
parts.append('<section id="book"><h2>Book, sorgenti e font</h2><p>Il primo PDF di 146 pagine è documentato nell’audit precedente. Il file IDML locale contiene 142 pagine e testo estraibile: è una fonte distinta, con revisioni e residui di lavorazione.</p><p><a href="../PROJECT-AUDIT.md">Audit del primo book</a> · <a href="../MEMORY-FOUNDATIONS.md">Fondamenti delle tecniche di memoria</a> · <a href="idml-structure.json">Font, colori e collegamenti IDML</a></p><a href="../../PROJECT%20START%20FOLDER/ADV/gadget/Banda%20VR.pdf"><img class="sheet" src="screens/banda-vr-1.png" alt="Banda VR, una pagina con il titolo"></a><details><summary>Elenco completo dei file originali</summary><ul>')
for i in inventory:parts.append('<li><a href="../../'+quote(i['path'])+'">'+html.escape(i['path'])+'</a> — '+str(i['bytes'])+' byte</li>')
parts.append('</ul></details></section></main></html>')
(out/'index.html').write_text(''.join(parts))
print(Counter(i['type'] for i in inventory))
print('Catalogo creato con',sum(1 for _ in (out/'video').glob('*.jpg')),'fotogrammi')
