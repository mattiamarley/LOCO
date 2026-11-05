"""Convert the retrieved Figma reference markup into dependency-free HTML/CSS.
Input is the authoritative get_design_context output, not screenshots.
Material kit snippets have no matching imported implementation in the local
vanilla preview; adapt them to accessible native controls.
"""
from pathlib import Path
import re,json,html
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'app/prototype'
frames={'home':'home-473-1088','create':'880-2307','courses':'778-954','course':'849-900','recap':'642-678','position':'517-1056','position-filled':'880-2633','confirm':'539-577','trace':'539-908','details':'587-613','finish':'609-755','draft':'1339-1159','login':'942-923','profile':'774-750','loading':'1121-5315'}
css={};unknown=set()
def length(v):
 v=v.replace('_',' ')
 if v.startswith('calc('):v=re.sub(r'(?<=[\w%)])([+-])(?=[\d.(])',r' \1 ',v)
 return v
simple={'object-bottom':'object-position:bottom','text-right':'text-align:right','right-0':'right:0','bottom-1/2':'bottom:50%','bottom-full':'bottom:100%','left-1/2':'left:50%','bg-gradient-to-r':'background:#ffd014','from-[#ffd014]':'--from:#ffd014','to-[#ffd014]':'--to:#ffd014','absolute':'position:absolute','relative':'position:relative','fixed':'position:fixed','contents':'display:contents','block':'display:block','flex':'display:flex','flex-col':'flex-direction:column','flex-none':'flex:none','items-center':'align-items:center','items-start':'align-items:flex-start','justify-center':'justify-content:center','justify-between':'justify-content:space-between','content-stretch':'align-content:stretch','size-full':'width:100%;height:100%','w-full':'width:100%','h-full':'height:100%','max-w-none':'max-width:none','inset-0':'inset:0','left-0':'left:0','top-0':'top:0','h-0':'height:0','w-0':'width:0','mb-0':'margin-bottom:0','bg-white':'background:#fff','bg-black':'background:#000','text-black':'color:#000','text-white':'color:#fff','text-center':'text-align:center','text-left':'text-align:left','leading-none':'line-height:1','leading-normal':'line-height:1.5','font-semibold':'font-weight:600','font-medium':'font-weight:500','font-bold':'font-weight:700','font-normal':'font-weight:400','not-italic':'font-style:normal','whitespace-nowrap':'white-space:nowrap','whitespace-pre-wrap':'white-space:pre-wrap','pointer-events-none':'pointer-events:none','cursor-pointer':'cursor:pointer','overflow-hidden':'overflow:hidden','border':'border-width:1px','border-solid':'border-style:solid','rounded-full':'border-radius:9999px','shrink-0':'flex-shrink:0','underline':'text-decoration:underline'}
def translate(classes):
 out=[];trans=[]
 for c in classes.split():
  if c in simple:out.append(simple[c]);continue
  if c=='-translate-x-1/2':trans.append('translateX(-50%)');continue
  if c=='-translate-y-1/2':trans.append('translateY(-50%)');continue
  if c=='-scale-x-100':trans.append('scaleX(-1)');continue
  if c=='-scale-y-100':trans.append('scaleY(-1)');continue
  if c in ['rotate-30','rotate-60','rotate-90']:trans.append('rotate('+c.split('-')[1]+'deg)');continue
  if c.startswith('opacity-'):out.append('opacity:'+str(float(c.split('-')[1])/100));continue
  if c.startswith('font-['):
   val=c[6:-1].strip("'")
   family,_,weight=val.partition(':');family='Baloo 2' if family in ['Baloo','Baloo_2'] else family.replace('_',' ')
   out.append('font-family:"'+family+'",sans-serif')
   if weight:out.append('font-weight:'+str({'Regular':400,'Medium':500,'SemiBold':600,'Bold':700,'Light':300}.get(weight,400)))
   continue
  m=re.match(r'([a-z-]+)-\[(.*)\]$',c)
  if m:
   k,v=m.groups();v=length(v)
   prop={'h':'height','w':'width','left':'left','right':'right','top':'top','bottom':'bottom','inset':'inset','rounded':'border-radius','leading':'line-height','tracking':'letter-spacing','bg':'background','border':'border-color','min-h':'min-height','gap':'gap','px':'padding-inline','py':'padding-block','p':'padding','pt':'padding-top','pb':'padding-bottom'}.get(k)
   if k=='size':out.extend(['width:'+v,'height:'+v]);continue
   if k=='text':prop='color' if v.startswith(('#','rgb','var')) else 'font-size'
   if k=='rotate':trans.append('rotate('+v+')');continue
   if k=='backdrop-blur':out.append('backdrop-filter:blur('+v+')');continue
   if prop:out.append(prop+':'+v);continue
  if c.startswith('[') and c.endswith(']'):out.append(c[1:-1].replace('_',' '));continue
  if c.startswith('mask-'):
   if c=='mask-alpha':out.append('mask-mode:alpha')
   elif c=='mask-intersect':out.append('mask-composite:intersect')
   elif c=='mask-no-clip':out.append('mask-clip:no-clip')
   elif c=='mask-no-repeat':out.append('mask-repeat:no-repeat')
   elif c.startswith('mask-position-['):out.append('mask-position:'+length(c[15:-1]))
   elif c.startswith('mask-size-['):out.append('mask-size:'+length(c[11:-1]))
   continue
  if c=='object-cover':out.append('object-fit:cover');continue
  unknown.add(c)
 # Figma fixed-height fields can contain excessive exported vertical padding.
 if re.search(r'h-\[\d+(?:\.\d+)?px\]',classes) and 'py-[40px]' in classes:out.append('padding-block:0')
 if trans and 'contents' not in classes.split():out.append('transform:'+' '.join(trans))
 return ';'.join(out)
def class_convert(m):
 value=m.group(1)
 if value not in css:css[value]=('f'+str(len(css)),translate(value))
 return 'class="'+css[value][0]+'"'
search_geometry={'453:822':(382,387,519,69),'778:1067':(149,186,555,53),'587:939':(633,285,426,43),'587:945':(633,398,426,43),'811:1021':(841,585,147,43)}
# Geometry retrieved from the same authoritative Figma metadata.
search_geometry.update(json.loads((ROOT/'research/figma/context/input-geometry.json').read_text()))
def snippet(m):
 attrs,body=m.groups();node=re.search(r'data-node-id="([^"]+)"',attrs);node=node[1] if node else ''
 if '<Search' in body:
  value=re.search(r'textValue="([^"]*)"',body);value=value[1] if value else ''
  x,y,w,h=search_geometry.get(node,(100,100,250,40))
  return f'<input class="design-input" data-node-id="{node}" aria-label="{html.escape(value)}" placeholder="{html.escape(value)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px"/>'
 b=re.search(r'<Button\b([^>]*)(?:/>|>(.*?)</Button>)',body,re.S)
 if b:
  label=re.search(r'labelText="([^"]*)"',b[1]);label=label[1] if label else ''
  inner=b[2] or '';inner=re.sub(r'<(?:Icon|X)\b[^>]*/>', '' if label else '<span aria-hidden="true">×</span>',inner)
  if not label and not inner.strip():inner='<span aria-hidden="true">×</span>'
  return '<button class="design-button'+(' icon-button' if not label else '')+'" data-node-id="'+node+'"'+(' aria-label="Chiudi"' if not label else '')+'>'+inner+html.escape(label)+'</button>'
 return body
views={}
for name,file in frames.items():
 folder='context';s=(ROOT/f'research/figma/{folder}/{file}.txt').read_text();assets={m[1]:'assets/figma/'+('' if name=='home' else file+'-')+m[1]+'.'+m[2].split('.')[-1] for m in re.finditer(r'const (\w+) = "([^"]+)";',s)}
 helpers={m[1]:m[2] for m in re.finditer(r'function ([A-Z]\w+)\([^\n]*\).*?return \(\n(.*?)\n\s*\);',s,re.S)}
 s=s.split('export default function',1)[1].split('return (',1)[1].split('\n  );',1)[0]
 for helper,body in helpers.items():
  def expand(m):
   cls=re.search(r'className="([^"]*)"',m[1]);value=cls[1] if cls else ''
   return re.sub(r'className=\{className \|\| "[^"]*"\}',lambda _: 'className="'+value+'"',body)
  s=re.sub(r'<'+helper+r'\b([^>]*)/>',expand,s)
 s=re.sub(r'id=\{isVariant2 \? [^}]+\}', '', s)
 s=re.sub(r'src=\{isVariant2 \? (\w+) : (\w+)\}',r'src={\1}',s)
 s=re.sub(r'\$\{isVariant2 \? "([^"]*)" : "[^"]*"\}',r'\1',s)
 s=re.sub(r'className=\{`(.*?)`\}',lambda m:'className="'+m[1].replace('"',"'")+'"',s,flags=re.S)
 s=re.sub(r'\{/\*.*?\*/\}','',s,flags=re.S)
 s=re.sub(r'<CodeConnectSnippet([^>]*)>(.*?)</CodeConnectSnippet>',snippet,s,flags=re.S)
 s=re.sub(r'\{`(.*?)`\}',lambda m:html.escape(m[1]),s,flags=re.S)
 s=re.sub(r'src=\{(\w+)\}',lambda m:'src="'+assets[m[1]]+'"',s)
 s=s.replace('style={{ containerType: "size" }}','style="container-type:size"').replace('<br aria-hidden />','<br aria-hidden="true"/>').replace('aria-hidden className','aria-hidden="true" className')
 s=re.sub(r'style=\{\{ maskImage: `url\(\"\$\{(\w+)\}\"\)` \}\}',lambda m:'style="mask-image:url('+assets[m[1]]+')"',s)
 s=re.sub(r'className="([^"]*)"',class_convert,s)
 s=re.sub(r'<img([^>]*src="[^"]+\.svg"[^>]*)/>',lambda m:'<img'+m[1]+' data-original-svg="true"/>',s)
 # Exported logo is the exact original group, avoiding font substitutions.
 # Group boundaries are resolved with a small balanced-tag scan.
 starts=[m for m in re.finditer(r'<div[^>]+data-node-id="([^"]+)"[^>]*>',s) if m[1] in {'652:1009','880:2557','942:967'}]
 for m in reversed(starts):
  count=1;end=None
  for t in re.finditer(r'</?div\b[^>]*>',s[m.end():]):
   count+=-1 if t[0].startswith('</') else 1
   if count==0:end=m.end()+t.end();break
  if end:s=s[:m.start()]+'<img class="exact-logo" src="assets/figma/logo.svg" alt="LOCO"/>'+s[end:]
 if name=='profile':
  # Never ship original contact/address/payment specimen values in the public repo.
  for old,new in [('Vanessa Cirillo','Utente demo'),('Vanessa','Utente'),('Cirillo','Demo'),('Vanny2407','loco-demo'),('cirivane@gmail.com','demo@example.com'),('Via Morozzo 13','—'),('5545 2575 3575 9013','•••• •••• •••• ••••'),('10141','—'),('Coscia','—'),('01/27','—')]:s=s.replace(old,new)
 s=re.sub(r'<(div|span|p|a)([^>]*)/\s*>',r'<\1\2></\1>',s)
 s=re.sub(r'(?<=>)([^<]+)(?=<)',lambda m:' '.join(line.strip() for line in m[1].splitlines() if line.strip()) if '\n' in m[1] else m[1],s)
 views[name]=s.strip()
(P/'figma-views.mjs').write_text('// Generated from verified Figma design contexts. Rebuild: python3 scripts/build-figma-views.py\nexport const views = '+json.dumps(views,ensure_ascii=False)+';\n')
(P/'figma-layout.css').write_text('\n'.join('.'+n+'{'+style+'}' for n,style in css.values())+'\n')
print('Views:',len(views),'CSS rules:',len(css),'Unsupported:',sorted(unknown))
